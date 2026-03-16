package com.caresync.controller;

import com.caresync.entity.Pharmacy;
import com.caresync.service.PharmacyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pharmacy")
@CrossOrigin(origins = "*")
public class PharmacyController {
    
    @Autowired
    private PharmacyService pharmacyService;
    
    @PostMapping("/create")
    @PreAuthorize("hasRole('PHARMACY')")
    public ResponseEntity<?> createPharmacy(@RequestBody CreatePharmacyRequest request, 
                                          Authentication authentication) {
        try {
            Long userId = (Long) authentication.getPrincipal();
            Pharmacy pharmacy = pharmacyService.createPharmacy(
                userId, 
                request.getPharmacyName(), 
                request.getLicenseNumber(), 
                request.getAddress(), 
                request.getCity()
            );
            return ResponseEntity.ok(pharmacy);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/my-pharmacy")
    @PreAuthorize("hasRole('PHARMACY')")
    public ResponseEntity<?> getMyPharmacy(Authentication authentication) {
        try {
            Long userId = (Long) authentication.getPrincipal();
            Pharmacy pharmacy = pharmacyService.getPharmacyByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Pharmacy not found"));
            return ResponseEntity.ok(pharmacy);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/profile")
    @PreAuthorize("hasRole('PHARMACY')")
    public ResponseEntity<?> getPharmacyProfile(Authentication authentication) {
        try {
            Long userId = (Long) authentication.getPrincipal();
            Pharmacy pharmacy = pharmacyService.getPharmacyByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Pharmacy not found"));
            return ResponseEntity.ok(pharmacy);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/approved")
    public ResponseEntity<List<Pharmacy>> getApprovedPharmacies() {
        List<Pharmacy> pharmacies = pharmacyService.getApprovedPharmacies();
        return ResponseEntity.ok(pharmacies);
    }
    
    @GetMapping("/by-city/{city}")
    public ResponseEntity<List<Pharmacy>> getPharmaciesByCity(@PathVariable String city) {
        List<Pharmacy> pharmacies = pharmacyService.getPharmaciesByCity(city);
        return ResponseEntity.ok(pharmacies);
    }
    
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Pharmacy>> getPendingPharmacies() {
        List<Pharmacy> pharmacies = pharmacyService.getPendingPharmacies();
        return ResponseEntity.ok(pharmacies);
    }
    
    @PutMapping("/approve/{pharmacyId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approvePharmacy(@PathVariable Long pharmacyId) {
        try {
            Pharmacy pharmacy = pharmacyService.approvePharmacy(pharmacyId);
            return ResponseEntity.ok(pharmacy);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // DTOs
    public static class CreatePharmacyRequest {
        private String pharmacyName;
        private String licenseNumber;
        private String address;
        private String city;
        
        // Getters and Setters
        public String getPharmacyName() { return pharmacyName; }
        public void setPharmacyName(String pharmacyName) { this.pharmacyName = pharmacyName; }
        
        public String getLicenseNumber() { return licenseNumber; }
        public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
        
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        
        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }
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