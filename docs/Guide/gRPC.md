  GRPC是google开源的一个高性能、跨语言的RPC框架，基于HTTP2协议，基于protobuf 3.x，基于Netty 4.x +。GRPC与thrift、avro-rpc等其实在总体原理上并没有太大的区别，简而言之GRPC并没有太多突破性的创新。（如下描述，均基于JAVA语言的实现）

  对于开发者而言：

  1）需要使用protobuf定义接口，即.proto文件

  2）然后使用compile工具生成特定语言的执行代码，比如JAVA、C/C++、Python等。类似于thrift，为了解决跨语言问题。

  3）启动一个Server端，server端通过侦听指定的port，来等待Client链接请求，通常使用Netty来构建，GRPC内置了Netty的支持。

  4）启动一个或者多个Client端，Client也是基于Netty，Client通过与Server建立TCP长链接，并发送请求；Request与Response均被封装成HTTP2的stream Frame，通过Netty Channel进行交互。

GRPC的缺点:

 1）GRPC尚未提供连接池

  2）尚未提供“服务发现”、“负载均衡”机制

  3）因为基于HTTP2，绝大部多数HTTP Server、Nginx都尚不支持，即Nginx不能将GRPC请求作为HTTP请求来负载均衡，而是作为普通的TCP请求。（nginx将会在1.9版本支持）

  4）GRPC尚不成熟，易用性还不是很理想；就本人而言，我还是希望GRPC能够像hessian一样：无IDL文件，无需代码生成，接口通过HTTP表达。

  5）Spring容器尚未提供整合。



  在实际应用中，GRPC尚未完全提供连接池、服务自动发现、进程内负载均衡等高级特性，需要开发人员额外的封装；最大的问题，就是GRPC生成的接口，调用方式实在是不太便捷（JAVA），最起码与thrift相比还有差距，希望未来能够有所改进。

[GRPC原理解析 \- it610\.com](https://www.it610.com/article/5898672.htm)

[gRPC客户端创建和调用原理解析 \- 后端 \- 掘金](https://juejin.im/entry/59bb30f76fb9a00a616f1b73)

[Tags \| 搬砖工·甘罗](http://jiangew.me/tags/#grpc)

[GRpc实战及原理分析 \| grpc\-in\-action](https://liuyazong.github.io/grpc-in-action/)



