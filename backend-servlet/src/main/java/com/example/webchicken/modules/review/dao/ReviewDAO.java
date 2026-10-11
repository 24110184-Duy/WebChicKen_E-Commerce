package com.example.webchicken.modules.review.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.review.model.dto.response.ReviewSummaryResponse;
import com.example.webchicken.modules.review.model.entity.ProductReviewEntity;
import com.example.webchicken.modules.review.model.enums.ReviewStatus;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.TypedQuery;

import java.util.List;
import java.util.Optional;

/**
 * Data Access Object cho bảng product_reviews (TASK-56).
 * Sử dụng JPA EntityManager theo chuẩn BaseDAO của hệ thống.
 */
public class ReviewDAO extends BaseDAO {

    public ReviewDAO(EntityManagerFactory emf) {
        super(emf);
    }

    public void insert(ProductReviewEntity review) {
        executeInTransaction(em -> em.persist(review));
    }

    public void update(ProductReviewEntity review) {
        executeInTransaction(em -> em.merge(review));
    }

    public void delete(String id) {
        executeInTransaction(em -> {
            ProductReviewEntity entity = em.find(ProductReviewEntity.class, id);
            if (entity != null) {
                em.remove(entity);
            }
        });
    }

    public Optional<ProductReviewEntity> findById(String id) {
        if (id == null || id.isBlank()) return Optional.empty();
        return executeQuery(em -> Optional.ofNullable(em.find(ProductReviewEntity.class, id)));
    }

    public boolean hasReviewed(String userId, String orderItemId) {
        return executeQuery(em -> {
            List<?> list = em.createQuery(
                    "SELECT 1 FROM ProductReviewEntity r WHERE r.userId = :userId AND r.orderItemId = :orderItemId")
                    .setParameter("userId", userId)
                    .setParameter("orderItemId", orderItemId)
                    .setMaxResults(1)
                    .getResultList();
            return !list.isEmpty();
        });
    }

    public List<ProductReviewEntity> findByProductId(String productId, Integer ratingFilter, int page, int size) {
        return executeQuery(em -> {
            StringBuilder jpql = new StringBuilder(
                    "SELECT r FROM ProductReviewEntity r WHERE r.productId = :productId AND r.status = :status");
            if (ratingFilter != null && ratingFilter >= 1 && ratingFilter <= 5) {
                jpql.append(" AND r.rating = :rating");
            }
            jpql.append(" ORDER BY r.createdAt DESC");

            TypedQuery<ProductReviewEntity> query = em.createQuery(jpql.toString(), ProductReviewEntity.class)
                    .setParameter("productId", productId)
                    .setParameter("status", ReviewStatus.APPROVED);

            if (ratingFilter != null && ratingFilter >= 1 && ratingFilter <= 5) {
                query.setParameter("rating", ratingFilter);
            }

            int limit = Math.min(Math.max(1, size), 100);
            long rawOffset = ((long) Math.max(1, page) - 1) * limit;
            int offset = (rawOffset > Integer.MAX_VALUE) ? Integer.MAX_VALUE : (int) rawOffset;
            return query.setFirstResult(offset).setMaxResults(limit).getResultList();
        });
    }

    public long countByProductId(String productId, Integer ratingFilter) {
        return executeQuery(em -> {
            StringBuilder jpql = new StringBuilder(
                    "SELECT COUNT(r) FROM ProductReviewEntity r WHERE r.productId = :productId AND r.status = :status");
            if (ratingFilter != null && ratingFilter >= 1 && ratingFilter <= 5) {
                jpql.append(" AND r.rating = :rating");
            }

            TypedQuery<Long> query = em.createQuery(jpql.toString(), Long.class)
                    .setParameter("productId", productId)
                    .setParameter("status", ReviewStatus.APPROVED);

            if (ratingFilter != null && ratingFilter >= 1 && ratingFilter <= 5) {
                query.setParameter("rating", ratingFilter);
            }

            return query.getSingleResult();
        });
    }

    public List<ProductReviewEntity> findByUserId(String userId, int page, int size) {
        return executeQuery(em -> {
            int limit = Math.min(Math.max(1, size), 100);
            long rawOffset = ((long) Math.max(1, page) - 1) * limit;
            int offset = (rawOffset > Integer.MAX_VALUE) ? Integer.MAX_VALUE : (int) rawOffset;

            return em.createQuery(
                    "SELECT r FROM ProductReviewEntity r WHERE r.userId = :userId ORDER BY r.createdAt DESC",
                    ProductReviewEntity.class)
                    .setParameter("userId", userId)
                    .setFirstResult(offset)
                    .setMaxResults(limit)
                    .getResultList();
        });
    }

    public long countByUserId(String userId) {
        return executeQuery(em -> em.createQuery(
                "SELECT COUNT(r) FROM ProductReviewEntity r WHERE r.userId = :userId", Long.class)
                .setParameter("userId", userId)
                .getSingleResult());
    }

    public ReviewSummaryResponse getReviewSummary(String productId) {
        return executeQuery(em -> {
            List<ProductReviewEntity> reviews = em.createQuery(
                    "SELECT r FROM ProductReviewEntity r WHERE r.productId = :productId AND r.status = :status",
                    ProductReviewEntity.class)
                    .setParameter("productId", productId)
                    .setParameter("status", ReviewStatus.APPROVED)
                    .getResultList();

            long total = reviews.size();
            if (total == 0) {
                return new ReviewSummaryResponse(productId, 0.0, 0, 0, 0, 0, 0, 0);
            }

            long sum = 0;
            long count5 = 0, count4 = 0, count3 = 0, count2 = 0, count1 = 0;
            for (ProductReviewEntity r : reviews) {
                int rating = Math.max(1, Math.min(5, r.getRating()));
                sum += rating;
                switch (rating) {
                    case 5 -> count5++;
                    case 4 -> count4++;
                    case 3 -> count3++;
                    case 2 -> count2++;
                    case 1 -> count1++;
                }
            }

            double avg = Math.round(((double) sum / total) * 10.0) / 10.0;
            return new ReviewSummaryResponse(productId, avg, total, count5, count4, count3, count2, count1);
        });
    }

    public java.util.Map<String, ReviewSummaryResponse> getReviewSummaries(List<String> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return java.util.Collections.emptyMap();
        }
        return executeQuery(em -> {
            List<ProductReviewEntity> reviews = em.createQuery(
                    "SELECT r FROM ProductReviewEntity r WHERE r.productId IN :productIds AND r.status = :status",
                    ProductReviewEntity.class)
                    .setParameter("productIds", productIds)
                    .setParameter("status", ReviewStatus.APPROVED)
                    .getResultList();

            java.util.Map<String, java.util.List<ProductReviewEntity>> byProduct = reviews.stream()
                    .collect(java.util.stream.Collectors.groupingBy(ProductReviewEntity::getProductId));

            java.util.Map<String, ReviewSummaryResponse> result = new java.util.HashMap<>();
            for (String pid : productIds) {
                java.util.List<ProductReviewEntity> list = byProduct.getOrDefault(pid, java.util.Collections.emptyList());
                long total = list.size();
                if (total == 0) {
                    result.put(pid, new ReviewSummaryResponse(pid, 0.0, 0, 0, 0, 0, 0, 0));
                    continue;
                }
                long sum = 0;
                long count5 = 0, count4 = 0, count3 = 0, count2 = 0, count1 = 0;
                for (ProductReviewEntity r : list) {
                    int rating = Math.max(1, Math.min(5, r.getRating()));
                    sum += rating;
                    switch (rating) {
                        case 5 -> count5++;
                        case 4 -> count4++;
                        case 3 -> count3++;
                        case 2 -> count2++;
                        case 1 -> count1++;
                    }
                }
                double avg = Math.round(((double) sum / total) * 10.0) / 10.0;
                result.put(pid, new ReviewSummaryResponse(pid, avg, total, count5, count4, count3, count2, count1));
            }
            return result;
        });
    }
}

