package com.caresync.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_id")
    private Long paymentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "user_id")
    @NotNull(message = "User is required")
    private User user;

    @NotBlank(message = "Transaction ID is required")
    @Size(max = 100, message = "Transaction ID cannot exceed 100 characters")
    @Column(name = "transaction_id", unique = true)
    private String transactionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_type", nullable = false)
    @NotNull(message = "Payment type is required")
    private PaymentType paymentType;

    @Column(name = "reference_id")
    private Long referenceId; // bed_booking_id or queue_token_id

    @Column(name = "amount", precision = 10, scale = 2, nullable = false)
    @NotNull(message = "Amount is required")
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Size(max = 200, message = "Payment gateway response cannot exceed 200 characters")
    @Column(name = "gateway_response")
    private String gatewayResponse;

    @Size(max = 500, message = "Failure reason cannot exceed 500 characters")
    @Column(name = "failure_reason")
    private String failureReason;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "failed_at")
    private LocalDateTime failedAt;

    // Constructors
    public Payment() {}

    public Payment(User user, String transactionId, PaymentType paymentType, Long referenceId, 
                  BigDecimal amount, PaymentMethod paymentMethod) {
        this.user = user;
        this.transactionId = transactionId;
        this.paymentType = paymentType;
        this.referenceId = referenceId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
    }

    // Getters and Setters
    public Long getPaymentId() { return paymentId; }
    public void setPaymentId(Long paymentId) { this.paymentId = paymentId; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public PaymentType getPaymentType() { return paymentType; }
    public void setPaymentType(PaymentType paymentType) { this.paymentType = paymentType; }

    public Long getReferenceId() { return referenceId; }
    public void setReferenceId(Long referenceId) { this.referenceId = referenceId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getGatewayResponse() { return gatewayResponse; }
    public void setGatewayResponse(String gatewayResponse) { this.gatewayResponse = gatewayResponse; }

    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public LocalDateTime getFailedAt() { return failedAt; }
    public void setFailedAt(LocalDateTime failedAt) { this.failedAt = failedAt; }

    public enum PaymentType {
        QUEUE_TOKEN,        // Payment for queue token (mandatory small amount)
        MEDICINE_ORDER      // Payment for medicine order
    }

    public enum PaymentMethod {
        RAZORPAY,           // Razorpay integration
        UPI,                // UPI payment
        CREDIT_CARD,        // Credit card payment
        DEBIT_CARD,         // Debit card payment
        NET_BANKING,        // Net banking
        WALLET              // Digital wallet
    }

    public enum PaymentStatus {
        PENDING,            // Payment initiated but not completed
        PROCESSING,         // Payment is being processed
        COMPLETED,          // Payment successful
        FAILED,             // Payment failed
        CANCELLED,          // Payment cancelled by user
        REFUNDED,           // Payment refunded
        EXPIRED             // Payment link expired
    }
}