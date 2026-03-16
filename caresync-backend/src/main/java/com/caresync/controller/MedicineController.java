package com.caresync.controller;

import com.caresync.entity.Medicine;
import com.caresync.entity.User;
import com.caresync.service.AuthService;
import com.caresync.service.MedicineService;
import com.caresync.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/medicines")
@CrossOrigin(origins = "*")
public class MedicineController {
    
    @Autowired
    private MedicineService medicineService;
    
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
    
    // Pharmacy endpoints (require PHARMACY role)
    
    @PostMapping
    @PreAuthorize("hasRole('PHARMACY')")
    public ResponseEntity<?> addMedicine(@Valid @RequestBody Medicine medicine, HttpServletRequest request) {
        try {
            User pharmacyUser = getCurrentUser(request);
            Medicine savedMedicine = medicineService.addMedicine(pharmacyUser, medicine);
            return ResponseEntity.ok(new SuccessResponse("Medicine added successfully", savedMedicine));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PutMapping("/{medicineId}")
    @PreAuthorize("hasRole('PHARMACY')")
    public ResponseEntity<?> updateMedicine(@PathVariable Long medicineId, 
                                          @Valid @RequestBody Medicine medicine, 
                                          HttpServletRequest request) {
        try {
            User pharmacyUser = getCurrentUser(request);
            Medicine updatedMedicine = medicineService.updateMedicine(pharmacyUser, medicineId, medicine);
            return ResponseEntity.ok(new SuccessResponse("Medicine updated successfully", updatedMedicine));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @DeleteMapping("/{medicineId}")
    @PreAuthorize("hasRole('PHARMACY')")
    public ResponseEntity<?> deleteMedicine(@PathVariable Long medicineId, HttpServletRequest request) {
        try {
            User pharmacyUser = getCurrentUser(request);
            medicineService.deleteMedicine(pharmacyUser, medicineId);
            return ResponseEntity.ok(new SuccessResponse("Medicine deleted successfully", null));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/my-medicines")
    @PreAuthorize("hasRole('PHARMACY')")
    public ResponseEntity<?> getMyMedicines(HttpServletRequest request) {
        try {
            User pharmacyUser = getCurrentUser(request);
            List<Medicine> medicines = medicineService.getMedicinesByPharmacy(pharmacyUser);
            return ResponseEntity.ok(medicines);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/my-medicines/{medicineId}")
    @PreAuthorize("hasRole('PHARMACY')")
    public ResponseEntity<?> getMyMedicine(@PathVariable Long medicineId, HttpServletRequest request) {
        try {
            User pharmacyUser = getCurrentUser(request);
            Medicine medicine = medicineService.getMedicineById(pharmacyUser, medicineId);
            return ResponseEntity.ok(medicine);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PutMapping("/{medicineId}/stock")
    @PreAuthorize("hasRole('PHARMACY')")
    public ResponseEntity<?> updateStock(@PathVariable Long medicineId, 
                                       @RequestBody StockUpdateRequest request, 
                                       HttpServletRequest httpRequest) {
        try {
            User pharmacyUser = getCurrentUser(httpRequest);
            Medicine medicine = medicineService.updateStock(pharmacyUser, medicineId, request.getStockQuantity());
            return ResponseEntity.ok(new SuccessResponse("Stock updated successfully", medicine));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/low-stock")
    @PreAuthorize("hasRole('PHARMACY')")
    public ResponseEntity<?> getLowStockMedicines(@RequestParam(required = false) Integer threshold, 
                                                HttpServletRequest request) {
        try {
            User pharmacyUser = getCurrentUser(request);
            List<Medicine> medicines = medicineService.getLowStockMedicines(pharmacyUser, threshold);
            return ResponseEntity.ok(medicines);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/stats")
    @PreAuthorize("hasRole('PHARMACY')")
    public ResponseEntity<?> getMedicineStats(HttpServletRequest request) {
        try {
            User pharmacyUser = getCurrentUser(request);
            MedicineService.PharmacyMedicineStats stats = medicineService.getPharmacyMedicineStats(pharmacyUser);
            return ResponseEntity.ok(stats);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Public endpoints (for customers to search medicines)
    
    @GetMapping("/all")
    public ResponseEntity<?> getAllActiveMedicines() {
        try {
            List<Medicine> medicines = medicineService.getAllMedicines().stream()
                    .filter(Medicine::getIsActive)
                    .toList();
            return ResponseEntity.ok(medicines);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/search")
    public ResponseEntity<?> searchMedicines(@RequestParam(required = false) String name,
                                           @RequestParam(required = false) String category,
                                           @RequestParam(required = false) Boolean requiresPrescription) {
        try {
            List<Medicine> medicines = medicineService.searchMedicines(name, category, requiresPrescription);
            return ResponseEntity.ok(medicines);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/search/name")
    public ResponseEntity<?> searchMedicinesByName(@RequestParam String name) {
        try {
            List<Medicine> medicines = medicineService.searchMedicinesByName(name);
            return ResponseEntity.ok(medicines);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/category/{category}")
    public ResponseEntity<?> getMedicinesByCategory(@PathVariable String category) {
        try {
            List<Medicine> medicines = medicineService.getMedicinesByCategory(category);
            return ResponseEntity.ok(medicines);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/{medicineId}")
    public ResponseEntity<?> getMedicineDetails(@PathVariable Long medicineId) {
        try {
            Medicine medicine = medicineService.getMedicineDetails(medicineId);
            return ResponseEntity.ok(medicine);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // DTOs
    public static class StockUpdateRequest {
        private Integer stockQuantity;
        
        public Integer getStockQuantity() { return stockQuantity; }
        public void setStockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; }
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