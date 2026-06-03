package com.mindrift.common.monitoring;

import com.mindrift.BaseIntegrationTest;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;

public class MonitoringIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private MonitoringService monitoringService;

    @Autowired
    private MeterRegistry meterRegistry;

    @Test
    public void testCustomMetricsReporting() {
        monitoringService.recordDatabaseLatency(120L);
        monitoringService.recordRedisLatency(15L);

        var dbTimer = meterRegistry.find("mindrift.db.latency").timer();
        var redisTimer = meterRegistry.find("mindrift.redis.latency").timer();

        assertThat(dbTimer).isNotNull();
        assertThat(redisTimer).isNotNull();

        assertThat(dbTimer.count()).isEqualTo(1L);
        assertThat(redisTimer.count()).isEqualTo(1L);
    }
}
