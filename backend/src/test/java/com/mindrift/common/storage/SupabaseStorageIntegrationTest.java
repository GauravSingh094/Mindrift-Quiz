package com.mindrift.common.storage;

import com.mindrift.BaseIntegrationTest;
import com.mindrift.common.monitoring.MonitoringService;
import com.mindrift.common.storage.config.StorageProperties;
import com.mindrift.common.storage.migration.StorageMigrationService;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

public class SupabaseStorageIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private StorageProperties properties;

    @Autowired
    private CircuitBreakerRegistry circuitBreakerRegistry;

    @Autowired
    private MonitoringService monitoringService;

    private SupabaseStorageProvider supabaseStorageProvider;
    private RestTemplate restTemplate;
    private MockRestServiceServer mockServer;

    @BeforeEach
    void setUp() {
        properties.getSupabase().setUrl("https://test-project.supabase.co");
        properties.getSupabase().setServiceRoleKey("test-service-role-key");
        properties.getSupabase().setBucket("mindrift-storage");
        properties.getSupabase().setPublicUrl("https://cdn.mindrift.com");

        this.restTemplate = new RestTemplate();
        this.mockServer = MockRestServiceServer.createServer(restTemplate);
        this.supabaseStorageProvider = new SupabaseStorageProvider(
                properties,
                restTemplate,
                circuitBreakerRegistry,
                monitoringService
        );
    }

    @Test
    void testUploadFileSuccess() {
        String key = "quiz-assets/sample.png";
        byte[] bytes = "test-image-content".getBytes();
        String contentType = "image/png";

        mockServer.expect(requestTo("https://test-project.supabase.co/storage/v1/object/mindrift-storage/" + key))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("apikey", "test-service-role-key"))
                .andExpect(header("Authorization", "Bearer test-service-role-key"))
                .andExpect(header("Content-Type", contentType))
                .andRespond(withSuccess("{\"Key\":\"" + key + "\"}", MediaType.APPLICATION_JSON));

        String publicUrl = supabaseStorageProvider.uploadFile(key, bytes, contentType);

        mockServer.verify();
        assertNotNull(publicUrl);
        assertEquals("https://cdn.mindrift.com/" + key, publicUrl);
    }

    @Test
    void testDownloadFileSuccess() {
        String key = "certificates/cert.pdf";
        byte[] expectedBytes = "pdf-content".getBytes();

        mockServer.expect(requestTo("https://test-project.supabase.co/storage/v1/object/authenticated/mindrift-storage/" + key))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header("apikey", "test-service-role-key"))
                .andExpect(header("Authorization", "Bearer test-service-role-key"))
                .andRespond(withSuccess(expectedBytes, MediaType.APPLICATION_OCTET_STREAM));

        byte[] downloadedBytes = supabaseStorageProvider.downloadFile(key);

        mockServer.verify();
        assertArrayEquals(expectedBytes, downloadedBytes);
    }

    @Test
    void testDeleteFileSuccess() {
        String key = "exports/data.csv";

        mockServer.expect(requestTo("https://test-project.supabase.co/storage/v1/object/remove/mindrift-storage"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("apikey", "test-service-role-key"))
                .andExpect(header("Authorization", "Bearer test-service-role-key"))
                .andExpect(content().json("{\"prefixes\":[\"" + key + "\"]}"))
                .andRespond(withSuccess("[]", MediaType.APPLICATION_JSON));

        supabaseStorageProvider.deleteFile(key);

        mockServer.verify();
    }

    @Test
    void testExistsTrue() {
        String key = "avatars/user1.jpg";

        mockServer.expect(requestTo("https://test-project.supabase.co/storage/v1/object/authenticated/mindrift-storage/" + key))
                .andExpect(method(HttpMethod.HEAD))
                .andExpect(header("apikey", "test-service-role-key"))
                .andExpect(header("Authorization", "Bearer test-service-role-key"))
                .andRespond(withSuccess());

        boolean fileExists = supabaseStorageProvider.exists(key);

        mockServer.verify();
        assertTrue(fileExists);
    }

    @Test
    void testExistsFalse() {
        String key = "nonexistent.txt";

        mockServer.expect(requestTo("https://test-project.supabase.co/storage/v1/object/authenticated/mindrift-storage/" + key))
                .andExpect(method(HttpMethod.HEAD))
                .andExpect(header("apikey", "test-service-role-key"))
                .andExpect(header("Authorization", "Bearer test-service-role-key"))
                .andRespond(withResourceNotFound());

        boolean fileExists = supabaseStorageProvider.exists(key);

        mockServer.verify();
        assertFalse(fileExists);
    }

    @Test
    void testGenerateSignedUrlSuccess() {
        String key = "reports/confidential.pdf";
        int expiry = 1800;
        String mockSignedUrl = "https://test-project.supabase.co/storage/v1/object/sign/mindrift-storage/reports/confidential.pdf?token=abc";

        mockServer.expect(requestTo("https://test-project.supabase.co/storage/v1/object/sign/mindrift-storage/" + key))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("apikey", "test-service-role-key"))
                .andExpect(header("Authorization", "Bearer test-service-role-key"))
                .andExpect(content().json("{\"expiresIn\":" + expiry + "}"))
                .andRespond(withSuccess("{\"signedUrl\":\"" + mockSignedUrl + "\"}", MediaType.APPLICATION_JSON));

        String signedUrl = supabaseStorageProvider.generateSignedUrl(key, expiry);

        mockServer.verify();
        assertEquals(mockSignedUrl, signedUrl);
    }

    @Test
    void testMigrationUtility(@TempDir Path tempDir) throws IOException {
        Path file1 = tempDir.resolve("quiz-assets/q1.png");
        Files.createDirectories(file1.getParent());
        Files.write(file1, "q1-image-data".getBytes());

        Path file2 = tempDir.resolve("reports/rep1.pdf");
        Files.createDirectories(file2.getParent());
        Files.write(file2, "rep1-pdf-data".getBytes());

        mockServer.expect(requestTo("https://test-project.supabase.co/storage/v1/object/mindrift-storage/quiz-assets/q1.png"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));

        mockServer.expect(requestTo("https://test-project.supabase.co/storage/v1/object/mindrift-storage/reports/rep1.pdf"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));

        StorageMigrationService migrationService = new StorageMigrationService(supabaseStorageProvider);
        StorageMigrationService.MigrationReport report = migrationService.migrate(tempDir, true);

        mockServer.verify();
        assertNotNull(report);
        assertEquals(2, report.getTotalFilesCount());
        assertEquals(2, report.getSuccessCount());
        assertEquals(0, report.getFailureCount());
        assertEquals("q1-image-data".getBytes().length + "rep1-pdf-data".getBytes().length, report.getTotalBytesMigrated());

        assertFalse(Files.exists(file1));
        assertFalse(Files.exists(file2));
        assertFalse(Files.exists(tempDir));
    }
}
