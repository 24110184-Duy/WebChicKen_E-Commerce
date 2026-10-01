package com.example.webchicken.modules.inventory.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import jakarta.persistence.EntityManagerFactory;

/**
 * Data Access Object cho quản lý tồn kho và biến động kho.
 */
public class InventoryDAO extends BaseDAO {

    public InventoryDAO(EntityManagerFactory emf) {
        super(emf);
    }
    // TODO: Triển khai các hàm cập nhật stock_quantity với PreparedStatement
}
