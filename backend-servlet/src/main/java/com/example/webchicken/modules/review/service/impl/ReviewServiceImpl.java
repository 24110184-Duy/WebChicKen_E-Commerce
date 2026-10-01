package com.example.webchicken.modules.review.service.impl;

import com.example.webchicken.modules.review.dao.ReviewDAO;
import com.example.webchicken.modules.review.service.ReviewService;
import java.util.Objects;

public class ReviewServiceImpl implements ReviewService {

    private final ReviewDAO reviewDAO;

    public ReviewServiceImpl(ReviewDAO reviewDAO) {
        this.reviewDAO = Objects.requireNonNull(reviewDAO, "reviewDAO must not be null");
    }

    // TODO: implement methods
}
