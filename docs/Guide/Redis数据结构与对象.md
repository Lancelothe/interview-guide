## 对象

Redis有五种基本数据结构：字符串、hash、set、zset、list。但是你知道构成这五种结构的底层数据结构是怎样的吗？

Redis创建一个键值对时至少会创建两个对象，一个对象用作键值对的**键(键对象)**，另一个对象用作键值对的**值(值对象)**。其中**键**总是一个字符串对象，**值**则可以是以下五种对象中的一种。

| 类型常量     | 对象的名称   | type命令输出 |
| ------------ | ------------ | ------------ |
| REDIS_STRING | 字符串对象   | "string"     |
| REDIS_LIST   | 列表对象     | "list"       |
| REDIS_HASH   | 哈希对象     | "hash"       |
| REDIS_SET    | 集合对象     | "set"        |
| REDIS_ZSET   | 有序集合对象 | "zset"       |

### 结构

Redis中每个对象都由RedisObject结构表示：

```c
typedef struct redisObject {  
    // 类型  
    unsigned type:4;          
    // 不使用(对齐位)  
    unsigned notused:2;  
    // 编码方式  
    unsigned encoding:4;  
    // LRU 时间（相对于 server.lruclock）  
    unsigned lru:22;  
    // 引用计数  
    int refcount;  
    // 指向底层实现数据结构的指针
    void *ptr;  
} robj; 
```

### 编码和底层实现

| 编码常量                  | 底层数据结构                | object encoding命令输出 |
| ------------------------- | --------------------------- | ----------------------- |
| REDIS_ENCODING_INT        | long 类型的整数             | "int"                   |
| REDIS_ENCODING_EMBSTR     | embstr 编码的简单动态字符串 | "embstr"                |
| REDIS_ENCODING_RAW        | 简单动态字符串              | "raw"                   |
| REDIS_ENCODING_HT         | 字典                        | "hashtable"             |
| REDIS_ENCODING_LINKEDLIST | 双端链表                    | "linkedlist"            |
| REDIS_ENCODING_ZIPLIST    | 压缩列表                    | "ziplist"               |
| REDIS_ENCODING_INTSET     | 整数集合                    | "intset"                |
| REDIS_ENCODING_SKIPLIST   | 跳跃表和字典                | "skiplist"              |

### 对象和底层结构对应关系

其实他们都至少对应两种底层结构，只是会进行类型转换，比如长度达到多少或者内存占用达到多少。

![redis-object-encoding](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/redis-object-encoding.png)



- **字符串**

![redis-string-struct](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/redis-string-struct.png)

其中：embstr和raw都是由SDS动态字符串构成的。唯一区别是：raw是分配内存的时候，redisobject和 sds 各分配一块内存，而embstr是redisobject和raw在一块儿内存中。

- **列表**

![redis-list-struct](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/redis-list-struct.png)

- **hash**

![redis-hash-struct](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/redis-hash-struct.png)

- **set**

![redis-set-struct](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/redis-set-struct.png)

- **zset**

![redis-zset-struct](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/redis-zset-struct.png)

### 空转时间

`redisObject` 结构包含的最后一个属性为 `lru` 属性， 该属性记录了对象最后一次被命令程序访问的时间。

OBJECT IDLETIME 命令可以打印出给定键的空转时长， 这一空转时长就是通过将当前时间减去键的值对象的 `lru` 时间计算得出的。

OBJECT IDLETIME 命令的实现是特殊的， 这个命令在访问键的值对象时， 不会修改值对象的 `lru` 属性。

除了可以被 OBJECT IDLETIME 命令打印出来之外， 键的空转时长还有另外一项作用： 如果服务器打开了 `maxmemory` 选项， 并且服务器用于回收内存的算法为 `volatile-lru` 或者 `allkeys-lru` ， 那么当服务器占用的内存数超过了 `maxmemory` 选项所设置的上限值时， 空转时长较高的那部分键会优先被服务器释放， 从而回收内存。

## 简单动态字符串（SDS）

### 结构体定义

每个 `sds.h/sdshdr` 结构表示一个 SDS 值：

```c
struct sdshdr {

    // 记录 buf 数组中已使用字节的数量
    // 等于 SDS 所保存字符串的长度
    int len;

    // 记录 buf 数组中未使用字节的数量
    int free;

    // 字节数组，用于保存字符串
    char buf[];

};
```

- `free` 属性的值为 `0` ， 表示这个 SDS 没有分配任何未使用空间。
- `len` 属性的值为 `5` ， 表示这个 SDS 保存了一个五字节长的字符串。
- `buf` 属性是一个 `char` 类型的数组， 数组的前五个字节分别保存了 `'R'` 、 `'e'` 、 `'d'` 、 `'i'` 、 `'s'` 五个字符， 而最后一个字节则保存了空字符 `'\0'` 。

### 特性

#### 常数复杂度获取字符长度

通过`int len`属性

#### 杜绝缓冲区溢出

 SDS 的空间分配策略完全杜绝了发生缓冲区溢出的可能性： 当 SDS API 需要对 SDS 进行修改时， API 会先检查 SDS 的空间是否满足修改所需的要求， 如果不满足的话， API 会自动将 SDS 的空间扩展至执行修改所需的大小， 然后才执行实际的修改操作， 所以使用 SDS 既不需要手动修改 SDS 的空间大小， 也不会出现前面所说的缓冲区溢出问题。

#### 减少修改字符串时带来的内存重分配次数

- 空间预分配

  空间预分配用于优化 SDS 的字符串增长操作： 当 SDS 的 API 对一个 SDS 进行修改， 并且需要对 SDS 进行空间扩展的时候， 程序不仅会为 SDS 分配修改所必须要的空间， 还会为 SDS 分配额外的未使用空间。

  其中， 额外分配的未使用空间数量由以下公式决定：

  - 如果对 SDS 进行修改之后， SDS 的长度（也即是 `len` 属性的值）将小于 `1 MB` ， 那么程序分配和 `len` 属性同样大小的未使用空间， 这时 SDS `len` 属性的值将和 `free` 属性的值相同。 举个例子， 如果进行修改之后， SDS 的 `len` 将变成 `13` 字节， 那么程序也会分配 `13` 字节的未使用空间， SDS 的 `buf` 数组的实际长度将变成 `13 + 13 + 1 = 27` 字节（额外的一字节用于保存空字符）。
  - 如果对 SDS 进行修改之后， SDS 的长度将大于等于 `1 MB` ， 那么程序会分配 `1 MB` 的未使用空间。 举个例子， 如果进行修改之后， SDS 的 `len` 将变成 `30 MB` ， 那么程序会分配 `1 MB` 的未使用空间， SDS 的 `buf` 数组的实际长度将为 `30 MB + 1 MB + 1 byte` 。

- 惰性空间释放

  惰性空间释放用于优化 SDS 的字符串缩短操作： 当 SDS 的 API 需要缩短 SDS 保存的字符串时， 程序并不立即使用内存重分配来回收缩短后多出来的字节， 而是使用 `free` 属性将这些字节的数量记录起来， 并等待将来使用。

#### 安全的二进制

​		C 字符串中的字符必须符合某种编码（比如 ASCII）， 并且除了字符串的末尾之外， 字符串里面不能包含空字符， 否则最先被程序读入的空字符将被误认为是字符串结尾 —— 这些限制使得 C 字符串只能保存文本数据， 而不能保存像图片、音频、视频、压缩文件这样的二进制数据。

​		为了确保 Redis 可以适用于各种不同的使用场景， SDS 的 API 都是二进制安全的（binary-safe）： 所有 SDS API 都会以处理二进制的方式来处理 SDS 存放在 `buf` 数组里的数据， 程序不会对其中的数据做任何限制、过滤、或者假设 —— 数据在写入时是什么样的， 它被读取时就是什么样。

#### 兼容部分C字符串函数

### 与C字符串的区别

| C 字符串                                             | SDS                                                  |
| :--------------------------------------------------- | :--------------------------------------------------- |
| 获取字符串长度的复杂度为 O(N) 。                     | 获取字符串长度的复杂度为 O(1) 。                     |
| API 是不安全的，可能会造成缓冲区溢出。               | API 是安全的，不会造成缓冲区溢出。                   |
| 修改字符串长度 `N` 次必然需要执行 `N` 次内存重分配。 | 修改字符串长度 `N` 次最多需要执行 `N` 次内存重分配。 |
| 只能保存文本数据。                                   | 可以保存文本或者二进制数据。                         |
| 可以使用所有 `` 库中的函数。                         | 可以使用一部分 `` 库中的函数。                       |

---

## 链表

![redis-listNode](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/redis-listNode.png)

链表提供了高效的节点重排能力， 以及顺序性的节点访问方式， 并且可以通过增删节点来灵活地调整链表的长度。

作为一种常用数据结构， 链表内置在很多高级的编程语言里面， 因为 Redis 使用的 C 语言并没有内置这种数据结构， 所以 Redis 构建了自己的链表实现。

链表在 Redis 中的应用非常广泛， 比如列表键的底层实现之一就是链表： 当一个列表键包含了数量比较多的元素， 又或者列表中包含的元素都是比较长的字符串时， Redis 就会使用链表作为列表键的底层实现。

### 结构体

每个链表节点使用一个 `adlist.h/listNode` 结构来表示：

```c
typedef struct listNode {

    // 前置节点
    struct listNode *prev;

    // 后置节点
    struct listNode *next;

    // 节点的值
    void *value;

} listNode;
```

虽然仅仅使用多个 `listNode` 结构就可以组成链表， 但使用 `adlist.h/list` 来持有链表的话， 操作起来会更方便：

```c
typedef struct list {

    // 表头节点
    listNode *head;

    // 表尾节点
    listNode *tail;

    // 链表所包含的节点数量
    unsigned long len;

    // 节点值复制函数
    void *(*dup)(void *ptr);

    // 节点值释放函数
    void (*free)(void *ptr);

    // 节点值对比函数
    int (*match)(void *ptr, void *key);

} list;
```

`list` 结构为链表提供了表头指针 `head` 、表尾指针 `tail` ， 以及链表长度计数器 `len` ， 而 `dup` 、 `free` 和 `match` 成员则是用于实现多态链表所需的类型特定函数：

- `dup` 函数用于复制链表节点所保存的值；
- `free` 函数用于释放链表节点所保存的值；
- `match` 函数则用于对比链表节点所保存的值和另一个输入值是否相等。

### 小结

Redis 的链表实现的特性可以总结如下：

- 双端： 链表节点带有 `prev` 和 `next` 指针， 获取某个节点的前置节点和后置节点的复杂度都是 O(1) 。
- 无环： 表头节点的 `prev` 指针和表尾节点的 `next` 指针都指向 `NULL` ， 对链表的访问以 `NULL` 为终点。
- 带表头指针和表尾指针： 通过 `list` 结构的 `head` 指针和 `tail` 指针， 程序获取链表的表头节点和表尾节点的复杂度为 O(1) 。
- 带链表长度计数器： 程序使用 `list` 结构的 `len` 属性来对 `list` 持有的链表节点进行计数， 程序获取链表中节点数量的复杂度为 O(1) 。
- 多态： 链表节点使用 `void*` 指针来保存节点值， 并且可以通过 `list` 结构的 `dup` 、 `free` 、 `match` 三个属性为节点值设置类型特定函数， 所以链表可以用于保存各种不同类型的值。

---

## 跳跃表

Redis 的跳跃表由 `server.h/zskiplistNode` 和 `server.h/zskiplist` 两个结构定义， 其中 `zskiplistNode` 结构用于表示跳跃表节点， 而 `zskiplist` 结构则用于保存跳跃表节点的相关信息， 比如节点的数量， 以及指向表头节点和表尾节点的指针， 等等。

### 结构

跳跃表节点的实现由 `redis.h/zskiplistNode` 结构定义：

```c
typedef struct zskiplistNode {

    // 后退指针
    struct zskiplistNode *backward;

    // 分值
    double score;

    // 成员对象
    robj *obj;

    // 层
    struct zskiplistLevel {

        // 前进指针
        struct zskiplistNode *forward;

        // 跨度
        unsigned int span;

    } level[];

} zskiplistNode;
```

虽然仅靠多个跳跃表节点就可以组成一个跳跃表，但通过使用一个 `zskiplist` 结构来持有这些节点， 程序可以更方便地对整个跳跃表进行处理， 比如快速访问跳跃表的表头节点和表尾节点， 又或者快速地获取跳跃表节点的数量（也即是跳跃表的长度）等信息。

`zskiplist` 结构的定义如下：

```
typedef struct zskiplist {

    // 表头节点和表尾节点
    struct zskiplistNode *header, *tail;

    // 表中节点的数量
    unsigned long length;

    // 表中层数最大的节点的层数
    int level;

} zskiplist;
```

`header` 和 `tail` 指针分别指向跳跃表的表头和表尾节点， 通过这两个指针， 程序定位表头节点和表尾节点的复杂度为 O(1) 。

通过使用 `length` 属性来记录节点的数量， 程序可以在 O(1) 复杂度内返回跳跃表的长度。

`level` 属性则用于在 O(1) 复杂度内获取跳跃表中层高最大的那个节点的层数量， 注意表头节点的层高并不计算在内。

![redis-zskiplist-struct](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/redis-zskiplist-struct.png)

### 层

跳跃表节点的 `level` 数组可以包含多个元素， 每个元素都包含一个指向其他节点的指针， 程序可以通过这些层来加快访问其他节点的速度， 一般来说， 层的数量越多， 访问其他节点的速度就越快。

每次创建一个新跳跃表节点的时候， 程序都根据幂次定律 （[power law](http://en.wikipedia.org/wiki/Power_law)，越大的数出现的概率越小） 随机生成一个介于 `1` 和 `32` 之间的值作为 `level` 数组的大小， 这个大小就是层的“高度”。

### 前进指针

每个层都有一个指向表尾方向的前进指针（`level[i].forward` 属性）， 用于从表头向表尾方向访问节点。

### 后退指针

节点的后退指针（`backward` 属性）用于从表尾向表头方向访问节点： 跟可以一次跳过多个节点的前进指针不同， 因为每个节点只有一个后退指针， 所以每次只能后退至前一个节点。

### 跨度

层的跨度（`level[i].span` 属性）用于记录两个节点之间的距离：

- 两个节点之间的跨度越大， 它们相距得就越远。
- 指向 `NULL` 的所有前进指针的跨度都为 `0` ， 因为它们没有连向任何节点。

### 分值和成员

节点的分值（`score` 属性）是一个 `double` 类型的浮点数， 跳跃表中的所有节点都按分值从小到大来排序。

节点的成员对象（`obj` 属性）是一个指针， 它指向一个字符串对象， 而字符串对象则保存着一个 SDS 值。

在同一个跳跃表中， 各个节点保存的成员对象必须是唯一的， 但是多个节点保存的分值却可以是相同的： 分值相同的节点将按照成员对象在字典序中的大小来进行排序， 成员对象较小的节点会排在前面（靠近表头的方向）， 而成员对象较大的节点则会排在后面（靠近表尾的方向）。



### 小结

- 跳跃表是有序集合的底层实现之一， 除此之外它在 Redis 中没有其他应用。
- Redis 的跳跃表实现由 `zskiplist` 和 `zskiplistNode` 两个结构组成， 其中 `zskiplist` 用于保存跳跃表信息（比如表头节点、表尾节点、长度）， 而 `zskiplistNode` 则用于表示跳跃表节点。
- 每个跳跃表节点的层高都是 `1` 至 `32` 之间的随机数。
- 在同一个跳跃表中， 多个节点可以包含相同的分值， 但每个节点的成员对象必须是唯一的。
- 跳跃表中的节点按照分值大小进行排序， 当分值相同时， 节点按照成员对象的大小进行排序。

---

## 字典

### 结构体

Redis 字典所使用的哈希表由 `dict.h/dictht` 结构定义：

```c
typedef struct dictht {

    // 哈希表数组
    dictEntry **table;

    // 哈希表大小
    unsigned long size;

    // 哈希表大小掩码，用于计算索引值
    // 总是等于 size - 1
    unsigned long sizemask;

    // 该哈希表已有节点的数量
    unsigned long used;

} dictht;
```

`table` 属性是一个数组， 数组中的每个元素都是一个指向 `dict.h/dictEntry` 结构的指针， 每个 `dictEntry` 结构保存着一个键值对。

`size` 属性记录了哈希表的大小， 也即是 `table` 数组的大小， 而 `used` 属性则记录了哈希表目前已有节点（键值对）的数量。

`sizemask` 属性的值总是等于 `size - 1` ， 这个属性和哈希值一起决定一个键应该被放到 `table` 数组的哪个索引上面。

哈希表节点使用 `dictEntry` 结构表示， 每个 `dictEntry` 结构都保存着一个键值对：

```c
typedef struct dictEntry {

    // 键
    void *key;

    // 值
    union {
        void *val;
        uint64_t u64;
        int64_t s64;
    } v;

    // 指向下个哈希表节点，形成链表
    struct dictEntry *next;

} dictEntry;
```

`key` 属性保存着键值对中的键， 而 `v` 属性则保存着键值对中的值， 其中键值对的值可以是一个指针， 或者是一个 `uint64_t` 整数， 又或者是一个 `int64_t` 整数。

`next` 属性是指向另一个哈希表节点的指针， 这个指针可以将多个哈希值相同的键值对连接在一次， 以此来解决键冲突（collision）的问题。

Redis 中的字典由 `dict.h/dict` 结构表示：

```c
typedef struct dict {

    // 类型特定函数
    dictType *type;

    // 私有数据
    void *privdata;

    // 哈希表
    dictht ht[2];

    // rehash 索引
    // 当 rehash 不在进行时，值为 -1
    int rehashidx; /* rehashing not in progress if rehashidx == -1 */

} dict;
```

`type` 属性和 `privdata` 属性是针对不同类型的键值对， 为创建多态字典而设置的：

- `type` 属性是一个指向 `dictType` 结构的指针， 每个 `dictType` 结构保存了一簇用于操作特定类型键值对的函数， Redis 会为用途不同的字典设置不同的类型特定函数。
- 而 `privdata` 属性则保存了需要传给那些类型特定函数的可选参数。

```c
typedef struct dictType {

    // 计算哈希值的函数
    unsigned int (*hashFunction)(const void *key);

    // 复制键的函数
    void *(*keyDup)(void *privdata, const void *key);

    // 复制值的函数
    void *(*valDup)(void *privdata, const void *obj);

    // 对比键的函数
    int (*keyCompare)(void *privdata, const void *key1, const void *key2);

    // 销毁键的函数
    void (*keyDestructor)(void *privdata, void *key);

    // 销毁值的函数
    void (*valDestructor)(void *privdata, void *obj);

} dictType;
```

`ht` 属性是一个包含两个项的数组， 数组中的每个项都是一个 `dictht` 哈希表， 一般情况下， 字典只使用 `ht[0]` 哈希表， `ht[1]` 哈希表只会在对 `ht[0]` 哈希表进行 rehash 时使用。

除了 `ht[1]` 之外， 另一个和 rehash 有关的属性就是 `rehashidx` ： 它记录了 rehash 目前的进度， 如果目前没有在进行 rehash ， 那么它的值为 `-1` 。

![redis-dict-struct](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/redis-dict-struct.png)

### 哈希算法

当字典被用作数据库的底层实现， 或者哈希键的底层实现时， Redis 使用 MurmurHash2 算法来计算键的哈希值。

### 哈希冲突

- 链地址法

  因为 `dictEntry` 节点组成的链表没有指向链表表尾的指针， 所以为了速度考虑， 程序总是将新节点添加到链表的表头位置（复杂度为 O(1)）， 排在其他已有节点的前面。

### rehash

**扩展和收缩**哈希表的工作可以通过执行 rehash （重新散列）操作来完成， Redis 对字典的哈希表执行 rehash 的步骤如下：

1. 为字典的`ht[1]`哈希表分配空间， 这个哈希表的空间大小取决于要执行的操作， 以及`ht[0]`当前包含的键值对数量 （也即是`ht[0].used`属性的值）：
   - 如果执行的是扩展操作， 那么 `ht[1]` 的大小为第一个大于等于 `ht[0].used * 2` 的 2^n^ （`2` 的 `n` 次方幂）；
   - 如果执行的是收缩操作， 那么 `ht[1]` 的大小为第一个大于等于 `ht[0].used` 的 2^n^ 。
2. 将保存在 `ht[0]` 中的所有键值对 rehash 到 `ht[1]` 上面： rehash 指的是重新计算键的哈希值和索引值， 然后将键值对放置到 `ht[1]` 哈希表的指定位置上。
3. 当 `ht[0]` 包含的所有键值对都迁移到了 `ht[1]` 之后 （`ht[0]` 变为空表）， 释放 `ht[0]` ， 将 `ht[1]` 设置为 `ht[0]` ， 并在 `ht[1]` 新创建一个空白哈希表， 为下一次 rehash 做准备。

#### 扩容和收缩的条件

当以下条件中的任意一个被满足时， 程序会自动开始对哈希表执行扩展操作

1. 服务器目前没有在执行 BGSAVE 命令或者 BGREWRITEAOF 命令， 并且哈希表的负载因子大于等于 `1` ；
2. 服务器目前正在执行 BGSAVE 命令或者 BGREWRITEAOF 命令， 并且哈希表的负载因子大于等于 `5` ；

其中哈希表的负载因子可以通过公式：

```
# 负载因子 = 哈希表已保存节点数量 / 哈希表大小
load_factor = ht[0].used / ht[0].size
```

计算得出。

根据 BGSAVE 命令或 BGREWRITEAOF 命令是否正在执行， 服务器执行扩展操作所需的负载因子并不相同， 这是因为在执行 BGSAVE 命令或 BGREWRITEAOF 命令的过程中， Redis 需要创建当前服务器进程的子进程， 而大多数操作系统都采用写时复制（[copy-on-write](http://en.wikipedia.org/wiki/Copy-on-write)）技术来优化子进程的使用效率， 所以在子进程存在期间， 服务器会提高执行扩展操作所需的负载因子， 从而尽可能地避免在子进程存在期间进行哈希表扩展操作， 这可以避免不必要的内存写入操作， 最大限度地节约内存。

另一方面， 当哈希表的负载因子小于 `0.1` 时， 程序自动开始对哈希表执行收缩操作。

### 渐进式哈希

扩展或收缩哈希表需要将 `ht[0]` 里面的所有键值对 rehash 到 `ht[1]` 里面， 但是， 这个 rehash 动作并不是一次性、集中式地完成的， 而是分多次、渐进式地完成的。

这样做的原因在于， 如果 `ht[0]` 里只保存着四个键值对， 那么服务器可以在瞬间就将这些键值对全部 rehash 到 `ht[1]` ； 但是， 如果哈希表里保存的键值对数量不是四个， 而是四百万、四千万甚至四亿个键值对， 那么要一次性将这些键值对全部 rehash 到 `ht[1]` 的话， 庞大的计算量可能会导致服务器在一段时间内停止服务。

因此， 为了避免 rehash 对服务器性能造成影响， 服务器不是一次性将 `ht[0]` 里面的所有键值对全部 rehash 到 `ht[1]` ， 而是分多次、渐进式地将 `ht[0]` 里面的键值对慢慢地 rehash 到 `ht[1]` 。

以下是哈希表渐进式 rehash 的详细步骤：

1. 为 `ht[1]` 分配空间， 让字典同时持有 `ht[0]` 和 `ht[1]` 两个哈希表。
2. 在字典中维持一个索引计数器变量 `rehashidx` ， 并将它的值设置为 `0` ， 表示 rehash 工作正式开始。
3. 在 rehash 进行期间， 每次对字典执行添加、删除、查找或者更新操作时， 程序除了执行指定的操作以外， 还会顺带将 `ht[0]` 哈希表在 `rehashidx` 索引上的所有键值对 rehash 到 `ht[1]` ， 当 rehash 工作完成之后， 程序将 `rehashidx` 属性的值增一。
4. 随着字典操作的不断执行， 最终在某个时间点上， `ht[0]` 的所有键值对都会被 rehash 至 `ht[1]` ， 这时程序将 `rehashidx` 属性的值设为 `-1` ， 表示 rehash 操作已完成。

渐进式 rehash 的好处在于它采取分而治之的方式， 将 rehash 键值对所需的计算工作均滩到对字典的每个添加、删除、查找和更新操作上， 从而避免了集中式 rehash 而带来的庞大计算量。

#### 渐进式 rehash 执行期间的哈希表操作

因为在进行渐进式 rehash 的过程中， 字典会同时使用 `ht[0]` 和 `ht[1]` 两个哈希表， 所以在渐进式 rehash 进行期间， 字典的删除（delete）、查找（find）、更新（update）等操作会在两个哈希表上进行： 比如说， 要在字典里面查找一个键的话， 程序会先在 `ht[0]` 里面进行查找， 如果没找到的话， 就会继续到 `ht[1]` 里面进行查找， 诸如此类。

另外， 在渐进式 rehash 执行期间， 新添加到字典的键值对一律会被保存到 `ht[1]` 里面， 而 `ht[0]` 则不再进行任何添加操作： 这一措施保证了 `ht[0]` 包含的键值对数量会只减不增， 并随着 rehash 操作的执行而最终变成空表。

### 小结

- 字典被广泛用于实现 Redis 的各种功能， 其中包括数据库和哈希键。
- Redis 中的字典使用哈希表作为底层实现， 每个字典带有两个哈希表， 一个用于平时使用， 另一个仅在进行 rehash 时使用。
- 当字典被用作数据库的底层实现， 或者哈希键的底层实现时， Redis 使用 MurmurHash2 算法来计算键的哈希值。
- 哈希表使用链地址法来解决键冲突， 被分配到同一个索引上的多个键值对会连接成一个单向链表。
- 在对哈希表进行扩展或者收缩操作时， 程序需要将现有哈希表包含的所有键值对 rehash 到新哈希表里面， 并且这个 rehash 过程并不是一次性地完成的， 而是渐进式地完成的。

---

## 整数集合

### 结构

整数集合（intset）是 Redis 用于保存整数值的集合抽象数据结构， 它可以保存类型为 `int16_t` 、 `int32_t` 或者 `int64_t` 的整数值， 并且保证集合中不会出现重复元素。

每个 `intset.h/intset` 结构表示一个整数集合：

```c
typedef struct intset {

    // 编码方式
    uint32_t encoding;

    // 集合包含的元素数量
    uint32_t length;

    // 保存元素的数组
    int8_t contents[];

} intset;
```

`contents` 数组是整数集合的底层实现： 整数集合的每个元素都是 `contents` 数组的一个数组项（item）， 各个项在数组中按值的大小从小到大有序地排列， 并且数组中不包含任何重复项。

`length` 属性记录了整数集合包含的元素数量， 也即是 `contents` 数组的长度。

虽然 `intset` 结构将 `contents` 属性声明为 `int8_t` 类型的数组， 但实际上 `contents` 数组并不保存任何 `int8_t` 类型的值 —— `contents` 数组的真正类型取决于 `encoding` 属性的值：

- 如果 `encoding` 属性的值为 `INTSET_ENC_INT16` ， 那么 `contents` 就是一个 `int16_t` 类型的数组， 数组里的每个项都是一个 `int16_t` 类型的整数值 （最小值为 `-32,768` ，最大值为 `32,767` ）。
- 如果 `encoding` 属性的值为 `INTSET_ENC_INT32` ， 那么 `contents` 就是一个 `int32_t` 类型的数组， 数组里的每个项都是一个 `int32_t` 类型的整数值 （最小值为 `-2,147,483,648` ，最大值为 `2,147,483,647` ）。
- 如果 `encoding` 属性的值为 `INTSET_ENC_INT64` ， 那么 `contents` 就是一个 `int64_t` 类型的数组， 数组里的每个项都是一个 `int64_t` 类型的整数值 （最小值为 `-9,223,372,036,854,775,808` ，最大值为 `9,223,372,036,854,775,807` ）。

### 升级

每当我们要将一个新元素添加到整数集合里面， 并且新元素的类型比整数集合现有所有元素的类型都要长时， 整数集合需要先进行升级（upgrade）， 然后才能将新元素添加到整数集合里面。

升级整数集合并添加新元素共分为三步进行：

1. 根据新元素的类型， 扩展整数集合底层数组的空间大小， 并为新元素分配空间。
2. 将底层数组现有的所有元素都转换成与新元素相同的类型， 并将类型转换后的元素放置到正确的位上， 而且在放置元素的过程中， 需要继续维持底层数组的有序性质不变。（后移）
3. 将新元素添加到底层数组里面。

#### 升级的好处

- 提升灵活性
- 节约内存

### 降级

> 只可升级，不可降级

### 小结

- 整数集合是集合键的底层实现之一。
- 整数集合的底层实现为数组， 这个数组以有序、无重复的方式保存集合元素， 在有需要时， 程序会根据新添加元素的类型， 改变这个数组的类型。
- 升级操作为整数集合带来了操作上的灵活性， 并且尽可能地节约了内存。
- 整数集合只支持升级操作， 不支持降级操作。

---

## 压缩链表

### 结构

#### previous_entry_length

节点的 `previous_entry_length` 属性以字节为单位， 记录了压缩列表中前一个节点的长度。

`previous_entry_length` 属性的长度可以是 `1` 字节或者 `5` 字节：

- 如果前一节点的长度小于 `254` 字节， 那么 `previous_entry_length` 属性的长度为 `1` 字节： 前一节点的长度就保存在这一个字节里面。
- 如果前一节点的长度大于等于 `254` 字节， 那么 `previous_entry_length` 属性的长度为 `5` 字节： 其中属性的第一字节会被设置为 `0xFE` （十进制值 `254`）， 而之后的四个字节则用于保存前一节点的长度。

#### encoding

节点的 `encoding` 属性记录了节点的 `content` 属性所保存数据的类型以及长度：

- 一字节、两字节或者五字节长， 值的最高位为 `00` 、 `01` 或者 `10` 的是字节数组编码： 这种编码表示节点的 `content` 属性保存着字节数组， 数组的长度由编码除去最高两位之后的其他位记录；
- 一字节长， 值的最高位以 `11` 开头的是整数编码： 这种编码表示节点的 `content` 属性保存着整数值， 整数值的类型和长度由编码除去最高两位之后的其他位记录；

#### content

节点的 `content` 属性负责保存节点的值， 节点值可以是一个字节数组或者整数， 值的类型和长度由节点的 `encoding` 属性决定。



### 连锁更新

每个节点的 `previous_entry_length` 属性都记录了前一个节点的长度：

- 如果前一节点的长度小于 `254` 字节， 那么 `previous_entry_length` 属性需要用 `1` 字节长的空间来保存这个长度值。
- 如果前一节点的长度大于等于 `254` 字节， 那么 `previous_entry_length` 属性需要用 `5` 字节长的空间来保存这个长度值。

现在， 考虑这样一种情况： 在一个压缩列表中， 有多个连续的、长度介于 `250` 字节到 `253` 字节之间的节点 `e1` 至 `eN` ，因为 `e1` 至 `eN` 的所有节点的长度都小于 `254` 字节， 所以记录这些节点的长度只需要 `1` 字节长的 `previous_entry_length` 属性， 换句话说， `e1` 至 `eN` 的所有节点的 `previous_entry_length` 属性都是 `1` 字节长的。

这时， 如果我们将一个长度大于等于 `254` 字节的新节点 `new` 设置为压缩列表的表头节点， 那么 `new` 将成为 `e1` 的前置节点，因为 `e1` 的 `previous_entry_length` 属性仅长 `1` 字节， 它没办法保存新节点 `new` 的长度， 所以程序将对压缩列表执行空间重分配操作， 并将 `e1` 节点的 `previous_entry_length` 属性从原来的 `1` 字节长扩展为 `5` 字节长。

现在， 麻烦的事情来了 —— `e1` 原本的长度介于 `250` 字节至 `253` 字节之间， 在为 `previous_entry_length` 属性新增四个字节的空间之后， `e1` 的长度就变成了介于 `254` 字节至 `257` 字节之间， 而这种长度使用 `1` 字节长的 `previous_entry_length` 属性是没办法保存的。

因此， 为了让 `e2` 的 `previous_entry_length` 属性可以记录下 `e1` 的长度， 程序需要再次对压缩列表执行空间重分配操作， 并将 `e2` 节点的 `previous_entry_length` 属性从原来的 `1` 字节长扩展为 `5` 字节长。

正如扩展 `e1` 引发了对 `e2` 的扩展一样， 扩展 `e2` 也会引发对 `e3` 的扩展， 而扩展 `e3` 又会引发对 `e4` 的扩展……为了让每个节点的 `previous_entry_length` 属性都符合压缩列表对节点的要求， 程序需要不断地对压缩列表执行空间重分配操作， 直到 `eN` 为止。

Redis 将这种在特殊情况下产生的连续多次空间扩展操作称之为“连锁更新”（cascade update）。

因为连锁更新在最坏情况下需要对压缩列表执行 `N` 次空间重分配操作， 而每次空间重分配的最坏复杂度为 O(N) ， 所以连锁更新的最坏复杂度为 O(N^2) 。

要注意的是， 尽管连锁更新的复杂度较高， 但它真正造成性能问题的几率是很低的：

- 首先， 压缩列表里要恰好有多个连续的、长度介于 `250` 字节至 `253` 字节之间的节点， 连锁更新才有可能被引发， 在实际中， 这种情况并不多见；
- 其次， 即使出现连锁更新， 但只要被更新的节点数量不多， 就不会对性能造成任何影响： 比如说， 对三五个节点进行连锁更新是绝对不会影响性能的；

因为以上原因， `ziplistPush` 等命令的平均复杂度仅为 O(N) ， 在实际中， 我们可以放心地使用这些函数， 而不必担心连锁更新会影响压缩列表的性能。

### 小结

- 压缩列表是一种为节约内存而开发的顺序型数据结构。
- 压缩列表被用作列表键和哈希键的底层实现之一。
- 压缩列表可以包含多个节点，每个节点可以保存一个字节数组或者整数值。
- 添加新节点到压缩列表， 或者从压缩列表中删除节点， 可能会引发连锁更新操作， 但这种操作出现的几率并不高。

---

