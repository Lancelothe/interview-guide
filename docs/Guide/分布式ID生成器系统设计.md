## 经典方案

[Twitter-雪花算法 twitter\-archive/snowflake: Snowflake is a network service for generating unique ID numbers at high scale with some simple guarantees\.](https://github.com/twitter-archive/snowflake)

[美团/Leaf: Distributed ID Generate Service](https://github.com/Meituan-Dianping/Leaf)

[滴滴/Tinyid: ID Generator id生成器 分布式id生成系统，简单易用、高性能、高可用的id生成系统](https://github.com/didi/tinyid)

[百度/uid\-generator: UniqueID generator](https://github.com/baidu/uid-generator)

[ecp\-uid: 基于美团leaf、百度UidGenerator、原生snowflake 进行整合的 唯一ID生成器](https://gitee.com/zmds/ecp-uid)

---

## snowflake算法

> snowflake是Twitter开源的分布式ID生成算法，结果是一个long型的ID。其核心思想是：使用41bit作为毫秒数，10bit作为机器的ID（5个bit是数据中心，5个bit的机器ID），12bit作为毫秒内的流水号（意味着每个节点在每毫秒可以产生 4096 个 ID），最后还有一个符号位，永远是0。

![snowflake](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/snowflake.png)

**①1 bit：是不用的，为啥呢？** 

因为二进制里第一个 bit 为如果是 1，那么都是负数，但是我们生成的 id 都是正数，所以第一个 bit 统一都是 0。

**②41 bit：表示的是时间戳，单位是毫秒。**

41 bit 可以表示的数字多达 2^41 - 1，也就是可以标识 2 ^ 41 - 1 个毫秒值，换算成年就是表示 69 年的时间。

**③10 bit：记录工作机器 id，代表的是这个服务最多可以部署在 2^10 台机器上，也就是 1024 台机器。**

但是 10 bit 里 5 个 bit 代表机房 id，5 个 bit 代表机器 id。意思就是最多代表 2 ^ 5 个机房（32 个机房），每个机房里可以代表 2 ^ 5 个机器（32 台机器），也可以根据自己公司的实际情况确定。

**④12 bit：这个是用来记录同一个毫秒内产生的不同 id。**

12 bit 可以代表的最大正整数是 2 ^ 12 - 1 = 4096，也就是说可以用这个 12 bit 代表的数字来区分同一个毫秒内的 4096 个不同的 id。

**优点：**

- 快（哈哈，天下武功唯快不破）。
- 没有啥依赖，实现也特别简单。
- 知道原理之后可以根据实际情况调整各各位段，方便灵活。

**缺点：**

- 只能趋势递增。（有些也不叫缺点，网上有些如果绝对递增，竞争对手中午下单，第二天在下单即可大概判断该公司的订单量，危险！！！）
- 依赖机器时间，如果发生回拨会导致可能生成id重复。 **时间回拨问题。**

[雪花算法的原理和实现Java\_雨夜青草的博客\-CSDN博客\_雪花算法](https://blog.csdn.net/lq18050010830/article/details/89845790)

[全局唯一iD的生成 雪花算法详解及其他用法 \- 阿圆这个程序媛 \- 博客园](https://www.cnblogs.com/chaos-li/p/11302820.html)

[分布式id雪花算法生成器：彻底解决雪花算法时间回拨问题\_wangzhipeng47的博客\-CSDN博客\_同一台机器多个节点雪花算法解决方案](https://blog.csdn.net/wangzhipeng47/article/details/106736048/)

---

## 美团（Leaf）

[Leaf——美团点评分布式ID生成系统 \- 美团技术团队](https://tech.meituan.com/2017/04/21/mt-leaf.html)

Leaf 提供两种生成的ID的方式（号段模式和snowflake模式），你可以同时开启两种方式，也可以指定开启某种方式（默认两种方式为关闭状态）。

### Leaf-segment数据库方案

在使用数据库的方案上，做了如下改变： - 原方案每次获取ID都得读写一次数据库，造成数据库压力大。改为利用proxy server批量获取，每次获取一个segment(step决定大小)号段的值。用完之后再去数据库获取新的号段，可以大大的减轻数据库的压力。 - 各个业务不同的发号需求用biz_tag字段来区分，每个biz-tag的ID获取相互隔离，互不影响。如果以后有性能需求需要对数据库扩容，不需要上述描述的复杂的扩容操作，只需要对biz_tag分库分表就行。

#### 双buffer优化

对于第二个缺点，Leaf-segment做了一些优化，简单的说就是：

Leaf 取号段的时机是在号段消耗完的时候进行的，也就意味着号段临界点的ID下发时间取决于下一次从DB取回号段的时间，并且在这期间进来的请求也会因为DB号段没有取回来，导致线程阻塞。如果请求DB的网络和DB的性能稳定，这种情况对系统的影响是不大的，但是假如取DB的时候网络发生抖动，或者DB发生慢查询就会导致整个系统的响应时间变慢。

为此，我们希望DB取号段的过程能够做到无阻塞，不需要在DB取号段的时候阻塞请求线程，即当号段消费到某个点时就异步的把下一个号段加载到内存中。而不需要等到号段用尽的时候才去更新号段。这样做就可以很大程度上的降低系统的TP999指标。详细实现如下图所示：

![image](https://awps-assets.meituan.net/mit-x/blog-images-bundle-2017/f2625fac.png)

采用双buffer的方式，Leaf服务内部有两个号段缓存区segment。当前号段已下发10%时，如果下一个号段未更新，则另启一个更新线程去更新下一个号段。当前号段全部下发完后，如果下个号段准备好了则切换到下个号段为当前segment接着下发，循环往复。

- 每个biz-tag都有消费速度监控，通常推荐segment长度设置为服务高峰期发号QPS的600倍（10分钟），这样即使DB宕机，Leaf仍能持续发号10-20分钟不受影响。
- 每次请求来临时都会判断下个号段的状态，从而更新此号段，所以偶尔的网络抖动不会影响下个号段的更新。

#### Leaf高可用容灾

对于第三点“DB可用性”问题，我们目前采用一主两从的方式，同时分机房部署，Master和Slave之间采用**半同步方式[5]**同步数据。同时使用公司Atlas数据库中间件(已开源，改名为[DBProxy](http://tech.meituan.com/dbproxy-introduction.html))做主从切换。当然这种方案在一些情况会退化成异步模式，甚至在**非常极端**情况下仍然会造成数据不一致的情况，但是出现的概率非常小。如果你的系统要保证100%的数据强一致，可以选择使用“类Paxos算法”实现的强一致MySQL方案，如MySQL 5.7前段时间刚刚GA的[MySQL Group Replication](https://dev.mysql.com/doc/refman/5.7/en/group-replication.html)。但是运维成本和精力都会相应的增加，根据实际情况选型即可。

![image](https://awps-assets.meituan.net/mit-x/blog-images-bundle-2017/0de883dd.png)



同时Leaf服务分IDC部署，内部的服务化框架是“MTthrift RPC”。服务调用的时候，根据负载均衡算法会优先调用同机房的Leaf服务。在该IDC内Leaf服务不可用的时候才会选择其他机房的Leaf服务。同时服务治理平台OCTO还提供了针对服务的过载保护、一键截流、动态流量分配等对服务的保护措施。

Leaf-segment方案可以生成趋势递增的ID，同时ID号是可计算的，不适用于订单ID生成场景，比如竞对在两天中午12点分别下单，通过订单id号相减就能大致计算出公司一天的订单量，这个是不能忍受的。面对这一问题，我们提供了 Leaf-snowflake方案。

### Leaf-snowflake方案

Leaf-snowflake方案完全沿用snowflake方案的bit位设计，即是“1+41+10+12”的方式组装ID号。对于workerID的分配，当服务集群数量较小的情况下，完全可以手动配置。Leaf服务规模较大，动手配置成本太高。所以使用Zookeeper持久顺序节点的特性自动对snowflake节点配置wokerID。Leaf-snowflake是按照下面几个步骤启动的：

1. 启动Leaf-snowflake服务，连接Zookeeper，在leaf_forever父节点下检查自己是否已经注册过（是否有该顺序子节点）。
2. 如果有注册过直接取回自己的workerID（zk顺序节点生成的int类型ID号），启动服务。
3. 如果没有注册过，就在该父节点下面创建一个持久顺序节点，创建成功后取回顺序号当做自己的workerID号，启动服务。

![image](https://awps-assets.meituan.net/mit-x/blog-images-bundle-2017/a3f985a8.png)

#### 弱依赖ZooKeeper

除了每次会去ZK拿数据以外，也会在本机文件系统上缓存一个workerID文件。当ZooKeeper出现问题，恰好机器出现问题需要重启时，能保证服务能够正常启动。这样做到了对三方组件的弱依赖。一定程度上提高了SLA

#### 解决时钟问题

因为这种方案依赖时间，如果机器的时钟发生了回拨，那么就会有可能生成重复的ID号，需要解决时钟回退的问题。

![image](https://awps-assets.meituan.net/mit-x/blog-images-bundle-2017/1453b4e9.png)

参见上图整个启动流程图，服务启动时首先检查自己是否写过ZooKeeper leaf_forever节点：

1. 若写过，则用自身系统时间与leaf_forever/\${self}节点记录时间做比较，若小于leaf_forever/${self}时间则认为机器时间发生了大步长回拨，服务启动失败并报警。
2. 若未写过，证明是新服务节点，直接创建持久节点leaf_forever/${self}并写入自身系统时间，接下来综合对比其余Leaf节点的系统时间来判断自身系统时间是否准确，具体做法是取leaf_temporary下的所有临时节点(所有运行中的Leaf-snowflake节点)的服务IP：Port，然后通过RPC请求得到所有节点的系统时间，计算sum(time)/nodeSize。
3. 若abs( 系统时间-sum(time)/nodeSize ) < 阈值，认为当前系统时间准确，正常启动服务，同时写临时节点leaf_temporary/${self} 维持租约。
4. 否则认为本机系统时间发生大步长偏移，启动失败并报警。
5. 每隔一段时间(3s)上报自身系统时间写入leaf_forever/${self}。

由于强依赖时钟，对时间的要求比较敏感，在机器工作时NTP同步也会造成秒级别的回退，建议可以直接关闭NTP同步。要么在时钟回拨的时候直接不提供服务直接返回ERROR_CODE，等时钟追上即可。

### 部署

[9种分布式ID生成之 美团（Leaf）实战 \- 程序员内点事 \- 博客园](https://www.cnblogs.com/chengxy-nds/p/12377352.html)

---

## 滴滴（Tinyid）

### 原理

- tinyid是基于数据库发号算法实现的，简单来说是数据库中保存了可用的id号段，tinyid会将可用号段加载到内存中，之后生成id会直接内存中产生。
- 可用号段在第一次获取id时加载，如当前号段使用达到一定量时，会异步加载下一可用号段，保证内存中始终有可用号段。
- (如可用号段1\~1000被加载到内存，则获取id时，会从1开始递增获取，当使用到一定百分比时，如20%(默认)，即200时，会异步加载下一可用号段到内存，假设新加载的号段是1001\~2000,则此时内存中可用号段为200\~1000,1001\~2000)，当id递增到1000时，当前号段使用完毕，下一号段会替换为当前号段。依次类推。

### 优化办法

- 双号段缓存
- 增加多db支持
- 增加tinyid-client

### tinyid最终架构

![tinyid](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/tinyid.png)

### 部署

[滴滴开源千万级并发的分布式ID生成器 \- 云\+社区 \- 腾讯云](https://cloud.tencent.com/developer/news/563106)

[滴滴开源千万级并发的分布式ID生成器 Tinyid \- 知乎](https://zhuanlan.zhihu.com/p/98657689)

[分布式ID生成方案（五）：SpringBoot2\.X集成滴滴Tinyid\_Dream it Possible\-CSDN博客\_springboot集成tinyid](https://blog.csdn.net/hu_zhiting/article/details/105679360)

---

## 百度（uid-generator）

[百度开源分布式id生成器uid\-generator源码剖析 \- Ye\_yang \- 博客园](https://www.cnblogs.com/yeyang/p/10226284.html)

[UidGenerator](https://github.com/baidu/uid-generator) 是 Java 实现的，基于 Snowflake 算法的唯一 ID 生成器。UidGenerator 以组件形式工作在应用项目中，支持自定义 workerId 位数和初始化策略，从而适用于 [docker](https://www.docker.com/) 等虚拟化环境下实例自动重启、漂移等场景。 在实现上，UidGenerator 通过借用未来时间来解决 sequence 天然存在的并发限制；采用 RingBuffer 来缓存已生成的 UID，并行化 UID 的生产和消费，同时对 CacheLine 补齐，避免了由 RingBuffer 带来的硬件级「伪共享」问题。最终单机 QPS 可达 600 万。

与原始的snowflake算法不同，uid-generator支持自定义时间戳、工作机器id和序列号等各部分的位数，以应用于不同场景。默认分配方式如下。

- sign(1bit)
  固定1bit符号标识，即生成的UID为正数。
- delta seconds (28 bits)
  当前时间，相对于时间基点"2016-05-20"的增量值，单位：秒，**最多可支持约8.7年（<span style="color:#C00000">注意：1. 这里的单位是秒，而不是毫秒！</span> 2.注意这里的用词，是“最多”可支持8.7年，为什么是“最多”，后面会讲）**
- worker id (22 bits)
  机器id，最多可支持约420w次机器启动。内置实现为在启动时由数据库分配，默认分配策略为用后即弃，后续可提供复用策略。
- sequence (13 bits)
  每秒下的并发序列，13 bits可支持每秒8192个并发。**（注意下这个地方，默认支持qps最大为8192个）**

### DefaultUidGenerator

DefaultUidGenerator的产生id的方法与基本上就是常见的snowflake算法实现，仅有一些不同，如以秒为为单位而不是毫秒。

### CachedUidGenerator

CachedUidGenerator支持缓存生成的id。

#### 【采用RingBuffer来缓存已生成的UID, 并行化UID的生产和消费】

使用RingBuffer缓存生成的id。RingBuffer是个环形数组，默认大小为8192个，里面缓存着生成的id。

##### 获取id

会从ringbuffer中拿一个id，支持并发获取

##### 填充id

RingBuffer填充时机

- 程序启动时，将RingBuffer填充满，缓存着8192个id
- 在调用getUID()获取id时，检测到RingBuffer中的剩余id个数小于总个数的50%，将RingBuffer填充满，使其缓存8192个id
- 定时填充（可配置是否使用以及定时任务的周期）

#### 【UidGenerator通过借用未来时间来解决sequence天然存在的并发限制】

因为delta seconds部分是以秒为单位的，所以1个worker 1秒内最多生成的id书为8192个（2的13次方）。

从上可知，支持的最大qps为8192，所以通过缓存id来提高吞吐量。

<div style="color:#C00000; font-weight:bold">为什么叫借助未来时间？</br>
  因为每秒最多生成8192个id，当1秒获取id数多于8192时，RingBuffer中的id很快消耗完毕，在填充RingBuffer时，生成的id的delta seconds 部分只能使用未来的时间。</br>
（因为使用了未来的时间来生成id，所以上面说的是，【最多】可支持约8.7年）
</div>

#### RingBuffer缓存已生成的id

（注意：这里的RingBuffer不是Disruptor框架中的RingBuffer，但是借助了很多Disruptor中RingBuffer的设计思想，比如使用缓存行填充解决伪共享问题）

CachedUidGenerator采用了双RingBuffer，Uid-RingBuffer用于存储Uid、Flag-RingBuffer用于存储Uid状态(是否可填充、是否可消费)

RingBuffer环形数组，数组每个元素成为一个slot。RingBuffer容量，默认为Snowflake算法中sequence最大值，且为2^N。可通过`boostPower`配置进行扩容，以提高RingBuffer 读写吞吐量。

Tail指针、Cursor指针用于环形数组上读写slot：

- Tail指针
  表示Producer生产的最大序号(此序号从0开始，持续递增)。Tail不能超过Cursor，即生产者不能覆盖未消费的slot。当Tail已赶上curosr，此时可通过`rejectedPutBufferHandler`指定PutRejectPolicy

- Cursor指针
  表示Consumer消费到的最小序号(序号序列与Producer序列相同)。Cursor不能超过Tail，即不能消费未生产的slot。当Cursor已赶上tail，此时可通过`rejectedTakeBufferHandler`指定TakeRejectPolicy

  ![uid-generator-ringbuffer](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/uid-generator-ringbuffer.png)

由于数组元素在内存中是连续分配的，可最大程度利用CPU cache以提升性能。但同时会带来「伪共享」FalseSharing问题，为此在Tail、Cursor指针、Flag-RingBuffer中采用了CacheLine 补齐方式。

#### RingBuffer填充时机

- 初始化预填充
  RingBuffer初始化时，预先填充满整个RingBuffer.
- 即时填充
  Take消费时，即时检查剩余可用slot量(`tail` - `cursor`)，如小于设定阈值，则补全空闲slots。阈值可通过`paddingFactor`来进行配置，请参考Quick Start中CachedUidGenerator配置
- 周期填充
  通过Schedule线程，定时补全空闲slots。可通过`scheduleInterval`配置，以应用定时填充功能，并指定Schedule时间间隔

### 部署

[UidGenerator springboot2集成篇 \- 沉默的背影 \- 博客园](https://www.cnblogs.com/zxporz/p/11668615.html)

---

## 其他

- UUID

  生成一个长度32位的全局唯一识别码。

  无序的UUID会导致入库性能变差。

- 数据库自增主键
- 数据库多主模式
- 号段模式
- Redis生成自增ID
  - 优点：整体吞吐量比数据库要高。
  - 缺点：Redis实例或集群宕机后，找回最新的ID值有点困难。

[一口气说出 9种 分布式ID生成方式，面试官有点懵了](https://mp.weixin.qq.com/s?__biz=MzAxNTM4NzAyNg==&mid=2247483785&idx=1&sn=8b828a8ae1701b810fe3969be536cb14&chksm=9b859174acf21862f0b95e0502a1a441c496a5488f5466b2e147d7bb9de072bde37c4db25d7a&token=745402269&lang=zh_CN#rd)

