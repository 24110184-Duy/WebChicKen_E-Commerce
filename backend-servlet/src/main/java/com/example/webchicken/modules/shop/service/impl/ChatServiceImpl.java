package com.example.webchicken.modules.shop.service.impl;

import com.example.webchicken.common.exception.ValidationException;
import com.example.webchicken.modules.identity.dao.UserDAO;
import com.example.webchicken.modules.identity.model.entity.UserEntity;
import com.example.webchicken.modules.shop.dao.ChatMessageDAO;
import com.example.webchicken.modules.shop.dao.StoreDAO;
import com.example.webchicken.modules.shop.model.dto.request.CreateChatMessageRequest;
import com.example.webchicken.modules.shop.model.dto.response.ChatConversationResponse;
import com.example.webchicken.modules.shop.model.dto.response.ChatMessageResponse;
import com.example.webchicken.modules.shop.model.entity.ChatMessageEntity;
import com.example.webchicken.modules.shop.model.entity.StoreEntity;
import com.example.webchicken.modules.shop.service.ChatService;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

public class ChatServiceImpl implements ChatService {

    private final ChatMessageDAO chatMessageDAO;
    private final StoreDAO storeDAO;
    private final UserDAO userDAO;

    public ChatServiceImpl(ChatMessageDAO chatMessageDAO, StoreDAO storeDAO, UserDAO userDAO) {
        this.chatMessageDAO = chatMessageDAO;
        this.storeDAO = storeDAO;
        this.userDAO = userDAO;
    }

    @Override
    public ChatMessageResponse sendMessage(String senderUserId, String senderType, CreateChatMessageRequest request) {
        if (request == null) {
            throw new ValidationException("Dữ liệu gửi tin nhắn không hợp lệ");
        }
        if (request.getStoreId() == null || request.getStoreId().isBlank()) {
            throw new ValidationException("Mã gian hàng (storeId) không được để trống");
        }
        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new ValidationException("Nội dung tin nhắn không được để trống");
        }

        String customerId;
        if ("SELLER".equalsIgnoreCase(senderType)) {
            if (request.getCustomerId() == null || request.getCustomerId().isBlank()) {
                throw new ValidationException("Mã khách hàng (customerId) không được để trống khi người bán gửi tin");
            }
            customerId = request.getCustomerId().trim();
        } else {
            customerId = senderUserId;
        }

        ChatMessageEntity entity = new ChatMessageEntity();
        entity.setId(UUID.randomUUID().toString());
        entity.setStoreId(request.getStoreId().trim());
        entity.setCustomerId(customerId);
        entity.setSenderType("SELLER".equalsIgnoreCase(senderType) ? "SELLER" : "CUSTOMER");
        entity.setSenderId(senderUserId);
        entity.setContent(request.getContent().trim());
        entity.setProductId(request.getProductId());
        entity.setProductName(request.getProductName());
        entity.setProductImage(request.getProductImage());
        entity.setProductPriceMinor(request.getProductPriceMinor());
        entity.setRead(false);

        chatMessageDAO.save(entity);
        return ChatMessageResponse.fromEntity(entity);
    }

    @Override
    public List<ChatMessageResponse> getMessages(String storeId, String customerId, int limit) {
        if (storeId == null || customerId == null) return List.of();
        List<ChatMessageEntity> entities = chatMessageDAO.getMessages(storeId, customerId, limit);
        List<ChatMessageResponse> res = new ArrayList<>();
        for (ChatMessageEntity e : entities) {
            res.add(ChatMessageResponse.fromEntity(e));
        }
        return res;
    }

    @Override
    public List<ChatConversationResponse> getConversationsForStore(String storeId) {
        if (storeId == null || storeId.isBlank()) return List.of();
        List<String> customerIds = chatMessageDAO.getCustomerIdsByStore(storeId);
        List<ChatConversationResponse> result = new ArrayList<>();

        for (String cId : customerIds) {
            ChatConversationResponse conv = new ChatConversationResponse();
            conv.setStoreId(storeId);
            conv.setCustomerId(cId);

            // Tên và Avatar khách hàng
            userDAO.findById(cId).ifPresentOrElse(u -> {
                conv.setCustomerName(u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName() : u.getEmail());
                conv.setCustomerAvatar(u.getLogoUrl());
            }, () -> {
                conv.setCustomerName("Khách hàng");
            });

            // Tin nhắn mới nhất
            ChatMessageEntity latest = chatMessageDAO.getLatestMessage(storeId, cId);
            if (latest != null) {
                conv.setLastMessage(latest.getContent());
                if (latest.getCreatedAt() != null) {
                    conv.setLastMessageAt(latest.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                }
                conv.setLastSenderType(latest.getSenderType());
            }

            // Đếm tin chưa đọc mà khách gửi cho shop
            long unread = chatMessageDAO.countUnreadMessages(storeId, cId, "CUSTOMER");
            conv.setUnreadCount(unread);

            result.add(conv);
        }

        // Sắp xếp theo tin nhắn mới nhất giảm dần
        result.sort((a, b) -> {
            if (a.getLastMessageAt() == null && b.getLastMessageAt() == null) return 0;
            if (a.getLastMessageAt() == null) return 1;
            if (b.getLastMessageAt() == null) return -1;
            return b.getLastMessageAt().compareTo(a.getLastMessageAt());
        });

        return result;
    }

    @Override
    public List<ChatConversationResponse> getConversationsForCustomer(String customerId) {
        if (customerId == null || customerId.isBlank()) return List.of();
        List<String> storeIds = chatMessageDAO.getStoreIdsByCustomer(customerId);
        List<ChatConversationResponse> result = new ArrayList<>();

        for (String sId : storeIds) {
            ChatConversationResponse conv = new ChatConversationResponse();
            conv.setStoreId(sId);
            conv.setCustomerId(customerId);

            // Tên và Avatar Store
            storeDAO.findById(sId).ifPresentOrElse(s -> {
                conv.setStoreName(s.getStoreName());
            }, () -> {
                conv.setStoreName("Gian hàng");
            });

            // Tin nhắn mới nhất
            ChatMessageEntity latest = chatMessageDAO.getLatestMessage(sId, customerId);
            if (latest != null) {
                conv.setLastMessage(latest.getContent());
                if (latest.getCreatedAt() != null) {
                    conv.setLastMessageAt(latest.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                }
                conv.setLastSenderType(latest.getSenderType());
            }

            // Đếm tin chưa đọc mà shop gửi cho khách
            long unread = chatMessageDAO.countUnreadMessages(sId, customerId, "SELLER");
            conv.setUnreadCount(unread);

            result.add(conv);
        }

        result.sort((a, b) -> {
            if (a.getLastMessageAt() == null && b.getLastMessageAt() == null) return 0;
            if (a.getLastMessageAt() == null) return 1;
            if (b.getLastMessageAt() == null) return -1;
            return b.getLastMessageAt().compareTo(a.getLastMessageAt());
        });

        return result;
    }

    @Override
    public void markAsRead(String storeId, String customerId, String readerType) {
        chatMessageDAO.markAsRead(storeId, customerId, readerType);
    }

    @Override
    public long getUnreadCount(String customerId, String storeId, boolean isSeller) {
        if (isSeller) {
            return chatMessageDAO.getTotalUnreadForStore(storeId);
        } else {
            return chatMessageDAO.getTotalUnreadForCustomer(customerId);
        }
    }
}
