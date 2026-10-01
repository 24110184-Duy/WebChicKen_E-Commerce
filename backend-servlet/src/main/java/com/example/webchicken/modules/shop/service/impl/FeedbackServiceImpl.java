package com.example.webchicken.modules.shop.service.impl;

import com.example.webchicken.modules.shop.dao.FeedbackDAO;
import com.example.webchicken.modules.shop.service.FeedbackService;
import java.util.Objects;

public class FeedbackServiceImpl implements FeedbackService {

    private final FeedbackDAO feedbackDAO;

    public FeedbackServiceImpl(FeedbackDAO feedbackDAO) {
        this.feedbackDAO = Objects.requireNonNull(feedbackDAO, "feedbackDAO must not be null");
    }

    // TODO: implement methods
}
