package com.example.webchicken.common.exception;
import java.util.List;
public class ValidationException extends AppException {
    private final List<String> errors;
    public ValidationException(String singleError) {
        super("VALIDATION_FAILED", 422, singleError);
        this.errors = List.of(singleError);
    }

    public ValidationException(List<String> errors) {
        super("VALIDATION_FAILED", 422, "Validation failed");
        this.errors = errors;
    }
    public List<String> getErrors() { return errors; }
}
