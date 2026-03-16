package com.caresync.controller;

import com.caresync.entity.Order;
import com.caresync.entity.Pharmacy;
import com.caresync.repository.PharmacyRepository;
import com.caresync.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pharmacy/bookings")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('PHARMACY')")
public class PharmacyBookingController {
    
    @Autowired
    private BookingService bookingService;
    
    @Autowired
    private PharmacyRepository pharmacyRepository;
    
    /**
     * Get all pending bookings for pharmacy (requires approval)
     */
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingBookings(Authentication authentication) {
        try {
            Long userId = (Long) authentication.getPrincipal();
            Pharmacy pharmacy = pharmacyRepository.findByUser_UserId(userId)
                    .orElseThrow(() -> new RuntimeException("Pharmacy not found"));
            
            List<Order> orders = bookingService.getPendingBookingsForPharmacy(pharmacy.getPharmacyId());
            return ResponseEntity.ok(orders);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    /**
     * Get all bookings for pharmacy
     */
    @GetMapping("/all")
    public ResponseEntity<?> getAllBookings(Authentication authentication) {
        try {
            Long userId = (Long) authentication.getPrincipal();
            Pharmacy pharmacy = pharmacyRepository.findByUser_UserId(userId)
                    .orElseThrow(() -> new RuntimeException("Pharmacy not found"));
            
            List<Order> orders = bookingService.getAllBookingsForPharmacy(pharmacy.getPharmacyId());
            return ResponseEntity.ok(orders);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    /**
     * Get booking details
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<?> getBookingDetails(@PathVariable Long orderId, Authentication authentication) {
        try {
            Long userId = (Long) authentication.getPrincipal();
            Pharmacy pharmacy = pharmacyRepository.findByUser_UserId(userId)
                    .orElseThrow(() -> new RuntimeException("Pharmacy not found"));
            
            Order order = bookingService.getBookingDetails(orderId);
            
            if (!order.getPharmacy().getPharmacyId().equals(pharmacy.getPharmacyId())) {
                return ResponseEntity.status(403).body(new ErrorResponse("Unauthorized access"));
            }
            
            return ResponseEntity.ok(order);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    /**
     * Approve a booking
     */
    @PutMapping("/{orderId}/approve")
    public ResponseEntity<?> approveBooking(@PathVariable Long orderId, Authentication authentication) {
        try {
            Long userId = (Long) authentication.getPrincipal();
            Pharmacy pharmacy = pharmacyRepository.findByUser_UserId(userId)
                    .orElseThrow(() -> new RuntimeException("Pharmacy not found"));
            
            Order order = bookingService.approveBooking(orderId, pharmacy.getPharmacyId());
            return ResponseEntity.ok(new SuccessResponse("Booking approved successfully", order));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    /**
     * Reject a booking
     */
    @PutMapping("/{orderId}/reject")
    public ResponseEntity<?> rejectBooking(
            @PathVariable Long orderId,
            @RequestBody RejectionRequest request,
            Authentication authentication) {
        try {
            Long userId = (Long) authentication.getPrincipal();
            Pharmacy pharmacy = pharmacyRepository.findByUser_UserId(userId)
                    .orElseThrow(() -> new RuntimeException("Pharmacy not found"));
            
            Order order = bookingService.rejectBooking(orderId, pharmacy.getPharmacyId(), request.getReason());
            return ResponseEntity.ok(new SuccessResponse("Booking rejected", order));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // DTOs
    public static class RejectionRequest {
        private String reason;
        
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }
    
    public static class SuccessResponse {
        private String message;
        private Object data;
        
        public SuccessResponse(String message, Object data) {
            this.message = message;
            this.data = data;
        }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public Object getData() { return data; }
        public void setData(Object data) { this.data = data; }
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
