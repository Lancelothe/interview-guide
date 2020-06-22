### ProcessorSlotChain

Sentinel 的核心骨架，将不同的 Slot 按照顺序串在一起（责任链模式），从而将不同的功能（限流、降级、系统保护）组合在一起。slot chain 其实可以分为两部分：统计数据构建部分（statistic）和判断部分（rule checking）。核心结构：

![sentinel-slot-chain](https://raw.githubusercontent.com/sentinel-group/sentinel-website/master/docs/zh-cn/img/sentinel-slot-chain-architecture.png)



sentinel主要是基于7种不同的Slot形成了一个链表，每个Slot都各司其职，自己做完分内的事之后，会把请求传递给下一个Slot，直到在某一个Slot中命中规则后抛出BlockException而终止。

前三个Slot负责做统计，后面的Slot负责根据统计的结果结合配置的规则进行具体的控制，是Block该请求还是放行。

控制的类型也有很多可选项：根据qps、线程数、冷启动等等。

然后基于这个核心的方法，衍生出了很多其他的功能：

- 1、dashboard控制台，可以可视化的对每个连接过来的sentinel客户端 (通过发送heartbeat消息)进行控制，dashboard和客户端之间通过http协议进行通讯。
- 2、规则的持久化，通过实现DataSource接口，可以通过不同的方式对配置的规则进行持久化，默认规则是在内存中的
- 3、对主流的框架进行适配，包括servlet，dubbo，rRpc等

![7d5addbcda9ef794420dff915629684d4f9f7113](https://yqfile.alicdn.com/7d5addbcda9ef794420dff915629684d4f9f7113.png)

[限流降级神器：哨兵\(sentinel\)原理分析\-云栖社区\-阿里云](https://yq.aliyun.com/articles/652782)

[Sentinel 核心类解析 · alibaba/Sentinel Wiki](https://github.com/alibaba/Sentinel/wiki/Sentinel-%E6%A0%B8%E5%BF%83%E7%B1%BB%E8%A7%A3%E6%9E%90)

[alibaba sentinel 1\.3\.0\-GA 简述及原理\_undergrowth的专栏\-CSDN博客\_alibaba sentinel](https://blog.csdn.net/undergrowth/article/details/84637664)

[深入剖析阿里sentinel源码，看这篇就够了\_Java666999的博客\-CSDN博客\_sentinel源码分析](https://blog.csdn.net/Java666999/article/details/98996845)

[阿里Sentinel原理解析 \- 知乎](https://zhuanlan.zhihu.com/p/64786381)

[阿里限流中间件Sentinel 原理\-如何为系统设置扩展点 \- 简书](https://www.jianshu.com/p/ab93c01ff812)

