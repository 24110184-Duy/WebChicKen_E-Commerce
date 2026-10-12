package com.example.webchicken.infrastructure.mail;

import com.example.webchicken.modules.order.model.entity.OrderEntity;
import com.example.webchicken.modules.order.model.entity.OrderItemEntity;

import java.util.List;
import java.util.concurrent.CompletableFuture;

/**
 * Interface dịch vụ gửi Email thông báo trong hệ thống WebChicKen.
 * Đáp ứng kiến trúc phân tầng sạch (Clean Architecture) và ADR-04 / CODE_PRINCIPLES.
 */
public interface EmailService {

    /**
     * Gửi email thông báo đơn hàng đã được giao thành công (DELIVERED) đến khách hàng.
     * Tác vụ được thực thi bất đồng bộ (non-blocking) qua cổng HTTPS 443 để tương thích hoàn toàn
     * với môi trường hạ tầng Render (nơi chặn outbound SMTP port 25, 465, 587).
     *
     * @param recipientEmail Địa chỉ email của khách hàng
     * @param customerName   Tên hiển thị của khách hàng
     * @param order          Thông tin đơn hàng đã giao
     * @param items          Danh sách chi tiết các mặt hàng trong đơn
     * @return CompletableFuture tác vụ gửi email (fail-safe)
     */
    CompletableFuture<Void> sendOrderDeliveredConfirmationAsync(
            String recipientEmail,
            String customerName,
            OrderEntity order,
            List<OrderItemEntity> items
    );

    /**
     * Đóng tài nguyên và worker thread pool khi ứng dụng tắt (tuân thủ RES-06).
     */
    void shutdown();
}
