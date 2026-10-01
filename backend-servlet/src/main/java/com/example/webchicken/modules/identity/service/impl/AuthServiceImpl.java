package com.example.webchicken.modules.identity.service.impl;

import com.example.webchicken.modules.identity.dao.UserDAO;
import com.example.webchicken.modules.identity.dao.UserSessionDAO;
import com.example.webchicken.modules.identity.service.AuthService;
import java.util.Objects;

public class AuthServiceImpl implements AuthService {

    private final UserDAO userDAO;
    private final UserSessionDAO userSessionDAO;

    public AuthServiceImpl(UserDAO userDAO, UserSessionDAO userSessionDAO) {
        this.userDAO = Objects.requireNonNull(userDAO, "userDAO must not be null");
        this.userSessionDAO = Objects.requireNonNull(userSessionDAO, "userSessionDAO must not be null");
    }

    // TODO: Triển khai các phương thức nghiệp vụ xác thực (login, register, refreshToken, logout)
}
