package com.example.webchicken.modules.inventory.model.dto.response;

import com.example.webchicken.modules.inventory.model.enums.ReservationStatus;
import java.time.LocalDateTime;

public record StockReservationResponse(
        String id,
        String skuId,
        int quantity,
        String orderId,
        ReservationStatus status,
        LocalDateTime expiresAt
) {}
