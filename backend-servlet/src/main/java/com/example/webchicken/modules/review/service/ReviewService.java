package com.example.webchicken.modules.review.service;

import com.example.webchicken.modules.review.model.dto.request.CreateReviewRequest;
import com.example.webchicken.modules.review.model.dto.request.UpdateReviewRequest;
import com.example.webchicken.modules.review.model.dto.response.ReviewResponse;
import com.example.webchicken.modules.review.model.dto.response.ReviewSummaryResponse;

import java.util.List;

/**
 * Service quản lý gửi đánh giá, cập nhật, xóa và tra cứu thống kê (TASK-56).
 * ARCHITECTURE.md 2.3.7 & 3.5.11.
 */
public interface ReviewService {

    /**
     * Tạo đánh giá cho mặt hàng đã mua trong đơn hàng DELIVERED.
     */
    ReviewResponse createReview(String userId, CreateReviewRequest request);

    /**
     * Chỉnh sửa bài đánh giá của chính mình.
     */
    ReviewResponse updateReview(String userId, String reviewId, UpdateReviewRequest request);

    /**
     * Xóa đánh giá của chính mình.
     */
    void deleteReview(String userId, String reviewId);

    /**
     * Lấy danh sách đánh giá công khai của sản phẩm (phân trang + lọc số sao).
     */
    List<ReviewResponse> getProductReviews(String productId, Integer ratingFilter, int page, int size);

    /**
     * Đếm tổng số đánh giá của sản phẩm (phục vụ phân trang).
     */
    long countProductReviews(String productId, Integer ratingFilter);

    /**
     * Thống kê điểm trung bình và phân bố sao của sản phẩm.
     */
    ReviewSummaryResponse getProductReviewSummary(String productId);

    /**
     * Lấy danh sách đánh giá của chính người mua đang đăng nhập.
     */
    List<ReviewResponse> getMyReviews(String userId, int page, int size);
}
