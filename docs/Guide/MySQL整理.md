## 索引

mysql一次查询只能使用一个索引。如果要对多个字段使用索引，建立复合(联合)索引。

### 索引的作用

索引主要有以下几个作用

1. 即上述所说，索引能极大地减少扫描行数

2. 索引可以帮助服务器避免排序和临时表

   如果这张临时表的大小大于 tmp_table_size 的值（默认为 16 M），内存临时表会转为磁盘临时表，性能会更差，如果加了索引，索引本身是有序的 ，所以从磁盘读的行数本身就是按 age 排序好的，也就不会生成临时表，就不用再额外排序 ，无疑提升了性能。

3. 索引可以将随机 IO 变成顺序 IO

   随机 IO 和顺序 IO 大概相差百倍 (随机 IO：10 ms/ page, 顺序  IO 0.1ms / page)，可见顺序 IO 性能之高，索引带来的性能提升显而易见！

### 索引的分类

#### Hash索引

HASH索引只有精确匹配索引所有列的查询才有效。

因为索引自身只需要存储对应的哈希值，所以索引的结构十分紧凑，这也让哈希索引查找的速度非常快，然而，哈希索引也有限制，如下：

- 哈希索引只包含哈希值和行指针，而不存储字段值，所以不能使用索引中的值来避免读取行（即不能使用哈希索引来做覆盖索引扫描），不过，访问内存中的行的速度很快（因为memory引擎的数据都保存在内存里），所以大部分情况下这一点对性能的影响并不明显。
- **哈希索引数据并不是按照索引列的值顺序存储的，所以也就无法用于排序**
- 哈希索引也不支持部分索引列匹配查找，因为哈希索引始终是使用索引的全部列值内容来计算哈希值的。如：数据列（a,b）上建立哈希索引，如果只查询数据列a，则无法使用该索引。
- 哈希索引只支持等值比较查询，如：=,in(),<=>(注意，<>和<=>是不同的操作)，不支持任何范围查询（必须给定具体的where条件值来计算hash值，所以不支持范围查询）。
- 访问哈希索引的数据非常快，除非有很多哈希冲突，当出现哈希冲突的时候，存储引擎必须遍历链表中所有的行指针，逐行进行比较，直到找到所有符合条件的行。
- 如果哈希冲突很多的话，一些索引维护操作的代价也很高，如：如果在某个选择性很低的列上建立哈希索引（即很多重复值的列），那么当从表中删除一行时，存储引擎需要遍历对应哈希值的链表中的每一行，找到并删除对应的引用，冲突越多，代价越大。

##### 为什么在InnoDB创建HASH索引失败？

```
下面是MYSQL官方的回答：
1.不支持HASH索引（但是InnoDB在内部利用哈希索引来实现其自适应哈希索引功能。）

2.也就是InnoDB会根据表的使用情况自动为表生成hash索引，不能人为干预是否在InnoDB一张表中创建HASH索引

3.或者说，如果InnoDB注意到某些索引值被使用的特别频繁时，
它会在内存中基于Btree的索引之上再创建一个HASH索引，这样BTREE索引也具备了HASH索引的一些优点
```

MEMORY引擎是支持的hash索引的。



#### B+树索引

B+ 树是以 N 叉树的形式存在的，这样有效降低了树的高度，查找数据也不需要全表扫描了，顺着根节点层层往下查找能很快地找到我们的目标数据，每个节点的大小即一个磁盘块的大小，一次 IO 会将一个页（每页包含多个磁盘块）的数据都读入（即磁盘预读，程序局部性原理:读到了某个值，很大可能这个值周围的数据也会被用到，干脆一起读入内存），叶子节点通过指针的相互指向连接，能有效减少顺序遍历时的随机 IO，而且我们也可以看到，叶子节点都是按索引的顺序排序好的，这也意味着根据索引查找或排序都是排序好了的，不会再在内存中形成临时表。

### 索引的使用情况

- **or查询到底走不走索引？**

1. where 语句里面如果带有or条件, MyIsam表能用到索引， Innodb不行。
2. 必须所有的or条件都必须是独立索引（建立在MyIsam引擎）
3. 用UNION替换OR （适用于索引列，会产生临时表useing temporary）
4. 用in来替换or（推荐）

- **联合索引——where走索引情况**

SQL题：4个查询语句，分别判断走没走索引？

```mysql
t idx(a,b,c) 
1. select * from t where a=x and b=x; （走索引）
2. select * from t where c=x and a=x; （优化器优化顺序后，走索引，只走a）
3. select * from t where b=x and c=x; （不满足最左前缀）
4. select * from t where a>x and b=x; （走索引，只走a，因为a是范围查询，到它就会停止匹配）
```

mysql会一直向右匹配直到遇到范围查询（>、<、between、like）就停止匹配。比如a = 1 and b = 2 and c > 3 and d = 4，如果建立（a,b,c,d）顺序的索引，d是用不到索引的，如果建立(a,b,d,c)的索引则都可以用到，a,b,d的顺序可以任意调整。

- **order by走索引情况**

在ORDER BY操作中，MySQL只有在排序条件不是一个查询条件表达式的情况下才使用索引。

```mysql
#1. 只order by 且sort有索引
SELECT [column1],[column2],…. FROM [TABLE] ORDER BY [sort];
#2. WHERE + ORDER BY的索引优化，联合索引(columnX,sort)来实现order by 优化
SELECT [column1],[column2],…. FROM [TABLE] WHERE [columnX] = [value] ORDER BY [sort];
#3. WHERE+ 多个字段ORDER BY，联合索引(uid,x,y)实现order by的优化
SELECT * FROM [table] WHERE uid=1 ORDER x,y LIMIT 0,10;
```

<div style="color:#C00000">疑问： 
</br>
1. where key_1 = 1 and key_2 = 2 order by key_1 走索引吗（a,b,a）情况，索引是联合索引（a,b）
</br>
2. order by key_1 desc, key_2 desc 走索引吗，也就是两个DESC的排序
</br>
3. 联合索引结构是什么样子：非叶子节点存储联合索引Key还是最左第一个的key ? （好像是存储是联合的key）
</div>

不走索引的情况

```mysql
#1. key1,key2分别建立索引
SELECT * FROM t1 WHERE key2=constant ORDER BY key1;
SELECT * FROM t1 ORDER BY key1, key2;

#2. key_part1,key_part2建立联合索引;key2建立索引
SELECT * FROM t1 WHERE key2=constant ORDER BY key_part2;

#3. key_part1,key_part2建立联合索引,同时使用了 ASC 和 DESC
SELECT * FROM t1 ORDER BY key_part1 DESC, key_part2 ASC;
# 在8.0之前的版本中, DESC 是无效的，索引 (a ASC, b DESC, c DESC) 等于 (a ASC, b ASC, c ASC)，故而无法使用整个联合索引进行排序。
# 8.0之后允许索引降序，抛开 sql 优化等细节，只要 order by 顺序和索引顺序一致，那么还是可以用到索引排序的。

#4. 如果在WHERE和ORDER BY的栏位上应用表达式(函数)时，则无法利用索引来实现order by的优化
SELECT * FROM t1 ORDER BY YEAR(logindate) LIMIT 0,10;
```



### 分页优化

```mysql
select * from orders_history where type = 8 and id >= (
    select id from orders_history where type = 8 limit 100000,1
) limit 100;
# 子查询走主键ID聚簇索引比较快的找出深分页的那个主键ID，然后再查别的
```

[sql优化之大数据量分页查询（mysql） \- 杨冠标 \- 博客园](https://www.cnblogs.com/yanggb/p/11058707.html)



### Explain再深入

[一张图彻底搞定 explain \| MySQL 技术论坛](https://learnku.com/articles/38719)

[Explain详解与索引优化实践\_数据库技术\_Linux公社\-Linux系统门户网站](https://www.linuxidc.com/Linux/2020-02/162356.htm)

[mysql调优\-\-根据explain结果分析索引有效性,正确使用索引\_数据库\_嘎嘎的博客\-CSDN博客](https://blog.csdn.net/qq_20597727/article/details/87301687)

[你确定真正理解联合索引和最左前缀原则？\_数据库\_weixin\_44476888的博客\-CSDN博客](https://blog.csdn.net/weixin_44476888/article/details/90345085)

[一本彻底搞懂MySQL索引优化EXPLAIN百科全书 \- 个人文章 \- SegmentFault 思否](https://segmentfault.com/a/1190000021815758)

[Explain详解与索引最佳实践 \- 简书](https://www.jianshu.com/p/a1a56411fa79)

**疑问**：

- Explain中的type字段，为ref的时候，我们知道是肯定是走索引的，但是为 range、index的时候走不走索引啊？？？



### 创建索引的原则

- 列的离散型：
离散型的计算公式：count(distinct col) : count(col)，离散型越高，选择型越好。
- 最左匹配原则并且优先创建联合索引原则
- 覆盖索引

#### 前缀索引

```mysql
# 3,4,5,6,7为city字段的前缀长度，通过这个来比较索引选择性提升的比例变化
SELECT 
 COUNT(DISTINCT LEFT(city,3))/COUNT(*) as sel3,
 COUNT(DISTINCT LEFT(city,4))/COUNT(*) as sel4,
 COUNT(DISTINCT LEFT(city,5))/COUNT(*) as sel5,
 COUNT(DISTINCT LEFT(city,6))/COUNT(*) as sel6,
 COUNT(DISTINCT LEFT(city,7))/COUNT(*) as sel7
FROM city_demo
```

- 占用空间小且快
- 无法使用前缀索引做 ORDER BY 和 GROUP BY
- 无法使用前缀索引做覆盖扫描
- 有可能增加扫描行数

比如身份证加索引，可以加哈希索引或者倒序存储后加前缀索引。

#### 联合索引

上面的创建规则同样适用于联合索引。

```mysql
# staff_id_selectivity: 0.0001
# customer_id_selectivity: 0.0373
# COUNT(*): 16049 
# 通过结果发现，customer_id 的选择性更高，所以应该选择 customer_id 作为联合索引的第一列
SELECT 
 COUNT(DISTINCT staff_id)/COUNT(*) as staff_id_selectivity,
 COUNT(DISTINCT customer_id)/COUNT(*) as customer_id_selectivity,
 COUNT(*)
FROM payment
```



### 索引的长度计算

**1. 所有的索引字段，如果没有设置not null，则需要加一个字节。**

**2. 定长字段，int占四个字节、date占三个字节、char(n)占n个字符。**

**3. 对于变成字段varchar(n)，则有n个字符+两个字节。**

**4. 不同的字符集，一个字符占用的字节数不同。latin1编码的，一个字符占用一个字节，gbk编码的，一个字符占用两个字节，utf8编码的，一个字符占用三个字节。**

**5. 索引长度 char()、varchar()索引长度的计算公式：**

(Character Set：utf8mb4=4,utf8=3,gbk=2,latin1=1) * 列长度 + 1(允许null) + 2(变长列)



### 索引的长度限制

在MySQL5.6里默认 innodb_large_prefix=0 限制单列索引长度不能超过767bytes

在MySQL5.7里默认 innodb_large_prefix=1 解除了767bytes长度限制，但是单列索引长度最大还是不能超过3072bytes

 **为什么3072，原因如下：**  

我们知道InnoDB一个page的默认大小是16k。由于是Btree组织，要求叶子节点上一个page至少要包含两条记录（否则就退化链表了）。

所以一个记录最多不能超过8k。

又由于InnoDB的聚簇索引结构，一个二级索引要包含主键索引，因此每个单个索引不能超过4k （极端情况，primay-key和某个二级索引都达到这个限制）。

由于需要预留和辅助空间，扣掉后不能超过3500，取个“整数”就是 (1024bytes*3=3072bytes)

[MySQL 中索引的长度的限制](https://blog.csdn.net/weixin_34335458/article/details/94673168)



## redo log 、 undo log、bin log

MySQL中有六种日志文件，分别是：重做日志（redo log）、回滚日志（undo log）、二进制日志（binlog）、错误日志（errorlog）、慢查询日志（slow query log）、一般查询日志（general log），中继日志（relay log）。
其中重做日志和回滚日志与事务操作息息相关，二进制日志也与事务操作有一定的关系，这三种日志，对理解MySQL中的事务操作有着重要的意义。这里简单总结一下这三者具有一定相关性的日志。

[mysql日志系统 SQL 逻辑日志 物理日志 \- binyang \- 博客园](https://www.cnblogs.com/binyang/p/11260126.html)

[MySQL中的重做日志（redo log），回滚日志（undo log），以及二进制日志（binlog）的简单总结 ](https://www.cnblogs.com/wy123/p/8365234.html)

### redo log（**重做日志**）

作用：
　　确保事务的持久性。
　　防止在发生故障的时间点，尚有脏页未写入磁盘，在重启mysql服务的时候，根据redo log进行重做，从而达到事务的持久性这一特性。

`redo log`是MySQL的 InnoDB引擎所特有产生的。

在修改的数据的时候，`binlog`会记载着变更的类容，`redo log`也会记载着变更的内容。（只不过一个存储的是物理变化，一个存储的是逻辑变化）。那他们的写入顺序是什么样的呢？

`redo log`**事务开始**的时候，就开始记录每次的变更信息，而`binlog`是在**事务提交**的时候才记录。

MySQL通过**两阶段提交**来保证`redo log`和`binlog`的数据是一致的。

过程：

- 阶段1：InnoDB`redo log` 写盘，InnoDB 事务进入 `prepare` 状态
- 阶段2：`binlog` 写盘，InooDB 事务进入 `commit` 状态
- 每个事务`binlog`的末尾，会记录一个 `XID event`，标志着事务是否提交成功，也就是说，恢复过程中，`binlog` 最后一个 XID event 之后的内容都应该被 purge。

InnoDB的redo log是固定大小的，比如可以配置为一组4个文件，每个文件的大小是1GB，那么这块"粉板"总共就可以记录4GB的操作。从头开始写，写到末尾就又回到开头循环写。

有了redo log，InnoDB就可以保证即使数据库发生异常重启，之前提交的记录都不会丢失，这个能力称为**crash-safe**。

### bin log（**二进制日志**）

`binlog`的作用是复制和恢复而生的。

- 主从服务器需要保持数据的一致性，通过`binlog`来同步数据。
- 如果整个数据库的数据都被删除了，`binlog`存储着所有的数据变更情况，那么可以通过`binlog`来对数据进行恢复。

[说说MySQL中的Redo log Undo log都在干啥 \- 苏家小萝卜 \- 博客园](https://www.cnblogs.com/xinysu/p/6555082.html)

两种日志特点对比：

1. redo log是InnoDB引擎特有的；binlog是MySQL的Server层实现的，所有引擎都可以使用。
2. redo log是物理日志，记录的是"在某个数据页上做了什么修改"；binlog是逻辑日志，记录的是这个语句的原始逻辑，比如"给ID=2这一行的c字段加1 "。
3. redo log是循环写的，空间固定会用完；binlog是可以追加写入的。"追加写"是指binlog文件写到一定大小后会切换到下一个，并不会覆盖以前的日志

#### 为什么日志需要"两阶段提交？

​    重点：

​    Binlog 的完成在redolog 的prepare和commit之间

​    在binlog之前 redolog已经准备好在内存中，但是未写入磁盘

​    在binlog之后 redolog 才处于提交状态准备写入磁盘。

​    Redolog 和binlog是两个独立的阶段，并不依赖

​    即，数据已经在内存中修改完毕，修改数据的操作也记录完了，但是数据库的磁盘文件还没有真正写入。

假设当前ID=2的行，字段c的值是0，再假设执行update语句过程中在写完第一个日志后，第二个日志还没有写完期间发生了crash：

1. **先写redo log后写binlog**。假设在redo log写完，binlog还没有写完的时候，MySQL进程异常重启。由于我们前面说过的，redo log写完之后，系统即使崩溃，仍然能够把数据恢复回来，所以恢复后这一行c的值是1。
   但是由于binlog没写完就crash了，这时候binlog里面就没有记录这个语句。因此，之后备份日志的时候，存起来的binlog里面就没有这条语句。
   然后你会发现，如果需要用这个binlog来恢复临时库的话，由于这个语句的binlog丢失，这个临时库就会少了这一次更新，恢复出来的这一行c的值就是0，与原库的值不同。
2. **先写binlog后写redo log**。如果在binlog写完之后crash，由于redo log还没写，崩溃恢复以后这个事务无效，所以这一行c的值是0。但是binlog里面已经记录了"把c从0改成1"这个日志。所以，在之后用binlog来恢复的时候就多了一个事务出来，恢复出来的这一行c的值就是1，与原库的值不同。

 **注意**

redo log用于保证crash-safe能力。innodb_flush_log_at_trx_commit这个参数设置成1的时候，表示每次事务的redo log都直接持久化到磁盘。这个参数建议你设置成1，这样可以保证MySQL异常重启之后数据不丢失。

sync_binlog这个参数设置成1的时候，表示每次事务的binlog都持久化到磁盘。这个参数建议你设置成1，这样可以保证MySQL异常重启之后binlog不丢失。

[详细分析MySQL事务日志\(redo log和undo log\) \- 骏马金龙 \- 博客园](https://www.cnblogs.com/f-ck-need-u/p/9010872.html)

[MySQL之Redo Log \- 知乎](https://zhuanlan.zhihu.com/p/86555990)

### undo log（**回滚日志**）

`undo log `主要有两个作用：**回滚和多版本控制(MVCC)，记录了一条修改的反的操作日志。保证事务的【原子性】**

undo日志用于存放数据修改被修改前的值，假设修改 tba 表中 id=2的行数据，把Name='B' 修改为Name = 'B2' ，那么undo日志就会用来存放Name='B'的记录，如果这个修改出现异常，可以使用undo日志来实现回滚操作，保证事务的一致性。

对数据的变更操作，主要来自 INSERT UPDATE DELETE，而UNDO LOG中分为两种类型，一种是 INSERT_UNDO（INSERT操作），记录插入的唯一键值；一种是 UPDATE_UNDO（包含UPDATE及DELETE操作），记录修改的唯一键值以及old column记录。

MVCC实现的是读写不阻塞，读的时候只要返回前一个版本的数据就行了。

什么时候产生：
　　事务开始之前，将当前是的版本生成undo log，undo 也会产生 redo 来保证undo log的可靠性

什么时候释放：
　　当事务提交之后，undo log并不能立马被删除，
　　而是放入待清理的链表，由purge线程判断是否由其他事务在使用undo段中表的上一个事务之前的版本信息，决定是否可以清理undo log的日志空间。

### 数据库的备份和恢复怎么实现的，主从复制怎么做的，什么时候会出现数据不一致，如何解决。

(1)首先，mysql主库在事务提交时会把数据库变更作为事件Events记录在二进制文件binlog中；mysql主库上的sys_binlog控制binlog日志刷新到磁盘。

 (2)主库推送二进制文件binlog中的事件到从库的中继日志relay log,之后从库根据中继日志重做数据库变更操作。通过逻辑复制，以此来达到数据一致。

​    Mysql通过3个线程来完成主从库之间的数据复制：其中BinLog Dump线程跑在主库上，I/O线程和SQL线程跑在从库上。当从库启动复制（start slave）时，首先创建I/O线程连接主库，主库随后创建Binlog Dump线程读取数据库事件并发给I/O线程，I/O线程获取到数据库事件更新到从库的中继日志Realy log中去，之后从库上的SQL线程读取中继日志relay log 中更新的数据库事件并应用。

 ![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/mysql-master-slave.png)

#### binlog

主库中可以设置binlog，binlog是主库中保存更新事件日志的二进制文件。

- 主节点 binary log dump 线程

如上图所示：当从节点连接主节点时，主节点会创建一个log dump 线程，用于发送bin-log的内容。在读取bin-log中的操作时，此线程会对主节点上的bin-log加锁，当读取完成，甚至在发动给从节点之前，锁会被释放。

- 从节点I/O线程

当从节点上执行start slave命令之后，从节点会创建一个I/O线程用来连接主节点，请求主库中更新的bin-log。I/O线程接收到主节点binlog dump 进程发来的更新之后，保存在本地relay-log中。

- 从节点SQL线程

SQL线程负责读取relay log中的内容，解析成具体的操作并执行，最终保证主从数据的一致性。

对于每一个主从连接，都需要三个进程来完成。当主节点有多个从节点时，主节点会为每一个当前连接的从节点建一个binary log dump 进程，而每个从节点都有自己的I/O进程，SQL进程。从节点用两个线程将从主库拉取更新和执行分成独立的任务，这样在执行同步数据任务的时候，不会降低读操作的性能。比如，如果从节点没有运行，此时I/O进程可以很快从主节点获取更新，尽管SQL进程还没有执行。如果在SQL进程执行之前从节点服务停止，至少I/O进程已经从主节点拉取到了最新的变更并且保存在本地relay日志中，当服务再次起来之后，就可以完成数据的同步。

1.节点上的I/O 进程连接主节点，并请求从指定日志文件的指定位置（或者从最开始的日志）之后的日志内容；

2.主节点接收到来自从节点的I/O请求后，通过负责复制的I/O进程根据请求信息读取指定日志指定位置之后的日志信息，返回给从节点。返回信息中除了日志所包含的信息之外，还包括本次返回的信息的bin-log file 的以及bin-log position；

3.从节点的I/O进程接收到内容后，将接收到的日志内容更新到本机的relay log中，并将读取到的binary log文件名和位置保存到master-info 文件中，以便在下一次读取的时候能够清楚的告诉Master“我需要从某个bin-log 的哪个位置开始往后的日志内容，请发给我”；

4.Slave 的 SQL线程检测到relay-log 中新增加了内容后，会将relay-log的内容解析成在祝节点上实际执行过的操作，并在本数据库中执行。

#### 主从不一致的情况

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/mysql-inconformity.png)

[详细分析MySQL事务日志\(redo log和undo log\) \- 后端 \- 掘金](https://juejin.im/entry/5ba0a254e51d450e735e4a1f)

[原来MySQL面试还会问这些\.\.\.](https://mp.weixin.qq.com/s/Lx4TNPLQzYaknR7D3gmOmQ)

## 锁

首先，从锁的粒度，我们可以分成两大类：

- 表锁
  - 开销小，加锁快；不会出现死锁；锁定力度大，发生锁冲突概率高，并发度最低
- 行锁
  - 开销大，加锁慢；会出现死锁；锁定粒度小，发生锁冲突的概率低，并发度高

不同的存储引擎支持的锁粒度是不一样的：

- **InnoDB行锁和表锁都支持**！
- **MyISAM只支持表锁**！

InnoDB只有通过**索引条件**检索数据**才使用行级锁**，否则，InnoDB将使用**表锁**

- 也就是说，**InnoDB的行锁是基于索引的**！

**表锁下又分为两种模式**：

- 表读锁（Table Read Lock）

- 表写锁（Table Write Lock）

- 从下图可以清晰看到，在表读锁和表写锁的环境下：

  读读不阻塞，读写阻塞，写写阻塞

  - 读读不阻塞：当前用户在读数据，其他的用户也在读数据，不会加锁
  - 读写阻塞：当前用户在读数据，其他的用户**不能修改当前用户读的数据**，会加锁！
  - 写写阻塞：当前用户在修改数据，其他的用户**不能修改当前用户正在修改的数据**，会加锁！

我们应该**更加关注行锁的内容**，因为InnoDB一大特性就是支持行锁！

InnoDB实现了以下**两种**类型的行锁。

- 共享锁（S锁）：允许一个事务去读一行，阻止其他事务获得相同数据集的排他锁。 
  - 也叫做**读锁**：读锁是**共享**的，多个客户可以**同时读取同一个**资源，但**不允许其他客户修改**。
- 排他锁（X锁)：允许获得排他锁的事务更新数据，阻止其他事务取得相同数据集的共享读锁和排他写锁。 
  - 也叫做**写锁**：写锁是排他的，**写锁会阻塞其他的写锁和读锁**。

看完上面的有没有发现，在一开始所说的：X锁，S锁，读锁，写锁，共享锁，排它锁其实**总共就两个锁**，只不过它们**有多个名字罢了**~~~

另外，**为了允许行锁和表锁共存，实现多粒度锁机制**，InnoDB还有两种内部使用的意向锁（Intention Locks），这两种意向锁都是**表锁**：

- 意向共享锁（IS）：事务打算给数据行加行共享锁，事务在给一个数据行加共享锁前必须先取得该表的IS锁。
- 意向排他锁（IX）：事务打算给数据行加行排他锁，事务在给一个数据行加排他锁前必须先取得该表的IX锁。
- 意向锁也是数据库隐式帮我们做了，**不需要程序员操心**！

事务的隔离级别就是**通过锁的机制来实现**，只不过**隐藏了加锁细节**

### 乐观锁和悲观锁

无论是`Read committed`还是`Repeatable read`隔离级别，都是为了解决**读写冲突**的问题。

#### 悲观锁

所以，按照上面的例子。我们使用悲观锁的话其实很简单(手动加行锁就行了)：

- `select * from xxxx for update`

在select 语句后边加了 `for update`相当于加了排它锁(写锁)，加了写锁以后，其他的事务就不能对它修改了！需要等待当前事务修改完之后才可以修改.

#### 乐观锁

乐观锁不是数据库层面上的锁，是需要自己手动去加的锁。一般我们添加一个版本字段来实现：

张三`select * from table` --->会查询出记录出来，同时会有一个version字段

### 间隙锁GAP

当我们**用范围条件检索数据**而不是相等条件检索数据，并请求共享或排他锁时，InnoDB会给**符合范围条件的已有数据记录的索引项加锁**；对于键值在条件范围内但并不存在的记录，叫做“间隙（GAP)”。InnoDB也会对这个“间隙”加锁，这种锁机制就是所谓的间隙锁。

值得注意的是：间隙锁只会在`Repeatable read`隔离级别下使用~

```mysql
Select * from  emp where empid > 100 for update;
```

上面是一个范围查询，InnoDB**不仅**会对符合条件的empid值为101的记录加锁，也会对**empid大于101（这些记录并不存在）的“间隙”加锁**。

InnoDB使用间隙锁的目的有两个：

- **为了防止幻读**(上面也说了，`Repeatable read`隔离级别下再通过GAP锁即可避免了幻读)
- 满足恢复和复制的需要
  - MySQL的恢复机制要求：**在一个事务未提交前，其他并发事务不能插入满足其锁定条件的任何记录，也就是不允许出现幻读**

### 死锁

并发的问题就少不了死锁，在MySQL中同样会存在死锁的问题。

但一般来说MySQL通过回滚帮我们解决了不少死锁的问题了，但死锁是无法完全避免的，可以通过以下的经验参考，来尽可能少遇到死锁：

- 1）以**固定的顺序**访问表和行。比如对两个job批量更新的情形，简单方法是对id列表先排序，后执行，这样就避免了交叉等待锁的情形；将两个事务的sql顺序调整为一致，也能避免死锁。
- 2）**大事务拆小**。大事务更倾向于死锁，如果业务允许，将大事务拆小。
- 3）在同一个事务中，尽可能做到**一次锁定**所需要的所有资源，减少死锁概率。
- 4）**降低隔离级别**。如果业务允许，将隔离级别调低也是较好的选择，比如将隔离级别从RR调整为RC，可以避免掉很多因为gap锁造成的死锁。
- 5）**为表添加合理的索引**。可以看到如果不走索引将会为表的每一行记录添加上锁，死锁的概率大大增大。

[数据库两大神器【索引和锁】 \- 掘金](https://juejin.im/post/5b55b842f265da0f9e589e79#heading-12)

[数据库常见死锁原因及处理\_数据库\_zhoxing\-CSDN博客](https://blog.csdn.net/qq_16681169/article/details/74784193)

[解决死锁之路（终结篇） \- 再见死锁 \- aneasystone's blog](https://www.aneasystone.com/archives/2018/04/solving-dead-locks-four.html)

[MySQL死锁解决之道 \- 知乎](https://zhuanlan.zhihu.com/p/67793185)

## MVCC机制

> MVCC，Multi-Version Concurrency Control，多版本并发控制。MVCC 是一种并发控制的方法，一般在数据库管理系统中，实现对数据库的并发访问；在编程语言中实现事务内存。

MVCC 使用了一种不同的手段，每个连接到数据库的读者，**在某个瞬间看到的是数据库的一个快照**，写者写操作造成的变化在写操作完成之前（或者数据库事务提交之前）对于其他的读者来说是不可见的。

数据库默认隔离级别：**RR（Repeatable Read，可重复读），MVCC主要适用于Mysql的RC（读取已提交）,RR（可重复读）隔离级别**

**MVCC就是行级锁的一个变种(升级版)**。

在**表锁中我们读写是阻塞**的，基于提升并发性能的考虑，**MVCC一般读写是不阻塞的**(所以说MVCC很多情况下避免了加锁的操作)

- MVCC实现的**读写不阻塞**正如其名：**多版本**并发控制--->通过一定机制生成一个数据请求**时间点的一致性数据快照（Snapshot)**，并用这个快照来提供一定级别（**语句级或事务级**）的**一致性读取**。从用户的角度来看，好像是**数据库可以提供同一数据的多个版本**。

快照有**两个级别**：

- 语句级 
  - 针对于`Read committed`隔离级别
- 事务级别 
  - 针对于`Repeatable read`隔离级别

### 各种事务隔离级别下的Read view 工作方式

RC(read commit) 级别下同一个事务里面的每一次查询都会获得一个新的read view副本。这样就可能造成同一个事务里前后读取数据可能不一致的问题（幻读）

![img](https://pic3.zhimg.com/80/v2-0c77f30980dc7e45f5aaac8a574e8672_1440w.jpg)



RR(重复读)级别下的一个事务里只会获取一次read view副本，从而保证每次查询的数据都是一样的。

![img](https://pic1.zhimg.com/80/v2-82eeabba61c97def5d19aeb3cb77182c_1440w.jpg)



READ_UNCOMMITTED 级别的事务不会获取read view 副本。

所谓的`MVCC（Multi-Version Concurrency Control ，多版本并发控制）`指的就是在使用`读已提交（READ COMMITTD）、可重复读（REPEATABLE READ）`这两种隔离级别的事务在执行普通的SELECT操作时访问记录的版本链的过程，这样子可以使不同事务的读-写、写-读操作并发执行，从而提升系统性能。

这两个隔离级别的一个很大不同就是：`生成ReadView的时机不同`，READ COMMITTD在每一次进行普通SELECT操作前都会生成一个ReadView，而REPEATABLE READ只在第一次进行普通SELECT操作前生成一个ReadView，数据的可重复读其实就是ReadView的重复使用。

### 快照读和当前读

**快照读**

快照读是指读取数据时不是读取最新版本的数据，而是基于历史版本读取的一个快照信息（mysql读取undo log历史版本) ，快照读可以使普通的SELECT 读取数据时不用对表数据进行加锁，从而解决了因为对数据库表的加锁而导致的两个如下问题

1、解决了因加锁导致的修改数据时无法对数据读取问题;

2、解决了因加锁导致读取数据时无法对数据进行修改的问题;



**当前读**

当前读是读取的数据库最新的数据，当前读和快照读不同，因为要读取最新的数据而且要保证事务的隔离性，所以当前读是需要对数据进行加锁的（Update delete insert select ....lock in share mode select for update 为当前读）

[【MySQL（5）\| 五分钟搞清楚 MVCC 机制】 \- 掘金](https://juejin.im/post/5c68a4056fb9a049e063e0ab)

[MYSQL MVCC实现原理 \- 简书](https://www.jianshu.com/p/f692d4f8a53e)

[MySQL InnoDB MVCC 机制的原理及实现 \- 知乎](https://zhuanlan.zhihu.com/p/64576887)

[innodb MVCC实现原理 \- 知乎](https://zhuanlan.zhihu.com/p/52977862)



## 底层表的存储结构



## varchar相关

### varchar(n)，n表示什么？

MySQL5.0.3之前varchar(n)这里的n表示字节数

MySQL5.0.3之后varchar(n)这里的n表示字符数，比如varchar（200），不管是英文还是中文都可以存放200个

#### n最大可以是多少

#### MySQL行长度

MySQL要求一个行定义长度不能超过65535个字节，不包括text、blob等大字段类型，varchar长度受此长度限制，和其他非大字段加起来不能超过65535个字节.

超过以上限制则会报错

####  varchar(n)占用几个字节

varchar(n)占用几个字节跟字符集有关系：

字符类型若为gbk，每个字符占用2个字节， 

字符类型若为utf8，每个字符最多占用3个字节

#### varchar最大长度可以是多少

根据字符集，字符类型若为gbk，每个字符占用2个字节，最大长度不能超过65535/2 =32766；  字符类型若为utf8，每个字符最多占用3个字节，最大长度不能超过 65535/3 =21845，若超过这个限制，则会自动将varchar类型转为mediumtext或longtext,

**字符与字节的区别**

一个字符由于所使用的字符集的不同，会并存储在一个或多个字节中，所以一个字符占用多少个字节取决于所使用的字符集

注意：char（len）与varchar（len）后面接的数据大小为存储的字符数，而不是字节数；

**一、存储区别性**

char（len）夸号中存储写的是字符长度，最大值为255，如果在存储的时你实际存储的字符长度低于夸号中填写的长度，那它在存储的时候会以空格补全位数进行存储

varchar，则不具备这样的特性，最大长度取值为65535，不会空格补全进行存储；

**二、取数据的区别性**

char在取值的时候会把存值后面的空格去除掉，varchar 如果后面有空格则会保留；

**三、存储占用内存性**

不同的字符集字符和字节换算是不同的，拉丁字符换算规律1字符=1字节，utf8是1字符3字节，gbk是1字符2字节；

#### 与char的区别

char(n)	固定长度，最多28−128−1个字符，28−128−1个字节
varchar(n)	可变长度，最多216−1216−1个字符，216−1216−1个字节

 取数据的时候，char类型的要用trim()去掉多余的空格，而varchar是不需要的。

char的存储方式是，对英文字符（ASCII）占用1个字节，对一个汉字占用两个字节；而varchar的存储方式是，对每个英文字符占用2个字节，汉字也占用2个字节，两者的存储数据都非unicode的字符数据。

存储的容量不同
对 char 来说，最多能存放的字符个数 255，和编码无关。
而 varchar 呢，最多能存放 65532 个字符。varchar的最大有效长度由最大行大小和使用的字符集确定。整体最大长度是 65,532字节

## [内连接，外连接（左连接，右连接），union，union all的区别](https://www.cnblogs.com/plf-Jack/p/11185154.html)

### 内连接

```mysql
inner join...on

join...on

cross join...on

# 同时可以使用以下的三种方法：
mysql> select * from a_table, b_table where a_table.a_id = b_table.b_id;

mysql> select * from a_table a cross join b_table b on a.a_id=b.b_id;

mysql> select * from a_table a  join b_table b on a.a_id=b.b_id;
```

组合两个表中的记录，返回关联字段相符的记录，也就是返回两个表的交集（阴影）部分。

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/mysql_inner_join.png)

### 左连接（左外连接）

left join ... on ...

说明：left join 是left outer join的简写，它的全称是左外连接，是外连接中的一种。
左(外)连接，左表(a_table)的记录将会全部表示出来，而右表(b_table)只会显示符合搜索条件的记录。右表记录不足的地方均为NULL。

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/mysql_left_join.png)

### 右连接（右外连接）

right join ... on ...

说明：right join是right outer join的简写，它的全称是右外连接，是外连接中的一种。
与左(外)连接相反，右(外)连接，左表(a_table)只会显示符合搜索条件的记录，而右表(b_table)的记录将会全部表示出来。左表记录不足的地方均为NULL。

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/mysql_right_join.png)

### union

- UNION 

  操作符用于合并两个或多个 SELECT 语句的结果集。

请注意，UNION 内部的每个 SELECT 语句必须拥有相同数量的列。列也必须拥有相似的数据类型。同时，每个 SELECT 语句中的列的顺序必须相同。

```mysql
mysql> select * from a_table union  select * from b_table;
# 一张表中显示了两张表的数据（不重复的数据），先查询的表，其结果放在前面。
```

- union all

```mysql
mysql> select * from a_table union all select * from b_table;
# 一张表中显示了两张表的所有数据，先查询的表，其结果放在前面。
```



## 在线数据迁移怎么做

步骤：双写数据库、搬历史数据、切换写入、灰度验证（99.9999%）、删除历史； 

[在线数据迁移\_大数据\_秀才的专栏\-CSDN博客](https://blog.csdn.net/zlfprogram/article/details/80735933)

[高并发（二）\-\-\-数据迁移方案 \- 肖冬 \- 博客园](https://www.cnblogs.com/peterxiao/p/11009173.html)

[如何进行大规模在线数据迁移（来自Stripe公司的经验） \- followflows \- 博客园](https://www.cnblogs.com/followflows/p/7876052.html)

[谈谈自己的大数据迁移经历 \- 简书](https://www.jianshu.com/p/c76cf9c4cbef)

[在线数据迁移的一点想法\_嗯。\-CSDN博客](https://blog.csdn.net/u011686226/article/details/86511329)





## 问题

- MySQL可不可以不设置主键ID、自增ID？

  1. 不以自增ID为主键的话，会造成页分裂和页合并，造成性能下降。

- MySQL最多能设置多少个索引？添加的索引是越多越好吗？

- MySQL  count(*)的情况

- SQL 选用索引的执行成本如何计算

  实际上针对无 where_clause 的 **COUNT(\*)**，MySQL 是有优化的，优化器会选择成本最小的辅助索引查询计数，其实反而性能最高，

  不管是 COUNT(1)，还是 COUNT(\*)，MySQL 都会用**成本最小**的辅助索引查询方式来计数，也就是使用 COUNT(*) 由于 MySQL 的优化已经保证了它的查询性能是最好的！

  MySQL 会选择成本最小原则来选择使用对应的索引，这里的成本主要包含两个方面。

  - IO 成本
  - CPU成本

  https://mp.weixin.qq.com/s/iKifzfuKgBGBguCCdq-B3g

- MySQL 什么情况走了索引还很慢？为啥有时候明明添加了索引却不生效？

  1. 索引列是表示式的一部分，或是函数的一部分
  2. 使用 order by 造成的全表扫描
  3. 隐式类型转换
  4. 隐式编码转换

- 如何评判一个索引设计的好坏

  

  