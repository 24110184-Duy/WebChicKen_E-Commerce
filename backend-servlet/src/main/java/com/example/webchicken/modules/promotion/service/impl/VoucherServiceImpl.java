package com.example.webchicken.modules.promotion.service.impl;

import com.example.webchicken.modules.promotion.dao.VoucherDAO;
import com.example.webchicken.modules.promotion.service.VoucherService;
import java.util.Objects;

public class VoucherServiceImpl implements VoucherService {

    private final VoucherDAO voucherDAO;

    public VoucherServiceImpl(VoucherDAO voucherDAO) {
        this.voucherDAO = Objects.requireNonNull(voucherDAO, "voucherDAO must not be null");
    }

    // TODO: implement methods
}
