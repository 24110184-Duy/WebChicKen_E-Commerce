package com.example.webchicken.modules.catalog.model.dto.request;

/**
 * DTO yêu cầu Quản trị viên duyệt hoặc từ chối sản phẩm.
 * status: ACTIVE (duyệt), INACTIVE / PENDING_APPROVAL (từ chối).
 */
public record ReviewProductRequest(
        String status,
        String rejectionReason
) {}
