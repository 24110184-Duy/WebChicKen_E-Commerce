package com.example.webchicken.modules.payment.controller;

import com.example.webchicken.common.exception.AppException;
import com.example.webchicken.common.model.ApiResponse;
import com.example.webchicken.modules.payment.model.dto.request.ConfirmPaymentRequest;
import com.example.webchicken.modules.payment.model.dto.request.CreateVNPayPaymentRequest;
import com.example.webchicken.modules.payment.model.dto.response.PaymentMethodResponse;
import com.example.webchicken.modules.payment.model.dto.response.PaymentResponse;
import com.example.webchicken.modules.payment.model.dto.response.PaymentUrlResponse;
import com.example.webchicken.modules.payment.model.dto.response.VNPayIpnResponse;
import com.example.webchicken.modules.payment.service.PaymentService;
import com.example.webchicken.web.base.BaseApiServlet;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

/**
 * RESTful Controller for Payment endpoints (TASK-50 & TASK-51):
 * - GET  /api/v1/payment-methods          -> List available payment methods
 * - GET  /api/v1/payments/order/{orderId} -> Get payment details by orderId
 * - POST /api/v1/payments/cod/confirm     -> Confirm cash received for COD
 * - POST /api/v1/payments/vnpay/create-url-> Generate signed VNPay redirect URL
 */
@WebServlet(name = "PaymentServlet", urlPatterns = {"/api/v1/payments/*", "/api/v1/payment-methods"})
public class PaymentServlet extends BaseApiServlet {

    public PaymentServlet() {
        super();
    }

    public PaymentServlet(ObjectMapper objectMapper) {
        super(objectMapper);
    }

    private PaymentService paymentService() {
        return getService("paymentService");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String uri = req.getRequestURI();

        // 1. Available payment methods: GET /api/v1/payment-methods
        if (uri.endsWith("/payment-methods")) {
            List<PaymentMethodResponse> methods = paymentService().getAvailablePaymentMethods();
            ok(resp, methods);
            return;
        }

        // 2. Query payment by orderId: GET /api/v1/payments/order/{orderId}
        String pathInfo = req.getPathInfo();
        if (pathInfo != null && pathInfo.startsWith("/order/")) {
            String orderId = pathInfo.substring("/order/".length()).trim();
            try {
                PaymentResponse payment = paymentService().getPaymentByOrderId(orderId);
                ok(resp, payment);
            } catch (AppException e) {
                writeJson(resp, e.getHttpStatus(), ApiResponse.fail(com.example.webchicken.common.model.ApiError.of(e.getErrorCode(), e.getMessage())));
            } catch (Exception e) {
                badRequest(resp, "INTERNAL_ERROR", e.getMessage());
            }
            return;
        }

        // 3. VNPay Server-to-Server IPN: GET /api/v1/payments/vnpay/ipn
        if (pathInfo != null && pathInfo.equals("/vnpay/ipn")) {
            handleVNPayIpn(req, resp);
            return;
        }

        badRequest(resp, "INVALID_ENDPOINT", "Endpoint not found");
    }

    private void handleVNPayIpn(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        java.util.Map<String, String> params = new java.util.HashMap<>();
        java.util.Enumeration<String> paramNames = req.getParameterNames();
        while (paramNames.hasMoreElements()) {
            String name = paramNames.nextElement();
            String val = req.getParameter(name);
            if (val != null) {
                params.put(name, val);
            }
        }
        VNPayIpnResponse ipnResponse = paymentService().processVNPayIpn(params);
        writeJson(resp, HttpServletResponse.SC_OK, ipnResponse);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();

        // 1. Confirm COD payment: POST /api/v1/payments/cod/confirm
        if (pathInfo != null && pathInfo.equals("/cod/confirm")) {
            try {
                ConfirmPaymentRequest body = readBody(req, ConfirmPaymentRequest.class);
                if (body == null || body.orderId() == null || body.orderId().isBlank()) {
                    badRequest(resp, "INVALID_INPUT", "orderId is required");
                    return;
                }
                PaymentResponse payment = paymentService().confirmCodPayment(body.orderId());
                ok(resp, payment);
            } catch (AppException e) {
                writeJson(resp, e.getHttpStatus(), ApiResponse.fail(com.example.webchicken.common.model.ApiError.of(e.getErrorCode(), e.getMessage())));
            } catch (Exception e) {
                badRequest(resp, "INTERNAL_ERROR", e.getMessage());
            }
            return;
        }

        // 2. Generate VNPay Payment URL: POST /api/v1/payments/vnpay/create-url
        if (pathInfo != null && pathInfo.equals("/vnpay/create-url")) {
            try {
                CreateVNPayPaymentRequest body = readBody(req, CreateVNPayPaymentRequest.class);
                if (body == null || body.orderCode() == null || body.orderCode().isBlank()) {
                    badRequest(resp, "INVALID_INPUT", "orderCode is required");
                    return;
                }
                String clientIp = req.getHeader("X-Forwarded-For");
                if (clientIp == null || clientIp.isBlank()) {
                    clientIp = req.getRemoteAddr();
                }
                PaymentUrlResponse paymentUrl = paymentService().createVNPayPaymentUrl(body.orderCode(), clientIp);
                ok(resp, paymentUrl);
            } catch (AppException e) {
                writeJson(resp, e.getHttpStatus(), ApiResponse.fail(com.example.webchicken.common.model.ApiError.of(e.getErrorCode(), e.getMessage())));
            } catch (Exception e) {
                badRequest(resp, "INTERNAL_ERROR", e.getMessage());
            }
            return;
        }

        // 3. VNPay Server-to-Server IPN: POST /api/v1/payments/vnpay/ipn
        if (pathInfo != null && pathInfo.equals("/vnpay/ipn")) {
            handleVNPayIpn(req, resp);
            return;
        }

        badRequest(resp, "INVALID_ENDPOINT", "Endpoint not found");
    }
}
