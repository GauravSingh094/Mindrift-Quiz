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

import java.net.URI;

@Slf4j
@Component("cloudflareR2StorageProvider")
public class CloudflareR2Provider implements StorageProvider {

    private final S3Client s3Client;
    private final String bucketName;
    private final String publicUrlPrefix;

    public CloudflareR2Provider(
            @Value("${storage.r2.bucket:mindrift-r2-bucket}") String bucketName,
            @Value("${storage.r2.endpoint:mock}") String endpoint,
            @Value("${storage.r2.access-key:mock}") String accessKey,
            @Value("${storage.r2.secret-key:mock}") String secretKey,
            @Value("${storage.r2.public-url-prefix:https://pub-mindrift.r2.dev}") String publicUrlPrefix) {
        
        this.bucketName = bucketName;
        this.publicUrlPrefix = publicUrlPrefix;
        
        if ("mock".equals(endpoint) || "mock".equals(accessKey) || "mock".equals(secretKey)) {
            log.warn("Cloudflare R2 Storage Provider initialized with mock credentials. Calls will fail unless overridden.");
            this.s3Client = null;
        } else {
            AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);
            this.s3Client = S3Client.builder()
                    // R2 uses auto region or us-east-1 equivalent
                    .region(Region.US_EAST_1)
                    .endpointOverride(URI.create(endpoint))
                    .credentialsProvider(StaticCredentialsProvider.create(credentials))
                    .build();
            log.info("Initialized Cloudflare R2 storage provider for bucket: {} on endpoint: {}", bucketName, endpoint);
        }
    }

    @Override
    public String uploadFile(String key, byte[] bytes, String contentType) {
        log.info("Uploading file to Cloudflare R2 with key: {}", key);
        if (s3Client == null) {
            throw new IllegalStateException("Cloudflare R2 client is not configured");
        }
        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(contentType)
                    .build();
            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(bytes));
            log.info("File uploaded to Cloudflare R2 successfully: {}", key);
            return String.format("%s/%s", publicUrlPrefix, key);
        } catch (Exception e) {
            log.error("Failed to upload file to Cloudflare R2: {}", key, e);
            throw new RuntimeException("R2 file upload failed", e);
        }
    }

    @Override
    public byte[] downloadFile(String key) {
        log.info("Downloading file from Cloudflare R2 with key: {}", key);
        if (s3Client == null) {
            throw new IllegalStateException("Cloudflare R2 client is not configured");
        }
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
            return s3Client.getObject(getObjectRequest).readAllBytes();
        } catch (Exception e) {
            log.error("Failed to download file from Cloudflare R2: {}", key, e);
            throw new RuntimeException("R2 file download failed", e);
        }
    }

    @Override
    public void deleteFile(String key) {
        log.info("Deleting file from Cloudflare R2 with key: {}", key);
        if (s3Client == null) {
            throw new IllegalStateException("Cloudflare R2 client is not configured");
        }
        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
            s3Client.deleteObject(deleteObjectRequest);
            log.info("Deleted file from Cloudflare R2: {}", key);
        } catch (Exception e) {
            log.error("Failed to delete file from Cloudflare R2: {}", key, e);
            throw new RuntimeException("R2 file deletion failed", e);
        }
    }

    @Override
    public boolean exists(String key) {
        log.info("Checking if file exists on Cloudflare R2 with key: {}", key);
        if (s3Client == null) {
            throw new IllegalStateException("Cloudflare R2 client is not configured");
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
            log.error("Failed to check file existence on Cloudflare R2: {}", key, e);
            throw new RuntimeException("R2 file existence check failed", e);
        }
    }

    @Override
    public String generatePublicUrl(String key) {
        return String.format("%s/%s", publicUrlPrefix, key);
    }

    @Override
    public String generateSignedUrl(String key, int expirySeconds) {
        return generatePublicUrl(key);
    }
}
