package com.example.webchicken.modules.payment.service.impl;

import com.example.webchicken.modules.payment.dao.PaymentMethodDAO;
import com.example.webchicken.modules.payment.service.PaymentMethodService;
import java.util.Objects;

public class PaymentMethodServiceImpl implements PaymentMethodService {

    private final PaymentMethodDAO paymentMethodDAO;

    public PaymentMethodServiceImpl(PaymentMethodDAO paymentMethodDAO) {
        this.paymentMethodDAO = Objects.requireNonNull(paymentMethodDAO, "paymentMethodDAO must not be null");
    }

    // TODO: implement methods
}
