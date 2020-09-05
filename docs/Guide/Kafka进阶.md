## Kafka的各种选举

在kafka里有很多Leader，我们常常会对这些Leader选举概念有混淆，下面将分别讲一下三种不同身份的Leader。

1. Broker集群中的Leader——KafkaController

   概念：

   Kafka Controller负责管理整个集群中分区和副本的状态，比如partition的leader 副本故障，由controller 负责为该partition重新选举新的leader 副本；当检测到ISR列表发生变化，由controller通知集群中所有broker更新其MetadataCache信息；或者增加某个topic分区的时候也会由controller管理分区的重新分配工作。

   选举：

   当broker启动的时候，都会创建KafkaController对象，但是集群中只能有一个leader对外提供服务，这些每个节点上的KafkaController会在指定的zookeeper路径下创建临时节点，只有第一个成功创建的节点的KafkaController才可以成为leader，其余的都是follower。当leader故障后，所有的follower会收到通知，再次竞争在该路径下创建节点从而选举新的leader。

   ```
   /controller_epoch 记录了当前Controller Leader的年代信息
   /controller 记录了当前Controller Leader的id，也用于Controller Leader的选择
   ```

   Controller所在在Leader的broker宕机了怎么办？

   1. 重新非公平的竞争zk节点写入法选举新的Leader；
   2. 对于老的Leader上的分片，找到分片对应的ISR，从ISR中选举新的Leader，如果ISR为空，则可以从ISR外的非同步节点中选举，但是数据会有缺失，不建议为了可用性牺牲一致性。

   历史问题改进：

   在kafka中多个broker构成的集群里，Leader的选举是利用zk的抢占写`/controller`临时节点数据是否成功判断的，在zk的`/controller`节点会保存相关的broker.id的信息和变动的epoch次数信息。

   如果网络问题或者异常情况宕机，集群的leader也就是`/controller`所在broker节点挂掉会发生什么呢？

   在早期版本，对于分区和副本的状态的管理依赖于zookeeper的Watcher和队列，每个broker都会在zookeeper注册Watcher，所以zookeeper就会出现大量的Watcher，如果宕机的broker上的partition很多比较多，会造成多个Watcher触发，造成集群内大规模调整；每一个replica都要去再次zookeeper上注册监视器，当集群规模很大的时候，zookeeper负担很重。这种设计很容易出现脑裂和羊群效应以及zookeeper集群过载。

   在新版本中只有KafkaController Leader会向zookeeper上注册Watcher，其他broker几乎不用监听zookeeper的状态变化。

   [KafkaController介绍-CSDN博客](https://blog.csdn.net/zhanglh046/article/details/72821995/)

2. 分片中的Leader

   [Leader副本的选举](##kafka leader副本所在broker挂了，leader副本如何选举)

   基本思路是按照**AR集合**中副本的顺序查找第一个存活的副本，并且这个副本在ISR集合中。一个分区的AR集合在分配的时候就被指定，并且只要不发生重分配的情况，集合内部副本的顺序是保持不变的，而分区的ISR集合中副本的顺序可能会改变。注意这里是根据AR的顺序而不是ISR的顺序进行选举的。这个说起来比较抽象，有兴趣的读者可以手动关闭/开启某个集群中的broker来观察一下具体的变化。

   还有一些情况也会发生分区leader的选举，比如当分区进行重分配（reassign）的时候也需要执行leader的选举动作。这个思路比较简单：从重分配的AR列表中找到第一个存活的副本，且这个副本在目前的ISR列表中。3

   [Kafka科普系列 \| 原来Kafka中的选举有这么多？\_大数据\_朱小厮的博客\-CSDN博客](https://blog.csdn.net/u013256816/article/details/89369160)

3. 消费者组的Leader

   在GroupCoordinator中消费者的信息是以HashMap的形式存储的，其中key为消费者的member_id，而value是消费者相关的元数据信息。leaderId表示leader消费者的member_id，它的取值为HashMap中的第一个键值对的key，这种选举的方式基本上和随机无异。总体上来说，消费组的leader选举过程是很随意的。



## Partition副本分配算法

为了能让partition和replica均匀的分布在broker上，防止一台机器负载较高。有如下分配算法：

1. 将所有N Broker和待分配的i个Partition排序.
2. 将第i个Partition分配到第(i mod n)个Broker上.
3. 将第i个Partition的第j个副本分配到第((i + j) mod n)个Broker上
4. topic初始创建后，就会符合上述分配。

但是在集群leader又宕机后，此机器的所有partition的leader都会变化，当原来宕机的机器恢复后，加入到集群变成了follower。此时partition的leader就没有均匀的分布。这时就可以使用**partition的leader平衡工具**来手动或者自动平衡Leader。



## Kafka集群中，某broker节点进程挂掉之后，zk集群是如何感知到的？通过controller?

​		controller在启动时会注册zk监听器来监听zookeeper中的/brokers/ids节点下子节点的变化，即集群所有broker列表，而每台broker在启动时会向zk的/brokers/ids下写入一个名为broker.id的临时节点，当该broker挂掉或与zk断开连接时，此临时节点会被移除（这是zk提供的功能），之后controller端的监听器就会自动感知到这个变化并将BrokerChange事件写入到controller上的请求阻塞队列中。

一旦controller端从阻塞队列中获取到该事件，它会开启BrokerChange事件的处理逻辑，具体包含：

1. 获取当前存活的所有broker列表

2. 根据之前缓存的broker列表计算出当前“已挂掉”的broker列表

3. 更新controller端缓存

4. 对于当前所有存活的broker，更新元数据信息并且启动新broker上的分区和副本

5. 对于“挂掉”的那些broker，处理这些broker上的分区副本（标记为offline以及执行offline逻辑并更新元数据等）



## [kafka一个broker挂掉无法写入](https://www.cnblogs.com/nshuai/p/11497503.html)

因其中一个broker挂掉无法获取leader的brokerid

但3个broker中的其中一个挂掉，是可以将数据写入另外两个broker的。至于没有写入另外两个broker报错org.apache.kafka.common.errors.NotLeaderForPartition可能是因为可能我们的producer端的代码里没加 reties 参数，默认就发送一次，遇到leader选举时，找不到leader就会发送失败，造成程序停止

解决办法：

producer端加上参数 reties=3， 重试发送三次（默认100ms重试一次 由 retry.backoff.ms控制）；
如果还需要保证消息发送的有序性，记得加上参数 max.in.flight.requests.per.connection = 1 限制客户端在单个连接上能够发送的未响应请求的个数，设置此值是1表示kafka broker在响应请求之前client不能再向同一个broker发送请求。（注意：设置此参数是为了满足必须顺序消费的场景，比如binlog数据）



## kafka如何保证同一个分区下的所有副本保存有相同的消息序列：

基于领导者（Leader-based）的副本机制

工作原理如图：

![img](https://img2018.cnblogs.com/blog/1582259/201910/1582259-20191015220611760-1572669650.png)

 

1、Kafka 中分成两类副本：领导者副本（Leader Replica）和追随者副本（Follower Replica）。每个分区在创建时都要选举一个副本，称为领导者副本，其余的副本自动称为追随者副本。

2、Kafka 中，**追随者副本是不对外提供服务的**。追随者副本不处理客户端请求，它唯一的任务就是从领导者副本，所有的读写请求都必须发往领导者副本所在的 Broker，由该 Broker 负责处理。（因此目前kafka只能享受到副本机制带来的第 1 个好处，也就是提供数据冗余实现高可用性和高持久性）

3、领导者副本所在的 Broker 宕机时，Kafka 依托于 ZooKeeper 提供的监控功能能够实时感知到，并立即开启新一轮的领导者选举，从追随者副本中选一个作为新的领导者。老 Leader 副本重启回来后，只能作为追随者副本加入到集群中。

 

## kafka追随者副本到底在什么条件下才算与 Leader 同步

Kafka 引入了 In-sync Replicas，也就是所谓的 ISR 副本集合。ISR 中的副本都是与 Leader 同步的副本，相反，不在 ISR 中的追随者副本就被认为是与 Leader 不同步的

 

## kafka In-sync Replicas（ISR）

1、ISR不只是追随者副本集合，它必然包括 Leader 副本。甚至在某些情况下，ISR 只有 Leader 这一个副本

2、通过Broker 端replica.lag.time.max.ms 参数（Follower 副本能够落后 Leader 副本的最长时间间隔）值来控制哪个追随者副本与 Leader 同步？只要一个 Follower 副本落后 Leader 副本的时间不连续超过 10 秒，那么 Kafka 就认为该 Follower 副本与 Leader 是同步的，即使此时 Follower 副本中保存的消息明显少于 Leader 副本中的消息。

3、ISR 是一个动态调整的集合，而非静态不变的。

某个追随者副本从领导者副本中拉取数据的过程持续慢于 Leader 副本的消息写入速度，那么在 replica.lag.time.max.ms 时间后，此 Follower 副本就会被认为是与 Leader 副本不同步的，因此不能再放入 ISR 中。此时，Kafka 会自动收缩 ISR 集合，将该副本“踢出”ISR。

倘若该副本后面慢慢地追上了 Leader 的进度，那么它是能够重新被加回 ISR 的。

4、ISR集合为空则leader副本也挂了，这个分区就不可用了，producer也无法向这个分区发送任何消息了。（反之leader副本挂了可以从ISR集合中选举leader副本）

 

## kafka leader副本所在broker挂了，leader副本如何选举

1、ISR不为空，从ISR中选举

2、ISR为空，Kafka也可以从不在 ISR 中的存活副本中选举，这个过程称为Unclean 领导者选举，通过Broker 端参数 unclean.leader.election.enable 控制是否允许 Unclean 领导者选举。开启 Unclean 领导者选举可能会造成数据丢失，但好处是，它使得分区 Leader 副本一直存在，不至于停止对外提供服务，因此提升了高可用性。反之，禁止 Unclean 领导者选举的好处在于维护了数据的一致性，避免了消息丢失，但牺牲了高可用性。

一个分布式系统通常只能同时满足一致性（Consistency）、可用性（Availability）、分区容错性（Partition tolerance）中的两个。显然，在这个问题上，Kafka 赋予你选择 C 或 A 的权利。

**强烈建议不要开启unclean leader election，毕竟我们还可以通过其他的方式来提升高可用性。如果为了这点儿高可用性的改善，牺牲了数据一致性，那就非常不值当了。**

ps1：leader副本的选举也可以理解为分区leader的选举

ps2：broker的leader选举与分区leader的选举不同，

Kafka的Leader选举是通过在zookeeper上创建/controller临时节点来实现leader选举，并在该节点中写入当前broker的信息
{“version”:1,”brokerid”:1,”timestamp”:”1512018424988”}
利用Zookeeper的强一致性特性，一个节点只能被一个客户端创建成功，创建成功的broker即为leader，即先到先得原则，leader也就是集群中的controller，负责集群中所有大小事务。
当leader和zookeeper失去连接时，临时节点会删除，而其他broker会监听该节点的变化，当节点删除时，其他broker会收到事件通知，重新发起leader选举

[Kafka副本机制 \- jet\_qiu \- 博客园](https://www.cnblogs.com/jetqiu/p/11681838.html)





