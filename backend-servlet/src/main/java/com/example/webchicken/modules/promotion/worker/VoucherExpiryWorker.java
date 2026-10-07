package com.example.webchicken.modules.promotion.worker;

import com.example.webchicken.modules.backoffice.service.AuditLogService;
import com.example.webchicken.modules.promotion.dao.VoucherDAO;
import com.example.webchicken.modules.promotion.model.entity.VoucherEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

/**
 * Worker chạy ngầm định kỳ quét và vô hiệu hóa các voucher đã hết hạn hoặc hết lượt sử dụng (TASK-70).
 * Đảm bảo tính nhất quán dữ liệu, giải phóng tài nguyên và bảo vệ quyền lợi sàn WebChicKen.
 * Tuân thủ quy chuẩn ARCHITECTURE.md 2.3.5, 8.5 và CODE_PRINCIPLES.md RES-06.
 */
public class VoucherExpiryWorker {

    private static final Logger log = LoggerFactory.getLogger(VoucherExpiryWorker.class);

    private final VoucherDAO voucherDAO;
    private final AuditLogService auditLogService;
    private final int batchSize;

    public VoucherExpiryWorker(VoucherDAO voucherDAO, AuditLogService auditLogService, int batchSize) {
        this.voucherDAO = Objects.requireNonNull(voucherDAO, "voucherDAO must not be null");
        this.auditLogService = auditLogService;
        this.batchSize = Math.max(10, Math.min(500, batchSize));
    }

    public VoucherExpiryWorker(VoucherDAO voucherDAO, AuditLogService auditLogService) {
        this(voucherDAO, auditLogService, 100);
    }

    public VoucherExpiryWorker(VoucherDAO voucherDAO) {
        this(voucherDAO, null, 100);
    }

    /**
     * Thực hiện một chu kỳ quét và vô hiệu hóa các voucher đã hết hạn hoặc hết lượt dùng.
     * @return Số lượng voucher đã được vô hiệu hóa thành công.
     */
    public int runScanAndDeactivate() {
        return runScanAndDeactivate(true);
    }

    /**
     * Quét và vô hiệu hóa voucher theo tùy chọn.
     * @param includeUsageLimit Nếu true, quét cả những voucher đã đạt giới hạn used_count >= usage_limit.
     * @return Số lượng voucher đã được cập nhật sang isActive = false.
     */
    public int runScanAndDeactivate(boolean includeUsageLimit) {
        LocalDateTime now = LocalDateTime.now();
        List<VoucherEntity> expiredVouchers = voucherDAO.findExpiredActiveVouchers(now, includeUsageLimit, this.batchSize);

        if (expiredVouchers == null || expiredVouchers.isEmpty()) {
            log.debug("No expired or exhausted vouchers found at {}", now);
            return 0;
        }

        log.info("Found {} active voucher(s) that are expired or exhausted at {}", expiredVouchers.size(), now);
        int deactivatedCount = 0;
        StringBuilder deactivatedCodes = new StringBuilder();

        for (VoucherEntity voucher : expiredVouchers) {
            try {
                voucherDAO.deactivateVoucher(voucher.getId());
                deactivatedCount++;

                if (deactivatedCodes.length() > 0) {
                    deactivatedCodes.append(", ");
                }
                deactivatedCodes.append(voucher.getCode());

                log.info("Successfully deactivated voucher [{}] (ID: {}) - EndDate: {}, Usage: {}/{}",
                        voucher.getCode(), voucher.getId(), voucher.getEndDate(), voucher.getUsedCount(), voucher.getUsageLimit());
            } catch (Exception e) {
                // Exception shielding: không để 1 voucher lỗi chặn toàn bộ tiến trình quét
                log.error("Failed to deactivate voucher [{}] (ID: {}): {}", voucher.getCode(), voucher.getId(), e.getMessage(), e);
            }
        }

        log.info("VoucherExpiryWorker finished scan: deactivated {}/{} voucher(s). Codes: [{}]",
                deactivatedCount, expiredVouchers.size(), deactivatedCodes);

        // Tự động ghi nhật ký kiểm toán (TASK-67 reuse)
        if (deactivatedCount > 0 && auditLogService != null) {
            try {
                auditLogService.log(
                        "SYSTEM_WORKER",
                        "DEACTIVATE_EXPIRED_VOUCHERS",
                        "VOUCHER",
                        "BATCH_" + now.toLocalDate(),
                        String.format("Tự động quét và vô hiệu hóa %d voucher hết hạn hoặc hết lượt: [%s]",
                                deactivatedCount, deactivatedCodes),
                        "127.0.0.1"
                );
            } catch (Exception ex) {
                log.warn("Could not write audit log for VoucherExpiryWorker: {}", ex.getMessage());
            }
        }

        return deactivatedCount;
    }
}
