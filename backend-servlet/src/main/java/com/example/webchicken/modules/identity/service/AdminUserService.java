package com.example.webchicken.modules.identity.service;

import com.example.webchicken.modules.identity.model.dto.request.BanUserRequest;
import com.example.webchicken.modules.identity.model.dto.request.UnbanUserRequest;
import com.example.webchicken.modules.identity.model.dto.response.AccountBanResponse;
import com.example.webchicken.modules.identity.model.dto.response.AdminUserPageResponse;
import com.example.webchicken.modules.identity.model.dto.response.AdminUserResponse;
import java.util.List;

/**
 * Service quản trị người dùng, khóa và mở khóa tài khoản bởi Quản trị viên (Admin).
 * Mọi logic nghiệp vụ nằm trong impl, không trong Servlet/Entity.
 */
public interface AdminUserService {

    /**
     * Lấy danh sách người dùng với phân trang, tìm kiếm và lọc.
     */
    AdminUserPageResponse listUsers(int page, int size, String search, String status, String role);

    /**
     * Lấy chi tiết thông tin một người dùng.
     */
    AdminUserResponse getUserDetail(String userId);

    /**
     * Khóa/cấm tài khoản người dùng, đồng thời lập tức thu hồi mọi session đang hoạt động.
     */
    void banUser(String adminId, String userId, BanUserRequest request);

    /**
     * Mở khóa tài khoản người dùng.
     */
    void unbanUser(String adminId, String userId, UnbanUserRequest request);

    /**
     * Lấy lịch sử cấm/khóa của một tài khoản.
     */
    List<AccountBanResponse> getBanHistory(String userId);
}
