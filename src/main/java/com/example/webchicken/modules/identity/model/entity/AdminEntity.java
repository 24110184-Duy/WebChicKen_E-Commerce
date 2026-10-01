package com.example.webchicken.modules.identity.model.entity;

import com.example.webchicken.common.enums.AdminRole;

/** Ánh xạ bảng `admins`. Kế thừa UserEntity. */
public class AdminEntity extends UserEntity {
    private AdminRole role;

    public AdminRole getRole()        { return role; }
    public void setRole(AdminRole v)  { this.role = v; }
}
