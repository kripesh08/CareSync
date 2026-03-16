package com.caresync.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "queue_closures")
public class QueueClosure {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "closure_id")
    private Long closureId;

    @ManyToOne
    @JoinColumn(name = "queue_id", referencedColumnName = "queue_id")
    @NotNull(message = "Queue is required")
    private Queue queue;

    @NotNull(message = "Closure date is required")
    @Column(name = "closure_date")
    private LocalDate closureDate;

    @Column(name = "reason")
    private String reason;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Constructors
    public QueueClosure() {}

    public QueueClosure(Queue queue, LocalDate closureDate, String reason) {
        this.queue = queue;
        this.closureDate = closureDate;
        this.reason = reason;
    }

    // Getters and Setters
    public Long getClosureId() { return closureId; }
    public void setClosureId(Long closureId) { this.closureId = closureId; }

    public Queue getQueue() { return queue; }
    public void setQueue(Queue queue) { this.queue = queue; }

    public LocalDate getClosureDate() { return closureDate; }
    public void setClosureDate(LocalDate closureDate) { this.closureDate = closureDate; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
