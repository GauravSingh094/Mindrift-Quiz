package com.mindrift.common.idempotency;

import com.mindrift.BaseIntegrationTest;
import com.mindrift.common.locking.DistributedLockService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

public class IdempotencyAndConcurrencyTest extends BaseIntegrationTest {

    @Autowired
    private DistributedLockService lockService;

    @Test
    public void testConcurrencyDistributedLock() throws InterruptedException {
        int threadsCount = 5;
        ExecutorService executor = Executors.newFixedThreadPool(threadsCount);
        CountDownLatch latch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(threadsCount);
        AtomicInteger successCounter = new AtomicInteger(0);

        for (int i = 0; i < threadsCount; i++) {
            executor.submit(() -> {
                try {
                    latch.await();
                    boolean acquired = lockService.executeWithLock("test:concurrency:lock", 100, 2000, () -> {
                        successCounter.incrementAndGet();
                        try {
                            Thread.sleep(200);
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                        }
                    });
                } catch (Exception e) {
                    // Lock acquisition timeout is expected
                } finally {
                    finishLatch.countDown();
                }
            });
        }

        latch.countDown();
        finishLatch.await();

        // Exactly one thread should successfully execute under concurrent contention
        assertThat(successCounter.get()).isEqualTo(1);
    }
}
