package com.example.webchicken.common.model;

import java.util.List;

public record PageResult<T>(List<T> items, long total, int page, int size) {
    public int totalPages() { return size == 0 ? 0 : (int) Math.ceil((double) total / size); }
}
