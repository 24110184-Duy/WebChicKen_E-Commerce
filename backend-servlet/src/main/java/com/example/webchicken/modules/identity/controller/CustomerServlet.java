package com.example.webchicken.modules.identity.controller;

import com.example.webchicken.common.model.AuthenticatedUser;
import com.example.webchicken.modules.identity.model.dto.request.CreateAddressRequest;
import com.example.webchicken.modules.identity.model.dto.request.UpdateProfileRequest;
import com.example.webchicken.modules.identity.model.dto.response.AddressResponse;
import com.example.webchicken.modules.identity.model.dto.response.UserProfileResponse;
import com.example.webchicken.modules.identity.service.CustomerService;
import com.example.webchicken.web.base.BaseApiServlet;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Servlet quản lý hồ sơ và sổ địa chỉ khách hàng: /api/v1/customers/*
 * <ul>
 *   <li>GET    /profile: Lấy thông tin hồ sơ cá nhân</li>
 *   <li>PUT    /profile: Cập nhật thông tin cá nhân</li>
 *   <li>GET    /addresses: Lấy danh sách địa chỉ nhận hàng</li>
 *   <li>POST   /addresses: Thêm địa chỉ nhận hàng mới</li>
 *   <li>PUT    /addresses/{id}/default: Đặt địa chỉ làm mặc định</li>
 *   <li>DELETE /addresses/{id}: Xóa một địa chỉ nhận hàng</li>
 * </ul>
 */
@WebServlet(name = "CustomerServlet", urlPatterns = {"/api/v1/customers/*"})
public class CustomerServlet extends BaseApiServlet {

    public CustomerServlet() {
        super();
    }

    public CustomerServlet(ObjectMapper objectMapper) {
        super(objectMapper);
    }

    private CustomerService customerService() {
        return getService("customerService");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        AuthenticatedUser user = getAuthenticatedUser(req);
        if (user == null) {
            unauthorized(resp, "Vui lòng đăng nhập để tiếp tục.");
            return;
        }

        String pathInfo = req.getPathInfo();
        if (pathInfo == null) pathInfo = "";

        switch (pathInfo) {
            case "/profile" -> {
                UserProfileResponse profile = customerService().getProfile(user.userId());
                ok(resp, profile);
            }
            case "/addresses", "/addresses/" -> {
                List<AddressResponse> addresses = customerService().getAddresses(user.userId());
                ok(resp, addresses);
            }
            default -> notFound(resp, "Endpoint không tồn tại: " + pathInfo);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        AuthenticatedUser user = getAuthenticatedUser(req);
        if (user == null) {
            unauthorized(resp, "Vui lòng đăng nhập để tiếp tục.");
            return;
        }

        String pathInfo = req.getPathInfo();
        if (pathInfo == null) pathInfo = "";

        if ("/addresses".equals(pathInfo) || "/addresses/".equals(pathInfo)) {
            CreateAddressRequest request = readBody(req, CreateAddressRequest.class);
            AddressResponse newAddress = customerService().addAddress(user.userId(), request);
            created(resp, newAddress);
        } else {
            notFound(resp, "Endpoint không tồn tại: " + pathInfo);
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        AuthenticatedUser user = getAuthenticatedUser(req);
        if (user == null) {
            unauthorized(resp, "Vui lòng đăng nhập để tiếp tục.");
            return;
        }

        String pathInfo = req.getPathInfo();
        if (pathInfo == null) pathInfo = "";

        if ("/profile".equals(pathInfo)) {
            UpdateProfileRequest request = readBody(req, UpdateProfileRequest.class);
            UserProfileResponse updated = customerService().updateProfile(user.userId(), request);
            ok(resp, updated);
        } else if (pathInfo.startsWith("/addresses/") && pathInfo.endsWith("/default")) {
            // Pattern: /addresses/{addressId}/default
            String[] parts = pathInfo.split("/");
            if (parts.length == 4) {
                String addressId = parts[2];
                customerService().setDefaultAddress(user.userId(), addressId);
                ok(resp, Map.of("message", "Đã đặt địa chỉ làm mặc định"));
            } else {
                badRequest(resp, "INVALID_PATH", "Đường dẫn không hợp lệ: " + pathInfo);
            }
        } else {
            notFound(resp, "Endpoint không tồn tại: " + pathInfo);
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        AuthenticatedUser user = getAuthenticatedUser(req);
        if (user == null) {
            unauthorized(resp, "Vui lòng đăng nhập để tiếp tục.");
            return;
        }

        String pathInfo = req.getPathInfo();
        if (pathInfo == null) pathInfo = "";

        if (pathInfo.startsWith("/addresses/")) {
            // Pattern: /addresses/{addressId}
            String[] parts = pathInfo.split("/");
            if (parts.length == 3) {
                String addressId = parts[2];
                customerService().deleteAddress(user.userId(), addressId);
                noContent(resp);
            } else {
                badRequest(resp, "INVALID_PATH", "Đường dẫn không hợp lệ: " + pathInfo);
            }
        } else {
            notFound(resp, "Endpoint không tồn tại: " + pathInfo);
        }
    }
}
