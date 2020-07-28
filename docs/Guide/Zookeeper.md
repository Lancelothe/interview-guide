## 基本概念

### 节点

- 持久节点：一直存在于Zookeeper上
- 临时节点：生命周期与客户端会话绑定
- 持久顺序节点：PERSISTENT_SEQUENTIAL
- 临时顺序节点：EPHEMERAL_SEQUENTIAL

### 特点

- **顺序一致性：** 从同一客户端发起的事务请求，最终将会严格地按照顺序被应用到 ZooKeeper 中去。
- **原子性：** 所有事务请求的处理结果在整个集群中所有机器上的应用情况是一致的，也就是说，要么整个集群中所有的机器都成功应用了某一个事务，要么都没有应用。
- **单一系统映像 ：** 无论客户端连到哪一个 ZooKeeper 服务器上，其看到的服务端数据模型都是一致的。
- **可靠性：** 一旦一次更改请求被应用，更改的结果就会被持久化，直到被下一次更改覆盖。

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

Paxos 算法应该可以说是 ZooKeeper 的灵魂了。但是，ZooKeeper 并没有完全采用 Paxos算法 ，而是使用 ZAB 协议作为其保证数据一致性的核心算法。另外，在ZooKeeper的官方文档中也指出，ZAB协议并不像 Paxos 算法那样，是一种通用的分布式一致性算法，它是一种特别为Zookeeper设计的崩溃可恢复的原子消息广播算法。

**ZAB（ZooKeeper Atomic Broadcast 原子广播） 协议是为分布式协调服务 ZooKeeper 专门设计的一种支持崩溃恢复的原子广播协议。 在 ZooKeeper 中，主要依赖 ZAB 协议来实现分布式数据一致性，基于该协议，ZooKeeper 实现了一种主备模式的系统架构来保持集群中各个副本之间的数据一致性。**

### ZAB 协议两种基本的模式：崩溃恢复和消息广播

ZAB协议包括两种基本的模式，分别是 **崩溃恢复和消息广播**。当整个服务框架在启动过程中，或是当 Leader 服务器出现网络中断、崩溃退出与重启等异常情况时，ZAB 协议就会进入恢复模式并选举产生新的Leader服务器。当选举产生了新的 Leader 服务器，同时集群中已经有过半的机器与该Leader服务器完成了状态同步之后，ZAB协议就会退出恢复模式。其中，**所谓的状态同步是指数据同步，用来保证集群中存在过半的机器能够和Leader服务器的数据状态保持一致**。

**当集群中已经有过半的Follower服务器完成了和Leader服务器的状态同步，那么整个服务框架就可以进入消息广播模式了。** 当一台同样遵守ZAB协议的服务器启动后加人到集群中时，如果此时集群中已经存在一个Leader服务器在负责进行消息广播，那么新加人的服务器就会自觉地进入数据恢复模式：找到Leader所在的服务器，并与其进行数据同步，然后一起参与到消息广播流程中去。正如上文介绍中所说的，ZooKeeper设计成只允许唯一的一个Leader服务器来进行事务请求的处理。Leader服务器在接收到客户端的事务请求后，会生成对应的事务提案并发起一轮广播协议；而如果集群中的其他机器接收到客户端的事务请求，那么这些非Leader服务器会首先将这个事务请求转发给Leader服务器。

关于 **ZAB 协议&Paxos算法** 需要讲和理解的东西太多了，说实话，笔主到现在不太清楚这俩兄弟的具体原理和实现过程。推荐阅读下面两篇文章：

- [图解 Paxos 一致性协议](http://codemacro.com/2014/10/15/explain-poxos/)
- [Zookeeper ZAB 协议分析](https://dbaplus.cn/news-141-1875-1.html)

### 如何避免脑裂

## 集群角色

**最典型集群模式： Master/Slave 模式（主备模式）**。在这种模式中，通常 Master服务器作为主服务器提供写服务，其他的 Slave 服务器从服务器通过异步复制的方式获取 Master 服务器最新的数据提供读服务。

但是，**在 ZooKeeper 中没有选择传统的 Master/Slave 概念，而是引入了Leader、Follower 和 Observer 三种角色**。

![img](http://dbaplus.cn/uploadfile/2018/0105/20180105041453524.jpg)

**ZooKeeper 集群中的所有机器通过一个 Leader 选举过程来选定一台称为 “Leader” 的机器，Leader 既可以为客户端提供写服务又能提供读服务。除了 Leader 外，Follower 和 Observer 都只能提供读服务。Follower 和 Observer 唯一的区别在于 Observer 机器不参与 Leader 的选举过程，也不参与写操作的“过半写成功”策略，因此 Observer 机器可以在不影响写性能的情况下提升集群的读性能。**

[![img](https://camo.githubusercontent.com/f08946356f39f71ba0bdcf5ae10bc05a2e4d514b/687474703a2f2f6d792d626c6f672d746f2d7573652e6f73732d636e2d6265696a696e672e616c6979756e63732e636f6d2f31382d392d31332f39313632323339352e6a7067)](https://camo.githubusercontent.com/f08946356f39f71ba0bdcf5ae10bc05a2e4d514b/687474703a2f2f6d792d626c6f672d746f2d7573652e6f73732d636e2d6265696a696e672e616c6979756e63732e636f6d2f31382d392d31332f39313632323339352e6a7067)

**当 Leader 服务器出现网络中断、崩溃退出与重启等异常情况时，ZAB 协议就会进入恢复模式并选举产生新的Leader服务器。这个过程大致是这样的：**

1. Leader election（选举阶段）：节点在一开始都处于选举阶段，只要有一个节点得到超半数节点的票数，它就可以当选准 leader。
2. Discovery（发现阶段）：在这个阶段，followers 跟准 leader 进行通信，同步 followers 最近接收的事务提议。
3. Synchronization（同步阶段）:同步阶段主要是利用 leader 前一阶段获得的最新提议历史，同步集群中所有的副本。同步完成之后 准 leader 才会成为真正的 leader。
4. Broadcast（广播阶段） 到了这个阶段，Zookeeper 集群才能正式对外提供事务服务，并且 leader 可以进行消息广播。同时如果有新的节点加入，还需要对新节点进行同步。

## 

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

