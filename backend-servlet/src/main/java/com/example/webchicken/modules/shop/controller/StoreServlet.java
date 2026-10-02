package com.example.webchicken.modules.shop.controller;

import com.example.webchicken.common.model.AuthenticatedUser;
import com.example.webchicken.modules.shop.model.dto.request.UpdateStoreRequest;
import com.example.webchicken.modules.shop.model.dto.response.StoreResponse;
import com.example.webchicken.modules.shop.service.StoreService;
import com.example.webchicken.web.base.BaseApiServlet;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * Servlet quản lý gian hàng (Store): /api/v1/stores/*
 * <ul>
 *   <li>GET /me: Người bán xem thông tin gian hàng của mình</li>
 *   <li>PUT /me: Người bán cập nhật tên gian hàng</li>
 *   <li>GET /{id}: Công khai xem thông tin gian hàng theo ID</li>
 * </ul>
 */
@WebServlet(name = "StoreServlet", urlPatterns = {"/api/v1/stores/*"})
public class StoreServlet extends BaseApiServlet {

    public StoreServlet() {
        super();
    }

    public StoreServlet(ObjectMapper objectMapper) {
        super(objectMapper);
    }

    private StoreService service() {
        return getService("storeService");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null) pathInfo = "";

        if ("/me".equalsIgnoreCase(pathInfo)) {
            AuthenticatedUser user = getAuthenticatedUser(req);
            if (user == null) {
                unauthorized(resp, "Vui lòng đăng nhập để xem thông tin gian hàng.");
                return;
            }
            StoreResponse store = service().getStoreBySellerId(user.userId());
            ok(resp, store);
            return;
        }

        // GET /{id}
        String storeId = pathInfo.startsWith("/") ? pathInfo.substring(1) : pathInfo;
        if (!storeId.isBlank()) {
            StoreResponse store = service().getStoreById(storeId);
            ok(resp, store);
            return;
        }

        notFound(resp, "Endpoint không tồn tại.");
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        AuthenticatedUser user = getAuthenticatedUser(req);
        if (user == null) {
            unauthorized(resp, "Vui lòng đăng nhập để thực hiện tác vụ.");
            return;
        }

        String pathInfo = req.getPathInfo();
        if (pathInfo == null) pathInfo = "";

        UpdateStoreRequest body = readBody(req, UpdateStoreRequest.class);

        if ("/me".equalsIgnoreCase(pathInfo)) {
            StoreResponse myStore = service().getStoreBySellerId(user.userId());
            StoreResponse updated = service().updateStore(myStore.id(), user.userId(), body);
            ok(resp, updated);
            return;
        }

        String storeId = pathInfo.startsWith("/") ? pathInfo.substring(1) : pathInfo;
        if (!storeId.isBlank()) {
            StoreResponse updated = service().updateStore(storeId, user.userId(), body);
            ok(resp, updated);
            return;
        }

        notFound(resp, "Endpoint không tồn tại.");
    }
}
