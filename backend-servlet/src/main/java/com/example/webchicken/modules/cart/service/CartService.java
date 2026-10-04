package com.example.webchicken.modules.cart.service;

import com.example.webchicken.modules.cart.model.dto.request.AddToCartRequest;
import com.example.webchicken.modules.cart.model.dto.response.CartResponse;

/**
 * Service quản lý giỏ hàng trực tuyến của khách hàng (TASK-39).
 * Tự động kiểm tra biến động giá & tình trạng tồn kho thực tế.
 */
public interface CartService {

    /**
     * Lấy thông tin giỏ hàng của khách hàng, kiểm tra biến động giá và tồn kho thực tế.
     */
    CartResponse getCart(String customerId);

    /**
     * Thêm sản phẩm/biến thể SKU vào giỏ hàng.
     */
    CartResponse addItem(String customerId, AddToCartRequest req);

    /**
     * Cập nhật số lượng của một dòng hàng trong giỏ.
     */
    CartResponse updateItemQuantity(String customerId, String itemId, int quantity);

    /**
     * Xóa một dòng hàng khỏi giỏ.
     */
    CartResponse removeItem(String customerId, String itemId);

    /**
     * Dọn sạch toàn bộ giỏ hàng (sau khi checkout đặt đơn thành công).
     */
    void clearCart(String customerId);
}
