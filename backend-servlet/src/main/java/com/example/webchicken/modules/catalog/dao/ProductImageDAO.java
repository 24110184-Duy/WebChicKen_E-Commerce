package com.example.webchicken.modules.catalog.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import jakarta.persistence.EntityManagerFactory;

/**
 * Data Access Object cho bảng product_images.
 */
public class ProductImageDAO extends BaseDAO {

    public ProductImageDAO(EntityManagerFactory emf) {
        super(emf);
    }
    // TODO: Triển khai các hàm CRUD với PreparedStatement
}
