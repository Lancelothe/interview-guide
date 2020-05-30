## 类加载机制

### 类加载的过程

类的个生命周期如下图：

![img](https://upload-images.jianshu.io/upload_images/14923529-ac753500687cf9d2.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
为支持运行时绑定，解析过程在某些情况下可在初始化之后再开始，除解析过程外的其他加载过程必须按照如图顺序开始。

##### 加载

1. 通过全限定类名来获取定义此类的二进制字节流。
2. 将这个字节流所代表的静态存储结构转化为方法区的运行时数据结构。
3. 在内存中生成一个代表这个类的 java.lang.Class 对象，作为方法区这个类的各种数据的访问入口。

##### 验证

验证是连接阶段的第一步，这一阶段的目的是为了确保 Class 文件的字节流中包含的信息符合当前虚拟机的要求，并且不会危害虚拟机自身的安全。

1. 文件格式验证：如是否以魔数 0xCAFEBABE 开头、主、次版本号是否在当前虚拟机处理范围之内、常量合理性验证等。
   此阶段保证输入的字节流能正确地解析并存储于方法区之内，格式上符合描述一个 Java类型信息的要求。
2. 元数据验证：是否存在父类，父类的继承链是否正确，抽象类是否实现了其父类或接口之中要求实现的所有方法，字段、方法是否与父类产生矛盾等。
   第二阶段，保证不存在不符合 Java 语言规范的元数据信息。
3. 字节码验证：通过数据流和控制流分析，确定程序语义是合法的、符合逻辑的。例如保证跳转指令不会跳转到方法体以外的字节码指令上。
4. 符号引用验证：在解析阶段中发生，保证可以将符号引用转化为直接引用。

可以考虑使用 `-Xverify:none` 参数来关闭大部分的类验证措施，以缩短虚拟机类加载的时间。

##### 准备

为**类变量**分配内存并设置类变量初始值，这些变量所使用的内存都将在方法区中进行分配。

1. 这时候进行内存分配的仅包括类变量（static），而不包括实例变量，实例变量会在对象实例化时随着对象一块分配在 Java 堆中。
2. 这里所设置的初始值"通常情况"下是数据类型默认的零值（如0、0L、null、false等），比如我们定义了`public static int value=111` ，那么 value 变量在准备阶段的初始值就是 0 而不是111（初始化阶段才会赋值）。特殊情况：比如给 value 变量加上了 fianl 关键字`public static final int value=111` ，那么准备阶段 value 的值就被赋值为 111。

##### 解析

虚拟机将常量池内的符号引用替换为直接引用的过程。
解析动作主要针对类或接口、字段、类方法、接口方法、方法类型、方法句柄和调用点限定符 7 类符号引用进行。

##### 初始化

到初始化阶段，才真正开始执行类中定义的 Java 程序代码，此阶段是执行 `()` 方法的过程。

`()` 方法是由编译器按语句在源文件中出现的顺序，依次自动收集类中的所有**类变量**的赋值动作和静态代码块中的语句合并产生的。（不包括构造器中的语句。构造器是初始化对象的，类加载完成后，创建对象时候将调用的 `()` 方法来初始化对象）

静态语句块中只能访问到定义在静态语句块之前的变量，定义在它之后的变量，在前面的静态语句块可以赋值，但是不能访问，如下程序：

```
Copypublic class Test {
    static {
        // 给变量赋值可以正常编译通过
        i = 0;
        // 这句编译器会提示"非法向前引用"
        System.out.println(i);
    }

    static int i = 1;
}
```

`()` 不需要显式调用父类（接口除外，接口不需要调用父接口的初始化方法，只有使用到父接口中的静态变量时才需要调用）的初始化方法 `()`，虚拟机会保证在子类的 `()` 方法执行之前，父类的 `()` 方法已经执行完毕，也就意味着父类中定义的静态语句块要优先于子类的变量赋值操作。

`()` 方法对于类或接口来说并不是必需的，如果一个类中没有静态语句块，也没有对变量的赋值操作，那么编译器可以不为这个类生成 `()` 方法。

虚拟机会保证一个类的 `()` 方法在多线程环境中被正确地加锁、同步，如果多个线程同时去初始化一个类，那么只会有一个线程去执行这个类的 `()` 方法，其他线程都需要阻塞等待，直到活动线程执行 `()` 方法完毕。

### 类加载的时机

对于初始化阶段，虚拟机规范规定了有且只有 5 种情况必须立即对类进行“初始化”（而加载、验证、准备自然需要在此之前开始）：

1. 遇到new、getstatic 和 putstatic 或 invokestatic 这4条字节码指令时，如果类没有进行过初始化，则需要先触发其初始化。对应场景是：使用 new 实例化对象、读取或设置一个类的静态字段（被 final 修饰、已在编译期把结果放入常量池的静态字段除外）、以及调用一个类的静态方法。
2. 对类进行反射调用的时候，如果类没有进行过初始化，则需要先触发其初始化。
3. 当初始化类的父类还没有进行过初始化，则需要先触发其父类的初始化。（而一个接口在初始化时，并不要求其父接口全部都完成了初始化）
4. 虚拟机启动时，用户需要指定一个要执行的主类（包含 main() 方法的那个类），
   虚拟机会先初始化这个主类。

> 1. 当使用 JDK 1.7 的动态语言支持时，如果一个 java.lang.invoke.MethodHandle 实例最后的解析结果 REF_getStatic、REF_putStatic、REF_invokeStatic 的方法句柄，并且这个方法句柄所对应的类没有进行过初始化，则需要先触发其初始化。

第5种情况，我暂时看不懂。

以上这 5 种场景中的行为称为对一个类进行主动引用。除此之外，所有引用类的方式都不会触发初始化，称为被动引用，例如：

1. 通过子类引用父类的静态字段，不会导致子类初始化。
2. 通过数组定义来引用类，不会触发此类的初始化。`MyClass[] cs = new MyClass[10];`
3. 常量在编译阶段会存入调用类的常量池中，本质上并没有直接引用到定义常量的类，因此不会触发定义常量的类的初始化。



## 类加载器

把实现类加载阶段中的“通过一个类的全限定名来获取描述此类的二进制字节流”这个动作的代码模块称为“类加载器”。

将 class 文件二进制数据放入方法区内，然后在堆内（heap）创建一个 java.lang.Class 对象，Class 对象封装了类在方法区内的数据结构，并且向开发者提供了访问方法区内的数据结构的接口。

目前类加载器却在类层次划分、OSGi、热部署、代码加密等领域非常重要，我们运行任何一个 Java 程序都会涉及到类加载器。

### 类的唯一性和类加载器

对于任意一个类，都需要由加载它的类加载器和这个类本身一同确立其在Java虚拟机中的唯一性。

即使两个类来源于同一个 Class 文件，被同一个虚拟机加载，只要加载它们的类加载器不同，那这两个类也不相等。
这里所指的“相等”，包括代表类的 Class 对象的 equals() 方法、 isAssignableFrom() 方法、isInstance() 方法的返回结果，也包括使用 instanceof 关键字做对象所属关系判定等情况。

### [类加载器](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/类加载器?id=类加载器总结)

JVM 中内置了三个重要的 ClassLoader，除了 BootstrapClassLoader 其他类加载器均由 Java 实现且全部继承自`java.lang.ClassLoader`：

1. **BootstrapClassLoader(启动类加载器)** ：最顶层的加载类，由C++实现，负责加载 `%JAVA_HOME%/lib`目录下的jar包和类或者或被 `-Xbootclasspath`参数指定的路径中的所有类。
2. **ExtensionClassLoader(扩展类加载器)** ：主要负责加载目录 `%JRE_HOME%/lib/ext` 目录下的jar包和类，或被 `java.ext.dirs` 系统变量所指定的路径下的jar包。
3. **AppClassLoader(应用程序类加载器)** :面向我们用户的加载器，负责加载当前应用classpath下的所有jar包和类。

### [自定义类加载器](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/类加载器?id=自定义类加载器)

除了 `BootstrapClassLoader` 其他类加载器均由 Java 实现且全部继承自`java.lang.ClassLoader`。如果我们要自定义自己的类加载器，很明显需要继承 `ClassLoader`。

### [双亲委派模型介绍](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/类加载器?id=双亲委派模型介绍)

每一个类都有一个对应它的类加载器。系统中的 ClassLoder 在协同工作的时候会默认使用 **双亲委派模型** 。即在类加载的时候，系统会首先判断当前类是否被加载过。已经被加载的类会直接返回，否则才会尝试加载。加载的时候，首先会把该请求委派该父类加载器的 `loadClass()` 处理，因此所有的请求最终都应该传送到顶层的启动类加载器 `BootstrapClassLoader` 中。当父类加载器无法处理时，才由自己来处理。当父类加载器为null时，会使用启动类加载器 `BootstrapClassLoader` 作为父类加载器。

![ClassLoader](https://my-blog-to-use.oss-cn-beijing.aliyuncs.com/2019-6/classloader_WPS%E5%9B%BE%E7%89%87.png)

每个类加载都有一个父类加载器，我们通过下面的程序来验证。

```java
public class ClassLoaderDemo {
    public static void main(String[] args) {
        System.out.println("ClassLodarDemo's ClassLoader is " + ClassLoaderDemo.class.getClassLoader());
        System.out.println("The Parent of ClassLodarDemo's ClassLoader is " + ClassLoaderDemo.class.getClassLoader().getParent());
        System.out.println("The GrandParent of ClassLodarDemo's ClassLoader is " + ClassLoaderDemo.class.getClassLoader().getParent().getParent());
    }
}
```

Output

```
ClassLodarDemo's ClassLoader is sun.misc.Launcher$AppClassLoader@18b4aac2
The Parent of ClassLodarDemo's ClassLoader is sun.misc.Launcher$ExtClassLoader@1b6d3586
The GrandParent of ClassLodarDemo's ClassLoader is null
```

`AppClassLoader`的父类加载器为`ExtClassLoader` `ExtClassLoader`的父类加载器为null，**null并不代表`ExtClassLoader`没有父类加载器，而是 `BootstrapClassLoader`** 。

其实这个双亲翻译的容易让别人误解，我们一般理解的双亲都是父母，这里的双亲更多地表达的是“父母这一辈”的人而已，并不是说真的有一个 Mother ClassLoader 和一个 Father ClassLoader 。另外，类加载器之间的“父子”关系也不是通过继承来体现的，是由“优先级”来决定。官方API文档对这部分的描述如下:

> The Java platform uses a delegation model for loading classes. **The basic idea is that every class loader has a "parent" class loader.** When loading a class, a class loader first "delegates" the search for the class to its parent class loader before attempting to find the class itself.

### [双亲委派模型实现源码分析](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/类加载器?id=双亲委派模型实现源码分析)

双亲委派模型的实现代码非常简单，逻辑非常清晰，都集中在 `java.lang.ClassLoader` 的 `loadClass()` 中，相关代码如下所示。

```java
private final ClassLoader parent; 
protected Class<?> loadClass(String name, boolean resolve)
        throws ClassNotFoundException
    {
        synchronized (getClassLoadingLock(name)) {
            // 首先，检查请求的类是否已经被加载过
            Class<?> c = findLoadedClass(name);
            if (c == null) {
                long t0 = System.nanoTime();
                try {
                    if (parent != null) {//父加载器不为空，调用父加载器loadClass()方法处理
                        c = parent.loadClass(name, false);
                    } else {//父加载器为空，使用启动类加载器 BootstrapClassLoader 加载
                        c = findBootstrapClassOrNull(name);
                    }
                } catch (ClassNotFoundException e) {
                   //抛出异常说明父类加载器无法完成加载请求
                }

                if (c == null) {
                    long t1 = System.nanoTime();
                    //自己尝试加载
                    c = findClass(name);

                    // this is the defining class loader; record the stats
                    sun.misc.PerfCounter.getParentDelegationTime().addTime(t1 - t0);
                    sun.misc.PerfCounter.getFindClassTime().addElapsedTimeFrom(t1);
                    sun.misc.PerfCounter.getFindClasses().increment();
                }
            }
            if (resolve) {
                resolveClass(c);
            }
            return c;
        }
    }
```

### [双亲委派模型的好处](https://snailclimb.gitee.io/javaguide/#/docs/java/jvm/类加载器?id=双亲委派模型的好处)

双亲委派模型保证了Java程序的稳定运行，可以避免类的重复加载（JVM 区分不同类的方式不仅仅根据类名，相同的类文件被不同的类加载器加载产生的是两个不同的类），也保证了 Java 的核心 API 不被篡改。如果没有使用双亲委派模型，而是每个类加载器加载自己的话就会出现一些问题，比如我们编写一个称为 `java.lang.Object` 类的话，那么程序运行的时候，系统就会出现多个不同的 `Object` 类。

## new一个对象过程中发生了什么？

1. **确认类元信息是否存在。**当 JVM 接收到 new 指令时，首先在 metaspace 内检查需要创建的类元信息是否存在。 若不存在，那么在双亲委派模式下，使用当前类加载器以 ClassLoader + 包名＋类名为 Key 进行查找对应的 class 文件。 如果没有找到文件，则抛出 ClassNotFoundException 异常 ， 如果找到，则进行类加载（加载 - 验证 - 准备 - 解析 - 初始化），并生成对应的 Class 类对象。
2. **分配对象内存。** 首先计算对象占用空间大小，如果实例成员变量是引用变量，仅分配引用变量空间即可，即 4 个字节大小，接着在堆中划分—块内存给新对象。 在分配内存空间时，需要进行同步操作，比如采用 CAS (Compare And Swap) 失败重试、 区域加锁等方式保证分配操作的原子性。
3. **设定默认值。** 成员变量值都需要设定为默认值， 即各种不同形式的零值。
4. **设置对象头。**设置新对象的哈希码、 GC 信息、锁信息、对象所属的类元信息等。这个过程的具体设置方式取决于 JVM 实现。
5. **执行 init 方法。** 初始化成员变量，执行实例化代码块，调用类的构造方法，并把堆内对象的首地址赋值给引用变量。

[深入理解Java类加载 \- czwbig \- 博客园](https://www.cnblogs.com/czwbig/p/11127222.html)



## 类的热加载

有两种用的比较多的方法，1.是自定义类加载器；2.JDK动态代理；

### 自定义类加载器

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/Java类热加载思路.png)

1. 创建一个自定义的 ClassLoader 对象，加载类的步骤不遵守双亲委派模型，而是直接加载。
2. 使用刚刚创建的类加载器加载指定的类。
3. 得到刚刚的Class 对象，使用反射创建对象，并调用对象的 operation 方法。

为什么间隔20秒呢？因为我们要在启动之后，修改类，并重新编译。因此需要20秒时间。



### JDK动态代理（代表：阿里的Arthas的jad/mc/redefine一条龙）

**实现原理是：**

1.绑定pid获得虚拟机对象，然后通过虚拟机加载代理jar包，这样就调用到agentmain，获取得到Instrumentation

2.基于Instrumentation接口可以实现JDK的代理机制，从而实现对类进行动态重新定义。

注意：com.sun.tools.attach.VirtualMachine的jar包是 jdk下lib中的tools.jar，所以项目中要引用到这个jar包，而且因为涉及到底层虚拟机，windows和linux机器这个jar不同

 

因此，整个流程就是：

1.项目中引用 jdk/lib/tools.jar，否则无法使用VirtualMachine类

2.项目中引用 javaagent.jar ，它提供了agentmain接口

3.代码实现动态增加JDK代理

#### Arthas的jad/mc/redefine一条龙

Arthas里 `jad`/`mc`/`redefine` 一条龙来线上热更新代码，非常强大，但也很危险，需要做好权限管理。

比如，线上应用启动帐号是 admin，当用户可以切换到admin，那么

- 用户可以修改，获取到应用的任意内存值（不管是否java应用）
- 用户可以attach jvm
- attach jvm之后，利用jvm本身的api可以redefine class

所以：

- 应用的安全主要靠用户权限本身的管理
- Arthas主要是让jvm redefine更容易了。用户也可以利用其它工具达到同样的效果



参考

[探秘 Java 热部署 \- 简书](https://www.jianshu.com/p/731bc8293365)

[Java之——类热加载\_Java\_冰河的专栏\-CSDN博客](https://blog.csdn.net/l1028386804/article/details/53453287)

[JAVA代码热部署，在线不停服动态更新\_Java\_坦GA的博客\-CSDN博客](https://blog.csdn.net/tanga842428/article/details/79694710)

[手把手教你实现热更新功能，带你了解 Arthas 热更新背后的原理 \- 程序通事](https://studyidea.cn/java-hotswap#toc_h2_0)

