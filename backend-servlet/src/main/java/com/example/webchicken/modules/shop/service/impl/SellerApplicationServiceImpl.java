package com.example.webchicken.modules.shop.service.impl;

import com.example.webchicken.common.exception.ConflictException;
import com.example.webchicken.common.exception.NotFoundException;
import com.example.webchicken.common.exception.ValidationException;
import com.example.webchicken.modules.identity.dao.SellerDAO;
import com.example.webchicken.modules.identity.dao.UserDAO;
import com.example.webchicken.modules.identity.model.entity.SellerEntity;
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
import java.util.UUID;

public class SellerApplicationServiceImpl implements SellerApplicationService {

    private static final Logger log = LoggerFactory.getLogger(SellerApplicationServiceImpl.class);

    private final SellerApplicationDAO sellerApplicationDAO;
    private final StoreDAO storeDAO;
    private final SellerDAO sellerDAO;
    @SuppressWarnings("unused")
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

        // Kiểm tra xem đã có đơn đăng ký nào đang chờ duyệt không
        if (sellerApplicationDAO.findPendingByUserId(userId).isPresent()) {
            throw new ConflictException("Bạn đã có một hồ sơ đăng ký đang chờ xét duyệt. Vui lòng kiên nhẫn chờ Ban quản trị.");
        }

        SellerApplicationEntity entity = new SellerApplicationEntity();
        entity.setId(UUID.randomUUID().toString());
        entity.setUserId(userId);
        entity.setShopName(request.shopName().trim());
        entity.setDocumentUrl(request.documentUrl() != null ? request.documentUrl().trim() : null);
        entity.setStatus("PENDING");
        entity.setSubmittedAt(LocalDateTime.now());

        sellerApplicationDAO.save(entity);
        log.info("Người dùng {} đã nộp đơn đăng ký Seller: {} ({})", userId, entity.getShopName(), entity.getId());

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

            // 1. Tạo bản ghi trong sellers nếu chưa có
            if (sellerDAO.findById(app.getUserId()).isEmpty()) {
                SellerEntity seller = new SellerEntity();
                seller.setUserId(app.getUserId());
                seller.setApprovedAt(now);
                sellerDAO.save(seller);
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
        return new SellerApplicationResponse(
                entity.getId(),
                entity.getUserId(),
                entity.getShopName(),
                entity.getDocumentUrl(),
                entity.getStatus(),
                entity.getRejectionReason(),
                entity.getAdminResponseId(),
                entity.getSubmittedAt(),
                entity.getReviewedAt()
        );
    }
}
