package com.example.webchicken.modules.cart.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.cart.model.entity.CartEntity;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.NoResultException;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Data Access Object cho bảng carts (TASK-38).
 */
public class CartDAO extends BaseDAO {

    public CartDAO(EntityManagerFactory emf) {
        super(emf);
    }

    /**
     * Lấy giỏ hàng theo customer_id kèm danh sách items.
     */
    public Optional<CartEntity> findByCustomerId(String customerId) {
        return executeQuery(em -> {
            try {
                CartEntity cart = em.createQuery(
                        "SELECT DISTINCT c FROM CartEntity c LEFT JOIN FETCH c.items WHERE c.customerId = :customerId",
                        CartEntity.class)
                        .setParameter("customerId", customerId)
                        .getSingleResult();
                return Optional.of(cart);
            } catch (NoResultException e) {
                return Optional.empty();
            }
        });
    }

    /**
     * Lấy giỏ hàng hiện tại hoặc tạo mới nếu chưa tồn tại.
     */
    public CartEntity getOrCreateCart(String customerId) {
        Optional<CartEntity> existing = findByCustomerId(customerId);
        if (existing.isPresent()) {
            return existing.get();
        }

        CartEntity newCart = new CartEntity(UUID.randomUUID().toString(), customerId);
        executeInTransaction(em -> em.persist(newCart));
        return newCart;
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
