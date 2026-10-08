package com.example.webchicken.modules.identity.service.impl;

import com.example.webchicken.modules.identity.dao.SellerDAO;
import com.example.webchicken.modules.identity.dao.UserDAO;
import com.example.webchicken.modules.identity.service.SellerService;
import java.util.Objects;

public class SellerServiceImpl implements SellerService {

    @SuppressWarnings("unused")
    private final SellerDAO sellerDAO;
    @SuppressWarnings("unused")
    private final UserDAO userDAO;

    public SellerServiceImpl(SellerDAO sellerDAO, UserDAO userDAO) {
        this.sellerDAO = Objects.requireNonNull(sellerDAO, "sellerDAO must not be null");
        this.userDAO = Objects.requireNonNull(userDAO, "userDAO must not be null");
    }

    // TODO: implement methods
}
