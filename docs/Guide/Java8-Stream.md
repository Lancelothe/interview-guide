## 原理分析





## Java Collection API和Stream API的区别

我们只是说新的Stream API和java现有的集合API的行为差不多：他们都能够访问数据项目中的序列。不过现在最好记得，**Collection主要是为了存储和访问数据，而Stream则主要用于描述对数据的计算。**这里的关键点在于，Stream允许并提倡并行处理一个Stream中的元素。虽然可能乍看上去有点怪，但筛选一个Collection的最快方法常常是将其转换成Stream，进行并行处理，然后再转换成List。



**不错的Java8笔记博客：**

[Java8\-20\-lambda 设计模式 \| Echo Blog](https://houbb.github.io/2019/02/27/java8-20-lambda-02-pattern)

