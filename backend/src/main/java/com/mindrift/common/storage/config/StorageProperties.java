package com.mindrift.common.storage.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "storage")
public class StorageProperties {

    private String provider = "local"; // local or supabase
    private Local local = new Local();
    private Supabase supabase = new Supabase();

    @Data
    public static class Local {
        private String dir = "./storage_uploads";
    }

    @Data
    public static class Supabase {
        private String url;
        private String serviceRoleKey;
        private String bucket = "mindrift-storage";
        private String publicUrl;
    }
}
