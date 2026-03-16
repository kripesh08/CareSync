package com.caresync.service;

import com.caresync.entity.Medicine;
import com.caresync.entity.Order;
import com.caresync.entity.Payment;
import com.caresync.entity.Pharmacy;
import com.caresync.entity.User;
import com.caresync.repository.MedicineRepository;
import com.caresync.repository.OrderRepository;
import com.caresync.repository.PharmacyRepository;
import com.caresync.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class BookingService {
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private MedicineRepository medicineRepository;
    
    @Autowired
    private PharmacyRepository pharmacyRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private CloudinaryService cloudinaryService;
    
    /**
     * Create a medicine booking
     * - If prescription not required: order_status = PENDING, payment_status = PENDING (ready for payment)
     * - If prescription required: order_status = PENDING, payment_status = PENDING (needs prescription upload & verification first)
     */
    public Order createBooking(Long userId, Long medicineId, Integer quantity, 
                              String deliveryAddress, String deliveryPhone, 
                              String customerNotes, MultipartFile prescriptionFile) throws IOException {
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new RuntimeException("Medicine not found"));
        
        // Check stock availability
        if (medicine.getStockQuantity() < quantity) {
            throw new RuntimeException("Insufficient stock. Available: " + medicine.getStockQuantity());
        }
        
        // Create order
        Order order = new Order();
        order.setCustomer(user);
        order.setPharmacy(medicine.getPharmacy());
        order.setMedicine(medicine);
        order.setQuantity(quantity);
        order.setUnitPrice(medicine.getPrice());
        order.setTotalAmount(medicine.getPrice().multiply(BigDecimal.valueOf(quantity)));
        order.setDeliveryAddress(deliveryAddress);
        order.setDeliveryPhone(deliveryPhone);
        order.setCustomerNotes(customerNotes);
        order.setRequiresPrescription(medicine.getRequiresPrescription());
        
        // Handle prescription requirement
        if (medicine.getRequiresPrescription()) {
            if (prescriptionFile != null && !prescriptionFile.isEmpty()) {
                // Upload prescription to Cloudinary
                String prescriptionUrl = cloudinaryService.uploadPrescription(prescriptionFile);
                order.setPrescriptionImagePath(prescriptionUrl);
                order.setPrescriptionStatus(Order.PrescriptionStatus.UPLOADED);
            } else {
                order.setPrescriptionStatus(Order.PrescriptionStatus.PENDING_UPLOAD);
            }
            order.setOrderStatus(Order.OrderStatus.PENDING);
            order.setPaymentStatus(Order.PaymentStatus.PENDING);
        } else {
            // No prescription required - keep as PENDING until payment
            order.setPrescriptionStatus(Order.PrescriptionStatus.NOT_REQUIRED);
            order.setOrderStatus(Order.OrderStatus.PENDING);
            order.setPaymentStatus(Order.PaymentStatus.PENDING);
        }
        
        return orderRepository.save(order);
    }
    
    /**
     * Upload prescription for an existing booking
     */
    public Order uploadPrescription(Long orderId, Long userId, MultipartFile prescriptionFile) throws IOException {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        if (!order.getCustomer().getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized access");
        }
        
        if (!order.getRequiresPrescription()) {
            throw new RuntimeException("This order does not require a prescription");
        }
        
        if (order.getOrderStatus() != Order.OrderStatus.PENDING) {
            throw new RuntimeException("Cannot upload prescription for this order");
        }
        
        // Upload to Cloudinary
        String prescriptionUrl = cloudinaryService.uploadPrescription(prescriptionFile);
        order.setPrescriptionImagePath(prescriptionUrl);
        order.setPrescriptionStatus(Order.PrescriptionStatus.UPLOADED);
        
        return orderRepository.save(order);
    }
    
    /**
     * Get all bookings for a customer
     */
    @Transactional(readOnly = true)
    public List<Order> getCustomerBookings(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return orderRepository.findByCustomerOrderByCreatedAtDesc(user);
    }
    
    /**
     * Get pending bookings for pharmacy (requires approval)
     */
    @Transactional(readOnly = true)
    public List<Order> getPendingBookingsForPharmacy(Long pharmacyId) {
        Pharmacy pharmacy = pharmacyRepository.findById(pharmacyId)
                .orElseThrow(() -> new RuntimeException("Pharmacy not found"));
        return orderRepository.findByPharmacyAndOrderStatusOrderByCreatedAtDesc(pharmacy, Order.OrderStatus.PENDING);
    }
    
    /**
     * Get all bookings for pharmacy
     */
    @Transactional(readOnly = true)
    public List<Order> getAllBookingsForPharmacy(Long pharmacyId) {
        Pharmacy pharmacy = pharmacyRepository.findById(pharmacyId)
                .orElseThrow(() -> new RuntimeException("Pharmacy not found"));
        return orderRepository.findByPharmacyOrderByCreatedAtDesc(pharmacy);
    }
    
    /**
     * Pharmacy approves a booking
     */
    public Order approveBooking(Long orderId, Long pharmacyId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        if (!order.getPharmacy().getPharmacyId().equals(pharmacyId)) {
            throw new RuntimeException("Unauthorized access");
        }
        
        if (order.getOrderStatus() != Order.OrderStatus.PENDING) {
            throw new RuntimeException("Only pending orders can be approved");
        }
        
        order.setOrderStatus(Order.OrderStatus.APPROVED);
        order.setPrescriptionStatus(Order.PrescriptionStatus.VERIFIED);
        order.setPrescriptionVerifiedAt(LocalDateTime.now());
        
        return orderRepository.save(order);
    }
    
    /**
     * Pharmacy rejects a booking
     */
    public Order rejectBooking(Long orderId, Long pharmacyId, String reason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        if (!order.getPharmacy().getPharmacyId().equals(pharmacyId)) {
            throw new RuntimeException("Unauthorized access");
        }
        
        if (order.getOrderStatus() != Order.OrderStatus.PENDING) {
            throw new RuntimeException("Only pending orders can be rejected");
        }
        
        order.setOrderStatus(Order.OrderStatus.REJECTED);
        order.setPrescriptionStatus(Order.PrescriptionStatus.REJECTED);
        order.setPrescriptionVerificationNotes(reason);
        order.setPrescriptionVerifiedAt(LocalDateTime.now());
        
        return orderRepository.save(order);
    }
    
    /**
     * Get booking details
     */
    @Transactional(readOnly = true)
    public Order getBookingDetails(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }
}
