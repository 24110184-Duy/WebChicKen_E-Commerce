package com.example.webchicken.modules.shop.service;

import com.example.webchicken.common.exception.NotFoundException;
import com.example.webchicken.common.exception.ValidationException;
import com.example.webchicken.modules.backoffice.service.AuditLogService;
import com.example.webchicken.modules.identity.dao.UserDAO;
import com.example.webchicken.modules.shop.dao.FeedbackDAO;
import com.example.webchicken.modules.shop.dao.StoreDAO;
import com.example.webchicken.modules.shop.model.dto.request.CreateFeedbackRequest;
import com.example.webchicken.modules.shop.model.dto.request.RespondFeedbackRequest;
import com.example.webchicken.modules.shop.model.dto.response.FeedbackPageResponse;
import com.example.webchicken.modules.shop.model.dto.response.FeedbackResponse;
import com.example.webchicken.modules.shop.model.entity.FeedbackEntity;
import com.example.webchicken.modules.shop.service.impl.FeedbackServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class FeedbackServiceTest {

    private FeedbackDAO feedbackDAO;
    private StoreDAO storeDAO;
    private UserDAO userDAO;
    private AuditLogService auditLogService;
    private FeedbackServiceImpl feedbackService;

    @BeforeEach
    void setUp() {
        feedbackDAO = mock(FeedbackDAO.class);
        storeDAO = mock(StoreDAO.class);
        userDAO = mock(UserDAO.class);
        auditLogService = mock(AuditLogService.class);
        feedbackService = new FeedbackServiceImpl(feedbackDAO, storeDAO, userDAO, auditLogService);
    }

    @Test
    @DisplayName("Người bán gửi phản hồi / khiếu nại thành công")
    void testCreateFeedbackSuccess() {
        String sellerId = "seller-usr-101";
        CreateFeedbackRequest request = new CreateFeedbackRequest(
                "COMPLAINT",
                "Khiếu nại về thời gian xử lý đơn hàng",
                "Đơn vị vận chuyển lấy hàng chậm hơn 2 tiếng so với cam kết chuỗi lạnh.",
                "https://images.chicken.vn/proof.jpg"
        );

        FeedbackResponse response = feedbackService.createFeedback(sellerId, request);

        assertNotNull(response);
        assertEquals(sellerId, response.userId());
        assertEquals("COMPLAINT", response.type());
        assertEquals("Khiếu nại về thời gian xử lý đơn hàng", response.subject());
        assertEquals("PENDING", response.status());

        ArgumentCaptor<FeedbackEntity> captor = ArgumentCaptor.forClass(FeedbackEntity.class);
        verify(feedbackDAO, times(1)).save(captor.capture());
        FeedbackEntity saved = captor.getValue();
        assertEquals("COMPLAINT", saved.getType());
        assertEquals("PENDING", saved.getStatus());
        assertNotNull(saved.getCreatedAt());
    }

    @Test
    @DisplayName("Gửi phản hồi thất bại nếu tiêu đề hoặc nội dung để trống")
    void testCreateFeedbackValidationFailure() {
        assertThrows(ValidationException.class, () ->
                feedbackService.createFeedback("seller-1", new CreateFeedbackRequest("INQUIRY", "", "Nội dung", null)));
        assertThrows(ValidationException.class, () ->
                feedbackService.createFeedback("seller-1", new CreateFeedbackRequest("INQUIRY", "Tiêu đề", "   ", null)));
        assertThrows(ValidationException.class, () ->
                feedbackService.createFeedback("", new CreateFeedbackRequest("INQUIRY", "Tiêu đề", "Nội dung", null)));

        verify(feedbackDAO, never()).save(any());
    }

    @Test
    @DisplayName("Người bán xem danh sách phản hồi của chính mình có phân trang")
    void testGetSellerFeedbacksPagination() {
        FeedbackEntity f1 = new FeedbackEntity("f-1", "seller-1", "INQUIRY", "Hỏi đáp phí sàn", "Nội dung 1", null);
        FeedbackEntity f2 = new FeedbackEntity("f-2", "seller-1", "TECHNICAL", "Lỗi upload ảnh", "Nội dung 2", null);

        when(feedbackDAO.findByUserId("seller-1", 1, 10)).thenReturn(List.of(f1, f2));
        when(feedbackDAO.countByUserId("seller-1")).thenReturn(2L);

        FeedbackPageResponse page = feedbackService.getSellerFeedbacks("seller-1", 1, 10);

        assertNotNull(page);
        assertEquals(2, page.items().size());
        assertEquals(2, page.total());
        assertEquals(1, page.page());
        assertEquals(1, page.totalPages());
    }

    @Test
    @DisplayName("Admin xem danh sách phản hồi với bộ lọc trạng thái và loại")
    void testListAdminFeedbacks() {
        FeedbackEntity f = new FeedbackEntity("f-admin-1", "seller-2", "PAYMENT", "Thắc mắc đối soát COD", "Nội dung COD", null);
        when(feedbackDAO.findAll(1, 20, "PENDING", "PAYMENT", "COD")).thenReturn(List.of(f));
        when(feedbackDAO.countAll("PENDING", "PAYMENT", "COD")).thenReturn(1L);

        FeedbackPageResponse page = feedbackService.listAdminFeedbacks(1, 20, "PENDING", "PAYMENT", "COD");

        assertNotNull(page);
        assertEquals(1, page.items().size());
        assertEquals(1, page.total());
    }

    @Test
    @DisplayName("Admin phúc đáp phiếu khiếu nại thành công và tự động ghi Audit Log")
    void testRespondFeedbackSuccessAndRecordsAuditLog() {
        String feedbackId = "fb-ticket-999";
        String adminId = "admin-boss";
        FeedbackEntity entity = new FeedbackEntity(feedbackId, "seller-5", "COMPLAINT", "Đơn hàng bị trễ", "Nội dung khiếu nại", null);

        when(feedbackDAO.findById(feedbackId)).thenReturn(Optional.of(entity));

        RespondFeedbackRequest request = new RespondFeedbackRequest(
                "RESOLVED",
                "Đã liên hệ tài xế và tiến hành bồi thường phí vận chuyển cho gian hàng."
        );

        FeedbackResponse response = feedbackService.respondFeedback(feedbackId, adminId, request, "192.168.1.100");

        assertNotNull(response);
        assertEquals("RESOLVED", response.status());
        assertEquals("Đã liên hệ tài xế và tiến hành bồi thường phí vận chuyển cho gian hàng.", response.adminResponse());
        assertNotNull(response.resolvedAt());

        verify(feedbackDAO, times(1)).update(entity);
        // Kiểm tra tự động ghi audit log
        verify(auditLogService, times(1)).log(
                eq(adminId),
                eq("RESPOND_FEEDBACK"),
                eq("FEEDBACK"),
                eq(feedbackId),
                contains("Đã liên hệ tài xế"),
                eq("192.168.1.100")
        );
    }

    @Test
    @DisplayName("Admin phúc đáp phiếu không tồn tại ném NotFoundException")
    void testRespondFeedbackNotFound() {
        when(feedbackDAO.findById("non-existent")).thenReturn(Optional.empty());

        RespondFeedbackRequest request = new RespondFeedbackRequest("RESOLVED", "Phản hồi");
        assertThrows(NotFoundException.class, () ->
                feedbackService.respondFeedback("non-existent", "admin-1", request, "127.0.0.1"));
    }
}
