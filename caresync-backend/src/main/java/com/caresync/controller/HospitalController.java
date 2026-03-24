package com.caresync.controller;

import com.caresync.entity.Hospital;
import com.caresync.repository.HospitalRepository;
import com.caresync.service.HospitalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/hospital")
@CrossOrigin(origins = "*")
public class HospitalController {
    
    @Autowired
    private HospitalService hospitalService;
    
    @Autowired
    private HospitalRepository hospitalRepository;
    
    @GetMapping("/profile")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<?> getHospitalProfile(Authentication authentication) {
        try {
            Long userId = (Long) authentication.getPrincipal();
            System.out.println("Fetching hospital profile for user ID: " + userId);
            
            HospitalProfileResponse response = hospitalService.getHospitalProfileWithPhone(userId);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            System.err.println("Error fetching hospital profile: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/approved")
    public ResponseEntity<?> getApprovedHospitals() {
        try {
            return ResponseEntity.ok(hospitalService.getApprovedHospitals());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/debug")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<?> debugHospitalProfile(Authentication authentication) {
        try {
            Long userId = (Long) authentication.getPrincipal();
            System.out.println("Debug: User ID from token: " + userId);
            
            // Try to find hospital
            Optional<Hospital> hospitalOpt = hospitalRepository.findByUser_UserId(userId);
            
            if (hospitalOpt.isPresent()) {
                Hospital hospital = hospitalOpt.get();
                return ResponseEntity.ok(Map.of(
                    "found", true,
                    "hospitalId", hospital.getHospitalId(),
                    "hospitalName", hospital.getHospitalName(),
                    "userId", userId,
                    "hospitalUserId", hospital.getUser() != null ? hospital.getUser().getUserId() : "null"
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                    "found", false,
                    "userId", userId,
                    "message", "No hospital found for this user ID"
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "error", e.getMessage()
            ));
        }
    }
    
    // DTOs
    public static class HospitalProfileResponse {
        private Long hospitalId;
        private String hospitalName;
        private String registrationNumber;
        private String address;
        private String city;
        private List<String> supportedInsuranceProviders;
        private Hospital.ApprovalStatus approvalStatus;
        private LocalDateTime createdAt;
        private String phone;
        
        // Getters and Setters
        public Long getHospitalId() { return hospitalId; }
        public void setHospitalId(Long hospitalId) { this.hospitalId = hospitalId; }
        
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
        
        public Hospital.ApprovalStatus getApprovalStatus() { return approvalStatus; }
        public void setApprovalStatus(Hospital.ApprovalStatus approvalStatus) { this.approvalStatus = approvalStatus; }
        
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
    }
    
    public static class ErrorResponse {
        private String message;
        
        public ErrorResponse(String message) {
            this.message = message;
        }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}
