package com.example.webchicken.modules.shop.service.impl;

import com.example.webchicken.modules.shop.dao.SellerApplicationDAO;
import com.example.webchicken.modules.shop.service.SellerApplicationService;
import java.util.Objects;

public class SellerApplicationServiceImpl implements SellerApplicationService {

    private final SellerApplicationDAO sellerApplicationDAO;

    public SellerApplicationServiceImpl(SellerApplicationDAO sellerApplicationDAO) {
        this.sellerApplicationDAO = Objects.requireNonNull(sellerApplicationDAO, "sellerApplicationDAO must not be null");
    }

    // TODO: implement methods
}
