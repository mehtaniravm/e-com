package com.ecom.orderservice.service;

import com.ecom.orderservice.dto.CreateOrderRequest;
import com.ecom.orderservice.dto.OrderItemRequest;
import com.ecom.orderservice.dto.OrderResponse;
import com.ecom.orderservice.dto.UpdateStatusRequest;
import com.ecom.orderservice.entity.Order;
import com.ecom.orderservice.entity.OrderStatus;
import com.ecom.orderservice.exception.InvalidStatusTransitionException;
import com.ecom.orderservice.exception.OrderNotFoundException;
import com.ecom.orderservice.repository.OrderRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private OrderService orderService;

    private static final UUID ORDER_ID = UUID.randomUUID();
    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID PRODUCT_ID = UUID.randomUUID();

    private Order buildOrder(OrderStatus status) {
        Order order = new Order(USER_ID, new BigDecimal("29.98"));
        ReflectionTestUtils.setField(order, "id", ORDER_ID);
        order.setStatus(status);
        return order;
    }

    private OrderItemRequest itemRequest(String name, int qty, String price) {
        return new OrderItemRequest(PRODUCT_ID, name, qty, new BigDecimal(price));
    }

    @Test
    void testCreateOrder_success() {
        CreateOrderRequest request = new CreateOrderRequest(
                USER_ID, List.of(itemRequest("Widget", 2, "14.99")));

        Order saved = buildOrder(OrderStatus.PENDING);
        when(orderRepository.save(any(Order.class))).thenReturn(saved);

        OrderResponse response = orderService.createOrder(request);

        assertThat(response.userId()).isEqualTo(USER_ID);
        assertThat(response.status()).isEqualTo(OrderStatus.PENDING);
        verify(orderRepository).save(any(Order.class));
    }

    @Test
    void testCreateOrder_calculatesTotal() {
        // 2 × 14.99 + 1 × 5.00 = 34.98
        CreateOrderRequest request = new CreateOrderRequest(USER_ID, List.of(
                itemRequest("Widget", 2, "14.99"),
                itemRequest("Gadget", 1, "5.00")));

        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse response = orderService.createOrder(request);

        assertThat(response.totalAmount()).isEqualByComparingTo("34.98");
    }

    @Test
    void testGetOrder_found() {
        Order order = buildOrder(OrderStatus.PENDING);
        when(orderRepository.findByIdWithItems(ORDER_ID)).thenReturn(Optional.of(order));

        OrderResponse response = orderService.getOrder(ORDER_ID);

        assertThat(response.id()).isEqualTo(ORDER_ID);
        assertThat(response.status()).isEqualTo(OrderStatus.PENDING);
        verify(orderRepository).findByIdWithItems(ORDER_ID);
    }

    @Test
    void testGetOrder_notFound() {
        UUID unknownId = UUID.randomUUID();
        when(orderRepository.findByIdWithItems(unknownId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.getOrder(unknownId))
                .isInstanceOf(OrderNotFoundException.class)
                .hasMessageContaining(unknownId.toString());
    }

    @Test
    void testGetOrdersByUser_returnsList() {
        Order o1 = buildOrder(OrderStatus.PENDING);
        Order o2 = buildOrder(OrderStatus.CONFIRMED);
        when(orderRepository.findByUserIdOrderByCreatedAtDesc(USER_ID)).thenReturn(List.of(o1, o2));

        List<OrderResponse> result = orderService.getOrdersByUser(USER_ID);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).status()).isEqualTo(OrderStatus.PENDING);
        assertThat(result.get(1).status()).isEqualTo(OrderStatus.CONFIRMED);
        verify(orderRepository).findByUserIdOrderByCreatedAtDesc(USER_ID);
    }

    @Test
    void testUpdateStatus_validTransition_pendingToConfirmed() {
        Order order = buildOrder(OrderStatus.PENDING);
        when(orderRepository.findByIdWithItems(ORDER_ID)).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse response = orderService.updateStatus(
                ORDER_ID, new UpdateStatusRequest(OrderStatus.CONFIRMED));

        assertThat(response.status()).isEqualTo(OrderStatus.CONFIRMED);
        verify(orderRepository).save(order);
    }

    @Test
    void testUpdateStatus_invalidTransition_throws() {
        Order order = buildOrder(OrderStatus.SHIPPED);
        when(orderRepository.findByIdWithItems(ORDER_ID)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.updateStatus(
                ORDER_ID, new UpdateStatusRequest(OrderStatus.PENDING)))
                .isInstanceOf(InvalidStatusTransitionException.class)
                .hasMessageContaining("SHIPPED")
                .hasMessageContaining("PENDING");

        verify(orderRepository, never()).save(any());
    }

    @Test
    void testCancelOrder_fromPending_success() {
        Order order = buildOrder(OrderStatus.PENDING);
        when(orderRepository.findByIdWithItems(ORDER_ID)).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenAnswer(inv -> inv.getArgument(0));

        orderService.cancelOrder(ORDER_ID);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        verify(orderRepository).save(order);
    }

    @Test
    void testCancelOrder_fromShipped_throws() {
        Order order = buildOrder(OrderStatus.SHIPPED);
        when(orderRepository.findByIdWithItems(ORDER_ID)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.cancelOrder(ORDER_ID))
                .isInstanceOf(InvalidStatusTransitionException.class)
                .hasMessageContaining("SHIPPED")
                .hasMessageContaining("CANCELLED");

        verify(orderRepository, never()).save(any());
    }
}
