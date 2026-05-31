package com.ecom.orderservice.exception;

import com.ecom.orderservice.entity.OrderStatus;

public class InvalidStatusTransitionException extends RuntimeException {
    public InvalidStatusTransitionException(OrderStatus from, OrderStatus to) {
        super("Cannot transition order from " + from + " to " + to);
    }
}
