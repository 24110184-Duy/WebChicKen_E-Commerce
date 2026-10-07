package com.example.webchicken.modules.backoffice.service.impl;

import com.example.webchicken.common.exception.NotFoundException;
import com.example.webchicken.common.exception.ValidationException;
import com.example.webchicken.modules.backoffice.dao.AuditLogDAO;
import com.example.webchicken.modules.backoffice.model.dto.response.AuditLogPageResponse;
import com.example.webchicken.modules.backoffice.model.dto.response.AuditLogResponse;
import com.example.webchicken.modules.backoffice.model.entity.AuditLogEntity;
import com.example.webchicken.modules.backoffice.service.AuditLogService;
import com.example.webchicken.modules.identity.service.AdminUserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

/**
 * Cài đặt nghiệp vụ ghi nhận và tra cứu nhật ký kiểm toán Quản trị viên (TASK-67).
 * Toàn bộ logic nghiệp vụ nằm ở Service, tuân thủ CODE_PRINCIPLES.
 */
public class AuditLogServiceImpl implements AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogServiceImpl.class);

    private final AuditLogDAO auditLogDAO;
    private AdminUserService adminUserService;

    public AuditLogServiceImpl(AuditLogDAO auditLogDAO, AdminUserService adminUserService) {
        this.auditLogDAO = Objects.requireNonNull(auditLogDAO, "auditLogDAO must not be null");
        this.adminUserService = adminUserService;
    }

    public AuditLogServiceImpl(AuditLogDAO auditLogDAO) {
        this(auditLogDAO, null);
    }

    public void setAdminUserService(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @Override
    public void log(String adminId, String action, String targetType, String targetId, String detail, String ipAddress) {
        if (action == null || action.trim().isBlank()) {
            throw new ValidationException("Hành động kiểm toán (action) không được để trống.");
        }

        AuditLogEntity entity = new AuditLogEntity(
                UUID.randomUUID().toString(),
                (adminId != null && !adminId.trim().isBlank()) ? adminId.trim() : "SYSTEM",
                action.trim().toUpperCase(),
                (targetType != null && !targetType.trim().isBlank()) ? targetType.trim().toUpperCase() : null,
                (targetId != null && !targetId.trim().isBlank()) ? targetId.trim() : null,
                detail != null ? detail.trim() : null,
                (ipAddress != null && !ipAddress.trim().isBlank()) ? ipAddress.trim() : null,
                LocalDateTime.now()
        );

        auditLogDAO.save(entity);
        log.info("Audit log đã ghi: Admin [{}] | Action [{}] | Target [{}:{}] | IP [{}]",
                entity.getAdminId(), entity.getAction(), entity.getTargetType(), entity.getTargetId(), entity.getIpAddress());
    }

    @Override
    public AuditLogPageResponse listLogs(int page, int size, String adminId, String action, String targetType, String search) {
        int safePage = Math.max(1, page);
        int safeSize = Math.min(100, Math.max(1, size));

        List<AuditLogEntity> logs = auditLogDAO.findAll(safePage, safeSize, adminId, action, targetType, search);
        long total = auditLogDAO.countAll(adminId, action, targetType, search);

        List<AuditLogResponse> items = logs.stream()
                .map(this::toResponse)
                .toList();

        int totalPages = safeSize > 0 ? (int) Math.ceil((double) total / safeSize) : 0;
        return new AuditLogPageResponse(items, total, safePage, safeSize, totalPages);
    }

    @Override
    public AuditLogResponse getById(String id) {
        if (id == null || id.trim().isBlank()) {
            throw new ValidationException("Mã nhật ký kiểm toán không được để trống.");
        }

        AuditLogEntity entity = auditLogDAO.findById(id.trim())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy nhật ký kiểm toán với mã: " + id));

        return toResponse(entity);
    }

    private AuditLogResponse toResponse(AuditLogEntity entity) {
        String adminEmail = null;
        String adminName = null;

        if (adminUserService != null && entity.getAdminId() != null && !"SYSTEM".equalsIgnoreCase(entity.getAdminId())) {
            try {
                var userDetail = adminUserService.getUserDetail(entity.getAdminId());
                if (userDetail != null) {
                    adminEmail = userDetail.email();
                    adminName = userDetail.fullName();
                }
            } catch (Exception ignored) {
                // Admin không tồn tại hoặc lỗi tra cứu
            }
        }

        return new AuditLogResponse(
                entity.getId(),
                entity.getAdminId(),
                adminEmail,
                adminName,
                entity.getAction(),
                entity.getTargetType(),
                entity.getTargetId(),
                entity.getDetail(),
                entity.getIpAddress(),
                entity.getCreatedAt()
        );
    }
}
