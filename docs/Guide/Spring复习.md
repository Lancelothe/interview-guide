## 	Spring Bean的作用域

1. singleton——唯一 bean 实例

2. prototype——每次请求都会创建一个新的 bean 实例
3. request——每一次HTTP请求都会产生一个新的bean，该bean仅在当前HTTP request内有效
4. session——每一次HTTP请求都会产生一个新的 bean，该bean仅在当前 HTTP session 内有效
5. globalSession——作用域类似于标准的 HTTP session 作用域，不过仅仅在基于 portlet 的 web 应用中才有意义。

## Spring Bean的生命周期

四大阶段：

- 实例化
- 属性赋值
- 初始化
- 销毁

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/20200215174646.png)

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/20200215175014.png)

> PostConstruct `(P)`，afterPropertiesSet `(A)`，init-method `(I)` ---> `PAI （圆周率π）`

InstantiationAwareBeanPostProcessor又代表了Spring的另外一段生命周期：实例化。
先区别一下Spring Bean的实例化和初始化两个阶段的主要作用：

1、实例化----实例化的过程是一个创建Bean的过程，即调用Bean的构造函数，单例的Bean放入单例池中

2、初始化----初始化的过程是一个赋值的过程，即调用Bean的setter，设置Bean的属性

InstantiationAwareBeanPostProcessor作用的是Bean实例化前后，即：

1、Bean构造出来之前调用postProcessBeforeInstantiation()方法

2、Bean构造出来之后调用postProcessAfterInstantiation()方法

不过通常来讲，我们不会直接实现InstantiationAwareBeanPostProcessor接口，而是会采用继承InstantiationAwareBeanPostProcessorAdapter这个抽象类的方式来使用。

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/20200215174851.png)

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/20200215175103.png)

**如果 bean 的 scope 设为prototype时，当容器关闭时，`destroy` 方法不会被调用。对于 prototype 作用域的 bean，有一点非常重要，那就是 Spring不能对一个 prototype bean 的整个生命周期负责：容器在初始化、配置、装饰或者是装配完一个prototype实例后，将它交给客户端，随后就对该prototype实例不闻不问了。** 不管何种作用域，容器都会调用所有对象的初始化生命周期回调方法。但对prototype而言，任何配置好的析构生命周期回调方法都将不会被调用。**清除prototype作用域的对象并释放任何prototype bean所持有的昂贵资源，都是客户端代码的职责**（让Spring容器释放被prototype作用域bean占用资源的一种可行方式是，通过使用bean的后置处理器，该处理器持有要被清除的bean的引用）。谈及prototype作用域的bean时，在某些方面你可以将Spring容器的角色看作是Java new操作的替代者，任何迟于该时间点的生命周期事宜都得交由客户端来处理。

[JavaGuide](https://snailclimb.gitee.io/javaguide/#/docs/system-design/framework/spring/SpringBean)

[Spring Bean的生命周期（非常详细） \- shoshana~ \- 博客园](https://www.cnblogs.com/shoshana-kong/p/10692924.html)

[Spring Bean生命周期\-阶段汇总，面试必备\(十二\) \- 简书](https://www.jianshu.com/p/be38b73fe690)

[请别再问Spring Bean的生命周期了！ \- 简书](https://www.jianshu.com/p/1dec08d290c1)

[Spring Bean 生命周期之“我从哪里来？” 懂得这个很重要 \- 个人文章 \- SegmentFault 思否](https://segmentfault.com/a/1190000019671074)

[Spring解析，加载及实例化Bean的顺序（零配置）\_点滴之积\-CSDN博客\_spring 加载顺序](https://blog.csdn.net/qq_27529917/article/details/79329809)

[Spring\-bean的循环依赖以及解决方式\_Java\_惜暮\-CSDN博客](https://blog.csdn.net/u010853261/article/details/77940767?utm_source=distribute.pc_relevant.none-task)

[Springboot循环依赖如何解决\_Java\_二十\-CSDN博客](https://blog.csdn.net/qq_18298439/article/details/88818418)

[spring处理对象相互依赖注入的问题\_Java\_w1lgy的博客\-CSDN博客](https://blog.csdn.net/w1lgy/article/details/81086171)



---

## Spring 事务实现原理（AOP）

### 划分处理单元 IOC

由于 Spring 解决的问题是对单个数据库进行局部事务处理的，具体的实现首相用 Spring 中的 IOC 划分了事务处理单元。并且将对事务的各种配置放到了 IOC 容器中（设置事务管理器，设置事务的传播特性及隔离机制）。

### AOP 拦截需要进行事务处理的类

Spring 事务处理模块是通过 AOP 功能来实现声明式事务处理的，具体操作（比如事务实行的配置和读取，事务对象的抽象），用 `TransactionProxyFactoryBean` 接口来使用 AOP 功能，生成 proxy 代理对象，通过 `TransactionInterceptor` 完成对代理方法的拦截，将事务处理的功能编织到拦截的方法中。读取 IOC 容器事务配置属性，转化为 Spring 事务处理需要的内部数据结构（`TransactionAttributeSourceAdvisor`），转化为 `TransactionAttribute` 表示的数据对象。

### 对事物处理实现（事务的生成、提交、回滚、挂起）

Spring 委托给具体的事务处理器实现。实现了一个抽象和适配。适配的具体事务处理器：DataSource 数据源支持、Hibernate 数据源事务处理支持、JDO 数据源事务处理支持，JPA、JTA 数据源事务处理支持。这些支持都是通过设计 `PlatformTransactionManager`、`AbstractPlatforTransaction` 一系列事务处理的支持。 为常用数据源支持提供了一系列的 `TransactionManager`。

[Spring事务原理完全解析 \| 码农网](https://www.codercto.com/a/60914.html)

---





## Spring IOC、Spring AOP原理

### [IoC](https://snailclimb.gitee.io/javaguide/#/docs/system-design/framework/spring/SpringInterviewQuestions?id=ioc)

IoC（Inverse of Control:控制反转）是一种**设计思想**，就是 **将原本在程序中手动创建对象的控制权，交由Spring框架来管理。** IoC 在其他语言中也有应用，并非 Spirng 特有。 **IoC 容器是 Spring 用来实现 IoC 的载体， IoC 容器实际上就是个Map（key，value）,Map 中存放的是各种对象。**

将对象之间的相互依赖关系交给 IoC 容器来管理，并由 IoC 容器完成对象的注入。这样可以很大程度上简化应用的开发，把应用从复杂的依赖关系中解放出来。 **IoC 容器就像是一个工厂一样，当我们需要创建一个对象的时候，只需要配置好配置文件/注解即可，完全不用考虑对象是如何被创建出来的。** 在实际项目中一个 Service 类可能有几百甚至上千个类作为它的底层，假如我们需要实例化这个 Service，你可能要每次都要搞清这个 Service 所有底层类的构造函数，这可能会把人逼疯。如果利用 IoC 的话，你只需要配置好，然后在需要的地方引用就行了，这大大增加了项目的可维护性且降低了开发难度。

Spring 时代我们一般通过 XML 文件来配置 Bean，后来开发人员觉得 XML 文件来配置不太好，于是 SpringBoot 注解配置就慢慢开始流行起来。

推荐阅读：https://www.zhihu.com/question/23277575/answer/169698662

**Spring IoC的初始化过程：**

![SpringIOC初始化过程](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/SpringIOC初始化过程.png)

IoC源码阅读

- https://javadoop.com/post/spring-ioc

**IOC VS DI**

> IOC，控制反转；DI，依赖注入；
>
> **只有把对象交给Spring，才能由Spring帮助完成属性设置；因此，依赖注入不能单独存在，需要在IOC基础之上完成操作。**

### [AOP](https://snailclimb.gitee.io/javaguide/#/docs/system-design/framework/spring/SpringInterviewQuestions?id=aop)

AOP(Aspect-Oriented Programming:面向切面编程)能够将那些与业务无关，**却为业务模块所共同调用的逻辑或责任（例如事务处理、日志管理、权限控制等）封装起来**，便于**减少系统的重复代码**，**降低模块间的耦合度**，并**有利于未来的可拓展性和可维护性**。

**Spring AOP就是基于动态代理的**，如果要代理的对象，实现了某个接口，那么Spring AOP会使用**JDK Proxy**，去创建代理对象，而对于没有实现接口的对象，就无法使用 JDK Proxy 去进行代理了，这时候Spring AOP会使用**Cglib** ，这时候Spring AOP会使用 **Cglib** 生成一个被代理对象的子类来作为代理。

[Spring AOP分析\(1\) \-\- 基本概念 \| YGingko's Blog](http://blog.ygingko.top/2017/08/25/spring-aop-source-1/)

[Spring AOP分析\(2\) \-\- JdkDynamicAopProxy实现AOP \| YGingko's Blog](http://blog.ygingko.top/2017/09/19/spring-aop-source-2/)

[Spring AOP分析\(3\) \-\- CglibAopProxy实现AOP \| YGingko's Blog](http://blog.ygingko.top/2017/09/30/spring-aop-source-3/)

### Spring Aop和AspecJ Aop有什么区别吗？

[按住Citrl/Command点击跳转](####Spring AOP 和 AspectJ AOP 有什么区别?)

## Spring IOC依赖注入的方式

Spring依赖注入的方式主要有四个

- 基于注解注入方式
- set注入方式
- 构造器注入方式
- 静态工厂注入方式。

推荐使用基于注解注入方式，配置较少，比较方便。

## Spring IOC怎么解决循环依赖

三级缓存，必须在实例化之后，刷新了singletonFactories。

这三级缓存分别指：
singletonFactories ： 单例对象工厂的cache
earlySingletonObjects ：提前曝光的单例对象的Cache
singletonObjects：单例对象的cache

让我们来分析一下“A的某个field或者setter依赖了B的实例对象，同时B的某个field或者setter依赖了A的实例对象”这种循环依赖的情况。A首先完成了初始化的第一步，并且将自己提前曝光到singletonFactories中，此时进行初始化的第二步，发现自己依赖对象B，此时就尝试去get(B)，发现B还没有被create，所以走create流程，B在初始化第一步的时候发现自己依赖了对象A，于是尝试get(A)，尝试一级缓存singletonObjects(肯定没有，因为A还没初始化完全)，尝试二级缓存earlySingletonObjects（也没有），尝试三级缓存singletonFactories，由于A通过ObjectFactory将自己提前曝光了，所以B能够通过ObjectFactory.getObject拿到A对象(虽然A还没有初始化完全，但是总比没有好呀)，B拿到A对象后顺利完成了初始化阶段1、2、3，完全初始化之后将自己放入到一级缓存singletonObjects中。此时返回A中，A此时能拿到B的对象顺利完成自己的初始化阶段2、3，最终A也完成了初始化，进去了一级缓存singletonObjects中，而且更加幸运的是，由于B拿到了A的对象引用，所以B现在hold住的A对象完成了初始化。

知道了这个原理时候，肯定就知道为啥Spring不能解决“A的构造方法中依赖了B的实例对象，同时B的构造方法中依赖了A的实例对象”这类问题了！因为加入singletonFactories三级缓存的前提是执行了构造器，所以构造器的循环依赖没法解决。

[Spring\-bean的循环依赖以及解决方式\_Java\_惜暮\-CSDN博客](https://blog.csdn.net/u010853261/article/details/77940767)

[Spring IOC 容器源码分析 \- 循环依赖的解决办法 \- 个人文章 \- SegmentFault 思否](https://segmentfault.com/a/1190000015221968)

[面试中被问Spring循环依赖的三种方式！！！ \- JaJian \- 博客园](https://www.cnblogs.com/jajian/p/10241932.html)

[【死磕 Spring】\- IOC 之循环依赖处理 \- Java 技术驿站\-Java 技术驿站](http://cmsblogs.com/?p=2887)

## IOC容器的加载过程

简单概括：

1. 刷新预处理

2. 将配置信息解析，注册到BeanFactory

3. 设置bean的类加载器

4. 如果有第三方想在bean加载注册完成后，初始化前做点什么(例如修改属性的值，修改bean的scope为单例或者多例。)，提供了相应的模板方法，后面还调用了这个方法的实现，并且把这些个实现类注册到对应的容器中

5. 初始化当前的事件广播器

6. 初始化所有的bean

7. 广播applicationcontext初始化完成。

   ```java
   //来自于AbstractApplicationContext
   public void refresh() throws BeansException, IllegalStateException {
      //进行加锁处理
      synchronized (this.startupShutdownMonitor) {
          // 进行刷新容器的准备工作，比如设定容器开启时间，标记容器已启动状态等等
          prepareRefresh();
   
          // 让子类来刷新创建容器
          // 这步比较关键，这步完成后，配置文件就会解析成一个个 Bean 定义，注册到 BeanFactory 中，
          // 当然，这里说的 Bean 还没有初始化，只是配置信息都提取出来了，
          // 注册也只是将这些信息都保存到了注册中心(说到底核心是一个 beanName-> beanDefinition 的 map)
          ConfigurableListableBeanFactory beanFactory = obtainFreshBeanFactory();
   
          // 设置 BeanFactory 的类加载器，添加几个 BeanPostProcessor，手动注册几个特殊的 bean
          prepareBeanFactory(beanFactory);
   
          try {
              // 这里需要知道 BeanFactoryPostProcessor 这个知识点，
              //Bean 如果实现了此接口，那么在容器初始化以后，Spring 会负责调用里面的 postProcessBeanFactory 方法。
              // 这里是提供给子类的扩展点，到这里的时候，所有的 Bean 都加载、注册完成了，但是都还没有初始化
              // 具体的子类可以在这步的时候添加一些特殊的 BeanFactoryPostProcessor 的实现类或做点什么事
              postProcessBeanFactory(beanFactory);
   
              // 调用 BeanFactoryPostProcessor 各个实现类的 postProcessBeanFactory(factory) 方法
              invokeBeanFactoryPostProcessors(beanFactory);
   
              // 注册 BeanPostProcessor 的实现类，注意看和 BeanFactoryPostProcessor 的区别
              // 此接口两个方法: postProcessBeforeInitialization 和 postProcessAfterInitialization
              // 两个方法分别在 Bean 初始化之前和初始化之后得到执行。注意，到这里 Bean 还没初始化
              registerBeanPostProcessors(beanFactory);
   
              // 初始化当前 ApplicationContext 的 MessageSource
              initMessageSource();
   
              // 初始化当前 ApplicationContext 的事件广播器
              initApplicationEventMulticaster();
   
              // 从方法名就可以知道，典型的模板方法(钩子方法)，
              // 具体的子类可以在这里初始化一些特殊的 Bean（在初始化 singleton beans 之前）
              onRefresh();
   
              // 注册事件监听器，监听器需要实现 ApplicationListener 接口
              registerListeners();
   
              // 初始化所有的 singleton beans（lazy-init 的除外）
              // 重点方法将会在下一个章节进行说明
              finishBeanFactoryInitialization(beanFactory);
   
              // 最后，广播事件，ApplicationContext 初始化完成
              finishRefresh();
              }
              catch (BeansException ex) {
                  if (logger.isWarnEnabled()) {
                      logger.warn("Exception encountered during context initialization - cancelling refresh attempt: " + ex);
                  }
                      // 销毁已经初始化的 singleton 的 Beans，以免有些 bean 会一直占用资源
                      destroyBeans();
   
                      // Reset 'active' flag.
                      cancelRefresh(ex);
   
                      // 把异常往外抛
                      throw ex;
                }
                finally {
                  // Reset common introspection caches in Spring's core, since we
                  // might not ever need metadata for singleton beans anymore...
                  resetCommonCaches();
                }
        }
   }
   ```

   

## IOC容器是怎么工作的

1. Bean的概念：Bean就是由Spring容器初始化、装配及管理的对象，除此之外，bean就与应用程序中的其他对象没什么区别了。
2. 元数据BeanDefinition：确定如何实例化Bean、管理bean之间的依赖关系以及管理bean，这就需要配置元数据，在spring中由BeanDefinition代表。

工作原理：

1. 准备配置文件：配置文件中声明Bean定义也就是为Bean配置元数据。
2. 由IOC容器进行解析元数据：IOC容器的Bean Reader读取并解析配置文件，根据定义生成BeanDefinition配置元数据对象，IOC容器根据BeanDefinition进行实例化、配置以及组装Bean。
3. 实例化IOC容器：由客户端实例化容器，获取需要的Bean。
    下面举个例子：

```java
@Test  
       public void testHelloWorld() {  
             //1、读取配置文件实例化一个IoC容器  
             ApplicationContext context = new ClassPathXmlApplicationContext("helloworld.xml");  
             //2、从容器中获取Bean，注意此处完全“面向接口编程，而不是面向实现”  
              HelloApi helloApi = context.getBean("hello", HelloApi.class);  
              //3、执行业务逻辑  
              helloApi.sayHello();  
       }
```

## 拦截器和过滤器的区别



## @Autowrite和@Resource的区别

@Autowired与@Resource都可以用来装配Bean，都可以写在字段、setter方法上。

1. @Autowired是spring自己定义的注解，@Resource是J2EE的，由JSR-250规范定义

2. @Autowired默认按类型进行自动装配（该注解属于Spring），默认情况下要求依赖对象必须存在，如果要允许为null，需设置required属性为false，例：@Autowired(required=false)。如果要使用名称进行装配，可以与@Qualifier注解一起使用。

    ```java
    @Autowired
    @Qualifier("adminService")
    private AdminService adminService;
    ```

    @Resource默认按照名称进行装配（该注解属于J2EE），名称可以通过name属性来指定。如果没有指定name属性，当注解写在字段上时，默认取字段名进行装配；如果注解写在setter方法上，默认取属性名进行装配。当找不到与名称相匹配的Bean时，会按照类型进行装配。但是，name属性一旦指定，就只会按照名称进行装配。

    ```java
    @Resource(name = "adminService")
    private AdminService adminService;
    ```

    @Autowired字段注入会产生警告，并且建议使用构造方法注入。而使用@Resource不会有警告。

3. 不建议使用字段注入和setter注入的方法，前者可能引起NullPointerException，后者不能将属性设置为final。从spring4开始官方一直推荐使用构造方法注入。但是构造方法注入只能使用@Autowired，不能使用@Resource。

综上，如果要字段注入，使用@Resource；要构造方法注入，使用@Autowired。其实实际开发中个人觉得没什么区别。

那么我们需要注意什么呢？

**如果@Autowired进行类型注入，很可能类型会有多个满足（多态）**，那么到底注入哪个呢？所以说，如果按照@Autowired类型注入，一定注意这点，结合@Qualifier。实际开发中，**显然，注入应该是确定的，那么按照名称注入，应该是首选！**

## @Component和@Bean的区别

1. 作用对象不同: `@Component` 注解作用于类，而`@Bean`注解作用于方法。
2. `@Component`通常是通过类路径扫描来自动侦测以及自动装配到Spring容器中（我们可以使用 `@ComponentScan` 注解定义要扫描的路径从中找出标识了需要装配的类自动装配到 Spring 的 bean 容器中）。`@Bean` 注解通常是我们在标有该注解的方法中定义产生这个 bean,`@Bean`告诉了Spring这是某个类的示例，当我需要用它的时候还给我。
3. `@Bean` 注解比 `Component` 注解的自定义性更强，而且很多地方我们只能通过 `@Bean` 注解来注册bean。比如当我们引用第三方库中的类需要装配到 `Spring`容器时，则只能通过 `@Bean`来实现。

## BeanFactory和ApplicationContext的区别

1. BeanFactory是spring中最基础的接口。它负责读取bean配置文档，管理bean的加载，实例化，维护bean之间的依赖关系，负责bean的生命周期。
2. ApplicationContext是BeanFactory的子接口，除了提供上述BeanFactory的所有功能外，还提供了更完整的框架功能：如国际化支持，资源访问，事件传递等。常用的获取ApplicationContext的方法： 2.1 FileSystemXmlApplicationContext：从文件系统或者url指定的xml配置文件创建，参数为配置文件名或者文件名数组。 2.2 ClassPathXmlApplicationContext：从classpath的xml配置文件创建，可以从jar包中读取配置文件 2.3 WebApplicationContextUtils：从web应用的根目录读取配置文件，需要先在web.xml中配置，可以配置监听器或者servlet来实现。
3. ApplicationContext的初始化和BeanFactory有一个重大区别：BeanFactory在初始化容器时，并未实例化Bean，直到第一次访问某个Bean时才实例化Bean；而ApplicationContext则在初始化应用上下文时就实例化所有的单例Bean，因此ApplicationContext的初始化时间会比BeanFactory稍长一些。

## BeanFactory和FactoryBean的区别

共同点：

​     都是接口

区别：

   BeanFactory 以Factory结尾，表示它是一个工厂类，用于管理Bean的一个工厂

​       在Spring中，所有的Bean都是由BeanFactory(也就是IOC容器)来进行管理的。

   但对FactoryBean而言，这个Bean不是简单的Bean，而是一个能生产或者修饰对象生成的工厂Bean,

​       它的实现与设计模式中的工厂模式和修饰器模式类似。

Spring中共有两种bean，一种为普通bean，另一种则为工厂bean（FactoryBean）。

BeanFactory给具体的IOC容器的实现提供了规范，实现 BeanFactory 接口的类 表明此类是一个工厂，作用就是配置、新建、管理 各种Bean。

另一个接口ApplicationContext接口，他是BeanFactory的派生。BeanFactorty接口提供了配置框架及基本功能，但是无法支持spring的aop功能和web应用。
 ApplicationContext支持aop web，因为他继承多种接口如 （1）国际化资源接口 （2）资源加载接口 （3）事件发布接口

[46、BeanFactory和FactoryBean的区别\_JAVA基础面试题在线听\_考试培训课程\-喜马拉雅FM](https://m.ximalaya.com/jiaoyu/16144846/104627173)

[spring中BeanFactory和FactoryBean的区别 \- bcombetter \- 博客园](https://www.cnblogs.com/xingzc/p/9138256.html)

## SpringMVC工作原理

![SpringMVC运行原理](http://my-blog-to-use.oss-cn-beijing.aliyuncs.com/18-10-11/49790288.jpg)

上图的一个笔误的小问题：Spring MVC 的入口函数也就是前端控制器 `DispatcherServlet` 的作用是接收请求，响应结果。

**流程说明（重要）：**

1. 客户端（浏览器）发送请求，直接请求到 `DispatcherServlet`。
2. `DispatcherServlet` 根据请求信息调用 `HandlerMapping`，解析请求对应的 `Handler`。
3. 解析到对应的 `Handler`（也就是我们平常说的 `Controller` 控制器）后，开始由 `HandlerAdapter` 适配器处理。
4. `HandlerAdapter` 会根据 `Handler`来调用真正的处理器开处理请求，并处理相应的业务逻辑。
5. 处理器处理完业务后，会返回一个 `ModelAndView` 对象，`Model` 是返回的数据对象，`View` 是个逻辑上的 `View`。
6. `ViewResolver` 会根据逻辑 `View` 查找实际的 `View`。
7. `DispaterServlet` 把返回的 `Model` 传给 `View`（视图渲染）。
8. 把 `View` 返回给请求者（浏览器）

## Spring事务

### Spring 管理事务的方式有几种？

1. 编程式事务，在代码中硬编码。(不推荐使用)
2. 声明式事务，在配置文件中配置（**推荐使用**）

**声明式事务又分为两种：**

1. 基于XML的声明式事务
2. 基于注解的声明式事务

### Spring 事务中的隔离级别有哪几种?

**TransactionDefinition 接口中定义了五个表示隔离级别的常量：**

- **TransactionDefinition.ISOLATION_DEFAULT:** 使用后端数据库默认的隔离级别，Mysql 默认采用的 REPEATABLE_READ隔离级别 Oracle 默认采用的 READ_COMMITTED隔离级别.
- **TransactionDefinition.ISOLATION_READ_UNCOMMITTED:** 最低的隔离级别，允许读取尚未提交的数据变更，**可能会导致脏读、幻读或不可重复读**
- **TransactionDefinition.ISOLATION_READ_COMMITTED:** 允许读取并发事务已经提交的数据，**可以阻止脏读，但是幻读或不可重复读仍有可能发生**
- **TransactionDefinition.ISOLATION_REPEATABLE_READ:** 对同一字段的多次读取结果都是一致的，除非数据是被本身事务自己所修改，**可以阻止脏读和不可重复读，但幻读仍有可能发生。**
- **TransactionDefinition.ISOLATION_SERIALIZABLE:** 最高的隔离级别，完全服从ACID的隔离级别。所有的事务依次逐个执行，这样事务之间就完全不可能产生干扰，也就是说，**该级别可以防止脏读、不可重复读以及幻读**。但是这将严重影响程序的性能。通常情况下也不会用到该级别。

### Spring 事务中哪几种事务传播行为?

**支持当前事务的情况：**

- **TransactionDefinition.PROPAGATION_REQUIRED：** 如果当前存在事务，则加入该事务；如果当前没有事务，则创建一个新的事务。
- **TransactionDefinition.PROPAGATION_SUPPORTS：** 如果当前存在事务，则加入该事务；如果当前没有事务，则以非事务的方式继续运行。
- **TransactionDefinition.PROPAGATION_MANDATORY：** 如果当前存在事务，则加入该事务；如果当前没有事务，则抛出异常。（mandatory：强制性）

**不支持当前事务的情况：**

- **TransactionDefinition.PROPAGATION_REQUIRES_NEW：** 创建一个新的事务，如果当前存在事务，则把当前事务挂起。
- **TransactionDefinition.PROPAGATION_NOT_SUPPORTED：** 以非事务方式运行，如果当前存在事务，则把当前事务挂起。
- **TransactionDefinition.PROPAGATION_NEVER：** 以非事务方式运行，如果当前存在事务，则抛出异常。

**其他情况：**

- **TransactionDefinition.PROPAGATION_NESTED：** 如果当前存在事务，则创建一个事务作为当前事务的嵌套事务来运行；如果当前没有事务，则该取值等价于TransactionDefinition.PROPAGATION_REQUIRED。

### @Transactional(rollbackFor = Exception.class)注解了解吗？

我们知道：Exception分为运行时异常RuntimeException和非运行时异常。事务管理对于企业应用来说是至关重要的，即使出现异常情况，它也可以保证数据的一致性。

当`@Transactional`注解作用于类上时，该类的所有 public 方法将都具有该类型的事务属性，同时，我们也可以在方法级别使用该标注来覆盖类级别的定义。如果类或者方法加了这个注解，那么这个类里面的方法抛出异常，就会回滚，数据库里面的数据也会回滚。

在`@Transactional`注解中如果不配置`rollbackFor`属性,那么事物只会在遇到`RuntimeException`的时候才会回滚,加上`rollbackFor=Exception.class`,可以让事物在遇到非运行时异常时也回滚。

### 事务不生效的几个结论

1. private,protect方法事务不生效
2. final修饰符修饰的方法和类不生效。
3. 在当前的bean中，没有加上事务的方法调用有事务的方法不生效。如下，调用index方法，save方法上的事务不生效。

只要是以代理方式实现的声明式事务，无论是JDK动态代理，还是CGLIB直接写字节码生成代理，都只有public方法上的事务注解才起作用。而且必须在代理类外部调用才行，如果直接在目标类里面调用，事务照样不起作用。



![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/20200216220556.png)

据底层所使用的不同的持久化 API 或框架，使用如下：

- **DataSourceTransactionManager**：适用于使用JDBC和iBatis进行数据持久化操作的情况，在定义时需要提供底层的数据源作为其属性，也就是 **DataSource**。
- **HibernateTransactionManager**：适用于使用Hibernate进行数据持久化操作的情况，与 HibernateTransactionManager 对应的是 **SessionFactory**。
- **JpaTransactionManager**：适用于使用JPA进行数据持久化操作的情况，与 JpaTransactionManager 对应的是 **EntityManagerFactory**。

## Spring Data Jpa、Jpa、Hibernate、JDBC四者之间的关系

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/20200215220801.png)

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/20200215220819.png)

**JPA** 是一套规范，内部是由接口和抽象类组成。

**Hibernate**是一套成熟的ORM框架，而且Hibernate实现了JPA规范，所以也可以称Hibernate是JPA的一种实现方式，我们使用JPA的API编程，意味着站在更高的角度上看待问题（面向接口编程）。

**Spring Data JPA**是Spring提供的一套对JPA操作更加高级的封装，是在JPA规范下的专门用来进行数据持久化的解决方案。

**JDBC**（Java DataBase Connectivity）是java连接数据库操作的原生接口。JDBC对Java程序员而言是API，对实现与数据库连接的服务提供商而言是接口模型。作为API，JDBC为程序开发提供标准的接口，并为各个数据库厂商及第三方中间件厂商实现与数据库的连接提供了标准方法。一句话概括：**JDBC是所有框架操作数据库的必须要用的，由数据库厂商提供，但是为了方便Java程序员调用各个数据库，各个数据库厂商都要实现JDBC接口**。









## Spring中用到的设计模式

**IoC(Inversion of Control,控制翻转)** 是Spring 中一个非常非常重要的概念，它不是什么技术，而是一种解耦的设计思想。它的主要目的是借助于“第三方”(Spring 中的 IOC 容器) 实现具有依赖关系的对象之间的解耦(IOC容易管理对象，你只管使用即可)，从而降低代码之间的耦合度。**IOC 是一个原则，而不是一个模式，以下模式（但不限于）实现了IoC原则。**

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/20200215175345.png)

**Spring IOC 容器就像是一个工厂一样，当我们需要创建一个对象的时候，只需要配置好配置文件/注解即可，完全不用考虑对象是如何被创建出来的。** IOC 容器负责创建对象，将对象连接在一起，配置这些对象，并从创建中处理这些对象的整个生命周期，直到它们被完全销毁。

**控制翻转怎么理解呢?** 举个例子："对象a 依赖了对象 b，当对象 a 需要使用 对象 b的时候必须自己去创建。但是当系统引入了 IOC 容器后， 对象a 和对象 b 之前就失去了直接的联系。这个时候，当对象 a 需要使用 对象 b的时候， 我们可以指定 IOC 容器去创建一个对象b注入到对象 a 中"。 对象 a 获得依赖对象 b 的过程,由主动行为变为了被动行为，控制权翻转，这就是控制反转名字的由来。

**DI(Dependecy Inject,依赖注入)是实现控制反转的一种设计模式，依赖注入就是将实例变量传入到一个对象中去。**

### 工厂设计模式

Spring使用工厂模式可以通过 `BeanFactory` 或 `ApplicationContext` 创建 bean 对象。

**两者对比：**

- `BeanFactory` ：延迟注入(使用到某个 bean 的时候才会注入),相比于`ApplicationContext` 来说会占用更少的内存，程序启动速度更快。
- `ApplicationContext` ：容器启动的时候，不管你用没用到，一次性创建所有 bean 。`BeanFactory` 仅提供了最基本的依赖注入支持，`ApplicationContext` 扩展了 `BeanFactory` ,除了有`BeanFactory`的功能还有额外更多功能，所以一般开发人员使用`ApplicationContext`会更多。

ApplicationContext的三个实现类：

1. `ClassPathXmlApplication`：把上下文文件当成类路径资源。
2. `FileSystemXmlApplication`：从文件系统中的 XML 文件载入上下文定义信息。
3. `XmlWebApplicationContext`：从Web系统中的XML文件载入上下文定义信息。

### 单例设计模式

**使用单例模式的好处:**

- 对于频繁使用的对象，可以省略创建对象所花费的时间，这对于那些重量级对象而言，是非常可观的一笔系统开销；
- 由于 new 操作的次数减少，因而对系统内存的使用频率也会降低，这将减轻 GC 压力，缩短 GC 停顿时间。

**Spring 中 bean 的默认作用域就是 singleton(单例)的。**

**Spring 实现单例的方式：**

- xml : `<bean id="userService" class="top.snailclimb.UserService" scope="singleton"/>`
- 注解：`@Scope(value = "singleton")`

**Spring 通过 `ConcurrentHashMap` 实现单例注册表的特殊方式实现单例模式。**

### 代理设计模式

#### 代理模式在 AOP 中的应用

AOP(Aspect-Oriented Programming:面向切面编程)能够将那些与业务无关，**却为业务模块所共同调用的逻辑或责任（例如事务处理、日志管理、权限控制等）封装起来**，便于**减少系统的重复代码**，**降低模块间的耦合度**，并**有利于未来的可拓展性和可维护性**。

**Spring AOP 就是基于动态代理的**，如果要代理的对象，实现了某个接口，那么Spring AOP会使用**JDK Proxy**，去创建代理对象，而对于没有实现接口的对象，就无法使用 JDK Proxy 去进行代理了，这时候Spring AOP会使用**Cglib**  生成一个被代理对象的子类来作为代理，如下图所示：

![SpringAOPProcess](https://my-blog-to-use.oss-cn-beijing.aliyuncs.com/2019-6/SpringAOPProcess.jpg)

当然你也可以使用 AspectJ ,Spring AOP 已经集成了AspectJ ，AspectJ 应该算的上是 Java 生态系统中最完整的 AOP 框架了。

使用 AOP 之后我们可以把一些通用功能抽象出来，在需要用到的地方直接使用即可，这样大大简化了代码量。我们需要增加新功能时也方便，这样也提高了系统扩展性。日志功能、事务管理等等场景都用到了 AOP 。

#### Spring AOP 和 AspectJ AOP 有什么区别?

**Spring AOP 属于运行时增强，而 AspectJ 是编译时增强。** Spring AOP 基于代理(Proxying)，而 AspectJ 基于字节码操作(Bytecode Manipulation)。

Spring AOP 已经集成了 AspectJ ，AspectJ 应该算的上是 Java 生态系统中最完整的 AOP 框架了。AspectJ 相比于 Spring AOP 功能更加强大，但是 Spring AOP 相对来说更简单，

如果我们的切面比较少，那么两者性能差异不大。但是，当切面太多的话，最好选择 AspectJ ，它比Spring AOP 快很多。

### 模板方法

模板方法模式是一种行为设计模式，它定义一个操作中的算法的骨架，而将一些步骤延迟到子类中。 模板方法使得子类可以不改变一个算法的结构即可重定义该算法的某些特定步骤的实现方式。

Spring 中 `jdbcTemplate`、`hibernateTemplate` 等以 Template 结尾的对数据库操作的类，它们就使用到了模板模式。一般情况下，我们都是使用继承的方式来实现模板模式，但是 Spring 并没有使用这种方式，而是使用Callback 模式与模板方法模式配合，既达到了代码复用的效果，同时增加了灵活性。

### 观察者模式

观察者模式是一种对象行为型模式。它表示的是一种对象与对象之间具有依赖关系，当一个对象发生改变的时候，这个对象所依赖的对象也会做出反应。Spring 事件驱动模型就是观察者模式很经典的一个应用。Spring 事件驱动模型非常有用，在很多场景都可以解耦我们的代码。比如我们每次添加商品的时候都需要重新更新商品索引，这个时候就可以利用观察者模式来解决这个问题。

Spring的事件驱动模型就是这种模式，该模型中的三个重要角色：

- 事件
- 事件监听者
- 事件发布者

**Spring 的事件流程总结**

1. 定义一个事件: 实现一个继承自 `ApplicationEvent`，并且写相应的构造函数；
2. 定义一个事件监听者：实现 `ApplicationListener` 接口，重写 `onApplicationEvent()` 方法；
3. 使用事件发布者发布消息: 可以通过 `ApplicationEventPublisher`（ApplicationContext实例的publishEvent方法） 的 `publishEvent()` 方法发布消息。

### 适配器模式

适配器模式(Adapter Pattern) 将一个接口转换成客户希望的另一个接口，适配器模式使接口不兼容的那些类可以一起工作，其别名为包装器(Wrapper)。

#### Spring AOP中的适配器模式

我们知道 Spring AOP 的实现是基于代理模式，但是 Spring AOP 的增强或通知(Advice)使用到了适配器模式，与之相关的接口是`AdvisorAdapter` 。Advice 常用的类型有：`BeforeAdvice`（目标方法调用前,前置通知）、`AfterAdvice`（目标方法调用后,后置通知）、`AfterReturningAdvice`(目标方法执行结束后，return之前)等等。每个类型Advice（通知）都有对应的拦截器:`MethodBeforeAdviceInterceptor`、`AfterReturningAdviceAdapter`、`AfterReturningAdviceInterceptor`。Spring预定义的通知要通过对应的适配器，适配成 `MethodInterceptor`接口(方法拦截器)类型的对象（如：`MethodBeforeAdviceInterceptor` 负责适配 `MethodBeforeAdvice`）。

#### Spring MVC中的适配器模式

在Spring MVC中，`DispatcherServlet` 根据请求信息调用 `HandlerMapping`，解析请求对应的 `Handler`。解析到对应的 `Handler`（也就是我们平常说的 `Controller` 控制器）后，开始由`HandlerAdapter` 适配器处理。`HandlerAdapter` 作为期望接口，具体的适配器实现类用于对目标类进行适配，`Controller` 作为需要适配的类。

**为什么要在 Spring MVC 中使用适配器模式？** Spring MVC 中的 `Controller` 种类众多，不同类型的 `Controller` 通过不同的方法来对请求进行处理。如果不利用适配器模式的话，`DispatcherServlet` 直接获取对应类型的 `Controller`，需要的自行来判断，像下面这段代码一样：

```java
if(mappedHandler.getHandler() instanceof MultiActionController){  
   ((MultiActionController)mappedHandler.getHandler()).xxx  
}else if(mappedHandler.getHandler() instanceof XXX){  
    ...  
}else if(...){  
   ...  
}  
```

假如我们再增加一个 `Controller`类型就要在上面代码中再加入一行 判断语句，这种形式就使得程序难以维护，也违反了设计模式中的开闭原则 – 对扩展开放，对修改关闭。

### 装饰器模式

装饰者模式可以动态地给对象添加一些额外的属性或行为。相比于使用继承，装饰者模式更加灵活。简单点儿说就是当我们需要修改原有的功能，但我们又不愿直接去修改原有的代码时，设计一个Decorator套在原有代码外面。其实在 JDK 中就有很多地方用到了装饰者模式，比如 `InputStream`家族，`InputStream` 类下有 `FileInputStream` (读取文件)、`BufferedInputStream` (增加缓存,使读取文件速度大大提升)等子类都在不修改`InputStream` 代码的情况下扩展了它的功能。

![装饰者模式示意图](https://my-blog-to-use.oss-cn-beijing.aliyuncs.com/2019-6/Decorator.jpg)

Spring 中配置 DataSource 的时候，DataSource 可能是不同的数据库和数据源。我们能否根据客户的需求在少修改原有类的代码下动态切换不同的数据源？这个时候就要用到装饰者模式(这一点我自己还没太理解具体原理)。Spring 中用到的包装器模式在类名上含有 `Wrapper`或者 `Decorator`。这些类基本上都是动态地给一个对象添加一些额外的职责