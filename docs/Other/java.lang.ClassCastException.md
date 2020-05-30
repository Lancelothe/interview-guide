## 事件起因

在做一个类型转换时遇到了下面的异常：

![ClassCastException](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/ClassCastException.png)

是说不能把 Integer 类型强制转换成 String 类型。

我的测试代码大概是这个样子：

```java
public static void testClassCastException() {
  Integer i1 = Integer.valueOf(getT()); // ① 抛异常
  Integer i2 = (Integer) getT(); // ② 正常
  Integer i3 = Integer.valueOf(getT().toString()); // ③ 正常
}

private static <T> T getT() {
  return (T) new Integer(10);
}

// ①和③的不同在于Integer.valueOf()里的参数的类型，其实Integer.valueOf()方法就是需要String类型的，所以我们直接用Integer类型当然在底层是不识别的。
// ①和②的不同在于类型转换的方式，这个就引申出下面这个问题了。
```

## (String)、toString、String.valueOf 的区别

1. toString()
   toString()是在 Object 中定义的，因此，任何继承 Object 的类都具有这个方法。

 在 API 中 toString()被描述为：

 返回该对象的字符串表示。通常，toString 方法会返回一个“以文本方式表示”此对象的字符串。结果应是一个简明但易于读懂的信息表达式。建议所有子类都重写此方法。

Object 类的 toString 方法返回一个字符串，该字符串由类名（对象是该类的一个实例）、标记符“@”和此对象哈希码的无符号十六进制表示组成。换句话说，该方法返回一个字符串，它的值等于：getClass().getName()+'@'+Integer.toHexString(hashCode())
　　我们在定义一个类的时候可以重写继承自 Object 的 toString()方法，以此来表示该对象的基本信息。
　　但是，使用 toString()的对象不能为 null，否则会抛出异常 java.lang.NullPointerException。

2. String.valueOf()
   String.valueOf()解决了 toString()使用对象不能为空的问题，实际上，该方法在底层还是使用了 toString()。如下源码：

```java
public static String valueOf(Object obj) {
    return (obj == null) ? "null" : obj.toString();
}
```

值得注意的是，如果使用对象为 null，返回的结果是字符串”null”，而不是对象 null。
　　在很多时候使用 String.valueOf()比使用 toString()更能减少报错的机会，因为不用考虑是否为 null 的情况。但是，也要特别注意：if(String.valueOf(o) == null){...}这样的代码肯定就回有问题，因为永远不会得到执行。

3. (String)
   (String)区别于上面两种方法，因为它是强制转换。
   每个对象在创建的时候就已经确定了类型不能改变，所谓的强制转换只是表面上将其转换成了另一种类型，就相当于 A 被当成了 B 使用，如果 A 能够被当成 B，那一切没有问题，但是 A 做不了 B，就只能抛出异常，说我做不到。

```java
Integer o = new Integer(100);
System.out.println((String)o);
```

如上代码编译时就会报错：Cannot cast Integer to String，说明 Integer 不能通过强制转换成 String。
　　而我们一开始的代码：

```java
Object x = new Integer(0);
System.out.println((String)x);
```

 在编译时没错，运行时抛出异常。这是因为 x 在表面上是 Object，实际上是 Integer。而 Object 是可以通过强制转换成为 String 的。所以，在编译的时候，x 被当成了 Object，大家相安无事，真正运行的时候，x 被查出来是 Integer，理所当然就抛出了 ClassCastException。

## 最安全的方法：instanceof

取到的对象进行类型转换如果不知道具体会是什么类型的，可以通过`instanceof`关键字来检查改对象属于哪个类型的，再具体去进行某些业务。

> **PS：**`a instanceof b`的结果和`b.class.isInstance(a)`的结果是一致的，可以实现相同的功能，完全等价。

## 为什么在 Java 里不能将 Integer 强制转换成 String

因为 `String` 和 `Integer` 不是在同一个对象阶层。

```
      Object
     /      \
    /        \
String     Integer
```

当你尝试强制转换时，仅仅会在同一个对象阶层转换。比如：

```
     Object
     /
    /
   A
  /
/
B
```

在这种情况，`(A)objB` 或者 `(Object)objB` 或者 `(Object)objA` 可以进行转换。

正如其他人已经提到，将`integer`转换成`String`可以使用以下方法：

基本类型的整型时使用：`String.valueOf(integer)`或者`Integer.toString(integer)` 来转换成`String`。
`Integer`对象型时使用：`Integer.toString()`转换成`String`

参考：

[翻译|为什么在 Java 里不能将 Integer 强制转换成 String \| PostgreSQL DBA](https://dreamer-yzy.github.io/2014/12/22/-%E7%BF%BB%E8%AF%91-%E4%B8%BA%E4%BB%80%E4%B9%88%E5%9C%A8Java%E9%87%8C%E4%B8%8D%E8%83%BD%E5%B0%86Integer%E5%BC%BA%E5%88%B6%E8%BD%AC%E6%8D%A2%E6%88%90String/)

[java\.toString\(\) ,\(String\),String\.valueOf 的区别 \_java_springk 的专栏\-CSDN 博客](https://blog.csdn.net/springk/article/details/6414017)

---

<div style="text-align:center">求关注、分享、在看！！！
  你的支持是我创作最大的动力。</div>

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/qrcode_for_hbh.jpg)