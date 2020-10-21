参考：https://blog.csdn.net/weixin_43124279/article/details/105605098    

​    我们经常会遇到面试官会问：为什么不建议在for循环中使用"+"进行字符串拼接，而是建议使用StringBuilder 的 append 方法？并且idea也会提示string concatenation ‘+=’ in loop。

## 以代码来讲解

```java
String str="";
for(int i=0;i<10;i++){
	str+="a";
}
str=str+"a"+"b";
12345
```

使用jad反编译以后

> [jad使用指南](https://blog.csdn.net/weixin_43124279/article/details/105605421)

```java
String str = "";
for(int i = 0; i < 10; i++)
	str = (new StringBuilder()).append(str).append("a").toString();
str = (new StringBuilder()).append(str).append("a").append("b").toString();
1234
```

我们可以看到，反编译后的代码，在for循环中，每次都是new了一个StringBuilder，然后再把String转成StringBuilder，再进行append。
而频繁的新建对象当然要耗费很多时间了，不仅仅会耗费时间，频繁的创建对象，还会造成内存资源的浪费。
我为什么在for循环外写`str=str+"a"+"b";`，是为了告诉大家，不是一个`”+“`就创建一个`StringBuilder`

## 性能测试

这时我想到了时间开销对比，我推测前者的运行时间比后者少，于是有了下面的测试代码

```java
@Test
public void mainTest(){
    long startTime1 = System.currentTimeMillis();
    StringBuilder str1 = new StringBuilder("start");
    for (int i = 0;i < 100000; i++){
        str1.append(i);
    }
    long endTime1 = System.currentTimeMillis();
    long time1 = endTime1 - startTime1;
    System.out.println("StringBuilder所花时间：" + time1);
    String str2 = "start";
    long startTime2 = System.currentTimeMillis();
    for (int i = 0;i < 100000; i++){
        str2 = str2 + i;
    }
    long endTime2 = System.currentTimeMillis();
    long time2 = endTime2 - startTime2;
    System.out.println("String++所花时间：" + time2);

}
------------------------------------------------------
StringBuilder所花时间：8
String++所花时间：11866
-------------------------------------------------------
```

显而易见。

## 结论：

1. 如果不是在循环体中进行字符串拼接的话，直接使用+就好了。
2. 如果在并发场景中进行字符串拼接的话，要使用StringBuffer来代替StringBuilder。



## 再谈StringBuilder的扩容机制

参考：https://www.cnblogs.com/acode/p/7146508.html

创建StringBuilder对象时，如果不指定长度的话，默认是16，但是在扩容方法里却是扩大了原长度的2倍加2.

```java
private int newCapacity(int minCapacity) {
    // overflow-conscious code
    int newCapacity = (value.length << 1) + 2;
    if (newCapacity - minCapacity < 0) {
        newCapacity = minCapacity;
    }
    return (newCapacity <= 0 || MAX_ARRAY_SIZE - newCapacity < 0)
        ? hugeCapacity(minCapacity)
        : newCapacity;
}
```

这个加2是什么意思呢？

在网上找了半天资料，然后在知乎上找到了一个合理的回答：在使用StringBuilder的时候，append()之后，我们一般会在后面在加上一个分隔符，例如逗号，也就是再加上一个char，而char在java中占2个字节，避免了因为添加分隔符而再次引起扩容。不得不佩服JDK开发者的高瞻远瞩！

参考资料

> [java扩容算法是怎么得到的？](https://www.zhihu.com/question/33067955)