## 过滤器（Filter）

​		Filter可以认为是Servlet的一种“加强版”，它主要用于对用户请求进行预处理，也可以对HttpServletResponse进行后处理，是个典型的处理链。Filter也可以对用户请求生成响应，这一点与Servlet相同，但实际上很少会使用Filter向用户请求生成响应。使用Filter完整的流程是：Filter对用户请求进行预处理，接着将请求交给Servlet进行预处理并生成响应，最后Filter再对服务器响应进行后处理。

创建一个Filter只需两个步骤

1. 创建Filter处理类
2. web.xml文件中配置Filter

  创建Filter必须实现javax.servlet.Filter接口，在该接口中定义了如下三个方法。

- void init(FilterConfig config):用于完成Filter的初始化。

- void destory()：用于Filter销毁前，完成某些资源的回收。

- void doFilter(ServletRequest request,ServletResponse response,FilterChain chain)：

  实现过滤功能，该方法就是对每个请求及响应增加的额外处理。该方法可以实现对用户请求进行预处理(ServletRequest request)，也可实现对服务器响应进行后处理(ServletResponse response)—它们的分界线为是否调用了chain.doFilter(),执行该方法之前，即对用户请求进行预处理；执行该方法之后，即对服务器响应进行后处理。



## 拦截器（Interceptor）

​		拦截器，在AOP(Aspect-Oriented Programming)中用于在某个方法或字段被访问之前，进行拦截，然后在之前或之后加入某些操作。拦截是AOP的一种实现策略。

创建Interceptor必须实现com.opensymphony.xwork2.interceptor.Interceptor接口，该接口定义了如下三个方法。

- void init():在该拦截器被实例化之后，在该拦截器执行拦截之前，系统将回调该方法。对于每个拦截器而言，其init()方法只执行一次。因此，该方法的方法体主要用于初始化资源。
- void destory():该方法与init()方法对应。在拦截器实例被销毁之前，系统将回调该拦截器的destory方法，该方法用于销毁在init方法里打开的资源。
- String intercept(ActionInvocation invocation):该方法是用户需要实现的拦截动作。就像Action的execute方法一样。intercept方法会返回一个字符串作为逻辑视图。如果该方法直接返回了一个字符串，系统会将跳转到该逻辑视图对应的实际视图资源，不会调用被拦截的Action。该方法的ActionInvocation参数包含了被拦截的Action的引用，可以通过调用该参数的invoke方法，将控制权转给下一个拦截器，或者转给Action的execute方法(如果该拦截器后没有其他拦截器，则直接执行Action的execute方法)。

### Filter和Interceptor的区别

- Filter是基于函数回调的，而Interceptor则是基于Java反射的。
- Filter依赖于Servlet容器，而Interceptor不依赖于Servlet容器。
- Filter对几乎所有的请求起作用，而Interceptor只能对action请求起作用。
- Interceptor可以访问Action的上下文，值栈里的对象，而Filter不能。
- 在action的生命周期里，Interceptor可以被多次调用，而Filter只能在容器初始化时调用一次。

### Filter和Interceptor的执行顺序

   过滤前-拦截前-action执行-拦截后-过滤后





