## 基本概念

### 节点

- 持久节点：一直存在于Zookeeper上
- 临时节点：生命周期与客户端会话绑定
- 持久顺序节点：PERSISTENT_SEQUENTIAL
- 临时顺序节点：EPHEMERAL_SEQUENTIAL

### Session会话

​		Session是指当Client创建一个同Server的连接时产生的会话。连接Connected之后Session状态就开启，Zookeeper服务器和Client采用长连接方式（Client会不停地向Server发送心跳）保证session在不出现网络问题、服务器宕机或Client宕机情况下可以一直存在。因此，在正常情况下，session会一直有效，并且ZK集群上所有机器都会保存这个Session信息。

#### ZooKeeper常常发生下面两种系统异常

1. org.apache.ZooKeeper.KeeperException.ConnectionLossException, 客户端与其中的一台服务器socket连接出现异常，连接丢失；
2. org.apache.ZooKeeper.KeeperException.SessionExpiredException, 客户端的session已经超过sessionTimeout, 未进行任何操作。

> ConnectionLossException异常可以通过重试进行处理，客户端会根据初始化ZooKeeper时传递的服务列表，自动尝试下一个服务端节点，而在这段时间内，服务端节点变更的事件就丢失。
>
> SessionExpiredException异常不能通过重试进行解决，需要应用重新创建一 个新的客户端(new Zoo keeper()), 这时所有的watcher和EPHEMERAL节点都将失效。
>
> [如何使用curator实现session expired异常的捕获和处理?](https://www.cnblogs.com/kangoroo/p/7538314.html)

#### Connection Loss和Session Expired的关系

​		在ZK中，很多数据和状态都是和会话绑定的，一旦会话失效，那么ZK就开始清除和这个会话有关的信息，包括这个会话创建的临时节点和注册的所有Watcher。

一旦网络连接因为某种原因断开或者zk集群发生宕机，ZK Client会马上捕获到这个异常，封装为一个ConnectionLoss的事件，然后启动自动重连机制在地址列表中选择新的地址进行重连。重连会有三种结果：

（1）在session timeout时间内重连成功，client会重新收到一个syncconnected的event，并将连接重新持久化为connected状态

（2）超过session timeout时间段后重连成功，client会收到一个expired的event，并将连接持久化为closed状态

（3）一直重连不上，client将不会收到任何event

​		很显然，无论重连成功与否，在session timeout那个重要的时间点，ZK Client是接收不到任何ZK Server清理临时节点的信息的。这也就导致ZK会通知了B C节点A已经不再是Leader，A自身却没有接收到这样的信息，依旧对外提供服务，进而产生脑裂的问题。

#### 会话时间（Session Time）

​		在《ZooKeeper API 使用》一文中已经提到，在实例化一个ZK客户端的时候，需要设置一个会话的超时时间。这里需要注意的一点是，客户端并不是可以随意设置这个会话超时时间，在ZK服务器端对会话超时时间是有限制的，主要是minSessionTimeout和maxSessionTimeout这两个参数设置的。（详细查看这个文章《ZooKeeper管理员指南》）Session超时时间限制，如果客户端设置的超时时间不在这个范围，那么会被强制设置为最大或最小时间。 默认的Session超时时间是在2 * tickTime ~ 20 * tickTime。所以，如果应用对于这个会话超时时间有特殊的需求的话，一定要和ZK管理员沟通好，确认好服务端是否设置了对会话时间的限制。

​		ZooKeeper的Server端会有两个配置，minSessionTimeout和 maxSess1onTimeout minSessionTimeout的值默认为2 倍 tickTim e , maxSessionTimeout的值默认为20 倍 tickTime ,单位都为ms。tickTime也是服务端的一个配置项 ，是 Server内部控制时间逻辑的最小时间单位 。

经过源码分析，得出SessionTimeOut的协商如下：

- 情况1: 配置文件配置了maxSessionTimeOut和minSessionTimeOut

最终SessionTimeOut,必须在minSessionTimeOut和maxSessionTimeOut区间里，如果跨越上下界，则以跨越的上届或下界为准。

- 情况2:配置文件没有配置maxSessionTimeOut和minSessionTimeOut

maxSessionTimeout没配置则 maxSessionTimeOut设置为 20 * tickTime

minSessionTimeOut没配置则 minSessionTimeOut设置为 2 * tickTime

也就是默认情况下, SessionTimeOut的合法范围为 4秒~40秒，默认配置中tickTime为2秒。

如果tickTime也没配置，那么tickTime缺省为3秒。

遇到问题从源码分析一定是最好的，能使得理解更深入记忆更深刻。

[笃行杂记之Zookeeper SessionTimeOut分析 \- 网络安全研究&源码分析 \- SegmentFault 思否](https://segmentfault.com/a/1190000010009777)

## 选举

### ZAB协议

- 如何避免脑裂



## 应用

### 分布式锁

#### 实现分布式锁步骤

1. ZK原生方案
2. Curator方案

#### 需要注意的地方

1. node节点选择为EPHEMERAL_SEQUENTIAL很重要。自增长的特性，可以方便构建一个基于Fair特性的锁`，前一个节点唤醒后一个节点，形成一个链式的触发过程。`可以有效的避免"惊群效应"(一个锁释放，所有等待的线程都被唤醒)`，有针对性的唤醒，提升性能。
2. 选择一个EPHEMERAL临时节点的特性。因为和zookeeper交互是一个网络操作，不可控因素过多，比如网络断了，上一个节点释放锁的操作会失败。临时节点是和对应的session挂接的，session一旦超时或者异常退出其节点就会消失，类似于ReentrantLock中等待队列Thread的被中断处理。
3. 获取lock操作是一个阻塞的操作，而对应的Watcher是一个异步事件，所以需要使用互斥信号共享锁BooleanMutex进行通知，可以比较方便的解决锁重入的问题。(锁重入可以理解为多次读操作，锁释放为写抢占操作)
4. 使用EPHEMERAL会引出一个风险：在非正常情况下，网络延迟比较大会出现session timeout，zookeeper就会认为该client已关闭，从而销毁其id标示，竞争资源的下一个id就可以获取锁。这时可能会有两个process同时拿到锁在跑任务，所以设置好session timeout很重要
   



[Zookeeper面试题 \- lanqiu5ge \- 博客园](https://www.cnblogs.com/lanqiu5ge/p/9405601.html)

