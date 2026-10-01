package com.example.webchicken.infrastructure.persistence;

import com.example.webchicken.common.exception.DataAccessException;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Objects;

/**
 * Lớp cơ sở cho toàn bộ các lớp DAO trong hệ thống.
 * Cung cấp kết nối CSDL từ connection pool (HikariCP DataSource),
 * chuẩn hóa việc mở/đóng kết nối và dịch SQLException sang DataAccessException.
 */
public abstract class BaseDAO {

    protected final DataSource dataSource;

    protected BaseDAO(DataSource dataSource) {
        this.dataSource = Objects.requireNonNull(dataSource, "dataSource must not be null");
    }

    /**
     * Lấy một kết nối từ Connection Pool.
     * Sử dụng trong try-with-resources để tự động đóng kết nối sau khi dùng.
     */
    protected Connection getConnection() throws SQLException {
        return dataSource.getConnection();
    }

    /**
     * Chuẩn hóa và bọc SQLException thành DataAccessException theo luật EXC-01.
     */
    protected DataAccessException translateException(String operation, SQLException e) {
        return new DataAccessException("Lỗi thao tác CSDL [" + operation + "]: " + e.getMessage(), e);
    }
}
