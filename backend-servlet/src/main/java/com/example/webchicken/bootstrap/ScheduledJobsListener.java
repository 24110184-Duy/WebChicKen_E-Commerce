package com.example.webchicken.bootstrap;

import com.example.webchicken.modules.inventory.worker.ExpiredReservationWorker;
import jakarta.servlet.ServletContext;
import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Listener quản lý vòng đời các tác vụ chạy ngầm định kỳ (Background Jobs) (TASK-55).
 * Tuân thủ quy chuẩn ARCHITECTURE.md 8.5 và CODE_PRINCIPLES.md RES-06:
 * - Thread pool có tên rõ ràng và giới hạn kích thước
 * - Shutdown an toàn và giải phóng tài nguyên trong contextDestroyed
 */
@WebListener
public class ScheduledJobsListener implements ServletContextListener {

    private static final Logger log = LoggerFactory.getLogger(ScheduledJobsListener.class);

    private ScheduledExecutorService scheduler;

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        ServletContext ctx = sce.getServletContext();
        log.info("Initializing ScheduledJobsListener background worker...");

        AtomicInteger threadNumber = new AtomicInteger(1);
        ThreadFactory threadFactory = runnable -> {
            Thread thread = new Thread(runnable, "webchicken-scheduled-job-" + threadNumber.getAndIncrement());
            thread.setDaemon(true);
            return thread;
        };

        scheduler = Executors.newScheduledThreadPool(3, threadFactory);

        // 1. Chu kỳ quét kho hết hạn: bắt đầu sau 15 giây, lặp lại mỗi 60 giây (TASK-55)
        scheduler.scheduleWithFixedDelay(() -> {
            try {
                ExpiredReservationWorker worker = (ExpiredReservationWorker) ctx.getAttribute("expiredReservationWorker");
                if (worker != null) {
                    worker.runCleanup();
                }
            } catch (Throwable t) {
                log.error("Unhandled error in scheduled background cleanup job: {}", t.getMessage(), t);
            }
        }, 15, 60, TimeUnit.SECONDS);

        // 2. Chu kỳ mô phỏng vận chuyển đơn hàng: bắt đầu sau 20 giây, lặp lại mỗi 30 giây (TASK-68)
        scheduler.scheduleWithFixedDelay(() -> {
            try {
                com.example.webchicken.modules.order.worker.ShippingSimulationWorker worker =
                        (com.example.webchicken.modules.order.worker.ShippingSimulationWorker) ctx.getAttribute("shippingSimulationWorker");
                if (worker != null) {
                    worker.runSimulation();
                }
            } catch (Throwable t) {
                log.error("Unhandled error in scheduled background shipping simulation job: {}", t.getMessage(), t);
            }
        }, 20, 30, TimeUnit.SECONDS);

        // 3. Chu kỳ quét và vô hiệu hóa voucher hết hạn: bắt đầu sau 25 giây, lặp lại mỗi 60 giây (TASK-70)
        scheduler.scheduleWithFixedDelay(() -> {
            try {
                com.example.webchicken.modules.promotion.worker.VoucherExpiryWorker worker =
                        (com.example.webchicken.modules.promotion.worker.VoucherExpiryWorker) ctx.getAttribute("voucherExpiryWorker");
                if (worker != null) {
                    worker.runScanAndDeactivate();
                }
            } catch (Throwable t) {
                log.error("Unhandled error in scheduled background voucher expiry job: {}", t.getMessage(), t);
            }
        }, 25, 60, TimeUnit.SECONDS);

        log.info("ScheduledJobsListener initialized successfully (Workers: ExpiredReservationWorker, ShippingSimulationWorker & VoucherExpiryWorker).");
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        log.info("Shutting down ScheduledJobsListener background scheduler...");
        if (scheduler != null && !scheduler.isShutdown()) {
            scheduler.shutdown();
            try {
                if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                    scheduler.shutdownNow();
                }
                log.info("ScheduledJobsListener background scheduler terminated cleanly.");
            } catch (InterruptedException e) {
                scheduler.shutdownNow();
                Thread.currentThread().interrupt();
                log.warn("Interrupted while shutting down ScheduledJobsListener.");
            }
        }
    }
}
