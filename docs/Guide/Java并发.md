## 说说并发与并行的区别?

- **并发：** 同一时间段，多个任务都在执行 (单位时间内不一定同时执行)；
- **并行：** 单位时间内，多个任务同时执行。

## 使用多线程可能带来什么问题?

并发编程的目的就是为了能提高程序的执行效率提高程序运行速度，但是并发编程并不总是能提高程序运行速度的，而且并发编程可能会遇到很多问题，比如：内存泄漏、上下文切换、死锁还有受限于硬件和软件的资源闲置问题。

## 什么是上下文切换?

多线程编程中一般线程的个数都大于 CPU 核心的个数，而一个 CPU 核心在任意时刻只能被一个线程使用，为了让这些线程都能得到有效执行，CPU 采取的策略是为每个线程分配时间片并轮转的形式。当一个线程的时间片用完的时候就会重新处于就绪状态让给其他线程使用，这个过程就属于一次上下文切换。

概括来说就是：当前任务在执行完 CPU 时间片切换到另一个任务之前会先保存自己的状态，以便下次再切换回这个任务时，可以再加载这个任务的状态。**任务从保存到再加载的过程就是一次上下文切换**。

上下文切换通常是计算密集型的。也就是说，它需要相当可观的处理器时间，在每秒几十上百次的切换中，每次切换都需要纳秒量级的时间。所以，上下文切换对系统来说意味着消耗大量的 CPU 时间，事实上，可能是操作系统中时间消耗最大的操作。

Linux 相比与其他操作系统（包括其他类 Unix 系统）有很多的优点，其中有一项就是，其上下文切换和模式切换的时间消耗非常少。



## 什么是线程死锁?如何避免死锁?

### 什么是死锁

多个线程同时被阻塞，它们中的一个或者全部都在等待某个资源被释放。由于线程被无限期地阻塞，因此程序不可能正常终止。

如下图所示，线程 A 持有资源 2，线程 B 持有资源 1，他们同时都想申请对方的资源，所以这两个线程就会互相等待而进入死锁状态。

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/20200212144331.png)

产生死锁必须具备以下四个条件：

1. 互斥条件：该资源任意一个时刻只由一个线程占用。
2. 请求与保持条件：一个进程因请求资源而阻塞时，对已获得的资源保持不放。
3. 不剥夺条件:线程已获得的资源在末使用完之前不能被其他线程强行剥夺，只有自己使用完毕后才释放资源。
4. 循环等待条件:若干进程之间形成一种头尾相接的循环等待资源关系。

### 如何避免死锁

我们只要破坏产生死锁的四个条件中的其中一个就可以了。

**破坏互斥条件**

这个条件我们没有办法破坏，因为我们用锁本来就是想让他们互斥的（临界资源需要互斥访问）。

**破坏请求与保持条件**

一次性申请所有的资源。

**破坏不剥夺条件**

占用部分资源的线程进一步申请其他资源时，如果申请不到，可以主动释放它占有的资源。

**破坏循环等待条件**

靠按序申请资源来预防。按某一顺序申请资源，释放资源则反序释放。破坏循环等待条件。

## 线程有哪些基本状态？

Java 线程在运行的生命周期中的指定时刻只可能处于下面6种不同状态的其中一个状态（图源《Java 并发编程艺术》4.1.4节）。

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/20200211193149.png)

线程在生命周期中并不是固定处于某一个状态而是随着代码的执行在不同状态之间切换。Java 线程状态变迁如下图所示（图源《Java 并发编程艺术》4.1.4节）：

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/20200211193200.png)

线程创建之后它将处于 **NEW（新建）** 状态，调用 `start()` 方法后开始运行，线程这时候处于 **READY（可运行）** 状态。可运行状态的线程获得了 cpu 时间片（timeslice）后就处于 **RUNNING（运行）** 状态。

> 操作系统隐藏 Java虚拟机（JVM）中的 READY 和 RUNNING 状态，它只能看到 RUNNABLE 状态（图源：[HowToDoInJava](https://howtodoinjava.com/)：[Java Thread Life Cycle and Thread States](https://howtodoinjava.com/java/multi-threading/java-thread-life-cycle-and-thread-states/)），所以 Java 系统一般将这两个状态统称为 **RUNNABLE（运行中）** 状态 。

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/20200211193237.png)

当线程执行 `wait()`方法之后，线程进入 **WAITING（等待）**状态。进入等待状态的线程需要依靠其他线程的通知才能够返回到运行状态，而 **TIME_WAITING(超时等待)** 状态相当于在等待状态的基础上增加了超时限制，比如通过 `sleep（long millis）`方法或 `wait（long millis）`方法可以将 Java 线程置于 TIMED WAITING 状态。当超时时间到达后 Java 线程将会返回到 RUNNABLE 状态。当线程调用同步方法时，在没有获取到锁的情况下，线程将会进入到 **BLOCKED（阻塞）** 状态。线程在执行 Runnable 的`run()`方法之后将会进入到 **TERMINATED（终止）** 状态。

## Java线程状态

六种：NEW、RUNNABLE、BLOCKED、WAITING、TIMED_WAITING、TERMINATED

![Java-Thread-Status](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/Java-Thread-Status.png)

## 说说 sleep() 方法和 wait() 方法区别和共同点?

- 两者最主要的区别在于：**sleep 方法没有释放锁，而 wait 方法释放了锁** 。
- 两者都可以暂停线程的执行。
- Wait 通常被用于线程间交互/通信，sleep 通常被用于暂停执行。
- wait() 方法被调用后，线程不会自动苏醒，需要别的线程调用同一个对象上的 notify() 或者 notifyAll() 方法。sleep() 方法执行完成后，线程会自动苏醒。或者可以使用 wait(long timeout)超时后线程会自动苏醒。

## 为什么我们调用 start() 方法时会执行 run() 方法，为什么我们不能直接调用 run() 方法？

这是另一个非常经典的 java 多线程面试问题，而且在面试中会经常被问到。很简单，但是很多人都会答不上来！

new 一个 Thread，线程进入了新建状态;调用 start() 方法，会启动一个线程并使线程进入了就绪状态，当分配到时间片后就可以开始运行了。 start() 会执行线程的相应准备工作，然后自动执行 run() 方法的内容，这是真正的多线程工作。 而直接执行 run() 方法，会把 run 方法当成一个 main 线程下的普通方法去执行，并不会在某个线程中执行它，所以这并不是多线程工作。

**总结： 调用 start 方法方可启动线程并使线程进入就绪状态，而 run 方法只是 thread 的一个普通方法调用，还是在主线程里执行。**





## synchronized 关键字

[面试官和我扯了半个小时的synchronized，最后他输了](https://mp.weixin.qq.com/s?__biz=MzIwMzY1OTU1NQ==&mid=2247489250&idx=1&sn=d6213b4c941fba79ef8eaa4a4e42bffd&chksm=96cd56aea1badfb84f34268d70f0d8824ba749f98b752ff0837434e49ca63629d84f090e5ca9&scene=0&xtrack=1&clicktime=1587900352&enterid=1587900352&ascene=7&devicetype=android-28&version=27000e37&nettype=cmnet&abtest_cookie=AAACAA%3D%3D&lang=zh_CN&exportkey=A8EUJR2K6pRnSE8mjmDQRgY%3D&pass_ticket=szRm02bEqTiMlmm1cvzfE83ZcAz1bSeGTlVuiGaxWdPozE3khDhMqqq8Q2%2FZhNcp&wx_header=1)

在 Java 早期版本中，synchronized属于重量级锁，效率低下，因为监视器锁（monitor）是依赖于底层的操作系统的 Mutex Lock 来实现的，Java 的线程是映射到操作系统的原生线程之上的。如果要挂起或者唤醒一个线程，都需要操作系统帮忙完成，而操作系统实现线程之间的切换时需要从用户态转换到内核态，这个状态之间的转换需要相对比较长的时间，时间成本相对较高，这也是为什么早期的 synchronized 效率低的原因。

- 依赖底层操作系统的 `mutex` 相关指令实现，加锁解锁需要在用户态和内核态之间切换，性能损耗非常明显。
- 研究人员发现，大多数对象的加锁和解锁都是在特定的线程中完成。也就是出现线程竞争锁的情况概率比较低。他们做了一个实验，找了一些典型的软件，测试**同一个线程**加锁解锁的重复率，如下图所示，可以看到重复加锁比例非常高。早期JVM 有 19% 的执行时间浪费在锁上。

庆幸的是在 Java 6 之后 Java 官方对从 JVM 层面对synchronized 较大优化，所以现在的 synchronized 锁效率也优化得很不错了。JDK1.6对锁的实现引入了大量的优化，如自旋锁、适应性自旋锁、锁消除、锁粗化、偏向锁、轻量级锁等技术来减少锁操作的开销。

### 说说你怎么使用synchronized 关键字

**synchronized关键字最主要的三种使用方式：**

- **修饰实例方法:** 作用于当前对象实例加锁，进入同步代码前要获得当前对象实例的锁
- **修饰静态方法:** 也就是给当前类加锁，会作用于类的所有对象实例，因为静态成员不属于任何一个实例对象，是类成员（ static 表明这是该类的一个静态资源，不管new了多少个对象，只有一份）。所以如果一个线程A调用一个实例对象的非静态 synchronized 方法，而线程B需要调用这个实例对象所属类的静态 synchronized 方法，是允许的，不会发生互斥现象，**因为访问静态 synchronized 方法占用的锁是当前类的锁，而访问非静态 synchronized 方法占用的锁是当前实例对象锁**。
- **修饰代码块:** 指定加锁对象，对给定对象加锁，进入同步代码库前要获得给定对象的锁。

**总结：** synchronized 关键字加到 static 静态方法和 synchronized(class)代码块上都是是给 Class 类上锁。synchronized 关键字加到实例方法上是给对象实例上锁。尽量不要使用 synchronized(String a) 因为JVM中，字符串常量池具有缓存功能！

下面我以一个常见的面试题为例讲解一下 synchronized 关键字的具体使用。

面试中面试官经常会说：“单例模式了解吗？来给我手写一下！给我解释一下双重检验锁方式实现单例模式的原理呗！”

**双重校验锁实现对象单例（线程安全）**

```java
public class Singleton {

    private volatile static Singleton uniqueInstance;

    private Singleton() {
    }

    public static Singleton getUniqueInstance() {
       //先判断对象是否已经实例过，没有实例化过才进入加锁代码
        if (uniqueInstance == null) {
            //类对象加锁
            synchronized (Singleton.class) {
                if (uniqueInstance == null) {
                    uniqueInstance = new Singleton();
                }
            }
        }
        return uniqueInstance;
    }
}
```

另外，需要注意 uniqueInstance 采用 volatile 关键字修饰也是很有必要。

> uniqueInstance 采用 volatile 关键字修饰也是很有必要的， uniqueInstance = new Singleton(); 这段代码其实是分为三步执行：
>
> 1. 为 uniqueInstance 分配内存空间
> 2. 初始化 uniqueInstance
> 3. 将 uniqueInstance 指向分配的内存地址

但是由于 JVM 具有指令重排的特性，执行顺序有可能变成 1->3->2。指令重排在单线程环境下不会出现问题，但是在多线程环境下会导致一个线程获得还没有初始化的实例。例如，线程 T1 执行了 1 和 3，此时 T2 调用 getUniqueInstance() 后发现 uniqueInstance 不为空，因此返回 uniqueInstance，但此时 uniqueInstance 还未被初始化。

使用 volatile 可以禁止 JVM 的指令重排，保证在多线程环境下也能正常运行。

### 讲一下synchronized 关键字的底层原理

**synchronized 关键字底层原理属于 JVM 层面。**

**① synchronized 同步语句块的情况**

```java
public class SynchronizedDemo {
    public void method() {
        synchronized (this) {
            System.out.println("synchronized 代码块");
        }
    }
}
```

通过 JDK 自带的 javap 命令查看 SynchronizedDemo 类的相关字节码信息：首先切换到类的对应目录执行 `javac SynchronizedDemo.java` 命令生成编译后的 .class 文件，然后执行`javap -c -s -v -l SynchronizedDemo.class`。

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/20200214150011.png)

从上面我们可以看出：

有两个monitorexit指令的原因是：为了保证抛异常的情况下也能释放锁，所以javac为同步代码块添加了一个隐式的try-finally，在finally中会调用monitorexit命令释放锁。

**synchronized 同步语句块的实现使用的是 monitorenter 和 monitorexit 指令，其中 monitorenter 指令指向同步代码块的开始位置，monitorexit 指令则指明同步代码块的结束位置。** 当执行 monitorenter 指令时，线程试图获取锁也就是获取 monitor(monitor对象存在于每个Java对象的对象头中，synchronized 锁便是通过这种方式获取锁的，也是为什么Java中任意对象可以作为锁的原因) 的持有权。当计数器为0则可以成功获取，获取后将锁计数器设为1也就是加1。相应的在执行 monitorexit 指令后，将锁计数器设为0，表明锁被释放。如果获取对象锁失败，那当前线程就要阻塞等待，直到锁被另外一个线程释放为止。

**② synchronized 修饰方法的的情况**

```java
public class SynchronizedDemo2 {
    public synchronized void method() {
        System.out.println("synchronized 方法");
    }
}
```

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/20200214150133.png)

synchronized 修饰的方法并没有 monitorenter 指令和 monitorexit 指令，取得代之的确实是 ACC_SYNCHRONIZED 标识，该标识指明了该方法是一个同步方法，JVM 通过该 ACC_SYNCHRONIZED 访问标志来辨别一个方法是否声明为同步方法，从而执行相应的同步调用。

### JDK1.6 之后对synchronized锁的底层优化

JDK1.6 对锁的实现引入了大量的优化，如偏向锁、轻量级锁、自旋锁、适应性自旋锁、锁消除、锁粗化等技术来减少锁操作的开销。

<span style="color:red">锁主要存在四中状态，依次是：无锁状态、偏向锁状态、轻量级锁状态、重量级锁状态，他们会随着竞争的激烈而逐渐升级。注意锁可以升级不可降级，这种策略是为了提高获得锁和释放锁的效率。</span>

**①偏向锁**

**引入偏向锁的目的和引入轻量级锁的目的很像，他们都是为了没有多线程竞争的前提下，减少传统的重量级锁使用操作系统互斥量产生的性能消耗。但是不同是：轻量级锁在无竞争的情况下使用 CAS 操作去代替使用互斥量。而偏向锁在无竞争的情况下会把整个同步都消除掉**。

偏向锁的“偏”就是偏心的偏，它的意思是会偏向于第一个获得它的线程，如果在接下来的执行中，该锁没有被其他线程获取，那么持有偏向锁的线程就不需要进行同步！关于偏向锁的原理可以查看《深入理解Java虚拟机：JVM高级特性与最佳实践》第二版的13章第三节锁优化。

但是对于锁竞争比较激烈的场合，偏向锁就失效了，因为这样场合极有可能每次申请锁的线程都是不相同的，因此这种场合下不应该使用偏向锁，否则会得不偿失，需要注意的是，偏向锁失败后，并不会立即膨胀为重量级锁，而是先升级为轻量级锁。

**② 轻量级锁**

倘若偏向锁失败，虚拟机并不会立即升级为重量级锁，它还会尝试使用一种称为轻量级锁的优化手段(1.6之后加入的)。**轻量级锁不是为了代替重量级锁，它的本意是在没有多线程竞争的前提下，减少传统的重量级锁使用操作系统互斥量产生的性能消耗，因为使用轻量级锁时，不需要申请互斥量。另外，轻量级锁的加锁和解锁都用到了CAS操作。** 关于轻量级锁的加锁和解锁的原理可以查看《深入理解Java虚拟机：JVM高级特性与最佳实践》第二版的13章第三节锁优化。

**轻量级锁能够提升程序同步性能的依据是“对于绝大部分锁，在整个同步周期内都是不存在竞争的”，这是一个经验数据。如果没有竞争，轻量级锁使用 CAS 操作避免了使用互斥操作的开销。但如果存在锁竞争，除了互斥量开销外，还会额外发生CAS操作，因此在有锁竞争的情况下，轻量级锁比传统的重量级锁更慢！如果锁竞争激烈，那么轻量级将很快膨胀为重量级锁！**

**③ 自旋锁和自适应自旋**

轻量级锁失败后，虚拟机为了避免线程真实地在操作系统层面挂起，还会进行一项称为自旋锁的优化手段。

互斥同步对性能最大的影响就是阻塞的实现，因为挂起线程/恢复线程的操作都需要转入内核态中完成（用户态转换到内核态会耗费时间）。

**一般线程持有锁的时间都不是太长，所以仅仅为了这一点时间去挂起线程/恢复线程是得不偿失的。** 所以，虚拟机的开发团队就这样去考虑：“我们能不能让后面来的请求获取锁的线程等待一会而不被挂起呢？看看持有锁的线程是否很快就会释放锁”。**为了让一个线程等待，我们只需要让线程执行一个忙循环（自旋），这项技术就叫做自旋**。

百度百科对自旋锁的解释：

> 何谓自旋锁？它是为实现保护共享资源而提出一种锁机制。其实，自旋锁与互斥锁比较类似，它们都是为了解决对某项资源的互斥使用。无论是互斥锁，还是自旋锁，在任何时刻，最多只能有一个保持者，也就说，在任何时刻最多只能有一个执行单元获得锁。但是两者在调度机制上略有不同。对于互斥锁，如果资源已经被占用，资源申请者只能进入睡眠状态。但是自旋锁不会引起调用者睡眠，如果自旋锁已经被别的执行单元保持，调用者就一直循环在那里看是否该自旋锁的保持者已经释放了锁，"自旋"一词就是因此而得名。

自旋锁在 JDK1.6 之前其实就已经引入了，不过是默认关闭的，需要通过`--XX:+UseSpinning`参数来开启。JDK1.6及1.6之后，就改为默认开启的了。需要注意的是：自旋等待不能完全替代阻塞，因为它还是要占用处理器时间。如果锁被占用的时间短，那么效果当然就很好了！反之，相反！自旋等待的时间必须要有限度。如果自旋超过了限定次数任然没有获得锁，就应该挂起线程。**自旋次数的默认值是10次，用户可以修改`--XX:PreBlockSpin`来更改**。

另外,**在 JDK1.6 中引入了自适应的自旋锁。自适应的自旋锁带来的改进就是：自旋的时间不在固定了，而是和前一次同一个锁上的自旋时间以及锁的拥有者的状态来决定，虚拟机变得越来越“聪明”了**。

**④ 锁消除**

锁消除理解起来很简单，它指的就是虚拟机即使编译器在运行时，如果检测到那些共享数据不可能存在竞争，那么就执行锁消除。锁消除可以节省毫无意义的请求锁的时间。

**⑤ 锁粗化**

原则上，我们在编写代码的时候，总是推荐将同步块的作用范围限制得尽量小，——直在共享数据的实际作用域才进行同步，这样是为了使得需要同步的操作数量尽可能变小，如果存在锁竞争，那等待线程也能尽快拿到锁。

大部分情况下，上面的原则都是没有问题的，但是如果一系列的连续操作都对同一个对象反复加锁和解锁，那么会带来很多不必要的性能消耗。

### synchronized 和ReentrantLock 的区别

**① 两者都是可重入锁**

两者都是可重入锁。“可重入锁”概念是：自己可以再次获取自己的内部锁。比如一个线程获得了某个对象的锁，此时这个对象锁还没有释放，当其再次想要获取这个对象的锁的时候还是可以获取的，如果不可锁重入的话，就会造成死锁。同一个线程每次获取锁，锁的计数器都自增1，所以要等到锁的计数器下降为0时才能释放锁。

**② synchronized 依赖于 JVM 而 ReentrantLock 依赖于 API**

synchronized 是依赖于 JVM 实现的，前面我们也讲到了 虚拟机团队在 JDK1.6 为 synchronized 关键字进行了很多优化，但是这些优化都是在虚拟机层面实现的，并没有直接暴露给我们。ReentrantLock 是 JDK 层面实现的（也就是 API 层面，需要 lock() 和 unlock() 方法配合 try/finally 语句块来完成），所以我们可以通过查看它的源代码，来看它是如何实现的。

**③ ReentrantLock 比 synchronized 增加了一些高级功能**

相比synchronized，ReentrantLock增加了一些高级功能。主要来说主要有三点：**①等待可中断；②可实现公平锁；③可实现选择性通知（锁可以绑定多个条件）**

- **ReentrantLock提供了一种能够中断等待锁的线程的机制**，通过lock.lockInterruptibly()来实现这个机制。也就是说正在等待的线程可以选择放弃等待，改为处理其他事情。
- **ReentrantLock可以指定是公平锁还是非公平锁。而synchronized只能是非公平锁。所谓的公平锁就是先等待的线程先获得锁。** ReentrantLock默认情况是非公平的，可以通过 ReentrantLock类的`ReentrantLock(boolean fair)`构造方法来制定是否是公平的。
- synchronized关键字与wait()和notify()/notifyAll()方法相结合可以实现等待/通知机制，ReentrantLock类当然也可以实现，但是需要借助于Condition接口与newCondition() 方法。Condition是JDK1.5之后才有的，它具有很好的灵活性，比如可以实现多路通知功能也就是在一个Lock对象中可以创建多个Condition实例（即对象监视器），**线程对象可以注册在指定的Condition中，从而可以有选择性的进行线程通知，在调度线程上更加灵活。 在使用notify()/notifyAll()方法进行通知时，被通知的线程是由 JVM 选择的，用ReentrantLock类结合Condition实例可以实现“选择性通知”** ，这个功能非常重要，而且是Condition接口默认提供的。而synchronized关键字就相当于整个Lock对象中只有一个Condition实例，所有的线程都注册在它一个身上。如果执行notifyAll()方法的话就会通知所有处于等待状态的线程这样会造成很大的效率问题，而Condition实例的signalAll()方法 只会唤醒注册在该Condition实例中的所有等待线程。

如果你想使用上述功能，那么选择ReentrantLock是一个不错的选择。

**④ 性能已不是选择标准**

## volatile关键字

在 JDK1.2 之前，Java的内存模型实现总是从**主存**（即共享内存）读取变量，是不需要进行特别的注意的。而在当前的 Java 内存模型下，线程可以把变量保存**本地内存**（比如机器的寄存器）中，而不是直接在主存中进行读写。这就可能造成一个线程在主存中修改了一个变量的值，而另外一个线程还继续使用它在寄存器中的变量值的拷贝，造成**数据的不一致**。

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/数据不一致.png)

要解决这个问题，就需要把变量声明为**volatile**，这就指示 JVM，这个变量是不稳定的，每次使用它都到主存中进行读取。

**volatile** 关键字的主要作用：

1. 保证变量的内存可见性
2. 防止指令重排序

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/volatile关键字的可见性.png)

<div style="color:red">对于volatile变量，读操作时JMM会把工作内存中对应的值设为无效，要求线程从主内存中读取数据; 写操作时JMM会把工作内存中对应的数据刷新到主内存中，这种情况下，其它线程就可以读取变量的最新值</div>
### 底层实现：

```bash
汇编代码：
0x01a3de1d: movb $0x0,0x1104800(%esi);
0x01a3de24: **lock** addl $0x0,(%esp);
```

这个lock前缀指令相当于上述的内存屏障，提供了以下保证：
1、将当前CPU缓存行的数据写回到主内存；
2、这个写回内存的操作会导致在其它CPU里缓存了该内存地址的数据无效。

lock前缀指令其实就相当于一个内存屏障。内存屏障是一组CPU处理指令，用来实现对内存操作的顺序限制。volatile的底层就是通过内存屏障来实现的。

编译器和执行器 可以在保证输出结果一样的情况下对指令重排序，使性能得到优化。插入一个内存屏障，相当于告诉CPU和编译器先于这个命令的必须先执行，后于这个命令的必须后执行。

内存屏障另一个作用是强制更新一次不同CPU的缓存。例如，一个写屏障会把这个屏障前写入的数据刷新到缓存，这样任何试图读取该数据的线程将得到最新值，而不用考虑到底是被哪个cpu核心或者哪个CPU执行的。这正是volatile实现内存可见性的基础。

内存屏障细说来有写屏障、读屏障、读写屏障，而且内存屏障的实现依赖于编译器和机器两部分。

### synchronized关键字和volatile关键字比较

- **volatile关键字**是线程同步的**轻量级实现**，所以**volatile性能肯定比synchronized关键字要好**。但是**volatile关键字只能用于变量而synchronized关键字可以修饰方法以及代码块**。synchronized关键字在JavaSE1.6之后进行了主要包括为了减少获得锁和释放锁带来的性能消耗而引入的偏向锁和轻量级锁以及其它各种优化之后执行效率有了显著提升，**实际开发中使用 synchronized 关键字的场景还是更多一些**。
- **多线程访问volatile关键字不会发生阻塞，而synchronized关键字可能会发生阻塞**
- **volatile关键字能保证数据的可见性，但不能保证数据的原子性。synchronized关键字两者都能保证。**
- **volatile关键字主要用于解决变量在多个线程之间的可见性，而 synchronized关键字解决的是多个线程之间访问资源的同步性。**

## MESI

**`MESI`**（`Modified Exclusive Shared Or Invalid`）(也称为伊利诺斯协议，是因为该协议由伊利诺斯州立大学提出）是一种广泛使用的支持写回策略的缓存一致性协议。

### 

## 线程池

[Java线程池实现原理及其在美团业务中的实践 \- 美团技术团队](https://tech.meituan.com/2020/04/02/java-pooling-pratice-in-meituan.html)

### 为什么要用线程池

> **池化技术相比大家已经屡见不鲜了，线程池、数据库连接池、Http 连接池等等都是对这个思想的应用。池化技术的思想主要是为了减少每次获取资源的消耗，提高对资源的利用率。**

**线程池**提供了一种限制和管理资源（包括执行一个任务）。 每个**线程池**还维护一些基本统计信息，例如已完成任务的数量。

这里借用《Java 并发编程的艺术》提到的来说一下**使用线程池的好处**：

- **降低资源消耗**。通过重复利用已创建的线程降低线程创建和销毁造成的消耗。
- **提高响应速度**。当任务到达时，任务可以不需要的等到线程创建就能立即执行。
- **提高线程的可管理性**。线程是稀缺资源，如果无限制的创建，不仅会消耗系统资源，还会降低系统的稳定性，使用线程池可以进行统一的分配，调优和监控。

### 实现Runnable接口和Callable接口的区别

`Runnable`自Java 1.0以来一直存在，但`Callable`仅在Java 1.5中引入,目的就是为了来处理`Runnable`不支持的用例。**`Runnable` 接口**不会返回结果或抛出检查异常，但是**`Callable` 接口**可以。所以，如果任务不需要返回结果或抛出异常推荐使用 **`Runnable` 接口**，这样代码看起来会更加简洁。

工具类 `Executors` 可以实现 `Runnable` 对象和 `Callable` 对象之间的相互转换。（`Executors.callable（Runnable task`）或 `Executors.callable（Runnable task，Object resule）`）。

### 执行execute()方法和submit()方法的区别是什么呢？

1. **`execute()`方法用于提交不需要返回值的任务，所以无法判断任务是否被线程池执行成功与否；**
2. **`submit()`方法用于提交需要返回值的任务。线程池会返回一个 `Future` 类型的对象，通过这个 `Future` 对象可以判断任务是否执行成功**，并且可以通过 `Future` 的 `get()`方法来获取返回值，`get()`方法会阻塞当前线程直到任务完成，而使用 `get（long timeout，TimeUnit unit）`方法则会阻塞当前线程一段时间后立即返回，这时候有可能任务没有执行完。

### 如何创建线程池

《阿里巴巴Java开发手册》中强制线程池不允许使用 Executors 去创建，而是通过 ThreadPoolExecutor 的方式，这样的处理方式让写的同学更加明确线程池的运行规则，规避资源耗尽的风险

> Executors 返回线程池对象的弊端如下：
>
> - **FixedThreadPool 和 SingleThreadExecutor** ： 允许请求的队列长度为 Integer.MAX_VALUE ，可能堆积大量的请求，从而导致OOM。
> - **CachedThreadPool 和 ScheduledThreadPool** ： 允许创建的线程数量为 Integer.MAX_VALUE ，可能会创建大量线程，从而导致OOM。

**方式一：通过构造方法实现** 

![ThreadPoolExecutor构造方法.png](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/ThreadPoolExecutor构造方法.png) **方式二：通过Executor 框架的工具类Executors来实现** 我们可以创建三种类型的ThreadPoolExecutor：

- **FixedThreadPool** ： 该方法返回一个固定线程数量的线程池。该线程池中的线程数量始终不变。当有一个新的任务提交时，线程池中若有空闲线程，则立即执行。若没有，则新的任务会被暂存在一个任务队列中，待有线程空闲时，便处理在任务队列中的任务。
- **SingleThreadExecutor：** 方法返回一个只有一个线程的线程池。若多余一个任务被提交到该线程池，任务会被保存在一个任务队列中，待线程空闲，按先入先出的顺序执行队列中的任务。
- **CachedThreadPool：** 该方法返回一个可根据实际情况调整线程数量的线程池。线程池的线程数量不确定，但若有空闲线程可以复用，则会优先使用可复用的线程。若所有线程均在工作，又有新的任务提交，则会创建新的线程处理任务。所有线程在当前任务执行完毕后，将返回线程池进行复用。

对应Executors工具类中的方法如图所示： ![Executor框架的工具类](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/Executor框架的工具类.png)

#### ThreadPoolExecutor构造函数重要参数分析

**`ThreadPoolExecutor` 3 个最重要的参数：**

- **`corePoolSize` :** 核心线程数线程数定义了最小可以同时运行的线程数量。
- **`maximumPoolSize` :** 当队列中存放的任务达到队列容量的时候，当前可以同时运行的线程数量变为最大线程数。
- **`workQueue`:** 当新任务来的时候会先判断当前运行的线程数量是否达到核心线程数，如果达到的话，新任务就会被存放在队列中。

`ThreadPoolExecutor`其他常见参数:

1. **`keepAliveTime`**:当线程池中的线程数量大于 `corePoolSize` 的时候，如果这时没有新的任务提交，核心线程外的线程不会立即销毁，而是会等待，直到等待的时间超过了 `keepAliveTime`才会被回收销毁；
2. **`unit`** : `keepAliveTime` 参数的时间单位。
3. **`threadFactory`** :executor 创建新线程的时候会用到。
4. **`handler`** :饱和策略。关于饱和策略下面单独介绍一下。

##### ThreadPoolExecutor饱和策略定义

如果当前同时运行的线程数量达到最大线程数量并且队列也已经被放满了任时，`ThreadPoolTaskExecutor` 定义一些策略:

- **`ThreadPoolExecutor.AbortPolicy`**：抛出 `RejectedExecutionException`来拒绝新任务的处理。

- **`ThreadPoolExecutor.CallerRunsPolicy`**：调用执行自己的线程运行任务。您不会任务请求。但是这种策略会降低对于新任务提交速度，影响程序的整体性能。另外，这个策略喜欢增加队列容量。如果您的应用程序可以承受此延迟并且你不能任务丢弃任何一个任务请求的话，你可以选择这个策略。

  任务会交个上层线程**（主线程）执行**，导致主线程既要处理其他任务，又要忙碌处理线程池的源源不断的大量任务，导致hang住。

- **`ThreadPoolExecutor.DiscardPolicy`：** 不处理新任务，直接丢弃掉，不抛异常。

- **`ThreadPoolExecutor.DiscardOldestPolicy`：** 此策略将丢弃最早的未处理的任务请求。

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/20200212145236.png)

> 我们在代码中模拟了 10 个任务，我们配置的核心线程数为 5 、等待队列容量为 100 ，所以每次只可能存在 5 个任务同时执行，剩下的 5 个任务会被放到等待队列中去。当前的 5 个任务之行完成后，才会之行剩下的 5 个任务。

##### ThreadPoolExecutor任务队列

- **使用直接提交策略，也即SynchronousQueue：**首先SynchronousQueue是无界的，也就是说他存数任务的能力是没有限制的，但是由于该Queue本身的特性，**在某次添加元素后必须等待其他线程取走后才能继续添加**。在这里不是核心线程便是新创建的线程。
- **使用无界队列策略，即LinkedBlockingQueue：对于无界队列来说，总是可以加入的（资源耗尽，当然另当别论）。换句说，永远也不会触发产生新的线程！corePoolSize大小的线程数会一直运行，**
- **有界队列，使用ArrayBlockingQueue：**这个是最为复杂的使用，所以JDK不推荐使用也有些道理。与上面的相比，最大的特点便是可以防止资源耗尽的情况发生。

[java自带线程池和队列详细讲解 \- OSCHINA](https://www.oschina.net/question/565065_86540&nbsp)

### 线程池怎么回收多余的线程的

说白了整个 `Worker` 的生命周期大致可以理解为：线程池干活了（`execute()` / `submit()`），然后就是正式干活了（`runWorker()`），使用 `getTask()` 获取任务（中间会有一系列的判断（`corePoolSize` 是否达到，任务队列是否满了，线程池是否达到了 `maximumPoolSize`，超时等），如果没有 task 了，就进行后期的扫尾工作并且从 `workers` 中移除 worker。

[线程池中的空余线程是如何被回收的](https://mp.weixin.qq.com/s?__biz=MzU1OTgyMDc3Mg==&mid=2247483834&idx=1&sn=db7cec29acba533cce79ec476b224a82&chksm=fc103b31cb67b2273e97e1b6836664286a99c36e196027e32cc0d45f21e690b41e70a285b1cb&token=347054940&lang=zh_CN#rd)

怎么回收核心线程：

1. allowCoreThreadTimeOut设置为true
2. 调用shutdown方法

## ThreadLocal

通常情况下，我们创建的变量是可以被任何一个线程访问并修改的。**如果想实现每一个线程都有自己的专属本地变量该如何解决呢？** JDK中提供的`ThreadLocal`类正是为了解决这样的问题。 **`ThreadLocal`类主要解决的就是让每个线程绑定自己的值，可以将`ThreadLocal`类形象的比喻成存放数据的盒子，盒子中可以存储每个线程的私有数据。**

**如果你创建了一个`ThreadLocal`变量，那么访问这个变量的每个线程都会有这个变量的本地副本，这也是`ThreadLocal`变量名的由来。他们可以使用 `get（）` 和 `set（）` 方法来获取默认值或将其值更改为当前线程所存的副本的值，从而避免了线程安全问题。**

```java
//与此线程有关的ThreadLocal值。由ThreadLocal类维护
ThreadLocal.ThreadLocalMap threadLocals = null;

//与此线程有关的InheritableThreadLocal值。由InheritableThreadLocal类维护
ThreadLocal.ThreadLocalMap inheritableThreadLocals = null;
```

从上面`Thread`类 源代码可以看出`Thread` 类中有一个 `threadLocals` 和 一个 `inheritableThreadLocals` 变量，它们都是 `ThreadLocalMap` 类型的变量,我们可以把 `ThreadLocalMap` 理解为`ThreadLocal` 类实现的定制化的 `HashMap`。默认情况下这两个变量都是null，只有当前线程调用 `ThreadLocal` 类的 `set`或`get`方法时才创建它们，实际上调用这两个方法的时候，我们调用的是`ThreadLocalMap`类对应的 `get()`、`set()`方法。

`ThreadLocal`类的`set()`方法

```java
    public void set(T value) {
        Thread t = Thread.currentThread();
        ThreadLocalMap map = getMap(t);
        if (map != null)
            map.set(this, value);
        else
            createMap(t, value);
    }
    ThreadLocalMap getMap(Thread t) {
        return t.threadLocals;
    }
```

通过上面这些内容，我们足以通过猜测得出结论：**最终的变量是放在了当前线程的 `ThreadLocalMap` 中，并不是存在 `ThreadLocal` 上，`ThreadLocal` 可以理解为只是`ThreadLocalMap`的封装，传递了变量值。** `ThrealLocal` 类中可以通过`Thread.currentThread()`获取到当前线程对象后，直接通过`getMap(Thread t)`可以访问到该线程的`ThreadLocalMap`对象。

**每个`Thread`中都具备一个`ThreadLocalMap`，而`ThreadLocalMap`可以存储以`ThreadLocal`为key的键值对。** 比如我们在同一个线程中声明了两个 `ThreadLocal` 对象的话，会使用 `Thread`内部都是使用仅有那个`ThreadLocalMap` 存放数据的，`ThreadLocalMap`的 key 就是 `ThreadLocal`对象，value 就是 `ThreadLocal` 对象调用`set`方法设置的值。`ThreadLocal` 是 map结构是为了让每个线程可以关联多个 `ThreadLocal`变量。这也就解释了 ThreadLocal 声明的变量为什么在每一个线程都有自己的专属本地变量。

`ThreadLocalMap`是`ThreadLocal`的静态内部类。

### ThreadLocal内存泄露问题

`ThreadLocalMap` 中使用的 key 为 `ThreadLocal` 的弱引用,而 value 是强引用。所以，如果 `ThreadLocal` 没有被外部强引用的情况下，在垃圾回收的时候，key 会被清理掉，而 value 不会被清理掉。这样一来，`ThreadLocalMap` 中就会出现key为null的Entry。假如我们不做任何措施的话，value 永远无法被GC 回收，这个时候就可能会产生内存泄露。ThreadLocalMap实现中已经考虑了这种情况，在调用 `set()`、`get()`、`remove()` 方法的时候，会清理掉 key 为 null 的记录。使用完 `ThreadLocal`方法后 最好手动调用`remove()`方法。

#### ThreadLocal导致内存泄露的错误行为[#](https://www.cnblogs.com/hongdada/p/12108611.html#1615183349)

- 1.使用static的ThreadLocal，延长了ThreadLocal的生命周期，可能导致内存泄漏
- 2.分配使用了ThreadLocal又不再调用`get()`，`set()`，`remove()方法` 就会导致内存泄漏
- 3.当使用线程池时，即当前线程不一定会退出（比如固定大小的线程池），这样将一些大对象设置到ThreadLocal中，可能会导致系统出现内存泄露（当对象不再使用时，因为引用存在，无法被回收）

#### ThreadLocal导致内存泄露的根源[#](https://www.cnblogs.com/hongdada/p/12108611.html#1724941734)

- 首先需要明确一点：ThreadLocal本身的设计是不会导致内存泄露的，原因更多是使用不当导致的！
- ThreadLocalMap对象被Thread对象所持有，当线程退出时，Thread类执行清理操作，比如清理ThreadLocalMap；否则该ThreadLocalMap对象的引用并不会被回收。

```java
//先回顾一下：Thread的exit方法
/**
  * This method is called by the system to give a Thread
  * a chance to clean up before it actually exits.
  */
private void exit() {
    if (group != null) {
        group.threadTerminated(this);
        group = null;
    }
    /* Aggressively null out all reference fields: see bug 4006245 */
    target = null;
    /* Speed the release of some of these resources */
    threadLocals = null;//清空threadLocalMap的引用
    inheritableThreadLocals = null;
    inheritedAccessControlContext = null;
    blocker = null;
    uncaughtExceptionHandler = null;
}
```

- **根源：**由于Entry的key弱引用特性（见**注意**），当每次GC时JVM会主动将无用的弱引用回收掉，因此当ThreadLocal外部没有强引用依赖时，就会被自动回收，这样就可能造成当ThreadLocal被回收时，相当于将Map中的key设置为null，但问题**是该key对应的entry和value并不会主动被GC回收**，
- **当Entry和value未被主动回收时，除非当前线程死亡，否则线程对于Entry的强引用会一直存在，从而导致内存泄露**
- **建议：** 当希望回收对象，最好使用`ThreadLocal.remove()方法`将该变量主动移除，告知JVM执行GC回收
- **注意：** **ThreadLocal本身不是弱引用的，Entry继承了WeakReference，同时Entry又将自身的key封装成弱引用，所有真正的弱引用是Entry的key，只不过恰好Entry的key是ThreadLocal！！**

```java
static class Entry extends WeakReference<ThreadLocal<?>> {
    Object value;
    Entry(ThreadLocal<?> k, Object v) {
        //这里才是真正的弱引用！！
        super(k);//将key变成了弱引用！而key恰好又是ThreadLocal！
        value = v;
    }
}
public class WeakReference<T> extends Reference<T> {
    public WeakReference(T referent) {
        super(referent);
    }
    public WeakReference(T referent, ReferenceQueue<? super T> q) {
        super(referent, q);
    }
}
```

#### 仿ThreadLocalMap结构测试[#](https://www.cnblogs.com/hongdada/p/12108611.html#786156400)

```java
public class AnalogyThreadLocalDemo {

    public static void main(String[] args) {
        HashMap map = new HashMap();
        Obj o1 = new Obj();
        Obj o2 = new Obj();
        map.put(o1, "o1");
        map.put(o2, "o2");
        o1 = null;
        System.gc();
        System.out.println("##########o1 gc:" + map);
        o2 = null;
        System.gc();
        System.out.println("##########o2 gc:" + map);
        map.clear();
        System.gc();
        System.out.println("##########GC after map clear:" + map);
    }
}

class Obj {
    private final String DESC = "obj exists";
    @Override
    public String toString() {
        return DESC;
    }
    @Override
    protected void finalize() throws Throwable {
        System.out.println("##########gc over");
    }
}
```

设置VM options:

```java
-verbose:gc
-XX:+PrintGCDetails
-XX:+PrintTenuringDistribution
-XX:+PrintGCTimeStamps
```

Output:

```java
0.316: [GC (System.gc()) 
Desired survivor size 11010048 bytes, new threshold 7 (max 15)
[PSYoungGen: 7911K->1290K(76288K)] 7911K->1298K(251392K), 0.0025504 secs] [Times: user=0.00 sys=0.00, real=0.00 secs] 
0.319: [Full GC (System.gc()) [PSYoungGen: 1290K->0K(76288K)] [ParOldGen: 8K->1194K(175104K)] 1298K->1194K(251392K), [Metaspace: 3310K->3310K(1056768K)], 0.0215288 secs] [Times: user=0.00 sys=0.00, real=0.02 secs] 
##########o1 gc:{obj exists=o1, obj exists=o2}
0.342: [GC (System.gc()) 
Desired survivor size 11010048 bytes, new threshold 7 (max 15)
[PSYoungGen: 1310K->64K(76288K)] 2504K->1258K(251392K), 0.0002418 secs] [Times: user=0.00 sys=0.00, real=0.00 secs] 
0.342: [Full GC (System.gc()) [PSYoungGen: 64K->0K(76288K)] [ParOldGen: 1194K->964K(175104K)] 1258K->964K(251392K), [Metaspace: 3322K->3322K(1056768K)], 0.0058113 secs] [Times: user=0.00 sys=0.00, real=0.01 secs] 
##########o2 gc:{obj exists=o1, obj exists=o2}
0.348: [GC (System.gc()) 
Desired survivor size 11010048 bytes, new threshold 7 (max 15)
[PSYoungGen: 1310K->32K(76288K)] 2275K->996K(251392K), 0.0002203 secs] [Times: user=0.00 sys=0.00, real=0.00 secs] 
0.349: [Full GC (System.gc()) [PSYoungGen: 32K->0K(76288K)] [ParOldGen: 964K->964K(175104K)] 996K->964K(251392K), [Metaspace: 3322K->3322K(1056768K)], 0.0055209 secs] [Times: user=0.00 sys=0.00, real=0.01 secs] 
##########gc over
##########gc over
##########GC after map clear:{}
Heap
 PSYoungGen      total 76288K, used 3932K [0x000000076af00000, 0x0000000770400000, 0x00000007c0000000)
  eden space 65536K, 6% used [0x000000076af00000,0x000000076b2d7248,0x000000076ef00000)
  from space 10752K, 0% used [0x000000076ef00000,0x000000076ef00000,0x000000076f980000)
  to   space 10752K, 0% used [0x000000076f980000,0x000000076f980000,0x0000000770400000)
 ParOldGen       total 175104K, used 964K [0x00000006c0c00000, 0x00000006cb700000, 0x000000076af00000)
  object space 175104K, 0% used [0x00000006c0c00000,0x00000006c0cf1240,0x00000006cb700000)
 Metaspace       used 3328K, capacity 4500K, committed 4864K, reserved 1056768K
  class space    used 355K, capacity 388K, committed 512K, reserved 1048576K
```

可以看出，当`map.clear()`以后，`Obj`对象才被`finalize`回收

### 为什么ThreadLocalMap 设计为ThreadLocal 内部类

主要是说明ThreadLocalMap 是一个线程本地的值，它所有的方法都是private 的，也就意味着除了ThreadLocal 这个类，其他类是不能操作ThreadLocalMap 中的任何方法的，这样就可以对其他类是透明的。同时这个类的权限是包级别的，也就意味着只有同一个包下面的类才能引用ThreadLocalMap 这个类，这也是Thread 为什么可以引用ThreadLocalMap 的原因，因为他们在同一个包下面。

虽然Thread 可以引用ThreadLocalMap，但是不能调用任何ThreadLocalMap 中的方法。这也就是我们平时都是通过ThreadLocal 来获取值和设置值。

但我们调用ThreadLocal 的get 方法的时候，其实我们最后是通过调用ThreadLdocalMap 来获取值的。

到这里，读者应该大概明白了，其实ThreadLdocalMap 对使用者来说是透明的，可以当作空气，我们一值使用的都是ThreadLocal，这样的设计在使用的时候就显得简单，然后封装性又特别好。

### ThreadLdocalMap 什么时候开始和Thread 进行绑定的呢

在第一次调用ThreadLocal set() 方法的时候开始绑定的，来我们看下set 方法的源码

```JAVA
    public void set(T value) {
        Thread t = Thread.currentThread();
        ThreadLocalMap map = getMap(t);
        if (map != null)
            map.set(this, value);
        else
        //第一次的时候进来这里，因为ThreadLocalMap 还没和Thread 绑定
            createMap(t, value);
    }
    
    //这个时候开始创建一个新的ThreadLocalMap 赋值给Thread 进行绑定
    void createMap(Thread t, T firstValue) {
        t.threadLocals = new ThreadLocalMap(this, firstValue);
    }
```

### 魔数0x61c88647与碰撞解决

- 机智的读者肯定发现ThreadLocalMap并没有使用链表或红黑树去解决hash冲突的问题，而仅仅只是使用了数组来维护整个哈希表，那么重中之重的散列性要如何保证就是一个很大的考验
- ThreadLocalMap通过结合三个巧妙的设计去解决这个问题：
  - 1.Entry的key设计成弱引用，因此key随时可能被GC（也就是失效快），尽量多的面对空槽
  - 2.(单个ThreadLocal时)当遇到碰撞时，通过线性探测的开放地址法解决冲突问题
  - 3.(多个ThreadLocal时)引入了神奇的`0x61c88647`，增强其的散列性，大大减少碰撞几率
- 之所以不用累加而用该值，笔者认为可能跟其找最近的空槽有关（跳跃查找比自增1查找用来找空槽可能更有效一些，因为有了更多可选择的空间`spreading out`），同时也跟其良好的散列性有关
- 0x61c88647与黄金比例、Fibonacci 数有关，读者可参见[What is the meaning of 0x61C88647 constant in ThreadLocal.java](https://stackoverflow.com/questions/38994306/what-is-the-meaning-of-0x61c88647-constant-in-threadlocal-java)

### ThreadLocal总结[#](https://www.cnblogs.com/hongdada/p/12108611.html#231477983)

- ThreadLocal 并不解决线程间共享数据的问题
- ThreadLocal 通过隐式的在不同线程内创建独立实例副本避免了实例线程安全的问题
- 每个线程持有一个 Map 并维护了 ThreadLocal 对象与具体实例的映射，该 Map 由于只被持有它的线程访问，故不存在线程安全以及锁的问题
- ThreadLocalMap 的 Entry 对 ThreadLocal 的引用为弱引用，避免了 ThreadLocal 对象无法被回收的问题
- ThreadLocalMap 的 set 方法通过调用 replaceStaleEntry 方法回收键为 null 的 Entry 对象的值（即为具体实例）以及 Entry 对象本身从而防止内存泄漏
- ThreadLocal 适用于变量在线程间隔离且在方法间共享的场景

## Atomic原子类

所以，所谓原子类说简单点就是具有原子/原子操作特征的类。

并发包 `java.util.concurrent` 的原子类都存放在`java.util.concurrent.atomic`下,如下图所示。

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/JUC原子类概览.png)

### AtomicInteger原理分析

AtomicInteger 类的部分源码：

```java
// setup to use Unsafe.compareAndSwapInt for updates（更新操作时提供“比较并替换”的作用）
private static final Unsafe unsafe = Unsafe.getUnsafe();
private static final long valueOffset;

static {
  try {
    valueOffset = unsafe.objectFieldOffset
      (AtomicInteger.class.getDeclaredField("value"));
  } catch (Exception ex) { throw new Error(ex); }
}

private volatile int value;

public final boolean compareAndSet(int expect, int update) {
        return unsafe.compareAndSwapInt(this, valueOffset, expect, update);
}
```

AtomicInteger 类主要利用 **CAS (compare and swap) + volatile 和 native 方法**来保证原子操作，从而避免 synchronized 的高开销，执行效率大为提升。

CAS的原理是拿期望的值和原本的一个值作比较，如果相同则更新成新的值。UnSafe 类的 objectFieldOffset() 方法是一个本地方法，这个方法是用来拿到“原来的值”的内存地址，返回值是 valueOffset。另外 value 是一个volatile变量，在内存中可见，因此 JVM 可以保证任何时刻任何线程总能拿到该变量的最新值。

关于 Atomic 原子类这部分更多内容可以查看我的这篇文章：并发编程面试必备：[JUC 中的 Atomic 原子类总结](https://mp.weixin.qq.com/s/joa-yOiTrYF67bElj8xqvg)



## AQS

AQS的全称为（AbstractQueuedSynchronizer），这个类在java.util.concurrent.locks包下面。

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/AQS类.png)

AQS是一个用来构建锁和同步器的框架，使用AQS能简单且高效地构造出应用广泛的大量的同步器，比如我们提到的ReentrantLock，Semaphore，其他的诸如ReentrantReadWriteLock，SynchronousQueue，FutureTask等等皆是基于AQS的。当然，我们自己也能利用AQS非常轻松容易地构造出符合我们自己需求的同步器。

### AQS原理

**AQS 核心思想是，如果被请求的共享资源空闲，则将当前请求资源的线程设置为有效的工作线程，并且将共享资源设置为锁定状态。如果被请求的共享资源被占用，那么就需要一套线程阻塞等待以及被唤醒时锁分配的机制，这个机制 AQS 是用 CLH 队列锁实现的，即将暂时获取不到锁的线程加入到队列中。**

> CLH(Craig,Landin,and Hagersten)队列是一个虚拟的双向队列（虚拟的双向队列即不存在队列实例，仅存在结点之间的关联关系）。AQS 是将每条请求共享资源的线程封装成一个 CLH 锁队列的一个结点（Node）来实现锁的分配。

看个 AQS(AbstractQueuedSynchronizer)原理图：

![CLH](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/CLH.png)

AQS 使用一个 int 成员变量state来表示同步状态，通过内置的 FIFO 队列来完成获取资源线程的排队工作。AQS 使用 CAS 对该同步状态进行原子操作实现对其值的修改。当state>0时表示已经获取了锁，当state = 0时表示释放了锁。它提供了三个方法（getState()、setState(int newState)、compareAndSetState(int expect,int update)）来对同步状态state进行操作，当然AQS可以确保对state的操作是安全的。

```java
private volatile int state;//共享变量，使用volatile修饰保证线程可见性
```

状态信息通过 protected 类型的`getState`，`setState`，`compareAndSetState`进行操作

```java
//返回同步状态的当前值
protected final int getState() {
        return state;
}
 // 设置同步状态的值
protected final void setState(int newState) {
        state = newState;
}
//原子地（CAS操作）将同步状态值设置为给定值update如果当前同步状态的值等于expect（期望值）
protected final boolean compareAndSetState(int expect, int update) {
        return unsafe.compareAndSwapInt(this, stateOffset, expect, update);
}
```

#### 主要方法

AQS的设计是基于**模板方法模式**的，它有一些方法必须要子类去实现的，它们主要有：

- isHeldExclusively()：该线程是否正在独占资源。只有用到condition才需要去实现它。
- tryAcquire(int)：独占方式。尝试获取资源，成功则返回true，失败则返回false。
- tryRelease(int)：独占方式。尝试释放资源，成功则返回true，失败则返回false。
- tryAcquireShared(int)：共享方式。尝试获取资源。负数表示失败；0表示成功，但没有剩余可用资源；正数表示成功，且有剩余资源。
- tryReleaseShared(int)：共享方式。尝试释放资源，如果释放后允许唤醒后续等待结点返回true，否则返回false。

#### 获取资源

这里会涉及到两个变化

- 新的线程封装成Node节点追加到同步队列中，设置prev节点以及修改当前节点的前置节点的next节点指向自己
- 通过CAS将tail重新指向新的尾部节点



#### 释放资源

head节点表示获取锁成功的节点，当头结点在释放同步状态时，会唤醒后继节点，如果后继节点获得锁成功，会把自己设置为头结点。

这个过程也是涉及到两个变化

- 修改head节点指向下一个获得锁的节点
- 新的获得锁的节点，将prev的指针指向null

这里有一个小的变化，就是设置head节点不需要用CAS，原因是设置head节点是由获得锁的线程来完成的，而同步锁只能由一个线程获得，所以不需要CAS保证，只需要把head节点设置为原首节点的后继节点，并且断开原head节点的next引用即可



### 资源共享方式

资源有两种共享模式，或者说两种同步方式：

- 独占模式（Exclusive）：资源是独占的，一次只能一个线程获取。如ReentrantLock。
- 共享模式（Share）：同时可以被多个线程获取，具体的资源个数可以通过参数指定。如Semaphore/CountDownLatch。

一般来说，自定义同步器要么是独占方法，要么是共享方式，他们也只需实现`tryAcquire-tryRelease`、`tryAcquireShared-tryReleaseShared`中的一种即可。但 AQS 也支持自定义同步器同时实现独占和共享两种方式，如`ReentrantReadWriteLock`。

### 公平锁、非公平锁

基于AQS的锁(比如ReentrantLock)原理大体是这样:
有一个state变量，初始值为0，假设当前线程为A,每当A获取一次锁，status++. 释放一次，status--.锁会记录当前持有的线程。
当A线程拥有锁的时候，status>0. B线程尝试获取锁的时候会对这个status有一个CAS(0,1)的操作，尝试几次失败后就挂起线程，进入一个等待队列。
如果A线程恰好释放，--status==0, A线程会去唤醒等待队列中第一个线程，即刚刚进入等待队列的B线程，B线程被唤醒之后回去检查这个status的值，尝试CAS(0,1),而如果这时恰好C线程也尝试去争抢这把锁。

非公平锁实现：
C直接尝试对这个status CAS(0,1)操作，并成功改变了status的值，B线程获取锁失败，再次挂起，这就是非公平锁，B在C之前尝试获取锁，而最终是C抢到了锁。
公平锁：
C发现有线程在等待队列，直接将自己进入等待队列并挂起,B获取锁。

1. 非公平锁在调用 lock 后，首先就会调用 CAS 进行一次抢锁，如果这个时候恰巧锁没有被占用，那么直接就获取到锁返回了。
2. 非公平锁在 CAS 失败后，和公平锁一样都会进入到 tryAcquire 方法，在 tryAcquire 方法中，如果发现锁这个时候被释放了（state == 0），非公平锁会直接 CAS 抢锁，但是公平锁会判断等待队列是否有线程处于等待状态，如果有则不去抢锁，乖乖排到后面。

公平锁和非公平锁就这两点区别，如果这两次 CAS 都不成功，那么后面非公平锁和公平锁是一样的，都要进入到阻塞队列等待唤醒。

相对来说，非公平锁会有更好的性能，因为它的吞吐量比较大。当然，非公平锁让获取锁的时间变得更加不确定，可能会导致在阻塞队列中的线程长期处于饥饿状态。

[AQS\-独占与共享\_业精于勤荒于嬉 行成于思毁于随\-CSDN博客\_aqs 独占 共享](https://blog.csdn.net/sinat_34976604/article/details/80970975)



### ReentrantLock调用过程

ReentrantLock把所有Lock接口的操作都委派到一个Sync类上，该类继承了AbstractQueuedSynchronizer：

```dart
static abstract class Sync extends AbstractQueuedSynchronizer  
```

Sync又有两个子类：

```dart
final static class NonfairSync extends Sync  
final static class FairSync extends Sync  
```

显然是为了支持**公平锁和非公平锁**而定义，默认情况下为非公平锁。
**先理一下Reentrant.lock()方法的调用过程（默认非公平锁）**：

![Reentrant.lock()](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/Reentrant.lock().png)

ReentrantLock就是使用AQS而实现的一把锁，它实现了可重入锁，公平锁和非公平锁。它有一个内部类用作同步器是Sync，Sync是继承了AQS的一个子类，并且公平锁和非公平锁是继承了Sync的两个子类。ReentrantLock的原理是：假设有一个线程A来尝试获取锁，它会先CAS修改state的值，从0修改到1，如果修改成功，那就说明获取锁成功，设置加锁线程为当前线程。如果此时又有一个线程B来尝试获取锁，那么它也会CAS修改state的值，从0修改到1，因为线程A已经修改了state的值，那么线程B就会修改失败，然后他会判断一下加锁线程是否为自己本身线程，如果是自己本身线程的话它就会将state的值直接加1，这是为了实现锁的可重入。如果加锁线程不是当前线程的话，那么就会将它生成一个Node节点，加入到等待队列的队尾，直到什么时候线程A释放了锁它会唤醒等待队列队头的线程。这里还要分为公平锁和非公平锁，默认为非公平锁，公平锁和非公平锁无非就差了一步。如果是公平锁，此时又有外来线程尝试获取锁，它会首先判断一下等待队列是否有第一个节点，如果有第一个节点，就说明等待队列不为空，有等待获取锁的线程，那么它就不会去同步队列中抢占cpu资源。如果是非公平锁的话，它就不会判断等待队列是否有第一个节点，它会直接前往同步对列中去抢占cpu资源。

  以下是ReentrantLock的原理图解，简单明了：

![ReentrantLock-AQS](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/ReentrantLock-AQS.png)

[深度解析：AQS原理\_qq\_37685457的博客\-CSDN博客\_aqs原理](https://blog.csdn.net/qq_37685457/article/details/89704124)

[扒一扒 ReentrantLock 以及 AQS 实现原理](https://mp.weixin.qq.com/s/jCBrHSVK647bdVIPvJHxOg)

[大白话聊聊Java并发面试问题之谈谈你对AQS的理解？【石杉的架构笔记】](https://mp.weixin.qq.com/s/PAn5oTlvVmjMepmCRdBnkQ)

[11 AQS · 深入浅出Java多线程](http://concurrent.redspider.group/article/02/11.html)

[深入分析AQS实现原理 \- 并发编程 \- SegmentFault 思否](https://segmentfault.com/a/1190000017372067#item-2-7)

## 并发辅助类

- CountDownLatch 一般用于某个线程 A 等待若干个其他线程执行完任务之后，它才执行。

- CyclicBarrier 一般用于一组线程互相等待至某个状态，然后这一组线程再同时执行。

此外，CountDownLatch 是不能够重用的，而 CyclicBarrier 是可以重用的。

- Semaphore：信号量

  用来控制同时访问特定资源的线程数量，它通过协调各个线程以保证合理的使用公共资源，可以用做流量控制，譬如数据库连接场景控制等；Semaphore 的构造方法 Semaphore(int permits) 接收一个整型参数，表示可用的许可证数量，即最大并发数量，使用方法就是在线程里面首先调用 acquire 方法获取一个许可，使用完后接着调用 release 归还一个许可，还可以使用 tryAcquire 尝试获取许可，其还提供了一些状态数量获取方法，不再说明。

[JDK并发包总结 \- 大道方圆 \- 博客园](https://www.cnblogs.com/xdecode/p/9102741.html)

[Java并发编程的4个同步辅助类（CountDownLatch、CyclicBarrier、Semaphore、Phaser）](https://www.cnblogs.com/lizhangyong/p/8906774.html)

[Java多线程-ABC三个线程顺序输出的问题 \- 会被淹死的鱼 \- 博客园](https://www.cnblogs.com/icejoywoo/archive/2012/10/15/2724674.html)

### Semaphore

允许多个线程同时访问某个资源。

执行 `acquire` 方法阻塞，直到有一个许可证可以获得然后拿走一个许可证；每个 `release` 方法增加一个许可证，这可能会释放一个阻塞的 acquire 方法。然而，其实并没有实际的许可证这个对象，Semaphore 只是维持了一个可获得许可证的数量。 Semaphore 经常用于限制获取某种资源的线程数量。

Semaphore与CountDownLatch一样，也是共享锁的一种实现。它默认构造AQS的state为permits。当执行任务的线程数量超出permits,那么多余的线程将会被放入阻塞队列Park,并自旋判断state是否大于0。只有当state大于0的时候，阻塞的线程才能继续执行,此时先前执行任务的线程继续执行release方法，release方法使得state的变量会加1，那么自旋的线程便会判断成功。 如此，每次只有最多不超过permits数量的线程能自旋成功，便限制了执行任务线程的数量。

### CountDownLatch(倒计时器)

![Concurrent-CountDownLatch](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/Concurrent-CountDownLatch.png)

以 CountDownLatch 以例，任务分为 N 个子线程去执行，state 也初始化为 N（注意 N 要与线程个数一致）。这 N 个子线程是并行执行的，每个子线程执行完后 countDown()一次，state 会 CAS(Compare and Swap)减 1。等到所有子线程都执行完后(即 state=0)，会 unpark()主调用线程，然后主调用线程就会从 await()函数返回，继续后余动作。

### CyclicBarrier(循环栅栏)

![Concurrent-CyclicBarrier](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/Concurrent-CyclicBarrier.png)

CyclicBarrier 和 CountDownLatch 非常类似，它也可以实现线程间的技术等待，但是它的功能比 CountDownLatch 更加复杂和强大。主要应用场景和 CountDownLatch 类似。

> CountDownLatch的实现是基于AQS的，而CycliBarrier是基于 ReentrantLock(ReentrantLock也属于AQS同步器)和 Condition 的.

CyclicBarrier 的字面意思是可循环使用（Cyclic）的屏障（Barrier）。它要做的事情是，让一组线程到达一个屏障（也可以叫同步点）时被阻塞，直到最后一个线程到达屏障时，屏障才会开门，所有被屏障拦截的线程才会继续干活。CyclicBarrier 默认的构造方法是 `CyclicBarrier(int parties)`，其参数表示屏障拦截的线程数量，每个线程调用`await`方法告诉 CyclicBarrier 我已经到达了屏障，然后当前线程被阻塞。

#### CyclicBarrier 和 CountDownLatch 的区别

- CountDownLatch 是计数器，只能使用一次，而 CyclicBarrier 的计数器提供 reset 功能，可以多次使用。
- 对于 CountDownLatch 来说，重点是“一个线程（多个线程）等待”，而其他的 N 个线程在完成“某件事情”之后，可以终止，也可以等待。而对于 CyclicBarrier，重点是多个线程，在任意一个线程没有完成，所有的线程都必须等待。

### ReentrantReadWriteLock

重入读写锁，它实现了ReadWriteLock接口，在这个类中维护了两个锁，一个是ReadLock，一个是WriteLock，他们都分别实现了Lock接口。读写锁是一种适合读多写少的场景下解决线程安全问题的工具，基本原则是：`读和读不互斥、读和写互斥、写和写互斥`。也就是说涉及到影响数据变化的操作都会存在互斥。

### CopyOnWriteArrayList

在很多应用场景中，读操作可能会远远大于写操作。由于读操作根本不会修改原有的数据，因此对于每次读取都进行加锁其实是一种资源浪费。我们应该允许多个线程同时访问 List 的内部数据，毕竟读取操作是安全的。

这和我们之前在多线程章节讲过 `ReentrantReadWriteLock` 读写锁的思想非常类似，也就是读读共享、写写互斥、读写互斥、写读互斥。JDK 中提供了 `CopyOnWriteArrayList` 类比相比于在读写锁的思想又更进一步。为了将读取的性能发挥到极致，`CopyOnWriteArrayList` **读取是完全不用加锁的**，并且更厉害的是：写入也不会阻塞读取操作。只有写入和写入之间需要进行同步等待。这样一来，读操作的性能就会大幅度提升。**那它是怎么做的呢？**

`CopyOnWriteArrayList` 类的所有可变操作（add，set 等等）都是通过创建底层数组的新副本来实现的。当 List 需要被修改的时候，我并不修改原有内容，而是对原有数据进行一次复制，将修改的内容写入副本。写完之后，再将修改完的副本替换原来的数据，这样就可以保证写操作不会影响读操作了。

所谓`CopyOnWrite` 也就是说：在计算机，如果你想要对一块内存进行修改时，我们不在原有内存块中进行写操作，而是将内存拷贝一份，在新的内存中进行写操作，写完之后呢，就将指向原来内存指针指向新的内存，原来的内存就可以被回收掉了。

## Java锁有哪些种类

- 公平**锁**/非公平**锁**
- 可重入**锁**
- 独享**锁**/共享**锁**
- 互斥**锁**/读写**锁**
- 乐观**锁**/悲观**锁**
- 分段**锁**
- 偏向**锁**/轻量级**锁**/重量级**锁**
- 自旋**锁**

## 乐观锁 与 悲观锁

### [悲观锁](https://snailclimb.gitee.io/javaguide/#/docs/essential-content-for-interview/面试必备之乐观锁与悲观锁?id=悲观锁)

总是假设最坏的情况，每次去拿数据的时候都认为别人会修改，所以每次在拿数据的时候都会上锁，这样别人想拿这个数据就会阻塞直到它拿到锁（**共享资源每次只给一个线程使用，其它线程阻塞，用完后再把资源转让给其它线程**）。传统的关系型数据库里边就用到了很多这种锁机制，比如行锁，表锁等，读锁，写锁等，都是在做操作之前先上锁。Java中`synchronized`和`ReentrantLock`等独占锁就是悲观锁思想的实现。

### [乐观锁](https://snailclimb.gitee.io/javaguide/#/docs/essential-content-for-interview/面试必备之乐观锁与悲观锁?id=乐观锁)

总是假设最好的情况，每次去拿数据的时候都认为别人不会修改，所以不会上锁，但是在更新的时候会判断一下在此期间别人有没有去更新这个数据，可以使用版本号机制和CAS算法实现。**乐观锁适用于多读的应用类型，这样可以提高吞吐量**，像数据库提供的类似于**write_condition机制**，其实都是提供的乐观锁。在Java中`java.util.concurrent.atomic`包下面的原子变量类就是使用了乐观锁的一种实现方式**CAS**实现的。

#### [乐观锁常见的两种实现方式](https://snailclimb.gitee.io/javaguide/#/docs/essential-content-for-interview/面试必备之乐观锁与悲观锁?id=乐观锁常见的两种实现方式)

> **乐观锁一般会使用版本号机制或CAS算法实现。**

#### [1. 版本号机制](https://snailclimb.gitee.io/javaguide/#/docs/essential-content-for-interview/面试必备之乐观锁与悲观锁?id=_1-版本号机制)

#### [2. CAS算法](https://snailclimb.gitee.io/javaguide/#/docs/essential-content-for-interview/面试必备之乐观锁与悲观锁?id=2-cas算法)

即**compare and swap（比较与交换）**，是一种有名的**无锁算法**。无锁编程，即不使用锁的情况下实现多线程之间的变量同步，也就是在没有线程被阻塞的情况下实现变量的同步，所以也叫非阻塞同步（Non-blocking Synchronization）。**CAS算法**涉及到三个操作数

- 需要读写的内存值 V
- 进行比较的值 A
- 拟写入的新值 B

当且仅当 V 的值等于 A时，CAS通过原子方式用新值B来更新V的值，否则不会执行任何操作（比较和替换是一个原子操作）。一般情况下是一个**自旋操作**，即**不断的重试**。

CAS操作底层是基于处理器的CMPXCHG指令实现的，如果是多处理器，为cmpxchg指令添加lock前缀。

[深入浅出CAS \- 占小狼](https://www.jianshu.com/p/fb6e91b013cc)

### [乐观锁的缺点](https://snailclimb.gitee.io/javaguide/#/docs/essential-content-for-interview/面试必备之乐观锁与悲观锁?id=乐观锁的缺点)

> ABA 问题是乐观锁一个常见的问题

#### [1 ABA 问题](https://snailclimb.gitee.io/javaguide/#/docs/essential-content-for-interview/面试必备之乐观锁与悲观锁?id=1-aba-问题)

如果一个变量V初次读取的时候是A值，并且在准备赋值的时候检查到它仍然是A值，那我们就能说明它的值没有被其他线程修改过了吗？很明显是不能的，因为在这段时间它的值可能被改为其他值，然后又改回A，那CAS操作就会误认为它从来没有被修改过。这个问题被称为CAS操作的 **"ABA"问题。**

JDK 1.5 以后的 `AtomicStampedReference 类`就提供了此种能力，其中的 `compareAndSet 方法`就是首先检查当前引用是否等于预期引用，并且当前标志是否等于预期标志，如果全部相等，则以原子方式将该引用和该标志的值设置为给定的更新值。

#### [2 循环时间长开销大](https://snailclimb.gitee.io/javaguide/#/docs/essential-content-for-interview/面试必备之乐观锁与悲观锁?id=2-循环时间长开销大)

**自旋CAS（也就是不成功就一直循环执行直到成功）如果长时间不成功，会给CPU带来非常大的执行开销。** 如果JVM能支持处理器提供的pause指令那么效率会有一定的提升，pause指令有两个作用，第一它可以延迟流水线执行指令（de-pipeline）,使CPU不会消耗过多的执行资源，延迟的时间取决于具体实现的版本，在一些处理器上延迟时间是零。第二它可以避免在退出循环的时候因内存顺序冲突（memory order violation）而引起CPU流水线被清空（CPU pipeline flush），从而提高CPU的执行效率。

#### [3 只能保证一个共享变量的原子操作](https://snailclimb.gitee.io/javaguide/#/docs/essential-content-for-interview/面试必备之乐观锁与悲观锁?id=3-只能保证一个共享变量的原子操作)

CAS 只对单个共享变量有效，当操作涉及跨多个共享变量时 CAS 无效。但是从 JDK 1.5开始，提供了`AtomicReference类`来保证引用对象之间的原子性，你可以把多个变量放在一个对象里来进行 CAS 操作.所以我们可以使用锁或者利用`AtomicReference类`把多个共享变量合并成一个共享变量来操作。

### [CAS与synchronized的使用情景](https://snailclimb.gitee.io/javaguide/#/docs/essential-content-for-interview/面试必备之乐观锁与悲观锁?id=cas与synchronized的使用情景)

> **简单的来说CAS适用于写比较少的情况下（多读场景，冲突一般较少），synchronized适用于写比较多的情况下（多写场景，冲突一般较多）**

1. 对于资源竞争较少（线程冲突较轻）的情况，使用synchronized同步锁进行线程阻塞和唤醒切换以及用户态内核态间的切换操作额外浪费消耗cpu资源；而CAS基于硬件实现，不需要进入内核，不需要切换线程，操作自旋几率较少，因此可以获得更高的性能。
2. 对于资源竞争严重（线程冲突严重）的情况，CAS自旋的概率会比较大，从而浪费更多的CPU资源，效率低于synchronized。

补充： Java并发编程这个领域中synchronized关键字一直都是元老级的角色，很久之前很多人都会称它为 **“重量级锁”** 。但是，在JavaSE 1.6之后进行了主要包括为了减少获得锁和释放锁带来的性能消耗而引入的 **偏向锁** 和 **轻量级锁** 以及其它**各种优化**之后变得在某些情况下并不是那么重了。synchronized的底层实现主要依靠 **Lock-Free** 的队列，基本思路是 **自旋后阻塞**，**竞争切换后继续竞争锁**，**稍微牺牲了公平性，但获得了高吞吐量**。在线程冲突较少的情况下，可以获得和CAS类似的性能；而线程冲突严重的情况下，性能远高于CAS。



## Fork/Join框架

### 工作窃取算法

工作窃取算法指的是在多线程执行不同任务队列的过程中，某个线程执行完自己队列的任务后从其他线程的任务队列里窃取任务来执行。

值得注意的是，当一个线程窃取另一个线程的时候，为了减少两个任务线程之间的竞争，我们通常使用**双端队列**来存储任务。被窃取的任务线程都从双端队列的**头部**拿任务执行，而窃取其他任务的线程从双端队列的**尾部**执行任务。

另外，当一个线程在窃取任务时要是没有其他可用的任务了，这个线程会进入**阻塞状态**以等待再次“工作”。

### ForkJoinTask

**fork()方法**:使用线程池中的空闲线程异步提交任务

**join()方法**：等待处理任务的线程处理完毕，获得返回值。

### ForkJoinPool

ForkJoinPool是用于执行ForkJoinTask任务的执行（线程）池。

ForkJoinPool管理着执行池中的线程和任务队列，此外，执行池是否还接受任务，显示线程的运行状态也是在这里处理。

#### WorkQueue

双端队列，ForkJoinTask存放在这里。

当工作线程在处理自己的工作队列时，会从队列首取任务来执行（FIFO）；如果是窃取其他队列的任务时，窃取的任务位于所属任务队列的队尾（LIFO）。

ForkJoinPool与传统线程池最显著的区别就是它维护了一个**工作队列数组**（volatile WorkQueue[] workQueues，ForkJoinPool中的**每个工作线程都维护着一个工作队列**）。

#### runState

ForkJoinPool的运行状态。**SHUTDOWN**状态用负数表示，其他用2的幂次表示。



### Java8 stream里的Fork/Join框架使用

Java8 stream里的并行流计算就是用的Fork/Join框架，在最终的并行执行`evaluateParallel`方法里创建了`new ReduceTask<>(this, helper, spliterator).invoke().get();`，而这里的`ReduceTask`最终继承的就是`ForkJoinTask`类。

它们的继承关系如下：

> ReduceTask -> AbstractTask -> CountedCompleter -> ForkJoinTask

这里的ReduceTask的invoke方法，其实是调用的ForkJoinTask的invoke方法，中间三层继承并没有覆盖这个方法的实现。

注意：在多核的情况下，使用Stream的并行计算确实比串行计算能带来很大效率上的提升，并且也能保证结果计算完全准确。

本文一直在强调的“多核”的情况。其实可以看到，我的本地电脑有8核，但并行计算耗时并不是单线程计算耗时除以8，因为线程的创建、销毁以及维护线程上下文的切换等等都有一定的开销。所以如果你的服务器并不是多核服务器，那也没必要用Stream的并行计算。因为在单核的情况下，往往Stream的串行计算比并行计算更快，因为它不需要线程切换的开销。

[18 Fork/Join框架 · 深入浅出Java多线程](http://concurrent.redspider.group/article/03/18.html)

[19 Java 8 Stream并行计算原理 · 深入浅出Java多线程](http://concurrent.redspider.group/article/03/19.html)



- fail-fastfail-fast是如何抛出ConcurrentModificationException异常的，又是在什么情况下才会抛出?
  我们知道，对于集合如list，map类，我们都可以通过迭代器来遍历，而Iterator其实只是一个接口，具体的实现还是要看具体的集合类中的内部类去实现Iterator并实现相关方法。

  从源码知道，每次调用next()方法，在实际访问元素前，都会调用checkForComodification方法，该方法源码如下：

  ```
          final void checkForComodification() {
              if (modCount != expectedModCount)
                  throw new ConcurrentModificationException();
          }
  ```

  可以看出，该方法才是判断是否抛出ConcurrentModificationException异常的关键。在该段代码中，当modCount != expectedModCount
  时，就会抛出该异常。但是在一开始的时候，expectedModCount初始值默认等于modCount，为什么会出现modCount != expectedModCount，很明显expectedModCount在整个迭代过程除了一开始赋予初始值modCount外，并没有再发生改变，所以可能发生改变的就只有modCount，在前面关于ArrayList扩容机制的分析中，可以知道在ArrayList进行add，remove，clear等涉及到修改集合中的元素个数的操作时，modCount就会发生改变(modCount ++),所以当另一个线程(并发修改)或者同一个线程遍历过程中，调用相关方法使集合的个数发生改变，就会使modCount发生变化，这样在checkForComodification方法中就会抛出ConcurrentModificationException异常。
  类似的，hashMap中发生的原理也是一样的。

- safe-fast

  并发包下的容器都是“快速安全的”

- happens before

  内存指令重排序