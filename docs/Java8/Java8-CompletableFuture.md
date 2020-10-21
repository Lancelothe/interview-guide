## 什么是Future 接口

很多场景下，我们想去获取线程运行的结果，而通常使用execute方法去提交任务是无法获得结果的，这时候我们常常会改用submit方法去提交，以便获得线程运行的结果。

而submit方法返回的就是Future，一个未来对象。 使用future.get() 方法去获取线程执行结果，包括如果出现异常，也会随get方法抛出。

Java 1.5开始，提供了Callable和Future，通过它们可以在任务执行完毕之后得到任务执行结果。

Future接口可以构建异步应用，是多线程开发中常见的设计模式。

当我们需要调用一个函数方法时。如果这个函数执行很慢,那么我们就要进行等待。但有时候,我们可能并不急着要结果。

因此,我们可以让被调用者立即返回,让他在后台慢慢处理这个请求。对于调用者来说,则可以先处理一些其他任务,在真正需要数据的场合再去尝试获取需要的数据。

 

## Future 接口的缺陷

当我们使用future.get()方法去取得线程执行结果时，要知道get方法是阻塞的，也就是说为了拿到结果，当主线程执行到get()方法，当前线程会去等待异步任务执行完成，

换言之，异步的效果在我们使用get()拿结果时，会变得无效。示例如下

```
public static void main(String[] args) throws Exception{
        ExecutorService executorService = Executors.newSingleThreadExecutor();
        Future future = executorService.submit(()->{
            try {
                Thread.sleep(3000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println("异步任务执行了");
        });
        future.get();

        System.out.println("主线任务执行了");
    }
```

打印结果是：异步任务执行了过后主线任务才执行。 就是因为get()在一直等待。

那么如何解决我想要拿到结果，可以对结果进行处理，又不想被阻塞呢？

Future很难直接表述多个Future 结果之间的依赖性，开发中，我们经常需要达成以下目的：

- 将两个异步计算合并为一个（这两个异步计算之间相互独立，同时第二个又依赖于第一个的结果）
- 等待 Future 集合中的所有任务都完成。
- 仅等待 Future 集合中最快结束的任务完成，并返回它的结果。

## CompletableFuture 使一切变得可能

在Java8中，CompletableFuture提供了非常强大的Future的扩展功能，可以帮助我们简化异步编程的复杂性，并且提供了函数式编程的能力，可以通过回调的方式处理计算结果，也提供了转换和组合 CompletableFuture 的方法。

它可能代表一个明确完成的Future，也有可能代表一个完成阶段（ CompletionStage ），它支持在计算完成以后触发一些函数或执行某些动作。

CompletionStage代表异步计算过程中的某一个阶段，一个阶段完成以后可能会触发另外一个阶段，一个阶段的计算执行可以是一个Function，Consumer或者Runnable。比如：stage.thenApply(x -> square(x)).thenAccept(x -> System.out.print(x)).thenRun(() -> System.out.println())。

JDK1.8才新加入的一个实现类`CompletableFuture`，实现了`Future`, `CompletionStage`两个接口。

```java
public class CompletableFuture implements Future, CompletionStage 
```

实际开发中，我们常常面对如下的几种场景：

1. 针对Future的完成事件，不想简单的阻塞等待，在这段时间内，我们希望可以正常继续往下执行，所以在它完成时，我们可以收到回调即可。

2. 面对Future集合来讲，这其中的每个Future结果其实很难去描述它们之间的依赖关系，而往往我们希望等待所有的Future集合都完成，然后做一些事情。

3. 在异步计算中，两个计算任务相互独立，但是任务二又依赖于任务一的结果。

如上的几种场景，单靠Future是解决不了的，而CompletableFuture则可以帮我们实现。



## CompletableFuture 常见api 介绍

`getNow`有点特殊，如果结果已经计算完则返回结果或者抛出异常，否则返回给定的valueIfAbsent值。

`join()`与`get()`区别在于`join()`返回计算的结果或者抛出一个unchecked异常(CompletionException)，而`get()`返回一个具体的异常.

### 1、 runAsync 和 supplyAsync方法

 它提供了四个方法来创建一个异步任务

```
public static CompletableFuture<Void> runAsync(Runnable runnable)
public static CompletableFuture<Void> runAsync(Runnable runnable, Executor executor)
public static <U> CompletableFuture<U> supplyAsync(Supplier<U> supplier)
public static <U> CompletableFuture<U> supplyAsync(Supplier<U> supplier, Executor executor)
```

 

runAsync类似于execute方法，不支持返回值，而supplyAsync方法类似submit方法，支持返回值。也是我们的重点方法。

没有指定Executor的方法会使用ForkJoinPool.commonPool() 作为它的线程池执行异步代码。

示例：

```java
		//无返回值
    CompletableFuture<Void> future1 = CompletableFuture.runAsync(() -> {
        System.out.println("runAsync无返回值");
    });

    future1.get();

    //有返回值
    CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> {
        System.out.println("supplyAsync有返回值");
        return "111";
    });

    String s = future2.get();
```



前面提到的几种使用方法是使用异步编程最简单的步骤，CompletableFuture.get()的方法会阻塞直到任务完成，这其实还是同步的概念，这对于一个异步系统是不够的，因为真正的异步是需要支持回调函数，这样以来，我们就可以直接在某个任务干完之后，接着执行回调里面的函数，从而做到真正的异步概念。

















### JDK9 CompletableFuture 类增强的主要内容

（1）支持对异步方法的超时调用

```javascript
orTimeout()
completeOnTimeout()
```

（2）支持延迟调用

```javascript
Executor delayedExecutor(long delay, TimeUnit unit, Executor executor)
Executor delayedExecutor(long delay, TimeUnit unit)
```

详细内容，可以参考Oracle官网文档，这里不再过多介绍。





参考

[Java并发编程系列一：Future和CompletableFuture解析与使用 \- 刘志鹏的Blog \- 博客园](https://www.cnblogs.com/happyliu/p/9462703.html)



[JDK1\.8新特性CompletableFuture总结\_finalheart的博客\-CSDN博客\_completablefuture](https://blog.csdn.net/finalheart/article/details/87615546)

[CompletableFuture：让你的代码免受阻塞之苦 \- 知乎](https://zhuanlan.zhihu.com/p/101716685)

[2 Java8对于多线程并发的一些新支持\-CompletableFuture\_tianyaleixiaowu的专栏\-CSDN博客\_java8 多线程编程](https://blog.csdn.net/tianyaleixiaowu/article/details/79976428)

[Java8的CompletableFuture详解\_weixin\_34119545的博客\-CSDN博客\_java8 completablefuture详解](https://blog.csdn.net/weixin_34119545/article/details/92052390)

[java8 之CompletableFuture \-\- 如何构建异步应用 \- 半城枫叶半城雨丶 \- 博客园](https://www.cnblogs.com/xinde123/p/10928091.html)

[理解Java8里面CompletableFuture异步编程 \- 云\+社区 \- 腾讯云](https://cloud.tencent.com/developer/article/1366581)

[JDK8新特性之CompletableFuture详解 \- 简书](https://www.jianshu.com/p/547d2d7761db)