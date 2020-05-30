## RabbitMQ的结构

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/RabbitMQ.png)

- **Producer(生产者)** :生产消息的一方（邮件投递者）
- **Consumer(消费者)** :消费消息的一方（邮件收件人）

**Exchange(交换器)** 用来接收生产者发送的消息并将这些消息路由给服务器中的队列中，如果路由不到，或许会返回给 **Producer(生产者)** ，或许会被直接丢弃掉 。这里可以将RabbitMQ中的交换器看作一个简单的实体。

生产者将消息发给交换器的时候，一般会指定一个 **RoutingKey(路由键)**，用来指定这个消息的路由规则，而这个 **RoutingKey 需要与交换器类型和绑定键(BindingKey)联合使用才能最终生效**。

RabbitMQ 中通过 **Binding(绑定)** 将 **Exchange(交换器)** 与 **Queue(消息队列)** 关联起来，在绑定的时候一般会指定一个 **BindingKey(绑定建)** ,这样 RabbitMQ 就知道如何正确将消息路由到队列了,如下图所示。一个绑定就是基于路由键将交换器和消息队列连接起来的路由规则，所以可以将交换器理解成一个由绑定构成的路由表。Exchange 和 Queue 的绑定可以是多对多的关系。

四种exchange type类型**direct(默认)**，**fanout**, **topic**, 和 **headers**

   RabbitMQ常用的Exchange Type有三种：fanout、direct、topic。

- fanout（广播消息）： 把所有发送到该Exchange的消息投递到**所有**与它绑定的队列中。

- direct： 把消息投递到那些binding key与routing key**完全匹配**的队列中。

- topic： 将消息路由到binding key与routing key**模式匹配**的队列中。
- headers（不推荐）：根据发送的消息内容中的 headers 属性进行匹配

**多个消费者可以订阅同一个队列**，这时队列中的消息会被平均分摊（Round-Robin，即轮询）给多个消费者进行处理，而不是每个消费者都收到所有的消息并处理，这样避免的消息被重复消费。

**vhost:虚拟主机,一个broker里可以有多个vhost，用作不同用户的权限分离。 **

[RabbitMQ基础知识详细解读](https://mp.weixin.qq.com/s/OfxE6cx1hRTM_WkilT8uiQ)

## 如何保证消息的可靠性

- 事务机制

​    AMQP协议在建立之初就考虑到这种情况而提供了事务机制。RabbitMQ客户端中与事务机制相关的方法有三个：channel.txSelect、channel.txCommit以及channel.txRollback。但是事务会影响RabbitMQ的性能。

- 发送方确认机制（publisher confirm）

​    生产者将信道设置成confirm（确认）模式，一旦信道进入confirm模式，所有在该信道上面发布的消息都会被指派一个唯一的ID（从1开始），一旦消息被投递到所有匹配的队列之后，RabbitMQ就会发送一个确认（Basic.Ack）给生产者（包含消息的唯一ID），这就使得生产者知晓消息已经正确到达了目的地了。RabbitMQ回传给生产者的确认消息中的deliveryTag包含了确认消息的序号，此外RabbitMQ也可以设置channel.basicAck方法中的multiple参数，表示到这个序号之前的所有消息都已经得到了处理。相比之下，发送方确认机制最大的好处在于它是异步的，一旦发布一条消息，生产者应用程序就可以在等信道返回确认的同时继续发送下一条消息，当消息最终得到确认之后，生产者应用便可以通过回调方法来处理该确认消息，如果RabbitMQ因为自身内部错误导致消息丢失，就会发送一条nack（Basic.Nack）命令，生产者应用程序同样可以在回调方法中处理该nack命令。

​    事务机制和publisher confirm机制确保的是消息能够正确的发送至RabbitMQ，**这里的“发送至RabbitMQ”的含义是指消息被正确的发往至RabbitMQ的交换器，如果此交换器没有匹配的队列的话，那么消息也将会丢失**。所以在使用这两种机制的时候要确保所涉及的交换器能够有匹配的队列。更进一步的讲，发送方要配合mandatory参数或者备份交换器一起使用来提高消息传输的可靠性。

- mandatory

​    当mandatory参数设为true时，交换器无法根据自身的类型和路由键找到一个符合条件的队列的话，那么RabbitMQ会调用Basic.Return命令将消息返回给生产者。当mandatory参数设置为false时，出现上述情形的话，消息直接被丢弃。 那么生产者如何获取到没有被正确路由到合适队列的消息呢？这时候可以通过调用channel.addReturnListener来添加ReturnListener监听器实现。

​    生产者可以通过ReturnListener中返回的消息来重新投递或者其它方案来提高消息的可靠性。

- 备份交换器

​    如果你不想复杂化生产者的编程逻辑，又不想消息丢失，那么可以使用备份交换器，这样可以将未被路由的消息存储在RabbitMQ中，再在需要的时候去处理这些消息。 可以通过在声明交换器（调用channel.exchangeDeclare方法）的时候添加alternate-exchange参数来实现，也可以通过策略的方式实现。如果两者同时使用的话，前者的优先级更高，会覆盖掉Policy的设置。

### 但是消息存入队列之后的可靠性又如何保证？

- 队列、消息持久化

​    队列的持久化是通过在声明队列时将durable参数置为true实现的。

​    队列的持久化能保证其本身的元数据不会因异常情况而丢失，但是并不能保证内部所存储的消息不会丢失。要确保消息不会丢失，需要将其设置为持久化。通过将消息的投递模式（BasicProperties中的deliveryMode属性）设置为2即可实现消息的持久化。

- 镜像队列

在镜像队列中，如果主节点（master）在此特殊时间内挂掉，可以自动切换到从节点（slave），这样有效的保证了高可用性，除非整个集群都挂掉。





## 如何保证消息的不重复

- 业务端自己去重，用唯一标识的字段
- 维护一个消费过的列表



## 如何实现延迟队列

比如说常见的淘宝当下了一个订单后，订单支付时间为半个小时，如果半个小时没有支付，则关闭该订单。

### 死信队列（Dead Letter Exchanges）

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/20200315143353.png)

1. 将延迟队列（queue）在声明的时候设置参数 “ x-dead-letter-exchange ”，“ x-message-ttl “ 分别对应 死信路由器（dlx_exchange） 和 消息过期时间(比如说30分钟)。
2.  一个消息从生产者发送到延迟队列 ，在延迟队列里等待，等待30分钟后，会去绑定的死信路由（dlx_exchange）。通过死信路由的规则，走到死信队列。
3. 这时候监听死信队列的消费者就可以接收到消息，消费消息。比如说查看该订单是否支付，如果没有支付，则关闭该订单。

所以在考虑使用RabbitMQ来实现延迟任务队列的时候，需要确保业务上每个任务的延迟时间是一致的。如果遇到不同的任务类型需要不同的延时的话，需要为每一种不同延迟时间的消息建立单独的消息队列。

[RabbitMQ 延迟任务（限时订单） 原理 以及代码 实战 \- 残剑今生 \- 博客园](https://www.cnblogs.com/DBGzxx/p/10090840.html)

[SpringBoot\+RabbitMq实现延时消息队列 \- 个人文章 \- SegmentFault 思否](https://segmentfault.com/a/1190000016072908)

[使用RabbitMQ实现延迟任务 \- 简书](https://www.jianshu.com/p/e372cbbae7de)



### 双重死信队列（Retry Later）

1. 消息处理异常、客户端reject消息进入死信队列
2. 死信队列消息过期重新入队



### 消息延迟ID极限是多少？

2^32-1 = **4294967295** 毫秒 ≈ 49.7天





