package com.example.webchicken.modules.review.service;

import com.example.webchicken.common.enums.OrderStatus;
import com.example.webchicken.common.exception.AppException;
import com.example.webchicken.common.exception.AuthorizationException;
import com.example.webchicken.common.exception.ConflictException;
import com.example.webchicken.common.exception.DataAccessException;
import com.example.webchicken.common.exception.NotFoundException;
import com.example.webchicken.common.exception.ValidationException;
import com.example.webchicken.modules.identity.dao.UserDAO;
import com.example.webchicken.modules.order.dao.OrderDAO;
import com.example.webchicken.modules.order.dao.OrderItemDAO;
import com.example.webchicken.modules.order.model.entity.OrderEntity;
import com.example.webchicken.modules.order.model.entity.OrderItemEntity;
import com.example.webchicken.modules.review.dao.ReviewDAO;
import com.example.webchicken.modules.review.model.dto.request.CreateReviewRequest;
import com.example.webchicken.modules.review.model.dto.request.UpdateReviewRequest;
import com.example.webchicken.modules.review.model.dto.response.ReviewResponse;
import com.example.webchicken.modules.review.model.entity.ProductReviewEntity;
import com.example.webchicken.modules.review.service.impl.ReviewServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Bộ test nâng cao cho ReviewServiceImpl (TASK-56): tình huống biên, tấn công, race condition.
 * Căn cứ: ARCHITECTURE.md 2.3.7, 3.5.11 và CODE_PRINCIPLES.md SEC-04.
 * Quy tắc: test KHÔNG được chỉnh sửa để pass; test fail = lỗi thật của mã nguồn.
 */
public class ReviewServiceImplEdgeCaseTest {

    private static final String BUYER_ID = "buyer-001";
    private static final String ORDER_ID = "order-001";
    private static final String ITEM_ID = "item-001";
    private static final String PURCHASED_PRODUCT_ID = "prod-fried-chicken";

    private ReviewDAO reviewDAO;
    private OrderDAO orderDAO;
    private OrderItemDAO orderItemDAO;
    private UserDAO userDAO;
    private ReviewServiceImpl service;

    @BeforeEach
    void setUp() {
        reviewDAO = mock(ReviewDAO.class);
        orderDAO = mock(OrderDAO.class);
        orderItemDAO = mock(OrderItemDAO.class);
        userDAO = mock(UserDAO.class);
        service = new ReviewServiceImpl(reviewDAO, orderDAO, orderItemDAO, userDAO);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private OrderEntity order(String customerId, OrderStatus status) {
        OrderEntity o = new OrderEntity();
        o.setId(ORDER_ID);
        o.setCustomerId(customerId);
        o.setStatus(status);
        return o;
    }

    private OrderItemEntity item(String orderId, String productId) {
        OrderItemEntity i = new OrderItemEntity();
        i.setId(ITEM_ID);
        i.setOrderId(orderId);
        i.setProductId(productId);
        return i;
    }

    /** Dựng toàn bộ điều kiện hợp lệ để review được tạo thành công nếu không có rule nào chặn. */
    private void givenValidDeliveredPurchase() {
        when(orderDAO.findById(ORDER_ID)).thenReturn(Optional.of(order(BUYER_ID, OrderStatus.DELIVERED)));
        when(orderItemDAO.findById(ITEM_ID)).thenReturn(Optional.of(item(ORDER_ID, PURCHASED_PRODUCT_ID)));
        when(reviewDAO.hasReviewed(BUYER_ID, ITEM_ID)).thenReturn(false);
        when(userDAO.findById(anyString())).thenReturn(Optional.empty());
    }

    private CreateReviewRequest request(int rating, String comment) {
        return new CreateReviewRequest(ORDER_ID, ITEM_ID, PURCHASED_PRODUCT_ID, rating, comment, null);
    }

    private ProductReviewEntity existingReview(String ownerId, LocalDateTime createdAt) {
        ProductReviewEntity r = new ProductReviewEntity();
        r.setId("rev-001");
        r.setUserId(ownerId);
        r.setOrderId(ORDER_ID);
        r.setOrderItemId(ITEM_ID);
        r.setProductId(PURCHASED_PRODUCT_ID);
        r.setRating(4);
        r.setComment("Original comment");
        r.setMediaUrls("[\"https://cdn.example.com/a.jpg\"]");
        r.setCreatedAt(createdAt);
        r.setUpdatedAt(createdAt);
        return r;
    }

    // ════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("1. Order state gate (ARCHITECTURE 2.3.7)")
    class OrderStateGate {

        @Test
        @DisplayName("Every non-DELIVERED status must be rejected with ORDER_NOT_DELIVERED and nothing persisted")
        void everyNonDeliveredStatusIsRejected() {
            when(orderItemDAO.findById(ITEM_ID)).thenReturn(Optional.of(item(ORDER_ID, PURCHASED_PRODUCT_ID)));

            for (OrderStatus status : OrderStatus.values()) {
                if (status == OrderStatus.DELIVERED) continue;
                when(orderDAO.findById(ORDER_ID)).thenReturn(Optional.of(order(BUYER_ID, status)));

                ConflictException ex = assertThrows(ConflictException.class,
                        () -> service.createReview(BUYER_ID, request(5, "Nice")),
                        "Status " + status + " must not allow review");
                assertEquals("ORDER_NOT_DELIVERED", ex.getErrorCode(), "Wrong code for status " + status);
                assertEquals(409, ex.getHttpStatus());
            }
            verify(reviewDAO, never()).insert(any());
        }

        @Test
        @DisplayName("Corrupted order with null status must be rejected, not crash with NPE")
        void nullOrderStatusIsRejected() {
            when(orderDAO.findById(ORDER_ID)).thenReturn(Optional.of(order(BUYER_ID, null)));

            assertThrows(ConflictException.class, () -> service.createReview(BUYER_ID, request(5, "Nice")));
            verify(reviewDAO, never()).insert(any());
        }

        @Test
        @DisplayName("Order not found -> NotFoundException; order item not found -> NotFoundException")
        void missingOrderOrItem() {
            when(orderDAO.findById(ORDER_ID)).thenReturn(Optional.empty());
            assertThrows(NotFoundException.class, () -> service.createReview(BUYER_ID, request(5, "Nice")));

            when(orderDAO.findById(ORDER_ID)).thenReturn(Optional.of(order(BUYER_ID, OrderStatus.DELIVERED)));
            when(orderItemDAO.findById(ITEM_ID)).thenReturn(Optional.empty());
            assertThrows(NotFoundException.class, () -> service.createReview(BUYER_ID, request(5, "Nice")));

            verify(reviewDAO, never()).insert(any());
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("2. Ownership & purchase proof attacks")
    class OwnershipAttacks {

        @Test
        @DisplayName("Reviewing another buyer's delivered order fails fast, never probes items or duplicates")
        void foreignOrderFailsFastWithoutProbing() {
            when(orderDAO.findById(ORDER_ID)).thenReturn(Optional.of(order("someone-else", OrderStatus.DELIVERED)));

            assertThrows(AuthorizationException.class, () -> service.createReview(BUYER_ID, request(5, "Fake")));
            verify(orderItemDAO, never()).findById(any());
            verify(reviewDAO, never()).hasReviewed(any(), any());
            verify(reviewDAO, never()).insert(any());
        }

        @Test
        @DisplayName("Order with null customerId (corrupted data) must be treated as not owned")
        void orderWithNullOwner() {
            when(orderDAO.findById(ORDER_ID)).thenReturn(Optional.of(order(null, OrderStatus.DELIVERED)));

            assertThrows(AuthorizationException.class, () -> service.createReview(BUYER_ID, request(5, "Fake")));
            verify(reviewDAO, never()).insert(any());
        }

        @Test
        @DisplayName("Order item borrowed from a different order must be rejected")
        void itemFromAnotherOrder() {
            when(orderDAO.findById(ORDER_ID)).thenReturn(Optional.of(order(BUYER_ID, OrderStatus.DELIVERED)));
            when(orderItemDAO.findById(ITEM_ID)).thenReturn(Optional.of(item("order-OTHER", PURCHASED_PRODUCT_ID)));

            assertThrows(ValidationException.class, () -> service.createReview(BUYER_ID, request(5, "Swap")));
            verify(reviewDAO, never()).insert(any());
        }

        @Test
        @DisplayName("Order item with null orderId (orphan) must be rejected")
        void orphanOrderItem() {
            when(orderDAO.findById(ORDER_ID)).thenReturn(Optional.of(order(BUYER_ID, OrderStatus.DELIVERED)));
            when(orderItemDAO.findById(ITEM_ID)).thenReturn(Optional.of(item(null, PURCHASED_PRODUCT_ID)));

            assertThrows(ValidationException.class, () -> service.createReview(BUYER_ID, request(5, "Orphan")));
            verify(reviewDAO, never()).insert(any());
        }

        @Test
        @DisplayName("PRODUCT SPOOFING: buyer uses a valid order item but claims a product never purchased")
        void productSpoofingMustNotAttachReviewToUnpurchasedProduct() {
            givenValidDeliveredPurchase();
            CreateReviewRequest spoofed = new CreateReviewRequest(
                    ORDER_ID, ITEM_ID, "prod-COMPETITOR-NEVER-BOUGHT", 1, "Terrible product", null);

            try {
                service.createReview(BUYER_ID, spoofed);
            } catch (ValidationException | ConflictException expectedRejection) {
                verify(reviewDAO, never()).insert(any());
                return;
            }
            ArgumentCaptor<ProductReviewEntity> captor = ArgumentCaptor.forClass(ProductReviewEntity.class);
            verify(reviewDAO).insert(captor.capture());
            assertEquals(PURCHASED_PRODUCT_ID, captor.getValue().getProductId(),
                    "Review was attached to a product the buyer never purchased");
        }

        @Test
        @DisplayName("Blank / null userId and null request body are rejected before any DB access")
        void anonymousAndNullBody() {
            assertThrows(AuthorizationException.class, () -> service.createReview(null, request(5, "x")));
            assertThrows(AuthorizationException.class, () -> service.createReview("   ", request(5, "x")));
            assertThrows(ValidationException.class, () -> service.createReview(BUYER_ID, null));
            verifyNoInteractions(orderDAO, orderItemDAO, reviewDAO);
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("3. Rating boundaries")
    class RatingBoundaries {

        @Test
        @DisplayName("Exact boundaries 1 and 5 are accepted")
        void boundariesAccepted() {
            givenValidDeliveredPurchase();
            assertEquals(1, service.createReview(BUYER_ID, request(1, "Bad")).rating());

            when(reviewDAO.hasReviewed(BUYER_ID, ITEM_ID)).thenReturn(false);
            assertEquals(5, service.createReview(BUYER_ID, request(5, "Great")).rating());
        }

        @Test
        @DisplayName("Integer overflow extremes, 0, -1 and 6 are rejected without touching DB")
        void extremesRejected() {
            for (int bad : new int[]{Integer.MIN_VALUE, -1, 0, 6, Integer.MAX_VALUE}) {
                assertThrows(ValidationException.class,
                        () -> service.createReview(BUYER_ID, request(bad, "x")), "rating=" + bad);
            }
            verifyNoInteractions(orderDAO, reviewDAO);
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("4. Content sanitization (SEC-04) & limits (2.3.7)")
    class ContentSanitization {

        @Test
        @DisplayName("Comment that becomes empty after stripping script must be rejected")
        void scriptOnlyComment() {
            assertThrows(ValidationException.class,
                    () -> service.createReview(BUYER_ID, request(5, "<script>steal(document.cookie)</script>")));
            verifyNoInteractions(orderDAO, reviewDAO);
        }

        @Test
        @DisplayName("Null, empty and whitespace-only comments are rejected")
        void blankComments() {
            for (String blank : new String[]{null, "", "   ", "\n\t "}) {
                assertThrows(ValidationException.class,
                        () -> service.createReview(BUYER_ID, request(5, blank)), "comment=[" + blank + "]");
            }
            verify(reviewDAO, never()).insert(any());
        }

        @Test
        @DisplayName("Mixed-case script tags are stripped")
        void mixedCaseScript() {
            givenValidDeliveredPurchase();
            ReviewResponse res = service.createReview(BUYER_ID, request(5, "<ScRiPt>alert(1)</sCrIpT>Tasty"));
            assertEquals("Tasty", res.comment());
        }

        @Test
        @DisplayName("Nested obfuscated script must not reassemble into an executable tag")
        void nestedObfuscatedScript() {
            givenValidDeliveredPurchase();
            ReviewResponse res = service.createReview(BUYER_ID,
                    request(5, "<scr<script>x</script>ipt>alert(1)</script>Tasty"));
            assertFalse(res.comment().toLowerCase().contains("<script"), "Got: " + res.comment());
        }

        @Test
        @DisplayName("Unclosed malicious tag (no '>') must not survive sanitization")
        void unclosedImgOnerror() {
            givenValidDeliveredPurchase();
            ReviewResponse res = service.createReview(BUYER_ID,
                    request(5, "Yummy <img src=x onerror=alert(document.cookie)"));
            assertFalse(res.comment().toLowerCase().contains("<img"), "Got: " + res.comment());
        }

        @Test
        @DisplayName("Legitimate text with '<' and '>' (price comparison) must not be destroyed")
        void legitimateAngleBracketsPreserved() {
            givenValidDeliveredPurchase();
            ReviewResponse res = service.createReview(BUYER_ID,
                    request(4, "Price < 100k and > 50k, worth it"));
            assertTrue(res.comment().contains("100k"), "Legit content was deleted. Got: " + res.comment());
        }

        @Test
        @DisplayName("Vietnamese diacritics and emoji are preserved untouched")
        void unicodePreserved() {
            givenValidDeliveredPurchase();
            String text = "Gà rán giòn rụm, nước sốt đậm đà 🍗🔥👍";
            assertEquals(text, service.createReview(BUYER_ID, request(5, text)).comment());
        }

        @Test
        @DisplayName("Extremely long comment (100,000 chars) must be rejected (length limit required by 2.3.7)")
        void hugeCommentRejected() {
            givenValidDeliveredPurchase();
            String huge = "A".repeat(100_000);
            assertThrows(ValidationException.class, () -> service.createReview(BUYER_ID, request(5, huge)));
            verify(reviewDAO, never()).insert(any());
        }

        @Test
        @DisplayName("500 media attachments must be rejected (media count limit required by 2.3.7)")
        void tooManyMediaRejected() {
            givenValidDeliveredPurchase();
            List<String> media = new ArrayList<>();
            for (int i = 0; i < 500; i++) media.add("https://cdn.example.com/img" + i + ".jpg");

            CreateReviewRequest req = new CreateReviewRequest(ORDER_ID, ITEM_ID, PURCHASED_PRODUCT_ID, 5, "Spam", media);
            assertThrows(ValidationException.class, () -> service.createReview(BUYER_ID, req));
            verify(reviewDAO, never()).insert(any());
        }

        @Test
        @DisplayName("javascript: URL in media list must never be persisted")
        void javascriptMediaUrlNotPersisted() {
            givenValidDeliveredPurchase();
            CreateReviewRequest req = new CreateReviewRequest(ORDER_ID, ITEM_ID, PURCHASED_PRODUCT_ID, 5, "Look",
                    List.of("javascript:alert(document.cookie)"));
            try {
                service.createReview(BUYER_ID, req);
            } catch (ValidationException expectedRejection) {
                verify(reviewDAO, never()).insert(any());
                return;
            }
            ArgumentCaptor<ProductReviewEntity> captor = ArgumentCaptor.forClass(ProductReviewEntity.class);
            verify(reviewDAO).insert(captor.capture());
            String stored = captor.getValue().getMediaUrls();
            assertTrue(stored == null || !stored.toLowerCase().contains("javascript:"), "Stored: " + stored);
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("5. Duplicates & concurrency")
    class DuplicatesAndConcurrency {

        @Test
        @DisplayName("Sequential double submit: second attempt gets REVIEW_ALREADY_EXISTS, insert happens once")
        void sequentialDoubleSubmit() {
            givenValidDeliveredPurchase();
            when(reviewDAO.hasReviewed(BUYER_ID, ITEM_ID)).thenReturn(false, true);

            service.createReview(BUYER_ID, request(5, "First"));
            ConflictException ex = assertThrows(ConflictException.class,
                    () -> service.createReview(BUYER_ID, request(5, "Second")));
            assertEquals("REVIEW_ALREADY_EXISTS", ex.getErrorCode());
            verify(reviewDAO, times(1)).insert(any());
        }

        @Test
        @DisplayName("RACE: hasReviewed passes but DB unique key rejects insert -> must surface as 409 REVIEW_ALREADY_EXISTS, not 500")
        void raceOnUniqueConstraint() {
            givenValidDeliveredPurchase();
            doThrow(new DataAccessException("Duplicate entry for key 'uk_reviews_user_order_item'",
                    new RuntimeException("SQLIntegrityConstraintViolationException")))
                    .when(reviewDAO).insert(any());

            AppException ex = assertThrows(AppException.class, () -> service.createReview(BUYER_ID, request(5, "Click twice")));
            assertEquals(409, ex.getHttpStatus(), "Concurrent duplicate leaked as " + ex.getErrorCode());
            assertEquals("REVIEW_ALREADY_EXISTS", ex.getErrorCode());
        }

        @Test
        @DisplayName("User profile lookup failure must not block review creation (fallback name)")
        void userLookupFailureIsTolerated() {
            givenValidDeliveredPurchase();
            when(userDAO.findById(anyString())).thenThrow(new RuntimeException("users table locked"));

            ReviewResponse res = service.createReview(BUYER_ID, request(5, "Still works"));
            assertEquals("Customer", res.userName());
            verify(reviewDAO, times(1)).insert(any());
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("6. Update & delete")
    class UpdateAndDelete {

        @Test
        @DisplayName("Edit window: review created 2 years ago must not be editable (API 3.5.11: 409 edit window expired)")
        void editWindowExpired() {
            ProductReviewEntity old = existingReview(BUYER_ID, LocalDateTime.now().minusYears(2));
            when(reviewDAO.findById("rev-001")).thenReturn(Optional.of(old));

            AppException ex = assertThrows(AppException.class,
                    () -> service.updateReview(BUYER_ID, "rev-001", new UpdateReviewRequest(1, "Changed my mind", null)));
            assertEquals(409, ex.getHttpStatus());
            verify(reviewDAO, never()).update(any());
        }

        @Test
        @DisplayName("Invalid rating on update leaves entity completely untouched")
        void invalidUpdateDoesNotMutate() {
            ProductReviewEntity r = existingReview(BUYER_ID, LocalDateTime.now());
            when(reviewDAO.findById("rev-001")).thenReturn(Optional.of(r));

            assertThrows(ValidationException.class,
                    () -> service.updateReview(BUYER_ID, "rev-001", new UpdateReviewRequest(0, "New text", null)));
            assertEquals(4, r.getRating());
            assertEquals("Original comment", r.getComment());
            assertNull(r.getEditedBy());
            verify(reviewDAO, never()).update(any());
        }

        @Test
        @DisplayName("Script-only comment on update is rejected and original comment preserved")
        void scriptOnlyUpdate() {
            ProductReviewEntity r = existingReview(BUYER_ID, LocalDateTime.now());
            when(reviewDAO.findById("rev-001")).thenReturn(Optional.of(r));

            assertThrows(ValidationException.class,
                    () -> service.updateReview(BUYER_ID, "rev-001", new UpdateReviewRequest(5, "<script>x</script>", null)));
            assertEquals("Original comment", r.getComment());
            verify(reviewDAO, never()).update(any());
        }

        @Test
        @DisplayName("Update with null mediaUrls keeps existing media and records editedBy")
        void updateKeepsMediaAndSetsEditedBy() {
            ProductReviewEntity r = existingReview(BUYER_ID, LocalDateTime.now());
            when(reviewDAO.findById("rev-001")).thenReturn(Optional.of(r));
            when(userDAO.findById(anyString())).thenReturn(Optional.empty());

            ReviewResponse res = service.updateReview(BUYER_ID, "rev-001", new UpdateReviewRequest(5, "Better", null));
            assertEquals(List.of("https://cdn.example.com/a.jpg"), res.mediaUrls());
            assertEquals(BUYER_ID, r.getEditedBy());
        }

        @Test
        @DisplayName("Updating a non-existent review -> NotFoundException")
        void updateMissing() {
            when(reviewDAO.findById("ghost")).thenReturn(Optional.empty());
            assertThrows(NotFoundException.class,
                    () -> service.updateReview(BUYER_ID, "ghost", new UpdateReviewRequest(5, "x", null)));
        }

        @Test
        @DisplayName("Delete: other user's review forbidden, missing review 404, anonymous never hits DB")
        void deleteRules() {
            when(reviewDAO.findById("rev-001")).thenReturn(Optional.of(existingReview("someone-else", LocalDateTime.now())));
            assertThrows(AuthorizationException.class, () -> service.deleteReview(BUYER_ID, "rev-001"));

            when(reviewDAO.findById("ghost")).thenReturn(Optional.empty());
            assertThrows(NotFoundException.class, () -> service.deleteReview(BUYER_ID, "ghost"));

            verify(reviewDAO, never()).delete(any());

            ReviewDAO freshDao = mock(ReviewDAO.class);
            ReviewServiceImpl freshService = new ReviewServiceImpl(freshDao, orderDAO, orderItemDAO, userDAO);
            assertThrows(AuthorizationException.class, () -> freshService.deleteReview(null, "rev-001"));
            verifyNoInteractions(freshDao);
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("7. Read paths resilience")
    class ReadPaths {

        @Test
        @DisplayName("Corrupted media JSON in DB yields empty media list instead of crashing the listing")
        void corruptedMediaJson() {
            ProductReviewEntity r = existingReview(BUYER_ID, LocalDateTime.now());
            r.setMediaUrls("{not-valid-json[");
            when(reviewDAO.findByProductId(PURCHASED_PRODUCT_ID, null, 1, 10)).thenReturn(List.of(r));
            when(userDAO.findById(anyString())).thenReturn(Optional.empty());

            List<ReviewResponse> list = service.getProductReviews(PURCHASED_PRODUCT_ID, null, 1, 10);
            assertEquals(1, list.size());
            assertEquals(Collections.emptyList(), list.get(0).mediaUrls());
        }

        @Test
        @DisplayName("Null / blank identifiers on read paths return empty results without querying DB")
        void blankIdentifiersOnRead() {
            assertTrue(service.getMyReviews(null, 1, 10).isEmpty());
            assertTrue(service.getProductReviews("  ", null, 1, 10).isEmpty());
            assertEquals(0, service.countProductReviews(null, null));
            assertEquals(0.0, service.getProductReviewSummary("").averageRating());
            verifyNoInteractions(reviewDAO);
        }
    }
}
