package com.caresync.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "hospitals")
public class Hospital {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "hospital_id")
    private Long hospitalId;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "user_id")
    @JsonIgnore
    private User user;

    @NotBlank(message = "Hospital name is required")
    @Size(max = 200, message = "Hospital name cannot exceed 200 characters")
    @Column(name = "hospital_name")
    private String hospitalName;

    @NotBlank(message = "Registration/License number is required")
    @Size(max = 100, message = "Registration number cannot exceed 100 characters")
    @Column(name = "registration_number", unique = true)
    private String registrationNumber;

    @NotBlank(message = "Address is required")
    @Size(max = 500, message = "Address cannot exceed 500 characters")
    private String address;

    @NotBlank(message = "City is required")
    @Size(max = 100, message = "City cannot exceed 100 characters")
    private String city;

    // Insurance providers supported by this hospital (mandatory at registration)
    @ElementCollection
    @CollectionTable(name = "hospital_insurance_providers", 
                    joinColumns = @JoinColumn(name = "hospital_id"))
    @Column(name = "insurance_provider")
    private List<String> supportedInsuranceProviders;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status")
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Constructors
    public Hospital() {}

    public Hospital(String hospitalName, String registrationNumber, String address, 
                   String city, List<String> supportedInsuranceProviders, User user) {
        this.hospitalName = hospitalName;
        this.registrationNumber = registrationNumber;
        this.address = address;
        this.city = city;
        this.supportedInsuranceProviders = supportedInsuranceProviders;
        this.user = user;
    }

    // Getters and Setters
    public Long getHospitalId() { return hospitalId; }
    public void setHospitalId(Long hospitalId) { this.hospitalId = hospitalId; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getHospitalName() { return hospitalName; }
    public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }

    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public List<String> getSupportedInsuranceProviders() { return supportedInsuranceProviders; }
    public void setSupportedInsuranceProviders(List<String> supportedInsuranceProviders) { 
        this.supportedInsuranceProviders = supportedInsuranceProviders; 
    }

    public ApprovalStatus getApprovalStatus() { return approvalStatus; }
    public void setApprovalStatus(ApprovalStatus approvalStatus) { this.approvalStatus = approvalStatus; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public enum ApprovalStatus {
        PENDING, APPROVED, REJECTED
    }
}