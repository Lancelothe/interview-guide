## 事件

### 文件事件

Redis基于`Reactor`模式开发了自己的网络事件处理器：这个处理器被称为文件事件处理器（file event handler）:

- 文件时间处理器使用`I/O多路复用`程序来同时监听多个套接字，并根据套接字目前执行的任务来为套接字关联不同的事件处理器。
- 当被监听的套接字准备好执行连接应答（accept）、读取（read）、写入（write）、关闭（close）等操作时，与操作相对应的文件事件就会产生，这时文件事件处理器就会调用套接字之前关联好的事件处理器来处理这些事件。

#### 文件时间处理器的构成

![redis-event-dispatcher](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/redis-event-dispatcher.png)

文件事件是对套接字操作的抽象， 每当一个套接字准备好执行连接应答（accept）、写入、读取、关闭等操作时， 就会产生一个文件事件。 因为一个服务器通常会连接多个套接字， 所以多个文件事件有可能会并发地出现。

I/O 多路复用程序负责监听多个套接字， 并向文件事件分派器传送那些产生了事件的套接字。

尽管多个文件事件可能会并发地出现， 但 I/O 多路复用程序总是会将所有产生事件的套接字都入队到一个队列里面， 然后通过这个队列， 以有序（sequentially）、同步（synchronously）、每次一个套接字的方式向文件事件分派器传送套接字： 当上一个套接字产生的事件被处理完毕之后（该套接字为事件所关联的事件处理器执行完毕）， I/O 多路复用程序才会继续向文件事件分派器传送下一个套接字， 如图 IMAGE_DISPATCH_EVENT_VIA_QUEUE 。

![redis-event-queue](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/redis-event-queue.png)

文件事件分派器接收 I/O 多路复用程序传来的套接字， 并根据套接字产生的事件的类型， 调用相应的事件处理器。

服务器会为执行不同任务的套接字关联不同的事件处理器， 这些处理器是一个个函数， 它们定义了某个事件发生时， 服务器应该执行的动作。

#### I/O多路复用程序的实现

Redis 的 I/O 多路复用程序的所有功能都是通过包装常见的 `select` 、 `epoll` 、 `evport` 和 `kqueue` 这些 I/O 多路复用函数库来实现的， 每个 I/O 多路复用函数库在 Redis 源码中都对应一个单独的文件， 比如 `ae_select.c` 、 `ae_epoll.c` 、 `ae_kqueue.c` ， 诸如此类。

因为 Redis 为每个 I/O 多路复用函数库都实现了相同的 API ， 所以 I/O 多路复用程序的底层实现是可以互换的， 如图 IMAGE_MULTI_LIB 所示。

![redis-multi-lib](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/redis-multi-lib.png)

Redis 在 I/O 多路复用程序的实现源码中用 `#include` 宏定义了相应的规则， 程序会在编译时自动选择系统中性能最高的 I/O 多路复用函数库来作为 Redis 的 I/O 多路复用程序的底层实现：

```c
/* Include the best multiplexing layer supported by this system.
 * The following should be ordered by performances, descending. */
#ifdef HAVE_EVPORT
#include "ae_evport.c"
#else
    #ifdef HAVE_EPOLL
    #include "ae_epoll.c"
    #else
        #ifdef HAVE_KQUEUE
        #include "ae_kqueue.c"
        #else
        #include "ae_select.c"
        #endif
    #endif
#endif
```

#### 文件事件的处理器

在这些事件处理器里面， 服务器最常用的要数与客户端进行通信的连接应答处理器、 命令请求处理器和命令回复处理器。

![redis-command-progress](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/redis-command-progress.png)

### 时间事件

- 定时事件：让一段程序在指定的时间之后执行一次。
- 周期性事件：让一段程度每隔指定时间执行一次。

一个时间事件主要由以下三个属性组成：

- id: 服务器为时间事件创建的全局唯一ID，从小到大递增。
- when: 毫秒精度的UNIX时间戳，记录了时间事件达到时间。
- timeProc: 时间事件处理器，一个函数。当时间事件到达时，服务器就会调用相应的处理器来处理事件。

一个时间事件是定时的还是周期性的取决于时间事件处理器的返回值，返回ae.h/AE_NOMORE是定时事件。

目前版本的Redis只是用周期性事件，而没有使用定时事件。

#### 实现

服务器将所有时间事件放在一个无序链表里，每当时间事件执行器运行时，遍历整个链表，查找所有已达到的时间时间，并调用相应的事件处理器。

![redis-time-events](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/redis-time-events.png)

无序是按照ID倒序排列，新来的事件插入表头，并不按照when字段的时间排序。

> 无序链表并不影响时间事件处理器的性能：目前版本中，正常模式下只有serverCron一个时间事件，而在benchmark模式下，也只使用了两个时间事件。

#### 时间事件应用实例：serverCron函数

持续运行的Redis服务器需要定期对自身的资源和状态进行检查和调整，从而确保服务器可以长期、稳定地运行，这些定期操作由redis.c/serverCron函数负责执行，它的主要工作包括：

- 更新服务器的各类统计信息，比如时间、内存占用、数据库占用情况等；
- 清理数据库中的过期键值对；
- 关闭和清理连接失效的客户端；
- 尝试进行AOF或RDB持久化操作；
- 如果服务器是主服务器，那么对从服务器进行定期同步；
- 如果处于集群模式，对集群进行定期同步和连接测试；

在Redis2.6版本，服务器默认规定serverCron每秒运行10次，平均每间隔100毫秒运行一次。

从Redis2.8版本开始，用户可以通过修改hz选项来调整每秒运行的次数。

---

## 客户端

Redis服务器用一个链表记录了所有和服务器连接的客户端的信息，遍历链表就可以查找某个指定的客户端。

### 客户端属性

客户端属性分两类：一类是通用的属性，很少和特定功能相关，无论执行什么都需要用到的，另一类就是和特定功能相关的属性。

## 服务端

