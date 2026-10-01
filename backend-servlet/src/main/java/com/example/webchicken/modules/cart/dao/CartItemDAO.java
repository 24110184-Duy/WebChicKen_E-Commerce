package com.example.webchicken.modules.cart.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import jakarta.persistence.EntityManagerFactory;

/**
 * Data Access Object cho bảng cart_items.
 */
public class CartItemDAO extends BaseDAO {

    public CartItemDAO(EntityManagerFactory emf) {
        super(emf);
    }
    // TODO: Triển khai các hàm CRUD với PreparedStatement
}
