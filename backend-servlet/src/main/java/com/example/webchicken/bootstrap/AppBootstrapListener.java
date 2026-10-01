package com.example.webchicken.bootstrap;

import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;
import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Khởi động ứng dụng: nạp config → chạy Flyway migration → dựng CompositionRoot DI.
 * Thứ tự ngược lại khi tắt (contextDestroyed).
 */
@WebListener
public class AppBootstrapListener implements ServletContextListener {
    private static final Logger log = LoggerFactory.getLogger(AppBootstrapListener.class);
    private CompositionRoot root;

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        log.info("=== WebChicKen starting up ===");

        // 1. Chạy Flyway Database Migration
        runFlywayMigration();

        // 2. Khởi tạo Composition Root (JPA EMF, DAOs, Services)
        root = new CompositionRoot();
        root.initialize(sce.getServletContext());

        log.info("=== WebChicKen ready ===");
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        log.info("=== WebChicKen shutting down ===");
        if (root != null) {
            root.shutdown();
        }
    }

    private void runFlywayMigration() {
        String url  = env("DB_URL", "jdbc:mysql://localhost:3306/webchicken?useSSL=false&characterEncoding=UTF-8&serverTimezone=UTC&allowPublicKeyRetrieval=true");
        String user = env("DB_USER", "root");
        String pass = env("DB_PASSWORD", "");

        log.info("Executing Flyway database migration on: {}", url);
        try {
            Flyway flyway = Flyway.configure()
                    .dataSource(url, user, pass)
                    .locations("classpath:db/migration")
                    .baselineOnMigrate(true)
                    .load();
            int migrationsApplied = flyway.migrate().migrationsExecuted;
            log.info("Flyway migration completed: {} scripts executed.", migrationsApplied);
        } catch (Exception e) {
            log.error("Lỗi khi thực thi Flyway migration: {}. Vui lòng kiểm tra kết nối MySQL.", e.getMessage());
            // Không re-throw để tránh crash Tomcat nếu môi trường dev chưa bật MySQL
        }
    }

    private static String env(String key, String defaultValue) {
        String v = System.getenv(key);
        if (v != null && !v.isBlank()) return v;
        v = System.getProperty(key);
        if (v != null && !v.isBlank()) return v;
        return defaultValue;
    }
}

