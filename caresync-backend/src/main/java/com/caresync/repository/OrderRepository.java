package com.caresync.repository;

import com.caresync.entity.Order;
import com.caresync.entity.Pharmacy;
import com.caresync.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    // Find orders by customer
    List<Order> findByCustomerOrderByCreatedAtDesc(User customer);
    
    // Find orders by pharmacy
    List<Order> findByPharmacyOrderByCreatedAtDesc(Pharmacy pharmacy);
    
    // Find orders by pharmacy and status
    List<Order> findByPharmacyAndOrderStatusOrderByCreatedAtDesc(Pharmacy pharmacy, Order.OrderStatus status);
    
    // Find orders by pharmacy and payment status
    List<Order> findByPharmacyAndPaymentStatusOrderByCreatedAtDesc(Pharmacy pharmacy, Order.PaymentStatus paymentStatus);
    
    // Find orders by customer and status
    List<Order> findByCustomerAndOrderStatusOrderByCreatedAtDesc(User customer, Order.OrderStatus status);
    
    // Find order by pharmacy and order ID
    Optional<Order> findByPharmacyAndOrderId(Pharmacy pharmacy, Long orderId);
    
    // Find orders requiring prescription verification
    @Query("SELECT o FROM Order o WHERE o.pharmacy = :pharmacy AND o.prescriptionStatus = 'UPLOADED' ORDER BY o.createdAt ASC")
    List<Order> findOrdersRequiringPrescriptionVerification(@Param("pharmacy") Pharmacy pharmacy);
    
    // Find orders with pending prescriptions
    @Query("SELECT o FROM Order o WHERE o.pharmacy = :pharmacy AND o.prescriptionStatus = 'PENDING_UPLOAD' ORDER BY o.createdAt ASC")
    List<Order> findOrdersWithPendingPrescriptions(@Param("pharmacy") Pharmacy pharmacy);
    
    // Find orders by prescription status
    List<Order> findByPharmacyAndPrescriptionStatusOrderByCreatedAtDesc(Pharmacy pharmacy, Order.PrescriptionStatus prescriptionStatus);
    
    // Find recent orders (last 7 days)
    @Query("SELECT o FROM Order o WHERE o.pharmacy = :pharmacy AND o.createdAt >= :since ORDER BY o.createdAt DESC")
    List<Order> findRecentOrdersByPharmacy(@Param("pharmacy") Pharmacy pharmacy, @Param("since") LocalDateTime since);
    
    // Find orders by date range
    @Query("SELECT o FROM Order o WHERE o.pharmacy = :pharmacy AND o.createdAt BETWEEN :startDate AND :endDate ORDER BY o.createdAt DESC")
    List<Order> findOrdersByDateRange(@Param("pharmacy") Pharmacy pharmacy, 
                                     @Param("startDate") LocalDateTime startDate, 
                                     @Param("endDate") LocalDateTime endDate);
    
    // Count orders by status for pharmacy
    long countByPharmacyAndOrderStatus(Pharmacy pharmacy, Order.OrderStatus status);
    
    // Count orders requiring prescription verification
    @Query("SELECT COUNT(o) FROM Order o WHERE o.pharmacy = :pharmacy AND o.prescriptionStatus = 'UPLOADED'")
    long countOrdersRequiringPrescriptionVerification(@Param("pharmacy") Pharmacy pharmacy);
    
    // Count total orders for pharmacy
    long countByPharmacy(Pharmacy pharmacy);
    
    // Count orders by customer
    long countByCustomer(User customer);
    
    // Find orders with specific prescription status
    List<Order> findByPrescriptionStatusOrderByCreatedAtDesc(Order.PrescriptionStatus prescriptionStatus);
    
    // Get pharmacy statistics
    @Query("SELECT " +
           "COUNT(o) as totalOrders, " +
           "SUM(CASE WHEN o.paymentStatus = 'PENDING' THEN 1 ELSE 0 END) as pendingOrders, " +
           "SUM(CASE WHEN o.orderStatus = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmedOrders, " +
           "SUM(CASE WHEN o.orderStatus = 'DELIVERED' THEN 1 ELSE 0 END) as deliveredOrders, " +
           "SUM(CASE WHEN o.prescriptionStatus = 'UPLOADED' THEN 1 ELSE 0 END) as prescriptionsToVerify " +
           "FROM Order o WHERE o.pharmacy = :pharmacy AND o.orderStatus NOT IN ('CANCELLED', 'REJECTED')")
    Object[] getPharmacyOrderStatistics(@Param("pharmacy") Pharmacy pharmacy);
    
    // Find orders that need attention (pending prescription verification or paid orders ready for delivery)
    @Query("SELECT o FROM Order o WHERE o.pharmacy = :pharmacy AND " +
           "(o.prescriptionStatus = 'UPLOADED' OR " +
           "(o.paymentStatus = 'SUCCESS' AND o.orderStatus != 'DELIVERED')) " +
           "ORDER BY o.createdAt ASC")
    List<Order> findOrdersNeedingAttention(@Param("pharmacy") Pharmacy pharmacy);
}