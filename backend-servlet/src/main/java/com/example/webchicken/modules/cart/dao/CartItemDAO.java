package com.example.webchicken.modules.cart.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.cart.model.entity.CartItemEntity;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.NoResultException;

import java.util.Optional;

/**
 * Data Access Object cho bảng cart_items (TASK-38).
 */
public class CartItemDAO extends BaseDAO {

    public CartItemDAO(EntityManagerFactory emf) {
        super(emf);
    }

    public Optional<CartItemEntity> findById(String id) {
        return executeQuery(em -> Optional.ofNullable(em.find(CartItemEntity.class, id)));
    }

    public Optional<CartItemEntity> findByCartIdAndVariant(String cartId, String productId, String variantId) {
        return executeQuery(em -> {
            try {
                if (variantId == null || variantId.isBlank()) {
                    return Optional.of(em.createQuery(
                            "SELECT ci FROM CartItemEntity ci WHERE ci.cart.id = :cartId AND ci.productId = :productId AND ci.variantId IS NULL",
                            CartItemEntity.class)
                            .setParameter("cartId", cartId)
                            .setParameter("productId", productId)
                            .getSingleResult());
                } else {
                    return Optional.of(em.createQuery(
                            "SELECT ci FROM CartItemEntity ci WHERE ci.cart.id = :cartId AND ci.productId = :productId AND ci.variantId = :variantId",
                            CartItemEntity.class)
                            .setParameter("cartId", cartId)
                            .setParameter("productId", productId)
                            .setParameter("variantId", variantId)
                            .getSingleResult());
                }
            } catch (NoResultException e) {
                return Optional.empty();
            }
        });
    }

    public void save(CartItemEntity item) {
        executeInTransaction(em -> {
            if (em.find(CartItemEntity.class, item.getId()) == null) {
                em.persist(item);
            } else {
                em.merge(item);
            }
        });
    }

    public void updateQuantity(String itemId, int quantity) {
        executeInTransaction(em -> em.createQuery(
                "UPDATE CartItemEntity ci SET ci.quantity = :qty WHERE ci.id = :id")
                .setParameter("qty", quantity)
                .setParameter("id", itemId)
                .executeUpdate());
    }

    public void delete(String itemId) {
        executeInTransaction(em -> {
            CartItemEntity item = em.find(CartItemEntity.class, itemId);
            if (item != null) {
                em.remove(item);
            }
        });
    }

    public void deleteByCartAndVariant(String cartId, String productId, String variantId) {
        executeInTransaction(em -> {
            if (variantId == null || variantId.isBlank()) {
                em.createQuery("DELETE FROM CartItemEntity ci WHERE ci.cart.id = :cartId AND ci.productId = :productId AND ci.variantId IS NULL")
                        .setParameter("cartId", cartId)
                        .setParameter("productId", productId)
                        .executeUpdate();
            } else {
                em.createQuery("DELETE FROM CartItemEntity ci WHERE ci.cart.id = :cartId AND ci.productId = :productId AND ci.variantId = :variantId")
                        .setParameter("cartId", cartId)
                        .setParameter("productId", productId)
                        .setParameter("variantId", variantId)
                        .executeUpdate();
            }
        });
    }

    public void deleteByCartId(String cartId) {
        executeInTransaction(em -> {
            em.createQuery("DELETE FROM CartItemEntity ci WHERE ci.cart.id = :cartId")
                    .setParameter("cartId", cartId)
                    .executeUpdate();
        });
    }
}

