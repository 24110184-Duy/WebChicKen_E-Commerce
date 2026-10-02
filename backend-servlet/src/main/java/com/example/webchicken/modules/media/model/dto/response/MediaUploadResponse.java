package com.example.webchicken.modules.media.model.dto.response;

import java.time.LocalDateTime;

/**
 * DTO phản hồi sau khi tải tệp đa phương tiện thành công.
 */
public record MediaUploadResponse(
        String id,
        String fileName,
        String fileUrl,
        String contentType,
        long fileSize,
        LocalDateTime createdAt
) {}
