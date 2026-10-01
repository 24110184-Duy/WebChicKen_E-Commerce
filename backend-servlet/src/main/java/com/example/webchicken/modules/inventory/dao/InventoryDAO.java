package com.example.webchicken.modules.inventory.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import javax.sql.DataSource;

/**
 * Data Access Object cho quản lý tồn kho và biến động kho.
 */
public class InventoryDAO extends BaseDAO {

    public InventoryDAO(DataSource dataSource) {
        super(dataSource);
    }
    // TODO: Triển khai các hàm cập nhật stock_quantity với PreparedStatement
}
