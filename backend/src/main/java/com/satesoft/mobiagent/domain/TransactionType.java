package com.satesoft.mobiagent.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum TransactionType {
    FLOAT_TOP_UP,
    FLOAT_WITHDRAWAL,
    DEPOSIT,
    FLOAT_TRANSFER;

    @JsonCreator
    public static TransactionType fromWireValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return switch (value.trim().toUpperCase()) {
            case "WITHDRAW", "WITHDRAWAL" -> FLOAT_WITHDRAWAL;
            default -> valueOf(value.trim().toUpperCase());
        };
    }

    @JsonValue
    public String toWireValue() {
        return this == FLOAT_WITHDRAWAL ? "WITHDRAW" : name();
    }
}
