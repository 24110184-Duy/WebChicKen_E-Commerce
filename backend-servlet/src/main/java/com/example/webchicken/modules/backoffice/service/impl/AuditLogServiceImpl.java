package com.example.webchicken.modules.backoffice.service.impl;

import com.example.webchicken.modules.backoffice.dao.AuditLogDAO;
import com.example.webchicken.modules.backoffice.service.AuditLogService;
import java.util.Objects;

public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogDAO auditLogDAO;

    public AuditLogServiceImpl(AuditLogDAO auditLogDAO) {
        this.auditLogDAO = Objects.requireNonNull(auditLogDAO, "auditLogDAO must not be null");
    }

    // TODO: implement methods
}
