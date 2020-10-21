![Java开发手册-泰山版](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/Java开发手册-泰山版.png)

<div style="text-align:center">会当凌绝顶，一览众山小</div>
终于迎来了《Java开发手册》的一个新的版本——泰山版。

## 新版本说明

此次泰山版发布，将带来三大亮点：新增5条日期时间规约；新增2条表别名sql规约；新增统一错误码规约。

![Java开发手册-泰山版改动](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/Java开发手册-泰山版改动.png)

### 5条日期时间规约

- <span style="color:#C00000">【强制】</span>日期格式化时，传入pattern中表示年份统一使用小写的y。 

  <span style="color:#977C00">说明</span>：日期格式化时，yyyy表示当天所在的年，而大写的YYYY代表是week in which year（JDK7之后引入的概念），意思是当天所在的周属于的年份，一周从周日开始，周六结束，只要本周跨年，返回的YYYY就是下一年。 

  <span style="color:#01986A">正例</span>：表示日期和时间的格式如下所示： 

  			new SimpleDateFormat("yyyy-MM-dd HH:mm:ss") 

- <span style="color:#C00000">【强制】</span>在日期格式中分清楚大写的M和小写的m，大写的H和小写的h分别指代的意义。 

  <span style="color:#977C00">说明</span>：日期格式中的这两对字母表意如下： 

  	1） 表示月份是大写的M； 
		
  	2） 表示分钟则是小写的m； 
		
  	3） 24小时制的是大写的H； 
		
  	4） 12小时制的则是小写的h。 

- <span style="color:#C00000">【强制】</span>获取当前毫秒数：System.currentTimeMillis(); 而不是new Date().getTime()。 

  <span style="color:#977C00">说明</span>：如果想获取更加精确的纳秒级时间值，使用System.nanoTime的方式。在JDK8中，针对统计时间等场景，推荐使用Instant类。 

- <span style="color:#C00000">【强制】</span>不允许在程序任何地方中使用：1）java.sql.Date 2）java.sql.Time 3）java.sql.Timestamp。 

  <span style="color:#977C00">说明</span>：第1个不记录时间，getHours()抛出异常；第2个不记录日期，getYear()抛出异常；第3个在构造方法super((time/1000)*1000)，fastTime和nanos分开存储秒和纳秒信息。 

  <span style="color:#FF4500">反例</span>： java.util.Date.after(Date)进行时间比较时，当入参是java.sql.Timestamp时，会触发JDK BUG(JDK9已修复)，可能导致比较时的意外结果。 

- <span style="color:#C00000">【强制】</span>不要在程序中写死一年为365天，避免在公历闰年时出现日期转换错误或程序逻辑错误。

  <span style="color:#01986A">正例</span>： 

  ```java
  // 获取今年的天数 
  int daysOfThisYear = LocalDate.now().lengthOfYear();
  
  // 获取指定某年的天数
  LocalDate.of(2011, 1, 1).lengthOfYear(); 
  ```

  <span style="color:#FF4500">反例</span>： 

  ```java
  // 第一种情况：在闰年366天时，出现数组越界异常 
  int[] dayArray = new int[365]; 
  
  // 第二种情况：一年有效期的会员制，今年1月26日注册，硬编码365返回的却是1月25日 
  Calendar calendar = Calendar.getInstance(); calendar.set(2020, 1, 26); 
  calendar.add(Calendar.DATE, 365);  
  ```

- <span style="color:#FFC000">【推荐】</span>避免公历闰年2月问题。闰年的2月份有29天，一年后的那一天不可能是2月29日。 

- <span style="color:#FFC000">【推荐】</span>使用枚举值来指代月份。如果使用数字，注意Date，Calendar等日期相关类的月份month取值在0-11之间。 

  <span style="color:#977C00">说明</span>：参考JDK原生注释，Month value is 0-based. e.g., 0 for January. 

  <span style="color:#01986A">正例</span>： Calendar.JANUARY，Calendar.FEBRUARY，Calendar.MARCH等来指代相应月份来进行传参或比较。 

  

### 2条表别名sql规约

- <span style="color:#C00000">【强制】</span>对于数据库中表记录的查询和变更，只要涉及多个表，都需要在列名前加表的别名（或表名）进行限定。 

  说明：对多表进行查询记录、更新记录、删除记录时，如果对操作列没有限定表的别名（或表名），并且操作列在多个表中存在时，就会抛异常。 

  <span style="color:#01986A">正例</span>：select t1.name from table_first as t1 , table_second as t2 where t1.id=t2.id; 

  <span style="color:#FF4500">反例</span>：在某业务中，由于多表关联查询语句没有加表的别名（或表名）的限制，正常运行两年后，最近在某个表中增加一个同名字段，在预发布环境做数据库变更后，线上查询语句出现出1052异常：Column 'name' in field list is ambiguous。 

- <span style="color:#FFC000">【推荐】</span>SQL语句中表的别名前加as，并且以t1、t2、t3、...的顺序依次命名。 

  <span style="color:#977C00">说明</span>：1）别名可以是表的简称，或者是根据表出现的顺序，以t1、t2、t3的方式命名。2）别名前加as使别名更容易识别。

  <span style="color:#01986A">正例</span>：select t1.name from table_first as t1, table_second as t2 where t1.id=t2.id; 

### 三目运算符规范

- <span style="color:#C00000">【强制】</span>三目运算符condition? 表达式1 : 表达式2中，高度注意表达式1和2在类型对齐时，可能抛出因自动拆箱导致的NPE异常。 

  <span style="color:#977C00">说明</span>：以下两种场景会触发类型对齐的拆箱操作：

  	 1） 表达式1或表达式2的值只要有一个是原始类型。 
		
  	 2） 表达式1或表达式2的值的类型不一致，会强制拆箱升级成表示范围更大的那个类型。 

  <span style="color:#FF4500">反例</span>： 

  ```java
  Integer a = 1; 
  Integer b = 2; 
  Integer c = null; 
  Boolean flag = false; 
  // a*b的结果是int类型，那么c会强制拆箱成int类型，抛出NPE异常 
  Integer result=(flag? a*b : c); 
  ```

### 新增统一错误码规约

统一错误码，就是统一度量衡，为你的应用与服务的稳定保驾护航，烦恼清空，快乐回家。泰山版新近出炉的错误码具有快速溯源、简单易记、沟通标准化三大优势。错误码为字符串类型，共 5 位，分成两个部分：错误产生来源和四位数字编号。

错误产生来源分为 A/B/C，以当前代码运行视角来进行判定。

A 表示错误来源于用户，比如请求参数错误，用户安装版本过低等问题；

B 表示错误来源于当前系统，往往是业务逻辑出错，或程序健壮性差等问题；

C 表示错误来源于第三方服务，比如 CDN 服务出错，消息投递超时等问题。

优秀的错误码可以迅速知道他们是怎么来滴，从哪儿来滴，来干啥滴。同时俺们的错误码具有三级结构，分为一级宏观错误码、二级宏观错误码、三级宏观错误码，这样的方案更加可扩展，有弹性，更多详细规则，见手册的附件的《错误码参考列表》。

![Java开发手册-A类错误码](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/Java开发手册-A类错误码.png)

## 作者QA

作者孤尽也在QA视频中回答了新增的几条规约实际出现过的问题。

- 在对JDK源码阅读技巧上给我们提了3点：

  1）一定要有发现美的眼睛；

  2）一定要有主线思维；

  3）不断打磨自己的基础，包括位运算、源码调试，甚至可以看看JVM的C++源码或者C++下的汇编代码。

- 你的Java开发规约在业界影响这么大，你之前想到过有这一天吗？

  作者表示没有想到有这么一天，从最初的的4、5个人的小团体走到阿里巴巴，最后发到业界去，他还是坚持初心，对大家有用有帮助，继续传播。

- 是什么支撑你每年推出新规约，我们知道这并不是你的本职工作。

  作者表示在于两个词，热爱和卓越。但是要加上形容词。<span style="color:#FF4500">「奉献式的热爱」和「极致式的卓越」</span>。

我们看到从去年的「华山版」开始，《Java开发手册》就不再有阿里巴巴这样的限定词，作者的本意也是希望来致敬全球的开发者。因为《Java开发手册》发展到今天，已经不是单单属于阿里巴巴或者孤尽个人，它属于整个业界大家整体智慧的一个结晶。希望大家一起努力，将代码演绎到极致，并写出更优雅的代码。

## 历史版本

《Java开发手册》一直在迭代，不知道下一个版本是什么名字。

![Java开发手册-时间轴](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/Java开发手册-时间轴.png)

## 一起学习

最后在阿里云开发者社区里，也特意给我们准备了7日训练营的打卡挑战，帮助大家更好的理解手册，小伙伴们一起来参加吧还有可能获得奖品。

![Java开发手册-打卡挑战](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/Java开发手册-打卡挑战.png)

## 相关资源地址

GitHub（包含IntelliJ IDEA和Eclipse的插件）：[alibaba/p3c: Alibaba Java Coding Guidelines](https://github.com/alibaba/p3c) 

阿里云开发者社区：[泰山版Java开发手册\-阿里云开发者社区](https://developer.aliyun.com/topic/java2020)

---
<div style="text-align:center">求关注、分享、在看！！！
  你的支持是我创作最大的动力。</div>

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/qrcode_for_hbh.jpg)