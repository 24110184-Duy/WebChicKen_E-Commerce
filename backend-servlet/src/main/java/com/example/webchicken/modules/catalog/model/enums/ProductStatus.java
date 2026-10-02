package com.example.webchicken.modules.catalog.model.enums;

/**
 * Trạng thái của sản phẩm (SPU) trong hệ thống WebChicKen.
 * Khớp với ENUM trong bảng products của CSDL MySQL:
 * "PENDING_APPROVAL", "ACTIVE", "INACTIVE", "OUT_OF_STOCK"
 */
public enum ProductStatus {
    PENDING_APPROVAL,
    ACTIVE,
    INACTIVE,
    OUT_OF_STOCK
}
