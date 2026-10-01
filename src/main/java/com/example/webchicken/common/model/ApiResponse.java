package com.example.webchicken.common.model;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Wrapper JSON chuẩn: { "success": true, "data": {...} } hoặc { "success": false, "error": {...} } */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(boolean success, T data, ApiError error) {
    public static <T> ApiResponse<T> ok(T data)          { return new ApiResponse<>(true, data, null); }
    public static <T> ApiResponse<T> fail(ApiError error) { return new ApiResponse<>(false, null, error); }
}
