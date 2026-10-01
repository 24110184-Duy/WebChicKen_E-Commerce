package com.example.webchicken.modules.identity.model.entity;

import jakarta.persistence.*;

/** Ánh xạ bảng {@code policy_violation_types}. */
@Entity
@Table(name = "policy_violation_types")
public class PolicyViolationTypeEntity {

    @Id
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    private String typeId;

    @Column(name = "description", length = 255, nullable = false)
    private String description;

    public String getTypeId()            { return typeId; }
    public void setTypeId(String v)      { this.typeId = v; }
    public String getDescription()       { return description; }
    public void setDescription(String v) { this.description = v; }
}
