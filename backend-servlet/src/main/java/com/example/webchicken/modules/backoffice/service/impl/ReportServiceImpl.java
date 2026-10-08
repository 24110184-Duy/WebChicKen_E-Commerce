package com.example.webchicken.modules.backoffice.service.impl;

import com.example.webchicken.modules.backoffice.dao.ReportDAO;
import com.example.webchicken.modules.backoffice.service.ReportService;
import java.util.Objects;

public class ReportServiceImpl implements ReportService {

    @SuppressWarnings("unused")
    private final ReportDAO reportDAO;

    public ReportServiceImpl(ReportDAO reportDAO) {
        this.reportDAO = Objects.requireNonNull(reportDAO, "reportDAO must not be null");
    }

    // TODO: implement methods
}
