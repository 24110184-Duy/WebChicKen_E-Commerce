package com.example.webchicken.modules.media.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import jakarta.persistence.EntityManagerFactory;

/**
 * Data Access Object cho lưu trữ và truy vấn metadata media.
 */
public class MediaDAO extends BaseDAO {

    public MediaDAO(EntityManagerFactory emf) {
        super(emf);
    }
    // TODO: Triển khai các hàm CRUD với PreparedStatement
}
