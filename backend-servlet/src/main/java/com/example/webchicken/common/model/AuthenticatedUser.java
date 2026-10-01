package com.example.webchicken.common.model;

import java.util.Collections;
import java.util.List;

/**
 * Thông tin người dùng đã xác thực thành công qua JWT Token.
 * Được lưu trong request attribute ("CURRENT_USER").
 */
public record AuthenticatedUser(String userId, String email, List<String> roles) {

    public AuthenticatedUser {
        if (roles == null) {
            roles = Collections.emptyList();
        }
    }

    public boolean hasRole(String role) {
        return roles != null && roles.contains(role);
    }

    public boolean isAdmin() {
        return hasRole("SUPER_ADMIN") || hasRole("MODERATOR") || hasRole("ADMIN");
    }

    public boolean isSeller() {
        return hasRole("SELLER");
    }

    public boolean isCustomer() {
        return hasRole("CUSTOMER");
    }
}
