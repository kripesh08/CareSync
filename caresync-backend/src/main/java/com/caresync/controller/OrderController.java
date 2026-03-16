package com.caresync.controller;

import com.caresync.entity.Order;
import com.caresync.entity.User;
import com.caresync.service.AuthService;
import com.caresync.service.OrderService;
import com.caresync.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {
    
    @Autowired
    private OrderService orderService;
    
    @Autowired
    private AuthService authService;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    // Helper method to get current user from JWT token
    private User getCurrentUser(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
            Long userId = jwtUtil.getUserIdFromToken(token);
            return authService.getCurrentUser(userId);
        }
        throw new RuntimeException("Invalid or missing token");
    }
    
    // Customer endpoints
    
    @PostMapping
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> placeOrder(@Valid @RequestBody PlaceOrderRequest request, 
                                      HttpServletRequest httpRequest) {
        try {
            User customer = getCurrentUser(httpRequest);
            Order order = orderService.placeOrder(
                customer, 
                request.getMedicineId(), 
                request.getQuantity(),
                request.getCustomerNotes(),
                request.getDeliveryAddress(),
                request.getDeliveryPhone()
            );
            return ResponseEntity.ok(new SuccessResponse("Order placed successfully", order));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PostMapping("/{orderId}/prescription")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> uploadPrescription(@PathVariable Long orderId,
                                              @RequestParam("prescription") MultipartFile prescriptionFile,
                                              HttpServletRequest request) {
        try {
            User customer = getCurrentUser(request);
            Order order = orderService.uploadPrescription(customer, orderId, prescriptionFile);
            return ResponseEntity.ok(new SuccessResponse("Prescription uploaded successfully", order));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PutMapping("/{orderId}/cancel")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> cancelOrder(@PathVariable Long orderId,
                                       @RequestBody CancelOrderRequest request,
                                       HttpServletRequest httpRequest) {
        try {
            User customer = getCurrentUser(httpRequest);
            Order order = orderService.cancelOrder(customer, orderId, request.getCancellationReason());
            return ResponseEntity.ok(new SuccessResponse("Order cancelled successfully", order));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/my-orders")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getMyOrders(HttpServletRequest request) {
        try {
            User customer = getCurrentUser(request);
            List<Order> orders = orderService.getCustomerOrders(customer);
            return ResponseEntity.ok(orders);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Pharmacy endpoints
    
    @GetMapping("/pharmacy/orders")
    @PreAuthorize("hasRole('PHARMACY')")
    public ResponseEntity<?> getPharmacyOrders(@RequestParam(required = false) String status,
                                             HttpServletRequest request) {
        try {
            User pharmacyUser = getCurrentUser(request);
            List<Order> orders;
            
            if (status != null && !status.isEmpty()) {
                Order.OrderStatus orderStatus = Order.OrderStatus.valueOf(status.toUpperCase());
                orders = orderService.getPharmacyOrdersByStatus(pharmacyUser, orderStatus);
            } else {
                orders = orderService.getPharmacyOrders(pharmacyUser);
            }
            
            return ResponseEntity.ok(orders);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/pharmacy/prescriptions-to-verify")
    @PreAuthorize("hasRole('PHARMACY')")
    public ResponseEntity<?> getPrescriptionsToVerify(HttpServletRequest request) {
        try {
            User pharmacyUser = getCurrentUser(request);
            List<Order> orders = orderService.getOrdersRequiringPrescriptionVerification(pharmacyUser);
            return ResponseEntity.ok(orders);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/pharmacy/needs-attention")
    @PreAuthorize("hasRole('PHARMACY')")
    public ResponseEntity<?> getOrdersNeedingAttention(HttpServletRequest request) {
        try {
            User pharmacyUser = getCurrentUser(request);
            List<Order> orders = orderService.getOrdersNeedingAttention(pharmacyUser);
            return ResponseEntity.ok(orders);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PutMapping("/{orderId}/verify-prescription")
    @PreAuthorize("hasRole('PHARMACY')")
    public ResponseEntity<?> verifyPrescription(@PathVariable Long orderId,
                                              @RequestBody VerifyPrescriptionRequest request,
                                              HttpServletRequest httpRequest) {
        try {
            User pharmacyUser = getCurrentUser(httpRequest);
            Order order = orderService.verifyPrescription(
                pharmacyUser, 
                orderId, 
                request.isApproved(), 
                request.getVerificationNotes()
            );
            return ResponseEntity.ok(new SuccessResponse("Prescription verification completed", order));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PutMapping("/{orderId}/mark-delivered")
    @PreAuthorize("hasRole('PHARMACY')")
    public ResponseEntity<?> markAsDelivered(@PathVariable Long orderId,
                                        @RequestBody DeliveryRequest request,
                                        HttpServletRequest httpRequest) {
        try {
            User pharmacyUser = getCurrentUser(httpRequest);
            Order order = orderService.markAsDelivered(pharmacyUser, orderId, request.getDeliveryNotes());
            return ResponseEntity.ok(new SuccessResponse("Order marked as delivered", order));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PutMapping("/{orderId}/reject")
    @PreAuthorize("hasRole('PHARMACY')")
    public ResponseEntity<?> rejectOrder(@PathVariable Long orderId,
                                       @RequestBody RejectOrderRequest request,
                                       HttpServletRequest httpRequest) {
        try {
            User pharmacyUser = getCurrentUser(httpRequest);
            Order order = orderService.rejectOrder(pharmacyUser, orderId, request.getRejectionReason());
            return ResponseEntity.ok(new SuccessResponse("Order rejected", order));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PutMapping("/{orderId}/status")
    @PreAuthorize("hasRole('PHARMACY')")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long orderId,
                                             @RequestBody UpdateStatusRequest request,
                                             HttpServletRequest httpRequest) {
        try {
            User pharmacyUser = getCurrentUser(httpRequest);
            Order.OrderStatus newStatus = Order.OrderStatus.valueOf(request.getStatus().toUpperCase());
            Order order = orderService.updateOrderStatus(pharmacyUser, orderId, newStatus);
            return ResponseEntity.ok(new SuccessResponse("Order status updated successfully", order));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/pharmacy/stats")
    @PreAuthorize("hasRole('PHARMACY')")
    public ResponseEntity<?> getOrderStats(HttpServletRequest request) {
        try {
            User pharmacyUser = getCurrentUser(request);
            OrderService.PharmacyOrderStats stats = orderService.getPharmacyOrderStats(pharmacyUser);
            return ResponseEntity.ok(stats);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Common endpoints
    
    @GetMapping("/{orderId}")
    public ResponseEntity<?> getOrderDetails(@PathVariable Long orderId, HttpServletRequest request) {
        try {
            User user = getCurrentUser(request);
            Order order = orderService.getOrderDetails(user, orderId);
            return ResponseEntity.ok(order);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // DTOs
    public static class PlaceOrderRequest {
        private Long medicineId;
        private Integer quantity;
        private String customerNotes;
        private String deliveryAddress;
        private String deliveryPhone;
        
        // Getters and Setters
        public Long getMedicineId() { return medicineId; }
        public void setMedicineId(Long medicineId) { this.medicineId = medicineId; }
        
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        
        public String getCustomerNotes() { return customerNotes; }
        public void setCustomerNotes(String customerNotes) { this.customerNotes = customerNotes; }
        
        public String getDeliveryAddress() { return deliveryAddress; }
        public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
        
        public String getDeliveryPhone() { return deliveryPhone; }
        public void setDeliveryPhone(String deliveryPhone) { this.deliveryPhone = deliveryPhone; }
    }
    
    public static class CancelOrderRequest {
        private String cancellationReason;
        
        public String getCancellationReason() { return cancellationReason; }
        public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }
    }
    
    public static class VerifyPrescriptionRequest {
        private boolean approved;
        private String verificationNotes;
        
        public boolean isApproved() { return approved; }
        public void setApproved(boolean approved) { this.approved = approved; }
        
        public String getVerificationNotes() { return verificationNotes; }
        public void setVerificationNotes(String verificationNotes) { this.verificationNotes = verificationNotes; }
    }
    
    public static class ConfirmOrderRequest {
        private String pharmacyNotes;
        
        public String getPharmacyNotes() { return pharmacyNotes; }
        public void setPharmacyNotes(String pharmacyNotes) { this.pharmacyNotes = pharmacyNotes; }
    }
    
    public static class DeliveryRequest {
        private String deliveryNotes;
        
        public String getDeliveryNotes() { return deliveryNotes; }
        public void setDeliveryNotes(String deliveryNotes) { this.deliveryNotes = deliveryNotes; }
    }
    
    public static class RejectOrderRequest {
        private String rejectionReason;
        
        public String getRejectionReason() { return rejectionReason; }
        public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    }
    
    public static class UpdateStatusRequest {
        private String status;
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
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