package com.example.webchicken.modules.review.service;

import com.example.webchicken.common.enums.OrderStatus;
import com.example.webchicken.common.exception.AuthorizationException;
import com.example.webchicken.common.exception.ConflictException;
import com.example.webchicken.common.exception.ValidationException;
import com.example.webchicken.modules.identity.dao.UserDAO;
import com.example.webchicken.modules.identity.model.entity.CustomerEntity;
import com.example.webchicken.modules.order.dao.OrderDAO;
import com.example.webchicken.modules.order.dao.OrderItemDAO;
import com.example.webchicken.modules.order.model.entity.OrderEntity;
import com.example.webchicken.modules.order.model.entity.OrderItemEntity;
import com.example.webchicken.modules.review.dao.ReviewDAO;
import com.example.webchicken.modules.review.model.dto.request.CreateReviewRequest;
import com.example.webchicken.modules.review.model.dto.request.UpdateReviewRequest;
import com.example.webchicken.modules.review.model.dto.response.ReviewResponse;
import com.example.webchicken.modules.review.model.dto.response.ReviewSummaryResponse;
import com.example.webchicken.modules.review.model.entity.ProductReviewEntity;
import com.example.webchicken.modules.review.model.enums.ReviewStatus;
import com.example.webchicken.modules.review.service.impl.ReviewServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class ReviewServiceImplTest {

    private ReviewDAO reviewDAO;
    private OrderDAO orderDAO;
    private OrderItemDAO orderItemDAO;
    private UserDAO userDAO;
    private ReviewServiceImpl reviewService;

    private final String customerId = "customer-123";
    private final String orderId = "order-456";
    private final String orderItemId = "item-789";
    private final String productId = "prod-001";

    @BeforeEach
    void setUp() {
        reviewDAO = mock(ReviewDAO.class);
        orderDAO = mock(OrderDAO.class);
        orderItemDAO = mock(OrderItemDAO.class);
        userDAO = mock(UserDAO.class);
        reviewService = new ReviewServiceImpl(reviewDAO, orderDAO, orderItemDAO, userDAO);
    }

    @Test
    @DisplayName("Create review succeeds when order is in DELIVERED status and user is buyer")
    void testCreateReview_Success_WhenDeliveredOrder() {
        OrderEntity order = new OrderEntity();
        order.setId(orderId);
        order.setCustomerId(customerId);
        order.setStatus(OrderStatus.DELIVERED);

        OrderItemEntity item = new OrderItemEntity();
        item.setId(orderItemId);
        item.setOrderId(orderId);
        item.setProductId(productId);

        CustomerEntity user = new CustomerEntity();
        user.setUserId(customerId);
        user.setFullName("Nguyen Van A");

        when(orderDAO.findById(orderId)).thenReturn(Optional.of(order));
        when(orderItemDAO.findById(orderItemId)).thenReturn(Optional.of(item));
        when(reviewDAO.hasReviewed(customerId, orderItemId)).thenReturn(false);
        when(userDAO.findById(customerId)).thenReturn(Optional.of(user));

        CreateReviewRequest request = new CreateReviewRequest(
                orderId, orderItemId, productId, 5, "Crispy and tender chicken!", List.of("https://cdn.example.com/photo1.jpg")
        );

        ReviewResponse response = reviewService.createReview(customerId, request);

        assertNotNull(response);
        assertEquals(5, response.rating());
        assertEquals("Crispy and tender chicken!", response.comment());
        assertEquals("Nguyen Van A", response.userName());
        assertEquals(ReviewStatus.APPROVED, response.status());
        assertEquals(orderId, response.orderId());
        assertEquals(orderItemId, response.orderItemId());

        ArgumentCaptor<ProductReviewEntity> captor = ArgumentCaptor.forClass(ProductReviewEntity.class);
        verify(reviewDAO, times(1)).insert(captor.capture());
        assertEquals(5, captor.getValue().getRating());
    }

    @Test
    @DisplayName("Create review fails with ConflictException when order is not DELIVERED")
    void testCreateReview_Fails_WhenOrderNotDelivered() {
        OrderEntity order = new OrderEntity();
        order.setId(orderId);
        order.setCustomerId(customerId);
        order.setStatus(OrderStatus.SHIPPING); // Order still in transit

        when(orderDAO.findById(orderId)).thenReturn(Optional.of(order));

        CreateReviewRequest request = new CreateReviewRequest(
                orderId, orderItemId, productId, 5, "Great food!", null
        );

        ConflictException ex = assertThrows(ConflictException.class, () ->
                reviewService.createReview(customerId, request)
        );

        assertEquals("ORDER_NOT_DELIVERED", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("Reviews are only permitted for delivered orders"));
        verify(reviewDAO, never()).insert(any());
    }

    @Test
    @DisplayName("Create review fails with ConflictException when item was already reviewed")
    void testCreateReview_Fails_WhenAlreadyReviewed() {
        OrderEntity order = new OrderEntity();
        order.setId(orderId);
        order.setCustomerId(customerId);
        order.setStatus(OrderStatus.DELIVERED);

        OrderItemEntity item = new OrderItemEntity();
        item.setId(orderItemId);
        item.setOrderId(orderId);
        item.setProductId(productId);

        when(orderDAO.findById(orderId)).thenReturn(Optional.of(order));
        when(orderItemDAO.findById(orderItemId)).thenReturn(Optional.of(item));
        when(reviewDAO.hasReviewed(customerId, orderItemId)).thenReturn(true);

        CreateReviewRequest request = new CreateReviewRequest(
                orderId, orderItemId, productId, 5, "Duplicate review attempt", null
        );

        ConflictException ex = assertThrows(ConflictException.class, () ->
                reviewService.createReview(customerId, request)
        );

        assertEquals("REVIEW_ALREADY_EXISTS", ex.getErrorCode());
        verify(reviewDAO, never()).insert(any());
    }

    @Test
    @DisplayName("Create review fails with ValidationException when rating is invalid (<1 or >5)")
    void testCreateReview_Fails_WhenInvalidRating() {
        CreateReviewRequest reqZero = new CreateReviewRequest(orderId, orderItemId, productId, 0, "Bad rating", null);
        CreateReviewRequest reqSix = new CreateReviewRequest(orderId, orderItemId, productId, 6, "Bad rating", null);

        assertThrows(ValidationException.class, () -> reviewService.createReview(customerId, reqZero));
        assertThrows(ValidationException.class, () -> reviewService.createReview(customerId, reqSix));

        verify(orderDAO, never()).findById(any());
        verify(reviewDAO, never()).insert(any());
    }

    @Test
    @DisplayName("Create review fails with AuthorizationException when customer tries to review another user's order")
    void testCreateReview_Fails_WhenNotOrderOwner() {
        OrderEntity order = new OrderEntity();
        order.setId(orderId);
        order.setCustomerId("different-user-999");
        order.setStatus(OrderStatus.DELIVERED);

        when(orderDAO.findById(orderId)).thenReturn(Optional.of(order));

        CreateReviewRequest request = new CreateReviewRequest(
                orderId, orderItemId, productId, 5, "I didn't buy this", null
        );

        assertThrows(AuthorizationException.class, () -> reviewService.createReview(customerId, request));
        verify(reviewDAO, never()).insert(any());
    }

    @Test
    @DisplayName("Create review cleans unsafe XSS injection from comment (SEC-04)")
    void testCreateReview_SanitizesXSSInComment() {
        OrderEntity order = new OrderEntity();
        order.setId(orderId);
        order.setCustomerId(customerId);
        order.setStatus(OrderStatus.DELIVERED);

        OrderItemEntity item = new OrderItemEntity();
        item.setId(orderItemId);
        item.setOrderId(orderId);
        item.setProductId(productId);

        when(orderDAO.findById(orderId)).thenReturn(Optional.of(order));
        when(orderItemDAO.findById(orderItemId)).thenReturn(Optional.of(item));
        when(reviewDAO.hasReviewed(customerId, orderItemId)).thenReturn(false);
        when(userDAO.findById(customerId)).thenReturn(Optional.empty());

        String maliciousComment = "<script>alert('xss attack')</script> Delicious fresh chicken!";
        CreateReviewRequest request = new CreateReviewRequest(
                orderId, orderItemId, productId, 5, maliciousComment, null
        );

        ReviewResponse response = reviewService.createReview(customerId, request);

        assertEquals("Delicious fresh chicken!", response.comment());
        assertFalse(response.comment().contains("<script>"));
    }

    @Test
    @DisplayName("Get product review summary returns correct aggregate counts")
    void testGetProductReviewSummary_Success() {
        ReviewSummaryResponse summary = new ReviewSummaryResponse(
                productId, 4.8, 120, 100, 15, 3, 2, 0
        );
        when(reviewDAO.getReviewSummary(productId)).thenReturn(summary);

        ReviewSummaryResponse result = reviewService.getProductReviewSummary(productId);

        assertEquals(productId, result.productId());
        assertEquals(4.8, result.averageRating());
        assertEquals(120, result.totalReviews());
        assertEquals(100, result.fiveStarCount());
    }

    @Test
    @DisplayName("Update review succeeds for review owner")
    void testUpdateReview_Success_OwnReview() {
        ProductReviewEntity review = new ProductReviewEntity();
        review.setId("rev-1");
        review.setUserId(customerId);
        review.setRating(4);
        review.setComment("Good");

        when(reviewDAO.findById("rev-1")).thenReturn(Optional.of(review));

        UpdateReviewRequest updateRequest = new UpdateReviewRequest(5, "Even better after cooking properly", null);
        ReviewResponse updated = reviewService.updateReview(customerId, "rev-1", updateRequest);

        assertEquals(5, updated.rating());
        assertEquals("Even better after cooking properly", updated.comment());
        verify(reviewDAO, times(1)).update(review);
    }

    @Test
    @DisplayName("Update review fails with AuthorizationException when editing someone else's review")
    void testUpdateReview_Fails_OtherUser() {
        ProductReviewEntity review = new ProductReviewEntity();
        review.setId("rev-1");
        review.setUserId("another-customer");

        when(reviewDAO.findById("rev-1")).thenReturn(Optional.of(review));

        UpdateReviewRequest updateRequest = new UpdateReviewRequest(5, "Trying to edit", null);
        assertThrows(AuthorizationException.class, () ->
                reviewService.updateReview(customerId, "rev-1", updateRequest)
        );

        verify(reviewDAO, never()).update(any());
    }
}
