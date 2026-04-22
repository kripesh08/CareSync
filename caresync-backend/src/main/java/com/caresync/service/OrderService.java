package com.caresync.service;

import com.caresync.entity.Medicine;
import com.caresync.entity.Order;
import com.caresync.entity.Pharmacy;
import com.caresync.entity.User;
import com.caresync.repository.MedicineRepository;
import com.caresync.repository.OrderRepository;
import com.caresync.repository.PharmacyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class OrderService {
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private MedicineRepository medicineRepository;
    
    @Autowired
    private PharmacyRepository pharmacyRepository;
    
    @Autowired
    private MedicineService medicineService;
    
    private static final String PRESCRIPTION_UPLOAD_DIR = "uploads/prescriptions/";
    
    // Get pharmacy by user
    private Pharmacy getPharmacyByUser(User user) {
        return pharmacyRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Pharmacy profile not found for user"));
    }
    
    // Place new order
    public Order placeOrder(User customer, Long medicineId, Integer quantity, 
                           String customerNotes, String deliveryAddress, String deliveryPhone) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .filter(Medicine::getIsActive)
                .orElseThrow(() -> new RuntimeException("Medicine not found or not available"));
        
        // Check stock availability
        if (quantity == null || quantity < 1) {
            throw new RuntimeException("Quantity must be at least 1");
        }
        if (medicine.getStockQuantity() < quantity) {
            throw new RuntimeException("Insufficient stock. Available: " + medicine.getStockQuantity());
        }
        
        // Create order
        Order order = new Order(customer, medicine.getPharmacy(), medicine, quantity, 
                               medicine.getPrice(), customerNotes, deliveryAddress, deliveryPhone);
        
        // Set estimated delivery time (24 hours from now)
        order.setEstimatedDeliveryTime(LocalDateTime.now().plusHours(24));
        
        return orderRepository.save(order);
    }
    
    // Upload prescription for order
    public Order uploadPrescription(User customer, Long orderId, MultipartFile prescriptionFile) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        // Verify customer owns this order
        if (!order.getCustomer().getUserId().equals(customer.getUserId())) {
            throw new RuntimeException("Unauthorized access to order");
        }
        
        // Check if order requires prescription
        if (!order.getRequiresPrescription()) {
            throw new RuntimeException("This order does not require a prescription");
        }
        
        // Check if prescription can be uploaded
        if (order.getPrescriptionStatus() != Order.PrescriptionStatus.PENDING_UPLOAD) {
            throw new RuntimeException("Prescription cannot be uploaded at this stage");
        }
        
        try {
            // Create upload directory if it doesn't exist
            Path uploadPath = Paths.get(PRESCRIPTION_UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            // Generate unique filename
            String originalFilename = prescriptionFile.getOriginalFilename();
            String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String uniqueFilename = "prescription_" + orderId + "_" + UUID.randomUUID() + fileExtension;
            
            // Save file
            Path filePath = uploadPath.resolve(uniqueFilename);
            Files.copy(prescriptionFile.getInputStream(), filePath);
            
            // Update order
            order.setPrescriptionImagePath(filePath.toString());
            order.setPrescriptionStatus(Order.PrescriptionStatus.UPLOADED);
            order.setOrderStatus(Order.OrderStatus.PENDING);
            
            return orderRepository.save(order);
            
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload prescription: " + e.getMessage());
        }
    }
    
    // Verify prescription (pharmacy action)
    public Order verifyPrescription(User pharmacyUser, Long orderId, boolean approved, String verificationNotes) {
        Pharmacy pharmacy = getPharmacyByUser(pharmacyUser);
        
        Order order = orderRepository.findByPharmacyAndOrderId(pharmacy, orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        // Check if prescription can be verified
        if (order.getPrescriptionStatus() != Order.PrescriptionStatus.UPLOADED) {
            throw new RuntimeException("No prescription to verify or already processed");
        }
        
        // Update prescription status
        if (approved) {
            order.setPrescriptionStatus(Order.PrescriptionStatus.VERIFIED);
            // Keep order status as PENDING - waiting for payment
        } else {
            order.setPrescriptionStatus(Order.PrescriptionStatus.REJECTED);
            order.setOrderStatus(Order.OrderStatus.REJECTED);
        }
        
        order.setPrescriptionVerificationNotes(verificationNotes);
        order.setPrescriptionVerifiedAt(LocalDateTime.now());
        order.setPrescriptionVerifiedBy(pharmacyUser.getFullName());
        
        return orderRepository.save(order);
    }
    
    // Mark order as delivered (pharmacy action)
    public Order markAsDelivered(User pharmacyUser, Long orderId, String deliveryNotes) {
        Pharmacy pharmacy = getPharmacyByUser(pharmacyUser);
        
        Order order = orderRepository.findByPharmacyAndOrderId(pharmacy, orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        // Can only mark as delivered if payment is successful
        if (order.getPaymentStatus() != Order.PaymentStatus.SUCCESS) {
            throw new RuntimeException("Order must be paid before marking as delivered");
        }
        
        if (order.getOrderStatus() == Order.OrderStatus.DELIVERED) {
            throw new RuntimeException("Order already marked as delivered");
        }
        
        order.setOrderStatus(Order.OrderStatus.DELIVERED);
        order.setPharmacyNotes(deliveryNotes);
        order.setProcessedAt(LocalDateTime.now());
        
        return orderRepository.save(order);
    }
    
    // Reject order (pharmacy action)
    public Order rejectOrder(User pharmacyUser, Long orderId, String rejectionReason) {
        Pharmacy pharmacy = getPharmacyByUser(pharmacyUser);
        
        Order order = orderRepository.findByPharmacyAndOrderId(pharmacy, orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        // Check if order can be rejected
        if (order.getOrderStatus() == Order.OrderStatus.DELIVERED || 
            order.getOrderStatus() == Order.OrderStatus.CANCELLED) {
            throw new RuntimeException("Order cannot be rejected at this stage");
        }
        
        order.setOrderStatus(Order.OrderStatus.REJECTED);
        order.setPharmacyNotes(rejectionReason);
        order.setProcessedAt(LocalDateTime.now());
        
        return orderRepository.save(order);
    }
    
    // Update order status (pharmacy action)
    public Order updateOrderStatus(User pharmacyUser, Long orderId, Order.OrderStatus newStatus) {
        Pharmacy pharmacy = getPharmacyByUser(pharmacyUser);
        
        Order order = orderRepository.findByPharmacyAndOrderId(pharmacy, orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        // Validate status transition
        if (!isValidStatusTransition(order.getOrderStatus(), newStatus)) {
            throw new RuntimeException("Invalid status transition from " + order.getOrderStatus() + " to " + newStatus);
        }
        
        order.setOrderStatus(newStatus);
        
        // Set processed time for final statuses
        if (newStatus == Order.OrderStatus.DELIVERED || newStatus == Order.OrderStatus.CANCELLED) {
            order.setProcessedAt(LocalDateTime.now());
        }
        
        return orderRepository.save(order);
    }
    
    // Cancel order (customer action)
    public Order cancelOrder(User customer, Long orderId, String cancellationReason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        // Verify customer owns this order
        if (!order.getCustomer().getUserId().equals(customer.getUserId())) {
            throw new RuntimeException("Unauthorized access to order");
        }
        
        // Check if order can be cancelled
        if (order.getOrderStatus() == Order.OrderStatus.DELIVERED || 
            order.getOrderStatus() == Order.OrderStatus.OUT_FOR_DELIVERY ||
            order.getOrderStatus() == Order.OrderStatus.CANCELLED ||
            order.getOrderStatus() == Order.OrderStatus.REJECTED ||
            order.getOrderStatus() == Order.OrderStatus.APPROVED ||
            order.getPrescriptionStatus() == Order.PrescriptionStatus.VERIFIED) {
            throw new RuntimeException("Order cannot be cancelled after pharmacy approval, rejection, or at this stage");
        }
        
        // If order was confirmed, restore stock
        if (order.getOrderStatus() == Order.OrderStatus.CONFIRMED || 
            order.getOrderStatus() == Order.OrderStatus.PREPARING ||
            order.getOrderStatus() == Order.OrderStatus.READY_FOR_PICKUP) {
            Medicine medicine = order.getMedicine();
            medicine.setStockQuantity(medicine.getStockQuantity() + order.getQuantity());
            medicineRepository.save(medicine);
        }
        
        order.setOrderStatus(Order.OrderStatus.CANCELLED);
        order.setCustomerNotes(order.getCustomerNotes() + "\nCancellation reason: " + cancellationReason);
        order.setProcessedAt(LocalDateTime.now());
        
        return orderRepository.save(order);
    }
    
    // Get orders for customer
    public List<Order> getCustomerOrders(User customer) {
        return orderRepository.findByCustomerOrderByCreatedAtDesc(customer);
    }
    
    // Get orders for pharmacy
    public List<Order> getPharmacyOrders(User pharmacyUser) {
        Pharmacy pharmacy = getPharmacyByUser(pharmacyUser);
        return orderRepository.findByPharmacyOrderByCreatedAtDesc(pharmacy);
    }
    
    // Get orders by status for pharmacy
    public List<Order> getPharmacyOrdersByStatus(User pharmacyUser, Order.OrderStatus status) {
        Pharmacy pharmacy = getPharmacyByUser(pharmacyUser);
        return orderRepository.findByPharmacyAndOrderStatusOrderByCreatedAtDesc(pharmacy, status);
    }
    
    // Get orders requiring prescription verification
    public List<Order> getOrdersRequiringPrescriptionVerification(User pharmacyUser) {
        Pharmacy pharmacy = getPharmacyByUser(pharmacyUser);
        return orderRepository.findOrdersRequiringPrescriptionVerification(pharmacy);
    }
    
    // Get orders needing attention
    public List<Order> getOrdersNeedingAttention(User pharmacyUser) {
        Pharmacy pharmacy = getPharmacyByUser(pharmacyUser);
        return orderRepository.findOrdersNeedingAttention(pharmacy);
    }
    
    // Get order details
    public Order getOrderDetails(User user, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        // Check access permissions
        if (user.getRole() == User.Role.PATIENT) {
            if (!order.getCustomer().getUserId().equals(user.getUserId())) {
                throw new RuntimeException("Unauthorized access to order");
            }
        } else if (user.getRole() == User.Role.PHARMACY) {
            Pharmacy pharmacy = getPharmacyByUser(user);
            if (!order.getPharmacy().getPharmacyId().equals(pharmacy.getPharmacyId())) {
                throw new RuntimeException("Unauthorized access to order");
            }
        } else {
            throw new RuntimeException("Unauthorized access");
        }
        
        return order;
    }
    
    // Get pharmacy order statistics
    public PharmacyOrderStats getPharmacyOrderStats(User pharmacyUser) {
        Pharmacy pharmacy = getPharmacyByUser(pharmacyUser);
        
        Object[] stats = orderRepository.getPharmacyOrderStatistics(pharmacy);
        if (stats.length > 0) {
            Object[] row = (Object[]) stats[0];
            return new PharmacyOrderStats(
                ((Number) row[0]).longValue(), // totalOrders
                ((Number) row[1]).longValue(), // pendingOrders
                ((Number) row[2]).longValue(), // confirmedOrders
                ((Number) row[3]).longValue(), // deliveredOrders
                ((Number) row[4]).longValue()  // prescriptionsToVerify
            );
        }
        
        return new PharmacyOrderStats(0, 0, 0, 0, 0);
    }
    
    // Validate status transition
    private boolean isValidStatusTransition(Order.OrderStatus currentStatus, Order.OrderStatus newStatus) {
        switch (currentStatus) {
            case PENDING:
                return newStatus == Order.OrderStatus.APPROVED || 
                       newStatus == Order.OrderStatus.REJECTED ||
                       newStatus == Order.OrderStatus.CANCELLED;
            case APPROVED:
                return newStatus == Order.OrderStatus.CONFIRMED ||
                       newStatus == Order.OrderStatus.REJECTED ||
                       newStatus == Order.OrderStatus.CANCELLED;
            case CONFIRMED:
                return newStatus == Order.OrderStatus.PREPARING ||
                       newStatus == Order.OrderStatus.CANCELLED;
            case PREPARING:
                return newStatus == Order.OrderStatus.READY_FOR_PICKUP ||
                       newStatus == Order.OrderStatus.OUT_FOR_DELIVERY ||
                       newStatus == Order.OrderStatus.CANCELLED;
            case READY_FOR_PICKUP:
                return newStatus == Order.OrderStatus.DELIVERED ||
                       newStatus == Order.OrderStatus.CANCELLED;
            case OUT_FOR_DELIVERY:
                return newStatus == Order.OrderStatus.DELIVERED;
            default:
                return false;
        }
    }
    
    // DTO for pharmacy order statistics
    public static class PharmacyOrderStats {
        private long totalOrders;
        private long pendingOrders;
        private long confirmedOrders;
        private long deliveredOrders;
        private long prescriptionsToVerify;
        
        public PharmacyOrderStats(long totalOrders, long pendingOrders, long confirmedOrders, 
                                 long deliveredOrders, long prescriptionsToVerify) {
            this.totalOrders = totalOrders;
            this.pendingOrders = pendingOrders;
            this.confirmedOrders = confirmedOrders;
            this.deliveredOrders = deliveredOrders;
            this.prescriptionsToVerify = prescriptionsToVerify;
        }
        
        // Getters
        public long getTotalOrders() { return totalOrders; }
        public long getPendingOrders() { return pendingOrders; }
        public long getConfirmedOrders() { return confirmedOrders; }
        public long getDeliveredOrders() { return deliveredOrders; }
        public long getPrescriptionsToVerify() { return prescriptionsToVerify; }
    }
}