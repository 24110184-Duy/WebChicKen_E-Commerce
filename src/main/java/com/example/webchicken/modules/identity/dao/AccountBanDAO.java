package com.example.webchicken.modules.identity.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import javax.sql.DataSource;

/**
 * Data Access Object cho bảng account_bans.
 */
public class AccountBanDAO extends BaseDAO {

    public AccountBanDAO(DataSource dataSource) {
        super(dataSource);
    }
    // TODO: Triển khai các phương thức CRUD với PreparedStatement
}
