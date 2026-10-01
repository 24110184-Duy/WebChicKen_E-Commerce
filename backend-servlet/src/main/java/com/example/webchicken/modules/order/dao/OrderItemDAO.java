package com.example.webchicken.modules.order.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import javax.sql.DataSource;

/**
 * Data Access Object cho bảng order_items.
 */
public class OrderItemDAO extends BaseDAO {

    public OrderItemDAO(DataSource dataSource) {
        super(dataSource);
    }
    // TODO: Triển khai các hàm CRUD với PreparedStatement
}
