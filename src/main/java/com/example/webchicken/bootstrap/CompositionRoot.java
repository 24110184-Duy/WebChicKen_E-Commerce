package com.example.webchicken.bootstrap;

import jakarta.servlet.ServletContext;

/**
 * Điểm duy nhất dựng toàn bộ dependency (Composition Root pattern).
 * Không có static field, không có service locator.
 */
public class CompositionRoot {

    public void initialize(ServletContext ctx) {
        // TODO: 1) Load AppConfig
        //        2) Tạo DataSource (HikariCP)
        //        3) Chạy Flyway migration
        //        4) Dựng DAOs → Services → đăng ký vào ServletContext
        //        5) Khởi động JobScheduler
    }

    public void shutdown() {
        // TODO: 1) Dừng JobScheduler
        //        2) Đóng DataSource
        //        3) Hủy đăng ký JDBC driver
    }
}
