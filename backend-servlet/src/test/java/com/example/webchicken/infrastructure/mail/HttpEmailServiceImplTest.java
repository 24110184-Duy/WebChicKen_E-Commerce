package com.example.webchicken.infrastructure.mail;

import com.example.webchicken.common.enums.OrderStatus;
import com.example.webchicken.common.enums.PaymentStatus;
import com.example.webchicken.modules.order.model.entity.OrderEntity;
import com.example.webchicken.modules.order.model.entity.OrderItemEntity;
import com.example.webchicken.modules.order.model.enums.PaymentMethod;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

import static org.junit.jupiter.api.Assertions.*;

public class HttpEmailServiceImplTest {

    private HttpEmailServiceImpl emailService;

    @BeforeEach
    void setUp() {
        emailService = new HttpEmailServiceImpl();
    }

    @AfterEach
    void tearDown() {
        if (emailService != null) {
            emailService.shutdown();
        }
    }

    @Test
    @DisplayName("Gửi email khi email người nhận rỗng hoặc null -> Bỏ qua thành công, không ném ngoại lệ")
    void testSendEmail_RecipientEmpty_ReturnsCompletedFuture() throws ExecutionException, InterruptedException {
        OrderEntity order = new OrderEntity();
        order.setOrderCode("ORD-TEST-001");

        CompletableFuture<Void> futureNull = emailService.sendOrderDeliveredConfirmationAsync(
                null, "Nguyen Van A", order, Collections.emptyList()
        );
        assertNotNull(futureNull);
        futureNull.get(); // Should complete without exception

        CompletableFuture<Void> futureBlank = emailService.sendOrderDeliveredConfirmationAsync(
                "   ", "Nguyen Van A", order, Collections.emptyList()
        );
        assertNotNull(futureBlank);
        futureBlank.get(); // Should complete without exception
    }

    @Test
    @DisplayName("Gửi email khi chưa cấu hình API key -> Cơ chế mô phỏng an toàn (Render fail-safe) hoàn tất mà không ném lỗi")
    void testSendEmail_WithoutApiKey_SimulatesSafely() throws ExecutionException, InterruptedException {
        OrderEntity order = new OrderEntity();
        order.setId("ord-uuid-123");
        order.setOrderCode("ORD-20261012-8888");
        order.setOrderDate(LocalDateTime.now());
        order.setRecipientName("Tran Van B");
        order.setRecipientPhone("0987654321");
        order.setShippingAddress("123 Duong Le Loi, Quan 1, TP.HCM");
        order.setPaymentMethod(PaymentMethod.COD);
        order.setPaymentStatus(PaymentStatus.PAID);
        order.setStatus(OrderStatus.DELIVERED);
        order.setTotalAmountMinor(350_000);
        order.setShippingFeeMinor(30_000);
        order.setDiscountAmountMinor(10_000);

        OrderItemEntity item1 = new OrderItemEntity(
                "item-1", order.getId(), "prod-1", "var-1",
                "Áo Thun Nam Cotton Co Giãn", "Màu Đen - Size L", "http://example.com/img.jpg",
                2, 150_000
        );

        OrderItemEntity item2 = new OrderItemEntity(
                "item-2", order.getId(), "prod-2", null,
                "Tất Vớ Cổ Ngắn Thể Thao", null, null,
                1, 50_000
        );

        List<OrderItemEntity> items = List.of(item1, item2);

        CompletableFuture<Void> future = emailService.sendOrderDeliveredConfirmationAsync(
                "customer.test@gmail.com", "Tran Van B", order, items
        );

        assertNotNull(future);
        future.get(); // Completes successfully under simulation
        assertTrue(future.isDone());
    }
}
