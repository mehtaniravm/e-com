package com.ecom.orderservice.entity;

public enum OrderStatus {
    PENDING,
    CONFIRMED,
    SHIPPED,
    CANCELLED;

    public boolean canTransitionTo(OrderStatus next) {
        return switch (this) {
            case PENDING   -> next == CONFIRMED || next == CANCELLED;
            case CONFIRMED -> next == SHIPPED   || next == CANCELLED;
            case SHIPPED, CANCELLED -> false;
        };
    }
}
