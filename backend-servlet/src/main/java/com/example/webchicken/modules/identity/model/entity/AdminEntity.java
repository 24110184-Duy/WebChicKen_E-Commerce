package com.example.webchicken.modules.identity.model.entity;

import com.example.webchicken.common.enums.AdminRole;
import jakarta.persistence.*;

/**
 * Ánh xạ bảng {@code admins}.
 * Kế thừa {@link UserEntity} theo chiến lược JOINED.
 */
@Entity
@Table(name = "admins")
@PrimaryKeyJoinColumn(name = "id")
public class AdminEntity extends UserEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private AdminRole role = AdminRole.MODERATOR;

    public AdminRole getRole()        { return role; }
    public void setRole(AdminRole v)  { this.role = v; }
}
