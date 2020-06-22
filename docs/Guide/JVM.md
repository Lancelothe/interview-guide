好文推荐：

[看完这篇垃圾回收，和面试官扯皮没问题了](https://mp.weixin.qq.com/s?__biz=MzIxNjA5MTM2MA==&mid=2652436610&idx=2&sn=49dd8b6268b8674911baabd03096523f&scene=21#wechat_redirect)

[看过无数Java GC文章，这5个问题你也未必知道！](https://mp.weixin.qq.com/s?__biz=MzIxNjA5MTM2MA==&mid=2652436890&idx=2&sn=f3476873cc5ee8d9287ddf5729220bf2&chksm=8c620615bb158f036c331b13af1af94c2bc729f2b7388973cd7befc95428c7df48e68d2af265&scene=90&xtrack=1&subscene=93&clicktime=1585541478&enterid=1585541478&ascene=56&devicetype=android-28&version=27000d37&nettype=WIFI&abtest_cookie=AAACAA%3D%3D&lang=zh_CN&exportkey=AwzjAwcZiChUvX6ElatRmVk%3D&pass_ticket=1TpTHIdVUnjPrKPmK3tQqNnOEn69o6gWL1LxhxQTBtUDXmGRXw6MzXBJ1I%2F8uYFI&wx_header=1)

## JMM（JVM内存模型 Java Memory Model）

JMM描述了Java多线程对共享变量的访问规则，以及在JVM中将变量存储到内存和从内存中读取变量这样的底层细节。

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/Java内存模型-1.png)

java内存模型如上图所示，每个线程都有自己独立的工作内存，当线程要访问内存中的变量时，会先将内存中的变量值复制到自己的工作内存，然后再访问；当线程要改变内存中的变量值时，也是先改变自己工作内存中副本的变量值，然后再刷新到内存中。当线程一改变了某个变量的值，而线程二想要访问该值时，可能会存在以下情况，即线程一的改变还没刷到内存，或者线程二里面缓存了老值，没有去内存中拿最新的值，这时就相当于线程一的改变对线程二不可见了。

Java通过以下几种方式来保证变量在线程之间的可见性：

- synchronized 当线程调用synchronized修饰的方法（代码块）时，会清空自己工作内存中所有的共享变量，并从内存中重新读取，这样就保证了可以看到别的线程做的改动；当退出synchronzied函数时，会将工作内存中所有更新过的共享变量的值回写到内存中，保证其他线程可以读到该线程更改的值。
- volatile volatile变量也能保证可见性，每次对volatile的读操作都会导致工作内存中的变量被内存中的最新值覆盖，对volatile的写操作，也会马上更新到主内存中去，这样就保证了每个线程对变量的改变对其他线程都是可见的。
   **synchronized 和volatile**的不同：
   既然synchronized可以实现可见性了为啥还引入volatile呢？两者虽然都能实现可见性，还是有不同之处的，synchronized需要对程序加锁，比较耗费资源；synchronized修饰的代码块，在一个线程退出去之前，其他线程是不能访问的，这样就提供了对某地代码的原子性操作。volatile则比较轻便，不需要加锁，但是不能保证操作的原子性，像i++，这种操作，它是无法保证结果正确的。
- final final修饰的变量不会在构造函数返回前被访问到，这样就可以保证final变量的不可变性。因为如果因为指令重排序，其他线程在final对象还没初始化完之前拿到了该变量的引用，有可能读到一个初始化之前的值，然后后面再读又读到一个初始化之后的值，造成的现象就是final修饰的变量值可变了。
- cocurrent包 java concurrent jar包提供了大量同步代码块的工具，方便我们正确的同步各个线程的执行。
- **double-checked locking的问题**

[什么是Java内存模型 \- 简书](https://www.jianshu.com/p/bf158fbb2432)

[全面理解Java内存模型\(JMM\)及volatile关键字\_Java\_zejian的博客\-CSDN博客](https://blog.csdn.net/javazejian/article/details/72772461)



## JVM 内存区域

Java 虚拟机在执行 Java 程序的过程中会把它管理的内存划分成若干个不同的数据区域。JDK. 1.8 和之前的版本略有不同，下面会介绍到。

**JDK 1.8 之前：**

![JVM运行时数据区域](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/JVM运行时数据区域.png)

**JDK 1.8 ：**

![Java运行时数据区域JDK1.8](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/Java运行时数据区域JDK1.8.png)

**线程私有的：**

- 程序计数器
- 虚拟机栈
- 本地方法栈

**线程共享的：**

- 堆
- 方法区
- 直接内存 (非运行时数据区的一部分)

### 程序计数器

程序计数器是一块较小的内存空间，可以看作是当前线程所执行的字节码的行号指示器。**字节码解释器工作时通过改变这个计数器的值来选取下一条需要执行的字节码指令，分支、循环、跳转、异常处理、线程恢复等功能都需要依赖这个计数器来完成。**

另外，**为了线程切换后能恢复到正确的执行位置，每条线程都需要有一个独立的程序计数器，各线程之间计数器互不影响，独立存储，我们称这类内存区域为“线程私有”的内存。**

**从上面的介绍中我们知道程序计数器主要有两个作用：**

1. 字节码解释器通过改变程序计数器来依次读取指令，从而实现代码的流程控制，如：顺序执行、选择、循环、异常处理。
2. 在多线程的情况下，程序计数器用于记录当前线程执行的位置，从而当线程被切换回来的时候能够知道该线程上次运行到哪儿了。

**注意：程序计数器是唯一一个不会出现 OutOfMemoryError 的内存区域，它的生命周期随着线程的创建而创建，随着线程的结束而死亡。**

### 虚拟机栈

**与程序计数器一样，Java 虚拟机栈也是线程私有的，它的生命周期和线程相同，描述的是 Java 方法执行的内存模型，每次方法调用的数据都是通过栈传递的。**

**Java 内存可以粗糙的区分为堆内存（Heap）和栈内存 (Stack),其中栈就是现在说的虚拟机栈，或者说是虚拟机栈中局部变量表部分。** （实际上，Java 虚拟机栈是由一个个栈帧组成，而每个栈帧中都拥有：局部变量表、操作数栈、动态链接、方法出口信息。）

**局部变量表主要存放了编译器可知的各种数据类型**（boolean、byte、char、short、int、float、long、double）、**对象引用**（reference 类型，它不同于对象本身，可能是一个指向对象起始地址的引用指针，也可能是指向一个代表对象的句柄或其他与此对象相关的位置）。

**Java 虚拟机栈会出现两种错误：StackOverFlowError 和 OutOfMemoryError。**

- **StackOverFlowError：** 若 Java 虚拟机栈的内存大小不允许动态扩展，那么当线程请求栈的深度超过当前 Java 虚拟机栈的最大深度的时候，就抛出 StackOverFlowError 错误。
- **OutOfMemoryError：** 若 Java 虚拟机栈的内存大小允许动态扩展，且当线程请求栈时内存用完了，无法再动态扩展了，此时抛出 OutOfMemoryError 错误。

**扩展：那么方法/函数如何调用？**

Java 栈可用类比数据结构中栈，Java 栈中保存的主要内容是栈帧，每一次函数调用都会有一个对应的栈帧被压入 Java 栈，每一个函数调用结束后，都会有一个栈帧被弹出。

Java 方法有两种返回方式：

1. return 语句。
2. 抛出异常。

不管哪种返回方式都会导致栈帧被弹出。

### 本地方法栈

和虚拟机栈所发挥的作用非常相似，区别是： **虚拟机栈为虚拟机执行 Java 方法 （也就是字节码）服务，而本地方法栈则为虚拟机使用到的 Native 方法服务。** 在 HotSpot 虚拟机中和 Java 虚拟机栈合二为一。

本地方法被执行的时候，在本地方法栈也会创建一个栈帧，用于存放该本地方法的局部变量表、操作数栈、动态链接、出口信息。

方法执行完毕后相应的栈帧也会出栈并释放内存空间，也会出现 StackOverFlowError 和 OutOfMemoryError 两种错误。

### 堆

Java 虚拟机所管理的内存中最大的一块，Java 堆是所有线程共享的一块内存区域，在虚拟机启动时创建。**此内存区域的唯一目的就是存放对象实例，几乎所有的对象实例以及数组都在这里分配内存。**

Java 堆是垃圾收集器管理的主要区域，因此也被称作**GC 堆（Garbage Collected Heap）**.从垃圾回收的角度，由于现在收集器基本都采用分代垃圾收集算法，所以 Java 堆还可以细分为：新生代和老年代：再细致一点有：Eden 空间、From Survivor、To Survivor 空间等。**进一步划分的目的是更好地回收内存，或者更快地分配内存。**

在 JDK 7 版本及JDK 7 版本之前，堆内存被通常被分为下面三部分：

1. 新生代内存(Young Generation)
2. 老生代(Old Generation)
3. 永生代(Permanent Generation)

![JVM堆内存结构-JDK7](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/JVM堆内存结构-JDK7.png)

JDK 8 版本之后方法区（HotSpot 的永久代）被彻底移除了（JDK1.7 就已经开始了），取而代之是元空间，元空间使用的是直接内存。

![JVM堆内存结构-JDK8](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/JVM堆内存结构-JDK8.png)

**上图所示的 Eden 区、两个 Survivor 区都属于新生代（为了区分，这两个 Survivor 区域按照顺序被命名为 from 和 to），中间一层属于老年代。**

大部分情况，对象都会首先在 Eden 区域分配，在一次新生代垃圾回收后，如果对象还存活，则会进入 s0 或者 s1，并且对象的年龄还会加 1(Eden 区->Survivor 区后对象的初始年龄变为 1)，当它的年龄增加到一定程度（默认为 15 岁），就会被晋升到老年代中。对象晋升到老年代的年龄阈值，可以通过参数 `-XX:MaxTenuringThreshold` 来设置。

> 修正（[issue552](https://github.com/Snailclimb/JavaGuide/issues/552)）：“Hotspot遍历所有对象时，**按照年龄从小到大对其所占用的大小进行累积，当累积的某个年龄大小超过了survivor区的一半时，取这个年龄和MaxTenuringThreshold中更小的一个值**，作为新的晋升年龄阈值”。
>
> **动态年龄计算的代码如下**
>
> ```c++
> uint ageTable::compute_tenuring_threshold(size_t survivor_capacity) {
>     //survivor_capacity是survivor空间的大小
>   size_t desired_survivor_size = (size_t)((((double) survivor_capacity)*TargetSurvivorRatio)/100);
>   size_t total = 0;
>   uint age = 1;
>   while (age < table_size) {
>     total += sizes[age];//sizes数组是每个年龄段对象大小
>     if (total > desired_survivor_size) break;
>     age++;
>   }
>   uint result = age < MaxTenuringThreshold ? age : MaxTenuringThreshold;
>     ...
> }
> ```

堆这里最容易出现的就是 OutOfMemoryError 错误，并且出现这种错误之后的表现形式还会有几种，比如：

1. **`OutOfMemoryError: GC Overhead Limit Exceeded`** ： 当JVM花太多时间执行垃圾回收并且只能回收很少的堆空间时，就会发生此错误。
2. **`java.lang.OutOfMemoryError: Java heap space`** :假如在创建新的对象时, 堆内存中的空间不足以存放新创建的对象, 就会引发`java.lang.OutOfMemoryError: Java heap space` 错误。(和本机物理内存无关，和你配置的对内存大小有关！)
3. ......

### [方法区](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/Java内存区域?id=_25-方法区)

方法区与 Java 堆一样，是各个线程共享的内存区域，它用于存储已被虚拟机加载的类信息、常量、静态变量、即时编译器编译后的代码等数据。虽然 **Java 虚拟机规范把方法区描述为堆的一个逻辑部分**，但是它却有一个别名叫做 **Non-Heap（非堆）**，目的应该是与 Java 堆区分开来。

方法区也被称为永久代。很多人都会分不清方法区和永久代的关系，为此我也查阅了文献。

#### [方法区和永久代的关系](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/Java内存区域?id=_251-方法区和永久代的关系)

> 《Java 虚拟机规范》只是规定了有方法区这么个概念和它的作用，并没有规定如何去实现它。那么，在不同的 JVM 上方法区的实现肯定是不同的了。 **方法区和永久代的关系很像 Java 中接口和类的关系，类实现了接口，而永久代就是 HotSpot 虚拟机对虚拟机规范中方法区的一种实现方式。** 也就是说，永久代是 HotSpot 的概念，方法区是 Java 虚拟机规范中的定义，是一种规范，而永久代是一种实现，一个是标准一个是实现，其他的虚拟机实现并没有永久代这一说法。

#### [常用参数](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/Java内存区域?id=_252-常用参数)

JDK 1.8 之前永久代还没被彻底移除的时候通常通过下面这些参数来调节方法区大小

```java
-XX:PermSize=N //方法区 (永久代) 初始大小
-XX:MaxPermSize=N //方法区 (永久代) 最大大小,超过这个值将会抛出 OutOfMemoryError 异常:java.lang.OutOfMemoryError: PermGen
```

相对而言，垃圾收集行为在这个区域是比较少出现的，但并非数据进入方法区后就“永久存在”了。

JDK 1.8 的时候，方法区（HotSpot 的永久代）被彻底移除了（JDK1.7 就已经开始了），取而代之是元空间，元空间使用的是直接内存。

下面是一些常用参数：

```java
-XX:MetaspaceSize=N //设置 Metaspace 的初始（和最小大小）
-XX:MaxMetaspaceSize=N //设置 Metaspace 的最大大小
```

与永久代很大的不同就是，如果不指定大小的话，随着更多类的创建，虚拟机会耗尽所有可用的系统内存。

#### [为什么要将永久代 (PermGen) 替换为元空间 (MetaSpace) 呢?](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/Java内存区域?id=_253-为什么要将永久代-permgen-替换为元空间-metaspace-呢)

1. 整个永久代有一个 JVM 本身设置固定大小上限，无法进行调整，而元空间使用的是直接内存，受本机可用内存的限制，虽然元空间仍旧可能溢出，但是比原来出现的几率会更小。

   > 当你元空间溢出时会得到如下错误： `java.lang.OutOfMemoryError: MetaSpace`

你可以使用 `-XX：MaxMetaspaceSize` 标志设置最大元空间大小，默认值为 unlimited，这意味着它只受系统内存的限制。`-XX：MetaspaceSize` 调整标志定义元空间的初始大小如果未指定此标志，则 Metaspace 将根据运行时的应用程序需求动态地重新调整大小。

1. 元空间里面存放的是类的元数据，这样加载多少类的元数据就不由 `MaxPermSize` 控制了, 而由系统的实际可用空间来控制，这样能加载的类就更多了。
2. 在 JDK8，合并 HotSpot 和 JRockit 的代码时, JRockit 从来没有一个叫永久代的东西, 合并之后就没有必要额外的设置这么一个永久代的地方了。

### [运行时常量池](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/Java内存区域?id=_26-运行时常量池)

运行时常量池是方法区的一部分。Class 文件中除了有类的版本、字段、方法、接口等描述信息外，还有常量池信息（用于存放编译期生成的各种字面量和符号引用）

既然运行时常量池是方法区的一部分，自然受到方法区内存的限制，当常量池无法再申请到内存时会抛出 OutOfMemoryError 错误。

**JDK1.7 及之后版本的 JVM 已经将运行时常量池从方法区中移了出来，在 Java 堆（Heap）中开辟了一块区域存放运行时常量池。**

![JVM常量池](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/JVM常量池.png)

 ——图片来源：https://blog.csdn.net/wangbiao007/article/details/78545189

### [直接内存](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/Java内存区域?id=_27-直接内存)

**直接内存并不是虚拟机运行时数据区的一部分，也不是虚拟机规范中定义的内存区域，但是这部分内存也被频繁地使用。而且也可能导致 OutOfMemoryError 错误出现。**

JDK1.4 中新加入的 **NIO(New Input/Output) 类**，引入了一种基于**通道（Channel）** 与**缓存区（Buffer）** 的 I/O 方式，它可以直接使用 Native 函数库直接分配堆外内存，然后通过一个存储在 Java 堆中的 DirectByteBuffer 对象作为这块内存的引用进行操作。这样就能在一些场景中显著提高性能，因为**避免了在 Java 堆和 Native 堆之间来回复制数据**。

本机直接内存的分配不会受到 Java 堆的限制，但是，既然是内存就会受到本机总内存大小以及处理器寻址空间的限制。

### [3.1 对象的创建](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/Java内存区域?id=_31-对象的创建)

下图便是 Java 对象的创建过程，我建议最好是能默写出来，并且要掌握每一步在做什么。 

![Java创建对象的过程](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/Java创建对象的过程.png)

#### [Step1:类加载检查](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/Java内存区域?id=step1类加载检查)

虚拟机遇到一条 new 指令时，首先将去检查这个指令的参数是否能在常量池中定位到这个类的符号引用，并且检查这个符号引用代表的类是否已被加载过、解析和初始化过。如果没有，那必须先执行相应的类加载过程。

#### [Step2:分配内存](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/Java内存区域?id=step2分配内存)

在**类加载检查**通过后，接下来虚拟机将为新生对象**分配内存**。对象所需的内存大小在类加载完成后便可确定，为对象分配空间的任务等同于把一块确定大小的内存从 Java 堆中划分出来。**分配方式**有 **“指针碰撞”** 和 **“空闲列表”** 两种，**选择那种分配方式由 Java 堆是否规整决定，而 Java 堆是否规整又由所采用的垃圾收集器是否带有压缩整理功能决定**。

**内存分配的两种方式：（补充内容，需要掌握）**

选择以上两种方式中的哪一种，取决于 Java 堆内存是否规整。而 Java 堆内存是否规整，取决于 GC 收集器的算法是"标记-清除"，还是"标记-整理"（也称作"标记-压缩"），值得注意的是，复制算法内存也是规整的

![内存分配的两种方式](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/内存分配的两种方式.png)

**内存分配并发问题（补充内容，需要掌握）**

在创建对象的时候有一个很重要的问题，就是线程安全，因为在实际开发过程中，创建对象是很频繁的事情，作为虚拟机来说，必须要保证线程是安全的，通常来讲，虚拟机采用两种方式来保证线程安全：

- **CAS+失败重试：** CAS 是乐观锁的一种实现方式。所谓乐观锁就是，每次不加锁而是假设没有冲突而去完成某项操作，如果因为冲突失败就重试，直到成功为止。**虚拟机采用 CAS 配上失败重试的方式保证更新操作的原子性。**
- **TLAB：** 为每一个线程预先在 Eden 区分配一块儿内存，JVM 在给线程中的对象分配内存时，首先在 TLAB 分配，当对象大于 TLAB 中的剩余内存或 TLAB 的内存已用尽时，再采用上述的 CAS 进行内存分配

#### [Step3:初始化零值](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/Java内存区域?id=step3初始化零值)

内存分配完成后，虚拟机需要将分配到的内存空间都初始化为零值（不包括对象头），这一步操作保证了对象的实例字段在 Java 代码中可以不赋初始值就直接使用，程序能访问到这些字段的数据类型所对应的零值。

#### [Step4:设置对象头](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/Java内存区域?id=step4设置对象头)

初始化零值完成之后，**虚拟机要对对象进行必要的设置**，例如这个对象是那个类的实例、如何才能找到类的元数据信息、对象的哈希码、对象的 GC 分代年龄等信息。 **这些信息存放在对象头中。** 另外，根据虚拟机当前运行状态的不同，如是否启用偏向锁等，对象头会有不同的设置方式。

#### [Step5:执行 init 方法](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/Java内存区域?id=step5执行-init-方法)

在上面工作都完成之后，从虚拟机的视角来看，一个新的对象已经产生了，但从 Java 程序的视角来看，对象创建才刚开始，`` 方法还没有执行，所有的字段都还为零。所以一般来说，执行 new 指令之后会接着执行 `` 方法，把对象按照程序员的意愿进行初始化，这样一个真正可用的对象才算完全产生出来。

### [3.2 对象的内存布局](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/Java内存区域?id=_32-对象的内存布局)

在 Hotspot 虚拟机中，对象在内存中的布局可以分为 3 块区域：**对象头**、**实例数据**和**对齐填充**。

**Hotspot 虚拟机的对象头包括两部分信息**，**第一部分用于存储对象自身的自身运行时数据**（哈希码、GC 分代年龄、锁状态标志等等），**另一部分是类型指针**，即对象指向它的类元数据的指针，虚拟机通过这个指针来确定这个对象是那个类的实例。

**实例数据部分是对象真正存储的有效信息**，也是在程序中所定义的各种类型的字段内容。

**对齐填充部分不是必然存在的，也没有什么特别的含义，仅仅起占位作用。** 因为 Hotspot 虚拟机的自动内存管理系统要求对象起始地址必须是 8 字节的整数倍，换句话说就是对象的大小必须是 8 字节的整数倍。而对象头部分正好是 8 字节的倍数（1 倍或 2 倍），因此，当对象实例数据部分没有对齐时，就需要通过对齐填充来补全。

### [3.3 对象的访问定位](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/Java内存区域?id=_33-对象的访问定位)

建立对象就是为了使用对象，我们的 Java 程序通过栈上的 reference 数据来操作堆上的具体对象。对象的访问方式由虚拟机实现而定，目前主流的访问方式有**①使用句柄**和**②直接指针**两种：

1. **句柄：** 如果使用句柄的话，那么 Java 堆中将会划分出一块内存来作为句柄池，reference 中存储的就是对象的句柄地址，而句柄中包含了对象实例数据与类型数据各自的具体地址信息；

   ![对象的访问定位-使用句柄](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/对象的访问定位-使用句柄.png)

2. **直接指针：** 如果使用直接指针访问，那么 Java 堆对象的布局中就必须考虑如何放置访问类型数据的相关信息，而 reference 中存储的直接就是对象的地址。

![对象的访问定位-直接指针](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/对象的访问定位-直接指针.png)

**这两种对象访问方式各有优势。使用句柄来访问的最大好处是 reference 中存储的是稳定的句柄地址，在对象被移动时只会改变句柄中的实例数据指针，而 reference 本身不需要修改。使用直接指针访问方式最大的好处就是速度快，它节省了一次指针定位的时间开销。**



## [JVM 垃圾回收](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/JVM垃圾回收?id=jvm-垃圾回收)

常见面试题：

- 何判断对象是否死亡（两种方法）。
- 简单的介绍一下强引用、软引用、弱引用、虚引用（虚引用与软引用和弱引用的区别、使用软引用能带来的好处）。
- 如何判断一个常量是废弃常量
- 如何判断一个类是无用的类
- 垃圾收集有哪些算法，各自的特点？
- HotSpot 为什么要分为新生代和老年代？
- 常见的垃圾回收器有哪些？
- 介绍一下 CMS,G1 收集器。
- Minor Gc 和 Full GC 有什么不同呢？



## JVM内存分配

**堆空间的基本结构：**

![堆结构](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/堆结构.png)

上图所示的 eden 区、s0("From") 区、s1("To") 区都属于新生代，tentired 区属于老年代。大部分情况，对象都会首先在 Eden 区域分配，在一次新生代垃圾回收后，如果对象还存活，则会进入 s1("To")，并且对象的年龄还会加 1(Eden 区->Survivor 区后对象的初始年龄变为 1)，当它的年龄增加到一定程度（默认为 15 岁），就会被晋升到老年代中。对象晋升到老年代的年龄阈值，可以通过参数 `-XX:MaxTenuringThreshold` 来设置。经过这次GC后，Eden区和"From"区已经被清空。这个时候，"From"和"To"会交换他们的角色，也就是新的"To"就是上次GC前的“From”，新的"From"就是上次GC前的"To"。不管怎样，都会保证名为To的Survivor区域是空的。Minor GC会一直重复这样的过程，直到“To”区被填满，"To"区被填满之后，会将所有对象移动到老年代中。

![堆内存常见分配策略](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/堆内存常见分配策略.png)

### [1.1 对象优先在 eden 区分配](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/JVM垃圾回收?id=_11-对象优先在-eden-区分配)

目前主流的垃圾收集器都会采用分代回收算法，因此需要将堆内存分为新生代和老年代，这样我们就可以根据各个年代的特点选择合适的垃圾收集算法。

大多数情况下，对象在新生代中 eden 区分配。当 eden 区没有足够空间进行分配时，虚拟机将发起一次 Minor GC.下面我们来进行实际测试以下。

在测试之前我们先来看看 **Minor GC 和 Full GC 有什么不同呢？**

- **新生代 GC（Minor GC）**:指发生新生代的的垃圾收集动作，Minor GC 非常频繁，回收速度一般也比较快。
- **老年代 GC（Major GC/Full GC）**:指发生在老年代的 GC，出现了 Major GC 经常会伴随至少一次的 Minor GC（并非绝对），Major GC 的速度一般会比 Minor GC 的慢 10 倍以上。

### [1.2 大对象直接进入老年代](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/JVM垃圾回收?id=_12-大对象直接进入老年代)

大对象就是需要大量连续内存空间的对象（比如：字符串、数组）。

**为什么要这样呢？**

为了避免为大对象分配内存时由于**分配担保机**制带来的复制而降低效率。

### [1.3 长期存活的对象将进入老年代](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/JVM垃圾回收?id=_13-长期存活的对象将进入老年代)

既然虚拟机采用了分代收集的思想来管理内存，那么内存回收时就必须能识别哪些对象应放在新生代，哪些对象应放在老年代中。为了做到这一点，虚拟机给每个对象一个对象年龄（Age）计数器。

如果对象在 Eden 出生并经过第一次 Minor GC 后仍然能够存活，并且能被 Survivor 容纳的话，将被移动到 Survivor 空间中，并将对象年龄设为 1.对象在 Survivor 中每熬过一次 MinorGC,年龄就增加 1 岁，当它的年龄增加到一定程度（默认为 15 岁），就会被晋升到老年代中。对象晋升到老年代的年龄阈值，可以通过参数 `-XX:MaxTenuringThreshold` 来设置。

### [1.4 动态对象年龄判定](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/JVM垃圾回收?id=_14-动态对象年龄判定)

为了更好的适应不同程序的内存情况，虚拟机不是永远要求对象年龄必须达到了某个值才能进入老年代，**如果 Survivor 空间中相同年龄所有对象大小的总和大于 Survivor 空间的一半，年龄大于或等于该年龄的对象就可以直接进入老年代，无需达到要求的年龄。**

## [2 对象已经死亡？](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/JVM垃圾回收?id=_2-对象已经死亡？)

堆中几乎放着所有的对象实例，对堆垃圾回收前的第一步就是要判断那些对象已经死亡（即不能再被任何途径使用的对象）。

![判断对象死亡](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/判断对象死亡.png)

### [2.1 引用计数法](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/JVM垃圾回收?id=_21-引用计数法)

给对象中添加一个引用计数器，每当有一个地方引用它，计数器就加 1；当引用失效，计数器就减 1；任何时候计数器为 0 的对象就是不可能再被使用的。

**这个方法实现简单，效率高，但是目前主流的虚拟机中并没有选择这个算法来管理内存，其最主要的原因是它很难解决对象之间相互循环引用的问题。** 

### [2.2 可达性分析算法](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/JVM垃圾回收?id=_22-可达性分析算法)

这个算法的基本思想就是通过一系列的称为 **“GC Roots”** 的对象作为起点，从这些节点开始向下搜索，节点所走过的路径称为引用链，当一个对象到 GC Roots 没有任何引用链相连的话，则证明此对象是不可用的。

![可达性分析算法 ](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/可达性分析算法 .png)

#### 哪些对象可以当GC Roots呢

- 虚拟机栈中引用的对象
- 本地方法栈中引用的对象
- 方法区中类静态属性引用的对象
- 方法区中常量引用的对象

### [2.3 再谈引用](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/JVM垃圾回收?id=_23-再谈引用)

**1．强引用（StrongReference）**

以前我们使用的大部分引用实际上都是强引用，这是使用最普遍的引用。如果一个对象具有强引用，那就类似于**必不可少的生活用品**，垃圾回收器绝不会回收它。当内存空间不足，Java 虚拟机宁愿抛出 OutOfMemoryError 错误，使程序异常终止，也不会靠随意回收具有强引用的对象来解决内存不足问题。

**2．软引用（SoftReference）**

如果一个对象只具有软引用，那就类似于**可有可无的生活用品**。如果内存空间足够，垃圾回收器就不会回收它，如果内存空间不足了，就会回收这些对象的内存。只要垃圾回收器没有回收它，该对象就可以被程序使用。<span style="color:red">**软引用可用来实现内存敏感的高速缓存。**</span>

软引用可以和一个引用队列（ReferenceQueue）联合使用，如果软引用所引用的对象被垃圾回收，JAVA 虚拟机就会把这个软引用加入到与之关联的引用队列中。

**3．弱引用（WeakReference）**

如果一个对象只具有弱引用，那就类似于**可有可无的生活用品**。弱引用与软引用的区别在于：只具有弱引用的对象拥有更短暂的生命周期。在垃圾回收器线程扫描它所管辖的内存区域的过程中，一旦发现了只具有弱引用的对象，不管当前内存空间足够与否，都会回收它的内存。不过，由于垃圾回收器是一个优先级很低的线程， 因此不一定会很快发现那些只具有弱引用的对象。

弱引用可以和一个引用队列（ReferenceQueue）联合使用，如果弱引用所引用的对象被垃圾回收，Java 虚拟机就会把这个弱引用加入到与之关联的引用队列中。

**4．虚引用（PhantomReference）**

"虚引用"顾名思义，就是形同虚设，与其他几种引用都不同，虚引用并不会决定对象的生命周期。如果一个对象仅持有虚引用，那么它就和没有任何引用一样，在任何时候都可能被垃圾回收。

**虚引用主要用来跟踪对象被垃圾回收的活动**。

**虚引用与软引用和弱引用的一个区别在于：** 虚引用必须和引用队列（ReferenceQueue）联合使用。当垃圾回收器准备回收一个对象时，如果发现它还有虚引用，就会在回收对象的内存之前，把这个虚引用加入到与之关联的引用队列中。程序可以通过判断引用队列中是否已经加入了虚引用，来了解被引用的对象是否将要被垃圾回收。程序如果发现某个虚引用已经被加入到引用队列，那么就可以在所引用的对象的内存被回收之前采取必要的行动。

特别注意，在程序设计中一般很少使用弱引用与虚引用，使用软引用的情况较多，这是因为**软引用可以加速 JVM 对垃圾内存的回收速度，可以维护系统的运行安全，防止内存溢出（OutOfMemory）等问题的产生**。

### [2.5 如何判断一个常量是废弃常量](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/JVM垃圾回收?id=_25-如何判断一个常量是废弃常量)

运行时常量池主要回收的是废弃的常量。那么，我们如何判断一个常量是废弃常量呢？

假如在常量池中存在字符串 "abc"，如果当前没有任何 String 对象引用该字符串常量的话，就说明常量 "abc" 就是废弃常量，如果这时发生内存回收的话而且有必要的话，"abc" 就会被系统清理出常量池。

注意：我们在 [可能是把 Java 内存区域讲的最清楚的一篇文章 ](https://mp.weixin.qq.com/s?__biz=MzU4NDQ4MzU5OA==&mid=2247484303&idx=1&sn=af0fd436cef755463f59ee4dd0720cbd&chksm=fd9855eecaefdcf8d94ac581cfda4e16c8a730bda60c3b50bc55c124b92f23b6217f7f8e58d5&token=506869459&lang=zh_CN#rd)也讲了 JDK1.7 及之后版本的 JVM 已经将运行时常量池从方法区中移了出来，在 Java 堆（Heap）中开辟了一块区域存放运行时常量池。

### [2.6 如何判断一个类是无用的类](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/JVM垃圾回收?id=_26-如何判断一个类是无用的类)

方法区主要回收的是无用的类，那么如何判断一个类是无用的类的呢？

判定一个常量是否是“废弃常量”比较简单，而要判定一个类是否是“无用的类”的条件则相对苛刻许多。类需要同时满足下面 3 个条件才能算是 **“无用的类”** ：

- 该类所有的实例都已经被回收，也就是 Java 堆中不存在该类的任何实例。
- 加载该类的 ClassLoader 已经被回收。
- 该类对应的 java.lang.Class 对象没有在任何地方被引用，无法在任何地方通过反射访问该类的方法。

虚拟机可以对满足上述 3 个条件的无用类进行回收，这里说的仅仅是“可以”，而并不是和对象一样不使用了就会必然被回收。

## [3 垃圾收集算法](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/JVM垃圾回收?id=_3-垃圾收集算法)

![垃圾收集算法分类](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/垃圾收集算法分类.png)

### [3.1 标记-清除算法](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/JVM垃圾回收?id=_31-标记-清除算法)

该算法分为“标记”和“清除”阶段：首先标记出所有需要回收的对象，在标记完成后统一回收所有被标记的对象。它是最基础的收集算法，后续的算法都是对其不足进行改进得到。这种垃圾收集算法会带来两个明显的问题：

1. **效率问题**
2. **空间问题（标记清除后会产生大量不连续的碎片）**

![标记清除算法-内存整理前后对比](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/标记清除算法-内存整理前后对比.png)

### [3.2 复制算法](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/JVM垃圾回收?id=_32-复制算法)

为了解决效率问题，“复制”收集算法出现了。它可以将内存分为大小相同的两块，每次使用其中的一块。当这一块的内存使用完后，就将还存活的对象复制到另一块去，然后再把使用的空间一次清理掉。这样就使每次的内存回收都是对内存区间的一半进行回收。

![复制算法-内存整理前后对比](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/复制算法-内存整理前后对比.png)

### [3.3 标记-整理算法](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/JVM垃圾回收?id=_33-标记-整理算法)

根据老年代的特点提出的一种标记算法，标记过程仍然与“标记-清除”算法一样，但后续步骤不是直接对可回收对象回收，而是让所有存活的对象向一端移动，然后直接清理掉端边界以外的内存。

![标记整理算法-内存整理前后对比](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/标记整理算法-内存整理前后对比.png)

### [3.4 分代收集算法](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/JVM垃圾回收?id=_34-分代收集算法)

当前虚拟机的垃圾收集都采用分代收集算法，这种算法没有什么新的思想，只是根据对象存活周期的不同将内存分为几块。一般将 java 堆分为新生代和老年代，这样我们就可以根据各个年代的特点选择合适的垃圾收集算法。

**比如在新生代中，每次收集都会有大量对象死去，所以可以选择复制算法，只需要付出少量对象的复制成本就可以完成每次垃圾收集。而老年代的对象存活几率是比较高的，而且没有额外的空间对它进行分配担保，所以我们必须选择“标记-清除”或“标记-整理”算法进行垃圾收集。**

因为新生代中大多数对象的生命周期都很短，因此Minor GC(采用复制算法)非常频繁，虽然它会触发stop-the-world，但是回收速度也比较快。

复制算法与标记-整理算法都有标记的过程，标记的过程都是采用可达性分析算法，所以跳过这个步骤接着分析。复制算法接下来是把标记存活的对象复制到另一块内存区域中，标记-整理算法是将标记的对象整理到一端，这个时候需要注意，并没有进行内存空间清理，针对于新生代需要清理的对象数量十分巨大，所以在将存活的对象插入到待清理对象之前，需要大量移动操作，时间复杂度很高；反观复制算法，不需要移动待回收对象的操作，直接将存活对象复制到另一块空闲内存区域中，大大减小了时间复杂度，所以分析到这里新生代不使用“标记-整理算法”的原因就显而易见了！

**延伸面试问题：** HotSpot 为什么要分为新生代和老年代？

根据上面的对分代收集算法的介绍回答。

## [4 垃圾收集器](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/JVM垃圾回收?id=_4-垃圾收集器)

![垃圾收集器分类](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/垃圾收集器分类.png)

图中有 `7` 种不同的 **垃圾回收器**，它们分别用于不同分代的垃圾回收。

- **新生代回收器**：Serial、ParNew、Parallel Scavenge
- **老年代回收器**：Serial Old、Parallel Old、CMS
- **整堆回收器**：G1

两个 **垃圾回收器** 之间有连线表示它们可以 **搭配使用**，可选的搭配方案如下：

| 新生代            | 老年代       |
| :---------------- | :----------- |
| Serial            | Serial Old   |
| Serial            | CMS          |
| ParNew            | Serial Old   |
| ParNew            | CMS          |
| Parallel Scavenge | Serial Old   |
| Parallel Scavenge | Parallel Old |
| G1                | G1           |


作者：零壹技术栈链接：https://juejin.im/post/5b651200f265da0fa00a38d7来源：掘金著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。

**如果说收集算法是内存回收的方法论，那么垃圾收集器就是内存回收的具体实现。**

虽然我们对各个收集器进行比较，但并非要挑选出一个最好的收集器。因为直到现在为止还没有最好的垃圾收集器出现，更加没有万能的垃圾收集器，**我们能做的就是根据具体应用场景选择适合自己的垃圾收集器**。试想一下：如果有一种四海之内、任何场景下都适用的完美收集器存在，那么我们的 HotSpot 虚拟机就不会实现那么多不同的垃圾收集器了。

### 4.1 Serial 收集器（-XX:+UseSerialGC）

Serial（串行）收集器收集器是最基本、历史最悠久的垃圾收集器了。大家看名字就知道这个收集器是一个单线程收集器了。它的 **“单线程”** 的意义不仅仅意味着它只会使用一条垃圾收集线程去完成垃圾收集工作，更重要的是它在进行垃圾收集工作的时候必须暂停其他所有的工作线程（ **"Stop The World"** ），直到它收集结束。

**新生代采用复制算法，老年代采用标记-整理算法。**

![Serial垃圾收集器](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/Serial垃圾收集器.png)

虚拟机的设计者们当然知道 Stop The World 带来的不良用户体验，所以在后续的垃圾收集器设计中停顿时间在不断缩短（仍然还有停顿，寻找最优秀的垃圾收集器的过程仍然在继续）。

但是 Serial 收集器有没有优于其他垃圾收集器的地方呢？当然有，它**简单而高效（与其他收集器的单线程相比）**。Serial 收集器由于没有线程交互的开销，自然可以获得很高的单线程收集效率。Serial 收集器对于运行在 Client 模式下的虚拟机来说是个不错的选择。

### 4.2 ParNew 收集器（-XX:+UseParNewGC）

**ParNew 收集器其实就是 Serial 收集器的多线程版本，除了使用多线程进行垃圾收集外，其余行为（控制参数、收集算法、回收策略等等）和 Serial 收集器完全一样。**

> 多线程垃圾回收器（吞吐量优先）

**新生代采用复制算法，老年代采用标记-整理算法。** 

![ParNew垃圾收集器](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/ParNew垃圾收集器.png)

它是许多运行在 Server 模式下的虚拟机的首要选择，除了 Serial 收集器外，只有它能与 CMS 收集器（真正意义上的并发收集器，后面会介绍到）配合工作。

**并行和并发概念补充：**

- **并行（Parallel）** ：指多条垃圾收集线程并行工作，但此时用户线程仍然处于等待状态。
- **并发（Concurrent）**：指用户线程与垃圾收集线程同时执行（但不一定是并行，可能会交替执行），用户程序在继续运行，而垃圾收集器运行在另一个 CPU 上。

### 4.3 Parallel Scavenge 收集器 （-XX:+UseParallelGC）

Parallel Scavenge 收集器也是使用复制算法的多线程收集器，它看上去几乎和ParNew都一样。 **那么它有什么特别之处呢？**

```
-XX:+UseParallelGC 
# 使用 Parallel 收集器 + 老年代串行

-XX:+UseParallelOldGC
# 使用 Parallel 收集器 + 老年代并行
```

**Parallel Scavenge 收集器关注点是吞吐量（高效率的利用 CPU）。CMS 等垃圾收集器的关注点更多的是用户线程的停顿时间（提高用户体验）。所谓吞吐量就是 CPU 中用于运行用户代码的时间与 CPU 总消耗时间的比值。** Parallel Scavenge 收集器提供了很多参数供用户找到最合适的停顿时间或最大吞吐量，如果对于收集器运作不太了解的话，手工优化存在困难的话可以选择把内存管理优化交给虚拟机去完成也是一个不错的选择。

**新生代采用复制算法，老年代采用标记-整理算法。**

![Parallel Scavenge 收集器 ](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/ParallelOld垃圾收集器.png)

### 4.4.Serial Old 收集器（-XX:+UseSerialGC）

**Serial 收集器的老年代版本**，它同样是一个单线程收集器。它主要有两大用途：一种用途是在 JDK1.5 以及以前的版本中与 Parallel Scavenge 收集器搭配使用，另一种用途是作为 CMS 收集器的后备方案。

### 4.5 Parallel Old 收集器（-XX:+UseParallelOldGC）

**Parallel Scavenge 收集器的老年代版本**。使用多线程和“标记-整理”算法。在注重吞吐量以及 CPU 资源的场合，都可以优先考虑 Parallel Scavenge 收集器和 Parallel Old 收集器。

![ParallelOld垃圾收集器](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/ParallelOld垃圾收集器.png)

### 4.6 CMS 收集器（-XX:+UseConcMarkSweepGC）

**CMS（Concurrent Mark Sweep）收集器是一种以获取最短回收停顿时间为目标的收集器。它非常符合在注重用户体验的应用上使用。**

> 停顿时间优先

**CMS（Concurrent Mark Sweep）收集器是 HotSpot 虚拟机第一款真正意义上的并发收集器，它第一次实现了让垃圾收集线程与用户线程（基本上）同时工作。**

从名字中的**Mark Sweep**这两个词可以看出，CMS 收集器是一种 **“标记-清除”算法**实现的，它的运作过程相比于前面几种垃圾收集器来说更加复杂一些。整个过程分为四个步骤：

- **初始标记：** 暂停所有的其他线程，并记录下直接与 root 相连的对象，速度很快 ；
- **并发标记：** 同时开启 GC 和用户线程，用一个闭包结构去记录可达对象。但在这个阶段结束，这个闭包结构并不能保证包含当前所有的可达对象。因为用户线程可能会不断的更新引用域，所以 GC 线程无法保证可达性分析的实时性。所以这个算法里会跟踪记录这些发生引用更新的地方。
- **重新标记：** 重新标记阶段就是为了修正并发标记期间因为用户程序继续运行而导致标记产生变动的那一部分对象的标记记录，这个阶段的停顿时间一般会比初始标记阶段的时间稍长，远远比并发标记阶段时间短
- **并发清除：** 开启用户线程，同时 GC 线程开始对为标记的区域做清扫。

![CMS垃圾收集器](http://image-hosting-lan.oss-cn-beijing.aliyuncs.com/CMS垃圾收集器.png)

从它的名字就可以看出它是一款优秀的垃圾收集器，主要优点：**并发收集、低停顿**。但是它有下面三个明显的缺点：

- **对 CPU 资源敏感；**

  `CMS` 回收器过分依赖于 **多线程环境**，默认情况下，开启的 **线程数** 为`（CPU 的数量 + 3）/ 4`，当 `CPU` 数量少于 `4` 个时，`CMS` 对 **用户查询** 的影响将会很大，因为他们要分出一半的运算能力去 **执行回收器线程**；

- **无法处理浮动垃圾；**

  由于 `CMS` 回收器 **清除已标记的垃圾** （处于最后一个阶段）时，**用户线程** 还在运行，因此会有新的垃圾产生。但是这部分垃圾 **未被标记**，在下一次 `GC` 才能清除，因此被成为 **浮动垃圾**。

  由于 **内存回收** 和 **用户线程** 是同时进行的，内存在被 **回收** 的同时，也在被 **分配**。当 **老生代** 中的内存使用超过一定的比例时，系统将会进行 **垃圾回收**；当 **剩余内存** 不能满足程序运行要求时，系统将会出现 `Concurrent Mode Failure`，临时采用 `Serial Old` 算法进行 **清除**，此时的 **性能** 将会降低。

- **它使用的回收算法-“标记-清除”算法会导致收集结束时会有大量空间碎片产生。**

  `CMS` 回收器采用的 **标记清除算法**，本身存在垃圾收集结束后残余 **大量空间碎片** 的缺点。`CMS` 配合适当的 **内存整理策略**，在一定程度上可以解决这个问题。

### 4.7 G1 收集器（-XX:+UseG1GC）

**G1 (Garbage-First) 是一款面向服务器的垃圾收集器,主要针对配备多颗处理器及大容量内存的机器. 以极高概率满足 GC 停顿时间要求的同时,还具备高吞吐量性能特征.**

> 垃圾区域Region优先

`G1` 是 `JDK 1.7` 中正式投入使用的用于取代 `CMS` 的 **压缩回收器**。它虽然没有在物理上隔断 **新生代** 与 **老生代**，但是仍然属于 **分代垃圾回收器**。`G1` 仍然会区分 **年轻代** 与 **老年代**，年轻代依然分有 `Eden` 区与 `Survivor` 区。

`G1` 首先将 **堆** 分为 **大小相等** 的  `Region`，避免 **全区域** 的垃圾回收。然后追踪每个 `Region` 垃圾 **堆积的价值大小**，在后台维护一个 **优先列表**，根据允许的回收时间优先回收价值最大的 `Region`。同时 `G1`采用 `Remembered Set` 来存放 `Region` 之间的 **对象引用** ，其他回收器中的 **新生代** 与 **老年代** 之间的对象引用，从而避免 **全堆扫描**。`G1` 的分区示例如下图所示：

![G1-Region](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/G1-Region.png)

这种使用 `Region` 划分 **内存空间** 以及有 **优先级** 的区域回收方式，保证 `G1` 回收器在有限的时间内可以获得尽可能 **高的回收效率**。

被视为 JDK1.7 中 HotSpot 虚拟机的一个重要进化特征。它具备一下特点：

- **并行与并发**：G1 能充分利用 CPU、多核环境下的硬件优势，使用多个 CPU（CPU 或者 CPU 核心）来缩短 Stop-The-World 停顿时间。部分其他收集器原本需要停顿 Java 线程执行的 GC 动作，G1 收集器仍然可以通过并发的方式让 java 程序继续执行。
- **分代收集**：虽然 G1 可以不需要其他收集器配合就能独立管理整个 GC 堆，但是还是保留了分代的概念。
- **空间整合**：与 CMS 的“标记--清理”算法不同，G1 从整体来看是基于“标记整理”算法实现的收集器；从局部上来看是基于**“复制”算法**实现的。
- **可预测的停顿**：这是 G1 相对于 CMS 的另一个大优势，降低停顿时间是 G1 和 CMS 共同的关注点，但 G1 除了追求低停顿外，还能建立可预测的停顿时间模型，能让使用者明确指定在一个长度为 M 毫秒的时间片段内。

![G1垃圾收集器](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/G1垃圾收集器.png)

G1 收集器的运作大致分为以下几个步骤：

- **初始标记**
- **并发标记**
- **最终标记**
- **筛选回收**

**G1 收集器在后台维护了一个优先列表，每次根据允许的收集时间，优先选择回收价值最大的 Region(这也就是它的名字 Garbage-First 的由来)**。这种使用 Region 划分内存空间以及有优先级的区域回收方式，保证了 GF 收集器在有限时间内可以尽可能高的收集效率（把内存化整为零）。

最大的区别是出现了Region区块概念，可对回收价值和成本进行排序回收，根据GC期望时间回收，还出现了member set概念，将回收对象放入其中，避免全堆扫描。

#### G1内存的分配

1. TLAB（TLAB占用年轻代内存）. 默认使用TLAB加速内存分配,之前文章已经讲过，不赘述。 
2. Eden.如果TLAB不够用，则在Eden中分配内存生成对象。 
3. Humongous.如果对象需要的内存超过一个region的50%以上，会忽略前两个步骤直接在老年代的humongous中分配（连续的Region）。

#### 何时使用G1（-XX:+UseG1GC）

1. 大内存中为了达到低gc延迟. 
   比如:heap size >=6G,gc pause <=0.5s 
2. FullGC时间太长，或者太频繁。

### 4.8 ZGC 

Java 11版本包含一个全新的垃圾收集器ZGC，它由Oracle开发，承诺在数TB的堆上具有非常低的暂停时间。随着服务器拥有数百GB到数TB的RAM变得越来越普及，Java有效使用大容量堆内存的能力变得越来越重要。ZGC是一个令人兴奋的新垃圾收集器，旨在为大堆提供非常低的暂停时间。它通过使用有色指针和负载屏障来实现这一点，这些热点是Hotspot新增的GC技术，并开辟了一些其他有趣的未来可能性。它将在Java 11中作为实验性提供，但您现在可以使用Early Access 构建进行试用。那么为什么需要新的GC呢？G1是在2006年推出的，而ZGC的设计针对未来多TB容量大容量普遍存在的可能而设计的，能够有很低的暂停时间（<10ms），降低对整体应用性能影响（吞吐量<15％）。

详细原理见：https://www.opsian.com/blog/javas-new-zgc-is-very-exciting/



参考：

[深入理解JVM\(3\)——7种垃圾收集器 \- 王泽远的博客 \| Crow's Blog](https://crowhawk.github.io/2017/08/15/jvm_3/)

[JVM系列\(六\) \- JVM垃圾回收器 \- 掘金](https://juejin.im/post/5b651200f265da0fa00a38d7)

[Java虚拟机垃圾收集器 \| hua的博客](http://www.zhangrenhua.com/2016/11/15/Java%E8%99%9A%E6%8B%9F%E6%9C%BA%E5%9E%83%E5%9C%BE%E6%94%B6%E9%9B%86%E5%99%A8/)



---

## YGC和FGC发生时间

**YGC的触发时机：**

- edn空间不足

**FGC的触发时机：**

- old空间不足

- perm空间不足

- 调用方法System.gc()

- dump live的内存信息时(jmap –dump:live)

- 堆中分配很大的对象

  所谓大对象，是指需要大量连续内存空间的java对象，例如很长的数组，此种对象会直接进入老年代，而老年代虽然有很大的剩余空间，但是无法找到足够大的连续空间来分配给当前对象，此种情况就会触发JVM进行Full GC。

  为了解决这个问题，CMS垃圾收集器提供了一个可配置的参数，即-XX:+UseCMSCompactAtFullCollection开关参数，用于在“享受”完Full GC服务之后额外免费赠送一个碎片整理的过程，内存整理的过程无法并发的，空间碎片问题没有了，但提顿时间不得不变长了，JVM设计者们还提供了另外一个参数 -XX:CMSFullGCsBeforeCompaction,这个参数用于设置在执行多少次不压缩的Full GC后,跟着来一次带压缩的。

- ygc时的悲观策略

  最复杂的是所谓的悲观策略，它触发的机制是在首先会计算之前晋升的平均大小，也就是从新生代，通过ygc变成新生代的平均大小，然后如果旧生代剩余的空间小于晋升大小，那么就会触发一次FullGC。sdk考虑的策略是， 从平均和长远的情况来看，下次晋升空间不够的可能性非常大， 与其等到那时候在fullGC 不如悲观的认为下次肯定会触发FullGC， 直接先执行一次FullGC。而且从实际使用过程中来看， 也达到了比较稳定的效果。

## JVM中什么情况会进入到老年代

1. **大对象**:  所谓的大对象是指需要大量连续内存空间的java对象,最典型的大对象就是那种很长的字符串以及数组,大对象对虚拟机的内存分配就是坏消息,尤其是一些朝生夕灭的短命大对象,写程序时应避免。

   有一个JVM参数，就是 -XX:PretenureSizeThreshold“,可以把他的值设置为字节数，比如“1048576”，就是1M

   如果你创建一个大于这个大小的对象，比如一个超大的数组，或者是别的啥东西，此时就直接把这个大对象放在老年代中，压根不会经过新生代，这样可以避免新生代出现那种大对象，然后在2个Survivor区域里回来复制多次之后才能进入老年代。

2. **长期存活的对象**:  虚拟机给每个对象定义了一个对象年龄(Age)计数器,如果对象在Eden出生并经过第一次Minor GC后仍然存活,并且能被Survivor容纳的话,将被移动到Survivor空间中,并且对象年龄设为1,。对象在Survivor区中每熬过一次Minor GC,年龄就增加1,当他的年龄增加到一定程度(默认是15岁), 就将会被晋升到老年代中。对象晋升到老年代的年龄阈值,可以通过参数-XX:MaxTenuringThreshold设置。

3. **动态对象年龄判定**:  为了能更好地适应不同程度的内存状况,虚拟机并不是永远地要求对象的年龄必须达到了MaxTenuringThreshold才能晋升到老年代,如果在Survivor空间中相同年龄的所有对象大小的总和大于Survivor空间的一半,年龄大于或等于年龄的对象就可以直接进入老年代,无须等到MaxTenuringThreshold中要求的年龄。

4. **在一次安全Minor GC 中，仍然存活的对象不能在另一个Survivor 完全容纳，则会通过担保机制进入老年代。** 

   

### 老年代空间分配担保规则

在执行任何一次Minor GC之前，JVM会检查一下老年代可用的可用内存空间，是否大于新生代所有对象的总大小

为啥会检查这个呢？因为最极端的情况下，可能新生代的Minor GC过后，所有对象都存活下来了，那岂不是新生代所有对象全部都要进入老年代？

如果说发现老年代的内存大小是大于新生代所有对象的，此时就可以放心大胆的对新生代发起一次Minor GC了，也可以转移到老年代去。

但是假如执行Minor GC之前，发现老年代的可用内存已经小于了新生代的全部对象大小了，那么这个时候是不是有可能在Minor GC之后新生代的对象全部存活下来，然后全部需要转移到老年代去，但是老年代空间又不够？

所以假如Minor Gc之前，发现老年代的可用内存已经小于看新生代的全部对象大小了，就会看一个-XX:-HandlePromotionFailure的参数是否设置了，如果有这个参数，那么就会继续进行下一步判断，

下一步判断，就是看老年代的内存大小，是否大于之前每一次Minor GC后进入老年代的对象的平均大小。

举个例子，之前每次Minor GC后，平均都有10MB左右的对象会进入老年代，那么此时老年代可用内存大于10MB

这就说明很可能这次Minor GC过后也是差不多10MB左右的对象会进入老年代，此时老年代空间是够的

如果上面那个步骤判断失败了，或者是 -XX:-HandlePromotionFailure“参数没设置，此时就会直接触发一次Full GC,就是对老年代进行垃圾回收，尽量腾出来一些内存空间，然后再执行Minor GC 

如果上面2个步骤都判断成功了，那么就是说可以冒点风险尝试一下Minor GC 此时进行Minor GC,此时进行Minor GC有几种可能：

（1）Minor GC过后，剩余的存活对象的大小，是小于Survivor区的大小的，那么此时存活对象进入Survicor区域即可

 （2）Minor GC过后，剩余的存活对象的大小是大于Survivor区域的大小，但是是小于老年代可用内存大小的，此时就直接进入老年代即可

（3）Minor GC过后，剩余的存活对象的大小，大于了Survivor区域的大小，也大于了老年代可用内存的大小，此时老年代都放不下这些存活对象了，就会发生Handle Promotion Failure的情况，这个时候就会触发一次Full GC

Full GC就是对老年代进行垃圾回收，同时也一般会对新生代进行垃圾回收。

因为这个时候必须把老年代理的没人引用的对象给回收掉，然后才可能让Minor GC过后剩余的存活对象进入老年代里面

如果要Full GC过后，老年代还是没有足够的空间存放Minor GC过后的剩余存活对象，那么此时就会导致所谓的OOM内存溢出了。

### 为什么要有两个Survivor

主要是为了解决内存碎片化和效率问题。如果只有一个Survivor时，每触发一次minor gc都会有数据从Eden放到Survivor，一直这样循环下去。注意的是，Survivor区也会进行垃圾回收，这样就会出现内存碎片化问题。

碎片化会导致堆中可能没有足够大的连续空间存放一个大对象，影响程序性能。如果有两块Survivor就能将剩余对象集中到其中一块Survivor上，避免碎片问题。



## JVM参数

[PerfMa-JVM命令查询](https://console.perfma.com/)

```
# 查看当前JDK所有参数及其默认值
java -XX:+PrintFlagsFinal -version

# 触发cms gc的老生代使用率
-XX:CMSInitiatingOccupancyFraction=n
# 配合上一个命令使用
-XX:+UseCMSInitiatingOccupancyOnly
# 最大GC暂停时间目标(毫秒)，或(仅G1)每个MMU时间片的最大GC时间
-XX:MaxGCPauseMillis=n
# 默认是45，也就是heap中45%的容量被使用，则会触发concurrent gc。
-XX:InitiatingHeapOccupancyPercent=45 


-Xmx20M	# 最大堆的空间
-Xms20M	# 最小堆的空间
-Xmn10M  # 设置新生代的大小
# （设置新生代和老年代的比值，如果设置为4则表示（eden+from（或者叫s0）+to（或者叫s1））： 老年代 =1：4），即年轻代占堆的五分之一
-XX:NewRatio=4
# 设置两个Survivor（幸存区from和to或者叫s0或者s1区）和eden区的比），8表示两个Survivor：eden=2:8，即Survivor区占年轻代的五分之一
-XX:SurvivorRatio=8
# 需要禁用TLAB
-XX:-UseTLAB	
```

### G1垃圾回收器参数配置

| 选项/默认值                          | 说明                                                         |
| ------------------------------------ | ------------------------------------------------------------ |
| -XX:+UseG1GC                         | 使用  G1 (Garbage First) 垃圾收集器                          |
| -XX:MaxGCPauseMillis=n               | 设置最大GC停顿时间(GC  pause time)指标(target). 这是一个软性指标(soft goal), JVM 会尽量去达成这个目标. |
| -XX:InitiatingHeapOccupancyPercent=n | 启动并发GC周期时的堆内存占用百分比.  G1之类的垃圾收集器用它来触发并发GC周期,基于整个堆的使用率,而不只是某一代内存的使用比. 值为 0 则表示"一直执行GC循环".  默认值为 45. |
| -XX:NewRatio=n                       | 新生代与老生代(new/old  generation)的大小比例(Ratio). 默认值为 2. |
| -XX:SurvivorRatio=n                  | eden/survivor  空间大小的比例(Ratio). 默认值为 8.            |
| -XX:MaxTenuringThreshold=n           | 提升年老代的最大临界值(tenuring  threshold). 默认值为 15.    |
| -XX:ParallelGCThreads=n              | 设置垃圾收集器在并行阶段使用的线程数,默认值随JVM运行的平台不同而不同. |
| -XX:ConcGCThreads=n                  | 并发垃圾收集器使用的线程数量.  默认值随JVM运行的平台不同而不同. |
| -XX:G1ReservePercent=n               | 设置堆内存保留为假天花板的总量,以降低提升失败的可能性.  默认值是 10. |
| -XX:G1HeapRegionSize=n               | G1内堆内存区块大小<br />G1将堆内存默认均分为2048块，1M<region<32 M，当应用频繁分配大对象时，可以考虑调整这个阈值，因为G1的Humongous区域只能存放一个大对象，适当调整Region大小，尽量让其刚好超过大对象的两倍大小，这样就能充分利用Region的空间。<br />(Xms + Xmx ) /2 / 2048 , 不大于32M，不小于1M，且为2的指数 |
| -XX:G1MixedGCCountTarget             | 一次global  concurrent marking之后，最多执行Mixed GC的次数.默认值8次 |
| -XX:G1NewSizePercent                 | 初始化年轻代占用整个堆内存的百分比，新生代占堆的最小比例，默认5% |
| -XX:G1MaxNewSizePercent              | 新生代占堆的最大比例，默认60%                                |
| -XX:+ParallelRefProcEnabled          | 并行处理Reference，加快处理速度，缩短耗时                    |
| -XX:G1OldCSetRegionThresholdPercent  | Mixed GC每次回收Region的数量一次Mixed GC中能被选入CSet的最多old generation region数量比列。默认值10% |

[jvm实用调优参数（G1）\_点滴之积\-CSDN博客\_jvm g1 参数](https://blog.csdn.net/qq_27529917/article/details/86664677)

[JVM 参数说明（持续更新） \- Rayn——做今天最好的自己 \- OSCHINA](https://my.oschina.net/Rayn/blog/842868)

[G1 Garbage Collector 及JVM 参数说明（持续更新） \- Rayn——做今天最好的自己 \- OSCHINA](https://my.oschina.net/Rayn/blog/1510535)



### 参数调优案例

#### **Full GC调优Tips：**

1. 如果可能是大对象太多造成的，可以`gc+heap=info`查看humongous regions个数。可以增加通过`-XX:G1HeapRegionSize`增加Region Size，避免老年代中的大对象占用过多的内存。
2. 增加heap大小，对应的效果G1可以有更多的时间去完成`Concurrent Marking`。
3. 增加`Concurrent Marking`的线程，通过`-XX:ConcGCThreads`设置。
4. 强制mark阶段提早进行。因为在Mark阶段之前，G1会根据应用程序之前的行为，去确定`the Initiating Heap Occupancy Percent`(`IHOP`)阈值大小，比如是否需要执行`initial Mark`，以及后续`CleanUp`阶段的`space-reclamation phase`；如果服务流量突然增加或者其他行为改变的话，那么基于之前的预测的阈值就会不准确，可以采取下面的思路：
   1. 可以增加G1在`IHOP`分析过程中的所需要的内存空间，通过`-XX:G1ReservePercent`来设置，提高预测的效率。
   2. 关闭G1的自动`IHOP`分析机制，`-XX:-G1UseAdaptiveIHOP`，然后手动的指定这个阈值大小，`-XX:InitiatingHeapOccupancyPercent`。这样就省去了每次预测的一个时间消耗。
5. Full gc可能是系统中的humongous object比较多，系统找不到一块连续的regions区域来分配。可以通过`-XX:G1HeapRegionSize`增加region size，或者将整个heap调大。

#### Mixed GC或者Young GC调优

###### Reference Object Processing时间消耗比较久

gc日志中可以看`Ref Proc`和`Ref Enq`，`Ref Proc`G1根据不同引用类型对象的要求去更新对应的referents；`Ref Enq`G1如果实际引用对象已经不可达了，那么就会将这些引用对象加入对应的引用队列中。如果这一过程比较长，可以考虑将这个过程开启并行，通过`-XX:+ParallelRefProcEnabled`。

###### `young-only`回收较久

主要原因是`Collection Set`中有太多的存活对象需要拷贝。可以通过gc日志中的`Evacuate Collection Set`看到对应的时间，可以增加young geenration的最小大小，通过`-XX:G1NewSizePercent`。 也可能是某一个瞬间，幸存下来的对象一下子有很多，这种情况会造成gc停顿时间猛涨，一般应对这种情况通过`-XX:G1MaxNewSizePercent`这个参数，增加young generation最大空间。

###### `Mixed`回收时间较久

通过开启`gc+ergo+cset=trace`，如果是`predicated young regions`花费比较长，可以针对上文中的方法。如果是`predicated old regions`比较长，则可以通过以下方法：

- 增加`-XX:G1MixedGCCountTarget`这个参数，将old generation的regions分散到较多的Collection（上文有解释）中，增加`-XX:G1MixedGCCountTarget`参数值。避免单次处理较大块的Collection。

https://juejin.im/post/5ed32ec96fb9a0480659e547

---

[CMS的CMSInitiatingOccupancyFraction默认值是多少？又是如何使用的？ \- 代码先锋网](https://www.codeleading.com/article/12901198022/)

```
void ConcurrentMarkSweepGeneration::init_initiating_occupancy(intx io, uintx tr) {
  assert(io <= 100 && tr <= 100, "Check the arguments");
  if (io >= 0) {
    _initiating_occupancy = (double)io / 100.0;
  } else {
    _initiating_occupancy = ((100 - MinHeapFreeRatio) +
                             (double)(tr * MinHeapFreeRatio) / 100.0)
                            / 100.0;
  }
}


java -XX:+PrintFlagsFinal -version |grep CMSInitiatingOccupancyFraction 

java -XX:+PrintFlagsFinal -version |grep MinHeapFreeRatio

java -XX:+PrintFlagsFinal -version |grep -E "CMSInitiatingOccupancyFraction|MinHeapFreeRatio|CMSTriggerRatio" 


可我在JDK1.8.0_171上执行，MinHeapFreeRatio = 0为什么啊，上文中说应该是40

$ java -XX:+PrintFlagsFinal -version |grep -E "CMSInitiatingOccupancyFraction|MinHeapFreeRatio|CMSTriggerRatio"

     intx CMSInitiatingOccupancyFraction            = -1                                  {product}
    uintx CMSTriggerRatio                           = 80                                  {product}
    uintx MinHeapFreeRatio                          = 0                                   {manageable}
java version "1.8.0_171"
Java(TM) SE Runtime Environment (build 1.8.0_171-b11)
Java HotSpot(TM) 64-Bit Server VM (build 25.171-b11, mixed mode)

续：
后来通过命令查看运行进程的JVM参数：jmap -heap pid
MinHeapFreeRatio居然打印出的是40，为什么不一样啊（这里我用的是G1启动的）
Heap Configuration:
   MinHeapFreeRatio         = 40
   MaxHeapFreeRatio         = 70
   MaxHeapSize              = 4294967296 (4096.0MB)
   NewSize                  = 1073741824 (1024.0MB)
   MaxNewSize               = 1073741824 (1024.0MB)
   OldSize                  = 5452592 (5.1999969482421875MB)
   NewRatio                 = 2
   SurvivorRatio            = 8
   MetaspaceSize            = 21807104 (20.796875MB)
   CompressedClassSpaceSize = 1073741824 (1024.0MB)
   MaxMetaspaceSize         = 17592186044415 MB
   G1HeapRegionSize         = 2097152 (2.0MB)
```



## JVM本地测试用例

[【深入浅出\-JVM】（37）：对象从新生代到老年代过程 \| 思考者浩哥](http://mousycoder.com/thinking-in-jvm/37/)

[深入理解JVM学习笔记\(二十七、JVM 内存分配\-\-\-\-大对象直接分配到老年代\)\_Java\_张\-\-小涛涛\-CSDN博客](https://blog.csdn.net/jintaohahahaha/article/details/83959890)







