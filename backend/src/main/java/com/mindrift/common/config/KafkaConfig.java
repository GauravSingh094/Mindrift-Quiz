package com.mindrift.common.config;

import com.mindrift.leaderboard.dto.QuizScoredEvent;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.support.serializer.JsonSerializer;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableKafka
public class KafkaConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    // 1. Topic Creation Blueprints
    @Bean
    public NewTopic quizEvents() {
        return TopicBuilder.name("quiz-events").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic quizEventsRetry() {
        return TopicBuilder.name("quiz-events-retry").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic quizEventsDlq() {
        return TopicBuilder.name("quiz-events-dlq").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic competitionEvents() {
        return TopicBuilder.name("competition-events").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic competitionEventsRetry() {
        return TopicBuilder.name("competition-events-retry").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic competitionEventsDlq() {
        return TopicBuilder.name("competition-events-dlq").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic leaderboardEvents() {
        return TopicBuilder.name("leaderboard-events").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic quizScored() {
        return TopicBuilder.name("quiz-scored").partitions(6).replicas(1).build();
    }

    @Bean
    public NewTopic quizScoredDlq() {
        return TopicBuilder.name("quiz-scored-dlq").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic integrityEvents() {
        return TopicBuilder.name("integrity-events").partitions(6).replicas(1).build();
    }

    @Bean
    public NewTopic integrityEventsDlq() {
        return TopicBuilder.name("integrity-events-dlq").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic analyticsEvents() {
        return TopicBuilder.name("analytics-events").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic analyticsEventsRetry() {
        return TopicBuilder.name("analytics-events-retry").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic analyticsEventsDlq() {
        return TopicBuilder.name("analytics-events-dlq").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic notificationEvents() {
        return TopicBuilder.name("notification-events").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic notificationEventsRetry() {
        return TopicBuilder.name("notification-events-retry").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic notificationEventsDlq() {
        return TopicBuilder.name("notification-events-dlq").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic auditEvents() {
        return TopicBuilder.name("audit-events").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic aiEvents() {
        return TopicBuilder.name("ai-events").partitions(3).replicas(1).build();
    }

    // 2. Producer Configuration
    @Bean
    public ProducerFactory<String, String> producerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.ACKS_CONFIG, "all"); // Enforce transaction confirm checks
        return new DefaultKafkaProducerFactory<>(config);
    }

    @Bean
    public KafkaTemplate<String, String> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }

    /** Typed JSON producer factory for structured domain events (e.g. QuizScoredEvent). */
    @Bean
    public ProducerFactory<String, QuizScoredEvent> quizScoredProducerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        config.put(ProducerConfig.ACKS_CONFIG, "all");
        config.put(JsonSerializer.ADD_TYPE_INFO_HEADERS, false);
        return new DefaultKafkaProducerFactory<>(config);
    }

    @Bean
    public KafkaTemplate<String, QuizScoredEvent> quizScoredKafkaTemplate() {
        return new KafkaTemplate<>(quizScoredProducerFactory());
    }

    /** Generic Object producer factory for domain events (integrity, analytics, notifications). */
    @Bean
    public ProducerFactory<String, Object> objectProducerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        config.put(ProducerConfig.ACKS_CONFIG, "all");
        config.put(JsonSerializer.ADD_TYPE_INFO_HEADERS, false);
        return new DefaultKafkaProducerFactory<>(config);
    }

    @Bean
    public KafkaTemplate<String, Object> objectKafkaTemplate() {
        return new KafkaTemplate<>(objectProducerFactory());
    }

    // 3. Consumer Configuration
    @Bean
    public ConsumerFactory<String, String> consumerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        config.put(ConsumerConfig.GROUP_ID_CONFIG, "mindrift-services");
        config.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        return new DefaultKafkaConsumerFactory<>(config);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, String> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        return factory;
    }

    /** JSON consumer factory for the quiz-scored topic (leaderboard consumer group). */
    @Bean
    public ConsumerFactory<String, QuizScoredEvent> quizScoredConsumerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        config.put(ConsumerConfig.GROUP_ID_CONFIG, "leaderboard-group");
        config.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        config.put(JsonDeserializer.TRUSTED_PACKAGES, "com.mindrift.leaderboard.dto");
        config.put(JsonDeserializer.VALUE_DEFAULT_TYPE, QuizScoredEvent.class.getName());
        return new DefaultKafkaConsumerFactory<>(config);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, QuizScoredEvent> quizScoredListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, QuizScoredEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(quizScoredConsumerFactory());
        factory.setConcurrency(3);
        return factory;
    }
}
