package com.example.webchicken.common.exception;

/**
 * Thrown when an order state transition is disallowed by the Order State Machine (HTTP 409 Conflict).
 */
public class IllegalOrderStateTransitionException extends ConflictException {

    public IllegalOrderStateTransitionException(String message) {
        super("ILLEGAL_STATE_TRANSITION", message);
    }
}
