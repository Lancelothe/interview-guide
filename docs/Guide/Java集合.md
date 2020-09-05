![Java-Collection](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/Collection.png)

[java集合框架（深入） \- TesterMa \- 博客园](https://www.cnblogs.com/TestMa/p/10641367.html)

## [Arraylist 与 LinkedList 区别?](https://snailclimb.gitee.io/javaguide/#/docs/java/collection/Java集合框架常见面试题?id=arraylist-与-linkedlist-区别)

- **1. 是否保证线程安全：** `ArrayList` 和 `LinkedList` 都是不同步的，也就是不保证线程安全；
- **2. 底层数据结构：** `Arraylist` 底层使用的是 **`Object` 数组**；`LinkedList` 底层使用的是 **双向链表** 数据结构（JDK1.6之前为循环链表，JDK1.7取消了循环。注意双向链表和双向循环链表的区别，下面有介绍到！）
- **3. 插入和删除是否受元素位置的影响：** ① **`ArrayList` 采用数组存储，所以插入和删除元素的时间复杂度受元素位置的影响。** 比如：执行`add(E e)`方法的时候， `ArrayList` 会默认在将指定的元素追加到此列表的末尾，这种情况时间复杂度就是O(1)。但是如果要在指定位置 i 插入和删除元素的话（`add(int index, E element)`）时间复杂度就为 O(n-i)。因为在进行上述操作的时候集合中第 i 和第 i 个元素之后的(n-i)个元素都要执行向后位/向前移一位的操作。 ② **`LinkedList` 采用链表存储，所以对于`add(E e)`方法的插入，删除元素时间复杂度不受元素位置的影响，近似 O（1），如果是要在指定位置`i`插入和删除元素的话（`(add(int index, E element)`） 时间复杂度近似为`o(n))`因为需要先移动到指定位置再插入。**
- **4. 是否支持快速随机访问：** `LinkedList` 不支持高效的随机元素访问，而 `ArrayList` 支持。快速随机访问就是通过元素的序号快速获取元素对象(对应于`get(int index)`方法)。
- **5. 内存空间占用：** ArrayList的空间浪费主要体现在在list列表的结尾会预留一定的容量空间，而LinkedList的空间花费则体现在它的每一个元素都需要消耗比ArrayList更多的空间（因为要存放直接后继和直接前驱以及数据）。

### [**RandomAccess接口**](https://snailclimb.gitee.io/javaguide/#/docs/java/collection/Java集合框架常见面试题?id=补充内容randomaccess接口)

```java
public interface RandomAccess {
}
```

查看源码我们发现实际上 `RandomAccess` 接口中什么都没有定义。所以，在我看来 `RandomAccess` 接口不过是一个标识罢了。标识什么？ 标识实现这个接口的类具有随机访问功能。

在 `binarySearch（`）方法中，它要判断传入的list 是否 `RamdomAccess` 的实例，如果是，调用`indexedBinarySearch（）`方法，如果不是，那么调用`iteratorBinarySearch（）`方法

```java
    public static <T>
    int binarySearch(List<? extends Comparable<? super T>> list, T key) {
        if (list instanceof RandomAccess || list.size()<BINARYSEARCH_THRESHOLD)
            return Collections.indexedBinarySearch(list, key);
        else
            return Collections.iteratorBinarySearch(list, key);
    }
```

`ArrayList` 实现了 `RandomAccess` 接口， 而 `LinkedList` 没有实现。为什么呢？我觉得还是和底层数据结构有关！`ArrayList` 底层是数组，而 `LinkedList` 底层是链表。数组天然支持随机访问，时间复杂度为 O（1），所以称为快速随机访问。链表需要遍历到特定位置才能访问特定位置的元素，时间复杂度为 O（n），所以不支持快速随机访问。，`ArrayList` 实现了 `RandomAccess` 接口，就表明了他具有快速随机访问功能。 **`RandomAccess` 接口只是标识，并不是说 `ArrayList` 实现 `RandomAccess` 接口才具有快速随机访问功能的！**

**下面再总结一下 list 的遍历方式选择：**

- 实现了 `RandomAccess` 接口的list，优先选择普通 for 循环 ，其次 foreach,
- 未实现 `RandomAccess`接口的list，优先选择iterator遍历（foreach遍历底层也是通过iterator实现的,），大size的数据，千万不要使用普通for循环



## 说一说 ArrayList 的扩容机制吧

1. **以无参数构造方法创建 ArrayList 时，实际上初始化赋值的是一个空数组。当真正对数组进行添加元素操作时，才真正分配容量。即向数组中添加第一个元素时，数组容量扩为10。**

2. 确认大小

3. ```java
   // 添加元素之前，先调用ensureCapacityInternal方法
   // 获取默认的容量和传入参数的较大值
   minCapacity = Math.max(DEFAULT_CAPACITY, minCapacity);
   // 判断是否超出数据容量， 是则扩容
   ensureExplicitCapacity(minCapacity);
   ```

3. grow方法

   ```java
   // grow()代码里————我们知道位运算的速度远远快于整除运算，整句运算式的结果就是将新容量更新为旧容量的1.5倍，
   int newCapacity = oldCapacity + (oldCapacity >> 1);
   ```

   ##### `hugeCapacity()` 方法。

   从上面 `grow()` 方法源码我们知道： 如果新容量大于 MAX_ARRAY_SIZE,进入(执行) `hugeCapacity()` 方法来比较 minCapacity 和 MAX_ARRAY_SIZE，如果minCapacity大于最大容量，则新容量则为`Integer.MAX_VALUE`，否则，新容量大小则为 MAX_ARRAY_SIZE 即为 `Integer.MAX_VALUE - 8`。

应用程序可以使用`ensureCapacity`操作来增加 ArrayList 实例的容量。这可以减少递增式再分配的数量。

**这里补充一点比较重要，但是容易被忽视掉的知识点：**

- java 中的 `length `属性是针对数组说的,比如说你声明了一个数组,想知道这个数组的长度则用到了 length 这个属性.
- java 中的 `length()` 方法是针对字符串说的,如果想看这个字符串的长度则用到 `length()` 这个方法.
- java 中的 `size()` 方法是针对泛型集合说的,如果想看这个泛型有多少个元素,就调用此方法来查看!

## [Map](https://snailclimb.gitee.io/javaguide/#/docs/java/collection/Java集合框架常见面试题?id=map)

- **HashMap：** JDK1.8之前HashMap由数组+链表组成的，数组是HashMap的主体，链表则是主要为了解决哈希冲突而存在的（“拉链法”解决冲突）。JDK1.8以后在解决哈希冲突时有了较大的变化，当链表长度大于阈值（默认为8）时，将链表转化为红黑树，以减少搜索时间
- **LinkedHashMap：** LinkedHashMap 继承自 HashMap，所以它的底层仍然是基于拉链式散列结构即由数组和链表或红黑树组成。另外，LinkedHashMap 在上面结构的基础上，增加了一条双向链表，使得上面的结构可以保持键值对的插入顺序。同时通过对链表进行相应的操作，实现了访问顺序相关逻辑。详细可以查看：[《LinkedHashMap 源码详细分析（JDK1.8）》](https://www.imooc.com/article/22931)
- **Hashtable：** 数组+链表组成的，数组是 HashMap 的主体，链表则是主要为了解决哈希冲突而存在的
- **TreeMap：** 红黑树（自平衡的排序二叉树）

## [HashMap 和 Hashtable 的区别](https://snailclimb.gitee.io/javaguide/#/docs/java/collection/Java集合框架常见面试题?id=hashmap-和-hashtable-的区别)

1. **线程是否安全：** HashMap 是非线程安全的，HashTable 是线程安全的；HashTable 内部的方法基本都经过`synchronized` 修饰。（如果你要保证线程安全的话就使用 ConcurrentHashMap 吧！）；
2. **效率：** 因为线程安全的问题，HashMap 要比 HashTable 效率高一点。另外，HashTable 基本被淘汰，不要在代码中使用它；
3. **对Null key 和Null value的支持：** HashMap 中，null 可以作为键，这样的键只有一个，可以有一个或多个键所对应的值为 null。。但是在 HashTable 中 put 进的键值只要有一个 null，直接抛出 NullPointerException。
4. **初始容量大小和每次扩充容量大小的不同 ：** ①创建时如果不指定容量初始值，Hashtable 默认的初始大小为11，之后每次扩充，容量变为原来的2n+1。HashMap 默认的初始化大小为16。之后每次扩充，容量变为原来的2倍。②创建时如果给定了容量初始值，那么 Hashtable 会直接使用你给定的大小，而 HashMap 会将其扩充为2的幂次方大小（HashMap 中的`tableSizeFor()`方法保证，下面给出了源代码）。也就是说 HashMap 总是使用2的幂作为哈希表的大小,后面会介绍到为什么是2的幂次方。
5. **底层数据结构：** JDK1.8 以后的 HashMap 在解决哈希冲突时有了较大的变化，当链表长度大于阈值（默认为8）时，将链表转化为红黑树，以减少搜索时间。Hashtable 没有这样的机制。

`Collections.synchronizedMap`怎么实现线程安全的：

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/SynchronizedMap.png)



### 为什么Hashtable 是不允许键或值为 null 的，HashMap 的键值则都可以为 null？

这是因为Hashtable使用的是**安全失败机制（fail-safe）**，这种机制会使你此次读到的数据不一定是最新的数据。

如果你使用null值，就会使得其无法判断对应的key是不存在还是为空，因为你无法再调用一次contain(key）来对key是否存在进行判断，ConcurrentHashMap同理。

### fail-fast是什么

**快速失败（fail—fast）**是java集合中的一种机制， 在用迭代器遍历一个集合对象时，如果遍历过程中对集合对象的内容进行了修改（增加、删除、修改），则会抛出Concurrent Modification Exception。

迭代器在遍历时直接访问集合中的内容，并且在遍历过程中使用一个 modCount 变量。

集合在被遍历期间如果内容发生变化，就会改变modCount的值。

每当迭代器使用hashNext()/next()遍历下一个元素之前，都会检测modCount变量是否为expectedmodCount值，是的话就返回遍历；否则抛出异常，终止遍历。

**Tip**：这里异常的抛出条件是检测到 `modCount != expectedmodCount` 这个条件。如果集合发生变化时修改modCount值刚好又设置为了expectedmodCount值，则异常不会抛出。

java.util包下的集合类都是快速失败的，不能在多线程下发生并发修改（迭代过程中被修改）算是一种安全机制吧。

**安全失败（fail—safe）**大家也可以了解下，java.util.concurrent包下的容器都是安全失败，可以在多线程下并发使用，并发修改。

## HashMap的底层实现

[掌握 HashMap 看这一篇文章就够了](https://mp.weixin.qq.com/s/SuOAv2U5eosuaEfm37EtRA)

[HashMap面试题解答 \- windpoplar \- 博客园](https://www.cnblogs.com/windpoplar/p/11901486.html)

[面试：HashMap 夺命二十一问！](https://mp.weixin.qq.com/s/7fcdGEPmpmvxylP2e7RBqQ)

### 扰动函数

**HashMap 通过 key 的 hashCode 经过扰动函数处理过后得到 hash 值，然后通过 (n - 1) & hash 判断当前元素存放的位置（这里的 n 指的是数组的长度），如果当前位置存在元素的话，就判断该元素与要存入的元素的 hash 值以及 key 是否相同，如果相同的话，直接覆盖，不相同就通过拉链法解决冲突。**

**所谓扰动函数指的就是 HashMap 的 hash 方法。使用 hash 方法也就是扰动函数是为了防止一些实现比较差的 hashCode() 方法 换句话说使用扰动函数之后可以减少碰撞。**

**JDK 1.8 HashMap 的 hash 方法源码:**

JDK 1.8 的 hash方法 相比于 JDK 1.7 hash 方法更加简化，但是原理不变。

```java
    static final int hash(Object key) {
      int h;
      // key.hashCode()：返回散列值也就是hashcode
      // ^ ：按位异或
      // >>>:无符号右移，忽略符号位，空位都以0补齐
      return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
  }
```

对比一下 JDK1.7的 HashMap 的 hash 方法源码.

```java
static int hash(int h) {
    // This function ensures that hashCodes that differ only by
    // constant multiples at each bit position have a bounded
    // number of collisions (approximately 8 at default load factor).

    h ^= (h >>> 20) ^ (h >>> 12);
    return h ^ (h >>> 7) ^ (h >>> 4);
}
```

相比于 JDK1.8 的 hash 方法 ，JDK 1.7 的 hash 方法的性能会稍差一点点，因为毕竟扰动了 4 次。

[深入理解 hashcode\(\) 和 HashMap 中的hash 算法\_Java\_nO0b\-CSDN博客](https://blog.csdn.net/q5706503/article/details/85114159)

[HashMap原理以及为什么需要同时实现equals和hashcode \- 简书](https://www.jianshu.com/p/316284bf1217)

[java中hashmap为什么key的值不一样调用hashcode的hash值为什么相同？ \- 知乎](https://www.zhihu.com/question/355013552)

### 数据结构

在Java7叫Entry，在Java8中叫Node。

#### 1.8之前

链表数组，数组中每一格就是一个链表。若遇到哈希冲突，则将冲突的值加到链表中即可。

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/JDK1.8之前的内部结构-HashMap.png)

#### 1.8之后

相比于之前的版本， JDK1.8之后在解决哈希冲突时有了较大的变化，当链表长度大于阈值（默认为8）时，将链表转化为红黑树，以减少搜索时间。

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/JDK1.8之后的内部结构-HashMap.png)

## 新的Entry节点在插入链表的时候，是怎么插入的么？

**Java8之前是头插法**，就是说新来的值会取代原有的值，原有的值就顺推到链表中去，就像上面的例子一样，因为写这个代码的作者认为后来的值被查找的可能性更大一点，提升查找的效率。

但是，**在Java8之后，都是所用尾部插入了。**

### 为什么改为尾插法

因在多线程插入resize扩容rehash到另一个entry时产生环形链表。

### Java8为什么不会出问题

因为**Java8之后链表有红黑树**的部分，大家可以看到代码已经多了很多if else的逻辑判断了，红黑树的引入巧妙的将原本O(n)的时间复杂度降低到了O(logn)。

**使用头插**会改变链表的上的顺序，但是如果**使用尾插**，在扩容时会保持链表元素原本的顺序，就不会出现链表成环的问题了。

> 总结：
>
> Java7在多线程操作HashMap时可能引起死循环，原因是扩容转移后前后链表顺序倒置，在转移过程中修改了原来链表中节点的引用关系。
>
> Java8在同样的前提下并不会引起死循环，原因是扩容转移后前后链表顺序不变，保持之前节点的引用关系。

### 为什么当桶中键值对数量大于8才转换成红黑树，数量小于6才转换成链表？

[HashMap的工作原理以及代码实现，为什么要转换成红黑树？ \- littlecarzz \- 博客园](https://www.cnblogs.com/xc-chejj/p/10825676.html)

HashMap在JDK1.8及以后的版本中引入了红黑树结构，若桶中链表元素个数大于等于8时，链表转换成树结构；若桶中链表元素个数小于等于6时，树结构还原成链表。因为红黑树的平均查找长度是log(n)，长度为8的时候，平均查找长度为3，如果继续使用链表，平均查找长度为8/2=4，这才有转换为树的必要。链表长度如果是小于等于6，6/2=3，虽然速度也很快的，但是转化为树结构和生成树的时间并不会太短。

还有选择6和8，中间有个差值7可以有效防止链表和树频繁转换。假设一下，如果设计成链表个数超过8则链表转换成树结构，链表个数小于8则树结构转换成链表，如果一个HashMap不停的插入、删除元素，链表个数在8左右徘徊，就会频繁的发生树转链表、链表转树，效率会很低。

## [HashMap 的长度为什么是2的幂次方](https://snailclimb.gitee.io/javaguide/#/docs/java/collection/Java集合框架常见面试题?id=hashmap-的长度为什么是2的幂次方)

为了能让 HashMap 存取高效，尽量较少碰撞，也就是要尽量把数据分配均匀。我们上面也讲到了过了，Hash 值的范围值-2147483648到2147483647，前后加起来大概40亿的映射空间，只要哈希函数映射得比较均匀松散，一般应用是很难出现碰撞的。但问题是一个40亿长度的数组，内存是放不下的。所以这个散列值是不能直接拿来用的。用之前还要先做对数组的长度取模运算，得到的余数才能用来要存放的位置也就是对应的数组下标。

这个数组下标的计算方法`indexFor方法`是“ `(n - 1) & hash`”。（n代表数组长度）。这也就解释了 HashMap 的长度为什么是2的幂次方。

> 位运算(&)效率要比代替取模运算(%)高很多，主要原因是位运算直接对内存数据进行操作，不需要转成十进制，因此处理速度非常快。

**这个算法应该如何设计呢？**

我们首先可能会想到采用%取余的操作来实现。但是，重点来了：**“取余(%)操作中如果除数是2的幂次则等价于与其除数减一的与(&)操作（也就是说 hash%length==hash&(length-1)的前提是 length 是2的 n 次方；）。”** 并且 **采用二进制位操作 &，相对于%能够提高运算效率，这就解释了 HashMap 的长度为什么是2的幂次方。**

### HashMap是如何保证其容量一定可以是2^n 的呢

#### 指定容量初始化

HashMap根据用户传入的初始化容量，利用无符号右移和按位或运算等方式计算出第一个大于该数的2的幂。

#### 扩容

HashMap的扩容条件就是当HashMap中的元素个数（size）超过临界值（threshold）时就会自动扩容。

threshold = loadFactor * capacity。

loadFactor是装载因子，表示HashMap满的程度，默认值为0.75f，设置成0.75有一个好处，那就是0.75正好是3/4，而capacity又是2的幂。所以，两个数的乘积都是整数。

当HashMap中的元素个数（size）超过临界值（threshold）时就会自动扩容，**扩容成原容量的2倍**。

### 解决Hash冲突的几种方法：

1. 拉链法

   每个哈希表节点都有一个next指针，多个哈希表节点可以用next指针构成一个单向链表，被分配到同一个索引上的多个节点可以用这个单向链表连接起来。

2. 开放定址法

   一旦发生了冲突，就去寻找下一个空的散列地址，只要散列表足够大，空的散列地址总能找到，并将记录存入 。
   公式为：fi(key) = (f(key)+di) MOD m (di=1,2,3,……,m-1) 

3. 再哈希法

   又叫双哈希法，有多个不同的Hash函数，当发生冲突时，使用第二个，第三个，….，等哈希函数
   计算地址，直到无冲突。虽然不易发生聚集，但是增加了计算时间。

4. 建立公共溢出区

   将哈希表分为基本表和溢出表两部分，凡是和基本表发生冲突的元素，一律填入溢出表。

[全网把Map中的hash\(\)分析的最透彻的文章，别无二家。](https://mp.weixin.qq.com/s?__biz=MzI3NzE0NjcwMg==&mid=2650120877&idx=1&sn=401bb7094d41918f1a6e142b6c66aaac&chksm=f36bbf8cc41c369aa44c319942b06ca0f119758b22e410e8f705ba56b9ac6d4042fe686dbed4&scene=21#wechat_redirect)

## ConcurrentHashMap

**JDK1.7的ConcurrentHashMap：**

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/JDK1.7的ConcurrentHashMap.png)

**JDK1.8的ConcurrentHashMap（TreeBin: 红黑二叉树节点 Node: 链表节点）：**

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/JDK1.8的ConcurrentHashMap.png)

## [ConcurrentHashMap线程安全的具体实现方式/底层具体实现](https://snailclimb.gitee.io/javaguide/#/docs/java/collection/Java集合框架常见面试题?id=concurrenthashmap线程安全的具体实现方式底层具体实现)

### JDK1.7

首先将数据分为一段一段的存储，然后给每一段数据配一把锁，当一个线程占用锁访问其中一个段数据时，其他段的数据也能被其他线程访问。

**ConcurrentHashMap 是由 Segment 数组结构和 HashEntry 数组结构组成**。

Segment 实现了 ReentrantLock，所以 **Segment 是一种可重入锁**，扮演锁的角色。HashEntry 用于存储键值对数据。

使用volatile去修饰了他的数据Value还有下一个节点next。

`put()`方法逻辑：

首先第一步的时候会尝试获取锁，如果获取失败肯定就有其他线程存在竞争，则利用 `scanAndLockForPut()` 自旋获取锁。

1. 尝试自旋获取锁。
2. 如果重试的次数达到了 `MAX_SCAN_RETRIES` 则改为阻塞锁获取，保证能获取成功。

`get()`方法逻辑：

get 逻辑比较简单，只需要将 Key 通过 Hash 之后定位到具体的 Segment ，再通过一次 Hash 定位到具体的元素上。

由于 HashEntry 中的 value 属性是用 volatile 关键词修饰的，保证了内存可见性，所以每次获取时都是最新值。

ConcurrentHashMap 的 get 方法是非常高效的，**因为整个过程都不需要加锁**。

### JDK1.8

采用了 `CAS + synchronized` 来保证并发安全性。

synchronized 只锁定当前链表或红黑二叉树的首节点，这样只要 hash 不冲突，就不会产生并发，效率又提升 N 倍。

把之前的HashEntry改成了Node，但是作用不变，把值和next采用了volatile去修饰，保证了可见性，并且也引入了红黑树，在链表大于一定值的时候会转换（默认是8）。

`put()`操作步骤：

1. 根据 key 计算出 hashcode 。
2. 判断是否需要进行初始化。
3. 即为当前 key 定位出的 Node，如果为空表示当前位置可以写入数据，利用 CAS 尝试写入，失败则自旋保证成功。
4. 如果当前位置的 `hashcode == MOVED == -1`,则需要进行扩容。
5. 如果都不满足，则利用 synchronized 锁写入数据。
6. 如果数量大于 `TREEIFY_THRESHOLD` 则要转换为红黑树。

小结：1.8 在 1.7 的数据结构上做了大的改动，采用红黑树之后可以保证查询效率（`O(logn)`），甚至取消了 ReentrantLock 改为了 synchronized，这样可以看出在新版的 JDK 中对 synchronized 优化是很到位的。

## [Comparable 和 Comparator 的区别](https://snailclimb.gitee.io/javaguide/#/docs/java/collection/Java集合框架常见面试题?id=comparable-和-comparator的区别)

- comparable接口实际上是出自java.lang包 它有一个 `compareTo(Object obj)`方法用来排序
- comparator接口实际上是出自 java.util 包它有一个`compare(Object obj1, Object obj2)`方法用来排序

一般我们需要对一个集合使用自定义排序时，我们就要重写`compareTo()`方法或`compare()`方法，当我们需要对某一个集合实现两种排序方式，比如一个song对象中的歌名和歌手名分别采用一种排序方法的话，我们可以重写`compareTo()`方法和使用自制的Comparator方法或者以两个Comparator来实现歌名排序和歌星名排序，第二种代表我们只能使用两个参数版的 `Collections.sort()`.

### TreeMap按照Value怎么排序

TreeMap底层是根据红黑树的数据结构构建的，默认是根据key的自然排序来组织（比如integer的大小，String的字典排序）。所以，TreeMap只能根据key来排序，是不能根据value来排序的（否则key来排序根本就不能形成TreeMap）。

今天有个需求，就是要根据treeMap中的value排序。所以网上看了一下，大致的思路是把TreeMap的EntrySet转换成list，然后使用Collections.sor排序

```java
List<Map.Entry<String, String>> list = new ArrayList<Map.Entry<String, String>>(map.entrySet());
Collections.sort(list,new Comparator<Map.Entry<String, String>>() {
public int compare(Map.Entry<String, String> o1, Map.Entry<String, String> o2) {
		return o1.getValue().compareTo(o2.getValue());
	}
});

for (Map.Entry<String, String> entry : list) {
	System.out.println(entry.getKey()+"---"+entry.getValue());
}
```


