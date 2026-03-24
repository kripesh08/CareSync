package com.caresync.controller;

import com.caresync.entity.QueueToken;
import com.caresync.entity.User;
import com.caresync.service.AuthService;
import com.caresync.service.RazorpayService;
import com.caresync.service.TokenService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/queue-tokens")
@CrossOrigin(origins = "*")
public class TokenController {
    
    @Autowired
    private TokenService tokenService;
    
    @Autowired
    private AuthService authService;
    
    @Autowired
    private RazorpayService razorpayService;
    
    // Book token (Patient)
    @PostMapping("/book")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> bookToken(@RequestBody BookTokenRequest request, HttpServletRequest httpRequest) {
        try {
            User patient = getCurrentUser(httpRequest);
            QueueToken token = tokenService.bookToken(patient, request.getQueueId(), request.getTokenDate());
            return ResponseEntity.ok(token);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Create Razorpay order for token payment (Patient)
    @PostMapping("/{tokenId}/create-razorpay-order")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> createRazorpayOrder(@PathVariable Long tokenId, HttpServletRequest httpRequest) {
        try {
            User patient = getCurrentUser(httpRequest);
            QueueToken token = tokenService.getPatientTokens(patient).stream()
                    .filter(t -> t.getTokenId().equals(tokenId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Token not found"));
            
            // Create Razorpay order
            com.razorpay.Order razorpayOrder = razorpayService.createOrder(
                token.getTokenFee(),
                "INR",
                "TOKEN_" + tokenId
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
    
    // Process payment (Patient)
    @PostMapping("/{tokenId}/payment")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> processPayment(@PathVariable Long tokenId, @RequestBody PaymentRequest request, HttpServletRequest httpRequest) {
        try {
            User patient = getCurrentUser(httpRequest);
            
            // Verify Razorpay signature
            boolean isValid = razorpayService.verifyPaymentSignature(
                    request.getRazorpayOrderId(),
                    request.getRazorpayPaymentId(),
                    request.getRazorpaySignature());
            
            if (!isValid) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Invalid payment signature"));
            }
            
            QueueToken token = tokenService.processPayment(tokenId, patient, request.getRazorpayPaymentId());
            return ResponseEntity.ok(new SuccessResponse("Payment successful", token));
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Get patient tokens (Patient)
    @GetMapping("/my-tokens")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getMyTokens(HttpServletRequest request) {
        try {
            User patient = getCurrentUser(request);
            List<QueueToken> tokens = tokenService.getPatientTokens(patient);
            return ResponseEntity.ok(tokens);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Cancel token (Patient)
    @PutMapping("/{tokenId}/cancel")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> cancelToken(@PathVariable Long tokenId, HttpServletRequest request) {
        try {
            User patient = getCurrentUser(request);
            QueueToken token = tokenService.cancelToken(tokenId, patient);
            return ResponseEntity.ok(new SuccessResponse("Token cancelled successfully", token));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Get hospital tokens for specific date (Hospital)
    @GetMapping("/hospital/today")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<?> getHospitalTokensToday(@RequestParam(required = false) String date, HttpServletRequest request) {
        try {
            User hospitalUser = getCurrentUser(request);
            LocalDate queryDate = date != null ? LocalDate.parse(date) : LocalDate.now();
            List<QueueToken> tokens = tokenService.getHospitalTokensForDate(hospitalUser, queryDate);
            return ResponseEntity.ok(tokens);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Get completed tokens for a date (Hospital)
    @GetMapping("/hospital/completed")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<?> getCompletedTokens(@RequestParam(required = false) String date, HttpServletRequest request) {
        try {
            User hospitalUser = getCurrentUser(request);
            LocalDate queryDate = date != null ? LocalDate.parse(date) : LocalDate.now();
            List<QueueToken> tokens = tokenService.getHospitalTokensByStatus(hospitalUser, queryDate, QueueToken.TokenStatus.COMPLETED);
            return ResponseEntity.ok(tokens);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    // Get all hospital tokens (Hospital)
    @GetMapping("/hospital/all")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<?> getAllHospitalTokens(HttpServletRequest request) {
        try {
            User hospitalUser = getCurrentUser(request);
            List<QueueToken> tokens = tokenService.getAllHospitalTokens(hospitalUser);
            return ResponseEntity.ok(tokens);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Call token (Hospital)
    @PutMapping("/{tokenId}/call")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<?> callToken(@PathVariable Long tokenId, HttpServletRequest request) {
        try {
            User hospitalUser = getCurrentUser(request);
            QueueToken token = tokenService.callToken(hospitalUser, tokenId);
            return ResponseEntity.ok(new SuccessResponse("Token called successfully", token));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Complete token (Hospital)
    @PutMapping("/{tokenId}/complete")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<?> completeToken(@PathVariable Long tokenId, HttpServletRequest request) {
        try {
            User hospitalUser = getCurrentUser(request);
            QueueToken token = tokenService.completeToken(hospitalUser, tokenId);
            return ResponseEntity.ok(new SuccessResponse("Token completed successfully", token));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Get token statistics (Hospital)
    @GetMapping("/hospital/stats")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<?> getTokenStatistics(@RequestParam(required = false) String date, HttpServletRequest request) {
        try {
            User hospitalUser = getCurrentUser(request);
            LocalDate queryDate = date != null ? LocalDate.parse(date) : LocalDate.now();
            TokenService.TokenStatistics stats = tokenService.getTokenStatistics(hospitalUser, queryDate);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new ErrorResponse("Failed to fetch statistics: " + e.getMessage()));
        }
    }
    
    // Get queue status for a specific token (Patient)
    @GetMapping("/{tokenId}/queue-status")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getQueueStatus(@PathVariable Long tokenId, HttpServletRequest request) {
        try {
            User patient = getCurrentUser(request);
            Map<String, Object> status = tokenService.getQueueStatus(tokenId, patient);
            return ResponseEntity.ok(status);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Helper method
    private User getCurrentUser(HttpServletRequest request) {
        Authentication authentication = (Authentication) request.getUserPrincipal();
        Long userId = (Long) authentication.getPrincipal();
        return authService.getCurrentUser(userId);
    }
    
    // DTOs
    public static class BookTokenRequest {
        private Long queueId;
        private LocalDate tokenDate;
        
        public Long getQueueId() { return queueId; }
        public void setQueueId(Long queueId) { this.queueId = queueId; }
        
        public LocalDate getTokenDate() { return tokenDate; }
        public void setTokenDate(LocalDate tokenDate) { this.tokenDate = tokenDate; }
    }
    
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
        public Object getAmount() { return amount; }
        public String getCurrency() { return currency; }
        public String getKeyId() { return keyId; }
    }
    
    public static class SuccessResponse {
        private String message;
        private Object data;
        
        public SuccessResponse(String message, Object data) {
            this.message = message;
            this.data = data;
        }
        
        public String getMessage() { return message; }
        public Object getData() { return data; }
    }
    
    public static class ErrorResponse {
        private String message;
        
        public ErrorResponse(String message) {
            this.message = message;
        }
        
        public String getMessage() { return message; }
    }
}
