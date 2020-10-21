## Hibernate三种状态的区分

Hibernate的对象有3种状态，分别为：瞬时态(Transient)、 持久态(Persistent)、脱管态(Detached)。处于持久态的对象也称为PO(Persistence Object)，瞬时对象和脱管对象也称为VO（Value Object）。 

1、瞬时态

  由new命令开辟内存空间的java对象，例如： Person person = new Person("xxx", "xx"); 如果没有变量对该对象进行引用，它将被java虚拟机回收。瞬时对象在内存孤立存在，它是携带信息的载体，不和数据库的数据有任何关联关系，在Hibernate中，可通过session的save()或saveOrUpdate()方法将瞬时对象与数据库相关联，并将数据对应的插入数据库中，此时该瞬时对象转变成持久化对象。

2、持久态

  处于该状态的对象在数据库中具有对应的记录，并拥有一个持久化标识。如果是用hibernate的delete()方法，对应的持久对象就变成瞬时对象，因数据库中的对应数据已被删除，该对象不再与数据库的记录关联。当一个session执行close()或clear()、evict()之后，持久对象变成脱管对象，此时持久对象会变成脱管对象，此时该对象虽然具有数据库识别值，但它已不在HIbernate持久层的管理之下。    

  持久对象具有如下特点： 1. 和session实例关联； 2. 在数据库中有与之关联的记录。

3、脱管态

  当与某持久对象关联的session被关闭后，该持久对象转变为脱管对象。当脱管对象被重新关联到session上时，并再次转变成持久对象。脱管对象拥有数据库的识别值，可通过update()、saveOrUpdate()等方法，转变成持久对象。    

  脱管对象具有如下特点： 1. 本质上与瞬时对象相同，在没有任何变量引用它时，JVM会在适当的时候将它回收； 2. 比瞬时对象多了一个数据库记录标识值。

## Save，Persist，Update，SaveOrUpdte，Merge，Flush，Lock的区别

 一、预备知识 

  对于hibernate，它的对象有三种状态，transient、persistent、detached 下边是常见的翻译办法： transient：瞬态或者自由态 (new DeptPo(1,”行政部”,20,”行政相关”)，该po的实例和session没有关联，该po的实例处于transient) persistent：持久化状态 (和数据库中记录想影射的Po实例，它的状态是persistent, 通过get和load等得到的对象都是persistent) detached：脱管状态或者游离态 

(1)当通过get或load方法得到的po对象它们都处于persistent,但如果执行delete(po)时(但不能执行事务),该po状态就处于detached, (表示和session脱离关联),因delete而变成游离态可以通过save或saveOrUpdate()变成持久态

(2)当把session关闭时，session缓存中的persistent的po对象也变成detached 因关闭session而变成游离态的可以通过lock、save、update变成持久态 持久态实例可以通过调用 delete()变成脱管状态。 通过get()或load()方法得到的实例都是持久化状态的。 脱管状态的实例可以通过调用lock()或者replicate()进行持久化。 save()和persist()将会引发SQL的INSERT，delete()会引发SQLDELETE， 而update()或merge()会引发SQL UPDATE。对持久化（persistent）实例的修改在刷新提交的时候会被检测到，它也会引起SQL UPDATE。saveOrUpdate()或者replicate()会引发SQLINSERT或者UPDATE
二、save 和update区别 

  把这一对放在第一位的原因是因为这一对是最常用的。 save的作用是把一个新的对象保存 update是把一个脱管状态的对象或自由态对象（一定要和一个记录对应）更新到数据库 

三、update 和saveOrUpdate区别 

  这个是比较好理解的，顾名思义，saveOrUpdate基本上就是合成了save和update,而update只是update;引用hibernate reference中的一段话来解释他们的使用场合和区别 通常下面的场景会使用update()或saveOrUpdate()：程序在第一个session中加载对象,接着把session关闭。该对象被传递到表现层 对象发生了一些改动  该对象被返回到业务逻辑层最终到持久层  程序创建第二session调用第二个session的update()方法持久这些改动  saveOrUpdate(po)做下面的事:  如果该po对象已经在本session中持久化了，在本session中执行saveOrUpdate不做任何事  如果savaOrUpdate(新po)与另一个与本session关联的po对象拥有相同的持久化标识(identifier)，抛出一个异常  org.hibernate.NonUniqueObjectException: a different object with the same

identifier value was already associated with the session: [org.itfuture.www.po.Xtyhb#5] saveOrUpdate如果对象没有持久化标识(identifier)属性，对其调用save() ，否则update() 这个对象 

四、persist和save区别 

  这个是最迷离的一对，表面上看起来使用哪个都行，在hibernate reference文档中也没有明确的区分他们. 这里给出一个明确的区分。（可以跟进src看一下，虽然实现步骤类似，但是还是有细微的差别） 主要内容区别： 1，persist把一个瞬态的实例持久化，但是并"不保证"标识符(identifier主键对应的属性)被立刻填入到持久化实例中，标识符的填入可能被推迟到flush的时候。 2，save, 把一个瞬态的实例持久化标识符，及时的产生,它要返回标识符，所以它会立即执行Sql insert

五、saveOrUpdate,merge和update区别

  比较update和merge update的作用上边说了，这里说一下merge的 如果session中存在相同持久化标识(identifier)的实例，用用户给出的对象覆盖session已有的持久实例

(1)当我们使用update的时候，执行完成后，会抛出异常  (2)但当我们使用merge的时候，把处理自由态的po对象A的属性copy到session当中处于持久态的po的属性中，执行完成后原来是持久状态还是持久态，而我们提供的A还是自由态 。

六、flush和update区别

  update操作的是在自由态或脱管状态(因session的关闭而处于脱管状态)的对象//updateSQL 而flush是操作的在持久状态的对象。 默认情况下，一个持久状态的对象的改动（包含set容器）是不需要update的，只要你更改了对象的值，等待hibernate flush就自动更新或保存到数据库了。hibernate flush发生在以下几种情况中： 1， 调用某些查询的和手动flush(),session的关闭、SessionFactory关闭结合 get()一个对象，把对象的属性进行改变,把资源关闭。 2，transaction commit的时候（包含了flush） 

七、lock和update区别 

  update是把一个已经更改过的脱管状态的对象变成持久状态 lock是把一个没有更改过的脱管状态的对象变成持久状态(针对的是因Session的关闭而处于脱管状态的po对象(2)，不能针对因delete而处于脱管状态的po对象) 对应更改一个记录的内容，两个的操作不同： update的操作步骤是： (1)属性改动后的脱管的对象的修改->调用update lock的操作步骤是： (2)调用lock把未修改的对象从脱管状态变成持久状态-->更改持久状态的对象的内容-->等待flush或者手动flush 八、clear和evcit的区别 clear完整的清除session缓存 evcit(obj)把某个持久化对象从session的缓存中清空。

八、总结

saveorupdate()如果传入的对象在数据库中有就做update操作，如果没有就做save操作。

save()在数据库中生成一条记录，如果数据库中有，会报错说有重复的记录。

update()就是更新数据库中的记录

主键在saveorupdate()方法中是起着关键作用的，只有这个主键的值不为空的时候才进行insert还是update的判断，否则直接insert

若主键不为空，就可以进行saveorupdate()操作了。

save是返回插入数据的主键的，而saveOrUpdate是void

save方法更适用于确定了是要插入，而且需要得到插入数据的主键

而saveOrUpdate更倾向于不缺定是插入还是更新，而且你不需要得到他的主键

另一方面，如果你无法确定你要插入或更新的对象是不是持久态或游离态时。如果你save一个持久态或更新一个游离态，这都是有问题的，此时你就要用到saveOrUpdate

总体来说，如果你能确定你即将操作对象的状态，则不需要用saveOrUpdate

参考链接：https://wenku.baidu.com/view/82888607e87101f69e3195c8.html