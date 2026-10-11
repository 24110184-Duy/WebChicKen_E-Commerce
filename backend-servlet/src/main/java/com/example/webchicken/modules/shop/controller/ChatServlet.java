package com.example.webchicken.modules.shop.controller;

import com.example.webchicken.common.model.AuthenticatedUser;
import com.example.webchicken.modules.shop.model.dto.request.CreateChatMessageRequest;
import com.example.webchicken.modules.shop.model.dto.response.ChatConversationResponse;
import com.example.webchicken.modules.shop.model.dto.response.ChatMessageResponse;
import com.example.webchicken.modules.shop.service.ChatService;
import com.example.webchicken.web.base.BaseApiServlet;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Controller xử lý trao đổi tin nhắn trực tiếp giữa Khách hàng và Người bán.
 * Endpoints:
 * - GET  /api/v1/chat/messages?storeId=...&customerId=... : Lấy danh sách tin nhắn của hội thoại
 * - POST /api/v1/chat/messages                            : Gửi tin nhắn mới
 * - GET  /api/v1/chat/conversations                       : Lấy danh bạ các hội thoại (hỗ trợ cả Seller và Buyer)
 * - PUT  /api/v1/chat/read                                : Đánh dấu đã đọc
 * - GET  /api/v1/chat/unread-count                        : Lấy số lượng tin nhắn chưa đọc
 */
@WebServlet(name = "ChatServlet", urlPatterns = {"/api/v1/chat/*"})
public class ChatServlet extends BaseApiServlet {

    private ChatService chatService;

    public ChatServlet() {
        super();
    }

    public ChatServlet(ObjectMapper objectMapper) {
        super(objectMapper);
    }

    public ChatServlet(ChatService chatService, ObjectMapper objectMapper) {
        super(objectMapper);
        this.chatService = chatService;
    }

    private ChatService service() {
        if (chatService != null) {
            return chatService;
        }
        return getService("chatService");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        AuthenticatedUser user = getAuthenticatedUser(req);
        if (user == null) {
            unauthorized(resp, "Vui lòng đăng nhập để sử dụng tính năng Chat.");
            return;
        }

        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/")) {
            pathInfo = "/messages";
        }

        if (pathInfo.startsWith("/messages")) {
            handleGetMessages(req, resp, user);
        } else if (pathInfo.startsWith("/conversations")) {
            handleGetConversations(req, resp, user);
        } else if (pathInfo.startsWith("/unread-count")) {
            handleGetUnreadCount(req, resp, user);
        } else {
            notFound(resp, "Endpoint chat không tồn tại: " + pathInfo);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        AuthenticatedUser user = getAuthenticatedUser(req);
        if (user == null) {
            unauthorized(resp, "Vui lòng đăng nhập để gửi tin nhắn.");
            return;
        }

        CreateChatMessageRequest requestBody = readBody(req, CreateChatMessageRequest.class);
        String role = req.getParameter("role");
        String senderType = "seller".equalsIgnoreCase(role) ? "SELLER" : "CUSTOMER";

        ChatMessageResponse created = service().sendMessage(user.userId(), senderType, requestBody);
        created(resp, created);
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        AuthenticatedUser user = getAuthenticatedUser(req);
        if (user == null) {
            unauthorized(resp, "Vui lòng đăng nhập.");
            return;
        }

        String pathInfo = req.getPathInfo();
        if (pathInfo != null && pathInfo.contains("/read")) {
            String storeId = req.getParameter("storeId");
            String customerId = req.getParameter("customerId");
            String role = req.getParameter("role");
            String readerType = "seller".equalsIgnoreCase(role) ? "SELLER" : "CUSTOMER";

            if (customerId == null || customerId.isBlank()) {
                customerId = user.userId();
            }

            service().markAsRead(storeId, customerId, readerType);
            ok(resp, Map.of("marked", true));
        } else {
            notFound(resp, "Endpoint không hợp lệ");
        }
    }

    private void handleGetMessages(HttpServletRequest req, HttpServletResponse resp, AuthenticatedUser user) throws IOException {
        String storeId = req.getParameter("storeId");
        String customerId = req.getParameter("customerId");
        int limit = getIntParam(req, "limit", 100);

        // Nếu là Customer gọi, tự động gán customerId là user đang đăng nhập
        String role = req.getParameter("role");
        if (!"seller".equalsIgnoreCase(role) && (customerId == null || customerId.isBlank())) {
            customerId = user.userId();
        }

        if (storeId == null || storeId.isBlank()) {
            badRequest(resp, "MISSING_STORE_ID", "storeId là bắt buộc.");
            return;
        }
        if (customerId == null || customerId.isBlank()) {
            badRequest(resp, "MISSING_CUSTOMER_ID", "customerId là bắt buộc.");
            return;
        }

        List<ChatMessageResponse> messages = service().getMessages(storeId, customerId, limit);
        ok(resp, messages);
    }

    private void handleGetConversations(HttpServletRequest req, HttpServletResponse resp, AuthenticatedUser user) throws IOException {
        String role = req.getParameter("role");
        String storeId = req.getParameter("storeId");

        List<ChatConversationResponse> list;
        if ("seller".equalsIgnoreCase(role)) {
            if (storeId == null || storeId.isBlank()) {
                badRequest(resp, "MISSING_STORE_ID", "storeId là bắt buộc đối với người bán.");
                return;
            }
            list = service().getConversationsForStore(storeId);
        } else {
            list = service().getConversationsForCustomer(user.userId());
        }

        ok(resp, list);
    }

    private void handleGetUnreadCount(HttpServletRequest req, HttpServletResponse resp, AuthenticatedUser user) throws IOException {
        String role = req.getParameter("role");
        String storeId = req.getParameter("storeId");
        boolean isSeller = "seller".equalsIgnoreCase(role);

        long count = service().getUnreadCount(user.userId(), storeId, isSeller);
        ok(resp, Map.of("unreadCount", count));
    }
}
