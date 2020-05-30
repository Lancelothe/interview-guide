# Metrics

### Metrics的基本工具

`Metrics`提供了五个基本的度量类型：

1. Gauges（度量）—— 缓存Size的value和delta值监控
2. Counters（计数器）
3. Histograms（直方图数据）
4. Meters（TPS计算器）
5. Timers（计时器）—— 执行时间监控



`Metrics`中`MetricRegistry`是中心容器，它是程序中所有度量的容器，所有新的度量工具都要注册到一个`MetricRegistry`实例中才可以使用，尽量在一个应用中保持让这个`MetricRegistry`实例保持单例。

#### MetricRegistry 容器

在代码中配置好这个`MetricRegistry`容器：

```java
@Bean
public MetricRegistry metrics() {
    return new MetricRegistry();
}
```

#### Meters TPS计算器

`TPS计算器`这个名称并不准确，`Meters`工具会帮助我们统计系统中某一个事件的速率。比如每秒请求数（TPS），每秒查询数（QPS）等等。这个指标能反应系统当前的处理能力，帮助我们判断资源是否已经不足。`Meters`本身是一个自增计数器。

通过`MetricRegistry`可以获得一个`Meter`：



```java
@Bean
public Meter requestMeter(MetricRegistry metrics) {
    return metrics.meter("request");
}
```

在请求中调用`mark()`方法，来增加计数，我们可以在不同的请求中添加不同的`Meter`，针对自己的系统完成定制的监控需求。



```java
@RequestMapping("/hello")
@ResponseBody
public String helloWorld() {
    requestMeter.mark();
    return "Hello World";
}
```

应用运行的过程中，在console中反馈的信息：



```swift
-- Meters ----------------------------------------------------------------------
request
             count = 21055
         mean rate = 133.35 events/second
     1-minute rate = 121.66 events/second
     5-minute rate = 36.99 events/second
    15-minute rate = 13.33 events/second
```

从以上信息中可以看出`Meter`可以为我们提供平均速率，以及采样后的1分钟，5分钟，15分钟的速率。

#### Histogram 直方图数据

直方图是一种非常常见的统计图表，`Metrics`通过这个`Histogram`这个度量类型提供了一些方便实时绘制直方图的**数据**。

和之前的`Meter`相同，我们可以通过`MetricRegistry`来获得一个`Histogram`。



```java
@Bean
public Histogram responseSizes(MetricRegistry metrics) {
    return metrics.histogram("response-sizes");
}
```

在应用中，需要统计的位置调用`Histogram`的`update()`方法。



```css
responseSizes.update(new Random().nextInt(10));
```

比如我们需要统计某个方法的网络流量，通过`Histogram`就非常的方便。

在console中`Histogram`反馈的信息：



```jsx
-- Histograms ------------------------------------------------------------------
response-sizes
             count = 21051
               min = 0
               max = 9
              mean = 4.55
            stddev = 2.88
            median = 4.00
              75% <= 7.00
              95% <= 9.00
              98% <= 9.00
              99% <= 9.00
            99.9% <= 9.00
```

`Histogram`为我们提供了最大值，最小值和平均值等数据，利用这些数据，我们就可以开始绘制自定义的直方图了。

#### Counter 计数器

`Counter`的本质就是一个`AtomicLong`实例，可以增加或者减少值，可以用它来统计队列中Job的总数。

通过`MetricRegistry`也可以获得一个`Counter`实例。



```java
@Bean
public Counter pendingJobs(MetricRegistry metrics) {
    return metrics.counter("requestCount");
}
```

在需要统计数据的位置调用`inc()`和`dec()`方法。



```cpp
// 增加计数
pendingJobs.inc();
// 减去计数
pendingJobs.dec();
```

console的输出非常简单：



```swift
-- Counters --------------------------------------------------------------------
requestCount
             count = 21051
```

只是输出了当前度量的值。

#### Timer 计时器

`Timer`是一个`Meter`和`Histogram`的组合。这个度量单位可以比较方便地统计请求的速率和处理时间。对于接口中调用的延迟等信息的统计就比较方便了。如果发现一个方法的`RPS（请求速率）`很低，而且平均的处理时间**很长**，那么这个方法八成出问题了。

同样，通过`MetricRegistry`获取一个`Timer`的实例：



```java
@Bean
public Timer responses(MetricRegistry metrics) {
    return metrics.timer("executeTime");
}
```

在需要统计信息的位置使用这样的代码：



```java
final Timer.Context context = responses.time();
try {
    // handle request
} finally {
    context.stop();
}
```

console中就会实时返回这个`Timer`的信息：



```jsx
-- Timers ----------------------------------------------------------------------
executeTime
             count = 21061
         mean rate = 133.39 calls/second
     1-minute rate = 122.22 calls/second
     5-minute rate = 37.11 calls/second
    15-minute rate = 13.37 calls/second
               min = 0.00 milliseconds
               max = 0.01 milliseconds
              mean = 0.00 milliseconds
            stddev = 0.00 milliseconds
            median = 0.00 milliseconds
              75% <= 0.00 milliseconds
              95% <= 0.00 milliseconds
              98% <= 0.00 milliseconds
              99% <= 0.00 milliseconds
            99.9% <= 0.01 milliseconds
```

#### Gauges 度量

除了`Metrics`提供的几个度量类型，我们可以通过`Gauges`完成自定义的度量类型。比方说很简单的，我们想看我们缓存里面的数据大小，就可以自己定义一个`Gauges`。



```java
metrics.register(
                MetricRegistry.name(ListManager.class, "cache", "size"),
                (Gauge<Integer>) () -> cache.size()
        );
```

这样`Metrics`就会一直监控`Cache`的大小。

除此之外有时候，我们需要计算自己定义的一直单位，比如消息队列里面**消费者(consumers)**消费的**速率**和**生产者(producers)**的生产**速率**的比例，这也是一个度量。



```java
public class CompareRatio extends RatioGauge {

    private final Meter consumers;
    private final Meter producers;

    public CacheHitRatio(Meter consumers, Meter producers) {
        this.consumers = consumers;
        this.producers = producers;
    }

    @Override
    protected Ratio getRatio() {
        return Ratio.of(consumers.getOneMinuteRate(),
                producers.getOneMinuteRate());
    }
}
```

把这个类也注册到`Metrics`容器里面：



```java
@Bean
public CompareRatio cacheHitRatio(MetricRegistry metrics, Meter requestMeter, Meter producers) {

    CompareRatio compareRatio = new CompareRatio(consumers, producers);

    metrics.register("生产者消费者比率", compareRatio);

    return cacheHitRatio;
}
```

### Reporter 报表

`Metrics`通过报表，将采集的数据展现到不同的位置,这里比如我们注册一个`ConsoleReporter`到`MetricRegistry`中，那么console中就会打印出对应的信息。

```css
@Bean
public ConsoleReporter consoleReporter(MetricRegistry metrics) {
    return ConsoleReporter.forRegistry(metrics)
            .convertRatesTo(TimeUnit.SECONDS)
            .convertDurationsTo(TimeUnit.MILLISECONDS)
            .build();
}
```

除此之外`Metrics`还支持`JMX`、`HTTP`、`Slf4j`等等，可以访问 [http://metrics.dropwizard.io/3.1.0/manual/core/#reporters](https://link.jianshu.com?t=http://metrics.dropwizard.io/3.1.0/manual/core/#reporters) 来查看`Metrics`提供的报表，如果还是不能满足自己的业务，也可以自己继承`Metrics`提供的`ScheduledReporter`类完成自定义的报表类。



参考：

[Metrics教程 \- 简书](https://www.jianshu.com/p/effe8e259d25)

[Metrics使用简介\_Java\_end's coding life\-CSDN博客](https://blog.csdn.net/endlu/article/details/80162705)

[应用监控Metrics \- HackerVirus \- 博客园](https://www.cnblogs.com/Leo_wl/p/8506377.html)