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
                .followRedirects(HttpClient.Redirect.ALWAYS)
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
        String googleScriptUrl = EnvConfig.get("GOOGLE_SCRIPT_URL", null);
        String resendApiKey = EnvConfig.get("RESEND_API_KEY", null);
        String brevoApiKey = EnvConfig.get("BREVO_API_KEY", null);
        String emailFrom = EnvConfig.get("EMAIL_FROM", "WebChicKen <onboarding@resend.dev>");
        String frontendUrl = EnvConfig.get("FRONTEND_URL", "http://localhost:5173");

        String orderCode = order != null ? order.getOrderCode() : "N/A";
        String subject = String.format("[WebChicKen] Đơn hàng #%s của bạn đã được giao thành công! 🎉", orderCode);
        String htmlContent = buildDeliveredEmailHtml(customerName, order, items, frontendUrl);

        // 1. Kiểm tra nếu có cấu hình GOOGLE_SCRIPT_URL (Ưu tiên số 1 - Gửi tự do tới mọi Gmail qua Google Apps Script)
        if (googleScriptUrl != null && !googleScriptUrl.isBlank()) {
            sendViaGoogleScript(googleScriptUrl, recipientEmail, subject, htmlContent, orderCode);
            return;
        }

        // 2. Kiểm tra nếu có cấu hình RESEND_API_KEY (Ưu tiên số 2 - Khuyên dùng trên Render qua HTTPS Port 443)
        if (resendApiKey != null && !resendApiKey.isBlank()) {
            sendViaResend(resendApiKey, emailFrom, recipientEmail, subject, htmlContent, orderCode);
            return;
        }

        // 3. Kiểm tra nếu có cấu hình BREVO_API_KEY (Ưu tiên số 3 qua HTTPS Port 443)
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

    private void sendViaGoogleScript(String scriptUrl, String to, String subject, String html, String orderCode) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("to", to);
            payload.put("subject", subject);
            payload.put("html", html);
            payload.put("senderName", "WebChicKen");

            String requestBody = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(scriptUrl.trim()))
                    .timeout(Duration.ofSeconds(15))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 400) {
                log.info("Successfully sent delivery confirmation email for order [{}] to [{}] via Google Apps Script. Response: {}",
                        orderCode, to, response.body());
            } else {
                log.error("Failed to send email via Google Apps Script for order [{}]. Status: {}, Body: {}",
                        orderCode, response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.error("Exception when sending email via Google Apps Script for order [{}]: {}", orderCode, e.getMessage(), e);
        }
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

        String mascotLogoUrl = "https://res.cloudinary.com/ofhjrpq7/image/upload/v1791876836/webchicken-mascot.png";

        StringBuilder itemsTableRows = new StringBuilder();
        if (items != null && !items.isEmpty()) {
            for (OrderItemEntity item : items) {
                String pName = item.getProductName() != null ? item.getProductName() : "Sản phẩm";
                String vName = item.getVariantName() != null && !item.getVariantName().isBlank()
                        ? ("<span style='color:#6b7280; font-size:12px; display:block; margin-top:2px;'>Phân loại: " + escapeHtml(item.getVariantName()) + "</span>")
                        : "";
                String imgHtml = (item.getImageUrl() != null && !item.getImageUrl().isBlank())
                        ? ("<img src='" + escapeHtml(item.getImageUrl()) + "' alt='Product' style='width:52px; height:52px; object-fit:cover; border-radius:8px; border:1px solid #fef08a; display:block; margin-right:12px;' />")
                        : ("<div style='width:52px; height:52px; background-color:#f3f4f6; border-radius:8px; border:1px solid #fef08a; display:flex; align-items:center; justify-content:center; margin-right:12px; font-size:20px;'>📦</div>");

                long unitPrice = item.getUnitPriceAtPurchaseMinor();
                int qty = item.getQuantity();
                long subtotal = unitPrice * qty;

                itemsTableRows.append("<tr>")
                        .append("<td style='padding:12px 14px; border-bottom:1px solid #f3f4f6;'>")
                        .append("<table style='border-collapse:collapse; width:100%%;'><tr>")
                        .append("<td style='width:56px; vertical-align:top; padding:0;'>").append(imgHtml).append("</td>")
                        .append("<td style='vertical-align:top; padding:0;'>")
                        .append("<strong style='color:#111827; font-size:13px; line-height:1.4; display:block;'>").append(escapeHtml(pName)).append("</strong>")
                        .append(vName)
                        .append("</td>")
                        .append("</tr></table>")
                        .append("</td>")
                        .append("<td style='padding:12px 14px; border-bottom:1px solid #f3f4f6; text-align:center; color:#4b5563; font-weight:600;'>")
                        .append(qty)
                        .append("</td>")
                        .append("<td style='padding:12px 14px; border-bottom:1px solid #f3f4f6; text-align:right; color:#4b5563;'>")
                        .append(formatMoney(unitPrice))
                        .append("</td>")
                        .append("<td style='padding:12px 14px; border-bottom:1px solid #f3f4f6; text-align:right; font-weight:700; color:#ca8a04;'>")
                        .append(formatMoney(subtotal))
                        .append("</td>")
                        .append("</tr>");
            }
        } else {
            itemsTableRows.append("<tr><td colspan='4' style='padding:16px; text-align:center; color:#9ca3af;'>Chi tiết sản phẩm đang được cập nhật</td></tr>");
        }

        String orderDetailLink = frontendUrl != null
                ? (frontendUrl.replaceAll("/+$", "") + "/account/orders/" + (order != null ? order.getId() : ""))
                : "http://localhost:5173";

        return """
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Đơn hàng #%s đã được giao thành công</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f4f5f7; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#374151; -webkit-font-smoothing:antialiased;">
            <div style="max-width:620px; margin:28px auto; background-color:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 8px 30px rgba(202,138,4,0.15); border:1px solid #fef08a;">
                
                <!-- Header Banner với Linh Vật WebChicKen -->
                <div style="background:linear-gradient(135deg, #ca8a04 0%%, #eab308 50%%, #facc15 100%%); padding:36px 24px; text-align:center; color:#ffffff;">
                    <div style="display:inline-block; background-color:#ffffff; padding:10px; border-radius:50%%; box-shadow:0 8px 24px rgba(0,0,0,0.18); margin-bottom:12px;">
                        <img src="%s" 
                             alt="WebChicKen Mascot" 
                             style="width:88px; height:88px; object-fit:contain; display:block; border-radius:50%%;" />
                    </div>
                    <h1 style="margin:0 0 6px; font-size:25px; font-weight:800; letter-spacing:-0.5px; text-shadow:0 1px 3px rgba(0,0,0,0.12);">
                        WebChicKen Marketplace
                    </h1>
                    <p style="margin:0; font-size:14px; opacity:0.95; font-weight:500;">
                        🎉 Xác nhận giao hàng thành công &amp; Cảm ơn bạn đã mua sắm!
                    </p>
                </div>

                <!-- Main Content Body -->
                <div style="padding:28px 24px;">
                    
                    <!-- Lời Cảm Ơn Mua Sắm & Thông Báo Giao Hàng -->
                    <div style="background:#fefce8; border:1px solid #fef08a; border-left:4px solid #eab308; border-radius:10px; padding:18px 20px; margin-bottom:24px;">
                        <h2 style="margin:0 0 8px; font-size:17px; font-weight:700; color:#854d0e;">
                            Xin chào %s, cảm ơn bạn đã lựa chọn WebChicKen! 🧡
                        </h2>
                        <p style="margin:0; font-size:14px; line-height:1.6; color:#713f12;">
                            Đơn hàng <strong>#%s</strong> của bạn đã được nhân viên vận chuyển giao thành công đến địa chỉ nhận hàng. Chúng tôi vô cùng trân trọng sự tin tưởng và đồng hành của bạn cùng cửa hàng!
                        </p>
                    </div>

                    <!-- Badge Trạng Thái Thành Công -->
                    <div style="background-color:#ecfdf5; border:1px solid #a7f3d0; border-radius:12px; padding:14px 18px; text-align:center; margin-bottom:24px;">
                        <span style="font-size:18px; margin-right:6px;">📦 ✅</span>
                        <span style="color:#065f46; font-size:14px; font-weight:700;">GIAO HÀNG THÀNH CÔNG • ĐÃ HOÀN TẤT</span>
                    </div>

                    <!-- Card Thông Tin Đơn Hàng -->
                    <div style="background-color:#f9fafb; border-radius:12px; border:1px solid #f3f4f6; padding:18px; margin-bottom:24px;">
                        <h3 style="margin:0 0 12px; font-size:14px; font-weight:700; color:#111827; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #e5e7eb; padding-bottom:8px;">
                            📋 Thông tin đơn hàng
                        </h3>
                        <table style="width:100%%; font-size:13px; border-collapse:collapse;">
                            <tr>
                                <td style="padding:4px 0; color:#6b7280; width:140px;">Mã đơn hàng:</td>
                                <td style="padding:4px 0; font-weight:700; color:#ca8a04;">#%s</td>
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

                    <!-- Bảng Chi Tiết Sản Phẩm -->
                    <h3 style="margin:0 0 12px; font-size:14px; font-weight:700; color:#111827; text-transform:uppercase; letter-spacing:0.5px;">
                        🛍️ Chi tiết sản phẩm đã giao
                    </h3>
                    <div style="overflow-x:auto; margin-bottom:20px;">
                        <table style="width:100%%; font-size:13px; border-collapse:collapse; border-radius:10px; overflow:hidden; border:1px solid #fef08a;">
                            <thead>
                                <tr style="background-color:#f9fafb; color:#4b5563;">
                                    <th style="padding:10px 14px; text-align:left; font-weight:600;">Sản phẩm</th>
                                    <th style="padding:10px 14px; text-align:center; font-weight:600; width:50px;">SL</th>
                                    <th style="padding:10px 14px; text-align:right; font-weight:600; width:95px;">Đơn giá</th>
                                    <th style="padding:10px 14px; text-align:right; font-weight:600; width:100px;">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                %s
                            </tbody>
                        </table>
                    </div>

                    <!-- Bảng Tính Tiền -->
                    <div style="margin-left:auto; max-width:280px; margin-bottom:28px; font-size:14px;">
                        <div style="display:flex; justify-content:space-between; padding:4px 0; color:#6b7280;">
                            <span>Phí vận chuyển:</span>
                            <span style="color:#111827;">%s</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:4px 0; color:#6b7280;">
                            <span>Giảm giá voucher:</span>
                            <span style="color:#10b981;">-%s</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:8px 0; border-top:1px solid #e5e7eb; margin-top:4px; font-size:16px; font-weight:800;">
                            <span style="color:#111827;">Tổng thanh toán:</span>
                            <span style="color:#ca8a04;">%s</span>
                        </div>
                    </div>

                </div>

                <!-- Footer Chân Trang -->
                <div style="background-color:#f9fafb; padding:20px 24px; text-align:center; border-top:1px solid #e5e7eb; font-size:12px; color:#9ca3af; line-height:1.6;">
                    <p style="margin:0 0 4px; font-weight:600; color:#6b7280;">WebChicKen E-Commerce Platform — Hệ thống Thương mại Điện tử</p>
                    <p style="margin:0 0 4px;">Nếu cần hỗ trợ gấp về đơn hàng, vui lòng truy cập trung tâm trợ giúp trên ứng dụng.</p>
                    <p style="margin:0;">Đây là email tự động, vui lòng không trả lời trực tiếp email này.</p>
                </div>
            </div>
        </body>
        </html>
        """.formatted(
                escapeHtml(orderCode),
                mascotLogoUrl,
                escapeHtml(safeCustomerName),
                escapeHtml(orderCode),
                escapeHtml(orderCode),
                escapeHtml(orderDate),
                escapeHtml(recipientName),
                escapeHtml(recipientPhone),
                escapeHtml(shippingAddress),
                escapeHtml(paymentMethod),
                itemsTableRows.toString(),
                formatMoney(shippingFee),
                formatMoney(discount),
                formatMoney(totalAmount)
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
