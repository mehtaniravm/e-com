package com.ecom.orderservice.dto;

import com.ecom.orderservice.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(@NotNull OrderStatus status) {}
