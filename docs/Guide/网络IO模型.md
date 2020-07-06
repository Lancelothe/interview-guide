## 经典的五种网络I/O模型

### 五种 I/O 模型

Richard Stevens 的《UNIX® Network Programming Volume》提到了 5 种 I/O 模型:

1. Blocking I/O (同步阻塞 I/O)
2. Nonblocking I/O（同步非阻塞 I/O）
3. I/O multiplexing（多路复用 I/O）
4. Signal driven I/O（信号驱动 I/O，实际很少用，Java 不支持）
5. Asynchronous I/O (异步 I/O)

#### Blocking I/O

在 Linux 中，默认情况下所有的 Socket 都是 blocking 的，也就是阻塞的。一个典型的读操作时，流程如图：

![](https://imgconvert.csdnimg.cn/aHR0cHM6Ly9tbWJpei5xcGljLmNuL21tYml6X2pwZy9pYm0yc2I1M2xSaHlqbDFLQXFSejZRQ3pSak5ROFhyemxHTGljN3UwSFYyMzYzYUt5TG9JeThmN2FjeWd4b1lOaWN4a3JOSHB1bTRTQ0RQaFNlRlBSSkpEdy82NDA?x-oss-process=image/format,png)

当用户进程调用了 recvfrom 这个系统调用, 这次 I/O 调用经历如下 2 个阶段:

1. 准备数据： 对于网络请求来说，很多时候数据在一开始还没有到达（比如，还没有收到一个完整的 UDP 包），这个时候 kernel 就要等待足够的数据到来。而在用户进程这边，整个进程会被阻塞。

2. 数据返回：kernel 一但等到数据准备好了，它就会将数据从 kernel 中拷贝到用户内存，然后 kernel 返回结果，用户进程才解除 block 的状态，重新运行起来。

#### Nonblocking IO

Linux 下，可以通过设置 socket 使其变为 non-blocking，也就是非阻塞。当对一个 non-blocking socket 执行读操作时，流程如图：

![](https://imgconvert.csdnimg.cn/aHR0cHM6Ly9tbWJpei5xcGljLmNuL21tYml6X2pwZy9pYm0yc2I1M2xSaHlqbDFLQXFSejZRQ3pSak5ROFhyemw0Q2E4Q2xScTVvekdOY0pqSE1pY213TUdUTXFUWEdIaWI3eWNsOUVmTnFTMnJTSjhsVVViSnU4US82NDA?x-oss-process=image/format,png)

当用户进程发出 read 操作具体过程分为如下 3 个过程：

1. 开始准备数据：如果 Kernel 中的数据还没有准备好，那么它并不会 block 用户进程，而是立刻返回一个 error。

2. 数据准备中： 从用户进程角度讲，它发起一个read操作后，并不需要等待，而是马上就得到了一个结果。用户进程判断结果是一个 error 时，它就知道数据还没有准备好，于是它可以再次发送 read 操作（重复轮训）。

3. 一旦 kernel 中的数据准备好了，并且又再次收到了用户进程的 system call，那么它马上就将数据拷贝到了用户内存，然后返回。

#### I/O multiplexing

这种 I/O 方式也可称为 event driven I/O。Linux select/epoll 的好处就在于单个 process 就可以同时处理多个网络连接的 I/O。它的基本原理就是 select/epoll 会不断的轮询所负责的所有 socket，当某个 socket 有数据到达了，就通知用户进程。流程如图：

![](https://imgconvert.csdnimg.cn/aHR0cHM6Ly9tbWJpei5xcGljLmNuL21tYml6X2pwZy9pYm0yc2I1M2xSaHlqbDFLQXFSejZRQ3pSak5ROFhyemxZakVHMUVJMm1GYjFJcTA3b0hzVm9nR0M1SnptdVBmZnVlWWd2bFF6Vkg0dVVTU1RHMXRzbncvNjQw?x-oss-process=image/format,png)

当用户进程调用了 select:

1. 整个进程会被 block，与此同时kernel 会 “监视” 所有 select 负责的 socket，当任何一个 socket 中的数据准备好了，select 就会返回。

2. 用户进程再调用 read 操作，将数据从 kernel 拷贝到用户进程。这时和 blocking I/O 的图其实并没有太大的不同，事实上，还更差一些。因为这里需要使用两个 system call (select 和 recvfrom)，而 blocking I/O 只调用了一个 system call (recvfrom)。

3. 在 I/O multiplexing Model 中，实际中，对于每一个 socket，一般都设置成为 non-blocking，但是，如上图所示，整个用户的 process 其实是一直被 block 的。只不过 process 是被 select 这个函数 block，而不是被 socket I/O 给 block。

#### Asynchronous IO

Linux 下的 asynchronous I/O，即异步 I/O，其实用得很少（需要高版本系统支持）。它的流程如图：

当用户进程发出 read 操作具体过程：

![](https://imgconvert.csdnimg.cn/aHR0cHM6Ly9tbWJpei5xcGljLmNuL21tYml6X2pwZy9pYm0yc2I1M2xSaHlqbDFLQXFSejZRQ3pSak5ROFhyemxWQ05OMVVCU1FmbTFQTkhsSkpZdDJlR3RKN3kxeHdvTUtkZTFxZ0tlVXM0RDMydzRPV1JDVEEvNjQw?x-oss-process=image/format,png)

1. 用户进程发起 read 操作之后，并不需要等待，而是马上就得到了一个结果，立刻就可以开始去做其它的事。

2. 从 kernel 的角度，当它受到一个 asynchronous read 之后，首先它会立刻返回，所以不会对用户进程产生任何 block。然后，kernel 会等待数据准备完成，然后将数据拷贝到用户内存，当这一切都完成之后，kernel会给用户进程发送一个 signal，告诉它 read 操作完成了。

通过以上 4 种 I/O 通信模型的说明，总结一下它们各自的特点： 

- Blocking I/O 的特点就是在 I/O 执行的两个阶段都被 block 了。

- Non-blocking I/O 特点是如果 kernel 数据没准备好不需要阻塞。

- I/O multiplexing 的优势在于它用 select 可以同时处理多个 connection。（如果处理的连接数不是很高的话，使用 select/epoll 的 web server 不一定比使用 multi-threading + blocking I/O 的 web server 性能更好，可能延迟还更大。select/epoll 的优势并不是对于单个连接能处理得更快，而是在于能处理更多的连接。）

- Asynchronous IO 的特点在于整个调用过程客户端没有任何 block 状态，但是需要高版本的系统支持。
  



## Reactor模型

> Reactor 是什么？

Reactor 是一种处理模式。 Reactor 模式是处理并发 I/O 比较常见的一种模式，用于同步 I/O，中心思想是将所有要处理的IO事件注册到一个中心 I/O 多路复用器上，同时主线程/进程阻塞在多路复用器上；一旦有 I/O 事件到来或是准备就绪(文件描述符或 socket 可读、写)，多路复用器返回并将事先注册的相应 I/O 事件分发到对应的处理器中。

Reactor 也是一种实现机制。 Reactor 利用事件驱动机制实现，和普通函数调用的不同之处在于：应用程序不是主动的调用某个 API 完成处理，而是恰恰相反，Reactor 逆置了事件处理流程，应用程序需要提供相应的接口并注册到 Reactor 上，如果相应的事件发生，Reactor 将主动调用应用程序注册的接口，这些接口又称为 “回调函数”。用 “好莱坞原则” 来形容 Reactor 再合适不过了：不要打电话给我们，我们会打电话通知你。

> 为什么要使用 Reactor？

一般来说通过 I/O 复用，epoll 模式已经可以使服务器并发几十万连接的同时，维持极高 TPS，为什么还需要 Reactor 模式？原因是原生的 I/O 复用编程复杂性比较高。

一个个网络请求可能涉及到多个 I/O 请求，相比传统的单线程完整处理请求生命期的方法，I/O 复用在人的大脑思维中并不自然，因为，程序员编程中，处理请求 A 的时候，假定 A 请求必须经过多个 I/O 操作 A1-An（两次 IO 间可能间隔很长时间），每经过一次 I/O 操作，再调用 I/O 复用时，I/O 复用的调用返回里，非常可能不再有 A，而是返回了请求 B。即请求 A 会经常被请求 B 打断，处理请求 B 时，又被 C 打断。这种思维下，编程容易出错。

无论是C++还是Java编写的网络框架，大多数都是基于Reactor模型进行设计和开发，Reactor模型基于事件驱动，特别适合处理海量的I/O事件。

> Reactor模型中定义的三种角色：

- Reactor：负责监听和分配事件，将I/O事件分派给对应的Handler。新的事件包含连接建立就绪、读就绪、写就绪等。
- Acceptor：处理客户端新连接，并分派请求到处理器链中。
- Handler：将自身与事件绑定，执行非阻塞读/写任务，完成channel的读入，完成处理业务逻辑后，负责将结果写出channel。可用资源池来管理。

> Reactor处理请求的流程：

读取操作：

1. 应用程序注册读就绪事件和相关联的事件处理器
2. 事件分离器等待事件的发生
3. 当发生读就绪事件的时候，事件分离器调用第一步注册的事件处理器

写入操作类似于读取操作，只不过第一步注册的是写就绪事件。



Reactor 有三种线程模型，用户能够更加自己的环境选择适当的模型。

1. 单线程模型
2. 多线程模型（单 Reactor）
3. 多线程模型（多 Reactor)

### 单线程模式

单线程模式是最简单的 Reactor 模型。Reactor 线程是个多面手，负责多路分离套接字，Accept 新连接，并分派请求到处理器链中。该模型适用于处理器链中业务处理组件能快速完成的场景。不过这种单线程模型不能充分利用多核资源，所以实际使用的不多。

![](https://imgconvert.csdnimg.cn/aHR0cHM6Ly9tbWJpei5xcGljLmNuL21tYml6X3BuZy9pYm0yc2I1M2xSaHlqbDFLQXFSejZRQ3pSak5ROFhyemwwNHJnbmFGMjBxdlhjdXQ5WXJpY0tHamwydjRYS0xjOFByNDNQMFh2b2h6VnR0TWZpYm1wSWRUdy82NDA?x-oss-process=image/format,png)

Reactor 单线程模型使用的是一个 NIO 线程， NIO 使用的是非阻塞 I/O，所有的 I/O 操作都不会阻塞，所以一个线程可以处理多个 TCP 连接请求。

对于一些小容量应用场景，可以使用单线程模型，但是对于高负载、大并发的应用却不合适，主要原因如下：

- 一个NIO线程同时处理成百上千的链路，性能上无法支撑。即便NIO线程的CPU负荷达到100%，也无法满足海量消息的编码、解码、读取和发送；
- 当NIO线程负载过重之后，处理速度将变慢，这会导致大量客户端连接超时，超时之后往往进行重发，这更加重了NIO线程的负载，最终导致大量消息积压和处理超时，NIO线程会成为系统的性能瓶颈；
- 可靠性问题。一旦NIO线程意外跑飞，或者进入死循环，会导致整个系统通讯模块不可用，不能接收和处理外部信息，造成节点故障。



### 多线程模式(单 Reactor)

该模型在事件处理器（Handler）链部分采用了多线程（线程池），也是后端程序常用的模型。

![](https://imgconvert.csdnimg.cn/aHR0cHM6Ly9tbWJpei5xcGljLmNuL21tYml6X3BuZy9pYm0yc2I1M2xSaHlqbDFLQXFSejZRQ3pSak5ROFhyemxwSVQzWlh3aHJtdXBNNGZ1VlhFemwwcWpJQzhzZ2VLdlppY2ljSTFVeDgydmVyTFk5enZ1bVB1Zy82NDA?x-oss-process=image/format,png)

### 主从多线程模型(多 Reactor)

比起多线程单 Rector 模型，它是将 Reactor 分成两部分，mainReactor 负责监听并 Accept新连接，然后将建立的 socket 通过多路复用器（Acceptor）分派给subReactor。subReactor 负责多路分离已连接的 socket，读写网络数据；业务处理功能，其交给 worker 线程池完成。通常，subReactor 个数上可与 CPU 个数等同。


![](https://imgconvert.csdnimg.cn/aHR0cHM6Ly9tbWJpei5xcGljLmNuL21tYml6X3BuZy9pYm0yc2I1M2xSaHlqbDFLQXFSejZRQ3pSak5ROFhyemxuUm9mODJpYWVYU25yc3dxUFBKa2hSeFJ1dTRuaWJXSFVlTkczM2NQMktNbGJ1Q0tvWTZsVUVWUS82NDA?x-oss-process=image/format,png)



### Netty Reactor 实践

服务端线程模型

服务端监听线程和 I/O 线程分离，类似于 Reactor 的多线程模型，它的工作原理图如下：

![](http://ifeve.com/wp-content/uploads/2019/08/image-4.png)



服务端用户线程创建

- 创建服务端的时候实例化了 2 个 EventLoopGroup。bossGroup 线程组实际就是 Acceptor 线程池，负责处理客户端的 TCP 连接请求。workerGroup 是真正负责 I/O 读写操作的线程组。通过这里能够知道 Netty 是多 Reactor 模型。

- ServerBootstrap 类是 Netty 用于启动 NIO 的辅助类，能够方便开发。通过 group 方法将线程组传递到 ServerBootstrap 中，设置 Channel 为 NioServerSocketChannel，接着设置 NioServerSocketChannel 的 TCP 参数，最后绑定 I/O 事件处理类 ChildChannelHandler。

- 辅助类完成配置之后调用 bind 方法绑定监听端口，Netty 返回 ChannelFuture，f.channel().closeFuture().sync() 对同步阻塞的获取结果。

- 调用线程组 shutdownGracefully 优雅推出，释放资源。
  

### 优点

- 响应快，虽然 Reactor 本身依然是同步的，不必为单个同步时间所阻塞。
- 编程相对简单，可以最大程度的避免复杂的多线程及同步问题，并且避免了多线程/进程的切换开销。
- 可扩展性，通过并发编程的方式增加 Reactor 个数来充分利用 CPU 资源。
- 可复用性，Reactor 框架本身与具体事件处理逻辑无关，具有很高的复用性。

### 缺点

- 相比传统的简单模型，Reactor增加了一定的复杂性，因而有一定的门槛，调试相对复杂。
- Reactor 模式需要底层的 Synchronous Event Demultiplexer 支持，例如 Java 中的 Selector，操作系统的 select 系统调用支持。
- 单线程 Reactor 模式在 I/O 读写数据时还是在同一个线程中实现的，即使使用多 Reactor 机制的情况下，共享一个 Reactor 的 Channel 如果出现一个长时间的数据读写，会影响这个 Reactor 中其他 Channel 的相应时间，比如在大文件传输时，I/O 操作就会影响其他 Client 的相应时间，因而对这种操作，使用传统的 Thread-Per-Connection 或许是一个更好的选择，或则此时使用 Proactor 模式。

[IO设计模式：Reactor和Proactor对比 \- 大CC \- SegmentFault 思否](https://segmentfault.com/a/1190000002715832)

[Netty 线程模型 \- 简书](https://www.jianshu.com/p/6ae30cf5ae9e)

## Proactor模型

在高性能的I/O设计中，有两个著名的模型：Reactor模型和Proactor模型，其中Reactor模型用于同步I/O，而Proactor模型运用于异步I/O操作。



![io-proactor](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/io-proactor.png)

模块关系：

1. Procator Initiator负责创建Procator和Handler，并将Procator和Handler都通过Asynchronous operation processor注册到内核。
2. Asynchronous operation processor负责处理注册请求，并完成IO操作。完成IO操作后会通知procator。
3. procator根据不同的事件类型回调不同的handler进行业务处理。handler完成业务处理，handler也可以注册新的handler到内核进程。

读取操作：

1. 应用程序初始化一个异步读取操作，然后注册相应的事件处理器，此时事件处理器不关注读取就绪事件，而是关注读取完成事件，这是区别于Reactor的关键。
2. 事件分离器等待读取操作完成事件
3. 在事件分离器等待读取操作完成的时候，操作系统调用内核线程完成读取操作，并将读取的内容放入用户传递过来的缓存区中。这也是区别于Reactor的一点，Proactor中，应用程序需要传递缓存区。
4. 事件分离器捕获到读取完成事件后，激活应用程序注册的事件处理器，事件处理器直接从缓存区读取数据，而不需要进行实际的读取操作。

> 异步IO都是操作系统负责将数据读写到应用传递进来的缓冲区供应用程序操作。

Proactor中写入操作和读取操作，**只不过感兴趣的事件是写入完成事件**。

Proactor有如下缺点：

1. 编程复杂性，由于异步操作流程的事件的初始化和事件完成在时间和空间上都是相互分离的，因此开发异步应用程序更加复杂。应用程序还可能因为反向的流控而变得更加难以Debug；
2. 内存使用，缓冲区在读或写操作的时间段内必须保持住，可能造成持续的不确定性，并且每个并发操作都要求有独立的缓存，相比Reactor模型，在Socket已经准备好读或写前，是不要求开辟缓存的；
3. 操作系统支持，Windows下通过IOCP实现了真正的异步 I/O，而在Linux系统下，Linux2.6才引入，并且异步I/O使用epoll实现的，所以还不完善。





## Netty

[Netty面试题和解答\(一\) \- 编码砖家 \- 博客园](https://www.cnblogs.com/xiaoyangjia/p/11526197.html)





参考

[谈谈Netty的线程模型 \| 并发编程网 – ifeve\.com](http://ifeve.com/%E8%B0%88%E8%B0%88netty%E7%9A%84%E7%BA%BF%E7%A8%8B%E6%A8%A1%E5%9E%8B/)

[探秘Netty1：从IO模型谈到Reactor、Proactor线程模型\_程序员书单\-CSDN博客\_netty reactor proactor](https://blog.csdn.net/a724888/article/details/80741828)

[彻底搞懂Reactor模型和Proactor模型 \- 简书](https://www.jianshu.com/p/e108ecd76924)

[彻底搞懂 netty 线程模型 \- luoxn28 \- 博客园](https://www.cnblogs.com/luoxn28/p/11875340.html)