package com.example.webchicken.modules.shop.service.impl;

import com.example.webchicken.modules.shop.dao.StoreDAO;
import com.example.webchicken.modules.shop.service.StoreService;
import java.util.Objects;

public class StoreServiceImpl implements StoreService {

    private final StoreDAO storeDAO;

    public StoreServiceImpl(StoreDAO storeDAO) {
        this.storeDAO = Objects.requireNonNull(storeDAO, "storeDAO must not be null");
    }

    // TODO: implement methods
}
