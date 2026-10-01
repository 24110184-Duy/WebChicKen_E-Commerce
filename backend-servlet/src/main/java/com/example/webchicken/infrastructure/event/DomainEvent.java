package com.example.webchicken.infrastructure.event;

import java.time.Instant;

/**
 * Giao diện cơ sở cho toàn bộ Domain Event trong hệ thống.
 */
public interface DomainEvent {
    Instant occurredAt();
}
