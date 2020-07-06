## 基础结构

### Redis 常用的结构

[Redis 设计与实现（第一版） — Redis 设计与实现](https://redisbook.readthedocs.io/en/latest/index.html)

> 查看底层数据编码命令
>
> OBJECT ENCODING  <key>

### Hash的底层实现

`REDIS_HASH` （哈希表）是 [HSET](http://redis.readthedocs.org/en/latest/hash/hset.html#hset) 、 [HLEN](http://redis.readthedocs.org/en/latest/hash/hlen.html#hlen) 等命令的操作对象， 它使用 `REDIS_ENCODING_ZIPLIST` 和 `REDIS_ENCODING_HT` 两种编码方式，即对应的`ziplist`和`dict`两个结构，但是只会使用其中的一种，在满足一些条件时会从`ziplist`转换为`dict`

- `REDIS_ENCODING_ZIPLIST`: 

程序通过将键和值一同推入压缩列表， 从而形成保存哈希表所需的键-值对结构。

新添加的 key-value 对会被添加到压缩列表的表尾。

当进行查找/删除或更新操作时，程序先定位到键的位置，然后再通过对键的位置来定位值的位置。

- `REDIS_ENCODING_HT`:

创建空白哈希表时， 程序默认使用 `REDIS_ENCODING_ZIPLIST` 编码，当满足下面任意一个条件时，编码转化为`REDIS_ENCODING_HT`。

1. 哈希表中某个键或某个值的长度大于 `server.hash_max_ziplist_value` （默认值为 `64` ）。
2. 压缩列表中的节点数量大于 `server.hash_max_ziplist_entries` （默认值为 `512` ）。

### zset的底层实现

`REDIS_ZSET` （有序集）是 [ZADD](http://redis.readthedocs.org/en/latest/sorted_set/zadd.html#zadd) 、 [ZCOUNT](http://redis.readthedocs.org/en/latest/sorted_set/zcount.html#zcount) 等命令的操作对象， 它使用 `REDIS_ENCODING_ZIPLIST` 和 `REDIS_ENCODING_SKIPLIST` 两种方式编码，即对应的`ziplist`和`skiplist`两个结构，其中`skiplist`又是用`dict`和`zskiplist`组成。

#### 编码选择

在通过 [ZADD](http://redis.readthedocs.org/en/latest/sorted_set/zadd.html#zadd) 命令添加第一个元素到空 `key` 时， 程序通过检查输入的第一个元素来决定该创建什么编码的有序集。

如果第一个元素符合以下条件的话， 就创建一个 `REDIS_ENCODING_ZIPLIST` 编码的有序集：

- 服务器属性 `server.zset_max_ziplist_entries` 的值大于 `0` （默认为 `128` ）。
- 元素的 `member` 长度小于服务器属性 `server.zset_max_ziplist_value` 的值（默认为 `64` ）。

否则，程序就创建一个 `REDIS_ENCODING_SKIPLIST` 编码的有序集。

#### ZIPLIST 编码的有序集

当使用 `REDIS_ENCODING_ZIPLIST` 编码时， 有序集将元素保存到 `ziplist` 数据结构里面。

其中，每个有序集元素以两个相邻的 `ziplist` 节点表示， 第一个节点保存元素的 `member` 域， 第二个元素保存元素的 `score` 域。

多个元素之间按 `score` 值从小到大排序， 如果两个元素的 `score` 相同， 那么按字典序对 `member` 进行对比， 决定那个元素排在前面， 那个元素排在后面。

```
          |<--  element 1 -->|<--  element 2 -->|<--   .......   -->|

+---------+---------+--------+---------+--------+---------+---------+---------+
| ZIPLIST |         |        |         |        |         |         | ZIPLIST |
| ENTRY   | member1 | score1 | member2 | score2 |   ...   |   ...   | ENTRY   |
| HEAD    |         |        |         |        |         |         | END     |
+---------+---------+--------+---------+--------+---------+---------+---------+

score1 <= score2 <= ...
```

虽然元素是按 `score` 域有序排序的， 但对 `ziplist` 的节点指针只能线性地移动， 所以在 `REDIS_ENCODING_ZIPLIST` 编码的有序集中， 查找某个给定元素的复杂度为 O(N)O(N) 。

每次执行添加/删除/更新操作都需要执行一次查找元素的操作， 因此这些函数的复杂度都不低于 O(N)O(N) ， 至于这些操作的实际复杂度， 取决于它们底层所执行的 `ziplist` 操作。

#### SKIPLIST 编码的有序集

当使用 `REDIS_ENCODING_SKIPLIST` 编码时， 有序集元素由 `redis.h/zset` 结构来保存：

```
/*
 * 有序集
 */
typedef struct zset {

    // 字典
    dict *dict;

    // 跳跃表
    zskiplist *zsl;

} zset;
```

`zset` 同时使用字典和跳跃表两个数据结构来保存有序集元素。

其中， 元素的成员由一个 `redisObject` 结构表示， 而元素的 `score` 则是一个 `double` 类型的浮点数， 字典和跳跃表两个结构通过将指针共同指向这两个值来节约空间 （不用每个元素都复制两份）。

下图展示了一个 `REDIS_ENCODING_SKIPLIST` 编码的有序集：

![](https://redisbook.readthedocs.io/en/latest/_images/graphviz-66d218f87c15bc835d88c696af175d2ba39ae420.svg)

通过使用字典结构， 并将 `member` 作为键， `score` 作为值， 有序集可以在 O(1) 复杂度内：

- 检查给定 `member` 是否存在于有序集（被很多底层函数使用）；
- 取出 `member` 对应的 `score` 值（实现 [ZSCORE](http://redis.readthedocs.org/en/latest/sorted_set/zscore.html#zscore) 命令）。

另一方面， 通过使用跳跃表， 可以让有序集支持以下两种操作：

- 在 O(log⁡N) 期望时间、 O(N) 最坏时间内根据 `score` 对 `member` 进行定位（被很多底层函数使用）；
- 范围性查找和处理操作，这是（高效地）实现 [ZRANGE](http://redis.readthedocs.org/en/latest/sorted_set/zrange.html#zrange) 、 [ZRANK](http://redis.readthedocs.org/en/latest/sorted_set/zrank.html#zrank) 和 [ZINTERSTORE](http://redis.readthedocs.org/en/latest/sorted_set/zinterstore.html#zinterstore) 等命令的关键。

通过同时使用字典和跳跃表， 有序集可以高效地实现按成员查找和按顺序查找两种操作。

### 跳跃列表的实现

![](https://user-gold-cdn.xitu.io/2018/7/27/164d9f96ed4e1a0d?w=1457&h=273&f=png&s=24714)

### 随机层数

对于每一个新插入的节点，都需要调用一个随机算法给它分配一个合理的层数。直观上期望的目标是 50% 的 Level1，25% 的 Level2，12.5% 的 Level3，一直到最顶层`2^-63`，因为这里每一层的晋升概率是 50%。

```c
/* Returns a random level for the new skiplist node we are going to create.
 * The return value of this function is between 1 and ZSKIPLIST_MAXLEVEL
 * (both inclusive), with a powerlaw-alike distribution where higher
 * levels are less likely to be returned. */
int zslRandomLevel(void) {
    int level = 1;
    while ((random()&0xFFFF) < (ZSKIPLIST_P * 0xFFFF))
        level += 1;
    return (level<ZSKIPLIST_MAXLEVEL) ? level : ZSKIPLIST_MAXLEVEL;
}
```

不过 Redis 标准源码中的晋升概率只有 25%，也就是代码中的 ZSKIPLIST_P 的值。所以官方的跳跃列表更加的扁平化，层高相对较低，在单个层上需要遍历的节点数量会稍多一点。

也正是因为层数一般不高，所以遍历的时候从顶层开始往下遍历会非常浪费。跳跃列表会记录一下当前的最高层数`maxLevel`，遍历时从这个 maxLevel 开始遍历性能就会提高很多。

跳跃表节点的level数组可以包含多个元素，每个元素都包含一个指向其他节点的指针，程序可以通过这些层来加快访问其他节点的速度，一般来说，层的数量越多，访问其他节点的速度就越快。

  每次创建一个新跳跃表节点的时候，程序根据**幂次定律(power law，越大的数出现的概率越小)**随机生成一个介于1和32之间的值作为level数组的大小，这个大小就是层的“高度”。

  下图分别展示了三个高度为1层、3层和5层的节点，因为C语言的数组索引总是从0开始的，所以节点的第一层是level[0]，而第二层是level[1]，依次类推。
![redis-level](http://image-hosting-lan.oss-cn-beijing.aliyuncs.com/redis-high.png)

### redis为什么采用跳表而不是红黑树

- 在做范围查找的时候，平衡树比skiplist操作要复杂。

- 平衡树需要以中序遍历的顺序继续寻找其它不超过大值的节点。

- skiplist进行范围查找非常简单，只需要在找到小值之后，对第1层链表进行若干步的遍历就可以实现。

- 平衡树的插入和删除操作可能引发子树的调整，逻辑复杂，而skiplist的插入和删除只需要修改相邻节点的指针，操作简单又快速。

- skiplist需要更少的指针内存。平均每个节点包含1.33个指针，比平衡树更有优势。

- 从算法实现难度上来比较，skiplist比平衡树要简单得多。

  

  [为啥 redis 使用跳表\(skiplist\)而不是使用 red\-black？ \- 知乎](https://www.zhihu.com/question/20202931)

  [redis——为什么选择了跳表而不是红黑树？\_数据库\_hebtu666\-CSDN博客](https://blog.csdn.net/hebtu666/article/details/102556064)



## 缓存淘汰策略

采用了 `定期删除`+`惰性删除` 的策略

Redis 内存淘汰的机制有以下几种方案可供选择：

- volatile-lru：从设置过期的数据集中淘汰最近最少使用的 key
- allkeys-lru：从所有的数据集中淘汰最近最少使用的key
- **volatile-lfu：从设置过期的数据集中淘汰最不常使用的 key**
- **allkeys-lfu：从所有的数据集中淘汰最不常使用的key**
- volatile-random：从设置过期的数据集中随机选取 key 淘汰
- allkyes-random：从所有的数据集中随机选取key淘汰
- volatile-ttl：从设置过期的数据集中淘汰即将过期的 key
- no-envicition：不进行淘汰，只是返回一个写操作错误，读和删除动作正常

## 缓存雪崩、缓存穿透、缓存击穿

### 缓存穿透

缓存穿透是指查询一个一定不存在的数据，由于缓存是不命中时被动写的，并且出于容错考虑，如果从存储层查不到数据则不写入缓存，这将导致这个不存在的数据每次请求都要到存储层去查询，失去了缓存的意义。在流量大时，可能DB就挂掉了，要是有人利用不存在的key频繁攻击我们的应用，这就是漏洞。

> 有很多种方法可以有效地解决缓存穿透问题。
>
> 1. 最常见的则是采用布隆过滤器，将所有可能存在的数据哈希到一个足够大的bitmap中，一个一定不存在的数据会被 这个bitmap拦截掉，从而避免了对底层存储系统的查询压力。另外也有一个更为简单粗暴的方法（我们采用的就是这种），如果一个查询返回的数据为空（不管是数 据不存在，还是系统故障），我们仍然把这个空结果进行缓存，但它的过期时间会很短，最长不超过五分钟；
> 2. 加强参数校验；
> 3. 对不存在值存储空值；

### 缓存雪崩

缓存雪崩是指在我们设置缓存时采用了相同的过期时间，导致缓存在某一时刻同时失效，请求全部转发到DB，DB瞬时压力过重雪崩。

> 缓存失效时的雪崩效应对底层系统的冲击非常可怕。大多数系统设计者考虑用加锁或者队列的方式保证缓存的单线程(进程)写，从而避免失效时大量的并发请求落到底层存储系统上。这里分享一个简单方案就是将缓存失效时间分散开，比如我们可以在原有的失效时间基础上增加一个随机值，比如1-5分钟随机，这样每一个缓存的过期时间的重复率就会降低，就很难引发集体失效的事件。

### 缓存击穿

对于一些设置了过期时间的key，如果这些key可能会在某些时间点被超高并发地访问，是一种非常“热点”的数据。这个时候，需要考虑一个问题：缓存被“击穿”的问题，**这个和缓存雪崩的区别在于这里针对某一key缓存，前者则是很多key。** 缓存在某个时间点过期的时候，恰好在这个时间点对这个Key有大量的并发请求过来，这些请求发现缓存过期一般都会从后端DB加载数据并回设到缓存，这个时候大并发的请求可能会瞬间把后端DB压垮。

> 1. 使用互斥锁(MUTEX KEY)
>    业界比较常用的做法，是使用mutex。简单地来说，就是在缓存失效的时候（判断拿出来的值为空），不是立即去load db，而是先使用缓存工具的某些带成功操作返回值的操作（比如Redis的SETNX或者Memcache的ADD）去set一个mutex key，当操作返回成功时，再进行load db的操作并回设缓存；否则，就重试整个get缓存的方法。
> 2. “提前”使用互斥锁(MUTEX KEY)
>    在value内部设置1个超时值(timeout1), timeout1比实际的memcache timeout(timeout2)小。当从cache读取到timeout1发现它已经过期时候，马上延长timeout1并重新设置到cache。然后再从数据库加载数据并设置到cache中。
> 3. “永远不过期”
>    这里的“永远不过期”包含两层意思： (1) 从redis上看，确实没有设置过期时间，这就保证了，不会出现热点key过期问题，也就是“物理”不过期。 (2) 从功能上看，如果不过期，那不就成静态的了吗？所以我们把过期时间存在key对应的value里，如果发现要过期了，通过一个后台的异步线程进行缓存的构建，也就是“逻辑”过期

## Redis为什么快？

单线程为什么就快了？

- 纯内存
- 单线程（原子性、避免线程切换浪费资源）
- IO多路复用
- 合理的数据结构（dict）

[Redis为什么是单线程，高并发快的3大原因详解 \- 知乎](https://zhuanlan.zhihu.com/p/58038188)

[IO多路复用和线程池哪个效率更高，更有优势\_Java\_snoweaglelord的博客\-CSDN博客](https://blog.csdn.net/snoweaglelord/article/details/99681179)

[IO多路复用和线程池在提高并发性上应用场景的区别 \- 简书](https://www.jianshu.com/p/edd811de19b8)

[IO多路复用和线程池哪个效率更高，更有优势？ \- 知乎](https://www.zhihu.com/question/306267779/answer/570147888)

## 分布式锁

### Redis如何实现分布式锁

- setnx

- ```text
  // NX是指如果key不存在就成功，key存在返回false，PX可以指定过期时间 
  SET anyLock unique_value NX PX 30000
  ```

- Lua脚本

- 开源框架：Redission、RedLock

  ```
  RedissonClient redisson = Redisson.create(config); 
  RLock lock = redisson.getLock("anyLock");  // RLock是可重入锁
  lock.lock(); 
  lock.unlock(); 
  
  ---
  就是这么简单，我们只需要通过它的 API 中的 Lock 和 Unlock 即可完成分布式锁，他帮我们考虑了很多细节：
  
  Redisson 所有指令都通过 Lua 脚本执行，Redis 支持 Lua 脚本原子性执行。
  Redisson 设置一个 Key 的默认过期时间为 30s，如果某个客户端持有一个锁超过了 30s 怎么办？
  Redisson 中有一个 Watchdog 的概念，翻译过来就是看门狗，它会在你获取锁之后，每隔 10s 帮你把 Key 的超时时间设为 30s。
  这样的话，就算一直持有锁也不会出现 Key 过期了，其他线程获取到锁的问题了。
  
  Redisson 的“看门狗”逻辑保证了没有死锁发生。(如果机器宕机了，看门狗也就没了。此时就不会延长 Key 的过期时间，到了 30s 之后就会自动过期了，其他线程可以获取到锁)
  
  在redis中加锁有两种思路。
  一种是设置key的值，并且不对key设置过期时间。这种情况下如果加锁的线程在没有解锁之前崩溃了，那么这个锁会出现死锁的状态。
  另外一种是设置key的值，并且对key设置过期时间。这种情况下如果加锁的线程在没有解锁之前崩溃了，那么这个锁在过期时间之后自然解锁，不会发生死锁的现象。但是这样也引入了另外一个问题，如果加锁的线程在过期时间之内没有完成操作，这时候锁就会被另外的线程获取，从而发生同时有两个线程同时在临界区运行的状况。为了避免这种情况发生，Redisson内部提供了一个监控锁的看门狗，它的作用是在Redisson实例被关闭前，不断的延长锁的有效期。默认情况下，看门狗的检查锁的超时时间是30秒钟，也可以通过修改Config.lockWatchdogTimeout来另行指定。
  ```

  [Redisson分布式锁的实现 \| wangqi的blog](https://blog.wangqi.love/articles/redis/Redisson%E5%88%86%E5%B8%83%E5%BC%8F%E9%94%81%E7%9A%84%E5%AE%9E%E7%8E%B0.html)

  

### zk如何实现分布式锁

在 ZooKeeper 中，节点类型可以分为持久节点（PERSISTENT ）、临时节点（EPHEMERAL），以及时序节点（SEQUENTIAL ），具体在节点创建过程中，一般是组合使用，可以生成 4 种节点类型：持久节点（PERSISTENT），持久顺序节点（PERSISTENT_SEQUENTIAL），临时节点（EPHEMERAL），临时顺序节点（EPHEMERAL_SEQUENTIAL）；具体节点含义，谷歌之。

> 1. 大家都是上来直接创建一个锁节点下的一个接一个的临时顺序节点
>
> 2. 如果自己不是第一个节点，就对自己上一个节点加监听器
>
> 3. 只要上一个节点释放锁，自己就排到前面去了，相当于是一个排队机制。

而且用临时顺序节点的另外一个用意就是，如果某个客户端创建临时顺序节点之后，不小心自己宕机了也没关系，zk感知到那个客户端宕机，会自动删除对应的临时顺序节点，相当于自动释放锁，或者是自动取消自己的排队。

[zookeeper笔记之基于zk实现分布式锁 \- CC11001100 \- 博客园](https://www.cnblogs.com/cc11001100/p/10269494.html)

[七张图彻底讲清楚ZooKeeper分布式锁的实现原理【石杉的架构笔记】 \- 掘金](https://juejin.im/post/5c01532ef265da61362232ed)

### 两者的分布式锁区别

对于 Redis 的分布式锁而言，它有以下缺点：

- 它获取锁的方式简单粗暴，获取不到锁直接不断尝试获取锁，比较消耗性能。
- 另外来说的话，Redis 的设计定位决定了它的数据并不是强一致性的，在某些极端情况下，可能会出现问题。锁的模型不够健壮。
- 即便使用 Redlock 算法来实现，在某些复杂场景下，也无法保证其实现 100% 没有问题，关于 Redlock 的讨论可以看 How to do distributed locking。
- Redis 分布式锁，其实需要自己不断去尝试获取锁，比较消耗性能。

但是另一方面使用 Redis 实现分布式锁在很多企业中非常常见，而且大部分情况下都不会遇到所谓的“极端复杂场景”。

所以使用 Redis 作为分布式锁也不失为一种好的方案，最重要的一点是 Redis 的性能很高，可以支撑高并发的获取、释放锁操作。

对于 ZK 分布式锁而言:

- ZK 天生设计定位就是分布式协调，强一致性。锁的模型健壮、简单易用、适合做分布式锁。
- 如果获取不到锁，只需要添加一个监听器就可以了，不用一直轮询，性能消耗较小。

但是 ZK 也有其缺点：如果有较多的客户端频繁的申请加锁、释放锁，对于 ZK 集群的压力会比较大。



## 集群

### 持久化的原理

### 主从复制原理

### 哨兵模式的原理

我们可以将 Redis Sentinel 集群看成是一个 ZooKeeper 集群，它是集群高可用的心脏，它一般是由 3～5 个节点组成，这样挂了个别节点集群还可以正常运转。

它负责持续监控主从节点的健康，当主节点挂掉时，自动选择一个最优的从节点切换为主节点。客户端来连接集群时，会首先连接 sentinel，通过 sentinel 来查询主节点的地址，然后再去连接主节点进行数据交互。当主节点发生故障时，客户端会重新向 sentinel 要地址，sentinel 会将最新的主节点地址告诉客户端。如此应用程序将无需重启即可自动完成节点切换。

#### 消息丢失怎么处理

Redis 主从采用异步复制，意味着当主节点挂掉时，从节点可能没有收到全部的同步消息，这部分未同步的消息就丢失了。如果主从延迟特别大，那么丢失的数据就可能会特别多。Sentinel 无法保证消息完全不丢失，但是也尽可能保证消息少丢失。它有两个选项可以限制主从延迟过大。

```
min-slaves-to-write 1
min-slaves-max-lag 10
```

第一个参数表示主节点必须至少有一个从节点在进行正常复制，否则就停止对外写服务，丧失可用性。

何为正常复制，何为异常复制？这个就是由第二个参数控制的，它的单位是秒，表示如果 10s 没有收到从节点的反馈，就意味着从节点同步不正常，要么网络断开了，要么一直没有给反馈。

### Redis Cluster集群的原理

RedisCluster 是 Redis 的亲儿子，它是 Redis 作者自己提供的 Redis 集群化方案。

相对于 Codis 的不同，它是去中心化的，如图所示，该集群有三个 Redis 节点组成，每个节点负责整个集群的一部分数据，每个节点负责的数据多少可能不一样。这三个节点相互连接组成一个对等的集群，它们之间通过一种特殊的二进制协议相互交互集群信息。

Redis Cluster 将所有数据划分为 16384 的 slots，它比 Codis 的 1024 个槽划分的更为精细，每个节点负责其中一部分槽位。槽位的信息存储于每个节点中，它不像 Codis，它不需要另外的分布式存储来存储节点槽位信息。

当 Redis Cluster 的客户端来连接集群时，它也会得到一份集群的槽位配置信息。这样当客户端要查找某个 key 时，可以直接定位到目标节点。

这点不同于 Codis，Codis 需要通过 Proxy 来定位目标节点，RedisCluster 是直接定位。客户端为了可以直接定位某个具体的 key 所在的节点，它就需要缓存槽位相关信息，这样才可以准确快速地定位到相应的节点。同时因为槽位的信息可能会存在客户端与服务器不一致的情况，还需要纠正机制来实现槽位信息的校验调整。

另外，RedisCluster 的每个节点会将集群的配置信息持久化到配置文件中，所以必须确保配置文件是可写的，而且尽量不要依靠人工修改配置文件。

- **槽位定位算法**

- **跳转**

- **迁移**

  迁移数据过程中的状态，```importing```和```migrating```

  **从源节点获取内容 => 存到目标节点 => 从源节点删除内容**

  在迁移期间有数据访问，先访问旧节点，没有的话发```asking```状态，询问数据实际在哪个节点

- **扩容**

  1. 启动新的redis主节点
  2. 将新的redis主节点加入cluster集群
  3. 分片hash槽（可以从一个节点或者所有节点分出指定的slot个数）

- **缩容**

  1. 把需下线的redis主节点（源节点）上的hash 槽均匀的移到其他主节点(目标节点)上，也可以全部移到一个节点上
  2. 从cluster中移除需下线的redis主节点
  3. 停止已移除的redis主节点

- **容错**

  主节点需要有从节点在主节点挂了的时候替换，但是没有从节点的话，可以通过配置可以允许部分节点故障，其它节点还可以继续提供对外访问

[Redis进阶实践之十二 Redis的Cluster集群动态扩容 \- 可均可可 \- 博客园](https://www.cnblogs.com/PatrickLiu/p/8473135.html)

[浅析Redis分布式集群倾斜问题 \- Nosql\-炼数成金\-Dataguru专业数据分析社区](http://www.dataguru.cn/article-14564-1.html)

[Redis集群扩容和缩容\_数据库\_zsj777的专栏\-CSDN博客](https://blog.csdn.net/zsj777/article/details/80235568)

[Redis Cluster 集群扩容与收缩 \- jiangz222 \- 博客园](https://www.cnblogs.com/jiangz222/p/7679298.html)

[redis集群cluster搭建，扩容缩容 \- 燃犀的个人空间 \- OSCHINA](https://my.oschina.net/ranxi/blog/1058086)

[Redis 学习笔记（十五）Redis Cluster 集群扩容与收缩\_数据库\_men\_wen的博客\-CSDN博客](https://blog.csdn.net/men_wen/article/details/72896682#)

[redis集群cluster搭建，扩容缩容 \- 燃犀的个人空间 \- OSCHINA](https://my.oschina.net/ranxi/blog/1058086)



#### 为什么要分16384个slot ?

1. 如果槽位为65536，发送心跳信息的消息头达8k，发送的心跳包过于庞大。

在消息头中，最占空间的是 myslots[CLUSTER_SLOTS/8]。当槽位为65536时，这块的大小是: 65536÷8=8kb因为每秒钟，redis节点需要发送一定数量的ping消息作为心跳包，如果槽位为65536，这个ping消息的消息头太大了，浪费带宽。

2. redis的集群主节点数量基本不可能超过1000个。

如上所述，集群节点越多，心跳包的消息体内携带的数据越多。如果节点过1000个，也会导致网络拥堵。因此redis作者，不建议redis cluster节点数量超过1000个。那么，对于节点数在1000以内的redis cluster集群，16384个槽位够用了。没有必要拓展到65536个。

3. 槽位越小，节点少的情况下，压缩率高。

Redis主节点的配置信息中，它所负责的哈希槽是通过一张bitmap的形式来保存的，在传输过程中，会对bitmap进行压缩，但是如果bitmap的填充率slots / N很高的话(N表示节点数)，bitmap的压缩率就很低。如果节点数很少，而哈希槽数量很多的话，bitmap的压缩率就很低。而16384÷8=2kb，怎么样，神奇不！

综上所述，作者决定取16384个槽，不多不少，刚刚好！

### Redis-Sentinel 和 Redis Cluster对比

**Redis-Sentinel**

Redis-Sentinel(哨兵模式)是Redis官方推荐的高可用性(HA)解决方案，当用Redis做Master-slave的高可用方案时，假如master宕机了，Redis本身(包括它的很多客户端)都没有实现自动进行主备切换，而Redis-sentinel本身也是一个独立运行的进程，它能监控多个master-slave集群，发现master宕机后能进行自懂切换。

优点

1、Master 状态监测

2、如果Master 异常，则会进行Master-slave 转换，将其中一个Slave作为Master，将之前的Master作为Slave 

3、Master-Slave切换后，master_redis.conf、slave_redis.conf和sentinel.conf的内容都会发生改变，即master_redis.conf中会多一行slaveof的配置，sentinel.conf的监控目标会随之调换

缺点：

1、如果是从节点下线了，sentinel是不会对其进行故障转移的，连接从节点的客户端也无法获取到新的可用从节点

2、无法实现动态扩容

**Redis Cluster**

使用Redis Sentinel 模式架构的缓存体系，在使用的过程中，随着业务的增加不可避免的要对Redis进行扩容，熟知的扩容方式有两种，一种是垂直扩容，一种是水平扩容。垂直扩容表示通过加内存方式来增加整个缓存体系的容量比如将缓存大小由2G调整到4G,这种扩容不需要应用程序支持；水平扩容表示表示通过增加节点的方式来增加整个缓存体系的容量比如本来有1个节点变成2个节点，这种扩容方式需要应用程序支持。垂直扩容看似最便捷的扩容，但是受到机器的限制，一个机器的内存是有限的，所以垂直扩容到一定阶段不可避免的要进行水平扩容，如果预留出很多节点感觉又是对资源的一种浪费因为对业务的发展趋势很快预测。**Redis Sentinel 水平扩容一直都是程序猿心中的痛点，因为水平扩容牵涉到数据的迁移**。迁移过程一方面要保证自己的业务是可用的，一方面要保证尽量不丢失数据所以数据能不迁移就尽量不迁移。针对这个问题，Redis Cluster就应运而生了。

优点：

1、有效的解决了redis在分布式方面的需求

2、遇到单机内存，并发和流量瓶颈等问题时，可采用Cluster方案达到负载均衡的目的

3、可实现动态扩容

4、P2P模式，无中心化

5、通过Gossip协议同步节点信息

6、自动故障转移、Slot迁移中数据可用

缺点：

1、架构比较新，最佳实践较少

2、为了性能提升，客户端需要缓存路由表信息

3、节点发现、reshard操作不够自动化

> Redis Sentinal着眼于高可用，在master宕机时会自动将slave提升为master，继续提供服务。
>
> Redis Cluster着眼于扩展性，在单个redis内存不足时，使用Cluster进行分片存储。