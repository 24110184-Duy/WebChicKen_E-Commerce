package com.example.webchicken.modules.shop.service;

import com.example.webchicken.modules.shop.model.dto.request.CreateChatMessageRequest;
import com.example.webchicken.modules.shop.model.dto.response.ChatConversationResponse;
import com.example.webchicken.modules.shop.model.dto.response.ChatMessageResponse;

import java.util.List;

/**
 * Interface hợp đồng nghiệp vụ cho hệ thống Chat giữa Khách hàng và Người bán.
 */
public interface ChatService {

    ChatMessageResponse sendMessage(String senderUserId, String senderType, CreateChatMessageRequest request);

    List<ChatMessageResponse> getMessages(String storeId, String customerId, int limit);

    List<ChatConversationResponse> getConversationsForStore(String storeId);

    List<ChatConversationResponse> getConversationsForCustomer(String customerId);

    void markAsRead(String storeId, String customerId, String readerType);

    long getUnreadCount(String customerId, String storeId, boolean isSeller);
}
