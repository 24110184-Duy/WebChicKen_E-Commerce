package com.example.webchicken.modules.backoffice.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import jakarta.persistence.EntityManagerFactory;

/**
 * Data Access Object cho báo cáo và thống kê backoffice.
 */
public class ReportDAO extends BaseDAO {

    public ReportDAO(EntityManagerFactory emf) {
        super(emf);
    }
    // TODO: Triển khai các hàm truy vấn báo cáo với PreparedStatement
}
