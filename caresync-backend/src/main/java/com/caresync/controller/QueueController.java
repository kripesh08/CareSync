package com.caresync.controller;

import com.caresync.entity.Queue;
import com.caresync.entity.QueueClosure;
import com.caresync.entity.User;
import com.caresync.service.AuthService;
import com.caresync.service.QueueService;
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
@RequestMapping("/api/queues")
@CrossOrigin(origins = "*")
public class QueueController {
    
    @Autowired
    private QueueService queueService;
    
    @Autowired
    private AuthService authService;
    
    // Create queue (Hospital)
    @PostMapping
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<?> createQueue(@RequestBody Queue queue, HttpServletRequest request) {
        try {
            User hospitalUser = getCurrentUser(request);
            Queue createdQueue = queueService.createQueue(hospitalUser, queue);
            return ResponseEntity.ok(createdQueue);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Update queue (Hospital)
    @PutMapping("/{queueId}")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<?> updateQueue(@PathVariable Long queueId, @RequestBody Queue queue, HttpServletRequest request) {
        try {
            User hospitalUser = getCurrentUser(request);
            Queue updatedQueue = queueService.updateQueue(hospitalUser, queueId, queue);
            return ResponseEntity.ok(updatedQueue);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Delete queue (Hospital)
    @DeleteMapping("/{queueId}")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<?> deleteQueue(@PathVariable Long queueId, HttpServletRequest request) {
        try {
            User hospitalUser = getCurrentUser(request);
            queueService.deleteQueue(hospitalUser, queueId);
            return ResponseEntity.ok(new SuccessResponse("Queue deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Get hospital queues (Hospital) - returns today's booked count
    @GetMapping("/hospital")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<?> getHospitalQueues(HttpServletRequest request) {
        try {
            User hospitalUser = getCurrentUser(request);
            List<Queue> queues = queueService.getHospitalQueues(hospitalUser);
            LocalDate today = LocalDate.now();
            
            // Return with today's booked count instead of stale currentCount
            List<java.util.Map<String, Object>> result = queues.stream().map(queue -> {
                java.util.Map<String, Object> dto = new java.util.HashMap<>();
                dto.put("queueId", queue.getQueueId());
                dto.put("queueName", queue.getQueueName());
                dto.put("departmentName", queue.getDepartmentName());
                dto.put("description", queue.getDescription());
                dto.put("maxCapacity", queue.getMaxCapacity());
                dto.put("startTime", queue.getStartTime());
                dto.put("endTime", queue.getEndTime());
                dto.put("estimatedTimePerPatient", queue.getEstimatedTimePerPatient());
                dto.put("queueStatus", queue.getQueueStatus());
                dto.put("isActive", queue.getIsActive());
                dto.put("operatingDays", queue.getOperatingDays());
                dto.put("doctorName", queue.getDoctorName());
                
                // Today's actual booked count from tokens table
                long todayBooked = queueService.getTodayBookedCount(queue, today);
                dto.put("currentCount", todayBooked);
                
                return dto;
            }).toList();
            
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Get hospital departments (Hospital)
    @GetMapping("/hospital/departments")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<?> getHospitalDepartments(HttpServletRequest request) {
        try {
            User hospitalUser = getCurrentUser(request);
            List<String> departments = queueService.getHospitalDepartments(hospitalUser);
            return ResponseEntity.ok(departments);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Get hospital dashboard statistics (Hospital)
    @GetMapping("/hospital/dashboard")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<?> getHospitalDashboard(HttpServletRequest request) {
        try {
            User hospitalUser = getCurrentUser(request);
            return ResponseEntity.ok(queueService.getHospitalDashboardStats(hospitalUser));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Get available queues (Patient/Public)
    @GetMapping("/available")
    public ResponseEntity<?> getAvailableQueues() {
        try {
            List<Queue> queues = queueService.getAvailableQueues();
            return ResponseEntity.ok(queues);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Get queues by hospital (Patient/Public)
    @GetMapping("/hospital/{hospitalId}")
    public ResponseEntity<?> getQueuesByHospital(@PathVariable Long hospitalId, @RequestParam(required = false) String date) {
        try {
            LocalDate queryDate = date != null ? LocalDate.parse(date) : LocalDate.now();
            List<Map<String, Object>> queues = queueService.getQueuesByHospitalWithAvailability(hospitalId, queryDate);
            return ResponseEntity.ok(queues);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Search queues by department or consultation type (Patient/Public)
    @GetMapping("/search")
    public ResponseEntity<?> searchQueues(@RequestParam String query, @RequestParam(required = false) String date) {
        try {
            LocalDate queryDate = date != null ? LocalDate.parse(date) : LocalDate.now();
            List<Map<String, Object>> queues = queueService.searchQueuesWithAvailability(query, queryDate);
            return ResponseEntity.ok(queues);
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
    
    // ===== QUEUE CLOSURE ENDPOINTS =====
    
    // Add closure for specific date (Hospital)
    @PostMapping("/{queueId}/closures")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<?> addQueueClosure(@PathVariable Long queueId, @RequestBody ClosureRequest request, HttpServletRequest httpRequest) {
        try {
            User hospitalUser = getCurrentUser(httpRequest);
            QueueClosure closure = queueService.addQueueClosure(hospitalUser, queueId, request.getClosureDate(), request.getReason());
            return ResponseEntity.ok(closure);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Get closures for a queue (Hospital)
    @GetMapping("/{queueId}/closures")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<?> getQueueClosures(@PathVariable Long queueId, HttpServletRequest request) {
        try {
            User hospitalUser = getCurrentUser(request);
            List<QueueClosure> closures = queueService.getQueueClosures(hospitalUser, queueId);
            return ResponseEntity.ok(closures);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Remove closure (Hospital)
    @DeleteMapping("/closures/{closureId}")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<?> removeQueueClosure(@PathVariable Long closureId, HttpServletRequest request) {
        try {
            User hospitalUser = getCurrentUser(request);
            queueService.removeQueueClosure(hospitalUser, closureId);
            return ResponseEntity.ok(new SuccessResponse("Closure removed successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Toggle queue status (ACTIVE <-> PAUSED) (Hospital)
    @PutMapping("/{queueId}/toggle-status")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<?> toggleQueueStatus(@PathVariable Long queueId, HttpServletRequest request) {
        try {
            User hospitalUser = getCurrentUser(request);
            Queue queue = queueService.toggleQueueStatus(hospitalUser, queueId);
            return ResponseEntity.ok(queue);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // DTOs
    public static class ClosureRequest {
        private LocalDate closureDate;
        private String reason;
        
        public LocalDate getClosureDate() { return closureDate; }
        public void setClosureDate(LocalDate closureDate) { this.closureDate = closureDate; }
        
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }
    
    // DTOs
    public static class SuccessResponse {
        private String message;
        
        public SuccessResponse(String message) {
            this.message = message;
        }
        
        public String getMessage() { return message; }
    }
    
    public static class ErrorResponse {
        private String message;
        
        public ErrorResponse(String message) {
            this.message = message;
        }
        
        public String getMessage() { return message; }
    }
}
