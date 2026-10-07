package com.example.webchicken.modules.shop.service.impl;

import com.example.webchicken.common.exception.NotFoundException;
import com.example.webchicken.common.exception.ValidationException;
import com.example.webchicken.modules.backoffice.service.AuditLogService;
import com.example.webchicken.modules.identity.dao.UserDAO;
import com.example.webchicken.modules.identity.model.entity.UserEntity;
import com.example.webchicken.modules.shop.dao.FeedbackDAO;
import com.example.webchicken.modules.shop.dao.StoreDAO;
import com.example.webchicken.modules.shop.model.dto.request.CreateFeedbackRequest;
import com.example.webchicken.modules.shop.model.dto.request.RespondFeedbackRequest;
import com.example.webchicken.modules.shop.model.dto.response.FeedbackPageResponse;
import com.example.webchicken.modules.shop.model.dto.response.FeedbackResponse;
import com.example.webchicken.modules.shop.model.entity.FeedbackEntity;
import com.example.webchicken.modules.shop.model.entity.StoreEntity;
import com.example.webchicken.modules.shop.service.FeedbackService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

/**
 * Cài đặt nghiệp vụ xử lý phản hồi, thắc mắc và khiếu nại từ Nhà Bán gửi lên Ban Quản Trị (TASK-69).
 */
public class FeedbackServiceImpl implements FeedbackService {

    private static final Logger log = LoggerFactory.getLogger(FeedbackServiceImpl.class);

    private final FeedbackDAO feedbackDAO;
    private final StoreDAO storeDAO;
    private final UserDAO userDAO;
    private final AuditLogService auditLogService;

    public FeedbackServiceImpl(
            FeedbackDAO feedbackDAO,
            StoreDAO storeDAO,
            UserDAO userDAO,
            AuditLogService auditLogService
    ) {
        this.feedbackDAO = Objects.requireNonNull(feedbackDAO, "feedbackDAO must not be null");
        this.storeDAO = storeDAO;
        this.userDAO = userDAO;
        this.auditLogService = auditLogService;
    }

    public FeedbackServiceImpl(FeedbackDAO feedbackDAO, StoreDAO storeDAO, UserDAO userDAO) {
        this(feedbackDAO, storeDAO, userDAO, null);
    }

    public FeedbackServiceImpl(FeedbackDAO feedbackDAO) {
        this(feedbackDAO, null, null, null);
    }

    @Override
    public FeedbackResponse createFeedback(String userId, CreateFeedbackRequest request) {
        if (userId == null || userId.isBlank()) {
            throw new ValidationException("Mã người dùng không được để trống.");
        }
        if (request == null) {
            throw new ValidationException("Dữ liệu phản hồi không được để trống.");
        }
        if (request.subject() == null || request.subject().trim().isBlank()) {
            throw new ValidationException("Tiêu đề phản hồi / khiếu nại không được để trống.");
        }
        if (request.subject().trim().length() > 255) {
            throw new ValidationException("Tiêu đề không được vượt quá 255 ký tự.");
        }
        if (request.content() == null || request.content().trim().isBlank()) {
            throw new ValidationException("Nội dung chi tiết phản hồi không được để trống.");
        }

        String type = (request.type() != null && !request.type().trim().isBlank())
                ? request.type().trim().toUpperCase()
                : "INQUIRY";

        String feedbackId = UUID.randomUUID().toString();
        FeedbackEntity entity = new FeedbackEntity(
                feedbackId,
                userId.trim(),
                type,
                request.subject().trim(),
                request.content().trim(),
                request.imageUrl() != null ? request.imageUrl().trim() : null
        );

        feedbackDAO.save(entity);
        log.info("Seller [{}] submitted new feedback ticket [{}] - Type: [{}] - Subject: [{}]",
                userId, feedbackId, type, entity.getSubject());

        return toResponse(entity);
    }

    @Override
    public FeedbackPageResponse getSellerFeedbacks(String userId, int page, int size) {
        if (userId == null || userId.isBlank()) {
            throw new ValidationException("Mã người dùng không được để trống.");
        }
        int safePage = Math.max(1, page);
        int safeSize = Math.min(100, Math.max(1, size));

        List<FeedbackEntity> list = feedbackDAO.findByUserId(userId, safePage, safeSize);
        long total = feedbackDAO.countByUserId(userId);

        List<FeedbackResponse> items = list.stream().map(this::toResponse).toList();
        int totalPages = safeSize > 0 ? (int) Math.ceil((double) total / safeSize) : 0;

        return new FeedbackPageResponse(items, total, safePage, safeSize, totalPages);
    }

    @Override
    public FeedbackPageResponse listAdminFeedbacks(int page, int size, String status, String type, String search) {
        int safePage = Math.max(1, page);
        int safeSize = Math.min(100, Math.max(1, size));

        List<FeedbackEntity> list = feedbackDAO.findAll(safePage, safeSize, status, type, search);
        long total = feedbackDAO.countAll(status, type, search);

        List<FeedbackResponse> items = list.stream().map(this::toResponse).toList();
        int totalPages = safeSize > 0 ? (int) Math.ceil((double) total / safeSize) : 0;

        return new FeedbackPageResponse(items, total, safePage, safeSize, totalPages);
    }

    @Override
    public FeedbackResponse getFeedbackDetail(String id) {
        if (id == null || id.isBlank()) {
            throw new ValidationException("Mã phản hồi không được để trống.");
        }
        FeedbackEntity entity = feedbackDAO.findById(id.trim())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phản hồi với mã: " + id));

        return toResponse(entity);
    }

    @Override
    public FeedbackResponse respondFeedback(String id, String adminId, RespondFeedbackRequest request, String clientIp) {
        if (id == null || id.isBlank()) {
            throw new ValidationException("Mã phản hồi không được để trống.");
        }
        if (request == null) {
            throw new ValidationException("Dữ liệu xử lý phản hồi không được để trống.");
        }

        FeedbackEntity entity = feedbackDAO.findById(id.trim())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phản hồi với mã: " + id));

        String newStatus = (request.status() != null && !request.status().trim().isBlank())
                ? request.status().trim().toUpperCase()
                : "RESOLVED";

        if (!List.of("PROCESSING", "RESOLVED", "REJECTED").contains(newStatus)) {
            throw new ValidationException("Trạng thái xử lý không hợp lệ (hỗ trợ PROCESSING, RESOLVED, REJECTED).");
        }

        if (("RESOLVED".equals(newStatus) || "REJECTED".equals(newStatus))
                && (request.adminResponse() == null || request.adminResponse().trim().isBlank())) {
            throw new ValidationException("Vui lòng nhập nội dung phúc đáp giải quyết cho Người bán.");
        }

        entity.setStatus(newStatus);
        if (request.adminResponse() != null) {
            entity.setAdminResponse(request.adminResponse().trim());
        }
        entity.setResolvedBy((adminId != null && !adminId.isBlank()) ? adminId.trim() : "ADMIN");

        if ("RESOLVED".equals(newStatus) || "REJECTED".equals(newStatus)) {
            entity.setResolvedAt(LocalDateTime.now());
        }

        feedbackDAO.update(entity);
        log.info("Admin [{}] updated feedback [{}] status to [{}] with response", adminId, id, newStatus);

        // Ghi nhận Audit Log (TASK-67)
        if (auditLogService != null) {
            try {
                String act = "RESPOND_FEEDBACK";
                String detail = String.format("Admin giải quyết phản hồi [%s] của gian hàng. Trạng thái: %s. Nội dung phúc đáp: %s",
                        entity.getSubject(), newStatus, entity.getAdminResponse());
                auditLogService.log(adminId, act, "FEEDBACK", id, detail, clientIp);
            } catch (Exception ex) {
                log.warn("Không thể ghi audit log cho xử lý phản hồi [{}]: {}", id, ex.getMessage());
            }
        }

        return toResponse(entity);
    }

    private FeedbackResponse toResponse(FeedbackEntity entity) {
        String shopName = null;
        String userEmail = null;

        if (storeDAO != null) {
            try {
                shopName = storeDAO.findBySellerId(entity.getUserId())
                        .map(StoreEntity::getStoreName)
                        .orElse(null);
            } catch (Exception ignored) {}
        }

        if (userDAO != null) {
            try {
                userEmail = userDAO.findById(entity.getUserId())
                        .map(UserEntity::getEmail)
                        .orElse(null);
            } catch (Exception ignored) {}
        }

        return new FeedbackResponse(
                entity.getId(),
                entity.getUserId(),
                shopName,
                userEmail,
                entity.getType(),
                entity.getSubject(),
                entity.getContent(),
                entity.getImageUrl(),
                entity.getStatus(),
                entity.getAdminResponse(),
                entity.getResolvedBy(),
                entity.getCreatedAt(),
                entity.getResolvedAt()
        );
    }
}
