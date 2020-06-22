ReentrantLock

AQS



参数调优：

常见JVM参数 和 JVM命令

遇到CPU飙升100%怎么解决



问题解决：

频繁Full GC：

OOM：



zk

es

排序算法

分布式：

分布式事务，

分布式原理：CAP和Base区别，CAP每种都有哪些代表



**分布式任务的系统设计**

**Kafka丢弃消息策略**





## 集合

ArrayList和LinkedList

什么是fail—fast？

HashMap的put、扩容原理，1.7和1.8的数据结构（double）

## 多线程

死锁的条件，如何打破

JMM

如何创建线程池，队列都有哪些？拒绝策略都有哪些？任务过多时都是如何处理的（double）

线程生命周期

synchronized原理（double）

jdk对synchronized做了哪些优化

ReentrantLock

CAS、ABA问题（double）

## JVM

各个区域的内容（double）

常见OOM（double）

垃圾收集器、算法

类加载机制（double）

内存分配并发问题

新生代默认多少次晋升老年代

反射



## 网络

TCP粘包，为什么出现，如何解决？

TCP如何实现消息可靠性、滑动窗口

TCP三次握手四次挥手

DNS

https原理、可以被攻击么？（double）

## 数据库事务

事务的隔离级别、mysql和oracle默认是什么，都解决了什么问题（double）

事务的特性（double）

快照读和当前读

B+树、聚簇索引和非聚簇索引（double）

**乐观锁、悲观锁、间隙锁、行锁、表锁的使用场景**

**mvcc（double）**

**redolog、undolog、binlog**

一个表没有索引的结构类型

索引失效的场景

mysql都有哪些组件

## 中间件

RabbitMQ和kafka的架构（double）

如何保证消息的顺序性

为什么使用这个中间件（double）

Redis数据类型，底层数据结构（double）

缓存淘汰算法

缓存穿透、缓存击穿

缓存数据库双写（double）

## Spring

IOC和AOP的理解及原理（double）

Bean的生命周期（double）

自动注入方式有哪些，两个注解的区别

Spring MVC流程

## 微服务

**分布式事务怎么做的（double）**

**CAP、BASE理论**

如何实现一个RPC框架

服务熔断如何做的

令牌桶、漏桶算法

分布式id如何生成（double）



## 算法

都是一个力扣简单级一个中等级，只不过美团上现场白纸写，阿里是伯乐系统在线做

## 项目

项目中出现各种场景的解决方案





你怎么给tomcat性能调优

如何加大tomcat链接数

怎么加大tomcat 的内存

tomcat中如何禁止列目录下的文件

tomcat有几种部署方式

tomcat的优化经验





Java内加载过程

Java内存分配

描述一下jvm加载class文件的原理机制

gc是什么?为什么要有gc

简述Java垃圾回收机制

如何判断一个对象是否存活

垃圾回收的有点和原理，并采用2种回收机制

垃圾回收器的基本原理是什么?垃圾回收器可以马上回收内存吗?

Java中会存在内存泄漏吗?请简单描述

深拷贝和浅拷贝

System.gc() 和 Runtime.gc()会做什么事情

fifinalize() 方法什么时候被调用?析构函数(fifinalization)的目的是什么 ?

如果对象被引用置为rull，垃圾收集器是否会马上释放对象占用的内存?

什么是分布式垃圾回收，它是怎么工作的

串行(serial)收集器和吞吐量(throughput)收集器的区别是什么

在Java对象什么时候可以被垃圾回收?

简述Java内存分配与回收策率以及Minor GC 和Major GC

JVM的永久代中会发生垃圾回收吗

Java中垃圾收集的方法有哪些

什么是内加载器，内加载器有哪些

类加载器双亲委派模型机制?





什么是SpringCloud

SpringCloud有什么优势

服务注册和发现是什么意思?SpringCloud如何实现

负载平衡的意义是什么

什么是Hystrix?它如何实现容错?

什么是Hystrix断路器?我们需要它吗

什么是Netflflix Feign?他的优点是什么

什么是SpringCloud bus?我们需要它吗







什么是springboot

springboot有哪些优点

什么是JavaConfig?

如何重新加载springboot上的更改，而无需重新启动服务器

springboot中的监视器是什么?

如何在springboot中禁用Actuator端点安全性

如何在自定义端口上运行springboot应用程序

什么是YAML?

如何实现springboot应用程序的安全性

如何集成springboot和ActiveMQ?

如何使用springboot实现分页跟排序

什么是swagger?你用springboot实现他了吗

什么是Spring Profifiles?

什么是Spring Batch?

什么是FreeMarker模板?

如何使用springboot实现异常处理?

你使用了哪些starter maven依赖项

什么是csrf攻击?

什么是AOP







Dubbo中zookeeper做注册中心，如果注册中心的集群都挂掉，发布者和订阅者之间还能通信吗

Dubbo服务负载均衡策略?

Dubbo在安全机制方面是怎么解决的

Dubbo链接注册中心和直连有什么区别



Synchronized用过吗?其原理是什么?

如何获取对象的锁，这个"锁"是指什么?如何确定对象的锁

什么是可重入性，为什么说Synchronized是可重入锁?

JVM对Java的原生锁做了哪些优化?

为什么说Synchronized是非公平锁

什么是锁消除和锁粗化

为什么说Synchronized是一个悲观锁?乐观锁的实现原理又是什么?

乐观锁一定就是好的吗

跟Synchronized相比，可重入锁ReentrantLock其实现原理有什么不同

那请谈谈AQS框架是怎么回事

尽可能详细的对比Synchronized 和 ReentrantLock 的异同

ReentrantLock是如何实现可重入性的

除了ReentrantLock,你还接触过juc中的哪些并发工具

请谈谈ReadWriteLock 和StampedLock

如何让Java的线程彼此同步

̵CyclicBarrier和CountDownLatch看起来很相似，请对比下

Java中的线程池是如何实现的

创造线程池的几个核心构造参数

请对比下volatile 对比Synchronized的异同

ThreadLocal是怎么解决并发安全的







面试中遇到的问题：

常见的问题：

- 什么是线程不安全？
- 有什么方法能保证线程安全？
- HashMap和ConcurrentHashMap的底层结构是什么？
- HashMap的扩容机制、重hash的流程，链表超过8个转红黑树还会再转回来吗？

- 并发包、线程池

- MySQL的索引结构、聚簇索引和非聚簇索引、联合索引

- MySQL事务的特性、隔离级别、传播特性

- MySQL的 慢SQL的优化如何做的

- Redis的缓存雪崩、缓存穿透、缓存击穿

- Redis的过期策略

- Redis集群

- Redis的数据结构，hash、zset的底层实现

- Redis的分布式锁

- 怎么保证缓存和数据库的数据一致性

- JVM内存结构

- JVM调优、解决问题的思路

- JDK解决JVM问题时用到的命令

  ```
  +HeapDumpBeforeFullGC pid jinfo -flag +HeapDumpAfterFullGC pid jinfo -flag HeapDumpPath=/home/app pid
  
  jstat -gcutil 193 100
  
  jmap -dump:format=b,file=d:/test.hprof pid
  
  jstack -l <pid> #加l参数同时会显示锁信息
  ```

  

- 新生代如何晋升到老年代的

- 类加载机制、类加载器

- **RPC的调用的过程**

  

  





不会的问题：

- Java8的API里的Map Reduce怎么用，参数是什么；stream 的map和flatMap的区别，CompletableFuture的底层实现（ForkJoinPool）
- 并发包里辅助类：CountDownLatch、CyclicBarrier等
- AQS的实现原理
- 线程池的阻塞队列大小设置1024会不会太长了，抛弃策略后有没有什么业务上的补偿机制
- MySQL数据存储的结构
- **redo日志和undo日志**
- 分布式事务
- Spring源码
- Spring MVC
- gRPC底层（HTTP/2协议，结合Netty）
- Netty的reactor模型
- **KafKa怎么用的，底层结构和原理**
- **ES的原理**
- **进程间通信的方式**（管道、信号量、消息队列、共享内存、socket）
- **GC日志都有哪几部分**（）
- 排序算法
- 平衡二叉树的旋转操作
- **Spring Boot的拦截器、过滤器是怎么实现的**
- **拦截器和过滤器的区别是什么？**
- **Spring Boot用什么做Servlet容器？**
- **Spring Boot怎么做参数校验的？**
- **说一下JDK的IO框架、集合框架。**
- **TreeMap是对什么排序的，如果对Value排序应该怎么做。**（Collections.sort(Map.entrySet)）
- **能直接用集合的Collection的sort要满足什么条件**





扩展准备问题：

- 你为什么要这个薪资？

- 设计一个秒杀的系统

- 看电影，选电影院场次和座位的表结构
- 你现在的系统如何提升100倍的请求，架构怎么演化
- EurekaServer集群现在是5W台，怎么在毫秒的时间内同步成功等等，让你去设计和思考





[Java 线程池的异常处理机制 \- Coding Dream \- OSCHINA](https://my.oschina.net/lifany/blog/884002)





1. mysql哪些场景用了hash索引
2. mysql默认的事务隔离级别，mvcc，rr怎么实现的，rc如何实现的
3. mysql间隙锁有没有了解，死锁有没有了解，写一段会造成死锁的sql语句，死锁发生了如何解决，mysql有没有提供什么机制去解决死锁
4. volatile底层、synchronized底层、锁升级的过程、MESI
5. 如何保证RocketMQ 消息的顺序性，如何解决重复消费问题
6. 项目中如何保证接口的幂等操作
7. 分布式锁   对比redis分布式锁 & zk分布式锁
8. 怎么理解命令模式和观察者模式，手写一个观察者模式或者命令模式的代码，策略模式也行
9. 如何设计一个秒杀系统
10. 如果我现在就是要实现每秒10w请求，不能熔断限流，如何去设计
11. hystrix 和 sentinel，了解多少说多少
12. 画一下java     线程几个状态 及 状态之间互相转换的图
13. kafka 如何保证消息顺序消费、在consumer group 中新增一个consumer 会提高消费消息的速度吗、那如果我想提高消息消费的速度，我要怎么办
14. 哨兵机制、选举算法
15. 多个线程之间如何共享数据，多个进程之间如何共享数据
16. countDownLatch如何实现的
17. TIME_WAIT是什么状态还记得吗，什么情况下网络会出现这个状态
18. 说一下 B+tree 和二叉搜索树的区别？说一下二叉搜索树和 AVL 树、红黑树之间的差别





Java8 stream原理

[Java Streams，第 3 部分: Streams 的幕后原理](https://www.ibm.com/developerworks/cn/java/j-java-streams-3-brian-goetz/index.html)

[Java8学习记录\(二\)\-Stream原理 \- 知乎](https://zhuanlan.zhihu.com/p/31220388)

[java8Stream原理深度解析 \- Dorae \- 博客园](https://www.cnblogs.com/Dorae/p/7779246.html)

[深入理解Java Stream流水线 \- CarpenterLee \- 博客园](https://www.cnblogs.com/carpenterlee/p/6637118.html)

[原来你是这样的 Stream —— 浅析 Java Stream 实现原理 \- 杏仁技术站](http://hack.xingren.com/index.php/2018/10/17/java-stream/)

[浅析Java8 Stream原理 \- 简书](https://www.jianshu.com/p/dd5fb725331b)

[Java8中Stream原理分析 \- S\.L's Blog \| S\.L Blog](https://elsef.com/2019/09/16/Java8%E4%B8%ADStream%E7%9A%84%E5%8E%9F%E7%90%86%E5%88%86%E6%9E%90/)

[关于Java Lambda表达式看这一篇就够了](https://objcoding.com/2019/03/04/lambda/#stream-pipelines)





---

20200620

Elastic-Job

热更新

MySQL索引、order by、group by走索引、慢SQL优化案例

