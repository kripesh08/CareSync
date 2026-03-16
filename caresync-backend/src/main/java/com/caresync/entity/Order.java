package com.caresync.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Long orderId;

    @ManyToOne
    @JoinColumn(name = "customer_id", referencedColumnName = "user_id")
    @JsonIgnoreProperties({"password", "orders", "tokens", "bookings"})
    private User customer;

    @ManyToOne
    @JoinColumn(name = "pharmacy_id", referencedColumnName = "pharmacy_id")
    @JsonIgnoreProperties({"user", "orders", "medicines"})
    private Pharmacy pharmacy;

    @ManyToOne
    @JoinColumn(name = "medicine_id", referencedColumnName = "medicine_id")
    @JsonIgnoreProperties({"pharmacy", "orders"})
    private Medicine medicine;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    @NotNull(message = "Unit price is required")
    @Column(name = "unit_price", precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @NotNull(message = "Total amount is required")
    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_status")
    private OrderStatus orderStatus = OrderStatus.PENDING;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status")
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Size(max = 1000, message = "Customer notes cannot exceed 1000 characters")
    @Column(name = "customer_notes")
    private String customerNotes;

    @Size(max = 1000, message = "Pharmacy notes cannot exceed 1000 characters")
    @Column(name = "pharmacy_notes")
    private String pharmacyNotes;

    // Prescription-related fields
    @Column(name = "requires_prescription")
    private Boolean requiresPrescription = false;

    @Size(max = 500, message = "Prescription image path cannot exceed 500 characters")
    @Column(name = "prescription_image_path")
    private String prescriptionImagePath;

    @Enumerated(EnumType.STRING)
    @Column(name = "prescription_status")
    private PrescriptionStatus prescriptionStatus = PrescriptionStatus.NOT_REQUIRED;

    @Size(max = 1000, message = "Prescription verification notes cannot exceed 1000 characters")
    @Column(name = "prescription_verification_notes")
    private String prescriptionVerificationNotes;

    @Column(name = "prescription_verified_at")
    private LocalDateTime prescriptionVerifiedAt;

    @Column(name = "prescription_verified_by")
    private String prescriptionVerifiedBy;

    // Delivery information
    @Size(max = 500, message = "Delivery address cannot exceed 500 characters")
    @Column(name = "delivery_address")
    private String deliveryAddress;

    @Size(max = 15, message = "Delivery phone cannot exceed 15 characters")
    @Column(name = "delivery_phone")
    private String deliveryPhone;

    @Column(name = "estimated_delivery_time")
    private LocalDateTime estimatedDeliveryTime;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    // Constructors
    public Order() {}

    public Order(User customer, Pharmacy pharmacy, Medicine medicine, Integer quantity, 
                BigDecimal unitPrice, String customerNotes, String deliveryAddress, String deliveryPhone) {
        this.customer = customer;
        this.pharmacy = pharmacy;
        this.medicine = medicine;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.totalAmount = unitPrice.multiply(BigDecimal.valueOf(quantity));
        this.customerNotes = customerNotes;
        this.deliveryAddress = deliveryAddress;
        this.deliveryPhone = deliveryPhone;
        this.requiresPrescription = medicine.getRequiresPrescription();
        this.prescriptionStatus = medicine.getRequiresPrescription() ? 
            PrescriptionStatus.PENDING_UPLOAD : PrescriptionStatus.NOT_REQUIRED;
    }

    // Getters and Setters
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public User getCustomer() { return customer; }
    public void setCustomer(User customer) { this.customer = customer; }

    public Pharmacy getPharmacy() { return pharmacy; }
    public void setPharmacy(Pharmacy pharmacy) { this.pharmacy = pharmacy; }

    public Medicine getMedicine() { return medicine; }
    public void setMedicine(Medicine medicine) { this.medicine = medicine; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public OrderStatus getOrderStatus() { return orderStatus; }
    public void setOrderStatus(OrderStatus orderStatus) { this.orderStatus = orderStatus; }

    public String getCustomerNotes() { return customerNotes; }
    public void setCustomerNotes(String customerNotes) { this.customerNotes = customerNotes; }

    public String getPharmacyNotes() { return pharmacyNotes; }
    public void setPharmacyNotes(String pharmacyNotes) { this.pharmacyNotes = pharmacyNotes; }

    public Boolean getRequiresPrescription() { return requiresPrescription; }
    public void setRequiresPrescription(Boolean requiresPrescription) { this.requiresPrescription = requiresPrescription; }

    public String getPrescriptionImagePath() { return prescriptionImagePath; }
    public void setPrescriptionImagePath(String prescriptionImagePath) { this.prescriptionImagePath = prescriptionImagePath; }

    public PrescriptionStatus getPrescriptionStatus() { return prescriptionStatus; }
    public void setPrescriptionStatus(PrescriptionStatus prescriptionStatus) { this.prescriptionStatus = prescriptionStatus; }

    public String getPrescriptionVerificationNotes() { return prescriptionVerificationNotes; }
    public void setPrescriptionVerificationNotes(String prescriptionVerificationNotes) { this.prescriptionVerificationNotes = prescriptionVerificationNotes; }

    public LocalDateTime getPrescriptionVerifiedAt() { return prescriptionVerifiedAt; }
    public void setPrescriptionVerifiedAt(LocalDateTime prescriptionVerifiedAt) { this.prescriptionVerifiedAt = prescriptionVerifiedAt; }

    public String getPrescriptionVerifiedBy() { return prescriptionVerifiedBy; }
    public void setPrescriptionVerifiedBy(String prescriptionVerifiedBy) { this.prescriptionVerifiedBy = prescriptionVerifiedBy; }

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public String getDeliveryPhone() { return deliveryPhone; }
    public void setDeliveryPhone(String deliveryPhone) { this.deliveryPhone = deliveryPhone; }

    public LocalDateTime getEstimatedDeliveryTime() { return estimatedDeliveryTime; }
    public void setEstimatedDeliveryTime(LocalDateTime estimatedDeliveryTime) { this.estimatedDeliveryTime = estimatedDeliveryTime; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getProcessedAt() { return processedAt; }
    public void setProcessedAt(LocalDateTime processedAt) { this.processedAt = processedAt; }

    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }

    public enum OrderStatus {
        PENDING,           // Order placed, waiting for prescription (if required) or approval
        APPROVED,          // Order approved (prescription verified or not required)
        REJECTED,          // Order rejected by pharmacy
        CONFIRMED,         // Payment completed, order confirmed
        PREPARING,         // Medicine being prepared
        READY_FOR_PICKUP,  // Ready for customer pickup
        OUT_FOR_DELIVERY,  // Out for delivery
        DELIVERED,         // Successfully delivered
        CANCELLED          // Order cancelled
    }
    
    public enum PaymentStatus {
        PENDING,           // Payment not yet made
        SUCCESS,           // Payment successful
        FAILED             // Payment failed
    }

    public enum PrescriptionStatus {
        NOT_REQUIRED,      // Medicine doesn't require prescription
        PENDING_UPLOAD,    // Waiting for customer to upload prescription
        UPLOADED,          // Prescription uploaded, waiting for verification
        VERIFIED,          // Prescription verified and approved
        REJECTED           // Prescription rejected
    }
}