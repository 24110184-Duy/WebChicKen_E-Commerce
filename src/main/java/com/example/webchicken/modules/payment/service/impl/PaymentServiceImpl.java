package com.example.webchicken.modules.payment.service.impl;

import com.example.webchicken.modules.payment.dao.PaymentDAO;
import com.example.webchicken.modules.payment.service.PaymentService;
import java.util.Objects;

public class PaymentServiceImpl implements PaymentService {

    private final PaymentDAO paymentDAO;

    public PaymentServiceImpl(PaymentDAO paymentDAO) {
        this.paymentDAO = Objects.requireNonNull(paymentDAO, "paymentDAO must not be null");
    }

    // TODO: implement methods
}
