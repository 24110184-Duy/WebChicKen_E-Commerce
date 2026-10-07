package com.example.webchicken.modules.identity.service.impl;

import com.example.webchicken.common.enums.UserStatus;
import com.example.webchicken.common.exception.AuthorizationException;
import com.example.webchicken.common.exception.ConflictException;
import com.example.webchicken.common.exception.NotFoundException;
import com.example.webchicken.common.exception.ValidationException;
import com.example.webchicken.modules.identity.dao.AccountBanDAO;
import com.example.webchicken.modules.identity.dao.AdminDAO;
import com.example.webchicken.modules.identity.dao.CustomerDAO;
import com.example.webchicken.modules.identity.dao.SellerDAO;
import com.example.webchicken.modules.identity.dao.UserDAO;
import com.example.webchicken.modules.identity.dao.UserSessionDAO;
import com.example.webchicken.modules.identity.model.dto.request.BanUserRequest;
import com.example.webchicken.modules.identity.model.dto.request.UnbanUserRequest;
import com.example.webchicken.modules.identity.model.dto.response.AccountBanResponse;
import com.example.webchicken.modules.identity.model.dto.response.AdminUserPageResponse;
import com.example.webchicken.modules.identity.model.dto.response.AdminUserResponse;
import com.example.webchicken.modules.identity.model.entity.AccountBanEntity;
import com.example.webchicken.modules.identity.model.entity.AdminEntity;
import com.example.webchicken.modules.identity.model.entity.CustomerEntity;
import com.example.webchicken.modules.identity.model.entity.SellerEntity;
import com.example.webchicken.modules.identity.model.entity.UserEntity;
import com.example.webchicken.modules.identity.service.AdminUserService;
import com.example.webchicken.modules.shop.model.dto.response.StoreResponse;
import com.example.webchicken.modules.shop.service.StoreService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

/**
 * Cài đặt nghiệp vụ quản trị người dùng, khóa và mở khóa tài khoản cho Backoffice.
 * Tuân thủ CODE_PRINCIPLES và ARCHITECTURE:
 * - 100% logic nghiệp vụ nằm ở Service, không ở Servlet hay Entity.
 * - Khóa tài khoản -> Ghi nhận vào account_bans -> Thu hồi active session ngay lập tức.
 */
public class AdminUserServiceImpl implements AdminUserService {

    private static final Logger log = LoggerFactory.getLogger(AdminUserServiceImpl.class);

    private final AdminDAO adminDAO;
    private final UserDAO userDAO;
    private final AccountBanDAO accountBanDAO;
    private final UserSessionDAO userSessionDAO;
    private final CustomerDAO customerDAO;
    private final SellerDAO sellerDAO;
    private final StoreService storeService;
    private final com.example.webchicken.modules.backoffice.service.AuditLogService auditLogService;

    public AdminUserServiceImpl(
            AdminDAO adminDAO,
            UserDAO userDAO,
            AccountBanDAO accountBanDAO,
            UserSessionDAO userSessionDAO,
            CustomerDAO customerDAO,
            SellerDAO sellerDAO,
            StoreService storeService,
            com.example.webchicken.modules.backoffice.service.AuditLogService auditLogService
    ) {
        this.adminDAO = Objects.requireNonNull(adminDAO, "adminDAO must not be null");
        this.userDAO = Objects.requireNonNull(userDAO, "userDAO must not be null");
        this.accountBanDAO = Objects.requireNonNull(accountBanDAO, "accountBanDAO must not be null");
        this.userSessionDAO = userSessionDAO;
        this.customerDAO = customerDAO;
        this.sellerDAO = sellerDAO;
        this.storeService = storeService;
        this.auditLogService = auditLogService;
    }

    public AdminUserServiceImpl(
            AdminDAO adminDAO,
            UserDAO userDAO,
            AccountBanDAO accountBanDAO,
            UserSessionDAO userSessionDAO,
            CustomerDAO customerDAO,
            SellerDAO sellerDAO,
            StoreService storeService
    ) {
        this(adminDAO, userDAO, accountBanDAO, userSessionDAO, customerDAO, sellerDAO, storeService, null);
    }

    public AdminUserServiceImpl(AdminDAO adminDAO, UserDAO userDAO, AccountBanDAO accountBanDAO) {
        this(adminDAO, userDAO, accountBanDAO, null, null, null, null, null);
    }

    @Override
    public AdminUserPageResponse listUsers(int page, int size, String search, String status, String role) {
        int safePage = Math.max(1, page);
        int safeSize = Math.min(100, Math.max(1, size));

        List<UserEntity> users = userDAO.findAll(safePage, safeSize, search, status, role);
        long total = userDAO.countAll(search, status, role);

        List<AdminUserResponse> items = users.stream()
                .map(this::toAdminUserResponse)
                .toList();

        int totalPages = safeSize > 0 ? (int) Math.ceil((double) total / safeSize) : 0;
        return new AdminUserPageResponse(items, total, safePage, safeSize, totalPages);
    }

    @Override
    public AdminUserResponse getUserDetail(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new ValidationException("User ID không được để trống.");
        }

        UserEntity user = userDAO.findById(userId.trim())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng với ID: " + userId));

        return toAdminUserResponse(user);
    }

    @Override
    public void banUser(String adminId, String userId, BanUserRequest request) {
        if (userId == null || userId.isBlank()) {
            throw new ValidationException("User ID không được để trống.");
        }
        if (adminId != null && adminId.trim().equalsIgnoreCase(userId.trim())) {
            throw new ConflictException("Quản trị viên không thể tự khóa tài khoản của chính mình.");
        }

        UserEntity targetUser = userDAO.findById(userId.trim())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng với ID: " + userId));

        // Không cho phép cấm tài khoản Admin khác
        if (adminDAO.findById(userId.trim()).isPresent()) {
            throw new AuthorizationException("Không có quyền cấm tài khoản Quản trị viên hệ thống.");
        }

        if (targetUser.getStatus() == UserStatus.BANNED) {
            throw new ConflictException("Tài khoản người dùng này đã bị khóa từ trước.");
        }

        String reason = (request != null && request.reason() != null) ? request.reason().trim() : "";
        if (reason.isBlank()) {
            throw new ValidationException("Vui lòng cung cấp lý do khóa tài khoản.");
        }

        LocalDateTime bannedAt = LocalDateTime.now();
        LocalDateTime bannedUntil = null;
        if (request != null) {
            if (request.durationDays() != null && request.durationDays() > 0) {
                bannedUntil = bannedAt.plusDays(request.durationDays());
            } else if (request.bannedUntil() != null) {
                bannedUntil = request.bannedUntil();
            }
        }

        // 1. Cập nhật trạng thái người dùng
        targetUser.setStatus(UserStatus.BANNED);
        targetUser.setUpdatedAt(bannedAt);
        userDAO.update(targetUser);

        // 2. Ghi nhận lệnh cấm vào bảng account_bans
        AccountBanEntity ban = new AccountBanEntity();
        ban.setBanId(UUID.randomUUID().toString());
        ban.setUserId(userId.trim());
        ban.setDescription(reason);
        ban.setBannedAt(bannedAt);
        ban.setBannedUntil(bannedUntil);
        ban.setBannedBy(adminId);
        ban.setUnbannedAt(null);
        accountBanDAO.save(ban);

        // 3. Tự động thu hồi mọi active session của tài khoản đó ngay lập tức (TASK-66)
        if (userSessionDAO != null) {
            int revokedCount = userSessionDAO.deactivateAllByUserId(userId.trim());
            log.info("Đã thu hồi {} active session của user {} khi bị ban bởi admin {}", revokedCount, userId, adminId);
        }

        // 4. Ghi nhận nhật ký kiểm toán quản trị (TASK-67)
        if (auditLogService != null) {
            String durInfo = bannedUntil != null ? " (Thời hạn đến: " + bannedUntil + ")" : " (Vĩnh viễn)";
            auditLogService.log(adminId, "BAN_USER", "USER", userId.trim(), "Khóa tài khoản: " + reason + durInfo, null);
        }

        log.info("Admin {} đã khóa tài khoản user {} thành công. Lý do: {}, Thời hạn đến: {}",
                adminId, userId, reason, bannedUntil != null ? bannedUntil : "Vĩnh viễn");
    }

    @Override
    public void unbanUser(String adminId, String userId, UnbanUserRequest request) {
        if (userId == null || userId.isBlank()) {
            throw new ValidationException("User ID không được để trống.");
        }

        UserEntity targetUser = userDAO.findById(userId.trim())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng với ID: " + userId));

        if (targetUser.getStatus() != UserStatus.BANNED && targetUser.getStatus() != UserStatus.LOCKED) {
            throw new ConflictException("Tài khoản này đang ở trạng thái bình thường (ACTIVE), không cần mở khóa.");
        }

        LocalDateTime now = LocalDateTime.now();

        // 1. Cập nhật trạng thái người dùng về ACTIVE
        targetUser.setStatus(UserStatus.ACTIVE);
        targetUser.setUpdatedAt(now);
        userDAO.update(targetUser);

        // 2. Cập nhật thời điểm kết thúc cấm (unbanned_at) trên bản ghi ban đang hoạt động
        accountBanDAO.findActiveBanByUserId(userId.trim()).ifPresent(ban -> {
            ban.setUnbannedAt(now);
            accountBanDAO.update(ban);
        });

        // 3. Ghi nhận nhật ký kiểm toán quản trị (TASK-67)
        if (auditLogService != null) {
            String note = (request != null && request.reason() != null) ? request.reason().trim() : "Mở khóa bởi Admin";
            auditLogService.log(adminId, "UNBAN_USER", "USER", userId.trim(), "Mở khóa tài khoản: " + note, null);
        }

        log.info("Admin {} đã mở khóa thành công tài khoản user {}. Lý do mở: {}",
                adminId, userId, (request != null && request.reason() != null) ? request.reason().trim() : "Mở khóa bởi Admin");
    }

    @Override
    public List<AccountBanResponse> getBanHistory(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new ValidationException("User ID không được để trống.");
        }
        userDAO.findById(userId.trim())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng với ID: " + userId));

        return accountBanDAO.findByUserId(userId.trim()).stream()
                .map(this::toBanResponse)
                .toList();
    }

    // ── Helper Mappers ─────────────────────────────────────────────────────────

    private AdminUserResponse toAdminUserResponse(UserEntity user) {
        List<String> roles = resolveRoles(user);

        String tier = null;
        Integer loyaltyPoint = null;
        if (customerDAO != null) {
            var custOpt = customerDAO.findById(user.getUserId());
            if (custOpt.isPresent()) {
                CustomerEntity c = custOpt.get();
                tier = c.getTier() != null ? c.getTier().name() : "STANDARD";
                loyaltyPoint = c.getLoyaltyPoint();
            }
        } else if (user instanceof CustomerEntity c) {
            tier = c.getTier() != null ? c.getTier().name() : "STANDARD";
            loyaltyPoint = c.getLoyaltyPoint();
        }

        String storeId = null;
        String storeName = null;
        if (roles.contains("SELLER") && storeService != null) {
            try {
                StoreResponse store = storeService.getStoreBySellerId(user.getUserId());
                if (store != null) {
                    storeId = store.id();
                    storeName = store.storeName();
                }
            } catch (Exception ignored) {
                // Seller chưa mở gian hàng hoặc lỗi tra cứu
            }
        }

        AccountBanResponse activeBan = accountBanDAO.findActiveBanByUserId(user.getUserId())
                .map(this::toBanResponse)
                .orElse(null);

        return new AdminUserResponse(
                user.getUserId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getLogoUrl(),
                user.getStatus() != null ? user.getStatus().name() : "ACTIVE",
                roles,
                tier,
                loyaltyPoint,
                storeId,
                storeName,
                user.getCreatedAt(),
                user.getUpdatedAt(),
                activeBan
        );
    }

    private AccountBanResponse toBanResponse(AccountBanEntity ban) {
        boolean isActive = ban.getUnbannedAt() == null &&
                (ban.getBannedUntil() == null || ban.getBannedUntil().isAfter(LocalDateTime.now()));

        return new AccountBanResponse(
                ban.getBanId(),
                ban.getUserId(),
                ban.getDescription(),
                ban.getBannedAt(),
                ban.getBannedUntil(),
                ban.getBannedBy(),
                ban.getUnbannedAt(),
                isActive
        );
    }

    private List<String> resolveRoles(UserEntity user) {
        List<String> roles = new ArrayList<>();
        if (user instanceof CustomerEntity) {
            roles.add("CUSTOMER");
        } else if (user instanceof SellerEntity) {
            roles.add("SELLER");
        } else if (user instanceof AdminEntity a) {
            roles.add(a.getRole() != null ? a.getRole().name() : "MODERATOR");
        }

        // Kiểm tra thêm qua các DAO nếu quan hệ dạng đa vai trò
        if (customerDAO != null && !roles.contains("CUSTOMER") && customerDAO.findById(user.getUserId()).isPresent()) {
            roles.add("CUSTOMER");
        }
        if (sellerDAO != null && !roles.contains("SELLER") && sellerDAO.findById(user.getUserId()).isPresent()) {
            roles.add("SELLER");
        }
        if (adminDAO != null && !roles.contains("SUPER_ADMIN") && !roles.contains("MODERATOR")) {
            var admOpt = adminDAO.findById(user.getUserId());
            if (admOpt.isPresent()) {
                roles.add(admOpt.get().getRole() != null ? admOpt.get().getRole().name() : "MODERATOR");
            }
        }

        if (roles.isEmpty()) {
            roles.add("CUSTOMER");
        }
        return roles;
    }
}
