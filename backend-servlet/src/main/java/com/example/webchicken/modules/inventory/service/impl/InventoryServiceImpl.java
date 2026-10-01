package com.example.webchicken.modules.inventory.service.impl;

import com.example.webchicken.modules.inventory.dao.InventoryDAO;
import com.example.webchicken.modules.inventory.service.InventoryService;
import java.util.Objects;

public class InventoryServiceImpl implements InventoryService {

    private final InventoryDAO inventoryDAO;

    public InventoryServiceImpl(InventoryDAO inventoryDAO) {
        this.inventoryDAO = Objects.requireNonNull(inventoryDAO, "inventoryDAO must not be null");
    }

    // TODO: implement methods
}
