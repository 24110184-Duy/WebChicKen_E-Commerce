package com.example.webchicken.modules.backoffice.service;

import com.example.webchicken.common.enums.UserStatus;
import com.example.webchicken.common.exception.NotFoundException;
import com.example.webchicken.common.exception.ValidationException;
import com.example.webchicken.modules.backoffice.dao.AuditLogDAO;
import com.example.webchicken.modules.backoffice.model.dto.response.AuditLogPageResponse;
import com.example.webchicken.modules.backoffice.model.dto.response.AuditLogResponse;
import com.example.webchicken.modules.backoffice.model.entity.AuditLogEntity;
import com.example.webchicken.modules.backoffice.service.impl.AuditLogServiceImpl;
import com.example.webchicken.modules.identity.dao.AccountBanDAO;
import com.example.webchicken.modules.identity.dao.AdminDAO;
import com.example.webchicken.modules.identity.dao.UserDAO;
import com.example.webchicken.modules.identity.model.dto.request.BanUserRequest;
import com.example.webchicken.modules.identity.model.entity.CustomerEntity;
import com.example.webchicken.modules.identity.service.AdminUserService;
import com.example.webchicken.modules.identity.service.impl.AdminUserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class AuditLogServiceTest {

    private AuditLogDAO auditLogDAO;
    private AdminUserService adminUserService;
    private AuditLogServiceImpl auditLogService;

    @BeforeEach
    void setUp() {
        auditLogDAO = mock(AuditLogDAO.class);
        adminUserService = mock(AdminUserService.class);
        auditLogService = new AuditLogServiceImpl(auditLogDAO, adminUserService);
    }

    @Test
    @DisplayName("Ghi nhật ký kiểm toán thành công với đầy đủ các trường")
    void testLogSuccess() {
        String adminId = "admin-uuid-101";
        String action = "APPROVE_PRODUCT";
        String targetType = "PRODUCT";
        String targetId = "prod-999";
        String detail = "Duyệt mở bán sản phẩm Gà Cay";
        String ipAddress = "192.168.1.50";

        auditLogService.log(adminId, action, targetType, targetId, detail, ipAddress);

        ArgumentCaptor<AuditLogEntity> captor = ArgumentCaptor.forClass(AuditLogEntity.class);
        verify(auditLogDAO, times(1)).save(captor.capture());

        AuditLogEntity saved = captor.getValue();
        assertNotNull(saved.getId());
        assertEquals(adminId, saved.getAdminId());
        assertEquals("APPROVE_PRODUCT", saved.getAction());
        assertEquals("PRODUCT", saved.getTargetType());
        assertEquals(targetId, saved.getTargetId());
        assertEquals(detail, saved.getDetail());
        assertEquals(ipAddress, saved.getIpAddress());
        assertNotNull(saved.getCreatedAt());
    }

    @Test
    @DisplayName("Ghi nhật ký thất bại khi action bị để trống hoặc null")
    void testLogValidationExceptionOnBlankAction() {
        assertThrows(ValidationException.class, () ->
                auditLogService.log("admin-1", "", "USER", "user-1", "Detail", "127.0.0.1")
        );
        assertThrows(ValidationException.class, () ->
                auditLogService.log("admin-1", null, "USER", "user-1", "Detail", "127.0.0.1")
        );
        verify(auditLogDAO, never()).save(any());
    }

    @Test
    @DisplayName("Tra cứu danh sách phân trang và tính toán tổng số trang chính xác")
    void testListLogsPagination() {
        AuditLogEntity log1 = new AuditLogEntity("l1", "admin-1", "BAN_USER", "USER", "u1", "Lý do vi phạm", "127.0.0.1", LocalDateTime.now());
        AuditLogEntity log2 = new AuditLogEntity("l2", "admin-1", "APPROVE_PRODUCT", "PRODUCT", "p1", "Duyệt SP", "127.0.0.1", LocalDateTime.now());

        when(auditLogDAO.findAll(1, 10, null, null, null, null)).thenReturn(List.of(log1, log2));
        when(auditLogDAO.countAll(null, null, null, null)).thenReturn(25L);

        AuditLogPageResponse page = auditLogService.listLogs(1, 10, null, null, null, null);

        assertNotNull(page);
        assertEquals(2, page.items().size());
        assertEquals(25, page.total());
        assertEquals(1, page.page());
        assertEquals(10, page.size());
        assertEquals(3, page.totalPages()); // ceil(25 / 10) = 3
    }

    @Test
    @DisplayName("Tra cứu chi tiết nhật ký theo ID thành công")
    void testGetByIdSuccess() {
        AuditLogEntity logEntity = new AuditLogEntity("log-123", "admin-1", "UNBAN_USER", "USER", "u-456", "Mở khóa tài khoản", "10.0.0.1", LocalDateTime.now());
        when(auditLogDAO.findById("log-123")).thenReturn(Optional.of(logEntity));

        AuditLogResponse res = auditLogService.getById("log-123");
        assertNotNull(res);
        assertEquals("log-123", res.id());
        assertEquals("UNBAN_USER", res.action());
        assertEquals("USER", res.targetType());
        assertEquals("u-456", res.targetId());
    }

    @Test
    @DisplayName("Tra cứu chi tiết nhật ký ném NotFoundException nếu ID không tồn tại")
    void testGetByIdNotFound() {
        when(auditLogDAO.findById("not-found")).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> auditLogService.getById("not-found"));
    }

    @Test
    @DisplayName("AdminUserService banUser tự động kích hoạt auditLogService ghi nhận BAN_USER")
    void testBanUserTriggersAuditLogging() {
        AdminDAO adminDAO = mock(AdminDAO.class);
        UserDAO userDAO = mock(UserDAO.class);
        AccountBanDAO accountBanDAO = mock(AccountBanDAO.class);

        AuditLogService mockAuditService = mock(AuditLogService.class);
        AdminUserService adminService = new AdminUserServiceImpl(
                adminDAO, userDAO, accountBanDAO, null, null, null, null, mockAuditService
        );

        CustomerEntity customer = new CustomerEntity();
        customer.setUserId("user-bad");
        customer.setEmail("bad@chicken.vn");
        customer.setFullName("Tài khoản gian lận");
        customer.setStatus(UserStatus.ACTIVE);

        when(userDAO.findById("user-bad")).thenReturn(Optional.of(customer));
        when(adminDAO.findById("user-bad")).thenReturn(Optional.empty());

        BanUserRequest req = new BanUserRequest("Vi phạm điều khoản nhiều lần", 7, null);
        adminService.banUser("admin-boss", "user-bad", req);

        // Verify audit log được gọi với action BAN_USER
        verify(mockAuditService, times(1)).log(
                eq("admin-boss"),
                eq("BAN_USER"),
                eq("USER"),
                eq("user-bad"),
                contains("Vi phạm điều khoản nhiều lần"),
                isNull()
        );
    }
}
