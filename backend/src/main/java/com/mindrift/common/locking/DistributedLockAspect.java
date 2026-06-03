package com.mindrift.common.locking;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.expression.EvaluationContext;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.concurrent.TimeUnit;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class DistributedLockAspect {

    private final RedissonClient redissonClient;
    private final ExpressionParser parser = new SpelExpressionParser();

    @Around("@annotation(distributedLock)")
    public Object lock(ProceedingJoinPoint joinPoint, DistributedLock distributedLock) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();

        EvaluationContext context = new StandardEvaluationContext();
        String[] parameterNames = signature.getParameterNames();
        Object[] args = joinPoint.getArgs();
        if (parameterNames != null) {
            for (int i = 0; i < parameterNames.length; i++) {
                context.setVariable(parameterNames[i], args[i]);
            }
        }

        String keyExpression = distributedLock.key();
        String lockKey;
        try {
            lockKey = parser.parseExpression(keyExpression).getValue(context, String.class);
        } catch (Exception e) {
            lockKey = keyExpression; // Fallback to raw string value
        }
        
        if (lockKey == null) {
            lockKey = keyExpression;
        }

        RLock lock = redissonClient.getLock("mindrift:locks:" + lockKey);
        long waitTime = distributedLock.waitTimeMs();
        long leaseTime = distributedLock.leaseTimeMs();

        log.debug("AOP attempting to acquire lock: '{}' for method: {}", lockKey, method.getName());
        boolean acquired = lock.tryLock(waitTime, leaseTime, TimeUnit.MILLISECONDS);
        if (!acquired) {
            log.warn("AOP failed to acquire lock: '{}' for method: {}", lockKey, method.getName());
            throw new RuntimeException("Concurrent modification blocked: Could not acquire lock for key " + lockKey);
        }

        log.debug("AOP acquired lock successfully: '{}'", lockKey);
        try {
            return joinPoint.proceed();
        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
                log.debug("AOP released lock successfully: '{}'", lockKey);
            }
        }
    }
}
