# Stage 1: Dependency Caching and Application Compilation
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

# Stage 2: Minimalist JRE Runtime Image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Enforce security best practices: Run under a non-root system user
RUN addgroup -S SreAdmin && adduser -S SreAdmin -G SreAdmin
USER SreAdmin
COPY --from=builder /app/target/mindrift-backend-1.0.0.jar mindrift.jar

EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=prod

# JVM Tuning for Production Containers (optimized G1 Garbage Collector)
ENTRYPOINT ["java", \
            "-XX:+UseG1GC", \
            "-XX:MaxRAMPercentage=75.0", \
            "-XX:G1ReservePercent=15", \
            "-XX:InitiatingHeapOccupancyPercent=45", \
            "-jar", "mindrift.jar"]
