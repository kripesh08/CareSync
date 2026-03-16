package com.caresync.service;

import com.caresync.entity.Medicine;
import com.caresync.entity.Order;
import com.caresync.entity.Payment;
import com.caresync.entity.User;
import com.caresync.repository.MedicineRepository;
import com.caresync.repository.OrderRepository;
import com.caresync.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Transactional
public class PaymentService {
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private MedicineRepository medicineRepository;
    
    /**
     * Process payment for a medicine booking
     * Payment is allowed ONLY if:
     * - booking_status = APPROVED
     * - payment_status = PENDING
     */
    public Order processPayment(Long orderId, Long userId, Payment.PaymentMethod paymentMethod, 
                               String transactionId) {
        
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        if (!order.getCustomer().getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access");
        }
        
        // Validate payment eligibility
        // Payment allowed if:
        // 1. Order is PENDING and prescription is verified (or not required)
        // 2. Payment status is PENDING
        if (order.getRequiresPrescription() && 
            order.getPrescriptionStatus() != Order.PrescriptionStatus.VERIFIED &&
            order.getPrescriptionStatus() != Order.PrescriptionStatus.NOT_REQUIRED) {
            throw new RuntimeException("Payment not allowed. Prescription must be verified first.");
        }
        
        if (order.getOrderStatus() != Order.OrderStatus.PENDING) {
            throw new RuntimeException("Payment not allowed. Order status: " + order.getOrderStatus());
        }
        
        if (order.getPaymentStatus() != Order.PaymentStatus.PENDING) {
            throw new RuntimeException("Payment already processed or failed");
        }
        
        Medicine medicine = order.getMedicine();
        
        // Check stock availability
        if (medicine.getStockQuantity() < order.getQuantity()) {
            throw new RuntimeException("Insufficient stock. Available: " + medicine.getStockQuantity());
        }
        
        try {
            // Simulate payment processing (in real scenario, integrate with payment gateway)
            // For now, we'll assume payment is successful
            
            // Update payment status
            order.setPaymentStatus(Order.PaymentStatus.SUCCESS);
            
            // Update order status to CONFIRMED
            order.setOrderStatus(Order.OrderStatus.CONFIRMED);
            order.setProcessedAt(LocalDateTime.now());
            
            // Deduct stock quantity
            medicine.setStockQuantity(medicine.getStockQuantity() - order.getQuantity());
            medicineRepository.save(medicine);
            
            // Save order
            orderRepository.save(order);
            
            return order;
            
        } catch (Exception e) {
            // Payment failed
            order.setPaymentStatus(Order.PaymentStatus.FAILED);
            orderRepository.save(order);
            throw new RuntimeException("Payment processing failed: " + e.getMessage());
        }
    }
    
    /**
     * Handle payment failure
     */
    public Order handlePaymentFailure(Long orderId, Long userId, String failureReason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        if (!order.getCustomer().getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access");
        }
        
        order.setPaymentStatus(Order.PaymentStatus.FAILED);
        order.setPharmacyNotes(failureReason);
        
        return orderRepository.save(order);
    }
    
    /**
     * Check if payment is allowed for an order
     */
    @Transactional(readOnly = true)
    public boolean isPaymentAllowed(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        // Payment allowed if order is PENDING and prescription is verified (or not required)
        boolean prescriptionOk = !order.getRequiresPrescription() || 
                                order.getPrescriptionStatus() == Order.PrescriptionStatus.VERIFIED ||
                                order.getPrescriptionStatus() == Order.PrescriptionStatus.NOT_REQUIRED;
        
        return order.getOrderStatus() == Order.OrderStatus.PENDING 
               && order.getPaymentStatus() == Order.PaymentStatus.PENDING
               && prescriptionOk;
    }
}
