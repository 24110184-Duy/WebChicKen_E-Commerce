package com.example.webchicken.modules.shop.service.impl;

import com.example.webchicken.common.exception.ConflictException;
import com.example.webchicken.common.exception.NotFoundException;
import com.example.webchicken.common.exception.ValidationException;
import com.example.webchicken.modules.identity.dao.SellerDAO;
import com.example.webchicken.modules.identity.dao.UserDAO;
import com.example.webchicken.modules.identity.model.entity.SellerEntity;
import com.example.webchicken.modules.identity.model.entity.UserEntity;
import com.example.webchicken.modules.shop.dao.SellerApplicationDAO;
import com.example.webchicken.modules.shop.dao.StoreDAO;
import com.example.webchicken.modules.shop.model.dto.request.ApplySellerRequest;
import com.example.webchicken.modules.shop.model.dto.request.ReviewApplicationRequest;
import com.example.webchicken.modules.shop.model.dto.response.SellerApplicationResponse;
import com.example.webchicken.modules.shop.model.entity.SellerApplicationEntity;
import com.example.webchicken.modules.shop.model.entity.StoreEntity;
import com.example.webchicken.modules.shop.service.SellerApplicationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

public class SellerApplicationServiceImpl implements SellerApplicationService {

    private static final Logger log = LoggerFactory.getLogger(SellerApplicationServiceImpl.class);

    private final SellerApplicationDAO sellerApplicationDAO;
    private final StoreDAO storeDAO;
    private final SellerDAO sellerDAO;
    private final UserDAO userDAO;

    public SellerApplicationServiceImpl(
            SellerApplicationDAO sellerApplicationDAO,
            StoreDAO storeDAO,
            SellerDAO sellerDAO,
            UserDAO userDAO) {
        this.sellerApplicationDAO = Objects.requireNonNull(sellerApplicationDAO, "sellerApplicationDAO must not be null");
        this.storeDAO = Objects.requireNonNull(storeDAO, "storeDAO must not be null");
        this.sellerDAO = Objects.requireNonNull(sellerDAO, "sellerDAO must not be null");
        this.userDAO = Objects.requireNonNull(userDAO, "userDAO must not be null");
    }

    public SellerApplicationServiceImpl(SellerApplicationDAO sellerApplicationDAO) {
        this(sellerApplicationDAO,
                new StoreDAO(sellerApplicationDAO.getEntityManagerFactory()),
                new SellerDAO(sellerApplicationDAO.getEntityManagerFactory()),
                new UserDAO(sellerApplicationDAO.getEntityManagerFactory()));
    }

    @Override
    public SellerApplicationResponse apply(String userId, ApplySellerRequest request) {
        if (userId == null || userId.isBlank()) {
            throw new ValidationException("User ID không hợp lệ.");
        }
        if (request == null || request.shopName() == null || request.shopName().trim().isBlank()) {
            throw new ValidationException("Tên gian hàng không được để trống.");
        }

        // Kiểm tra xem người dùng đã là Người bán và có gian hàng chưa
        if (storeDAO.findBySellerId(userId).isPresent()) {
            throw new ConflictException("Tài khoản của bạn đã sở hữu một gian hàng đang hoạt động.");
        }

        LocalDateTime now = LocalDateTime.now();

        // Cập nhật hoặc tạo mới đơn đăng ký ở trạng thái PENDING chờ Admin duyệt
        Optional<SellerApplicationEntity> pendingOpt = sellerApplicationDAO.findPendingByUserId(userId);
        SellerApplicationEntity entity;
        if (pendingOpt.isPresent()) {
            entity = pendingOpt.get();
            entity.setShopName(request.shopName().trim());
            entity.setDocumentUrl(request.documentUrl() != null ? request.documentUrl().trim() : null);
            if (request.taxCode() != null) entity.setTaxCode(request.taxCode().trim());
            if (request.ownerName() != null) entity.setOwnerName(request.ownerName().trim());
            if (request.phone() != null) entity.setPhone(request.phone().trim());
            if (request.email() != null) entity.setEmail(request.email().trim());
            if (request.farmLocation() != null) entity.setFarmLocation(request.farmLocation().trim());
            if (request.farmType() != null) entity.setFarmType(request.farmType().trim());
            if (request.certificateType() != null) entity.setCertificateType(request.certificateType().trim());
            if (request.certificateNumber() != null) entity.setCertificateNumber(request.certificateNumber().trim());
            if (request.certificateExpiry() != null) entity.setCertificateExpiry(request.certificateExpiry().trim());
            if (request.dailyCapacity() != null) entity.setDailyCapacity(request.dailyCapacity().trim());
            entity.setStatus("PENDING");
            entity.setSubmittedAt(now);
            entity.setReviewedAt(null);
            entity.setAdminResponseId(null);
            entity.setRejectionReason(null);
            sellerApplicationDAO.update(entity);
            log.info("Người dùng {} đã cập nhật đơn đăng ký người bán (chờ Admin duyệt): {}", userId, entity.getId());
        } else {
            entity = new SellerApplicationEntity();
            entity.setId(UUID.randomUUID().toString());
            entity.setUserId(userId);
            entity.setShopName(request.shopName().trim());
            entity.setDocumentUrl(request.documentUrl() != null ? request.documentUrl().trim() : null);
            entity.setTaxCode(request.taxCode() != null ? request.taxCode().trim() : null);
            entity.setOwnerName(request.ownerName() != null ? request.ownerName().trim() : null);
            entity.setPhone(request.phone() != null ? request.phone().trim() : null);
            entity.setEmail(request.email() != null ? request.email().trim() : null);
            entity.setFarmLocation(request.farmLocation() != null ? request.farmLocation().trim() : null);
            entity.setFarmType(request.farmType() != null ? request.farmType().trim() : "Thương mại điện tử & Bán lẻ");
            entity.setCertificateType(request.certificateType() != null ? request.certificateType().trim() : "ĐKKD Hợp Lệ");
            entity.setCertificateNumber(request.certificateNumber() != null ? request.certificateNumber().trim() : "DKKD-2025-01");
            entity.setCertificateExpiry(request.certificateExpiry() != null ? request.certificateExpiry().trim() : "Không thời hạn");
            entity.setDailyCapacity(request.dailyCapacity() != null ? request.dailyCapacity().trim() : "Cung ứng theo ngày");
            entity.setStatus("PENDING");
            entity.setSubmittedAt(now);
            sellerApplicationDAO.save(entity);
            log.info("Người dùng {} đã gửi đơn đăng ký người bán mới (chờ Admin duyệt): {}", userId, entity.getId());
        }

        return toResponse(entity);
    }

    @Override
    public SellerApplicationResponse getMyApplication(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new ValidationException("User ID không hợp lệ.");
        }
        return sellerApplicationDAO.findLatestByUserId(userId)
                .map(this::toResponse)
                .orElse(null);
    }

    @Override
    public SellerApplicationResponse review(String applicationId, String adminId, ReviewApplicationRequest request) {
        if (applicationId == null || applicationId.isBlank()) {
            throw new ValidationException("Mã đơn đăng ký không được để trống.");
        }
        if (request == null || request.status() == null || request.status().isBlank()) {
            throw new ValidationException("Trạng thái phê duyệt không được để trống.");
        }

        String targetStatus = request.status().trim().toUpperCase();
        if ("APPROVE".equals(targetStatus)) {
            targetStatus = "APPROVED";
        } else if ("REJECT".equals(targetStatus)) {
            targetStatus = "REJECTED";
        }
        if (!"APPROVED".equals(targetStatus) && !"REJECTED".equals(targetStatus)) {
            throw new ValidationException("Trạng thái chỉ được phép là APPROVED hoặc REJECTED.");
        }

        SellerApplicationEntity app = sellerApplicationDAO.findById(applicationId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy đơn đăng ký mã: " + applicationId));

        if (!"PENDING".equalsIgnoreCase(app.getStatus())) {
            throw new ConflictException("Đơn đăng ký này đã được xử lý trước đó với trạng thái: " + app.getStatus());
        }

        if ("REJECTED".equals(targetStatus)) {
            if (request.rejectionReason() == null || request.rejectionReason().trim().isBlank()) {
                throw new ValidationException("Vui lòng cung cấp lý do từ chối hồ sơ.");
            }
            app.setStatus("REJECTED");
            app.setRejectionReason(request.rejectionReason().trim());
        } else {
            app.setStatus("APPROVED");
            app.setRejectionReason(null);

            // Nâng cấp user thành Seller & Khởi tạo Store
            LocalDateTime now = LocalDateTime.now();

            // 1. Tạo hoặc cập nhật bản ghi trong sellers
            Optional<SellerEntity> sellerOpt = sellerDAO.findById(app.getUserId());
            if (sellerOpt.isEmpty()) {
                SellerEntity seller = new SellerEntity();
                seller.setUserId(app.getUserId());
                seller.setApprovedAt(now);
                if (app.getTaxCode() != null) {
                    seller.setTaxCode(app.getTaxCode());
                }
                sellerDAO.save(seller);
            } else if (app.getTaxCode() != null && sellerOpt.get().getTaxCode() == null) {
                SellerEntity seller = sellerOpt.get();
                seller.setTaxCode(app.getTaxCode());
                sellerDAO.update(seller);
            }

            // 2. Tạo gian hàng Store mặc định
            if (storeDAO.findBySellerId(app.getUserId()).isEmpty()) {
                StoreEntity store = new StoreEntity(
                        UUID.randomUUID().toString(),
                        app.getShopName(),
                        "SELLER",
                        app.getUserId(),
                        now
                );
                storeDAO.save(store);
                log.info("Đã tự động khởi tạo gian hàng [{}] cho người bán {}", store.getStoreName(), app.getUserId());
            }
        }

        app.setAdminResponseId(adminId);
        app.setReviewedAt(LocalDateTime.now());
        SellerApplicationEntity updated = sellerApplicationDAO.update(app);

        log.info("Admin {} đã duyệt đơn {} thành {}", adminId, applicationId, targetStatus);
        return toResponse(updated);
    }

    @Override
    public List<SellerApplicationResponse> listApplications(int page, int size, String status) {
        return sellerApplicationDAO.findAll(page, size, status).stream()
                .map(this::toResponse)
                .toList();
    }

    private SellerApplicationResponse toResponse(SellerApplicationEntity entity) {
        String ownerName = entity.getOwnerName();
        String phone = entity.getPhone();
        String email = entity.getEmail();
        String farmLocation = entity.getFarmLocation();
        String taxCode = entity.getTaxCode();

        // Fallback tự động lấy thông tin từ UserEntity / SellerEntity nếu entity chưa có
        if (ownerName == null || phone == null || email == null) {
            try {
                Optional<UserEntity> userOpt = userDAO.findById(entity.getUserId());
                if (userOpt.isPresent()) {
                    UserEntity u = userOpt.get();
                    if (ownerName == null || ownerName.isBlank()) ownerName = u.getFullName() != null ? u.getFullName() : u.getUsername();
                    if (phone == null || phone.isBlank()) phone = u.getPhone();
                    if (email == null || email.isBlank()) email = u.getEmail();
                }
            } catch (Exception ignored) {}
        }
        if (taxCode == null || taxCode.isBlank()) {
            try {
                Optional<SellerEntity> sellerOpt = sellerDAO.findById(entity.getUserId());
                if (sellerOpt.isPresent() && sellerOpt.get().getTaxCode() != null) {
                    taxCode = sellerOpt.get().getTaxCode();
                }
            } catch (Exception ignored) {}
        }

        return new SellerApplicationResponse(
                entity.getId(),
                entity.getUserId(),
                entity.getShopName(),
                entity.getDocumentUrl(),
                entity.getStatus(),
                entity.getRejectionReason(),
                entity.getAdminResponseId(),
                entity.getSubmittedAt(),
                entity.getReviewedAt(),
                ownerName,
                phone,
                email,
                farmLocation,
                entity.getFarmType() != null ? entity.getFarmType() : "Thương mại điện tử & Bán lẻ",
                taxCode,
                entity.getCertificateType() != null ? entity.getCertificateType() : "ĐKKD Hợp Lệ",
                entity.getCertificateNumber() != null ? entity.getCertificateNumber() : "DKKD-2025-01",
                entity.getCertificateExpiry() != null ? entity.getCertificateExpiry() : "Không thời hạn",
                entity.getDailyCapacity() != null ? entity.getDailyCapacity() : "Cung ứng theo ngày"
        );
    }
}
