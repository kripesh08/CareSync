package com.caresync.controller;

import com.caresync.entity.Hospital;
import com.caresync.entity.Medicine;
import com.caresync.entity.Pharmacy;
import com.caresync.entity.User;
import com.caresync.entity.Queue;
import com.caresync.entity.QueueToken;
import com.caresync.repository.OrderRepository;
import com.caresync.repository.UserRepository;
import com.caresync.repository.QueueRepository;
import com.caresync.repository.QueueTokenRepository;
import com.caresync.service.HospitalService;
import com.caresync.service.MedicineService;
import com.caresync.service.PharmacyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    
    @Autowired
    private PharmacyService pharmacyService;
    
    @Autowired
    private HospitalService hospitalService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private MedicineService medicineService;
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private QueueRepository queueRepository;
    
    @Autowired
    private QueueTokenRepository queueTokenRepository;
    
    // Dashboard Overview
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // Pharmacy stats
        List<Pharmacy> pendingPharmacies = pharmacyService.getPendingPharmacies();
        List<Pharmacy> approvedPharmacies = pharmacyService.getApprovedPharmacies();
        
        // Filter approved pharmacies to only include those with active users
        long activeApprovedPharmacies = approvedPharmacies.stream()
                .filter(p -> p.getUser() != null && p.getUser().getIsActive())
                .count();
        
        // Hospital stats
        List<Hospital> pendingHospitals = hospitalService.getPendingHospitals();
        List<Hospital> approvedHospitals = hospitalService.getApprovedHospitals();
        
        // Filter approved hospitals to only include those with active users
        long activeApprovedHospitals = approvedHospitals.stream()
                .filter(h -> h.getUser() != null && h.getUser().getIsActive())
                .count();
        
        // User stats
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByIsActive(true);
        long patientCount = userRepository.countByRole(User.Role.PATIENT);
        long pharmacyUserCount = userRepository.countByRole(User.Role.PHARMACY);
        long hospitalUserCount = userRepository.countByRole(User.Role.HOSPITAL);
        
        stats.put("pendingPharmacies", pendingPharmacies.size());
        stats.put("approvedPharmacies", (int) activeApprovedPharmacies);
        stats.put("pendingHospitals", pendingHospitals.size());
        stats.put("approvedHospitals", (int) activeApprovedHospitals);
        stats.put("totalUsers", totalUsers);
        stats.put("activeUsers", activeUsers);
        stats.put("patientCount", patientCount);
        stats.put("pharmacyUserCount", pharmacyUserCount);
        stats.put("hospitalUserCount", hospitalUserCount);
        
        // Queue stats
        long totalQueues = queueRepository.count();
        long activeQueues = queueRepository.countByIsActiveAndQueueStatus(true, Queue.QueueStatus.ACTIVE);
        
        // Today's token stats
        LocalDate today = LocalDate.now();
        long todayTotalTokens = queueTokenRepository.countByTokenDate(today);
        long todayWaitingTokens = queueTokenRepository.countByTokenDateAndTokenStatus(today, QueueToken.TokenStatus.WAITING);
        long todayCompletedTokens = queueTokenRepository.countByTokenDateAndTokenStatus(today, QueueToken.TokenStatus.COMPLETED);
        
        stats.put("totalQueues", totalQueues);
        stats.put("activeQueues", activeQueues);
        stats.put("todayTotalTokens", todayTotalTokens);
        stats.put("todayWaitingTokens", todayWaitingTokens);
        stats.put("todayCompletedTokens", todayCompletedTokens);
        
        return ResponseEntity.ok(stats);
    }
    
    // Pharmacy Management
    @GetMapping("/pharmacies/pending")
    public ResponseEntity<List<Pharmacy>> getPendingPharmacies() {
        List<Pharmacy> pharmacies = pharmacyService.getPendingPharmacies();
        return ResponseEntity.ok(pharmacies);
    }
    
    @GetMapping("/pharmacies/approved")
    public ResponseEntity<List<Pharmacy>> getApprovedPharmacies() {
        List<Pharmacy> pharmacies = pharmacyService.getApprovedPharmacies();
        return ResponseEntity.ok(pharmacies);
    }
    
    @GetMapping("/pharmacies/all")
    public ResponseEntity<List<Pharmacy>> getAllPharmacies() {
        List<Pharmacy> pharmacies = pharmacyService.getAllPharmacies();
        return ResponseEntity.ok(pharmacies);
    }
    
    @PutMapping("/pharmacies/{pharmacyId}/approve")
    public ResponseEntity<?> approvePharmacy(@PathVariable Long pharmacyId) {
        try {
            Pharmacy pharmacy = pharmacyService.approvePharmacy(pharmacyId);
            return ResponseEntity.ok(new SuccessResponse("Pharmacy approved successfully", pharmacy));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PutMapping("/pharmacies/{pharmacyId}/reject")
    public ResponseEntity<?> rejectPharmacy(@PathVariable Long pharmacyId, @RequestBody RejectionRequest request) {
        try {
            Pharmacy pharmacy = pharmacyService.rejectPharmacy(pharmacyId, request.getReason());
            return ResponseEntity.ok(new SuccessResponse("Pharmacy rejected", pharmacy));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Hospital Management
    @GetMapping("/hospitals/pending")
    public ResponseEntity<List<Hospital>> getPendingHospitals() {
        List<Hospital> hospitals = hospitalService.getPendingHospitals();
        return ResponseEntity.ok(hospitals);
    }
    
    @GetMapping("/hospitals/approved")
    public ResponseEntity<List<Hospital>> getApprovedHospitals() {
        List<Hospital> hospitals = hospitalService.getApprovedHospitals();
        return ResponseEntity.ok(hospitals);
    }
    
    @GetMapping("/hospitals/all")
    public ResponseEntity<?> getAllHospitals() {
        List<Hospital> hospitals = hospitalService.getAllHospitals();
        
        // Enrich with user data
        List<Map<String, Object>> enrichedHospitals = hospitals.stream().map(hospital -> {
            Map<String, Object> data = new HashMap<>();
            data.put("hospitalId", hospital.getHospitalId());
            data.put("hospitalName", hospital.getHospitalName());
            data.put("registrationNumber", hospital.getRegistrationNumber());
            data.put("address", hospital.getAddress());
            data.put("city", hospital.getCity());
            data.put("supportedInsuranceProviders", hospital.getSupportedInsuranceProviders());
            data.put("approvalStatus", hospital.getApprovalStatus());
            data.put("rejectionReason", hospital.getRejectionReason());
            data.put("createdAt", hospital.getCreatedAt());
            data.put("isActive", hospital.getIsActive());
            
            if (hospital.getUser() != null) {
                Map<String, Object> userData = new HashMap<>();
                userData.put("userId", hospital.getUser().getUserId());
                userData.put("email", hospital.getUser().getEmail());
                userData.put("phone", hospital.getUser().getPhone());
                userData.put("fullName", hospital.getUser().getFullName());
                userData.put("isActive", hospital.getUser().getIsActive());
                data.put("user", userData);
            }
            
            return data;
        }).collect(java.util.stream.Collectors.toList());
        
        return ResponseEntity.ok(enrichedHospitals);
    }
    
    @GetMapping("/hospitals/{hospitalId}")
    public ResponseEntity<?> getHospitalDetails(@PathVariable Long hospitalId) {
        try {
            Hospital hospital = hospitalService.getHospitalById(hospitalId);
            
            // Create enriched response with user data
            Map<String, Object> response = new HashMap<>();
            response.put("hospitalId", hospital.getHospitalId());
            response.put("hospitalName", hospital.getHospitalName());
            response.put("registrationNumber", hospital.getRegistrationNumber());
            response.put("address", hospital.getAddress());
            response.put("city", hospital.getCity());
            response.put("supportedInsuranceProviders", hospital.getSupportedInsuranceProviders());
            response.put("approvalStatus", hospital.getApprovalStatus());
            response.put("rejectionReason", hospital.getRejectionReason());
            response.put("createdAt", hospital.getCreatedAt());
            response.put("isActive", hospital.getIsActive());
            
            // Add user information
            if (hospital.getUser() != null) {
                Map<String, Object> userData = new HashMap<>();
                userData.put("userId", hospital.getUser().getUserId());
                userData.put("email", hospital.getUser().getEmail());
                userData.put("phone", hospital.getUser().getPhone());
                userData.put("fullName", hospital.getUser().getFullName());
                userData.put("isActive", hospital.getUser().getIsActive());
                response.put("user", userData);
            }
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PutMapping("/hospitals/{hospitalId}/approve")
    public ResponseEntity<?> approveHospital(@PathVariable Long hospitalId) {
        try {
            Hospital hospital = hospitalService.approveHospital(hospitalId);
            return ResponseEntity.ok(new SuccessResponse("Hospital approved successfully", hospital));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PutMapping("/hospitals/{hospitalId}/reject")
    public ResponseEntity<?> rejectHospital(@PathVariable Long hospitalId, @RequestBody RejectionRequest request) {
        try {
            Hospital hospital = hospitalService.rejectHospital(hospitalId, request.getReason());
            return ResponseEntity.ok(new SuccessResponse("Hospital rejected", hospital));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // User Management
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = userRepository.findAll();
            
            // Enrich user data with pharmacy/hospital approval status
            List<Map<String, Object>> enrichedUsers = users.stream().map(user -> {
                Map<String, Object> userData = new HashMap<>();
                userData.put("userId", user.getUserId());
                userData.put("fullName", user.getFullName());
                userData.put("email", user.getEmail());
                userData.put("phone", user.getPhone());
                userData.put("role", user.getRole());
                userData.put("isActive", user.getIsActive());
                userData.put("createdAt", user.getCreatedAt());
                
                // Add approval status for pharmacy/hospital users
                if (user.getRole() == User.Role.PHARMACY) {
                    pharmacyService.getPharmacyByUserId(user.getUserId())
                        .ifPresent(pharmacy -> {
                            userData.put("approvalStatus", pharmacy.getApprovalStatus());
                            userData.put("rejectionReason", pharmacy.getRejectionReason());
                        });
                } else if (user.getRole() == User.Role.HOSPITAL) {
                    try {
                        Hospital hospital = hospitalService.getHospitalByUserId(user.getUserId());
                        userData.put("approvalStatus", hospital.getApprovalStatus());
                        userData.put("rejectionReason", hospital.getRejectionReason());
                    } catch (Exception e) {
                        // Hospital not found, skip
                    }
                }
                
                return userData;
            }).collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(enrichedUsers);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Error fetching users: " + e.getMessage()));
        }
    }
    
    @GetMapping("/users/role/{role}")
    public ResponseEntity<List<User>> getUsersByRole(@PathVariable User.Role role) {
        List<User> users = userRepository.findByRole(role);
        return ResponseEntity.ok(users);
    }
    
    @PutMapping("/users/{userId}/activate")
    public ResponseEntity<?> activateUser(@PathVariable Long userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            user.setIsActive(true);
            userRepository.save(user);
            return ResponseEntity.ok(new SuccessResponse("User activated successfully", user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PutMapping("/users/{userId}/deactivate")
    public ResponseEntity<?> deactivateUser(@PathVariable Long userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            user.setIsActive(false);
            userRepository.save(user);
            return ResponseEntity.ok(new SuccessResponse("User deactivated successfully", user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Medicine Management
    @GetMapping("/all-medicines")
    public ResponseEntity<?> getAllMedicines() {
        try {
            List<Medicine> medicines = medicineService.getAllMedicines();
            System.out.println("Fetching medicines for admin. Count: " + medicines.size());
            return ResponseEntity.ok(medicines);
        } catch (Exception e) {
            System.err.println("Error fetching medicines: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new ErrorResponse("Error fetching medicines: " + e.getMessage()));
        }
    }
    
    @DeleteMapping("/medicines/{medicineId}")
    public ResponseEntity<?> deleteMedicine(@PathVariable Long medicineId) {
        try {
            System.out.println("Admin deleting medicine with ID: " + medicineId);
            medicineService.deleteMedicineByAdmin(medicineId);
            System.out.println("Medicine deleted successfully");
            return ResponseEntity.ok(new SuccessResponse("Medicine deleted successfully", null));
        } catch (RuntimeException e) {
            System.err.println("Error deleting medicine: " + e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Booking Management
    @GetMapping("/bookings")
    public ResponseEntity<?> getAllBookings() {
        try {
            List<com.caresync.entity.Order> bookings = orderRepository.findAll();
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Error fetching bookings: " + e.getMessage()));
        }
    }
    
    @GetMapping("/bookings/{orderId}")
    public ResponseEntity<?> getBookingDetails(@PathVariable Long orderId) {
        try {
            com.caresync.entity.Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Booking not found"));
            return ResponseEntity.ok(order);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Order Management
    @GetMapping("/orders/all")
    public ResponseEntity<?> getAllOrders() {
        try {
            List<com.caresync.entity.Order> orders = orderRepository.findAll();
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Queue Management
    @GetMapping("/queues/hospital/{hospitalId}")
    public ResponseEntity<?> getQueuesByHospital(@PathVariable Long hospitalId) {
        try {
            System.out.println("Fetching queues for hospital ID: " + hospitalId);
            
            Hospital hospital = hospitalService.getHospitalById(hospitalId);
            if (hospital == null) {
                System.out.println("Hospital not found with ID: " + hospitalId);
                return ResponseEntity.badRequest().body(new ErrorResponse("Hospital not found"));
            }
            
            System.out.println("Hospital found: " + hospital.getHospitalName());
            
            List<Queue> queues = queueRepository.findByHospitalOrderByDepartmentNameAsc(hospital);
            System.out.println("Found " + queues.size() + " queues for hospital");
            
            // Map to DTOs to avoid serialization issues
            List<Map<String, Object>> queueDTOs = queues.stream().map(queue -> {
                Map<String, Object> dto = new HashMap<>();
                dto.put("queueId", queue.getQueueId());
                dto.put("queueName", queue.getQueueName());
                dto.put("departmentName", queue.getDepartmentName());
                dto.put("description", queue.getDescription());
                dto.put("maxCapacity", queue.getMaxCapacity());
                dto.put("currentCount", queue.getCurrentCount());
                dto.put("startTime", queue.getStartTime());
                dto.put("endTime", queue.getEndTime());
                dto.put("estimatedTimePerPatient", queue.getEstimatedTimePerPatient());
                dto.put("queueStatus", queue.getQueueStatus());
                dto.put("isActive", queue.getIsActive());
                dto.put("operatingDays", queue.getOperatingDays());
                return dto;
            }).collect(java.util.stream.Collectors.toList());
            
            System.out.println("Returning " + queueDTOs.size() + " queue DTOs");
            
            return ResponseEntity.ok(queueDTOs);
        } catch (Exception e) {
            e.printStackTrace();
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