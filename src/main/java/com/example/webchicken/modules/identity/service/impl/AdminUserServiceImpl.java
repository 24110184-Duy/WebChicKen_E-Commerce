package com.example.webchicken.modules.identity.service.impl;

import com.example.webchicken.modules.identity.dao.AccountBanDAO;
import com.example.webchicken.modules.identity.dao.AdminDAO;
import com.example.webchicken.modules.identity.dao.UserDAO;
import com.example.webchicken.modules.identity.service.AdminUserService;
import java.util.Objects;

public class AdminUserServiceImpl implements AdminUserService {

    private final AdminDAO adminDAO;
    private final UserDAO userDAO;
    private final AccountBanDAO accountBanDAO;

    public AdminUserServiceImpl(AdminDAO adminDAO, UserDAO userDAO, AccountBanDAO accountBanDAO) {
        this.adminDAO = Objects.requireNonNull(adminDAO, "adminDAO must not be null");
        this.userDAO = Objects.requireNonNull(userDAO, "userDAO must not be null");
        this.accountBanDAO = Objects.requireNonNull(accountBanDAO, "accountBanDAO must not be null");
    }

    // TODO: implement methods
}
