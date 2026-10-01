package com.example.webchicken.modules.cart.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import javax.sql.DataSource;

/**
 * Data Access Object cho bảng cart_items.
 */
public class CartItemDAO extends BaseDAO {

    public CartItemDAO(DataSource dataSource) {
        super(dataSource);
    }
    // TODO: Triển khai các hàm CRUD với PreparedStatement
}
