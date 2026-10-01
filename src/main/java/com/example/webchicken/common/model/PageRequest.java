package com.example.webchicken.common.model;

/** Tham số phân trang. Tối đa size=100 (CODE_PRINCIPLES PERF-01). */
public record PageRequest(int page, int size) {
    public static final int MAX_SIZE = 100;
    public PageRequest {
        if (page < 0)       page = 0;
        if (size < 1)       size = 20;
        if (size > MAX_SIZE) size = MAX_SIZE;
    }
    public int offset() { return page * size; }
}
