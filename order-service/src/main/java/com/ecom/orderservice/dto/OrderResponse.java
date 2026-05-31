package com.ecom.orderservice.dto;

import com.ecom.orderservice.entity.Order;
import com.ecom.orderservice.entity.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
    UUID id,
    UUID userId,
    OrderStatus status,
    BigDecimal totalAmount,
    List<OrderItemResponse> items,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static OrderResponse from(Order order) {
        return new OrderResponse(
            order.getId(),
            order.getUserId(),
            order.getStatus(),
            order.getTotalAmount(),
            order.getItems().stream().map(OrderItemResponse::from).toList(),
            order.getCreatedAt(),
            order.getUpdatedAt()
        );
    }
}
