package com.ecom.orderservice.service;

import com.ecom.orderservice.dto.*;
import com.ecom.orderservice.entity.Order;
import com.ecom.orderservice.entity.OrderItem;
import com.ecom.orderservice.entity.OrderStatus;
import com.ecom.orderservice.exception.InvalidStatusTransitionException;
import com.ecom.orderservice.exception.OrderNotFoundException;
import com.ecom.orderservice.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public OrderResponse createOrder(CreateOrderRequest request) {
        BigDecimal total = request.items().stream()
                .map(i -> i.unitPrice().multiply(BigDecimal.valueOf(i.quantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Order order = new Order(request.userId(), total);

        request.items().stream()
                .map(i -> new OrderItem(i.productId(), i.productName(), i.quantity(), i.unitPrice()))
                .forEach(order::addItem);

        return OrderResponse.from(orderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(UUID id) {
        return OrderResponse.from(findWithItemsOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByUser(UUID userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(OrderResponse::from)
                .toList();
    }

    public OrderResponse updateStatus(UUID id, UpdateStatusRequest request) {
        Order order = findWithItemsOrThrow(id);
        OrderStatus next = request.status();

        if (!order.getStatus().canTransitionTo(next)) {
            throw new InvalidStatusTransitionException(order.getStatus(), next);
        }

        order.setStatus(next);
        return OrderResponse.from(orderRepository.save(order));
    }

    public void cancelOrder(UUID id) {
        Order order = findWithItemsOrThrow(id);

        if (!order.getStatus().canTransitionTo(OrderStatus.CANCELLED)) {
            throw new InvalidStatusTransitionException(order.getStatus(), OrderStatus.CANCELLED);
        }

        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
    }

    private Order findWithItemsOrThrow(UUID id) {
        return orderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new OrderNotFoundException(id));
    }
}
