## Java的基本数据类型

| 类型    | 存储需求 | bit 数 | 取值范围               | 备注                                                         |
| ------- | -------- | ------ | ---------------------- | ------------------------------------------------------------ |
| int     | 4字节    | 4*8    | -2147483648~2147483647 | 即 (-2)的31次方 ~ (2的31次方) - 1                            |
| short   | 2字节    | 2*8    | -32768~32767           | 即 (-2)的15次方 ~ (2的15次方) - 1                            |
| long    | 8字节    | 8*8    |                        | 即 (-2)的63次方 ~ (2的63次方) - 1                            |
| byte    | 1字节    | 1*8    | -128~127               | 即 (-2)的7次方 ~ (2的7次方) - 1                              |
| float   | 4字节    | 4*8    |                        | float 类型的数值有一个后缀 F（例如：3.14F）                  |
| double  | 8字节    | 8*8    |                        | 没有后缀 F 的浮点数值（例如：3.14）默认为 double             |
| boolean | 1字节    | 1*8    | true、false            |                                                              |
| char    | 2字节    | 2*8    |                        | Java中，只要是字符，不管是数字还是英文还是汉字，都占两个字节。 |

至于为什么 Java 中 char 无论中英文数字都占用2字节，是因为 Java 中使用 Unicode 字符，所有字符均以2个字节存储。

## 重载和重写的区别

#### [重载](https://snailclimb.gitee.io/javaguide/#/docs/java/Java基础知识?id=重载)

发生在同一个类中，方法名必须相同，参数类型不同、个数不同、顺序不同，方法返回值和访问修饰符可以不同。

#### [重写](https://snailclimb.gitee.io/javaguide/#/docs/java/Java基础知识?id=重写)

重写是子类对父类的允许访问的方法的实现过程进行重新编写，发生在子类中，方法名、参数列表必须相同，返回值范围小于等于父类，抛出的异常范围小于等于父类，访问修饰符范围大于等于父类。另外，如果父类方法访问修饰符为 private 则子类就不能重写该方法。**也就是说方法提供的行为改变，而方法的外貌并没有改变。**



## Java 面向对象编程三大特性: 封装 继承 多态

### [封装](https://snailclimb.gitee.io/javaguide/#/docs/java/Java基础知识?id=封装)

封装把一个对象的属性私有化，同时提供一些可以被外界访问的属性的方法，如果属性不想被外界访问，我们大可不必提供方法给外界访问。但是如果一个类没有提供给外界访问的方法，那么这个类也没有什么意义了。

### [继承](https://snailclimb.gitee.io/javaguide/#/docs/java/Java基础知识?id=继承)

继承是使用已存在的类的定义作为基础建立新类的技术，新类的定义可以增加新的数据或新的功能，也可以用父类的功能，但不能选择性地继承父类。通过使用继承我们能够非常方便地复用以前的代码。

**关于继承如下 3 点请记住：**

1. 子类拥有父类对象所有的属性和方法（包括私有属性和私有方法），但是父类中的私有属性和方法子类是无法访问，**只是拥有**。
2. 子类可以拥有自己属性和方法，即子类可以对父类进行扩展。
3. 子类可以用自己的方式实现父类的方法。（以后介绍）。

### [多态](https://snailclimb.gitee.io/javaguide/#/docs/java/Java基础知识?id=多态)

所谓多态就是指程序中定义的引用变量所指向的具体类型和通过该引用变量发出的方法调用在编程时并不确定，而是在程序运行期间才确定，即一个引用变量到底会指向哪个类的实例对象，该引用变量发出的方法调用到底是哪个类中实现的方法，必须在由程序运行期间才能决定。

在Java中有两种形式可以实现多态：继承（多个子类对同一方法的重写）和接口（实现接口并覆盖接口中同一方法）。



## String、StringBuffer 和 StringBuilder 的区别是什么? String 为什么是不可变的 ?

**可变性**

简单的来说：String 类中使用 final 关键字修饰字符数组来保存字符串，`private　final　char　value[]`，所以 String 对象是不可变的。而StringBuilder 与 StringBuffer 都继承自 AbstractStringBuilder 类，在 AbstractStringBuilder 中也是使用字符数组保存字符串`char[]value` 但是没有用 final 关键字修饰，所以这两种对象都是可变的。

StringBuilder 与 StringBuffer 的构造方法都是调用父类构造方法也就是 AbstractStringBuilder 实现的，大家可以自行查阅源码。

AbstractStringBuilder.java

```java
abstract class AbstractStringBuilder implements Appendable, CharSequence {
    char[] value;
    int count;
    AbstractStringBuilder() {
    }
    AbstractStringBuilder(int capacity) {
        value = new char[capacity];
    }
```

**线程安全性**

String 中的对象是不可变的，也就可以理解为常量，线程安全。AbstractStringBuilder 是 StringBuilder 与 StringBuffer 的公共父类，定义了一些字符串的基本操作，如 expandCapacity、append、insert、indexOf 等公共方法。StringBuffer 对方法加了同步锁或者对调用的方法加了同步锁，所以是线程安全的。StringBuilder 并没有对方法进行加同步锁，所以是非线程安全的。　

**性能**

每次对 String 类型进行改变的时候，都会生成一个新的 String 对象，然后将指针指向新的 String 对象。StringBuffer 每次都会对 StringBuffer 对象本身进行操作，而不是生成新的对象并改变对象引用。相同情况下使用 StringBuilder 相比使用 StringBuffer 仅能获得 10%~15% 左右的性能提升，但却要冒多线程不安全的风险。

**对于三者使用的总结：**

1. 操作少量的数据: 适用String
2. 单线程操作字符串缓冲区下操作大量数据: 适用StringBuilder
3. 多线程操作字符串缓冲区下操作大量数据: 适用StringBuffer

## 接口和抽象类的区别是什么？

1. 接口的方法默认是 public，所有方法在接口中不能有实现(Java 8 开始接口方法可以有默认实现），而抽象类可以有非抽象的方法。
2. 接口中除了static、final变量，不能有其他变量，而抽象类中则不一定。
3. 一个类可以实现多个接口，但只能实现一个抽象类。接口自己本身可以通过extends关键字扩展多个接口。
4. 接口方法默认修饰符是public，抽象方法可以有public、protected和default这些修饰符（抽象方法就是为了被重写所以不能使用private关键字修饰！）。
5. 从设计层面来说，抽象是对类的抽象，是一种模板设计，而接口是对行为的抽象，是一种行为的规范。

备注：在JDK8中，接口也可以定义静态方法，可以直接用接口名调用。实现类和实现是不可以调用的。如果同时实现两个接口，接口中定义了一样的默认方法，则必须重写，不然会报错。



## == 与 equals(重要)

**==** : 它的作用是判断两个对象的地址是不是相等。即，判断两个对象是不是同一个对象(基本数据类型==比较的是值，引用数据类型==比较的是内存地址)。

**equals()** : 它的作用也是判断两个对象是否相等。但它一般有两种使用情况：

- 情况1：类没有覆盖 equals() 方法。则通过 equals() 比较该类的两个对象时，等价于通过“==”比较这两个对象。
- 情况2：类覆盖了 equals() 方法。一般，我们都覆盖 equals() 方法来比较两个对象的内容是否相等；若它们的内容相等，则返回 true (即，认为这两个对象相等)。

**举个例子：**

```java
public class test1 {
    public static void main(String[] args) {
        String a = new String("ab"); // a 为一个引用
        String b = new String("ab"); // b为另一个引用,对象的内容一样
        String aa = "ab"; // 放在常量池中
        String bb = "ab"; // 从常量池中查找
        if (aa == bb) // true
            System.out.println("aa==bb");
        if (a == b) // false，非同一对象
            System.out.println("a==b");
        if (a.equals(b)) // true
            System.out.println("aEQb");
        if (42 == 42.0) { // true
            System.out.println("true");
        }
    }
}
```

**说明：**

- String 中的 equals 方法是被重写过的，因为 object 的 equals 方法是比较的对象的内存地址，而 String 的 equals 方法比较的是对象的值。
- 当创建 String 类型的对象时，虚拟机会在常量池中查找有没有已经存在的值和要创建的值相同的对象，如果有就把它赋给当前引用。如果没有就在常量池中重新创建一个 String 对象。

## hashCode 与 equals (重要)

面试官可能会问你：“你重写过 hashcode 和 equals 么，为什么重写equals时必须重写hashCode方法？”

### [hashCode（）介绍](https://snailclimb.gitee.io/javaguide/#/docs/java/Java基础知识?id=hashcode（）介绍)

hashCode() 的作用是获取哈希码，也称为散列码；它实际上是返回一个int整数。这个哈希码的作用是确定该对象在哈希表中的索引位置。hashCode() 定义在JDK的Object.java中，这就意味着Java中的任何类都包含有hashCode() 函数。

散列表存储的是键值对(key-value)，它的特点是：能根据“键”快速的检索出对应的“值”。这其中就利用到了散列码！（可以快速找到所需要的对象）

### [为什么要有 hashCode](https://snailclimb.gitee.io/javaguide/#/docs/java/Java基础知识?id=为什么要有-hashcode)

**我们先以“HashSet 如何检查重复”为例子来说明为什么要有 hashCode：** 当你把对象加入 HashSet 时，HashSet 会先计算对象的 hashcode 值来判断对象加入的位置，同时也会与其他已经加入的对象的 hashcode 值作比较，如果没有相符的hashcode，HashSet会假设对象没有重复出现。但是如果发现有相同 hashcode 值的对象，这时会调用 `equals()`方法来检查 hashcode 相等的对象是否真的相同。如果两者相同，HashSet 就不会让其加入操作成功。如果不同的话，就会重新散列到其他位置。（摘自我的Java启蒙书《Head first java》第二版）。这样我们就大大减少了 equals 的次数，相应就大大提高了执行速度。

通过我们可以看出：`hashCode()` 的作用就是**获取哈希码**，也称为散列码；它实际上是返回一个int整数。这个**哈希码的作用**是确定该对象在哈希表中的索引位置。**`hashCode()`在散列表中才有用，在其它情况下没用**。在散列表中hashCode() 的作用是获取对象的散列码，进而确定该对象在散列表中的位置。

### [hashCode（）与equals（）的相关规定](https://snailclimb.gitee.io/javaguide/#/docs/java/Java基础知识?id=hashcode（）与equals（）的相关规定)

1. 如果两个对象相等，则hashcode一定也是相同的
2. 两个对象相等，对两个对象分别调用equals方法都返回true
3. 两个对象有相同的hashcode值，它们也不一定是相等的
4. **因此，equals 方法被覆盖过，则 hashCode 方法也必须被覆盖**
5. hashCode() 的默认行为是对堆上的对象产生独特值。如果没有重写 hashCode()，则该 class 的两个对象无论如何都不会相等（即使这两个对象指向相同的数据）

推荐阅读：[Java hashCode() 和 equals()的若干问题解答](https://www.cnblogs.com/skywang12345/p/3324958.html)

[java中hashmap为什么key的值不一样调用hashcode的hash值为什么相同？ \- 知乎](https://www.zhihu.com/question/355013552)

[关于hashCode,你一定听说过会重复，那么你见过2个不同的字符串hashCode值却是相同的吗\_Java\_HD243608836的博客\-CSDN博客](https://blog.csdn.net/HD243608836/article/details/78680119)

## 关于final关键字的一些总结

final关键字主要用在三个地方：变量、方法、类。

1. 当用final修饰一个变量时：

   如果是基本数据类型的变量，则其数值一旦在初始化之后便不能更改；

   如果是引用类型的变量，则在对其初始化之后便不能再让其指向另一个对象。

2. 当用final修饰一个类时：表明这个类不能被继承。final类中的所有成员方法都会被隐式地指定为final方法。

3. 使用final方法的原因有两个。第一个原因是把方法锁定，以防任何继承类修改它的含义；第二个原因是效率。在早期的Java实现版本中，会将final方法转为内嵌调用。但是如果方法过于庞大，可能看不到内嵌调用带来的任何性能提升（现在的Java版本已经不需要使用final方法进行这些优化了）。类中所有的private方法都隐式地指定为final。

## 异常处理总结

- **try 块：** 用于捕获异常。其后可接零个或多个catch块，如果没有catch块，则必须跟一个finally块。
- **catch 块：** 用于处理try捕获到的异常。
- **finally 块：** 无论是否捕获或处理异常，finally块里的语句都会被执行。当在try块或catch块中遇到return 语句时，finally语句块将在方法返回之前被执行。

**在以下4种特殊情况下，finally块不会被执行：**

1. 在finally语句块第一行发生了异常。 因为在其他行，finally块还是会得到执行
2. 在前面的代码中用了System.exit(int)已退出程序。 exit是带参函数 ；若该语句在异常语句之后，finally会执行
3. 程序所在的线程死亡。
4. 关闭CPU。

下面这部分内容来自issue:https://github.com/Snailclimb/JavaGuide/issues/190。

**注意：** 当try语句和finally语句中都有return语句时，在方法返回之前，finally语句的内容将被执行，并且finally语句的返回值将会覆盖原始的返回值。如下：

```java
    public static int f(int value) {
        try {
            return value * value;
        } finally {
            if (value == 2) {
                return 0;
            }
        }
    }
```

如果调用 `f(2)`，返回值将是0，因为finally语句的返回值覆盖了try语句块的返回值。

## Java中有些字段不想序列化怎么办？

对于不想进行序列化的变量，使用`transient`关键字修饰。

`transient`关键字的作用是：阻止实例中那些用此关键字修饰的的变量序列化；当对象被反序列化时，被`transient`修饰的变量值不会被持久化和恢复。`transient`只能修饰变量，不能修饰类和方法。

## BIO、NIO、AIO的区别

- **BIO (Blocking I/O):** 同步阻塞I/O模式，数据的读取写入必须阻塞在一个线程内等待其完成。在活动连接数不是特别高（小于单机1000）的情况下，这种模型是比较不错的，可以让每一个连接专注于自己的 I/O 并且编程模型简单，也不用过多考虑系统的过载、限流等问题。线程池本身就是一个天然的漏斗，可以缓冲一些系统处理不了的连接或请求。但是，当面对十万甚至百万级连接的时候，传统的 BIO 模型是无能为力的。因此，我们需要一种更高效的 I/O 处理模型来应对更高的并发量。
- **NIO (New I/O):** NIO是一种同步非阻塞的I/O模型，在Java 1.4 中引入了NIO框架，对应 java.nio 包，提供了 Channel , Selector，Buffer等抽象。NIO中的N可以理解为Non-blocking，不单纯是New。它支持面向缓冲的，基于通道的I/O操作方法。 NIO提供了与传统BIO模型中的 `Socket` 和 `ServerSocket` 相对应的 `SocketChannel` 和 `ServerSocketChannel` 两种不同的套接字通道实现,两种通道都支持阻塞和非阻塞两种模式。阻塞模式使用就像传统中的支持一样，比较简单，但是性能和可靠性都不好；非阻塞模式正好与之相反。对于低负载、低并发的应用程序，可以使用同步阻塞I/O来提升开发速率和更好的维护性；对于高负载、高并发的（网络）应用，应使用 NIO 的非阻塞模式来开发
- **AIO (Asynchronous I/O):** AIO 也就是 NIO 2。在 Java 7 中引入了 NIO 的改进版 NIO 2,它是异步非阻塞的IO模型。异步 IO 是基于事件和回调机制实现的，也就是应用操作之后会直接返回，不会堵塞在那里，当后台处理完成，操作系统会通知相应的线程进行后续的操作。AIO 是异步IO的缩写，虽然 NIO 在网络操作中，提供了非阻塞的方法，但是 NIO 的 IO 行为还是同步的。对于 NIO 来说，我们的业务线程是在 IO 操作准备好时，得到通知，接着就由这个线程自行进行 IO 操作，IO操作本身是同步的。查阅网上相关资料，我发现就目前来说 AIO 的应用还不是很广泛，Netty 之前也尝试使用过 AIO，不过又放弃了。




### 值传递？引用传递？
JAVA是值传递！！！
> 基本类型作为参数被传递时肯定是值传递；  
> 引用类型作为参数被传递时也是值传递，只不过“值”为对应的引用。

### static、final、关键字
[浅析Java中的final关键字 \- Matrix海子 \- 博客园](https://www.cnblogs.com/dolphin0520/p/3736238.html)  

### equals()和hashCode()
为什么重写equals()的同时还得重写hashCode()

答案：一般的地方不需要重载hashCode，只有当类需要放在HashTable、HashMap、HashSet等等hash结构的集合时才会重载hashCode，那么为什么要重载hashCode呢？就HashMap来说，好比HashMap就是一个大内存块，里面有很多小内存块，小内存块里面是一系列的对象，可以利用hashCode来查找小内存块hashCode%size(小内存块数量)，所以当equal相等时，hashCode必须相等，而且如果是object对象，必须重载hashCode和equal方法。


两者的关系：

- equals()相等的两个对象，hashcode()一定相等；
- equals()不相等的两个对象，hashcode()有可能相等。
- hashcode()不等，一定能推出equals()也不等；
- hashcode()相等，equals()可能相等，也可能不等。

### 内部类
[Java内部类详解 \- Matrix海子 \- 博客园](http://www.cnblogs.com/dolphin0520/p/3811445.html)  

静态内部类是内嵌类

静态内部类可以单独初始化: 
```
Inner i = new Outer.Inner();
```
普通内部类初始化：
```
Outer o = new Outer();
Inner i = o.new Inner();
```

### 接口、抽象类
---

[Java 8 默认方法（Default Methods） \- Ebn's Blog](http://ebnbin.com/2015/12/20/java-8-default-methods/)  


#### Java异常
[“崩溃了？不可能，我全 Catch 住了” \| Java 异常处理 \- 承香墨影 \- SegmentFault 思否](https://segmentfault.com/a/1190000017918151)  
[Java：详解Java中的异常\(Error与Exception\) \- 王晓\(Java\) \- CSDN博客](https://blog.csdn.net/qq_29229567/article/details/80773970)

#### Java能不能自己写一个类叫java.lang.System/String  
[Java能不能自己写一个类叫java\.lang\.System/String正确答案 \- tang9140的专栏 \- CSDN博客](https://blog.csdn.net/tang9140/article/details/42738433)  
[classloader 结构，是否可以自己定义一个 java\.lang\.String 类，为什么？ 双亲代理机制。 \- LiuHheng0315 \- 博客园](https://www.cnblogs.com/liuheng0315/p/7160794.html)  