package com.mindrift.common.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import org.springframework.context.annotation.Primary;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Slf4j
@Component("localStorageProvider")
@Primary
@ConditionalOnProperty(name = "storage.provider", havingValue = "local", matchIfMissing = true)
public class LocalStorageProvider implements StorageProvider {

    private final Path storageDirectory;

    public LocalStorageProvider(@Value("${storage.local.dir:./storage_uploads}") String dirPath) {
        this.storageDirectory = Paths.get(dirPath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.storageDirectory);
            log.info("Initialized local storage provider in path: {}", this.storageDirectory);
        } catch (IOException e) {
            log.error("Failed to create local storage directory: {}", dirPath, e);
            throw new RuntimeException("Could not initialize local storage path", e);
        }
    }

    @Override
    public String uploadFile(String key, byte[] bytes, String contentType) {
        log.info("Uploading local file with key: {}", key);
        Path targetPath = this.storageDirectory.resolve(key).normalize();
        // Prevent path traversal
        if (!targetPath.startsWith(this.storageDirectory)) {
            throw new IllegalArgumentException("Invalid file key: path traversal attempt detected");
        }
        try {
            Files.createDirectories(targetPath.getParent());
            Files.write(targetPath, bytes);
            log.info("Local file saved: {}", targetPath);
            return targetPath.toUri().toString();
        } catch (IOException e) {
            log.error("Error writing file locally: {}", key, e);
            throw new RuntimeException("Local file upload failed", e);
        }
    }

    @Override
    public byte[] downloadFile(String key) {
        log.info("Downloading local file with key: {}", key);
        Path targetPath = this.storageDirectory.resolve(key).normalize();
        if (!targetPath.startsWith(this.storageDirectory)) {
            throw new IllegalArgumentException("Invalid file key: path traversal attempt detected");
        }
        try {
            if (!Files.exists(targetPath)) {
                throw new RuntimeException("File not found: " + key);
            }
            return Files.readAllBytes(targetPath);
        } catch (IOException e) {
            log.error("Error reading file locally: {}", key, e);
            throw new RuntimeException("Local file download failed", e);
        }
    }

    @Override
    public void deleteFile(String key) {
        log.info("Deleting local file with key: {}", key);
        Path targetPath = this.storageDirectory.resolve(key).normalize();
        if (!targetPath.startsWith(this.storageDirectory)) {
            throw new IllegalArgumentException("Invalid file key: path traversal attempt detected");
        }
        try {
            Files.deleteIfExists(targetPath);
            log.info("Deleted local file: {}", targetPath);
        } catch (IOException e) {
            log.error("Error deleting file locally: {}", key, e);
            throw new RuntimeException("Local file deletion failed", e);
        }
    }

    @Override
    public boolean exists(String key) {
        log.info("Checking if local file exists with key: {}", key);
        Path targetPath = this.storageDirectory.resolve(key).normalize();
        if (!targetPath.startsWith(this.storageDirectory)) {
            throw new IllegalArgumentException("Invalid file key: path traversal attempt detected");
        }
        return Files.exists(targetPath);
    }

    @Override
    public String generatePublicUrl(String key) {
        log.info("Generating public URL for local file with key: {}", key);
        Path targetPath = this.storageDirectory.resolve(key).normalize();
        if (!targetPath.startsWith(this.storageDirectory)) {
            throw new IllegalArgumentException("Invalid file key: path traversal attempt detected");
        }
        return targetPath.toUri().toString();
    }

    @Override
    public String generateSignedUrl(String key, int expirySeconds) {
        log.info("Generating signed URL (local fallback) for local file with key: {}, expiry: {}s", key, expirySeconds);
        return generatePublicUrl(key);
    }
}
