package com.example.webchicken.modules.identity.dao;

import com.example.webchicken.infrastructure.persistence.BaseDAO;
import com.example.webchicken.modules.identity.model.entity.UserEntity;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;

/**
 * Data Access Object cho bảng users.
 * Viết trực tiếp các hàm truy vấn JDBC với 100% PreparedStatement.
 */
public class UserDAO extends BaseDAO {

    public UserDAO(DataSource dataSource) {
        super(dataSource);
    }

    public Optional<UserEntity> findById(String userId) {
        String sql = "SELECT user_id, email, password_hash, full_name, phone, logo_url, status, created_at, updated_at " +
                     "FROM users WHERE user_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    // TODO: ánh xạ ResultSet sang UserEntity
                    return Optional.empty();
                }
            }
        } catch (SQLException e) {
            throw translateException("findById", e);
        }
        return Optional.empty();
    }

    public Optional<UserEntity> findByEmail(String email) {
        String sql = "SELECT user_id, email, password_hash, full_name, phone, logo_url, status, created_at, updated_at " +
                     "FROM users WHERE email = ?";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    // TODO: ánh xạ ResultSet sang UserEntity
                    return Optional.empty();
                }
            }
        } catch (SQLException e) {
            throw translateException("findByEmail", e);
        }
        return Optional.empty();
    }

    public boolean existsByEmail(String email) {
        String sql = "SELECT 1 FROM users WHERE email = ? LIMIT 1";
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException e) {
            throw translateException("existsByEmail", e);
        }
    }
}
