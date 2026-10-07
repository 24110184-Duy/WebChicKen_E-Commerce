package com.example.webchicken.modules.promotion.worker;

import com.example.webchicken.modules.backoffice.service.AuditLogService;
import com.example.webchicken.modules.promotion.dao.VoucherDAO;
import com.example.webchicken.modules.promotion.model.entity.VoucherEntity;
import com.example.webchicken.modules.promotion.model.enums.VoucherType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class VoucherExpiryWorkerTest {

    private VoucherDAO voucherDAO;
    private AuditLogService auditLogService;
    private VoucherExpiryWorker worker;

    @BeforeEach
    void setUp() {
        voucherDAO = mock(VoucherDAO.class);
        auditLogService = mock(AuditLogService.class);
        worker = new VoucherExpiryWorker(voucherDAO, auditLogService, 50);
    }

    private VoucherEntity createMockVoucher(String id, String code, LocalDateTime endDate, int usedCount, int usageLimit) {
        VoucherEntity v = new VoucherEntity();
        v.setId(id);
        v.setCode(code);
        v.setTitle("Voucher " + code);
        v.setType(VoucherType.AMOUNT);
        v.setDiscountValueMinor(50_000);
        v.setMinOrderValueMinor(200_000);
        v.setStartDate(endDate.minusDays(10));
        v.setEndDate(endDate);
        v.setUsageLimit(usageLimit);
        v.setUsedCount(usedCount);
        v.setActive(true);
        return v;
    }

    @Test
    @DisplayName("Không có voucher nào hết hạn -> trả về 0 và không ghi audit log")
    void testRunScanAndDeactivate_NoExpiredVouchers_ReturnsZero() {
        when(voucherDAO.findExpiredActiveVouchers(any(), anyBoolean(), anyInt())).thenReturn(List.of());

        int count = worker.runScanAndDeactivate();

        assertEquals(0, count);
        verify(voucherDAO, never()).deactivateVoucher(any());
        verify(auditLogService, never()).log(any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Voucher quá ngày endDate -> tự động vô hiệu hóa và trả về số lượng")
    void testRunScanAndDeactivate_WithExpiredVouchers_DeactivatesAndReturnsCount() {
        LocalDateTime past = LocalDateTime.now().minusDays(1);
        VoucherEntity v1 = createMockVoucher("v-001", "FREESHIP_EXPIRED", past, 10, 100);
        VoucherEntity v2 = createMockVoucher("v-002", "TET2026_EXPIRED", past.minusHours(5), 25, 50);

        when(voucherDAO.findExpiredActiveVouchers(any(), eq(true), anyInt())).thenReturn(List.of(v1, v2));

        int count = worker.runScanAndDeactivate();

        assertEquals(2, count);
        verify(voucherDAO, times(1)).deactivateVoucher("v-001");
        verify(voucherDAO, times(1)).deactivateVoucher("v-002");
        verify(auditLogService, times(1)).log(
                eq("SYSTEM_WORKER"),
                eq("DEACTIVATE_EXPIRED_VOUCHERS"),
                eq("VOUCHER"),
                contains("BATCH_"),
                contains("FREESHIP_EXPIRED"),
                eq("127.0.0.1")
        );
    }

    @Test
    @DisplayName("Voucher đã chạm tới giới hạn usedCount >= usageLimit -> tự động vô hiệu hóa")
    void testRunScanAndDeactivate_WithExhaustedUsageLimit_DeactivatesVouchers() {
        LocalDateTime future = LocalDateTime.now().plusDays(5);
        VoucherEntity v1 = createMockVoucher("v-limit-01", "MAX_OUT_VOUCHER", future, 500, 500);

        when(voucherDAO.findExpiredActiveVouchers(any(), eq(true), anyInt())).thenReturn(List.of(v1));

        int count = worker.runScanAndDeactivate(true);

        assertEquals(1, count);
        verify(voucherDAO, times(1)).deactivateVoucher("v-limit-01");
    }

    @Test
    @DisplayName("Tùy chọn excludeUsageLimit=false -> truyền đúng cờ vào DAO")
    void testRunScanAndDeactivate_ExcludeUsageLimit_PassesFlagToDAO() {
        when(voucherDAO.findExpiredActiveVouchers(any(), eq(false), anyInt())).thenReturn(List.of());

        int count = worker.runScanAndDeactivate(false);

        assertEquals(0, count);
        verify(voucherDAO, times(1)).findExpiredActiveVouchers(any(), eq(false), anyInt());
    }

    @Test
    @DisplayName("Exception Shielding: một voucher bị lỗi DB thì các voucher khác vẫn tiếp tục xử lý")
    void testRunScanAndDeactivate_ExceptionShielding_ContinuesProcessing() {
        LocalDateTime past = LocalDateTime.now().minusHours(2);
        VoucherEntity vError = createMockVoucher("v-err", "ERROR_VOUCHER", past, 1, 10);
        VoucherEntity vGood = createMockVoucher("v-good", "GOOD_VOUCHER", past, 2, 10);

        when(voucherDAO.findExpiredActiveVouchers(any(), anyBoolean(), anyInt())).thenReturn(List.of(vError, vGood));
        doThrow(new RuntimeException("Database connection timeout")).when(voucherDAO).deactivateVoucher("v-err");
        doNothing().when(voucherDAO).deactivateVoucher("v-good");

        int count = worker.runScanAndDeactivate();

        // 1 voucher bị lỗi, 1 voucher thành công
        assertEquals(1, count);
        verify(voucherDAO, times(1)).deactivateVoucher("v-err");
        verify(voucherDAO, times(1)).deactivateVoucher("v-good");
    }

    @Test
    @DisplayName("Worker hoạt động ổn định khi auditLogService là null")
    void testRunScanAndDeactivate_NullAuditLogService_ExecutesWithoutError() {
        VoucherExpiryWorker workerWithoutAudit = new VoucherExpiryWorker(voucherDAO, null, 20);
        LocalDateTime past = LocalDateTime.now().minusDays(1);
        VoucherEntity v1 = createMockVoucher("v-standalone", "STANDALONE_CODE", past, 5, 20);

        when(voucherDAO.findExpiredActiveVouchers(any(), anyBoolean(), anyInt())).thenReturn(List.of(v1));

        int count = workerWithoutAudit.runScanAndDeactivate();

        assertEquals(1, count);
        verify(voucherDAO, times(1)).deactivateVoucher("v-standalone");
    }
}
