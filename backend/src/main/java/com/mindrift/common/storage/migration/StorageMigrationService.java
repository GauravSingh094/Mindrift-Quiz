package com.mindrift.common.storage.migration;

import com.mindrift.common.storage.StorageProvider;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

@Slf4j
@Service
public class StorageMigrationService {

    private final StorageProvider storageProvider;

    public StorageMigrationService(StorageProvider storageProvider) {
        this.storageProvider = storageProvider;
    }

    public MigrationReport migrate(Path sourceDirectory, boolean deleteSourceAfterMigration) {
        log.info("Starting local storage migration from: {}", sourceDirectory.toAbsolutePath());
        long startTime = System.currentTimeMillis();
        MigrationReport report = new MigrationReport();

        if (!Files.exists(sourceDirectory) || !Files.isDirectory(sourceDirectory)) {
            log.warn("Migration source directory does not exist or is not a directory: {}", sourceDirectory);
            report.setDurationMs(System.currentTimeMillis() - startTime);
            return report;
        }

        List<Path> filesToMigrate = new ArrayList<>();
        try (Stream<Path> walk = Files.walk(sourceDirectory)) {
            walk.filter(Files::isRegularFile).forEach(filesToMigrate::add);
        } catch (IOException e) {
            log.error("Failed to scan source directory for files: {}", sourceDirectory, e);
            throw new RuntimeException("Directory scanning failed during migration", e);
        }

        report.setTotalFilesCount(filesToMigrate.size());
        log.info("Found {} files to migrate to storage bucket", filesToMigrate.size());

        for (Path file : filesToMigrate) {
            Path relativePath = sourceDirectory.relativize(file);
            String key = relativePath.toString().replace('\\', '/');

            try {
                byte[] content = Files.readAllBytes(file);
                String contentType = getContentType(file);

                log.info("Migrating file: {} -> key: {}, size: {} bytes, type: {}", file.getFileName(), key, content.length, contentType);

                storageProvider.uploadFile(key, content, contentType);

                report.setSuccessCount(report.getSuccessCount() + 1);
                report.setTotalBytesMigrated(report.getTotalBytesMigrated() + content.length);

                if (deleteSourceAfterMigration) {
                    Files.deleteIfExists(file);
                    log.debug("Deleted local source file after migration: {}", file);
                }
            } catch (Exception e) {
                log.error("Failed to migrate file: {}", file, e);
                report.setFailureCount(report.getFailureCount() + 1);
                report.getFailures().add(new FailedFileDetail(key, e.getMessage()));
            }
        }

        if (deleteSourceAfterMigration) {
            try {
                cleanEmptyDirectories(sourceDirectory);
            } catch (Exception e) {
                log.warn("Failed to clean up empty directories under: {}", sourceDirectory, e);
            }
        }

        report.setDurationMs(System.currentTimeMillis() - startTime);
        log.info("Migration completed in {} ms. Summary: Total: {}, Success: {}, Failed: {}, Bytes: {}",
                report.getDurationMs(), report.getTotalFilesCount(), report.getSuccessCount(),
                report.getFailureCount(), report.getTotalBytesMigrated());

        return report;
    }

    private void cleanEmptyDirectories(Path directory) throws IOException {
        if (Files.isDirectory(directory)) {
            try (Stream<Path> stream = Files.list(directory)) {
                List<Path> paths = stream.toList();
                for (Path p : paths) {
                    cleanEmptyDirectories(p);
                }
            }
            try (Stream<Path> stream = Files.list(directory)) {
                if (!stream.findAny().isPresent()) {
                    Files.delete(directory);
                    log.debug("Deleted empty local directory: {}", directory);
                }
            }
        }
    }

    private String getContentType(Path file) {
        try {
            String contentType = Files.probeContentType(file);
            if (contentType != null) {
                return contentType;
            }
        } catch (Exception e) {
            // Fallback
        }

        String filename = file.getFileName().toString().toLowerCase();
        if (filename.endsWith(".png")) return "image/png";
        if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
        if (filename.endsWith(".gif")) return "image/gif";
        if (filename.endsWith(".pdf")) return "application/pdf";
        if (filename.endsWith(".json")) return "application/json";
        if (filename.endsWith(".txt")) return "text/plain";
        if (filename.endsWith(".csv")) return "text/csv";
        if (filename.endsWith(".html")) return "text/html";
        return "application/octet-stream";
    }

    @Data
    @NoArgsConstructor
    public static class MigrationReport {
        private int totalFilesCount = 0;
        private int successCount = 0;
        private int failureCount = 0;
        private long totalBytesMigrated = 0;
        private long durationMs = 0;
        private List<FailedFileDetail> failures = new ArrayList<>();
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class FailedFileDetail {
        private String fileKey;
        private String errorMessage;
    }
}
