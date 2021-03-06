转自：[Redis实现限流器Lua脚本 \| INCEPTION](https://ljd0620.github.io/2019/02/24/Redis%E5%AE%9E%E7%8E%B0%E9%99%90%E6%B5%81%E5%99%A8Lua%E8%84%9A%E6%9C%AC/#%E8%BF%90%E8%A1%8C%E6%AD%A5%E9%AA%A4)

### 算法原理

系统以恒定的速率产生令牌，然后把令牌放到令牌桶中，令牌桶有一个容量，当令牌桶满了的时候，再向其中放入的令牌会被丢弃；当想要处理一个请求的时候，需要从令牌桶中取出一个令牌，如果此时令牌桶中没有令牌，则拒绝该请求。

### 数据结构

采用Hash结构存储，字段定义如下：

| 名称      | 含义                   |
| --------- | ---------------------- |
| capacity  | 令牌桶容量             |
| remain    | 剩余令牌数             |
| period    | 时间窗口大小（秒）     |
| quota     | 时间窗口内的限额       |
| timestamp | 生成令牌的时间戳（秒） |

### 脚本代码

```
-- lua in redis

redis.replicate_commands()

local key = KEYS[1] -- 令牌桶标识
local capacity = tonumber(ARGV[1]) -- 最大容量
local quota = tonumber(ARGV[2]) -- 时间窗口内的限额
local period = tonumber(ARGV[3]) -- 时间窗口大小（秒）
local quantity = tonumber(ARGV[4]) or 1 -- 需要的令牌数量，默认为1
local timestamp = tonumber(redis.call('time')[1]) -- 当前时间戳

assert(type(capacity) == "number", "capacity is not a number!")
assert(type(quota) == "number", "quota is not a number!")
assert(type(period) == "number", "period is not a number!")
assert(type(quantity) == "number", "quantity is not a number!")

-- 第一次请求时创建令牌桶
if (redis.call('exists', key) == 0) then
    redis.call('hmset', key, 'remain', capacity, 'timestamp', timestamp)
else
    -- 计算从上次生成到现在这段时间应该生成的令牌数
    local remain = tonumber(redis.call('hget', key, 'remain'))
    local last_reset = tonumber(redis.call('hget', key, 'timestamp'))
    local delta_quota = math.floor(((timestamp - last_reset) / period) * quota)
    if (delta_quota > 0) then
        remain = remain + delta_quota
        if (remain > capacity) then
            remain = capacity
        end
        redis.call('hmset', key, 'remain', remain, 'timestamp', timestamp)
    end
end

-- 支持动态调整容量和令牌生成速率
redis.call('hmset', key, 'capacity', capacity, 'quota', quota, 'period', period);

local result = {} -- 返回的结果集
local remain = tonumber(redis.call('hget', key, 'remain'))
if (remain < quantity) then
    result = {1, capacity, remain}
else
    result = {0, capacity, remain - quantity}
    redis.call('hincrby', key, 'remain', -quantity)
end

return result
```

### 运行步骤

将上面的代码保存到rate_limiter.lua文件。

```
$ vi rate_limiter.lua
```



将lua脚本文件加载到redis中，返回一个sha值。

```
$ redis-cli script load "$(cat rate_limiter.lua)"
"ea8de8016cf04dce431aa9973b8ffe515e06f42a"
```



在redis客户端中执行evalsha命令，传入步骤2生成的sha值。

```
redis> evalsha ea8de8016cf04dce431aa9973b8ffe515e06f42a 1 ratelimiter 100 30 60
1) (integer) 0      # 未限流
2) (integer) 100    # 容量100
3) (integer) 99     # 当前剩余99
```



连续执行几次相同的命令，观察效果。

```
redis> evalsha ea8de8016cf04dce431aa9973b8ffe515e06f42a 1 ratelimiter 10 10 60 5
1) (integer) 0      # 未限流
2) (integer) 10     # 容量10
3) (integer) 5      # 当前剩余5
redis> evalsha ea8de8016cf04dce431aa9973b8ffe515e06f42a 1 ratelimiter 10 10 60 5
1) (integer) 0      # 未限流
2) (integer) 10     # 容量10
3) (integer) 0      # 当前剩余0
redis> evalsha ea8de8016cf04dce431aa9973b8ffe515e06f42a 1 ratelimiter 10 10 60 5
1) (integer) 1      # 已限流
2) (integer) 10     # 容量10
3) (integer) 0      # 当前剩余0
```



### 参考链接

- [Redis 命令参考](http://redisdoc.com/)
- [Redis 深度历险：核心原理与应用实践](https://juejin.im/book/5afc2e5f6fb9a07a9b362527/section/5b44aaf75188251a9f248c4c)
- [接口限流算法：漏桶算法&令牌桶算法](https://segmentfault.com/a/1190000015967922)