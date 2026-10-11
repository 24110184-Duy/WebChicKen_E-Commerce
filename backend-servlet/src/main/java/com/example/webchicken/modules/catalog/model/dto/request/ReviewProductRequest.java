package com.example.webchicken.modules.catalog.model.dto.request;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO yêu cầu Quản trị viên duyệt hoặc từ chối sản phẩm.
 * status: ACTIVE (duyệt), INACTIVE / PENDING_APPROVAL (từ chối).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ReviewProductRequest(
        String status,
        String rejectionReason,
        String moderationNote
) {
    @JsonCreator
    public ReviewProductRequest(
            @JsonProperty("status") String status,
            @JsonProperty("rejectionReason") String rejectionReason,
            @JsonProperty("moderationNote") String moderationNote
    ) {
        this.status = status;
        this.rejectionReason = rejectionReason;
        this.moderationNote = moderationNote;
    }

    public ReviewProductRequest(String status, String rejectionReason) {
        this(status, rejectionReason, null);
    }
}
