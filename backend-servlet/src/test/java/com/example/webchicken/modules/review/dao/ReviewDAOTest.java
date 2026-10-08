package com.example.webchicken.modules.review.dao;

import com.example.webchicken.common.exception.DataAccessException;
import com.example.webchicken.modules.review.model.dto.response.ReviewSummaryResponse;
import com.example.webchicken.modules.review.model.entity.ProductReviewEntity;
import com.example.webchicken.modules.review.model.enums.ReviewStatus;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Query;
import jakarta.persistence.TypedQuery;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Test tầng DAO cho review (TASK-56): thuật toán tổng hợp sao, phân trang, quản lý EntityManager.
 * Quy tắc: test KHÔNG được chỉnh sửa để pass; test fail = lỗi thật của mã nguồn.
 */
public class ReviewDAOTest {

    private static final String PRODUCT_ID = "prod-001";

    private EntityManagerFactory emf;
    private EntityManager em;
    private TypedQuery<ProductReviewEntity> entityQuery;
    private ReviewDAO dao;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        emf = mock(EntityManagerFactory.class);
        em = mock(EntityManager.class);
        entityQuery = mock(TypedQuery.class);

        when(emf.createEntityManager()).thenReturn(em);
        when(em.isOpen()).thenReturn(true);
        when(em.createQuery(anyString(), eq(ProductReviewEntity.class))).thenReturn(entityQuery);
        when(entityQuery.setParameter(anyString(), any())).thenReturn(entityQuery);
        when(entityQuery.setFirstResult(anyInt())).thenReturn(entityQuery);
        when(entityQuery.setMaxResults(anyInt())).thenReturn(entityQuery);

        dao = new ReviewDAO(emf);
    }

    private void givenRatings(int... ratings) {
        List<ProductReviewEntity> list = new ArrayList<>();
        for (int i = 0; i < ratings.length; i++) {
            ProductReviewEntity r = new ProductReviewEntity();
            r.setId("rev-" + i);
            r.setProductId(PRODUCT_ID);
            r.setRating(ratings[i]);
            r.setStatus(ReviewStatus.APPROVED);
            list.add(r);
        }
        when(entityQuery.getResultList()).thenReturn(list);
    }

    // ── Summary aggregation ─────────────────────────────────────────────────

    @Test
    @DisplayName("No reviews -> all-zero summary, never divides by zero")
    void emptySummary() {
        givenRatings();
        ReviewSummaryResponse s = dao.getReviewSummary(PRODUCT_ID);

        assertEquals(0.0, s.averageRating());
        assertEquals(0, s.totalReviews());
        assertEquals(0, s.fiveStarCount() + s.fourStarCount() + s.threeStarCount() + s.twoStarCount() + s.oneStarCount());
    }

    @Test
    @DisplayName("Average rounds to 1 decimal: [5,4,4]=4.333->4.3 and [5,5,4]=4.667->4.7")
    void roundingToOneDecimal() {
        givenRatings(5, 4, 4);
        assertEquals(4.3, dao.getReviewSummary(PRODUCT_ID).averageRating(), 1e-9);

        givenRatings(5, 5, 4);
        assertEquals(4.7, dao.getReviewSummary(PRODUCT_ID).averageRating(), 1e-9);
    }

    @Test
    @DisplayName("Half-up boundary: [5,4,4,4]=4.25 must display 4.3 (not 4.2)")
    void halfUpBoundary() {
        givenRatings(5, 4, 4, 4);
        assertEquals(4.3, dao.getReviewSummary(PRODUCT_ID).averageRating(), 1e-9);
    }

    @Test
    @DisplayName("Star distribution counts every bucket exactly")
    void distributionExact() {
        givenRatings(5, 5, 5, 4, 3, 3, 2, 1, 1, 1);
        ReviewSummaryResponse s = dao.getReviewSummary(PRODUCT_ID);

        assertEquals(10, s.totalReviews());
        assertEquals(3, s.fiveStarCount());
        assertEquals(1, s.fourStarCount());
        assertEquals(2, s.threeStarCount());
        assertEquals(1, s.twoStarCount());
        assertEquals(3, s.oneStarCount());
        assertEquals(3.0, s.averageRating(), 1e-9);
    }

    @Test
    @DisplayName("INVARIANT: buckets must always add up to totalReviews, even with legacy out-of-range ratings (0, 9) in DB")
    void bucketsMustSumToTotalWithCorruptedRows() {
        // V001 baseline has no CHECK constraint on rating: legacy/imported rows can hold any TINYINT value.
        givenRatings(5, 0, 9, 4);
        ReviewSummaryResponse s = dao.getReviewSummary(PRODUCT_ID);

        long bucketSum = s.fiveStarCount() + s.fourStarCount() + s.threeStarCount() + s.twoStarCount() + s.oneStarCount();
        assertEquals(s.totalReviews(), bucketSum,
                "UI would show 'N reviews' but star bars add up to fewer. total=" + s.totalReviews() + ", bars=" + bucketSum);
        assertTrue(s.averageRating() >= 1.0 && s.averageRating() <= 5.0, "avg=" + s.averageRating());
    }

    @Test
    @DisplayName("Summary only counts APPROVED reviews (moderated content excluded)")
    void onlyApprovedCounted() {
        givenRatings(5);
        dao.getReviewSummary(PRODUCT_ID);
        verify(entityQuery).setParameter("status", ReviewStatus.APPROVED);
        verify(entityQuery).setParameter("productId", PRODUCT_ID);
    }

    // ── Pagination ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("Page 3 size 20 -> offset 40, limit 20")
    void normalPagination() {
        givenRatings();
        dao.findByProductId(PRODUCT_ID, null, 3, 20);
        verify(entityQuery).setFirstResult(40);
        verify(entityQuery).setMaxResults(20);
    }

    @Test
    @DisplayName("Page 0 / negative page clamp to offset 0; size 0 clamps to 1; size 1000 caps at 100 (README 2.2.6)")
    void paginationClamping() {
        givenRatings();
        dao.findByProductId(PRODUCT_ID, null, 0, 0);
        verify(entityQuery).setFirstResult(0);
        verify(entityQuery).setMaxResults(1);

        clearInvocations((Object) entityQuery);
        dao.findByProductId(PRODUCT_ID, null, -5, 1000);
        verify(entityQuery).setFirstResult(0);
        verify(entityQuery).setMaxResults(100);
    }

    @Test
    @DisplayName("OVERFLOW: page=Integer.MAX_VALUE must NOT wrap around and silently return page 1 data")
    void hugePageMustNotWrapToFirstPage() {
        givenRatings();
        try {
            dao.findByProductId(PRODUCT_ID, null, Integer.MAX_VALUE, 10);
        } catch (RuntimeException rejected) {
            return; // rejecting an absurd page number is acceptable
        }
        ArgumentCaptor<Integer> offset = ArgumentCaptor.forClass(Integer.class);
        verify(entityQuery).setFirstResult(offset.capture());
        assertNotEquals(0, offset.getValue().intValue(),
                "page=2147483647 produced offset 0 -> attacker/crawler sees page 1 again (int overflow)");
    }

    @Test
    @DisplayName("Rating filter 1..5 binds parameter; out-of-range filter is not bound")
    void ratingFilterBinding() {
        givenRatings();
        dao.findByProductId(PRODUCT_ID, 3, 1, 10);
        verify(entityQuery).setParameter("rating", 3);

        clearInvocations((Object) entityQuery);
        dao.findByProductId(PRODUCT_ID, 9, 1, 10);
        verify(entityQuery, never()).setParameter(eq("rating"), any());
    }

    // ── Resource handling ───────────────────────────────────────────────────

    @Test
    @DisplayName("EntityManager is closed and error is wrapped as DataAccessException when the query blows up")
    void entityManagerClosedOnFailure() {
        when(entityQuery.getResultList()).thenThrow(new IllegalStateException("connection reset"));

        assertThrows(DataAccessException.class, () -> dao.getReviewSummary(PRODUCT_ID));
        verify(em, times(1)).close();
    }

    @Test
    @DisplayName("hasReviewed: empty result -> false, any row -> true; EntityManager always closed")
    void hasReviewedBehaviour() {
        Query raw = mock(Query.class);
        when(em.createQuery(anyString())).thenReturn(raw);
        when(raw.setParameter(anyString(), any())).thenReturn(raw);
        when(raw.setMaxResults(anyInt())).thenReturn(raw);

        when(raw.getResultList()).thenReturn(List.of());
        assertFalse(dao.hasReviewed("u1", "i1"));

        when(raw.getResultList()).thenReturn(List.of(1));
        assertTrue(dao.hasReviewed("u1", "i1"));

        verify(em, times(2)).close();
    }

    @Test
    @DisplayName("findById with null/blank id never opens an EntityManager")
    void findByIdBlank() {
        assertTrue(dao.findById(null).isEmpty());
        assertTrue(dao.findById("  ").isEmpty());
        verify(emf, never()).createEntityManager();
    }
}
