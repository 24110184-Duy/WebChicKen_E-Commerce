package com.example.webchicken.bootstrap;

import com.example.webchicken.modules.identity.dao.*;
import com.example.webchicken.modules.identity.service.*;
import com.example.webchicken.modules.identity.service.impl.*;

import com.example.webchicken.modules.catalog.dao.*;
import com.example.webchicken.modules.catalog.service.*;
import com.example.webchicken.modules.catalog.service.impl.*;

import com.example.webchicken.modules.inventory.dao.*;
import com.example.webchicken.modules.inventory.service.*;
import com.example.webchicken.modules.inventory.service.impl.*;

import com.example.webchicken.modules.cart.dao.*;
import com.example.webchicken.modules.cart.service.*;
import com.example.webchicken.modules.cart.service.impl.*;

import com.example.webchicken.modules.order.dao.*;
import com.example.webchicken.modules.order.policy.OrderStateMachine;
import com.example.webchicken.modules.order.service.*;
import com.example.webchicken.modules.order.service.impl.*;

import com.example.webchicken.modules.payment.dao.*;
import com.example.webchicken.modules.payment.service.*;
import com.example.webchicken.modules.payment.service.impl.*;

import com.example.webchicken.modules.promotion.dao.*;
import com.example.webchicken.modules.promotion.service.*;
import com.example.webchicken.modules.promotion.service.impl.*;

import com.example.webchicken.modules.review.dao.*;
import com.example.webchicken.modules.review.service.*;
import com.example.webchicken.modules.review.service.impl.*;

import com.example.webchicken.modules.shop.dao.*;
import com.example.webchicken.modules.shop.service.*;
import com.example.webchicken.modules.shop.service.impl.*;

import com.example.webchicken.modules.media.dao.*;
import com.example.webchicken.modules.media.service.*;
import com.example.webchicken.modules.media.service.impl.*;

import com.example.webchicken.modules.backoffice.dao.*;
import com.example.webchicken.modules.backoffice.service.impl.*;
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
    private com.example.webchicken.infrastructure.event.SimpleEventBus eventBus;

    public void initialize(ServletContext ctx) {
        // ── 0. EventBus ──────────────────────────────────────────────────────
        this.eventBus = new com.example.webchicken.infrastructure.event.SimpleEventBus();
        ctx.setAttribute("eventBus", eventBus);

        // ── 1. JPA EntityManagerFactory ──────────────────────────────────────
        log.info("Initializing JPA EntityManagerFactory ({})", PERSISTENCE_UNIT);
        Map<String, String> props = buildJpaProperties();
        emf = Persistence.createEntityManagerFactory(PERSISTENCE_UNIT, props);
        ctx.setAttribute("emf", emf);
        log.info("JPA EntityManagerFactory ready");

        // ── 2. DAOs (Data Access Objects) ────────────────────────────────────
        // Identity
        UserDAO               userDAO               = new UserDAO(emf);
        UserSessionDAO        userSessionDAO        = new UserSessionDAO(emf);
        CustomerDAO           customerDAO           = new CustomerDAO(emf);
        SellerDAO             sellerDAO             = new SellerDAO(emf);
        AdminDAO              adminDAO              = new AdminDAO(emf);
        AddressDAO            addressDAO            = new AddressDAO(emf);
        AccountBanDAO         accountBanDAO         = new AccountBanDAO(emf);
        UserSocialAccountDAO  userSocialAccountDAO  = new UserSocialAccountDAO(emf);


        // Catalog
        CategoryDAO       categoryDAO       = new CategoryDAO(emf);
        ProductDAO        productDAO        = new ProductDAO(emf);
        ProductVariantDAO productVariantDAO = new ProductVariantDAO(emf);
        ProductImageDAO   productImageDAO   = new ProductImageDAO(emf);

        // Inventory
        InventoryDAO inventoryDAO = new InventoryDAO(emf);

        // Cart
        CartDAO     cartDAO     = new CartDAO(emf);
        CartItemDAO cartItemDAO = new CartItemDAO(emf);

        // Order
        OrderDAO             orderDAO             = new OrderDAO(emf);
        OrderItemDAO         orderItemDAO         = new OrderItemDAO(emf);
        OrderCancellationDAO orderCancellationDAO = new OrderCancellationDAO(emf);
        OrderStatusHistoryDAO orderStatusHistoryDAO = new OrderStatusHistoryDAO(emf);

        // Payment
        PaymentDAO       paymentDAO       = new PaymentDAO(emf);
        PaymentMethodDAO paymentMethodDAO = new PaymentMethodDAO(emf);

        // Promotion
        VoucherDAO voucherDAO = new VoucherDAO(emf);

        // Review
        ReviewDAO reviewDAO = new ReviewDAO(emf);

        // Shop
        StoreDAO             storeDAO             = new StoreDAO(emf);
        SellerApplicationDAO sellerApplicationDAO = new SellerApplicationDAO(emf);
        FeedbackDAO          feedbackDAO          = new FeedbackDAO(emf);

        // Media
        MediaDAO mediaDAO = new MediaDAO(emf);

        // Backoffice (TASK-67)
        AuditLogDAO auditLogDAO = new AuditLogDAO(emf);

        // ── 3. Services ───────────────────────────────────────────────────────
        // Identity
        AuthService      authService      = new AuthServiceImpl(userDAO, userSessionDAO, customerDAO, sellerDAO, adminDAO, userSocialAccountDAO, new com.example.webchicken.infrastructure.security.SocialAuthVerifier());
        CustomerService  customerService  = new CustomerServiceImpl(customerDAO, userDAO, addressDAO);
        SellerService    sellerService    = new SellerServiceImpl(sellerDAO, userDAO);

        // Catalog
        CategoryService       categoryService       = new CategoryServiceImpl(categoryDAO);
        ProductService        productService        = new ProductServiceImpl(productDAO, productImageDAO, productVariantDAO, categoryDAO);
        ProductVariantService productVariantService = new ProductVariantServiceImpl(productVariantDAO);

        // Inventory
        InventoryService inventoryService = new InventoryServiceImpl(inventoryDAO);

        // Cart
        CartService cartService = new CartServiceImpl(
                cartDAO, cartItemDAO, productDAO, productVariantDAO, productImageDAO, storeDAO, inventoryService
        );

        // Promotion
        VoucherService voucherService = new VoucherServiceImpl(voucherDAO);

        // Payment
        com.example.webchicken.infrastructure.payment.VNPayGateway vnPayGateway = new com.example.webchicken.infrastructure.payment.VNPayGateway();
        PaymentService       paymentService       = new PaymentServiceImpl(paymentDAO, orderDAO, vnPayGateway);
        PaymentMethodService paymentMethodService = new PaymentMethodServiceImpl(paymentMethodDAO);

        // Order
        OrderStateMachine orderStateMachine = new OrderStateMachine(orderDAO, orderStatusHistoryDAO, inventoryService, paymentDAO);
        OrderService orderService = new OrderServiceImpl(
                orderDAO, orderItemDAO, orderCancellationDAO,
                cartDAO, cartItemDAO, productDAO, productVariantDAO, productImageDAO,
                storeDAO, inventoryService, voucherService, paymentService,
                orderStatusHistoryDAO, orderStateMachine
        );

        // Review
        ReviewService reviewService = new ReviewServiceImpl(reviewDAO, orderDAO, orderItemDAO, userDAO);

        // Shop
        StoreService             storeService             = new StoreServiceImpl(storeDAO);
        SellerApplicationService sellerApplicationService = new SellerApplicationServiceImpl(sellerApplicationDAO, storeDAO, sellerDAO, userDAO);

        // Backoffice Audit Log (TASK-67)
        AuditLogServiceImpl auditLogService = new AuditLogServiceImpl(auditLogDAO);

        // Feedback to Admin (TASK-69)
        FeedbackService feedbackService = new FeedbackServiceImpl(feedbackDAO, storeDAO, userDAO, auditLogService);

        // Admin User Moderation (TASK-66, TASK-67)
        AdminUserService adminUserService = new AdminUserServiceImpl(
                adminDAO, userDAO, accountBanDAO, userSessionDAO, customerDAO, sellerDAO, storeService, auditLogService
        );
        auditLogService.setAdminUserService(adminUserService);

        // Media
        MediaService mediaService = new MediaServiceImpl(mediaDAO);

        // ── 4. Đăng ký vào ServletContext để Servlets truy xuất ──────────────
        ctx.setAttribute("authService",              authService);
        ctx.setAttribute("customerService",          customerService);
        ctx.setAttribute("sellerService",            sellerService);
        ctx.setAttribute("adminUserService",         adminUserService);

        ctx.setAttribute("categoryService",          categoryService);
        ctx.setAttribute("productService",           productService);
        ctx.setAttribute("productVariantService",    productVariantService);

        ctx.setAttribute("inventoryService",        inventoryService);
        ctx.setAttribute("cartService",             cartService);
        ctx.setAttribute("orderService",            orderService);
        ctx.setAttribute("orderStateMachine",       orderStateMachine);

        ctx.setAttribute("paymentService",          paymentService);
        ctx.setAttribute("paymentMethodService",    paymentMethodService);

        ctx.setAttribute("voucherService",          voucherService);
        ctx.setAttribute("reviewService",           reviewService);

        ctx.setAttribute("storeService",             storeService);
        ctx.setAttribute("sellerApplicationService", sellerApplicationService);
        ctx.setAttribute("feedbackService",          feedbackService);

        // Workers (TASK-55, TASK-68, TASK-70)
        com.example.webchicken.modules.inventory.worker.ExpiredReservationWorker expiredReservationWorker =
                new com.example.webchicken.modules.inventory.worker.ExpiredReservationWorker(inventoryDAO, orderDAO, orderStateMachine);
        ctx.setAttribute("expiredReservationWorker", expiredReservationWorker);

        com.example.webchicken.modules.order.worker.ShippingSimulationWorker shippingSimulationWorker =
                new com.example.webchicken.modules.order.worker.ShippingSimulationWorker(orderDAO, orderStatusHistoryDAO, orderStateMachine);
        ctx.setAttribute("shippingSimulationWorker", shippingSimulationWorker);

        com.example.webchicken.modules.promotion.worker.VoucherExpiryWorker voucherExpiryWorker =
                new com.example.webchicken.modules.promotion.worker.VoucherExpiryWorker(voucherDAO, auditLogService);
        ctx.setAttribute("voucherExpiryWorker", voucherExpiryWorker);

        ctx.setAttribute("mediaService",            mediaService);
        ctx.setAttribute("auditLogService",         auditLogService);

        log.info("Composition root initialized — toàn bộ 18 Services & 3 Background Workers đã sẵn sàng.");
    }

    public void shutdown() {
        log.info("Closing JPA EntityManagerFactory & EventBus");
        if (eventBus != null) {
            try { eventBus.shutdown(); }
            catch (Exception e) { log.error("Error shutting down EventBus: {}", e.getMessage(), e); }
        }
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
        String url  = EnvConfig.get("DB_URL",      "jdbc:postgresql://localhost:5432/webchicken");
        String user = EnvConfig.get("DB_USER",     "postgres");
        String pass = EnvConfig.get("DB_PASSWORD", "");
        p.put("jakarta.persistence.jdbc.url",      url);
        p.put("jakarta.persistence.jdbc.user",     user);
        p.put("jakarta.persistence.jdbc.password", pass);

        if (url.startsWith("jdbc:postgresql:")) {
            p.put("jakarta.persistence.jdbc.driver", "org.postgresql.Driver");
            p.put("hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect");
        } else if (url.startsWith("jdbc:mysql:")) {
            p.put("jakarta.persistence.jdbc.driver", "com.mysql.cj.jdbc.Driver");
            p.put("hibernate.dialect", "org.hibernate.dialect.MySQLDialect");
        }
        return p;
    }
}
