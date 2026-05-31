package com.ecom.orderservice.dto;

import com.ecom.orderservice.entity.OrderItem;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderItemResponse(
    UUID id,
    UUID productId,
    String productName,
    int quantity,
    BigDecimal unitPrice,
    BigDecimal subtotal
) {
    public static OrderItemResponse from(OrderItem item) {
        return new OrderItemResponse(
            item.getId(),
            item.getProductId(),
            item.getProductName(),
            item.getQuantity(),
            item.getUnitPrice(),
            item.getSubtotal()
        );
    }
}
