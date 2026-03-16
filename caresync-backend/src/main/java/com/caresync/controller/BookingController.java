package com.caresync.controller;

import com.caresync.entity.Order;
import com.caresync.entity.Payment;
import com.caresync.service.BookingService;
import com.caresync.service.PaymentService;
import com.caresync.service.RazorpayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingController {
    
    @Autowired
    private BookingService bookingService;
    
    @Autowired
    private PaymentService paymentService;
    
    @Autowired
    private RazorpayService razorpayService;
    
    /**
     * Create a medicine booking (PATIENT only)
     */
    @PostMapping("/create")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> createBooking(
            @RequestParam Long medicineId,
            @RequestParam Integer quantity,
            @RequestParam String deliveryAddress,
            @RequestParam String deliveryPhone,
            @RequestParam(required = false) String customerNotes,
            @RequestParam(required = false) MultipartFile prescription,
            Authentication authentication) {
        try {
            Long userId = (Long) authentication.getPrincipal();
            Order order = bookingService.createBooking(userId, medicineId, quantity, 
                    deliveryAddress, deliveryPhone, customerNotes, prescription);
            return ResponseEntity.ok(new SuccessResponse("Booking created successfully", order));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Failed to upload prescription: " + e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    /**
     * Upload prescription for existing booking (PATIENT only)
     */
    @PostMapping("/{orderId}/upload-prescription")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> uploadPrescription(
            @PathVariable Long orderId,
            @RequestParam MultipartFile prescription,
            Authentication authentication) {
        try {
            Long userId = (Long) authentication.getPrincipal();
            Order order = bookingService.uploadPrescription(orderId, userId, prescription);
            return ResponseEntity.ok(new SuccessResponse("Prescription uploaded successfully", order));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Failed to upload prescription: " + e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    /**
     * Get all bookings for logged-in customer (PATIENT only)
     */
    @GetMapping("/my-bookings")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getMyBookings(Authentication authentication) {
        try {
            Long userId = (Long) authentication.getPrincipal();
            List<Order> orders = bookingService.getCustomerBookings(userId);
            return ResponseEntity.ok(orders);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    /**
     * Get booking details (PATIENT only)
     */
    @GetMapping("/{orderId}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getBookingDetails(@PathVariable Long orderId, Authentication authentication) {
        try {
            Order order = bookingService.getBookingDetails(orderId);
            Long userId = (Long) authentication.getPrincipal();
            
            if (!order.getCustomer().getUserId().equals(userId)) {
                return ResponseEntity.status(403).body(new ErrorResponse("Unauthorized access"));
            }
            
            return ResponseEntity.ok(order);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    /**
     * Create Razorpay order for payment (PATIENT only)
     */
    @PostMapping("/{orderId}/create-razorpay-order")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> createRazorpayOrder(@PathVariable Long orderId, Authentication authentication) {
        try {
            Long userId = (Long) authentication.getPrincipal();
            com.caresync.entity.Order order = bookingService.getBookingDetails(orderId);
            
            if (!order.getCustomer().getUserId().equals(userId)) {
                return ResponseEntity.status(403).body(new ErrorResponse("Unauthorized access"));
            }
            
            // Create Razorpay order
            com.razorpay.Order razorpayOrder = razorpayService.createOrder(
                order.getTotalAmount(),
                "INR",
                "ORDER_" + orderId
            );
            
            return ResponseEntity.ok(new RazorpayOrderResponse(
                razorpayOrder.get("id"),
                razorpayOrder.get("amount"),
                razorpayOrder.get("currency"),
                razorpayService.getKeyId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Failed to create payment order: " + e.getMessage()));
        }
    }
    
    /**
     * Process payment for booking (PATIENT only)
     */
    @PostMapping("/{orderId}/payment")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> processPayment(
            @PathVariable Long orderId,
            @RequestBody PaymentRequest request,
            Authentication authentication) {
        try {
            Long userId = (Long) authentication.getPrincipal();
            
            // Verify Razorpay signature
            if (!razorpayService.verifyPaymentSignature(
                    request.getRazorpayOrderId(),
                    request.getRazorpayPaymentId(),
                    request.getRazorpaySignature())) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Invalid payment signature"));
            }
            
            com.caresync.entity.Order order = paymentService.processPayment(
                orderId, 
                userId, 
                com.caresync.entity.Payment.PaymentMethod.RAZORPAY, 
                request.getRazorpayPaymentId()
            );
            return ResponseEntity.ok(new SuccessResponse("Payment processed successfully", order));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    /**
     * Check if payment is allowed for a booking (PATIENT only)
     */
    @GetMapping("/{orderId}/payment-allowed")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> isPaymentAllowed(@PathVariable Long orderId) {
        try {
            boolean allowed = paymentService.isPaymentAllowed(orderId);
            return ResponseEntity.ok(new PaymentAllowedResponse(allowed));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // DTOs
    public static class PaymentRequest {
        private String razorpayOrderId;
        private String razorpayPaymentId;
        private String razorpaySignature;
        
        public String getRazorpayOrderId() { return razorpayOrderId; }
        public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }
        
        public String getRazorpayPaymentId() { return razorpayPaymentId; }
        public void setRazorpayPaymentId(String razorpayPaymentId) { this.razorpayPaymentId = razorpayPaymentId; }
        
        public String getRazorpaySignature() { return razorpaySignature; }
        public void setRazorpaySignature(String razorpaySignature) { this.razorpaySignature = razorpaySignature; }
    }
    
    public static class RazorpayOrderResponse {
        private String orderId;
        private Object amount;
        private String currency;
        private String keyId;
        
        public RazorpayOrderResponse(String orderId, Object amount, String currency, String keyId) {
            this.orderId = orderId;
            this.amount = amount;
            this.currency = currency;
            this.keyId = keyId;
        }
        
        public String getOrderId() { return orderId; }
        public void setOrderId(String orderId) { this.orderId = orderId; }
        
        public Object getAmount() { return amount; }
        public void setAmount(Object amount) { this.amount = amount; }
        
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        
        public String getKeyId() { return keyId; }
        public void setKeyId(String keyId) { this.keyId = keyId; }
    }
    
    public static class PaymentAllowedResponse {
        private boolean allowed;
        
        public PaymentAllowedResponse(boolean allowed) {
            this.allowed = allowed;
        }
        
        public boolean isAllowed() { return allowed; }
        public void setAllowed(boolean allowed) { this.allowed = allowed; }
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
