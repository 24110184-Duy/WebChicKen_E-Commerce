package com.example.webchicken.bootstrap;

import com.example.webchicken.modules.identity.dao.*;
import com.example.webchicken.modules.identity.service.AuthService;
import com.example.webchicken.modules.identity.service.impl.AuthServiceImpl;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;
import jakarta.servlet.ServletContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

/**
 * Điểm duy nhất dựng toàn bộ dependency (Composition Root pattern).
 * <p>
 * Thứ tự khởi động:
 * <ol>
 *   <li>Tạo {@link EntityManagerFactory} từ JPA persistence unit.</li>
 *   <li>Dựng DAOs (inject EMF qua constructor).</li>
 *   <li>Dựng Services (inject DAOs qua constructor).</li>
 *   <li>Đăng ký Services vào {@link ServletContext} để Servlet lấy ra.</li>
 * </ol>
 * </p>
 */
public class CompositionRoot {

    private static final Logger log = LoggerFactory.getLogger(CompositionRoot.class);
    private static final String PERSISTENCE_UNIT = "webchicken-pu";

    private EntityManagerFactory emf;

    public void initialize(ServletContext ctx) {
        // ── 1. JPA EntityManagerFactory ──────────────────────────────────────
        log.info("Initializing JPA EntityManagerFactory ({})", PERSISTENCE_UNIT);
        Map<String, String> props = buildJpaProperties();
        emf = Persistence.createEntityManagerFactory(PERSISTENCE_UNIT, props);
        ctx.setAttribute("emf", emf);
        log.info("JPA EntityManagerFactory ready");

        // ── 2. DAOs ───────────────────────────────────────────────────────────
        UserDAO         userDAO         = new UserDAO(emf);
        UserSessionDAO  userSessionDAO  = new UserSessionDAO(emf);
        CustomerDAO     customerDAO     = new CustomerDAO(emf);
        SellerDAO       sellerDAO       = new SellerDAO(emf);
        AdminDAO        adminDAO        = new AdminDAO(emf);
        AddressDAO      addressDAO      = new AddressDAO(emf);
        AccountBanDAO   accountBanDAO   = new AccountBanDAO(emf);

        // ── 3. Services ───────────────────────────────────────────────────────
        AuthService authService = new AuthServiceImpl(userDAO, userSessionDAO);

        // ── 4. Đăng ký vào ServletContext (Servlet lấy qua getAttribute) ─────
        ctx.setAttribute("authService",     authService);
        ctx.setAttribute("customerDAO",     customerDAO);
        ctx.setAttribute("sellerDAO",       sellerDAO);
        ctx.setAttribute("adminDAO",        adminDAO);
        ctx.setAttribute("addressDAO",      addressDAO);
        ctx.setAttribute("accountBanDAO",   accountBanDAO);

        log.info("Composition root initialized — {} services registered", 1);
    }

    public void shutdown() {
        log.info("Closing JPA EntityManagerFactory");
        if (emf != null && emf.isOpen()) {
            try { emf.close(); }
            catch (Exception e) { log.error("Error closing EMF: {}", e.getMessage(), e); }
        }
    }

    public EntityManagerFactory getEntityManagerFactory() {
        return emf;
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    /**
     * Đọc thông tin kết nối DB từ biến môi trường (ưu tiên) hoặc system property.
     * Không bao giờ đặt giá trị thật vào persistence.xml hay commit vào git.
     */
    private Map<String, String> buildJpaProperties() {
        Map<String, String> p = new HashMap<>();
        String url  = env("DB_URL",      "jdbc:mysql://localhost:3306/webchicken?useSSL=false&characterEncoding=UTF-8&serverTimezone=UTC&allowPublicKeyRetrieval=true");
        String user = env("DB_USER",     "root");
        String pass = env("DB_PASSWORD", "");
        p.put("jakarta.persistence.jdbc.url",      url);
        p.put("jakarta.persistence.jdbc.user",     user);
        p.put("jakarta.persistence.jdbc.password", pass);
        return p;
    }

    /** Đọc biến môi trường, fallback sang system property, rồi mới dùng defaultValue. */
    private static String env(String key, String defaultValue) {
        String v = System.getenv(key);
        if (v != null && !v.isBlank()) return v;
        v = System.getProperty(key);
        if (v != null && !v.isBlank()) return v;
        return defaultValue;
    }
}
