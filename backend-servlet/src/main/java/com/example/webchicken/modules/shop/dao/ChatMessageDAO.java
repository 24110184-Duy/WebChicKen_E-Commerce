package com.example.webchicken.modules.shop.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.shop.model.entity.ChatMessageEntity;
import jakarta.persistence.EntityManagerFactory;

import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object cho bảng chat_messages.
 * Quản lý tin nhắn giao tiếp thời gian thực giữa Khách hàng và Người bán.
 */
public class ChatMessageDAO extends BaseDAO {

    public ChatMessageDAO(EntityManagerFactory emf) {
        super(emf);
    }

    public void save(ChatMessageEntity entity) {
        executeInTransaction(em -> em.persist(entity));
    }

    public List<ChatMessageEntity> getMessages(String storeId, String customerId, int limit) {
        if (storeId == null || customerId == null) return List.of();
        int safeLimit = Math.max(1, Math.min(200, limit));

        return executeQuery(em -> em.createQuery(
                "SELECT m FROM ChatMessageEntity m WHERE m.storeId = :storeId AND m.customerId = :customerId ORDER BY m.createdAt ASC",
                ChatMessageEntity.class)
                .setParameter("storeId", storeId.trim())
                .setParameter("customerId", customerId.trim())
                .setMaxResults(safeLimit)
                .getResultList());
    }

    public List<String> getCustomerIdsByStore(String storeId) {
        if (storeId == null || storeId.isBlank()) return List.of();
        return executeQuery(em -> em.createQuery(
                "SELECT DISTINCT m.customerId FROM ChatMessageEntity m WHERE m.storeId = :storeId",
                String.class)
                .setParameter("storeId", storeId.trim())
                .getResultList());
    }

    public List<String> getStoreIdsByCustomer(String customerId) {
        if (customerId == null || customerId.isBlank()) return List.of();
        return executeQuery(em -> em.createQuery(
                "SELECT DISTINCT m.storeId FROM ChatMessageEntity m WHERE m.customerId = :customerId",
                String.class)
                .setParameter("customerId", customerId.trim())
                .getResultList());
    }

    public ChatMessageEntity getLatestMessage(String storeId, String customerId) {
        if (storeId == null || customerId == null) return null;
        List<ChatMessageEntity> list = executeQuery(em -> em.createQuery(
                "SELECT m FROM ChatMessageEntity m WHERE m.storeId = :storeId AND m.customerId = :customerId ORDER BY m.createdAt DESC",
                ChatMessageEntity.class)
                .setParameter("storeId", storeId.trim())
                .setParameter("customerId", customerId.trim())
                .setMaxResults(1)
                .getResultList());
        return list.isEmpty() ? null : list.get(0);
    }

    public long countUnreadMessages(String storeId, String customerId, String targetSenderType) {
        if (storeId == null || customerId == null || targetSenderType == null) return 0;
        return executeQuery(em -> em.createQuery(
                "SELECT COUNT(m) FROM ChatMessageEntity m WHERE m.storeId = :storeId AND m.customerId = :customerId AND m.senderType = :senderType AND m.isRead = false",
                Long.class)
                .setParameter("storeId", storeId.trim())
                .setParameter("customerId", customerId.trim())
                .setParameter("senderType", targetSenderType.trim())
                .getSingleResult());
    }

    public void markAsRead(String storeId, String customerId, String readerType) {
        if (storeId == null || customerId == null || readerType == null) return;
        // Nếu người đọc là SELLER, đánh dấu các tin do CUSTOMER gửi là đã đọc
        // Nếu người đọc là CUSTOMER, đánh dấu các tin do SELLER gửi là đã đọc
        String senderToMark = "SELLER".equalsIgnoreCase(readerType) ? "CUSTOMER" : "SELLER";

        executeInTransaction(em -> em.createQuery(
                "UPDATE ChatMessageEntity m SET m.isRead = true WHERE m.storeId = :storeId AND m.customerId = :customerId AND m.senderType = :senderType AND m.isRead = false")
                .setParameter("storeId", storeId.trim())
                .setParameter("customerId", customerId.trim())
                .setParameter("senderType", senderToMark)
                .executeUpdate());
    }

    public long getTotalUnreadForCustomer(String customerId) {
        if (customerId == null || customerId.isBlank()) return 0;
        return executeQuery(em -> em.createQuery(
                "SELECT COUNT(m) FROM ChatMessageEntity m WHERE m.customerId = :customerId AND m.senderType = 'SELLER' AND m.isRead = false",
                Long.class)
                .setParameter("customerId", customerId.trim())
                .getSingleResult());
    }

    public long getTotalUnreadForStore(String storeId) {
        if (storeId == null || storeId.isBlank()) return 0;
        return executeQuery(em -> em.createQuery(
                "SELECT COUNT(m) FROM ChatMessageEntity m WHERE m.storeId = :storeId AND m.senderType = 'CUSTOMER' AND m.isRead = false",
                Long.class)
                .setParameter("storeId", storeId.trim())
                .getSingleResult());
    }
}
