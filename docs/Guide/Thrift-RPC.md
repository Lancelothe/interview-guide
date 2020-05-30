## Thrift Server端的几种工作模式

- **TSimpleServer模式**（单线程阻塞模式）

  采用最简单的阻塞IO，只有一个工作线程，循环监听新请求的到来并完成对请求的处理，一次只能接收和处理一个socket连接。

- **TNonblockingServer**（单线程NIO模式）

  单线程工作，采用NIO的方式，所有的socket都被注册到selector中，在一个线程中通过seletor循环监控所有的socket。 优点：IO多路复用，非阻塞IO 缺点：单线程，请求任务一个一个执行。

- **THsHaServer**（半同步半异步模式）

  TNonblockingServer类的子类，NIO方式， 主线程负责监听，线程池负责处理任务 缺点：新连接请求不能被及时接受。

- **TThreadPoolServer**

  阻塞socket方式工作，主线程负责阻塞式监听，业务处理交由一个线程池来处理。

- **TThreadedSelectorServer**

  目前Thrift提供的最高级的模式，专门的线程AcceptThread用于处理新连接请求，及时响应大量并发连接请求，负载均衡器分散到多个SelectorThread线程中来完成。

## Thrift支持哪些通信协议格式

传输协议上总体上划分为文本(text)和二进制(binary)传输协议

1. TBinaryProtocol – 二进制编码格式进行数据传输。
2. TCompactProtocol – 这种协议非常有效的，使用Variable-Length Quantity (VLQ) 编码对数据进行压缩。高效和压缩的二进制格式
3. TJSONProtocol – 使用JSON的数据编码协议进行数据传输。
4. TSimpleJSONProtocol – 这种节约只提供JSON只写的协议，适用于通过脚本语言解析
5. TDebugProtocol – 在开发的过程中帮助开发人员调试用的，以文本的形式展现方便阅读。

## Thrift RPC的工作原理

Thrift框架的远程过程调用的工作过程如下：

1. 通过IDL定义一个接口的thrift文件，然后通过thrift的多语言编译功能，将接口定义的thrift文件翻译成对应的语言版本的接口文件；
2. Thrift生成的特定语言的接口文件中包括客户端部分和服务器部分；
3. 客户端通过接口文件中的客户端部分生成一个Client对象，这个客户端对象中包含所有接口函数的存根实现，然后用户代码就可以通过这个Client对象来调用thrift文件中的那些接口函数了，但是，客户端调用接口函数时实际上调用的是接口函数的本地存根实现，如图箭头1所示；
4. 接口函数的存根实现将调用请求发送给thrift服务器端，然后thrift服务器根据调用的函数名和函数参数，调用实际的实现函数来完成具体的操作，如图箭头2所示；
5. Thrift服务器在完成处理之后，将函数的返回值发送给调用的Client对象；如图箭头3所示；

6. Thrift的Client对象将函数的返回值再交付给用户的调用函数，如图箭头4所示；
   ![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/thrift-rpc.png)

   [由浅入深了解Thrift（二）——Thrift工作原理\_网络\_逍遥子曰：\-CSDN博客](https://blog.csdn.net/houjixin/article/details/42779835)

   

