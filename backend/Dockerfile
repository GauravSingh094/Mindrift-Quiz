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
RUN mkdir -p /app/logs && chown -R SreAdmin:SreAdmin /app
USER SreAdmin
COPY --chown=SreAdmin:SreAdmin --from=builder /app/target/mindrift-backend-1.0.0.jar mindrift.jar

EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=prod

# JVM Tuning for Low-Memory (512MB) Production Containers
# - Uses Serial Garbage Collector (lowest footprint)
# - Caps heap dynamically and sets Metaspace / Stack limits to prevent out of memory
ENTRYPOINT ["java", \
            "-XX:+UseSerialGC", \
            "-Xmx200m", \
            "-XX:MaxMetaspaceSize=100m", \
            "-Xss256k", \
            "-jar", "mindrift.jar"]
