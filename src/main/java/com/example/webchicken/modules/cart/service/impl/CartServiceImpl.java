package com.example.webchicken.modules.cart.service.impl;

import com.example.webchicken.modules.cart.dao.CartDAO;
import com.example.webchicken.modules.cart.dao.CartItemDAO;
import com.example.webchicken.modules.cart.service.CartService;
import java.util.Objects;

public class CartServiceImpl implements CartService {

    private final CartDAO cartDAO;
    private final CartItemDAO cartItemDAO;

    public CartServiceImpl(CartDAO cartDAO, CartItemDAO cartItemDAO) {
        this.cartDAO = Objects.requireNonNull(cartDAO, "cartDAO must not be null");
        this.cartItemDAO = Objects.requireNonNull(cartItemDAO, "cartItemDAO must not be null");
    }

    // TODO: implement methods
}
