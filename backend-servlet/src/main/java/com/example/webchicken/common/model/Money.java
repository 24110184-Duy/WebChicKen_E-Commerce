package com.example.webchicken.common.model;

/**
 * Value Object đại diện cho tiền tệ.
 * amount là đơn vị nhỏ nhất (minor unit): 1 VND = 100 xu → amount=100.
 * KHÔNG dùng double/float cho tiền (CODE_PRINCIPLES SEC-03).
 */
public record Money(long amount, String currency) {
    public static Money vnd(long amount)  { return new Money(amount, "VND"); }
    public Money add(Money other) {
        if (!currency.equals(other.currency)) throw new IllegalArgumentException("Currency mismatch");
        return new Money(amount + other.amount, currency);
    }
    public Money subtract(Money other) {
        if (!currency.equals(other.currency)) throw new IllegalArgumentException("Currency mismatch");
        return new Money(amount - other.amount, currency);
    }
}
