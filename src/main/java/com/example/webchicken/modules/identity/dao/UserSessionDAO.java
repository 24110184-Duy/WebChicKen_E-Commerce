package com.example.webchicken.modules.identity.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import javax.sql.DataSource;

/**
 * Data Access Object cho bảng user_sessions.
 * Lưu refresh token trong CSDL (không phải HttpSession).
 */
public class UserSessionDAO extends BaseDAO {

    public UserSessionDAO(DataSource dataSource) {
        super(dataSource);
    }
    // TODO: Triển khai các phương thức CRUD với PreparedStatement
}
