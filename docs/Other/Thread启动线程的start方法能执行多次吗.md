## 线程的创建

我们知道在Java里线程是通过`java.lang.Thread`类来实现的。一般我们创建无返回值的线程会用下面两个方法：

1. 继承Thread类，重写run()方法；
2. 实现Runnable接口,重写run()方法；

线程启动会通过调用start方法来启动线程而不能直接调用run方法。

这里就会引出两个经典的面试题：

> 1. 为什么线程启动是调用start方法来启动线程而不能直接调用run方法？
> 2. 如果多次调用start方法会发生什么？

其实答案就是源码里，在这之前我们要了解线程的状态有哪些。

## 线程的状态

线程从创建到死亡是会经历多个状态的流转的。它们分别是：`NEW、RUNNABLE、BLOCKED、WAITING、TIMED_WAITING、TERMINATED`。

![Java-Thread-Status](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/Java-Thread-Status.png)

```java
// Thread类的内部的枚举类定义了线程的状态
public enum State {
    NEW,
    RUNNABLE,
    BLOCKED,
    WAITING,
    TIMED_WAITING,
    TERMINATED;
}
```

## start() 方法 & run()方法

### 为什么线程启动是调用start方法来启动线程而不能直接调用run方法？

从上图中，我们就可以看到，在New了一个线程后，首先进入初始态，然后调用start()方法来到就绪态，这里并不会立即执行线程里的任务，而是会等待系统资源分配，当分配到时间片后就可以开始运行了。 start()方法是一个native方法，它将启动一个新线程，并执行run()方法，这是真正的多线程工作。 而直接执行 run() 方法，会把 run 方法当成一个 main 线程下的普通方法去执行，并不会在某个线程中执行它，所以这并不是多线程工作。这就是为什么调用 start() 方法时会执行 run() 方法，为什么不能直接调用 run() 方法的原因了。

Example：

```java
public class ThreadDemo    
		public static void main(String[] args) {
        Thread t1 = new Thread(new Task1());
        Thread t2 = new Thread(new Task2());

  			// 测试1
        t1.start();
        t2.start();

 				// 测试2
        t1.run();
        t2.run();

    }
}

class Task1 implements Runnable {

    @Override
    public void run() {
        for (int i = 0; i < 10; i++) {
            System.out.println("Task1: " + i);
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}

class Task2 implements Runnable {

    @Override
    public void run() {
        for (int i = 10; i > 0; i--) {
            System.out.println("Task2: " + i);
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}


// 测试1输出
Task1: 0
Task2: 10
Task1: 1
Task2: 9
Task1: 2
Task2: 8
Task1: 3
Task2: 7
Task1: 4
Task2: 6
Task1: 5
Task2: 5
Task1: 6
Task2: 4
Task1: 7
Task2: 3
Task1: 8
Task2: 2
Task1: 9
Task2: 1
我们可以看到Task1 和 Task2是交替打印的，是多线程在运行。
// 测试2输出
Task1: 0
Task1: 1
Task1: 2
Task1: 3
Task1: 4
Task1: 5
Task1: 6
Task1: 7
Task1: 8
Task1: 9
Task2: 10
Task2: 9
Task2: 8
Task2: 7
Task2: 6
Task2: 5
Task2: 4
Task2: 3
Task2: 2
Task2: 1
这个的输出是串行的，Task1 执行完才执行 Task2，所以不是多线程，是普通方法。
```

### 如果多次调用start方法会发生什么？

首先我们先测试一下。

Example：

```java
public class ThreadDemo    
		public static void main(String[] args) {
        Thread t1 = new Thread(new Task1());
        Thread t2 = new Thread(new Task2());

  			// 测试3
        t1.start();
        t1.start();
    }
}

// 测试3输出
Task1: 0
Task...
Exception in thread "main" java.lang.IllegalThreadStateException
	at java.lang.Thread.start(Thread.java:708)
Task...
```

只有第一次成功执行，后面就抛出了异常`java.lang.IllegalThreadStateException`，让我们来从下面的源码里看看吧，在start方法进来后就会判断线程的状态，如果不是初始态状态就会抛出异常，所以第二次执行就会报错，因为线程的状态已经发生改变。

### 源码

start()方法源码：

```java
    public synchronized void start() {  
        // 如果线程不是"NEW状态"，则抛出异常！  
        if (threadStatus != 0)  
            throw new IllegalThreadStateException();  
        // 将线程添加到ThreadGroup中  
        group.add(this);  
        boolean started = false;  
        try {  
            // 通过start0()启动线程,新线程会调用run()方法  
            start0();  
            // 设置started标记=true  
            started = true;  
        } finally {  
            try {  
                if (!started) {  
                    group.threadStartFailed(this);  
                }  
            } catch (Throwable ignore) {  
            }  
        }  
    }  
```

run方法源码：

```java
public void run() {  
    if (target != null) {  
        target.run();  
    }  
} 
```



## 总结

> **start()方法是用来启动线程，真正实现了多线程运行。**
>
> **run()方法是一个普通方法。**
>
> **调用start()方法后会先判断线程的状态是否为NEW，所以线程只能启动一次。**





参考

[深入浅出线程Thread类的start\(\)方法和run\(\)方法 \- 掘金](https://juejin.im/post/5b09274af265da0de25759d5)

