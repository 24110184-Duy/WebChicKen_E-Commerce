package com.example.webchicken.bootstrap;

import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;
import jakarta.servlet.ServletContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Điểm duy nhất dựng toàn bộ dependency (Composition Root pattern).
 * Quản lý vòng đời của EntityManagerFactory (JPA / Hibernate) và các Service/DAO.
 */
public class CompositionRoot {

    private static final Logger log = LoggerFactory.getLogger(CompositionRoot.class);
    private static final String PERSISTENCE_UNIT_NAME = "webchicken-pu";

    private EntityManagerFactory entityManagerFactory;

    public void initialize(ServletContext ctx) {
        log.info("Initializing JPA EntityManagerFactory ({})", PERSISTENCE_UNIT_NAME);
        try {
            this.entityManagerFactory = Persistence.createEntityManagerFactory(PERSISTENCE_UNIT_NAME);
            ctx.setAttribute("entityManagerFactory", this.entityManagerFactory);
            log.info("JPA EntityManagerFactory initialized successfully");
        } catch (Exception e) {
            log.warn("JPA EntityManagerFactory initialization skipped or deferred: {}", e.getMessage());
        }

        // TODO: 1) Load AppConfig
        //        2) Chạy Flyway migration
        //        3) Dựng DAOs (với EntityManagerFactory) → Services → đăng ký vào ServletContext
        //        4) Khởi động JobScheduler
    }

    public void shutdown() {
        log.info("Closing JPA EntityManagerFactory");
        if (entityManagerFactory != null && entityManagerFactory.isOpen()) {
            try {
                entityManagerFactory.close();
            } catch (Exception e) {
                log.error("Error closing EntityManagerFactory: {}", e.getMessage(), e);
            }
        }
        // TODO: 1) Dừng JobScheduler
        //        2) Hủy đăng ký JDBC driver
    }

    public EntityManagerFactory getEntityManagerFactory() {
        return entityManagerFactory;
    }
}
