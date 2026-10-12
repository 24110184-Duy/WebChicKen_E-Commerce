package com.example.webchicken.infrastructure.mail;

import com.example.webchicken.bootstrap.EnvConfig;
import com.example.webchicken.modules.order.model.entity.OrderEntity;
import com.example.webchicken.modules.order.model.entity.OrderItemEntity;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.text.NumberFormat;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Cài đặt EmailService sử dụng HTTP REST API qua cổng chuẩn HTTPS (Port 443).
 * <p>
 * GIẢI PHÁP CHO VẤN ĐỀ RENDER NETWORK:
 * Hạ tầng Render chặn hoàn toàn các cổng SMTP outbound (25, 465, 587, 2525) để ngăn chặn spam,
 * do đó các kết nối JavaMail SMTP truyền thống đều sẽ bị timed out và thất bại.
 * Lớp này sử dụng kết nối HTTPS REST API (Port 443) tới các dịch vụ Email Gateway (Resend / Brevo)
 * thông qua java.net.http.HttpClient thuần, không cần socket SMTP, hoàn toàn vượt qua rào cản cổng của Render.
 * </p>
 * <p>
 * Cơ chế Fail-Safe & Non-blocking:
 * - Chạy Asynchronous trên thread pool chuyên biệt, không làm chậm request của khách hàng/người bán.
 * - Nếu chưa cấu hình API key trên Render, hệ thống ghi log chi tiết mô phỏng (Simulated) mà không gây lỗi 500.
 * </p>
 */
public class HttpEmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(HttpEmailServiceImpl.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy");

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final ExecutorService executor;

    public HttpEmailServiceImpl() {
        this.httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_2)
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = new ObjectMapper();

        // Executor có tên cụ thể tuân thủ CODE_PRINCIPLES RES-06
        AtomicInteger threadCount = new AtomicInteger(1);
        this.executor = new ThreadPoolExecutor(
                1, 4, 60L, TimeUnit.SECONDS,
                new LinkedBlockingQueue<>(200),
                r -> {
                    Thread t = new Thread(r, "mail-sender-worker-" + threadCount.getAndIncrement());
                    t.setDaemon(true);
                    return t;
                },
                new ThreadPoolExecutor.CallerRunsPolicy()
        );
    }

    @Override
    public CompletableFuture<Void> sendOrderDeliveredConfirmationAsync(
            String recipientEmail,
            String customerName,
            OrderEntity order,
            List<OrderItemEntity> items
    ) {
        if (recipientEmail == null || recipientEmail.isBlank()) {
            log.warn("Recipient email is empty. Skip sending delivery confirmation email for order [{}].",
                    order != null ? order.getOrderCode() : "UNKNOWN");
            return CompletableFuture.completedFuture(null);
        }

        return CompletableFuture.runAsync(() -> {
            try {
                sendOrderDeliveredConfirmationSync(recipientEmail, customerName, order, items);
            } catch (Throwable t) {
                // Tuyệt đối không để ngoại lệ lan ra ngoài làm gián đoạn transaction đổi trạng thái đơn hàng
                log.error("Unhandled error when sending delivery email for order [{}] to [{}]: {}",
                        order != null ? order.getOrderCode() : "UNKNOWN", recipientEmail, t.getMessage(), t);
            }
        }, executor);
    }

    private void sendOrderDeliveredConfirmationSync(
            String recipientEmail,
            String customerName,
            OrderEntity order,
            List<OrderItemEntity> items
    ) {
        String resendApiKey = EnvConfig.get("RESEND_API_KEY", null);
        String brevoApiKey = EnvConfig.get("BREVO_API_KEY", null);
        String emailFrom = EnvConfig.get("EMAIL_FROM", "WebChicKen <onboarding@resend.dev>");
        String frontendUrl = EnvConfig.get("FRONTEND_URL", "http://localhost:5173");

        String orderCode = order != null ? order.getOrderCode() : "N/A";
        String subject = String.format("[WebChicKen] Đơn hàng #%s của bạn đã được giao thành công! 🎉", orderCode);
        String htmlContent = buildDeliveredEmailHtml(customerName, order, items, frontendUrl);

        // 1. Kiểm tra nếu có cấu hình RESEND_API_KEY (Ưu tiên số 1 - Khuyên dùng trên Render qua HTTPS Port 443)
        if (resendApiKey != null && !resendApiKey.isBlank()) {
            sendViaResend(resendApiKey, emailFrom, recipientEmail, subject, htmlContent, orderCode);
            return;
        }

        // 2. Kiểm tra nếu có cấu hình BREVO_API_KEY (Ưu tiên số 2 qua HTTPS Port 443)
        if (brevoApiKey != null && !brevoApiKey.isBlank()) {
            sendViaBrevo(brevoApiKey, emailFrom, recipientEmail, customerName, subject, htmlContent, orderCode);
            return;
        }

        // 3. Cơ chế Fail-Safe: Khi chưa cấu hình API Key trên Render Dashboard
        log.warn("================================================================================");
        log.warn("[EMAIL-SERVICE] GỬI EMAIL XÁC NHẬN GIAO HÀNG (MÔ PHỎNG AN TOÀN TRÊN RENDER)");
        log.warn("Người nhận: {} ({})", customerName, recipientEmail);
        log.warn("Mã đơn hàng: #{}", orderCode);
        log.warn("Tiêu đề: {}", subject);
        log.warn("LƯU Ý HẠ TẦNG RENDER: Render chặn hoàn toàn các cổng SMTP 25, 465, 587.");
        log.warn("Để gửi email thật đến Gmail khách hàng qua cổng HTTPS 443, hãy thêm biến môi trường:");
        log.warn("RESEND_API_KEY=<khoá_resend_của_bạn> (Đăng ký miễn phí tại https://resend.com)");
        log.warn("vào mục Environment trên Render Dashboard.");
        log.warn("================================================================================");
    }

    private void sendViaResend(String apiKey, String from, String to, String subject, String html, String orderCode) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("from", from);
            payload.put("to", Collections.singletonList(to));
            payload.put("subject", subject);
            payload.put("html", html);

            String requestBody = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .timeout(Duration.ofSeconds(12))
                    .header("Authorization", "Bearer " + apiKey.trim())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Successfully sent delivery confirmation email for order [{}] to [{}] via Resend HTTPS API. Response: {}",
                        orderCode, to, response.body());
            } else {
                log.error("Failed to send email via Resend HTTPS API for order [{}]. Status: {}, Body: {}",
                        orderCode, response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.error("Exception when sending email via Resend for order [{}]: {}", orderCode, e.getMessage(), e);
        }
    }

    private void sendViaBrevo(String apiKey, String from, String to, String toName, String subject, String html, String orderCode) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            Map<String, String> sender = new HashMap<>();
            sender.put("name", "WebChicKen");
            sender.put("email", extractEmailOnly(from));
            payload.put("sender", sender);

            Map<String, String> recipient = new HashMap<>();
            recipient.put("email", to);
            if (toName != null && !toName.isBlank()) recipient.put("name", toName);
            payload.put("to", Collections.singletonList(recipient));

            payload.put("subject", subject);
            payload.put("htmlContent", html);

            String requestBody = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                    .timeout(Duration.ofSeconds(12))
                    .header("api-key", apiKey.trim())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Successfully sent delivery confirmation email for order [{}] to [{}] via Brevo HTTPS API. Response: {}",
                        orderCode, to, response.body());
            } else {
                log.error("Failed to send email via Brevo HTTPS API for order [{}]. Status: {}, Body: {}",
                        orderCode, response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.error("Exception when sending email via Brevo for order [{}]: {}", orderCode, e.getMessage(), e);
        }
    }

    private String extractEmailOnly(String rawFrom) {
        if (rawFrom == null || rawFrom.isBlank()) return "support@webchicken.vn";
        if (rawFrom.contains("<") && rawFrom.contains(">")) {
            return rawFrom.substring(rawFrom.indexOf('<') + 1, rawFrom.indexOf('>')).trim();
        }
        return rawFrom.trim();
    }

    private String formatMoney(long minor) {
        NumberFormat nf = NumberFormat.getInstance(new Locale("vi", "VN"));
        return nf.format(minor) + " ₫";
    }

    /**
     * Xây dựng nội dung HTML Email mẫu hiện đại, chuẩn Responsive cho thông báo giao hàng thành công.
     */
    private String buildDeliveredEmailHtml(
            String customerName,
            OrderEntity order,
            List<OrderItemEntity> items,
            String frontendUrl
    ) {
        String safeCustomerName = (customerName != null && !customerName.isBlank()) ? customerName : "Quý khách";
        String orderCode = order != null ? order.getOrderCode() : "N/A";
        String orderDate = (order != null && order.getOrderDate() != null)
                ? order.getOrderDate().format(DATE_FORMATTER) : "N/A";
        String recipientName = (order != null && order.getRecipientName() != null) ? order.getRecipientName() : safeCustomerName;
        String recipientPhone = (order != null && order.getRecipientPhone() != null) ? order.getRecipientPhone() : "Chưa cập nhật";
        String shippingAddress = (order != null && order.getShippingAddress() != null) ? order.getShippingAddress() : "Địa chỉ mặc định";
        String paymentMethod = (order != null && order.getPaymentMethod() != null) ? order.getPaymentMethod().name() : "COD";
        long totalAmount = order != null ? order.getTotalAmountMinor() : 0;
        long shippingFee = order != null ? order.getShippingFeeMinor() : 0;
        long discount = order != null ? order.getDiscountAmountMinor() : 0;

        StringBuilder itemsTableRows = new StringBuilder();
        if (items != null && !items.isEmpty()) {
            for (OrderItemEntity item : items) {
                String pName = item.getProductName() != null ? item.getProductName() : "Sản phẩm";
                String vName = item.getVariantName() != null && !item.getVariantName().isBlank()
                        ? ("<span style=\"color:#6b7280; font-size:12px; display:block;\">Phân loại: " + item.getVariantName() + "</span>")
                        : "";
                long unitPrice = item.getUnitPriceAtPurchaseMinor();
                int qty = item.getQuantity();
                long subtotal = unitPrice * qty;

                itemsTableRows.append("<tr>")
                        .append("<td style=\"padding:12px 14px; border-bottom:1px solid #e5e7eb; color:#1f2937;\">")
                        .append("<strong style=\"color:#111827;\">").append(escapeHtml(pName)).append("</strong>")
                        .append(vName)
                        .append("</td>")
                        .append("<td style=\"padding:12px 14px; border-bottom:1px solid #e5e7eb; text-align:center; color:#4b5563;\">")
                        .append(qty)
                        .append("</td>")
                        .append("<td style=\"padding:12px 14px; border-bottom:1px solid #e5e7eb; text-align:right; color:#4b5563;\">")
                        .append(formatMoney(unitPrice))
                        .append("</td>")
                        .append("<td style=\"padding:12px 14px; border-bottom:1px solid #e5e7eb; text-align:right; font-weight:600; color:#ea580c;\">")
                        .append(formatMoney(subtotal))
                        .append("</td>")
                        .append("</tr>");
            }
        } else {
            itemsTableRows.append("<tr><td colspan=\"4\" style=\"padding:16px; text-align:center; color:#6b7280;\">Chi tiết sản phẩm đã được đóng gói an toàn theo kiện hàng.</td></tr>");
        }

        String orderDetailLink = frontendUrl != null && !frontendUrl.isBlank()
                ? (frontendUrl.replaceAll("/+$", "") + "/buyer/orders")
                : "https://webchicken.vn/buyer/orders";

        return """
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Đơn hàng đã được giao thành công</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f3f4f6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#374151; -webkit-font-smoothing:antialiased;">
            <div style="max-width:640px; margin:24px auto; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.06); border:1px solid #e5e7eb;">
                <!-- Header Banner -->
                <div style="background:linear-gradient(135deg, #ea580c 0%, #f97316 100%); padding:32px 24px; text-align:center; color:#ffffff;">
                    <h1 style="margin:0; font-size:26px; font-weight:800; letter-spacing:-0.5px; display:inline-flex; align-items:center; gap:8px;">
                        🍗 WebChicKen Marketplace
                    </h1>
                    <p style="margin:8px 0 0; font-size:14px; opacity:0.95; font-weight:500;">Xác nhận giao hàng thành công</p>
                </div>

                <!-- Main Content -->
                <div style="padding:28px 24px;">
                    <!-- Success Status Badge -->
                    <div style="background-color:#ecfdf5; border:1px solid #a7f3d0; border-radius:12px; padding:18px; text-align:center; margin-bottom:24px;">
                        <div style="font-size:28px; line-height:1; margin-bottom:6px;">📦 ✅</div>
                        <h2 style="margin:0 0 4px; color:#065f46; font-size:18px; font-weight:700;">Món hàng của bạn đã đến nơi an toàn!</h2>
                        <p style="margin:0; color:#047857; font-size:14px;">Đơn hàng <strong>#%s</strong> đã được giao thành công tới địa chỉ nhận hàng của bạn.</p>
                    </div>

                    <!-- Greeting -->
                    <p style="font-size:15px; line-height:1.6; margin:0 0 16px; color:#1f2937;">
                        Xin chào <strong>%s</strong>,<br>
                        WebChicKen xin trân trọng thông báo kiện hàng bạn đặt đã được giao thành công. Cảm ơn bạn đã lựa chọn mua sắm cùng chúng tôi!
                    </p>

                    <!-- Order Summary Card -->
                    <div style="background-color:#f9fafb; border-radius:12px; border:1px solid #f3f4f6; padding:18px; margin-bottom:24px;">
                        <h3 style="margin:0 0 12px; font-size:15px; font-weight:700; color:#111827; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #e5e7eb; padding-bottom:8px;">
                            📋 Thông tin đơn hàng
                        </h3>
                        <table style="width:100%%; font-size:14px; border-collapse:collapse;">
                            <tr>
                                <td style="padding:4px 0; color:#6b7280; width:140px;">Mã đơn hàng:</td>
                                <td style="padding:4px 0; font-weight:600; color:#ea580c;">#%s</td>
                            </tr>
                            <tr>
                                <td style="padding:4px 0; color:#6b7280;">Ngày đặt hàng:</td>
                                <td style="padding:4px 0; color:#1f2937;">%s</td>
                            </tr>
                            <tr>
                                <td style="padding:4px 0; color:#6b7280;">Người nhận:</td>
                                <td style="padding:4px 0; color:#1f2937;"><strong>%s</strong> (%s)</td>
                            </tr>
                            <tr>
                                <td style="padding:4px 0; color:#6b7280;">Địa chỉ giao hàng:</td>
                                <td style="padding:4px 0; color:#1f2937;">%s</td>
                            </tr>
                            <tr>
                                <td style="padding:4px 0; color:#6b7280;">Phương thức:</td>
                                <td style="padding:4px 0; color:#1f2937;">%s</td>
                            </tr>
                        </table>
                    </div>

                    <!-- Items Detail Table -->
                    <h3 style="margin:0 0 12px; font-size:15px; font-weight:700; color:#111827; text-transform:uppercase; letter-spacing:0.5px;">
                        🛍️ Chi tiết sản phẩm đã giao
                    </h3>
                    <div style="overflow-x:auto; margin-bottom:20px;">
                        <table style="width:100%%; font-size:13px; border-collapse:collapse; border-radius:8px; overflow:hidden; border:1px solid #e5e7eb;">
                            <thead>
                                <tr style="background-color:#f9fafb; color:#4b5563;">
                                    <th style="padding:10px 14px; text-align:left; font-weight:600;">Sản phẩm</th>
                                    <th style="padding:10px 14px; text-align:center; font-weight:600; width:60px;">SL</th>
                                    <th style="padding:10px 14px; text-align:right; font-weight:600; width:90px;">Đơn giá</th>
                                    <th style="padding:10px 14px; text-align:right; font-weight:600; width:100px;">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                %s
                            </tbody>
                        </table>
                    </div>

                    <!-- Pricing Calculation -->
                    <div style="margin-left:auto; max-width:280px; margin-bottom:28px; font-size:14px;">
                        <div style="display:flex; justify-content:space-between; padding:4px 0; color:#6b7280;">
                            <span>Phí vận chuyển:</span>
                            <span style="color:#111827;">%s</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:4px 0; color:#6b7280;">
                            <span>Giảm giá voucher:</span>
                            <span style="color:#10b981;">-%s</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:8px 0; border-top:1px solid #e5e7eb; margin-top:4px; font-size:16px; font-weight:700;">
                            <span style="color:#111827;">Tổng thanh toán:</span>
                            <span style="color:#ea580c;">%s</span>
                        </div>
                    </div>

                    <!-- Call To Action Button -->
                    <div style="text-align:center; padding:20px 0; border-top:1px solid #f3f4f6;">
                        <p style="margin:0 0 14px; font-size:14px; color:#4b5563;">
                            ⭐ <strong>Bạn có hài lòng với sản phẩm không?</strong><br>
                            Hãy dành ít phút chia sẻ đánh giá để nhận xu tích lũy và giúp đỡ các khách hàng khác nhé!
                        </p>
                        <a href="%s" style="display:inline-block; background-color:#ea580c; color:#ffffff; font-weight:700; font-size:15px; padding:13px 32px; border-radius:9999px; text-decoration:none; box-shadow:0 4px 12px rgba(234,88,12,0.25);">
                            Đánh giá sản phẩm ngay
                        </a>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color:#f9fafb; padding:20px 24px; text-align:center; border-top:1px solid #e5e7eb; font-size:12px; color:#9ca3af; line-height:1.6;">
                    <p style="margin:0 0 4px;">WebChicKen E-Commerce Platform — Hệ thống Thương mại Điện tử</p>
                    <p style="margin:0 0 4px;">Nếu cần hỗ trợ gấp về đơn hàng, vui lòng truy cập trung tâm trợ giúp trên ứng dụng.</p>
                    <p style="margin:0;">Đây là email tự động, vui lòng không trả lời trực tiếp email này.</p>
                </div>
            </div>
        </body>
        </html>
        """.formatted(
                escapeHtml(orderCode),
                escapeHtml(safeCustomerName),
                escapeHtml(orderCode),
                escapeHtml(orderDate),
                escapeHtml(recipientName),
                escapeHtml(recipientPhone),
                escapeHtml(shippingAddress),
                escapeHtml(paymentMethod),
                itemsTableRows.toString(),
                formatMoney(shippingFee),
                formatMoney(discount),
                formatMoney(totalAmount),
                escapeHtml(orderDetailLink)
        );
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    @Override
    public void shutdown() {
        log.info("Shutting down HttpEmailServiceImpl executor...");
        try {
            executor.shutdown();
            if (!executor.awaitTermination(3, TimeUnit.SECONDS)) {
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}
