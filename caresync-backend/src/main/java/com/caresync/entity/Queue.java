package com.caresync.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "queues")
public class Queue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "queue_id")
    private Long queueId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "hospital_id", referencedColumnName = "hospital_id")
    @JsonIgnoreProperties({"user", "queues"})
    @NotNull(message = "Hospital is required")
    private Hospital hospital;

    @NotBlank(message = "Department name is required")
    @Size(max = 100, message = "Department name cannot exceed 100 characters")
    @Column(name = "department_name")
    private String departmentName;

    @NotBlank(message = "Queue name is required")
    @Size(max = 100, message = "Queue name cannot exceed 100 characters")
    @Column(name = "queue_name")
    private String queueName;

    @Column(name = "max_capacity")
    @NotNull(message = "Maximum capacity is required")
    private Integer maxCapacity;

    @Column(name = "current_count")
    private Integer currentCount = 0;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "estimated_time_per_patient")
    private Integer estimatedTimePerPatient; // in minutes

    @Enumerated(EnumType.STRING)
    @Column(name = "queue_status")
    private QueueStatus queueStatus = QueueStatus.ACTIVE;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(columnDefinition = "TEXT")
    private String description;
    
    // Operating days (comma-separated: MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY,SUNDAY)
    @Column(name = "operating_days")
    private String operatingDays;

    @Column(name = "doctor_name")
    private String doctorName;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Constructors
    public Queue() {}

    public Queue(Hospital hospital, String departmentName, String queueName, 
                Integer maxCapacity, LocalTime startTime, LocalTime endTime, 
                Integer estimatedTimePerPatient, String doctorName) {
        this.hospital = hospital;
        this.departmentName = departmentName;
        this.queueName = queueName;
        this.maxCapacity = maxCapacity;
        this.startTime = startTime;
        this.endTime = endTime;
        this.estimatedTimePerPatient = estimatedTimePerPatient;
        this.doctorName = doctorName;
    }

    // Getters and Setters
    public Long getQueueId() { return queueId; }
    public void setQueueId(Long queueId) { this.queueId = queueId; }

    public Hospital getHospital() { return hospital; }
    public void setHospital(Hospital hospital) { this.hospital = hospital; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public String getQueueName() { return queueName; }
    public void setQueueName(String queueName) { this.queueName = queueName; }

    public Integer getMaxCapacity() { return maxCapacity; }
    public void setMaxCapacity(Integer maxCapacity) { this.maxCapacity = maxCapacity; }

    public Integer getCurrentCount() { return currentCount; }
    public void setCurrentCount(Integer currentCount) { this.currentCount = currentCount; }

    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }

    public Integer getEstimatedTimePerPatient() { return estimatedTimePerPatient; }
    public void setEstimatedTimePerPatient(Integer estimatedTimePerPatient) { this.estimatedTimePerPatient = estimatedTimePerPatient; }

    public QueueStatus getQueueStatus() { return queueStatus; }
    public void setQueueStatus(QueueStatus queueStatus) { this.queueStatus = queueStatus; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getOperatingDays() { return operatingDays; }
    public void setOperatingDays(String operatingDays) { this.operatingDays = operatingDays; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public enum QueueStatus {
        ACTIVE,     // Queue is accepting new tokens
        PAUSED,     // Queue is temporarily paused
        CLOSED,     // Queue is closed for the day
        FULL        // Queue has reached maximum capacity
    }
}