package com.mindrift.common.storage;

public interface StorageProvider {
    String uploadFile(String key, byte[] bytes, String contentType);
    byte[] downloadFile(String key);
    void deleteFile(String key);
    boolean exists(String key);
    String generatePublicUrl(String key);
    String generateSignedUrl(String key, int expirySeconds);
}

