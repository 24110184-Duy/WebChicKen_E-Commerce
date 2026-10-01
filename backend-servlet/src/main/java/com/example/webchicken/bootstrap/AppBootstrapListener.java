package com.example.webchicken.bootstrap;

import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Khởi động ứng dụng: nạp config → tạo DataSource → chạy migration → dựng DI.
 * Thứ tự ngược lại khi tắt (contextDestroyed).
 */
@WebListener
public class AppBootstrapListener implements ServletContextListener {
    private static final Logger log = LoggerFactory.getLogger(AppBootstrapListener.class);
    private CompositionRoot root;

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        log.info("=== WebChicKen starting up ===");
        root = new CompositionRoot();
        root.initialize(sce.getServletContext());
        log.info("=== WebChicKen ready ===");
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        log.info("=== WebChicKen shutting down ===");
        if (root != null) root.shutdown();
    }
}
