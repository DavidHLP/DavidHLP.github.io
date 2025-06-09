---
title: Redis工具类实现
published: 2025-06-09
tags: [Redis, Java]
category: Redis
draft: false
---

# Redis工具类实现

- `RedisCacheVo`

```java
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RedisCacheVo<T> implements Serializable {
    private T data;
    private LocalDateTime cacheExpireTime;
} private LocalDateTime cacheExpireTime;
}
```

- `RedisCache`

```java
package com.redis.api.redis.utils;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import org.redisson.api.RLock;
import org.redisson.api.RReadWriteLock;
import org.redisson.api.RedissonClient;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import cn.hutool.core.lang.TypeReference;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Redis 工具类
 * 使用 RedissonClient 处理分布式锁
 * 使用 RedisTemplate 处理基础缓存操作
 */
@SuppressWarnings(value = { "unchecked", "rawtypes" })
@Slf4j
@Component
@RequiredArgsConstructor
public class RedisCache {
    private final RedisTemplate redisTemplate;
    private final RedissonClient redissonClient;

    // 锁的默认超时时间，单位：秒
    private static final long DEFAULT_LEASE_TIME = 30;
    private static final long DEFAULT_WAIT_TIME = 10;
    private static final long CACHE_NULL_TTL = 2L; // 缓存空值的过期时间,单位：分钟
    private static final ExecutorService CACHE_REBUILD_EXECUTOR = Executors.newFixedThreadPool(10);
    private static final DefaultRedisScript<Long> UNLOCK_SCRIPT;

    static {
        UNLOCK_SCRIPT = new DefaultRedisScript<>();
        UNLOCK_SCRIPT.setLocation(new ClassPathResource("unlock.lua"));
        UNLOCK_SCRIPT.setResultType(Long.class);
    }

    /**
     * 使用lua脚本删除
     */
    public void useLuaDelete(String key, String value) {
        redisTemplate.execute(
                UNLOCK_SCRIPT,
                Collections.singletonList(key),
                value);
    }

    /**
     * redis自增
     */
    public Long increment(String keyPrefix, String date) {
        return (Long) redisTemplate.opsForValue().increment("icr:" + keyPrefix + ":" + date);
    }

    /**
     * 缓存基本的对象
     */
    public <T> void setCacheObject(final String key, final T value) {
        redisTemplate.opsForValue().set(key, value);
    }

    /**
     * 缓存基本的对象（带过期时间）
     */
    public <T> Boolean setCacheObject(final String key, final T value, final long timeout, final TimeUnit timeUnit) {
        redisTemplate.opsForValue().set(key, value, timeout, timeUnit);
        return Boolean.TRUE;
    }

    /**
     * 设置有效时间
     */
    public boolean expire(final String key, final long timeout) {
        return expire(key, timeout, TimeUnit.SECONDS);
    }

    /**
     * 设置有效时间
     */
    public boolean expire(final String key, final long timeout, final TimeUnit unit) {
        return Boolean.TRUE.equals(redisTemplate.expire(key, timeout, unit));
    }

    /**
     * 获取有效时间
     */
    public long getExpire(final String key) {
        return redisTemplate.getExpire(key);
    }

    /**
     * 判断 key是否存在
     */
    public Boolean hasKey(String key) {
        return redisTemplate.hasKey(key);
    }

    /**
     * 获得缓存的基本对象
     */
    public <T> T getCacheObject(final String key) {
        return (T) redisTemplate.opsForValue().get(key);
    }

    /**
     * 删除单个对象
     */
    public boolean deleteObject(final String key) {
        return Boolean.TRUE.equals(redisTemplate.delete(key));
    }

    /**
     * 删除集合对象
     */
    public boolean deleteObject(final Collection collection) {
        return redisTemplate.delete(collection) > 0;
    }

    /**
     * 获取分布式锁
     */
    public boolean tryLock(String lockKey, long waitTime, long leaseTime, TimeUnit unit) {
        try {
            return redissonClient.getLock(lockKey).tryLock(waitTime, leaseTime, unit);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("获取分布式锁[{}]失败：{}", lockKey, e.getMessage(), e);
            return false;
        } catch (Exception e) {
            log.error("获取分布式锁[{}]发生异常：{}", lockKey, e.getMessage(), e);
            return false;
        }
    }

    /**
     * 获取分布式锁（使用默认参数）
     */
    public boolean tryLock(String lockKey) {
        return tryLock(lockKey, DEFAULT_WAIT_TIME, DEFAULT_LEASE_TIME, TimeUnit.SECONDS);
    }

    /**
     * 释放分布式锁
     */
    public void unlock(String lockKey) {
        try {
            RLock lock = redissonClient.getLock(lockKey);
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        } catch (Exception e) {
            log.error("释放分布式锁[{}]发生异常：{}", lockKey, e.getMessage(), e);
        }
    }

    /**
     * 获取读锁
     */
    public boolean tryReadLock(String lockKey, long waitTime, long leaseTime, TimeUnit unit) {
        try {
            return redissonClient.getReadWriteLock(lockKey).readLock().tryLock(waitTime, leaseTime, unit);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("获取读锁[{}]失败：{}", lockKey, e.getMessage(), e);
            return false;
        } catch (Exception e) {
            log.error("获取读锁[{}]发生异常：{}", lockKey, e.getMessage(), e);
            return false;
        }
    }

    /**
     * 获取读锁（使用默认参数）
     */
    public boolean tryReadLock(String lockKey) {
        return tryReadLock(lockKey, DEFAULT_WAIT_TIME, DEFAULT_LEASE_TIME, TimeUnit.SECONDS);
    }

    /**
     * 获取写锁
     */
    public boolean tryWriteLock(String lockKey, long waitTime, long leaseTime, TimeUnit unit) {
        try {
            return redissonClient.getReadWriteLock(lockKey).writeLock().tryLock(waitTime, leaseTime, unit);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("获取写锁[{}]失败：{}", lockKey, e.getMessage(), e);
            return false;
        } catch (Exception e) {
            log.error("获取写锁[{}]发生异常：{}", lockKey, e.getMessage(), e);
            return false;
        }
    }

    /**
     * 获取写锁（使用默认参数）
     */
    public boolean tryWriteLock(String lockKey) {
        return tryWriteLock(lockKey, DEFAULT_WAIT_TIME, DEFAULT_LEASE_TIME, TimeUnit.SECONDS);
    }

    /**
     * 释放读写锁
     *
     * @param lockKey     锁的key
     * @param isWriteLock 是否是写锁
     */
    public void unlockReadWriteLock(String lockKey, boolean isWriteLock) {
        try {
            RReadWriteLock readWriteLock = redissonClient.getReadWriteLock(lockKey);
            if (isWriteLock) {
                RLock writeLock = readWriteLock.writeLock();
                if (writeLock.isHeldByCurrentThread()) {
                    writeLock.unlock();
                }
            } else {
                RLock readLock = readWriteLock.readLock();
                if (readLock.isHeldByCurrentThread()) {
                    readLock.unlock();
                }
            }
        } catch (Exception e) {
            log.error("释放{}锁[{}]发生异常：{}", isWriteLock ? "写" : "读", lockKey, e.getMessage(), e);
        }
    }

    /**
     * 缓存List数据
     */
    public <T> long setCacheList(final String key, final List<T> dataList) {
        Long count = redisTemplate.opsForList().rightPushAll(key, dataList);
        return count == null ? 0 : count;
    }

    /**
     * 获得缓存的list对象
     */
    public <T> List<T> getCacheList(final String key) {
        return redisTemplate.opsForList().range(key, 0, -1);
    }

    /**
     * 缓存Set
     */
    public <T> void setCacheSet(final String key, final Set<T> dataSet) {
        redisTemplate.opsForSet().add(key, dataSet.toArray());
    }

    /**
     * 获得缓存的set
     */
    public <T> Set<T> getCacheSet(final String key) {
        return redisTemplate.opsForSet().members(key);
    }

    /**
     * 设置缓存Map
     */
    public void setCacheMap(String key, Map<String, Object> data, final long timeout, final TimeUnit unit) {
        redisTemplate.opsForHash().putAll(key, data);
        if (timeout > 0) {
            redisTemplate.expire(key, timeout, unit);
        }
    }

    /**
     * 获取缓存Map
     */
    public Map<String, Object> getCacheMap(String key) {
        return redisTemplate.opsForHash().entries(key);
    }

    /**
     * 往Hash中存入数据
     */
    public <T> void setCacheMapValue(final String key, final String hKey, final T value) {
        redisTemplate.opsForHash().put(key, hKey, value);
    }

    /**
     * 获取Hash中的数据
     */
    public <T> T getCacheMapValue(final String key, final String hKey) {
        return (T) redisTemplate.opsForHash().get(key, hKey);
    }

    /**
     * 获取多个Hash中的数据
     */
    public <T> List<T> getMultiCacheMapValue(final String key, final Collection<Object> hKeys) {
        return redisTemplate.opsForHash().multiGet(key, hKeys);
    }

    /**
     * 删除Hash中的某条数据
     */
    public boolean deleteCacheMapValue(final String key, final String hKey) {
        return redisTemplate.opsForHash().delete(key, hKey) > 0;
    }

    /**
     * 获得缓存的基本对象列表
     */
    public Collection<String> keys(final String pattern) {
        return redisTemplate.keys(pattern);
    }

    /**
     * 设置带逻辑过期的缓存
     */
    public <T> void setWithLogicalExpire(String key, T value, Long time, TimeUnit unit) {
        RedisCacheVo<T> redisCacheVo = RedisCacheVo.<T>builder()
                .data(value)
                .cacheExpireTime(LocalDateTime.now().plusSeconds(unit.toSeconds(time)))
                .build();
        redisTemplate.opsForValue().set(key, JSONUtil.toJsonStr(redisCacheVo));
    }

    /**
     * 缓存加载函数式接口
     */
    @FunctionalInterface
    public interface CacheLoader<T> {
        T load();
        /**
         * 创建一个空的 T 类型实例
         * 子类可以覆盖此方法以提供特定的空实例
         */
        default T emptyInstance() {
            try {
                // 尝试通过反射创建实例
                return (T) new Object();
            } catch (Exception e) {
                return null;
            }
        }
    }

    /**
     * 使用 Redisson 分布式锁解决缓存击穿问题
     */
    public <T> T getWithMutex(final String key, final String lockKey,
                             final long waitTime, final long leaseTime,
                             final long cacheTimeout, final TimeUnit timeUnit,
                             final CacheLoader<T> loader) {
        // 1. 先查缓存
        T value = getCacheObject(key);
        if (value != null) {
            return value;
        }

        // 2. 缓存未命中，使用 Redisson 获取分布式锁
        try {
            // 尝试获取锁
            if (tryLock(lockKey, waitTime, leaseTime, timeUnit)) {
                try {
                    // 3. 获取锁成功,再次检查缓存(双重检查)
                    value = getCacheObject(key);
                    if (value != null) {
                        return value;
                    }

                    try {
                        // 4. 从数据源加载数据
                        value = loader.load();
                        // 5. 设置缓存,空数据也缓存,防止缓存穿透
                        T emptyValue = loader.emptyInstance();
                        setCacheObject(key, value != null ? value : emptyValue,
                                value != null ? cacheTimeout : CACHE_NULL_TTL,
                                timeUnit);
                        return value;
                    } catch (Exception e) {
                        log.error("从数据源加载数据时发生异常, key: {}", key, e);
                        throw new RuntimeException("加载数据失败", e);
                    }
                } finally {
                    // 释放锁
                    unlock(lockKey);
                }
            } else {
                // 6. 获取锁失败，等待后重试
                log.warn("获取分布式锁失败, 准备重试, lockKey: {}", lockKey);
                try {
                    Thread.sleep(100);
                    return getWithMutex(key, lockKey, waitTime, leaseTime, cacheTimeout, timeUnit, loader);
                } catch (InterruptedException e) {
                    log.error("重试获取缓存时线程被中断, key: {}", key, e);
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("获取缓存时线程被中断", e);
                }
            }
        } catch (Exception e) {
            log.error("获取缓存失败, key: {}", key, e);
            throw new RuntimeException("获取缓存失败", e);
        }
    }

    /**
     * 使用 Redisson 分布式锁解决缓存击穿问题（使用默认等待时间和租约时间）
     */
    public <T> T getWithMutex(final String key, final String lockKey,
                             final long cacheTimeout, final TimeUnit timeUnit,
                             final CacheLoader<T> loader) {
        return getWithMutex(key, lockKey, DEFAULT_WAIT_TIME, DEFAULT_LEASE_TIME,
                            cacheTimeout, timeUnit, loader);
    }

    /**
     * 使用逻辑过期时间获取缓存，适用于热点数据缓存重建
     */
    public <T> T getWithLogicalExpire(final String key, final String lockKey,
            final long waitTime, final long leaseTime, final long cacheTimeout,
            final TimeUnit timeUnit, final CacheLoader<T> loader) {
        // 1. 查询缓存
        String json = getCacheObject(key);
        if (StrUtil.isBlank(json)) {
            log.debug("缓存不存在, key: {}", key);
            return null;
        }

        // 2. 反序列化缓存数据
        RedisCacheVo<T> cacheVo = null;
        try {
            cacheVo = JSONUtil.toBean(json, new TypeReference<RedisCacheVo<T>>() {
            }, false);
            if (cacheVo == null || cacheVo.getData() == null) {
                log.warn("缓存数据为空, key: {}", key);
                return null;
            }

            // 3. 检查缓存是否过期
            if (cacheVo.getCacheExpireTime().isAfter(LocalDateTime.now())) {
                log.debug("缓存未过期, 直接返回, key: {}", key);
                return cacheVo.getData();
            }
        } catch (Exception e) {
            log.error("反序列化缓存数据异常, key: {}, json: {}", key, json, e);
            return null;
        }

        // 4. 缓存已过期,尝试获取分布式锁进行重建
        final T expiredData = cacheVo.getData();

        // 5. 尝试获取分布式锁
        if (!tryLock(lockKey, waitTime, leaseTime, timeUnit)) {
            log.debug("获取分布式锁失败, 返回过期数据, key: {}, lockKey: {}", key, lockKey);
            return expiredData; // 获取锁失败，返回旧数据
        }

        // 6. 获取锁成功,异步重建缓存
        asyncRebuildCache(key, lockKey, cacheTimeout, timeUnit, loader);

        // 7. 返回过期的数据
        return expiredData;
    }

    /**
     * 使用逻辑过期时间获取缓存（使用默认等待时间和租约时间）
     */
    public <T> T getWithLogicalExpire(final String key, final String lockKey,
                                     final long cacheTimeout, final TimeUnit timeUnit,
                                     final CacheLoader<T> loader) {
        return getWithLogicalExpire(key, lockKey, DEFAULT_WAIT_TIME, DEFAULT_LEASE_TIME,
                                  cacheTimeout, timeUnit, loader);
    }

    /**
     * 异步重建缓存
     */
    private <T> void asyncRebuildCache(String key, String lockKey,
                                      long cacheTimeout, TimeUnit timeUnit,
                                      CacheLoader<T> loader) {
        CACHE_REBUILD_EXECUTOR.submit(() -> {
            try {
                log.debug("开始异步重建缓存, key: {}", key);
                // 1. 加载新数据
                T newData = loader.load();

                // 2. 更新缓存
                if (newData != null) {
                    setWithLogicalExpire(key, newData, cacheTimeout, timeUnit);
                    log.debug("缓存重建成功, key: {}", key);
                } else {
                    log.warn("加载的数据为空,设置空值防止缓存穿透, key: {}", key);
                    setCacheObject(key, "", CACHE_NULL_TTL, TimeUnit.MINUTES);
                }
            } catch (Exception e) {
                log.error("缓存重建异常, key: {}", key, e);
            } finally {
                // 3. 释放锁
                unlock(lockKey);
                log.debug("释放分布式锁, lockKey: {}", lockKey);
            }
        });
    }
}
```
