package com.caresync.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "queue_tokens", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"queue_id", "token_date", "token_number"})
})
public class QueueToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "token_id")
    private Long tokenId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "queue_id", referencedColumnName = "queue_id")
    @NotNull(message = "Queue is required")
    private Queue queue;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", referencedColumnName = "user_id")
    @JsonIgnoreProperties({"password", "role", "isActive", "createdAt"})
    @NotNull(message = "Patient is required")
    private User patient;

    @Column(name = "token_number")
    @NotNull(message = "Token number is required")
    private Integer tokenNumber;

    @Column(name = "token_date")
    @NotNull(message = "Token date is required")
    private LocalDate tokenDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "token_status")
    private TokenStatus tokenStatus = TokenStatus.WAITING;

    @Column(name = "estimated_time")
    private LocalDateTime estimatedTime;

    @Column(name = "called_at")
    private LocalDateTime calledAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    // Payment for queue token (mandatory small amount)
    @Column(name = "token_fee", precision = 8, scale = 2)
    private BigDecimal tokenFee;

    @Column(name = "payment_transaction_id")
    private String paymentTransactionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status")
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Constructors
    public QueueToken() {}

    public QueueToken(Queue queue, User patient, Integer tokenNumber, LocalDate tokenDate, BigDecimal tokenFee) {
        this.queue = queue;
        this.patient = patient;
        this.tokenNumber = tokenNumber;
        this.tokenDate = tokenDate;
        this.tokenFee = tokenFee;
    }

    // Getters and Setters
    public Long getTokenId() { return tokenId; }
    public void setTokenId(Long tokenId) { this.tokenId = tokenId; }

    public Queue getQueue() { return queue; }
    public void setQueue(Queue queue) { this.queue = queue; }

    public User getPatient() { return patient; }
    public void setPatient(User patient) { this.patient = patient; }

    public Integer getTokenNumber() { return tokenNumber; }
    public void setTokenNumber(Integer tokenNumber) { this.tokenNumber = tokenNumber; }

    public LocalDate getTokenDate() { return tokenDate; }
    public void setTokenDate(LocalDate tokenDate) { this.tokenDate = tokenDate; }

    public TokenStatus getTokenStatus() { return tokenStatus; }
    public void setTokenStatus(TokenStatus tokenStatus) { this.tokenStatus = tokenStatus; }

    public LocalDateTime getEstimatedTime() { return estimatedTime; }
    public void setEstimatedTime(LocalDateTime estimatedTime) { this.estimatedTime = estimatedTime; }

    public LocalDateTime getCalledAt() { return calledAt; }
    public void setCalledAt(LocalDateTime calledAt) { this.calledAt = calledAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public BigDecimal getTokenFee() { return tokenFee; }
    public void setTokenFee(BigDecimal tokenFee) { this.tokenFee = tokenFee; }

    public String getPaymentTransactionId() { return paymentTransactionId; }
    public void setPaymentTransactionId(String paymentTransactionId) { this.paymentTransactionId = paymentTransactionId; }

    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public enum TokenStatus {
        WAITING,        // Patient is waiting in queue
        IN_PROGRESS,    // Patient is currently being served
        COMPLETED,      // Patient service completed
        CANCELLED,      // Token cancelled by patient
        NO_SHOW         // Patient didn't show up when called
    }

    public enum PaymentStatus {
        PENDING,        // Payment not made yet
        COMPLETED,      // Payment successful
        FAILED,         // Payment failed
        REFUNDED        // Payment refunded
    }
}