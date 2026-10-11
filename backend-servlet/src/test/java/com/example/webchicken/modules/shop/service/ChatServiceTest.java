package com.example.webchicken.modules.shop.service;

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
import com.example.webchicken.modules.shop.service.impl.ChatServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class ChatServiceTest {

    private ChatMessageDAO chatMessageDAO;
    private StoreDAO storeDAO;
    private UserDAO userDAO;
    private ChatServiceImpl chatService;

    @BeforeEach
    void setUp() {
        chatMessageDAO = mock(ChatMessageDAO.class);
        storeDAO = mock(StoreDAO.class);
        userDAO = mock(UserDAO.class);
        chatService = new ChatServiceImpl(chatMessageDAO, storeDAO, userDAO);
    }

    @Test
    @DisplayName("Khách hàng gửi tin nhắn cho shop thành công")
    void testSendMessageCustomerSuccess() {
        CreateChatMessageRequest req = new CreateChatMessageRequest();
        req.setStoreId("store-001");
        req.setContent("Shop ơi sản phẩm này còn màu đen không ạ?");
        req.setProductId("prod-123");
        req.setProductName("Áo thun Chicky");
        req.setProductPriceMinor(150000L);

        ChatMessageResponse res = chatService.sendMessage("customer-001", "CUSTOMER", req);

        assertNotNull(res);
        assertEquals("store-001", res.getStoreId());
        assertEquals("customer-001", res.getCustomerId());
        assertEquals("CUSTOMER", res.getSenderType());
        assertEquals("Shop ơi sản phẩm này còn màu đen không ạ?", res.getContent());
        assertFalse(res.isRead());

        ArgumentCaptor<ChatMessageEntity> captor = ArgumentCaptor.forClass(ChatMessageEntity.class);
        verify(chatMessageDAO).save(captor.capture());
        assertEquals("store-001", captor.getValue().getStoreId());
        assertEquals("customer-001", captor.getValue().getCustomerId());
    }

    @Test
    @DisplayName("Người bán phản hồi tin nhắn cho khách hàng thành công")
    void testSendMessageSellerSuccess() {
        CreateChatMessageRequest req = new CreateChatMessageRequest();
        req.setStoreId("store-001");
        req.setCustomerId("customer-001");
        req.setContent("Dạ còn sẵn màu đen size M và L bạn nhé!");

        ChatMessageResponse res = chatService.sendMessage("seller-usr-1", "SELLER", req);

        assertNotNull(res);
        assertEquals("store-001", res.getStoreId());
        assertEquals("customer-001", res.getCustomerId());
        assertEquals("SELLER", res.getSenderType());
        assertEquals("Dạ còn sẵn màu đen size M và L bạn nhé!", res.getContent());

        verify(chatMessageDAO).save(any(ChatMessageEntity.class));
    }

    @Test
    @DisplayName("Gửi tin nhắn thiếu nội dung sẽ ném ValidationException")
    void testSendMessageEmptyContentThrowsValidation() {
        CreateChatMessageRequest req = new CreateChatMessageRequest();
        req.setStoreId("store-001");
        req.setContent("   ");

        assertThrows(ValidationException.class, () ->
                chatService.sendMessage("customer-001", "CUSTOMER", req));
    }

    @Test
    @DisplayName("Gửi tin nhắn thiếu storeId sẽ ném ValidationException")
    void testSendMessageEmptyStoreIdThrowsValidation() {
        CreateChatMessageRequest req = new CreateChatMessageRequest();
        req.setContent("Hello shop");

        assertThrows(ValidationException.class, () ->
                chatService.sendMessage("customer-001", "CUSTOMER", req));
    }

    @Test
    @DisplayName("Người bán gửi tin nhắn nhưng không có customerId sẽ ném ValidationException")
    void testSendMessageSellerWithoutCustomerIdThrowsValidation() {
        CreateChatMessageRequest req = new CreateChatMessageRequest();
        req.setStoreId("store-001");
        req.setContent("Dạ shop chào bạn");

        assertThrows(ValidationException.class, () ->
                chatService.sendMessage("seller-usr-1", "SELLER", req));
    }

    @Test
    @DisplayName("Lấy danh sách tin nhắn của hội thoại")
    void testGetMessages() {
        ChatMessageEntity msg1 = new ChatMessageEntity("msg-1", "store-1", "cust-1", "CUSTOMER", "cust-1", "Hi");
        ChatMessageEntity msg2 = new ChatMessageEntity("msg-2", "store-1", "cust-1", "SELLER", "seller-1", "Hello");
        when(chatMessageDAO.getMessages("store-1", "cust-1", 50)).thenReturn(List.of(msg1, msg2));

        List<ChatMessageResponse> list = chatService.getMessages("store-1", "cust-1", 50);

        assertEquals(2, list.size());
        assertEquals("Hi", list.get(0).getContent());
        assertEquals("Hello", list.get(1).getContent());
    }

    @Test
    @DisplayName("Lấy danh bạ hội thoại cho Người bán")
    void testGetConversationsForStore() {
        when(chatMessageDAO.getCustomerIdsByStore("store-1")).thenReturn(List.of("cust-10"));

        com.example.webchicken.modules.identity.model.entity.CustomerEntity user = new com.example.webchicken.modules.identity.model.entity.CustomerEntity();
        user.setUserId("cust-10");
        user.setFullName("Nguyễn Văn A");
        user.setEmail("a@gmail.com");
        when(userDAO.findById("cust-10")).thenReturn(Optional.of(user));

        ChatMessageEntity latest = new ChatMessageEntity("m-1", "store-1", "cust-10", "CUSTOMER", "cust-10", "Shop còn hàng ko?");
        latest.setCreatedAt(LocalDateTime.now());
        when(chatMessageDAO.getLatestMessage("store-1", "cust-10")).thenReturn(latest);
        when(chatMessageDAO.countUnreadMessages("store-1", "cust-10", "CUSTOMER")).thenReturn(2L);

        List<ChatConversationResponse> convs = chatService.getConversationsForStore("store-1");

        assertEquals(1, convs.size());
        assertEquals("Nguyễn Văn A", convs.get(0).getCustomerName());
        assertEquals("Shop còn hàng ko?", convs.get(0).getLastMessage());
        assertEquals(2L, convs.get(0).getUnreadCount());
    }

    @Test
    @DisplayName("Đánh dấu đã đọc tin nhắn")
    void testMarkAsRead() {
        chatService.markAsRead("store-1", "cust-1", "SELLER");
        verify(chatMessageDAO).markAsRead("store-1", "cust-1", "SELLER");
    }

    @Test
    @DisplayName("Lấy số lượng tin nhắn chưa đọc")
    void testGetUnreadCount() {
        when(chatMessageDAO.getTotalUnreadForStore("store-1")).thenReturn(5L);
        when(chatMessageDAO.getTotalUnreadForCustomer("cust-1")).thenReturn(3L);

        long sellerUnread = chatService.getUnreadCount("seller-1", "store-1", true);
        long buyerUnread = chatService.getUnreadCount("cust-1", null, false);

        assertEquals(5L, sellerUnread);
        assertEquals(3L, buyerUnread);
    }
}
