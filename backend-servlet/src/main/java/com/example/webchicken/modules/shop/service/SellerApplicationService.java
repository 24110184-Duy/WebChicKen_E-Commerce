package com.example.webchicken.modules.shop.service;

import com.example.webchicken.modules.shop.model.dto.request.ApplySellerRequest;
import com.example.webchicken.modules.shop.model.dto.request.ReviewApplicationRequest;
import com.example.webchicken.modules.shop.model.dto.response.SellerApplicationResponse;
import java.util.List;

/**
 * Service quản lý quy trình nộp đơn và xét duyệt đăng ký bán hàng (Seller).
 */
public interface SellerApplicationService {

    /** Khách hàng nộp đơn đăng ký mở gian hàng bán lẻ. */
    SellerApplicationResponse apply(String userId, ApplySellerRequest request);

    /** Khách hàng xem đơn đăng ký gần nhất của mình. */
    SellerApplicationResponse getMyApplication(String userId);

    /** Quản trị viên (Admin) duyệt hoặc từ chối đơn đăng ký. */
    SellerApplicationResponse review(String applicationId, String adminId, ReviewApplicationRequest request);

    /** Danh sách đơn đăng ký cho Admin kiểm duyệt (có phân trang và lọc trạng thái). */
    List<SellerApplicationResponse> listApplications(int page, int size, String status);
}
