package com.example.webchicken.bootstrap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.nio.charset.StandardCharsets;

/**
 * Tiện ích nạp cấu hình môi trường từ file .env hoặc biến môi trường hệ thống.
 * Tự động phân tích và chuyển đổi URL chuẩn PostgreSQL (Neon/Render/Railway) sang định dạng JDBC.
 */
public final class EnvConfig {
    private static final Logger log = LoggerFactory.getLogger(EnvConfig.class);
    private static boolean loaded = false;

    private EnvConfig() {}

    public static synchronized void load() {
        if (loaded) return;
        loaded = true;

        // 1. Thử nạp từ Classpath (đóng gói trong WAR / WEB-INF/classes/.env)
        try (java.io.InputStream is = EnvConfig.class.getResourceAsStream("/.env")) {
            if (is != null) {
                log.info("Đã tìm thấy file .env từ Classpath (WEB-INF/classes/.env)");
                parseEnvStream(is);
            }
        } catch (Exception e) {
            log.warn("Lỗi khi đọc .env từ Classpath: {}", e.getMessage());
        }

        // 2. Thử nạp từ file hệ thống
        String catalinaBase = System.getProperty("catalina.base");
        String catalinaHome = System.getProperty("catalina.home");
        String userDir = System.getProperty("user.dir");

        String[] potentialPaths = {
            ".env",
            "backend-servlet/.env",
            "../backend-servlet/.env",
            "../.env",
            userDir + "/.env",
            userDir + "/backend-servlet/.env",
            userDir + "/webapps/ROOT/WEB-INF/classes/.env",
            userDir + "/webapps/web1_war_exploded/WEB-INF/classes/.env",
            catalinaBase != null ? catalinaBase + "/.env" : null,
            catalinaBase != null ? catalinaBase + "/conf/.env" : null,
            catalinaHome != null ? catalinaHome + "/.env" : null,
            "D:/HOCDITHANGNGU/clonerepo/web1/backend-servlet/.env"
        };

        for (String p : potentialPaths) {
            if (p == null) continue;
            File f = new File(p);
            if (f.exists() && f.isFile()) {
                log.info("Đã tìm thấy file .env tại: {}", f.getAbsolutePath());
                try (java.io.InputStream fis = new java.io.FileInputStream(f)) {
                    parseEnvStream(fis);
                } catch (Exception e) {
                    log.warn("Không thể đọc file .env tại {}: {}", f.getAbsolutePath(), e.getMessage());
                }
                break;
            }
        }

        // Tự động phân tích DATABASE_URL nếu DB_URL chưa được khai báo thủ công
        String dbUrl = System.getenv("DB_URL");
        if (dbUrl == null || dbUrl.isBlank()) {
            dbUrl = System.getProperty("DB_URL");
        }

        if (dbUrl == null || dbUrl.isBlank()) {
            String databaseUrl = System.getenv("DATABASE_URL");
            if (databaseUrl == null || databaseUrl.isBlank()) {
                databaseUrl = System.getProperty("DATABASE_URL");
            }
            if (databaseUrl != null && !databaseUrl.isBlank()) {
                parseAndSetDatabaseUrl(databaseUrl);
            }
        }
    }

    private static void parseEnvStream(java.io.InputStream is) {
        try (BufferedReader reader = new BufferedReader(new java.io.InputStreamReader(is, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) continue;
                int eq = line.indexOf('=');
                if (eq > 0) {
                    String key = line.substring(0, eq).trim();
                    String val = line.substring(eq + 1).trim();
                    if (val.startsWith("\"") && val.endsWith("\"") && val.length() >= 2) {
                        val = val.substring(1, val.length() - 1);
                    } else if (val.startsWith("'") && val.endsWith("'") && val.length() >= 2) {
                        val = val.substring(1, val.length() - 1);
                    }
                    if (System.getProperty(key) == null) {
                        System.setProperty(key, val);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Lỗi khi phân tích nội dung .env: {}", e.getMessage());
        }
    }

    private static void parseAndSetDatabaseUrl(String raw) {
        try {
            // Chuẩn hóa định dạng postgresql://user:pass@host/database
            if (raw.startsWith("postgresql://") || raw.startsWith("postgres://")) {
                String withoutScheme = raw.substring(raw.indexOf("://") + 3);
                int atIdx = withoutScheme.indexOf('@');
                if (atIdx > 0) {
                    String userPass = withoutScheme.substring(0, atIdx);
                    String hostRest = withoutScheme.substring(atIdx + 1);

                    int colonIdx = userPass.indexOf(':');
                    String user = colonIdx > 0 ? userPass.substring(0, colonIdx) : userPass;
                    String pass = colonIdx > 0 ? userPass.substring(colonIdx + 1) : "";

                    if (System.getProperty("DB_USER") == null) System.setProperty("DB_USER", user);
                    if (System.getProperty("DB_PASSWORD") == null) System.setProperty("DB_PASSWORD", pass);

                    String jdbcUrl = "jdbc:postgresql://" + hostRest;
                    if (System.getProperty("DB_URL") == null) System.setProperty("DB_URL", jdbcUrl);
                    log.info("Đã chuyển đổi DATABASE_URL sang JDBC URL: {}", jdbcUrl);
                }
            }
        } catch (Exception e) {
            log.warn("Không thể phân tích DATABASE_URL: {}", e.getMessage());
        }
    }

    public static String get(String key, String defaultValue) {
        load();
        String v = System.getenv(key);
        if (v != null && !v.isBlank()) return v;
        v = System.getProperty(key);
        if (v != null && !v.isBlank()) return v;
        return defaultValue;
    }
}
