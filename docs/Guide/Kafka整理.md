## Kafka集群架构

![Kafka架构.png](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/Kafka架构.png)



## 概念

**Producer**：Producer即生产者，消息的产生者，是消息的入口。

**Broker**：Broker是kafka实例，每个服务器上有一个或多个kafka的实例，我们姑且认为每个broker对应一台服务器。每个kafka集群内的broker都有一个**不重复**的编号，如图中的broker-0、broker-1等……

**Topic**：消息的主题，可以理解为消息的分类，kafka的数据就保存在topic。在每个broker上都可以创建多个topic。一个topic是一类消息。

**Partition**：Topic的分区，每个topic可以有多个分区，分区的作用是做负载，提高kafka的吞吐量。同一个topic在不同的分区的数据是不重复的，partition的表现形式就是一个一个的文件夹！

**Replication**: 每一个分区都有多个副本，副本的作用是做备胎。当主分区（Leader）故障的时候会选择一个备胎（Follower）上位，成为Leader。在kafka中默认副本的最大数量是10个，且副本的数量不能大于Broker的数量，follower和leader绝对是在不同的机器，同一机器对同一个分区也只可能存放一个副本（包括自己）。

**Message**：每一条发送的消息主体。

**Consumer**：消费者，即消息的消费方，是消息的出口。

**Consumer Group**：我们可以将多个消费组组成一个消费者组，在kafka的设计中同一个分区的数据只能被消费者组中的某一个消费者消费。同一个消费者组的消费者可以消费同一个topic的不同分区的数据，这也是为了提高kafka的吞吐量！

**Zookeeper**：kafka集群依赖zookeeper来保存集群的的元信息，来保证系统的可用性。管理集群配置、选举Leader，以及在consumer group变化时进行rebalance。

## 消息队列的好处

1. 削峰
2. 解耦
3. 异步

## Partition（分区）

kafka为每个主题维护了分布式的分区(partition)日志文件，每个partition在kafka存储层面是append log。任何发布到此partition的消息都会被追加到log文件的尾部，在分区中的每条消息都会按照时间顺序分配到一个单调递增的顺序编号，也就是我们的offset,offset是一个long型的数字，我们通过这个offset可以确定一条在该partition下的唯一消息。在partition下面是保证了有序性，但是在topic下面没有保证有序性。

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/kafka-partition.png)

在上图中在我们的生产者会决定发送到哪个Partition。

- 如果没有Key值则进行轮询发送。
- 如果有Key值，对Key值进行Hash，然后对分区数量取余，保证了同一个Key值的会被路由到同一个分区，如果想队列的强顺序一致性，可以让所有的消息都设置为同一个Key。

### 分区的主要目的

**1、 方便扩展**。因为一个topic可以有多个partition，所以我们可以通过扩展机器去轻松的应对日益增长的数据量。

**2、 提高并发**。以partition为读写单位，可以多个消费者同时消费数据，提高了消息的处理效率。

## Broker设计原理

Broker其实就是Kafka的Server。负责集群里的数据存储、消费者的请求，节点的管理等。其中启动时会选举出一个Leader即为Kafka controller，来管理集群和各个Broker rpc通信同步消息以及负责各个topic、partition的副本信息同步。

### Controller



### 消息存储

Kafka的消息以二进制的方式紧凑地存储，节省了很大空间 此外消息存在ByteBuffer而不是堆，这样broker进程挂掉时，数据不会丢失，同时避免了gc问题 通过零拷贝和顺序寻址，让消息存储和读取速度都非常快 处理fetch请求的时候通过zero-copy 加快速度。

### 负载均衡

**分区数量负载**：各台broker的partition数量应该均匀

partition Replica分配算法如下：

将所有Broker（假设共n个Broker）和待分配的Partition排序 将第i个Partition分配到第（i mod n）个Broker上 将第i个Partition的第j个Replica分配到第（(i + j) mod n）个Broker上.

**容量大小负载：**每台broker的硬盘占用大小应该均匀 在kafka1.1之前，Kafka能够保证各台broker上partition数量均匀，但由于每个partition内的消息数不同，可能存在不同硬盘之间内存占用差异大的情况。在Kafka1.1中增加了副本跨路径迁移功能kafka-reassign-partitions.sh，我们可以结合它和监控系统，实现自动化的负载均衡

## Producer 设计原理

### 发送消息的流程

1. **序列化消息&&.计算partition** 

   根据key和value的配置对消息进行序列化,然后计算partition： ProducerRecord对象中如果指定了partition，就使用这个partition。否则根据key和topic的partition数目取余，如果key也没有的话就随机生成一个counter，使用这个counter来和partition数目取余。这个counter每次使用的时候递增。

2. **发送到batch&&唤醒Sender 线程** 

   根据topic-partition获取对应的batchs（Deque），然后将消息append到batch中.如果有batch满了则唤醒Sender 线程。队列的操作是加锁执行，所以batch内消息时有序的。后续的Sender操作当前方法异步操作。

3. **Sender把消息有序发到 broker（tp replia leader）**

   3.1 **确定tp relica leader 所在的broker**

   Kafka中 每台broker都保存了kafka集群的metadata信息，metadata信息里包括了每个topic的所有partition的信息: leader, leader_epoch, controller_epoch, isr, replicas等;Kafka客户端从任一broker都可以获取到需要的metadata信息;sender线程通过metadata信息可以知道tp leader的brokerId producer也保存了metada信息，同时根据metadata更新策略（定期更新metadata.max.age.ms、失效检测，强制更新：检查到metadata失效以后，调用metadata.requestUpdate()强制更新

   3.2 **幂等性发送**

   为实现Producer的幂等性，Kafka引入了Producer ID（即PID）和Sequence Number。对于每个PID，该Producer发送消息的每个<Topic, Partition>都对应一个单调递增的Sequence Number。同样，Broker端也会为每个<PID, Topic, Partition>维护一个序号，并且每Commit一条消息时将其对应序号递增。对于接收的每条消息，如果其序号比Broker维护的序号）大一，则Broker会接受它，否则将其丢弃：

   如果消息序号比Broker维护的序号差值比一大，说明中间有数据尚未写入，即乱序，此时Broker拒绝该消息，Producer抛出InvalidSequenceNumber 如果消息序号小于等于Broker维护的序号，说明该消息已被保存，即为重复消息，Broker直接丢弃该消息，Producer抛出DuplicateSequenceNumber Sender发送失败后会重试，这样可以保证每个消息都被发送到broker

4. **Sender处理broker发来的produce response** 

   一旦broker处理完Sender的produce请求，就会发送produce response给Sender，此时producer将执行我们为send（）设置的回调函数。至此producer的send执行完毕。

### sender线程和长连接

每初始化一个producer实例，都会初始化一个Sender实例，新增到broker的长连接。 代码角度：每初始化一次KafkaProducer，都赋一个空的client。

## Consermer 设计原理

### Consermer Group（消费者组）

`消费者组（Consumer Group）`是由一个或多个消费者实例（Consumer Instance）组成的群组，具有可扩展性和可容错性的一种机制。消费者组内的消费者`共享`一个消费者组ID，这个ID 也叫做 `Group ID`，组内的消费者共同对一个主题进行订阅和消费，同一个组中的消费者只能消费一个分区的消息，多余的消费者会闲置，派不上用场。

kafka保证了同一个消费组中只有一个消费者实例会消费某条消息，实际上，kafka保证的是稳定状态下每一个消费者实例只会消费一个或多个特定partition数据，而某个partition的数据只会被某一特定的consumer实例消费，这样设计的劣势是无法让同一个消费组里的consumer均匀消费，优势是每个consumer不用跟大量的broker通信，减少通信开销，也降低了分配难度。而且，同一个partition数据是有序的，保证了有序被消费。根据consumer group中的consumer数量和partition数量，可以分为以下3种情况：

1. 若consumer group中的consumer数量少于partition数量，则至少有1个consumer会消费多个partition数据
2. 若consumer group中的consumer数量多于partition数量，则会有部分consumer无法消费该topic中任何一条消息
3. 若consumer group中的consumer数量等于partition数量，则正好一个consumer消费一个partition数据

### Consumer Rebalance（分区重平衡）

可以看到，当新的消费者加入消费组，它会消费一个或多个分区，而这些分区之前是由其他消费者负责的；另外，当消费者离开消费组（比如重启、宕机等）时，它所消费的分区会分配给其他分区。这种现象称为**重平衡（rebalance）**。重平衡是 Kafka 一个很重要的性质，这个性质保证了高可用和水平扩展。**不过也需要注意到，在重平衡期间，所有消费者都不能消费消息，因此会造成整个消费组短暂的不可用。**而且，将分区进行重平衡也会导致原来的消费者状态过期，从而导致消费者需要重新更新状态，这段期间也会降低消费性能。后面我们会讨论如何安全的进行重平衡以及如何尽可能避免。

消费者通过定期发送心跳（hearbeat）到一个作为组协调者（group coordinator）的 broker 来保持在消费组内存活。这个 broker 不是固定的，每个消费组都可能不同。当消费者拉取消息或者提交时，便会发送心跳。

如果消费者超过一定时间没有发送心跳，那么它的会话（session）就会过期，组协调者会认为该消费者已经宕机，然后触发重平衡。可以看到，从消费者宕机到会话过期是有一定时间的，这段时间内该消费者的分区都不能进行消息消费；通常情况下，我们可以进行优雅关闭，这样消费者会发送离开的消息到组协调者，这样组协调者可以立即进行重平衡而不需要等待会话过期。

如果过了一段时间 Kafka 停止发送心跳了，会话（Session）就会过期，组织协调者就会认为这个 Consumer 已经死亡，就会触发一次重平衡。如果消费者宕机并且停止发送消息，组织协调者会等待几秒钟，确认它死亡了才会触发重平衡。在这段时间里，**死亡的消费者将不处理任何消息**。在清理消费者时，消费者将通知协调者它要离开群组，组织协调者会触发一次重平衡，尽量降低处理停顿。

重平衡是一把双刃剑，它为消费者群组带来高可用性和伸缩性的同时，还有有一些明显的缺点(bug)，而这些 bug 到现在社区还无法修改。

重平衡的过程对消费者组有极大的影响。因为每次重平衡过程中都会导致万物静止，参考 JVM 中的垃圾回收机制，也就是 Stop The World ，STW

在 0.10.1 版本，Kafka 对心跳机制进行了修改，将发送心跳与拉取消息进行分离，这样使得发送心跳的频率不受拉取的频率影响。另外更高版本的 Kafka 支持配置一个消费者多长时间不拉取消息但仍然保持存活，这个配置可以避免活锁（livelock）。活锁，是指应用没有故障但是由于某些原因不能进一步消费。

### 偏移量

消费者会向一个叫做 `_consumer_offset` 的特殊主题中发送消息，这个主题会保存每次所发送消息中的分区偏移量，这个主题的主要作用就是消费者触发重平衡后记录偏移使用的，消费者每次向这个主题发送消息，正常情况下不触发重平衡，这个主题是不起作用的，当触发重平衡后，消费者停止工作，每个消费者可能会分到对应的分区，这个主题就是让消费者能够继续处理消息所设置的。

如果提交的偏移量小于客户端最后一次处理的偏移量，那么位于两个偏移量之间的消息就会被重复处理

重平衡后，消费者重复消费

如果提交的偏移量大于最后一次消费时的偏移量，那么处于两个偏移量中间的消息将会丢失

重平衡后，消费者丢失数据

既然`_consumer_offset` 如此重要，那么它的提交方式是怎样的呢？下面我们就来说一下。

KafkaConsumer API 提供了多种方式来提交偏移量

- **自动提交**

  > 最简单的方式就是让消费者自动提交偏移量。如果 `enable.auto.commit` 被设置为true，那么每过 5s，消费者会自动把从 poll() 方法轮询到的最大偏移量提交上去。提交时间间隔由 `auto.commit.interval.ms` 控制，默认是 5s。与消费者里的其他东西一样，自动提交也是在轮询中进行的。消费者在每次轮询中会检查是否提交该偏移量了，如果是，那么就会提交从上一次轮询中返回的偏移量。

- **提交当前偏移量**

  > 把 `auto.commit.offset` 设置为 false，可以让应用程序决定何时提交偏移量。使用 `commitSync()` 提交偏移量。这个 API 会提交由 poll() 方法返回的最新偏移量，提交成功后马上返回，如果提交失败就抛出异常。
  >
  > commitSync() 将会提交由 poll() 返回的最新偏移量，如果处理完所有记录后要确保调用了 commitSync()，否则还是会有丢失消息的风险，如果发生了在均衡，从最近一批消息到发生在均衡之间的所有消息都将被重复处理。

- **异步提交**

  > 异步提交 `commitAsync()` 与同步提交 `commitSync()` 最大的区别在于异步提交不会进行重试，同步提交会一致进行重试。

- **同步和异步组合提交**

  > 一般情况下，针对偶尔出现的提交失败，不进行重试不会有太大的问题，因为如果提交失败是因为临时问题导致的，那么后续的提交总会有成功的。但是如果在关闭消费者或再均衡前的最后一次提交，就要确保提交成功。
  >
  > 因此，**在消费者关闭之前一般会组合使用commitAsync和commitSync提交偏移量**。

- **提交特定的偏移量**

  > 消费者API允许调用 commitSync() 和 commitAsync() 方法时传入希望提交的 partition 和 offset 的 map，即提交特定的偏移量。

### 消费模型

消息由生产者发送到kafka集群后，会被消费者消费。一般来说我们的消费模型有两种:推送模型(push)和拉取模型(pull)

- 基于推送模型的消息系统

  由消息代理记录消费状态。消息代理将消息推送到消费者后，标记这条消息为已经被消费，但是这种方式无法很好地保证消费的处理语义。比如当我们把已经把消息发送给消费者之后，由于消费进程挂掉或者由于网络原因没有收到这条消息，如果我们在消费代理将其标记为已消费，这个消息就永久丢失了。如果我们利用生产者收到消息后回复这种方法，消息代理需要记录消费状态，这种不可取。如果采用push，消息消费的速率就完全由消费代理控制，一旦消费者发生阻塞，就会出现问题。

- Kafka采取拉取模型(poll)

  由自己控制消费速度，以及消费的进度，消费者可以按照任意的偏移量进行消费。比如消费者可以消费已经消费过的消息进行重新处理，或者消费最近的消息等等。

## 高可靠分布式存储模型

### 高性能的日志存储

kafka一个topic下面的所有消息都是以partition的方式分布式的存储在多个节点上。同时在kafka的机器上，每个Partition其实都会对应一个日志目录，在目录下面会对应多个日志分段(LogSegment)。LogSegment文件由两部分组成，分别为“.index”文件和“.log”文件，分别表示为segment索引文件和数据文件。这两个文件的命令规则为：partition全局的第一个segment从0开始，后续每个segment文件名为上一个segment文件最后一条消息的offset值，数值大小为64位，20位数字字符长度，没有数字用0填充，如下，假设有1000条消息，每个LogSegment大小为100。

由于kafka消息数据太大，如果全部建立索引，即占了空间又增加了耗时，所以kafka选择了稀疏索引的方式，这样的话索引可以直接进入内存，加快偏查询速度。

简单介绍一下如何读取数据，如果我们要读取第911条数据首先第一步，找到他是属于哪一段的，根据二分法查找到他属于的文件，找到0000900.index和00000900.log之后，然后去index中去查找 (911-900) =11这个索引或者小于11最近的索引,在这里通过二分法我们找到了索引是[10,1367]然后我们通过这条索引的物理位置1367，开始往后找，直到找到911条数据。

上面讲的是如果要找某个offset的流程，但是我们大多数时候并不需要查找某个offset,只需要按照顺序读即可，而在顺序读中，操作系统会对内存和磁盘之间添加page cahe，也就是我们平常见到的预读操作，所以我们的顺序读操作时速度很快。但是kafka有个问题，如果分区过多，那么日志分段也会很多，写的时候由于是批量写，其实就会变成随机写了，随机I/O这个时候对性能影响很大。所以一般来说Kafka不能有太多的partition。针对这一点，RocketMQ把所有的日志都写在一个文件里面，就能变成顺序写，通过一定优化，读也能接近于顺序读。

### Kafka的多副本机制

Kafka的副本机制是多个服务端节点对其他节点的主题分区的日志进行复制。当集群中的某个节点出现故障，访问故障节点的请求会被转移到其他正常节点(这一过程通常叫Reblance),kafka每个主题的每个分区都有一个主副本以及0个或者多个副本，副本保持和主副本的数据同步，当主副本出故障时就会被替代。

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/kafka-replicas.png)

在Kafka中并不是所有的副本都能被拿来替代主副本，所以在kafka的leader节点中维护着一个**ISR(In sync Replicas)**集合，翻译过来也叫正在同步中集合，在这个集合中的需要满足两个条件:

- 节点必须和ZK保持连接
- 在同步的过程中这个副本不能落后主副本太多

另外还有个AR(Assigned Replicas)用来标识副本的全集，OSR用来表示由于落后被剔除的副本集合，所以公式如下:

**ISR = leader + 没有落后太多的副本; **

**AR = OSR+ ISR**

这里先要说下两个名词:HW(高水位)是consumer能够看到的此partition的位置，LEO是每个partition的log最后一条Message的位置。HW能保证leader所在的broker失效，该消息仍然可以从新选举的leader中获取，不会造成消息丢失。

当producer向leader发送数据时，可以通过request.required.acks参数来设置数据可靠性的级别：

- 1（默认）：这意味着producer在ISR中的leader已成功收到的数据并得到确认后发送下一条message。如果leader宕机了，则会丢失数据。
- 0：这意味着producer无需等待来自broker的确认而继续发送下一批消息。这种情况下数据传输效率最高，但是数据可靠性确是最低的。
- -1：producer需要等待ISR中的所有follower都确认接收到数据后才算一次发送完成，可靠性最高。但是这样也不能保证数据不丢失，比如当ISR中只有leader时(其他节点都和zk断开连接，或者都没追上)，这样就变成了acks=1的情况。 

## 工作流程分析

### 发送数据

Producer在写入数据的时候**永远的找leader**，不会直接将数据写入follower！Consumer也是。

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/kafka-producer-send.png)

#### Producer怎么保证数据不丢失

通过ACK应答机制！在生产者向队列写入数据的时候可以设置参数来确定是否确认kafka接收到数据，这个参数可设置的值为**0**、**1**、**-1**。

- 0代表producer往集群发送数据不需要等到集群的返回，不确保消息发送成功。安全性最低但是效率最高。
- 1代表producer往集群发送数据只要leader应答就可以发送下一条，只确保leader发送成功。
- -1代表producer往集群发送数据需要所有的follower都完成从leader的同步才会发送下一条，确保leader发送成功和所有的副本都完成备份。安全性最高，但是效率最低。

最后要注意的是，如果往不存在的topic写数据，能不能写入成功呢？kafka会自动创建topic，分区和副本的数量根据默认配置都是1。

### 保存数据

  Producer将数据写入kafka后，集群就需要对数据进行保存了！kafka将数据保存在磁盘，可能在我们的一般的认知里，写入磁盘是比较耗时的操作，不适合这种高并发的组件。Kafka初始会单独开辟一块磁盘空间，顺序写入数据（效率比随机写入高）。

Partition在服务器上的表现形式就是一个一个的文件夹，每个partition的文件夹下面会有多组segment文件，每组segment文件又包含.index文件、.log文件、.timeindex文件（早期版本中没有）三个文件， log文件就实际是存储message的地方，而index和timeindex文件为索引文件，用于检索消息。

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/kafka-partition-segment.png)

如上图，这个partition有三组segment文件，每个log文件的大小是一样的，但是存储的message数量是不一定相等的（每条的message大小不一致）。文件的命名是以该segment最小offset来命名的，如000.index存储offset为0~368795的消息，kafka就是利用分段+索引的方式来解决查找效率的问题。

**Message结构** 上面说到log文件就实际是存储message的地方，我们在producer往kafka写入的也是一条一条的message，那存储在log中的message是什么样子的呢？消息主要包含消息体、消息大小、offset、压缩类型……等等！我们重点需要知道的是下面三个：

1、 offset：offset是一个占8byte的有序id号，它可以唯一确定每条消息在parition内的位置！

2、 消息大小：消息大小占用4byte，用于描述消息的大小。

3、 消息体：消息体存放的是实际的消息数据（被压缩过），占用的空间根据具体的消息而不一样。

**存储策略** 无论消息是否被消费，kafka都会保存所有的消息。那对于旧数据有什么删除策略呢？

1、 基于时间，默认配置是168小时（7天）。

2、 基于大小，默认配置是1073741824。

需要注意的是，kafka读取特定消息的时间复杂度是O(1)，所以这里删除过期的文件并不会提高kafka的性能！

### 消费数据

多个消费者可以组成一个消费者组（consumer group），每个消费者组都有一个组id！同一个消费组者的消费者可以消费同一topic下不同分区的数据，但是不会组内多个消费者消费同一分区的数据！！！是不是有点绕。我们看下图：

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/kafka-consumer-data.png)

图示是消费者组内的消费者小于partition数量的情况，所以会出现某个消费者消费多个partition数据的情况，消费的速度也就不及只处理一个partition的消费者的处理速度！如果是消费者组的消费者多于partition的数量，那会不会出现多个消费者消费同一个partition的数据呢？上面已经提到过不会出现这种情况！多出来的消费者不消费任何partition的数据。所以在实际的应用中，建议**消费者组的consumer的数量与partition的数量一致**！

### 查找消息

利用segment+offset

假如现在需要查找一个offset为368801的message是什么样的过程呢？

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/kafka-find-data.png)

1、 先找到offset的368801message所在的segment文件（利用二分法查找），这里找到的就是在第二个segment文件。

2、 打开找到的segment中的.index文件（也就是368796.index文件，该文件起始偏移量为368796+1，我们要查找的offset为368801的message在该index内的偏移量为368796+5=368801，所以这里要查找的**相对offset**为5）。由于该文件采用的是稀疏索引的方式存储着相对offset及对应message物理偏移量的关系，所以直接找相对offset为5的索引找不到，这里同样利用二分法查找相对offset小于或者等于指定的相对offset的索引条目中最大的那个相对offset，所以找到的是相对offset为4的这个索引。

3、 根据找到的相对offset为4的索引确定message存储的物理偏移位置为256。打开数据文件，从位置为256的那个地方开始顺序扫描直到找到offset为368801的那条Message。

这套机制是建立在offset为有序的基础上，利用**segment**+**有序offset**+**稀疏索引**+**二分查找**+**顺序查找**等多种手段来高效的查找数据！至此，消费者就能拿到需要处理的数据进行处理了。那每个消费者又是怎么记录自己消费的位置呢？在早期的版本中，消费者将消费到的offset维护zookeeper中，consumer每间隔一段时间上报一次，这里容易导致重复消费，且性能不好！在新的版本中消费者消费到的offset已经直接维护在kafk集群的__consumer_offsets这个topic中！

### 日志文件格式存储

| 名字                 | 含义                                                | 备注     |
| -------------------- | --------------------------------------------------- | -------- |
| 00000000000009475939 | 文件中第一条消息的offset                            |          |
| *.log                | 存储消息实体的文件                                  |          |
| *.index              | 记录消息的offset以及消息在log文件中的position的索引 | 稀疏存储 |
| *.timeindex          | 记录消息的timestamp和offset的索引                   | 稀疏存储 |

使用kafka-run-class工具调用kafka.tools.DumpLogSegments,查看kafka消息落盘后信息。 如下 ：

> /usr/hdp/current/kafka-broker/bin/kafka-run-class.sh kafka.tools.DumpLogSegments --deep-iteration --print-data-log --files ****.log(index,timeindex)

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/kafka-timeindex.png)



## Zookeeper 在 Kafka 中的作用

- 探测broker和consumer的添加或移除。
- 负责维护所有partition的领导者/从属者关系（主分区和备份分区），如果主分区挂了，需要选举出备份分区作为主分区。
- 维护topic、partition等元配置信息

## Kafka 如何保证消息的消费顺序？

没有办法。Kafka 只会保证在 Partition 内消息是有序的，而不管全局的情况。

1. 1 个 Topic 只对应一个 Partition。
2. （推荐）发送消息的时候指定 key/Partition（**业务分片**）。

## Kafka中的消息是否会丢失和重复消费？

要确定Kafka的消息是否丢失或重复，从两个方面分析入手：消息发送和消息消费。

解决办法：

针对消息丢失：

同步模式下，确认机制设置为-1，即让消息写入Leader和Follower之后再确认消息发送成功；

异步模式下，为防止缓冲区满，可以在配置文件设置不限制阻塞超时时间，当缓冲区满时让生产者一直处于阻塞状态；

针对消息重复：将消息的唯一标识保存到外部介质中，每次消费时判断是否处理过即可。

消息重复消费及解决参考：https://www.javazhiyin.com/22910.html

## Kafka 如何保证消息不重复消费？

为了避免消息丢失，我们需要付出两方面的代价：一方面是性能的损耗；一方面可能造成消息重复消费。

从消费的最终结果来看和只消费一次是等同的就好了，也就是保证在消息的生产和消费的过程是“幂等”的。

你可以看到，无论是生产端的幂等性保证方式，还是消费端通用的幂等性保证方式，它们的共同特点都是为每一个消息生成一个唯一的 ID，然后在使用这个消息的时候，先比对这个 ID 是否已经存在，如果存在，则认为消息已经被使用过。

## Kafka 如何保证可靠性？

Kafka 中的可靠性保证有如下四点：

- 对于一个分区来说，它的消息是有序的。如果一个生产者向一个分区先写入消息A，然后写入消息B，那么消费者会先读取消息A再读取消息B。
- 当消息写入所有in-sync状态的副本后，消息才会认为**已提交（committed）**。这里的写入有可能只是写入到文件系统的缓存，不一定刷新到磁盘。生产者可以等待不同时机的确认，比如等待分区主副本写入即返回，后者等待所有in-sync状态副本写入才返回。
- 一旦消息已提交，那么只要有一个副本存活，数据不会丢失。
- 消费者只能读取到已提交的消息。

## Kafka 读写数据

前面讲解到了生产者往topic里丢数据是存在partition上的，而partition持久化到磁盘是IO顺序访问的，并且是先写缓存，隔一段时间或者数据量足够大的时候才批量写入磁盘的。

消费者在读的时候也很有讲究：正常的读磁盘数据是需要将内核态数据拷贝到用户态的，而Kafka 通过调用`sendfile()`直接从内核空间（DMA的）到内核空间（Socket的），**少做了一步拷贝**的操作。

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/kafka-zero-copy.png)



## Kafka 为何如此之快

Kafka 实现了`零拷贝`原理来快速移动数据，避免了内核之间的切换。Kafka 可以将数据记录分批发送，从生产者到文件系统（Kafka 主题日志）到消费者，可以端到端的查看这些批次的数据。

批处理能够进行更有效的数据压缩并减少 I/O 延迟，Kafka 采取顺序写入磁盘的方式，避免了随机磁盘寻址的浪费，更多关于磁盘寻址的了解，请参阅 [程序员需要了解的硬核知识之磁盘](https://mp.weixin.qq.com/s?__biz=MzU2NDg0OTgyMA==&mid=2247484654&idx=1&sn=9b6f5aaad05a49416e8f30e6b86691ae&chksm=fc45f91dcb32700b683b9a13d0d94d261171d346333d73967a4d501de3ecc273d67e8251aeae&token=674527772&lang=zh_CN&scene=21#wechat_redirect)。

总结一下其实就是四个要点

- 顺序读写
- 零拷贝
- 消息压缩
- 分批发送

## Kafka 如何提高消费速率

这个问题就是如何高并发下提升处理能力的问题了。KAFKA本质是拉取模型的消息队列

一般来说有几类

1. 增加分区（题上不让）

2. 关闭autocommit（偏移量手工提交可以按需减少分区偏移量的更新，有利于提升消费速度）

3. 增加单次拉取消息的大小（大量消息的场景下可减少拉取消息的次数）

比较另类的：

1. 如果不考虑数据一致性，可以将key值平均一下，这样每个分区的消息大小都差不多，有利于负载均衡
2. 如果没有开启压缩，最好开启压缩（需要重启集群），可大大提高通信效率，有得消费速度提升 
3. 如果不考虑顺序消息的话：多线程消费


## Kafka producer如何提高写入速率

- 增加线程
- 提高 batch.size
- 增加更多 producer 实例
- 增加 partition 数
- 设置 acks=-1 时，如果延迟增大：可以增大 num.replica.fetchers（follower 同步数据的线程数）来调解；
- 跨数据中心的传输：增加 socket 缓冲区设置以及 OS tcp 缓冲区设置。

## _consumer_offsets里怎么获取对应的consumer group？

[Kafka 如何读取offset topic内容 \(\_\_consumer\_offsets\) \- huxihx \- 博客园](https://www.cnblogs.com/huxi2b/p/6061110.html)



## 配置

### 主题默认配置

Kafka 为新创建的主题提供了很多默认配置参数，下面就来一起认识一下这些参数

- num.partitions

num.partitions 参数指定了新创建的主题需要包含多少个分区。如果启用了主题自动创建功能（该功能是默认启用的），主题分区的个数就是该参数指定的值。该参数的默认值是 1。要注意，我们可以增加主题分区的个数，但不能减少分区的个数。

- default.replication.factor

这个参数比较简单，它表示 kafka保存消息的副本数，如果一个副本失效了，另一个还可以继续提供服务default.replication.factor 的默认值为1，这个参数在你启用了主题自动创建功能后有效。

- log.retention.ms

Kafka 通常根据时间来决定数据可以保留多久。默认使用 log.retention.hours 参数来配置时间，默认是 168 个小时，也就是一周。除此之外，还有两个参数 log.retention.minutes 和 log.retentiion.ms 。这三个参数作用是一样的，都是决定消息多久以后被删除，推荐使用 log.retention.ms。

- log.retention.bytes

另一种保留消息的方式是判断消息是否过期。它的值通过参数 `log.retention.bytes` 来指定，作用在每一个分区上。也就是说，如果有一个包含 8 个分区的主题，并且 log.retention.bytes 被设置为 1GB，那么这个主题最多可以保留 8GB 数据。所以，当主题的分区个数增加时，整个主题可以保留的数据也随之增加。

- log.segment.bytes

上述的日志都是作用在日志片段上，而不是作用在单个消息上。当消息到达 broker 时，它们被追加到分区的当前日志片段上，当日志片段大小到达 log.segment.bytes 指定上限（默认为 1GB）时，当前日志片段就会被关闭，一个新的日志片段被打开。如果一个日志片段被关闭，就开始等待过期。这个参数的值越小，就越会频繁的关闭和分配新文件，从而降低磁盘写入的整体效率。

- log.segment.ms

上面提到日志片段经关闭后需等待过期，那么 `log.segment.ms` 这个参数就是指定日志多长时间被关闭的参数和，log.segment.ms 和 log.retention.bytes 也不存在互斥问题。日志片段会在大小或时间到达上限时被关闭，就看哪个条件先得到满足。

- message.max.bytes

broker 通过设置 `message.max.bytes` 参数来限制单个消息的大小，默认是 1000 000， 也就是 1MB，如果生产者尝试发送的消息超过这个大小，不仅消息不会被接收，还会收到 broker 返回的错误消息。跟其他与字节相关的配置参数一样，该参数指的是压缩后的消息大小，也就是说，只要压缩后的消息小于 mesage.max.bytes，那么消息的实际大小可以大于这个值

这个值对性能有显著的影响。值越大，那么负责处理网络连接和请求的线程就需要花越多的时间来处理这些请求。它还会增加磁盘写入块的大小，从而影响 IO 吞吐量。

- retention.ms

规定了该主题消息被保存的时常，默认是7天，即该主题只能保存7天的消息，一旦设置了这个值，它会覆盖掉 Broker 端的全局参数值。

- retention.bytes

`retention.bytes`：规定了要为该 Topic 预留多大的磁盘空间。和全局参数作用相似，这个值通常在多租户的 Kafka 集群中会有用武之地。当前默认值是 -1，表示可以无限使用磁盘空间。





引用：

[阿里大牛实战归纳——Kafka架构原理](https://mp.weixin.qq.com/s?__biz=MzI0MDQ4MTM5NQ==&mid=2247486549&idx=1&sn=ebd16b294c21db81bae8d7625740baf3&chksm=e91b6949de6ce05f86ace292a6fcbf2cd3fa9fde3d48086e67c0e1109c3726cf0f6754d652dd#rd)

[再过半小时，你就能明白kafka的工作原理了 \- 掘金](https://juejin.im/post/5cf7847cf265da1b6c5f64fb)

[全网最通俗易懂的Kafka入门！ \- 掘金](https://juejin.im/post/5de706d66fb9a0164f292242)

[Kafka—JavaGuide](https://snailclimb.gitee.io/javaguide/#/docs/system-design/data-communication/Kafka%E7%B3%BB%E7%BB%9F%E8%AE%BE%E8%AE%A1%E5%BC%80%E7%AF%87-%E9%9D%A2%E8%AF%95%E7%9C%8B%E8%BF%99%E7%AF%87%E5%B0%B1%E5%A4%9F%E4%BA%86?id=%e4%bd%8d%e7%a7%bb%e7%ae%a1%e7%90%86)

[真的，关于 Kafka 入门看这一篇就够了](https://mp.weixin.qq.com/s/UULQ8V6RgRaSmoH64TEcFQ)

[Kafka 日志存储、清理规则、消息大小估算 \- 简书](https://www.jianshu.com/p/ed1007d81db4)



面试题：

[八年面试生涯，整理了一套Kafka面试题 \- 编辑小猿 \- 博客园](https://www.cnblogs.com/kx33389/p/11182082.html)

[Kafka常见面试题\_大数据\_qq\_28900249的博客\-CSDN博客](https://blog.csdn.net/qq_28900249/article/details/90346599)



