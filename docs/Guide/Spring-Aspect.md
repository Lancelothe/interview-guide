## 前言

需要给一个内部的调用地方加Metrics监控，但是不想像以前一样定义个监控的name，然后在需要监控的地方手动加Metrics.Timer这种修改原代码的且看起来不友好不规整的东西，所以想到用AOP切面在方法执行前后自动计算耗时执行Metrics的监控操作，不影响原有业务逻辑。

## Spring  Aspect的Execution表达式用法说明

[Spring Aspect的Execution表达式用法说明\_dreamer23的专栏\-CSDN博客\_execution用法](https://blog.csdn.net/dreamer23/article/details/83859953)

[spring aop中pointcut表达式完整版 \- 路人甲Java \- 博客园](https://www.cnblogs.com/itsoku123/p/10744244.html)



注意：注解@annotation里的名称要和 方法参数里MetricsMonitor类型的变量名metricsMonitor一致。
[SpringAop操作过程中注解作为参数传入增强方法增强方法的注解出错Unbound pointcut parameter auditable less\_xiaobailx的博客\-CSDN博客\_unbound pointcut parameter](https://blog.csdn.net/xiaobailx/article/details/103311714)

示例代码：

```java
@Component
@Aspect
public class MetricsMonitorAspect {

    @Around("execution(* com.demo.*.*(..)) && @annotation(metricsMonitor)")
    public Object around(ProceedingJoinPoint joinPoint, MetricsMonitor metricsMonitor) throws Throwable {
        String target = metricsMonitor.value();
        Object[] args = joinPoint.getArgs();

        if (StringUtils.isBlank(target)) {
            return joinPoint.proceed();
        }

        Timer timer = XueqiuMetrics.getInstance().timer(target);
        Timer.Context context = timer.time();
        try {
            return joinPoint.proceed(args);
        } finally {
            context.stop();
        }
    }
}
```

```java
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface MetricsMonitor {
    String value();
}
```

#### Metrics的Timer统计使用

[metrics的timer功能在java项目中的使用方法\_逍遥子曰：\-CSDN博客\_metrics\.timer](https://blog.csdn.net/houjixin/article/details/41957733?utm_source=blogxgwz8)

[Java 代码运行洞察库 Metrics\_关于代码的那点事儿\.\.\.\-CSDN博客\_metricregistry\.register](https://blog.csdn.net/wzygis/article/details/52789105?utm_source=blogxgwz1)

## Spring Aop无法拦截类内部的方法调用

### 外部调用，AOP正常：

```java
@Service
public class DemoServiceImpl implements DemoService {
    @Override
    public void methodDemoA(){
        System.out.println("this is method A");
    }

    @Override
    @MetricsMonitor("demo")
    public void methodDemoB() {
        System.out.println("this is method B");
    }
}
```

```java
		@Autowired
    DemoService demoService;
    @Test
    public void testMethod(){
        demoService.methodDemoA();
        demoService.methodDemoB();
    }
```

### 方法嵌套，AOP不生效：

```java
@Service
public class DemoServiceImpl implements DemoService {
    @Override
    public void methodDemoA(){
        System.out.println("this is method A");
        methodDemoB();
    }

    @Override
    @DemoAnno
    public void methodDemoB() {
        System.out.println("this is method B");
    }
}
```

```java
		@Autowired
    DemoService demoService;
    @Test
    public void testMethod(){
        demoService.methodDemoA();
        //demoService.methodDemoB();
    }
```

### 原因分析

场景1中，通过外部调用方法B，是由于spring在启动时，根据切面类及注解，生成了DemoService的代理类，在调用方法B时，实际上是代理类先对目标方法进行了业务增强处理（执行切面类中的业务逻辑），然后再调用方法B本身。所以场景1可以正常进入切面方法；
下图断点时可以看到demoService对象，是一个cglib的代理对象。

场景2中，通过外部调用的是方法A，虽然spring也会创建一个cglib的代理类去调用方法A，但当方法A调用方法B的时候，属于类里面的内部调用，使用的是实例对象本身去去调用方法B，非aop的cglib代理对象调用，方法B自然就不会进入到切面方法了。

方法 A 被调用，是基于 AOP 生成的 **代理对象** 进行的调用；方法 B 调用方法 A ，是 this **目标对象** 直接调用，并不是代理对象进行调用

![spring-aop-process](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/spring-aop-process.png)

### 解决方案

对于场景2，我们在业务开发过程中经常会碰到，但我们期望的是，方法A在调用方法B的时候，仍然能够进入切面方法，即需要AOP切面生效。
这种情况下，我们在调用方法B的时候，需要使用AopContext.currentProxy()获取当前的代理对象，然后使用代理对象调用方法B。

> 1. 需要开启exposeProxy=true的配置，springboot项目中，可以在启动类上面，添加 @EnableAspectJAutoProxy(exposeProxy = true,proxyTargetClass = true) 注解。
> 2. UserServiceImpl service = AopContext.currentProxy() != null ? (UserService)AopContext.currentProxy() : this;

```java
@Service
public class DemoServiceImpl implements DemoService {
    @Override
    public void methodDemoA(){
        System.out.println("this is method A");
        DemoService service = (DemoService) AopContext.currentProxy();
        service.methodDemoB();
    }

    @Override
    @DemoAnno
    public void methodDemoB() {
        System.out.println("this is method B");
    }
}

		// 测试类
		@Autowired
    DemoService demoService;
    @Test
    public void testMethod(){
        demoService.methodDemoA();
        //demoService.methodDemoB();
    }
```

[spring aop内部方法调用无效修改 \- 简书](https://www.jianshu.com/p/a3ef421de403)

[同类中嵌套AOP\-\-注解事物在同一类中嵌套调用不生效 \- vi\-2525 \- 博客园](https://www.cnblogs.com/vi-2525/p/8761544.html)

[Spring AOP：内部调用陷阱 \| 硬核技术](https://zhewuzhou.github.io/2018/09/01/Spring_AOP_Trap/)

[Spring AOP 方法内部调用不生效\_菜鸟日常\-CSDN博客](https://blog.csdn.net/u013151053/article/details/106124048)



参考：
https://www.jianshu.com/p/9517c90db0d4
https://www.codercto.com/a/11198.html
https://www.cnblogs.com/iwenwen/p/10983265.html
https://blog.csdn.net/runoob12/article/details/103992592
https://juejin.im/post/5a41019551882572ed55d1e6
https://blog.csdn.net/weixin_34241036/article/details/88004410