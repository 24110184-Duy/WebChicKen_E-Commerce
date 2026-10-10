package com.example.webchicken.modules.cart.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.cart.model.entity.CartEntity;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.NoResultException;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.List;

/**
 * Data Access Object cho bảng carts (TASK-38).
 */
public class CartDAO extends BaseDAO {

    public CartDAO(EntityManagerFactory emf) {
        super(emf);
    }

    /**
     * Lấy giỏ hàng theo customer_id kèm danh sách items.
     * Sử dụng getResultList() an toàn tuyệt đối chống NonUniqueResultException.
     */
    public Optional<CartEntity> findByCustomerId(String customerId) {
        return executeQuery(em -> {
            List<CartEntity> carts = em.createQuery(
                    "SELECT DISTINCT c FROM CartEntity c LEFT JOIN FETCH c.items WHERE c.customerId = :customerId ORDER BY c.updatedAt DESC",
                    CartEntity.class)
                    .setParameter("customerId", customerId)
                    .getResultList();
            if (carts.isEmpty()) {
                return Optional.empty();
            }
            return Optional.of(carts.get(0));
        });
    }

    /**
     * Lấy giỏ hàng hiện tại hoặc tạo mới nếu chưa tồn tại.
     * Bắt ngoại lệ duplicate key khi xảy ra tranh chấp race condition giữa các
     * luồng.
     */
    public CartEntity getOrCreateCart(String customerId) {
        Optional<CartEntity> existing = findByCustomerId(customerId);
        if (existing.isPresent()) {
            return existing.get();
        }

        ensureCustomerProfile(customerId);

        try {
            CartEntity newCart = new CartEntity(UUID.randomUUID().toString(), customerId);
            executeInTransaction(em -> em.persist(newCart));
            return newCart;
        } catch (Exception e) {
            // Nếu luồng khác vừa tạo xong cùng lúc, truy vấn lại giỏ hàng vừa tạo
            return findByCustomerId(customerId)
                    .orElseThrow(() -> translateException("getOrCreateCart", e));
        }
    }

    private void ensureCustomerProfile(String customerId) {
        if (customerId == null || customerId.isBlank()) return;
        try {
            executeInTransaction(em -> {
                em.createNativeQuery("INSERT INTO customers (id, tier, loyalty_point) VALUES (?, 'STANDARD', 0) ON CONFLICT (id) DO NOTHING")
                        .setParameter(1, customerId)
                        .executeUpdate();
            });
        } catch (Exception ignored) {
        }
    }

    /**
     * Lưu hoặc cập nhật giỏ hàng.
     */
    public void save(CartEntity cart) {
        executeInTransaction(em -> {
            cart.setUpdatedAt(LocalDateTime.now());
            if (em.find(CartEntity.class, cart.getId()) == null) {
                em.persist(cart);
            } else {
                em.merge(cart);
            }
        });
    }

    /**
     * Dọn sạch toàn bộ các mặt hàng trong giỏ sau khi đặt hàng thành công.
     */
    public void clearCart(String customerId) {
        executeInTransaction(em -> {
            Optional<CartEntity> cartOpt = findByCustomerId(customerId);
            if (cartOpt.isPresent()) {
                em.createQuery("DELETE FROM CartItemEntity ci WHERE ci.cart.id = :cartId")
                        .setParameter("cartId", cartOpt.get().getId())
                        .executeUpdate();

                em.createQuery("UPDATE CartEntity c SET c.updatedAt = :now WHERE c.id = :cartId")
                        .setParameter("now", LocalDateTime.now())
                        .setParameter("cartId", cartOpt.get().getId())
                        .executeUpdate();
            }
        });
    }
}
