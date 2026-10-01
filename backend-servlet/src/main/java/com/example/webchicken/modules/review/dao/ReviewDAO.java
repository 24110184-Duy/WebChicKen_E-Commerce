package com.example.webchicken.modules.review.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import jakarta.persistence.EntityManagerFactory;

/**
 * Data Access Object cho bảng product_reviews.
 */
public class ReviewDAO extends BaseDAO {

    public ReviewDAO(EntityManagerFactory emf) {
        super(emf);
    }
    // TODO: Triển khai các hàm CRUD với PreparedStatement
}
