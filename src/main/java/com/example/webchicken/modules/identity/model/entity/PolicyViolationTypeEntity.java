package com.example.webchicken.modules.identity.model.entity;

/** Ánh xạ bảng `policy_violation_types`. */
public class PolicyViolationTypeEntity {
    private String typeId;
    private String description;

    public String getTypeId()           { return typeId; }
    public void setTypeId(String v)     { this.typeId = v; }
    public String getDescription()      { return description; }
    public void setDescription(String v){ this.description = v; }
}
