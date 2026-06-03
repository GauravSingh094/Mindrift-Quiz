package com.mindrift.common.locking;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.Callable;

@Slf4j
@Service
@RequiredArgsConstructor
public class DistributedLockService {

    private final RedissonClient redissonClient;

    public boolean executeWithLock(String lockKey, long waitTimeMs, long leaseTimeMs, Runnable action) {
        RLock lock = redissonClient.getLock(lockKey);
        try {
            log.debug("Attempting to acquire distributed lock for key: {}", lockKey);
            boolean acquired = lock.tryLock(waitTimeMs, leaseTimeMs, TimeUnit.MILLISECONDS);
            if (acquired) {
                log.debug("Distributed lock acquired successfully for key: {}", lockKey);
                try {
                    action.run();
                    return true;
                } finally {
                    if (lock.isHeldByCurrentThread()) {
                        lock.unlock();
                        log.debug("Released distributed lock for key: {}", lockKey);
                    }
                }
            } else {
                log.warn("Failed to acquire distributed lock for key: {} within {} ms", lockKey, waitTimeMs);
                return false;
            }
        } catch (InterruptedException e) {
            log.error("Lock acquisition thread was interrupted for key: {}", lockKey, e);
            Thread.currentThread().interrupt();
            return false;
        }
    }

    public <T> T executeWithLock(String lockKey, long waitTimeMs, long leaseTimeMs, Callable<T> action) throws Exception {
        RLock lock = redissonClient.getLock(lockKey);
        try {
            log.debug("Attempting to acquire distributed lock (with return type) for key: {}", lockKey);
            boolean acquired = lock.tryLock(waitTimeMs, leaseTimeMs, TimeUnit.MILLISECONDS);
            if (acquired) {
                log.debug("Distributed lock acquired successfully for key: {}", lockKey);
                try {
                    return action.call();
                } finally {
                    if (lock.isHeldByCurrentThread()) {
                        lock.unlock();
                        log.debug("Released distributed lock for key: {}", lockKey);
                    }
                }
            } else {
                log.warn("Failed to acquire distributed lock for key: {} within {} ms", lockKey, waitTimeMs);
                throw new RuntimeException("Could not acquire lock for key: " + lockKey);
            }
        } catch (InterruptedException e) {
            log.error("Lock acquisition thread was interrupted for key: {}", lockKey, e);
            Thread.currentThread().interrupt();
            throw e;
        }
    }
}
