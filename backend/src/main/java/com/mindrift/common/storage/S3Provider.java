package com.mindrift.common.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Slf4j
@Component("s3StorageProvider")
public class S3Provider implements StorageProvider {

    private final S3Client s3Client;
    private final String bucketName;

    public S3Provider(
            @Value("${storage.s3.bucket:mindrift-s3-bucket}") String bucketName,
            @Value("${storage.s3.region:us-east-1}") String region,
            @Value("${storage.s3.access-key:mock}") String accessKey,
            @Value("${storage.s3.secret-key:mock}") String secretKey) {
        
        this.bucketName = bucketName;
        
        if ("mock".equals(accessKey) || "mock".equals(secretKey)) {
            // Lazy fallback for development/testing environments when cloud config is absent
            log.warn("S3 Storage Provider initialized with mock credentials. Calls will fail unless overridden.");
            this.s3Client = null;
        } else {
            AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);
            this.s3Client = S3Client.builder()
                    .region(Region.of(region))
                    .credentialsProvider(StaticCredentialsProvider.create(credentials))
                    .build();
            log.info("Initialized AWS S3 storage provider for bucket: {}", bucketName);
        }
    }

    @Override
    public String uploadFile(String key, byte[] bytes, String contentType) {
        log.info("Uploading file to S3 with key: {}", key);
        if (s3Client == null) {
            throw new IllegalStateException("S3 client is not configured");
        }
        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(contentType)
                    .build();
            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(bytes));
            log.info("File uploaded to S3 successfully with key: {}", key);
            return String.format("https://%s.s3.amazonaws.com/%s", bucketName, key);
        } catch (Exception e) {
            log.error("Failed to upload file to S3: {}", key, e);
            throw new RuntimeException("S3 file upload failed", e);
        }
    }

    @Override
    public byte[] downloadFile(String key) {
        log.info("Downloading file from S3 with key: {}", key);
        if (s3Client == null) {
            throw new IllegalStateException("S3 client is not configured");
        }
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
            return s3Client.getObject(getObjectRequest).readAllBytes();
        } catch (Exception e) {
            log.error("Failed to download file from S3: {}", key, e);
            throw new RuntimeException("S3 file download failed", e);
        }
    }

    @Override
    public void deleteFile(String key) {
        log.info("Deleting file from S3 with key: {}", key);
        if (s3Client == null) {
            throw new IllegalStateException("S3 client is not configured");
        }
        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
            s3Client.deleteObject(deleteObjectRequest);
            log.info("Deleted file from S3: {}", key);
        } catch (Exception e) {
            log.error("Failed to delete file from S3: {}", key, e);
            throw new RuntimeException("S3 file deletion failed", e);
        }
    }

    @Override
    public boolean exists(String key) {
        log.info("Checking if file exists on S3 with key: {}", key);
        if (s3Client == null) {
            throw new IllegalStateException("S3 client is not configured");
        }
        try {
            s3Client.headObject(software.amazon.awssdk.services.s3.model.HeadObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build());
            return true;
        } catch (software.amazon.awssdk.services.s3.model.NoSuchKeyException e) {
            return false;
        } catch (Exception e) {
            log.error("Failed to check file existence on S3: {}", key, e);
            throw new RuntimeException("S3 file existence check failed", e);
        }
    }

    @Override
    public String generatePublicUrl(String key) {
        return String.format("https://%s.s3.amazonaws.com/%s", bucketName, key);
    }

    @Override
    public String generateSignedUrl(String key, int expirySeconds) {
        return generatePublicUrl(key);
    }
}
