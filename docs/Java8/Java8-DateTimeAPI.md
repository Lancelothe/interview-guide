## 前言

### Java8之前日期/时间API存在的问题

- 非线程安全 − java.util.Date 是非线程安全的，所有的日期类都是可变的，这是Java日期类最大的问题之一。
- 设计很差 − Java的日期/时间类的定义并不一致，在java.util和java.sql的包中都有日期类，此外用于格式化和解析的类在java.text包中定义。java.util.Date同时包含日期和时间，而java.sql.Date仅包含日期，将其纳入java.sql包并不合理。另外这两个类都有相同的名字，这本身就是一个非常糟糕的设计。
- 时区处理麻烦 − 日期类并不提供国际化，没有时区支持，因此Java引入了java.util.Calendar和java.util.TimeZone类，但他们同样存在上述所有的问题。

​    因为上面这些原因，诞生了第三方库Joda-Time，可以替代Java的时间管理API。Java 8中新的时间和日期管理API深受Joda-Time影响，并吸收了很多Joda-Time的精华。新的java.time包包含了所有关于日期、时间、时区、Instant（跟日期类似但是精确到纳秒）、duration（持续时间）和时钟操作的类。新设计的API认真考虑了这些类的不变性（从java.util.Calendar吸取的教训），如果某个实例需要修改，则返回一个新的对象。

### Java8新日期/时间API的改变

Java 8日期/时间API是JSR-310的实现，它的实现目标是克服旧的日期时间实现中所有的缺陷，新的日期/时间API的一些设计原则是：

- 不变性：新的日期/时间API中，所有的类都是不可变的，这对多线程环境有好处。 
- 关注点分离：新的API将人可读的日期时间和机器时间（unix timestamp）明确分离，它为日期（Date）、时间（Time）、日期时间（DateTime）、时间戳（unix timestamp）以及时区定义了不同的类。 
- 清晰：在所有的类中，方法都被明确定义用以完成相同的行为。举个例子，要拿到当前实例我们可以使用now()方法，在所有的类中都定义了format()和parse()方法，而不是像以前那样专门有一个独立的类。为了更好的处理问题，所有的类都使用了工厂模式和策略模式，一旦你使用了其中某个类的方法，与其他类协同工作并不困难。 
- 实用操作：所有新的日期/时间API类都实现了一系列方法用以完成通用的任务，如：加、减、格式化、解析、从日期/时间中提取单独部分，等等。 
- 可扩展性：新的日期/时间API是工作在ISO-8601日历系统上的，但我们也可以将其应用在非IOS的日历上。

Java日期/时间API包含以下相应的包：

- java.time包：这是新的Java日期/时间API的基础包，所有的主要基础类都是这个包的一部分，如：LocalDate, LocalTime, LocalDateTime, Instant, Period, Duration等等。所有这些类都是不可变的和线程安全的，在绝大多数情况下，这些类能够有效地处理一些公共的需求。 
- java.time.chrono包：这个包为非ISO的日历系统定义了一些泛化的API，我们可以扩展AbstractChronology类来创建自己的日历系统。 
- java.time.format包：这个包包含能够格式化和解析日期时间对象的类，在绝大多数情况下，我们不应该直接使用它们，因为java.time包中相应的类已经提供了格式化和解析的方法。 
- java.time.temporal包：这个包包含一些时态对象，我们可以用其找出关于日期/时间对象的某个特定日期或时间，比如说，可以找到某月的第一天或最后一天。你可以非常容易地认出这些方法，因为它们都具有“withXXX”的格式。 
- java.time.zone包：这个包包含支持不同时区以及相关规则的类。

### Java8提供的LocalDate和DateTimeFormat是如何保证线程安全的？

LocalDate类和DateTimeFormatter类都是final类型的，也就是说，它们是不可变的，一旦实例化，值就固定了。而Java8之前的Date类和SimpleDateFormat类都不是final的。

分析一下源码。

![LocalDateTime-Src](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/LocalDateTime-Src.png)

![DateTimeFormatter-Src](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/DateTimeFormatter-Src.png)

## Java8日期/时间API介绍

### Java8新增类型

```
Instant：时间戳
Duration：持续时间，时间差
LocalDate：只包含日期，比如：2016-10-20
LocalTime：只包含时间，比如：23:12:10
LocalDateTime：包含日期和时间，比如：2016-10-20 23:14:21
Period：时间段
ZoneOffset：时区偏移量，比如：+8:00
ZonedDateTime：带时区的时间
Clock：时钟，比如获取目前美国纽约的时间
java.time.format.DateTimeFormatter：时间格式化类
```

下面介绍下如何使用：

### LocalDate 只会获取年月日

```java
// 创建 LocalDate
// 获取当前年月日
LocalDate localDate = LocalDate.now();
// 构造指定的年月日
LocalDate localDate1 = LocalDate.of(2019, 9, 12);
// 获取年、月、日、星期几
int year = localDate1.getYear();
int year1 = localDate1.get(ChronoField.YEAR);
Month month = localDate1.getMonth();
int month1 = localDate1.get(ChronoField.MONTH_OF_YEAR);
// 月份中的第几天：12
int day = localDate1.getDayOfMonth();
int day1 = localDate1.get(ChronoField.DAY_OF_MONTH);
// 一周的第几天：THURSDAY
DayOfWeek dayOfWeek = localDate1.getDayOfWeek();
// 一周的第几天：4
int dayOfWeek1 = localDate1.get(ChronoField.DAY_OF_WEEK);
// 是否为闰年：false
boolean leapYear = localDate1.isLeapYear();  
// 纽约日期
LocalDate todayNewYork = LocalDate.now(ZoneId.of("America/New_York"));
```

### LocalTime 只会获取时分秒

```java
// 创建 LocalTime
LocalTime localTime = LocalTime.of(14, 14, 14);
LocalTime localTime1 = LocalTime.now();
// 获取小时
int hour = localTime.getHour();
int hour1 = localTime.get(ChronoField.HOUR_OF_DAY);
// 获取分
int minute = localTime.getMinute();
int minute1 = localTime.get(ChronoField.MINUTE_OF_HOUR);
// 获取秒
int second = localTime.getMinute();
int second1 = localTime.get(ChronoField.SECOND_OF_MINUTE);
// 纽约时间
LocalTime timeNewYork = LocalTime.now(ZoneId.of("America/New_York"));
```

### LocalDateTime 获取年月日时分秒

相当于 LocalDate + LocalTime

```java
// 创建 LocalDateTime
LocalDateTime localDateTime = LocalDateTime.now();
LocalDateTime localDateTime1 = LocalDateTime.of(2019, Month.SEPTEMBER, 10, 14, 46, 56);
LocalDateTime localDateTime2 = LocalDateTime.of(localDate, localTime);
LocalDateTime localDateTime3 = localDate.atTime(localTime);
LocalDateTime localDateTime4 = localTime.atDate(localDate);
// 获取LocalDate
LocalDate localDate2 = localDateTime.toLocalDate();
// 获取LocalTime
LocalTime localTime2 = localDateTime.toLocalTime();
// 纽约日期+时间
LocalDateTime timeNewYork = LocalDateTime.now(ZoneId.of("America/New_York"));
```

### Instant 获取秒数

用于表示一个时间戳（精确到纳秒）

它与我们常使用的`System.currentTimeMillis()`有些类似，不过`Instant`可以精确到纳秒（Nano-Second），`System.currentTimeMillis()`方法只精确到毫秒（Milli-Second）。如果查看`Instant`源码，发现它的内部使用了两个常量，`seconds`表示从1970-01-01 00:00:00开始到现在的秒数，`nanos`表示纳秒部分（`nanos`的值不会超过`999,999,999`）。`Instant`除了使用`now()`方法创建外，还可以通过`ofEpochSecond`方法创建.

```java
// ofEpochSecond()方法的第一个参数为秒，第二个参数为纳秒，上面的代码表示从1970-01-01 00:00:00开始后两分钟的10万纳秒的时刻，控制台上的输出为：
// 1970-01-01T00:02:00.000100Z
Instant instant = Instant.ofEpochSecond(120, 100000);

// 创建Instant对象
Instant instant = Instant.now();
// 获取秒数
long currentSecond = instant.getEpochSecond();
// 获取毫秒数
long currentMilli = instant.toEpochMilli();
```

### Period/Duration 时间差

- Period - 处理有关基于时间的日期数量。
- Duration - 处理有关基于时间的时间量。

### Duration 表示一个时间段

```java
// Duration.between()方法创建 Duration 对象
LocalDateTime from = LocalDateTime.of(2017, Month.JANUARY, 1, 00, 0, 0);    // 2017-01-01 00:00:00
LocalDateTime to = LocalDateTime.of(2019, Month.SEPTEMBER, 12, 14, 28, 0);   // 2019-09-15 14:28:00
Duration duration = Duration.between(from, to);     // 表示从 from 到 to 这段时间
long days = duration.toDays();              // 这段时间的总天数
long hours = duration.toHours();            // 这段时间的小时数
long minutes = duration.toMinutes();        // 这段时间的分钟数
long seconds = duration.getSeconds();       // 这段时间的秒数
long milliSeconds = duration.toMillis();    // 这段时间的毫秒数
long nanoSeconds = duration.toNanos();      // 这段时间的纳秒数
Duration duration1 = Duration.of(5, ChronoUnit.DAYS);       // 5天
Duration duration2 = Duration.of(1000, ChronoUnit.MILLIS);  // 1000毫秒
```

### Period 表示日期上的时间差

`Period`在概念上和`Duration`类似，区别在于`Period`是以年月日来衡量一个时间段，比如2年3个月6天：

> Period period = Period.of(2, 3, 6);

`Period`对象也可以通过`between()`方法创建，值得注意的是，由于`Period`是以年月日衡量时间段，所以between()方法只能接收LocalDate类型的参数：

```java
// 2017-01-05 到 2017-02-05 这段时间
Period period = Period.between(
                LocalDate.of(2017, 1, 5),
                LocalDate.of(2017, 2, 5));
```

### ChronoUnit   时间枚举类

```java
LocalDate today = LocalDate.now();
LocalDate nextWeek = today.plus(1, ChronoUnit.WEEKS);
```

### Clock

它通过指定一个时区，然后就可以获取到当前的时刻，日期与时间。Clock可以替换System.currentTimeMillis()与TimeZone.getDefault()。

```java
Clock clock = Clock.systemUTC();
System.out.println(clock.instant() );//2020-05-26T16:54:54.141Z
System.out.println(clock.millis() );//1590512094273
```

## 时区

Java 8中的时区操作被很大程度上简化了，新的时区类`java.time.ZoneId`是原有的`java.util.TimeZone`类的替代品。`ZoneId`对象可以通过`ZoneId.of()`方法创建，也可以通过`ZoneId.systemDefault()`获取系统默认时区：

```java
ZoneId shanghaiZoneId = ZoneId.of("Asia/Shanghai");
ZoneId systemZoneId = ZoneId.systemDefault();
```

`of()`方法接收一个“区域/城市”的字符串作为参数，你可以通过`getAvailableZoneIds()`方法获取所有合法的“区域/城市”字符串：

```java
Set<String> zoneIds = ZoneId.getAvailableZoneIds();
```

对于老的时区类`TimeZone`，Java 8也提供了转化方法：

```java
ZoneId oldToNewZoneId = TimeZone.getDefault().toZoneId();
```

有了`ZoneId`，我们就可以将一个`LocalDate`、`LocalTime`或`LocalDateTime`对象转化为`ZonedDateTime`对象：

```java
LocalDateTime localDateTime = LocalDateTime.now();
ZonedDateTime zonedDateTime = ZonedDateTime.of(localDateTime, shanghaiZoneId);
```

将`zonedDateTime`打印到控制台为：

```java
2017-01-05T15:26:56.147+08:00[Asia/Shanghai]
```

### ZonedDateTime   带时区日期时间处理

对象由两部分构成，`LocalDateTime`和`ZoneId`，其中`2017-01-05T15:26:56.147`部分为`LocalDateTime`，`+08:00[Asia/Shanghai]`部分为`ZoneId`。

另一种表示时区的方式是使用`ZoneOffset`，它是以当前时间和**世界标准时间（UTC）/格林威治时间（GMT）**的偏差来计算，例如：

```java
ZoneOffset zoneOffset = ZoneOffset.of("+09:00");
LocalDateTime localDateTime = LocalDateTime.now();
OffsetDateTime offsetDateTime = OffsetDateTime.of(localDateTime, zoneOffset);
```

GMT（格林威治时间）、CST（可视为美国、澳大利亚、古巴或中国的标准时间）、PST（太平洋时间）

```
GMT: UTC +0    =    GMT: GMT +0
CST: UTC +8    =    CST: GMT +8
PST: UTC -8    =    PST: GMT -8
```

![ZonedDateTime](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/ZonedDateTime.png)

从上面的图中我们可以看出，LocalDateTime，并不能表示我们人类世界中完整的时间，而ZonedDateTime可以。

而且上面的转换中我们可以知道，LocalDateTime转Instant或者OffsetDatetime都是需要加上偏移时区的（ZoneOffset）。

所以可以得出 OffsetDatetime和Instant也是可以表示人类世界中完整的时间的，和ZoneDateTime是等效的。

### OffsetDatetime、Instant和 ZoneDateTime区别

OffsetDateTime ，ZonedDateTime 和 Instant 都会在时间线上存储一个纳秒级精度。 Instant 是最简单的，只需代表instant。 OffsetDateTime 添加到UTC / Greenwich的偏移瞬间，这允许获得本地日期时间。 ZonedDateTime 添加完整的时区规则。

> 因此 OffsetDateTime 和之间的区别ZonedDateTime 是后者包括涵盖夏令时调整的规则。

国际时区 TimeZone ID列表 获取方法：`TimeZone.getAvailableIDs()`

## 其他历法

Java中使用的历法是ISO 8601日历系统，它是世界民用历法，也就是我们所说的公历。平年有365天，闰年是366天。闰年的定义是：非世纪年，能被4整除；世纪年能被400整除。为了计算的一致性，公元1年的前一年被当做公元0年，以此类推。

此外Java 8还提供了4套其他历法（很奇怪为什么没有汉族人使用的农历），每套历法都包含一个日期类，分别是：

- `ThaiBuddhistDate`：泰国佛教历
- `MinguoDate`：中华民国历
- `JapaneseDate`：日本历
- `HijrahDate`：伊斯兰历

每个日期类都继承`ChronoLocalDate`类，所以可以在不知道具体历法的情况下也可以操作。不过这些历法一般不常用，除非是有某些特殊需求情况下才会使用。

这些不同的历法也可以用于向公历转换：

```java
LocalDate date = LocalDate.now();
JapaneseDate jpDate = JapaneseDate.from(date);
```

由于它们都继承`ChronoLocalDate`类，所以在不知道具体历法情况下，可以通过`ChronoLocalDate`类操作日期：

```java
Chronology jpChronology = Chronology.ofLocale(Locale.JAPANESE);
ChronoLocalDate jpChronoLocalDate = jpChronology.dateNow();
```

我们在开发过程中应该尽量避免使用`ChronoLocalDate`，尽量用与历法无关的方式操作时间，因为不同的历法计算日期的方式不一样，比如开发者会在程序中做一些假设，假设一年中有12个月，如果是中国农历中包含了闰月，一年有可能是13个月，但开发者认为是12个月，多出来的一个月属于明年的。再比如假设年份是累加的，过了一年就在原来的年份上加一，但日本天皇在换代之后需要重新纪年，所以过了一年年份可能会从1开始计算。

在实际开发过程中建议使用`LocalDate`，包括存储、操作、业务规则的解读；除非需要将程序的输入或者输出本地化，这时可以使用`ChronoLocalDate`类。

## 日期的操作和格式化

### 增加和减少日期-简单操作

```java
LocalDate date = LocalDate.of(2017, 1, 5);          // 2017-01-05
LocalDate date1 = date.withYear(2016);              // 修改为 2016-01-05
LocalDate date2 = date.withMonth(2);                // 修改为 2017-02-05
LocalDate date3 = date.withDayOfMonth(1);           // 修改为 2017-01-01

LocalDate date4 = date.plusYears(1);                // 增加一年 2018-01-05
LocalDate date5 = date.minusMonths(2);              // 减少两个月 2016-11-05
LocalDate date6 = date.plus(5, ChronoUnit.DAYS);    // 增加5天 2017-01-10
```

像LocalDate、LocalTime、LocalDateTime以及Instant这样表示时间点的日期-时间类提供了大量通用的方法，

下表对这些通用的方法进行了总结

| 方法名   | 描述                                                         |
| -------- | ------------------------------------------------------------ |
| from     | 静态方法，依据传入的 Temporal 对象创建对象实例               |
| now      | 静态方法，依据系统时钟创建 Temporal 对象                     |
| of       | 静态方法，由 Temporal 对象的某个部分创建该对象的实例         |
| parse    | 静态方法，由字符串创建 Temporal 对象的实例                   |
| atOffset | 非静态方法，将 Temporal 对象和某个时区偏移相结合             |
| atZone   | 非静态方法，将 Temporal 对象和某个时区相结合                 |
| format   | 非静态方法，使用某个指定的格式器将Temporal对象转换为字符串（Instant类不提供该方法） |
| get      | 非静态方法，读取 Temporal 对象的某一部分的值                 |
| minus    | 非静态方法，创建 Temporal 对象的一个副本，通过将当前 Temporal 对象的值减去一定的时长创建该副本 |
| plus     | 非静态方法，创建 Temporal 对象的一个副本，通过将当前 Temporal 对象的值加上一定的时长创建该副本 |
| with     | 非静态方法，以该 Temporal 对象为模板，对某些状态进行修改创建该对象的副本 |

### TemporalField-复杂操作 

`TemporalField`是一个接口，它定义了如何访问temporal对象某个字段的值。`ChronoField`枚举类实现了这一接口，所以你可以很方便地使用get方法得到枚举元素的值：

```java
int year = LocalDate.now().get(ChronoField.YEAR); 

LocalDate date1 = LocalDate.now();
// 下一个周二 
LocalDate nextTuesday = date1.with(TemporalAdjusters.next(DayOfWeek.TUESDAY));
// 当月的第二个周六
LocalDate firstInMonth = LocalDate.of(date1.getYear(), date1.getMonth(), 1);
LocalDate secondSaturday = firstInMonth.with(TemporalAdjusters.nextOrSame(DayOfWeek.SATURDAY)).with(TemporalAdjusters.next(DayOfWeek.SATURDAY));

```

**注：TemporalAdjusters类中有许多常用的特殊的日期的方法（类方法），使用时可以仔细查看，可以很大程度减少日期判断的代码量！**

TemporalAdjusters 包含许多静态方法，可以直接调用，以下列举一些：

| 方法名                      | 描述                                                        |
| --------------------------- | ----------------------------------------------------------- |
| dayOfWeekInMonth            | 返回同一个月中每周的第几天                                  |
| firstDayOfMonth             | 返回当月的第一天                                            |
| firstDayOfNextMonth         | 返回下月的第一天                                            |
| firstDayOfNextYear          | 返回下一年的第一天                                          |
| firstDayOfYear              | 返回本年的第一天                                            |
| firstInMonth                | 返回同一个月中第一个星期几                                  |
| lastDayOfMonth              | 返回当月的最后一天                                          |
| lastDayOfNextMonth          | 返回下月的最后一天                                          |
| lastDayOfNextYear           | 返回下一年的最后一天                                        |
| lastDayOfYear               | 返回本年的最后一天                                          |
| lastInMonth                 | 返回同一个月中最后一个星期几                                |
| next / previous             | 返回后一个/前一个给定的星期几                               |
| nextOrSame / previousOrSame | 返回后一个/前一个给定的星期几，如果这个值满足条件，直接返回 |

### DateTimeFormatter 格式化日期

```java
LocalDate localDate = LocalDate.of(2019, 9, 12);
String s1 = localDate.format(DateTimeFormatter.BASIC_ISO_DATE);
String s2 = localDate.format(DateTimeFormatter.ISO_LOCAL_DATE);
System.out.println("s1："+ s1); // 20190912
System.out.println("s2："+ s2); // 2019-09-12
LocalDateTime localDateTime = LocalDateTime.now();
System.out.println("获取当前时间："+localDateTime); // 2019-09-16T14:54:36.520
DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:MM:SS");
String s = localDateTime.format(formatter);
System.out.println("格式化当前时间："+ s); // 2019-09-16 14:09:52


LocalDate localDate1 = LocalDate.parse("20190912", DateTimeFormatter.BASIC_ISO_DATE);
LocalDate localDate2 = LocalDate.parse("2019-09-12", DateTimeFormatter.ISO_LOCAL_DATE);
```

DateTimeFormatter我们更多的是直接使用pattern来做转换，其实这个类本身已经提供了一些预定义好的实例供我们使用。
下面把两者的具体释义和示例都贴出来供大家参考。

`预定义`

| Predefined Formatters                      | Formatter Description                                    | Example                                        |
| ------------------------------------------ | -------------------------------------------------------- | ---------------------------------------------- |
| ofLocalizedDate\(dateStyle\)               | Formatter with date style from the locale                | '2011\-12\-03'                                 |
| ofLocalizedTime\(timeStyle\)               | Formatter with time style from the locale                | '10:15:30'                                     |
| ofLocalizedDateTime\(dateTimeStyle\)       | Formatter with a style for date and time from the locale | '3 Jun 2008 11:05:30'                          |
| ofLocalizedDateTime\(dateStyle,timeStyle\) | Formatter with date and time styles from the locale      | '3 Jun 2008 11:05'                             |
| BASIC\_ISO\_DATE                           | Basic ISO date                                           | '20111203'                                     |
| ISO\_LOCAL\_DATE                           | ISO Local Date                                           | '2011\-12\-03'                                 |
| ISO\_OFFSET\_DATE                          | ISO Date with offset                                     | '2011\-12\-03\+01:00'                          |
| ISO\_DATE                                  | ISO Date with or without offset                          | '2011\-12\-03\+01:00'; '2011\-12\-03'          |
| ISO\_LOCAL\_TIME                           | Time without offset                                      | '10:15:30'                                     |
| ISO\_OFFSET\_TIME                          | Time with offset                                         | '10:15:30\+01:00'                              |
| ISO\_TIME                                  | Time with or without offset                              | '10:15:30\+01:00'; '10:15:30'                  |
| ISO\_LOCAL\_DATE\_TIME                     | ISO Local Date and Time                                  | '2011\-12\-03T10:15:30'                        |
| ISO\_OFFSET\_DATE\_TIME                    | Date Time with Offset                                    | '2011\-12\-03T10:15:30\+01:00'                 |
| ISO\_ZONED\_DATE\_TIME                     | Zoned Date Time                                          | '2011\-12\-03T10:15:30\+01:00\[Europe/Paris\]' |
| ISO\_DATE\_TIME                            | Date and time with ZoneId                                | '2011\-12\-03T10:15:30\+01:00\[Europe/Paris\]' |
| ISO\_ORDINAL\_DATE                         | Year and day of year                                     | '2012\-337'                                    |
| ISO\_WEEK\_DATE                            | Year and Week                                            | '2012\-W48\-6'                                 |
| ISO\_INSTANT                               | Date and Time of an Instant                              | '2011\-12\-03T10:15:30Z'                       |
| RFC\_1123\_DATE\_TIME                      | RFC 1123 / RFC 822                                       | 'Tue, 3 Jun 2008 11:05:30 GMT'                 |

`Pattern`

All letters 'A' to 'Z' and 'a' to 'z' are reserved as pattern letters. The following pattern letters are defined: 

| Symbol | Meaning                           | Presentation | Examples                                             |
| ------ | --------------------------------- | ------------ | ---------------------------------------------------- |
| G      | era                               | text         | AD; Anno Domini; A                                   |
| u      | year                              | year         | 2004; 04                                             |
| y      | year\-of\-era                     | year         | 2004; 04                                             |
| D      | day\-of\-year                     | number       | 189                                                  |
| M/L    | month\-of\-year                   | number/text  | 7; 07; Jul; July; J                                  |
| d      | day\-of\-month                    | number       | 10                                                   |
| Q/q    | quarter\-of\-year                 | number/text  | 3; 03; Q3; 3rd quarter                               |
| Y      | week\-based\-year                 | year         | 1996; 96                                             |
| w      | week\-of\-week\-based\-year       | number       | 27                                                   |
| W      | week\-of\-month                   | number       | 4                                                    |
| E      | day\-of\-week                     | text         | Tue; Tuesday; T                                      |
| e/c    | localized day\-of\-week           | number/text  | 2; 02; Tue; Tuesday; T                               |
| F      | week\-of\-month                   | number       | 3                                                    |
| a      | am\-pm\-of\-day                   | text         | PM                                                   |
| h      | clock\-hour\-of\-am\-pm \(1\-12\) | number       | 12                                                   |
| K      | hour\-of\-am\-pm \(0\-11\)        | number       | 0                                                    |
| k      | clock\-hour\-of\-am\-pm \(1\-24\) | number       | 0                                                    |
| H      | hour\-of\-day \(0\-23\)           | number       | 0                                                    |
| m      | minute\-of\-hour                  | number       | 30                                                   |
| s      | second\-of\-minute                | number       | 55                                                   |
| S      | fraction\-of\-second              | fraction     | 978                                                  |
| A      | milli\-of\-day                    | number       | 1234                                                 |
| n      | nano\-of\-second                  | number       | 987654321                                            |
| N      | nano\-of\-day                     | number       | 1234000000                                           |
| V      | time\-zone ID                     | zone\-id     | America/Los\_Angeles; Z; \-08:30                     |
| z      | time\-zone name                   | zone\-name   | Pacific Standard Time; PST                           |
| O      | localized zone\-offset            | offset\-O    | GMT\+8; GMT\+08:00; UTC\-08:00;                      |
| X      | zone\-offset 'Z' for zero         | offset\-X    | Z; \-08; \-0830; \-08:30; \-083015; \-08:30:15;      |
| x      | zone\-offset                      | offset\-x    | \+0000; \-08; \-0830; \-08:30; \-083015; \-08:30:15; |
| Z      | zone\-offset                      | offset\-Z    | \+0000; \-0800; \-08:00;                             |
| p      | pad next                          | pad modifier | 1                                                    |
| '      | escape for text                   | delimiter    |                                                      |
| ''     | single quote                      | literal      | '                                                    |
| \[     | optional section start            |              |                                                      |
| \]     | optional section end              |              |                                                      |
| \#     | reserved for future use           |              |                                                      |
| \{     | reserved for future use           |              |                                                      |
| \}     | reserved for future use           |              |                                                      |

## 旧的日期时间支持

### Date 和 LocalDate 互转

```java
// Date -> LocalDateTime/LocalDate
Date date = new Date();
LocalDateTime localDateTime = date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
LocalDate localDate = date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();

// LocalDate -> Date
LocalDate nowLocalDate = LocalDate.now();
Date date = Date.from(nowLocalDate.atStartOfDay(ZoneId.systemDefault()).toInstant());
// LocalDateTime -> Date
LocalDateTime localDateTime = LocalDateTime.now();
Date date = Date.from(localDateTime.atZone(ZoneId.systemDefault()).toInstant());
```

### Date 和 Instant 互转

```java
// Date -> Instant
Instant timestamp = new Date().toInstant();
// Instant -> Date
Date date = Date.from(Instant.now());
```

### TimeZone 和 ZoneId 互转

```java
ZoneId defaultZone = TimeZone.getDefault().toZoneId();
TimeZone tz = TimeZone.getTimeZone(defaultZone);
```

### ZonedDateTime 和 GregorianCalendar 互转

```java
ZonedDateTime gregorianCalendarDateTime = new GregorianCalendar().toZonedDateTime();//GregorianCalendar -> ZonedDateTime
GregorianCalendar gc = GregorianCalendar.from(gregorianCalendarDateTime);//ZonedDateTime -> GregorianCalendar
```

## 其他相关转换

### Long时间戳 和 LocalDateTime 互转

```java
// Long时间戳 -> LocalDateTime
long timestamp = System.currentTimeMillis();
LocalDateTime localDateTime = Instant.ofEpochMilli(timestamp).atZone(ZoneId.systemDefault()).toLocalDateTime();

// LocalDate -> Long时间戳
LocalDate localDate = LocalDate.now();
long timestamp = localDate.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli();
// LocalDateTime -> Long时间戳
LocalDateTime localDateTime = LocalDateTime.now();
long timestamp = localDateTime.toInstant(ZoneOffset.ofHours(8)).toEpochMilli(); // GMT +8时区
```

### Instant 和 LocalDateTime互转

```java
// LocalDateTime -> Instant 
Instant instant =  LocalDateTime.now().toInstant(ZoneOffset.of("+8"));
// 或者
Instant instant1 =  LocalDateTime.now().toInstant(ZoneOffset.ofHours(8));

// Instant -> LocalDateTime
LocalDateTime instantToLocalDateTime = LocalDateTime.ofInstant(Instant.now(), ZoneId.systemDefault());
```

### String 和 LocalDateTime 互转

```java
// String -> LocalDateTime
LocalDateTime stringToLocalDateTime = LocalDateTime.parse("2018-03-11 15:30:11", DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

// LocalDateTime -> String
String localDateTimeToString = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
```

### String 和 Date 互转

```java
// String -> Date
Date stringToDate = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse("2018-03-11 15:30:11");

//Date -> String
String dateToString = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
```

### Timestamp 和 LocalDateTime 互转

```java
// Timestamp -> LocalDateTime
LocalDateTime timeStampToLocalDateTime = LocalDateTime.ofInstant(new Timestamp(1520754566856L).toInstant(), ZoneId.systemDefault());

// LocalDateTime -> TimeStamp
Timestamp localDateTimeToTimeStamp = Timestamp.valueOf(LocalDateTime.now());
```

### Timestamp 和 Date 互转

```java
// Timestamp -> Date
Date timestampToDate = Date.from(new Timestamp(1520754566856L).toInstant());

// Date -> LocalDateTime
LocalDateTime dateToLocalDateTime = LocalDateTime.ofInstant(new Date().toInstant(), ZoneId.systemDefault());
```

**参考**

[Java 8 日期时间 API 指南 \| Java 8 教程汇总](https://wizardforcel.gitbooks.io/java8-tutorials/content/Java%208%20%E6%97%A5%E6%9C%9F%E6%97%B6%E9%97%B4%20API%20%E6%8C%87%E5%8D%97.html)

[Java8新特性之日期和时间 \- mrjade \- 博客园](https://www.cnblogs.com/mrjade/p/11527326.html)

[Java 8新特性（四）：新的时间和日期API \| 一书生VOID的博客](https://lw900925.github.io/java/java8-newtime-api.html)

[Java8新特性总结 \-6\.Date/Time API\_java\_BlueKitty的博客\-CSDN博客](https://blog.csdn.net/xingbaozhen1210/article/details/79399454)

[Java8新特性整理之新的时间和日期API（终章）\_java\_一大三千的博客\-CSDN博客](https://blog.csdn.net/u011726984/article/details/79345847)

[Java8学习笔记：LocalDateTime、Instant 和 OffsetDateTime 相互转换\_java\_山鬼谣的专栏\-CSDN博客](https://blog.csdn.net/u013066244/article/details/96443952)

---

<div style="text-align:center">求关注、分享、在看！！！
  你的支持是我创作最大的动力。</div>

![](https://image-hosting-lan.oss-cn-beijing.aliyuncs.com/qrcode_for_hbh.jpg)

