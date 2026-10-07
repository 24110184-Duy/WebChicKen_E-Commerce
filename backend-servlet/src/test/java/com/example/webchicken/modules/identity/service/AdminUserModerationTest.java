package com.example.webchicken.modules.identity.service;

import com.example.webchicken.common.enums.UserStatus;
import com.example.webchicken.common.exception.AuthorizationException;
import com.example.webchicken.common.exception.ConflictException;
import com.example.webchicken.common.exception.ValidationException;
import com.example.webchicken.modules.identity.dao.AccountBanDAO;
import com.example.webchicken.modules.identity.dao.AdminDAO;
import com.example.webchicken.modules.identity.dao.CustomerDAO;
import com.example.webchicken.modules.identity.dao.SellerDAO;
import com.example.webchicken.modules.identity.dao.UserDAO;
import com.example.webchicken.modules.identity.dao.UserSessionDAO;
import com.example.webchicken.modules.identity.model.dto.request.BanUserRequest;
import com.example.webchicken.modules.identity.model.dto.request.UnbanUserRequest;
import com.example.webchicken.modules.identity.model.entity.AccountBanEntity;
import com.example.webchicken.modules.identity.model.entity.AdminEntity;
import com.example.webchicken.modules.identity.model.entity.CustomerEntity;
import com.example.webchicken.modules.identity.service.impl.AdminUserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class AdminUserModerationTest {

    private AdminDAO adminDAO;
    private UserDAO userDAO;
    private AccountBanDAO accountBanDAO;
    private UserSessionDAO userSessionDAO;
    private CustomerDAO customerDAO;
    private SellerDAO sellerDAO;
    private AdminUserService adminUserService;

    @BeforeEach
    void setUp() {
        adminDAO = mock(AdminDAO.class);
        userDAO = mock(UserDAO.class);
        accountBanDAO = mock(AccountBanDAO.class);
        userSessionDAO = mock(UserSessionDAO.class);
        customerDAO = mock(CustomerDAO.class);
        sellerDAO = mock(SellerDAO.class);

        adminUserService = new AdminUserServiceImpl(
                adminDAO, userDAO, accountBanDAO, userSessionDAO, customerDAO, sellerDAO, null
        );
    }

    @Test
    @DisplayName("Ban user thành công, đổi trạng thái sang BANNED và tự động thu hồi active session")
    void testBanUserSuccessAndDeactivatesSessions() {
        String adminId = "admin-uuid-1";
        String targetUserId = "user-uuid-2";

        CustomerEntity customer = new CustomerEntity();
        customer.setUserId(targetUserId);
        customer.setEmail("scammer@chicken.vn");
        customer.setFullName("Nguyễn Văn Lừa");
        customer.setStatus(UserStatus.ACTIVE);

        when(userDAO.findById(targetUserId)).thenReturn(Optional.of(customer));
        when(adminDAO.findById(targetUserId)).thenReturn(Optional.empty());

        BanUserRequest req = new BanUserRequest("Gian lận đặt đơn ảo số lượng lớn", 30, null);
        adminUserService.banUser(adminId, targetUserId, req);

        // Kiểm tra targetUser được đổi status thành BANNED
        assertEquals(UserStatus.BANNED, customer.getStatus());
        verify(userDAO).update(customer);

        // Kiểm tra lưu AccountBanEntity
        ArgumentCaptor<AccountBanEntity> banCaptor = ArgumentCaptor.forClass(AccountBanEntity.class);
        verify(accountBanDAO).save(banCaptor.capture());
        AccountBanEntity savedBan = banCaptor.getValue();
        assertEquals(targetUserId, savedBan.getUserId());
        assertEquals("Gian lận đặt đơn ảo số lượng lớn", savedBan.getDescription());
        assertEquals(adminId, savedBan.getBannedBy());
        assertNotNull(savedBan.getBannedUntil());

        // Kiểm tra thu hồi session ngay lập tức
        verify(userSessionDAO).deactivateAllByUserId(targetUserId);
    }

    @Test
    @DisplayName("Admin tự ban chính mình phải bị chặn bởi ConflictException")
    void testSelfBanForbidden() {
        String adminId = "admin-uuid-1";
        BanUserRequest req = new BanUserRequest("Thử tự khóa", null, null);

        assertThrows(ConflictException.class, () -> {
            adminUserService.banUser(adminId, adminId, req);
        });

        verify(userDAO, never()).update(any());
        verify(accountBanDAO, never()).save(any());
        verify(userSessionDAO, never()).deactivateAllByUserId(any());
    }

    @Test
    @DisplayName("Không được phép khóa tài khoản của Quản trị viên hệ thống (Admin)")
    void testBanAdminForbidden() {
        String adminId = "admin-uuid-1";
        String targetAdminId = "admin-uuid-2";

        AdminEntity targetAdmin = new AdminEntity();
        targetAdmin.setUserId(targetAdminId);
        targetAdmin.setStatus(UserStatus.ACTIVE);

        when(userDAO.findById(targetAdminId)).thenReturn(Optional.of(targetAdmin));
        when(adminDAO.findById(targetAdminId)).thenReturn(Optional.of(targetAdmin));

        BanUserRequest req = new BanUserRequest("Khóa admin", null, null);

        assertThrows(AuthorizationException.class, () -> {
            adminUserService.banUser(adminId, targetAdminId, req);
        });

        verify(userDAO, never()).update(any());
        verify(accountBanDAO, never()).save(any());
    }

    @Test
    @DisplayName("Mở khóa (unban) thành công chuyển status về ACTIVE và cập nhật thời điểm unbanned_at")
    void testUnbanUserSuccess() {
        String adminId = "admin-uuid-1";
        String targetUserId = "user-uuid-3";

        CustomerEntity customer = new CustomerEntity();
        customer.setUserId(targetUserId);
        customer.setStatus(UserStatus.BANNED);

        AccountBanEntity activeBan = new AccountBanEntity();
        activeBan.setBanId("ban-1");
        activeBan.setUserId(targetUserId);
        activeBan.setDescription("Vi phạm quy chế");

        when(userDAO.findById(targetUserId)).thenReturn(Optional.of(customer));
        when(accountBanDAO.findActiveBanByUserId(targetUserId)).thenReturn(Optional.of(activeBan));

        adminUserService.unbanUser(adminId, targetUserId, new UnbanUserRequest("Đã giải trình hợp lệ"));

        assertEquals(UserStatus.ACTIVE, customer.getStatus());
        verify(userDAO).update(customer);

        assertNotNull(activeBan.getUnbannedAt());
        verify(accountBanDAO).update(activeBan);
    }
}
