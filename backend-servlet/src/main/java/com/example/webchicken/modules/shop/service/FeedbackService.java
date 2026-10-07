package com.example.webchicken.modules.shop.service;

import com.example.webchicken.modules.shop.model.dto.request.CreateFeedbackRequest;
import com.example.webchicken.modules.shop.model.dto.request.RespondFeedbackRequest;
import com.example.webchicken.modules.shop.model.dto.response.FeedbackPageResponse;
import com.example.webchicken.modules.shop.model.dto.response.FeedbackResponse;

/**
 * Interface nghiệp vụ tiếp nhận và giải quyết phản hồi / khiếu nại của Người bán (TASK-69).
 * Tuân thủ CODE_PRINCIPLES và ARCHITECTURE: 100% logic nằm trong Service, không trong Servlet.
 */
public interface FeedbackService {

    FeedbackResponse createFeedback(String userId, CreateFeedbackRequest request);

    FeedbackPageResponse getSellerFeedbacks(String userId, int page, int size);

    FeedbackPageResponse listAdminFeedbacks(int page, int size, String status, String type, String search);

    FeedbackResponse getFeedbackDetail(String id);

    FeedbackResponse respondFeedback(String id, String adminId, RespondFeedbackRequest request, String clientIp);
}
