package com.caresync.controller;

import com.caresync.service.WaitingTimePredictionService;
import com.caresync.util.DataGenerator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/data")
@CrossOrigin(origins = "*")
public class AdminDataController {
    
    @Autowired
    private DataGenerator dataGenerator;
    
    @Autowired
    private WaitingTimePredictionService predictionService;
    
    // Generate test data (Admin only)
    @PostMapping("/generate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> generateTestData() {
        try {
            dataGenerator.generateTestData();
            return ResponseEntity.ok(new SuccessResponse("Test data generated successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new ErrorResponse("Failed to generate test data: " + e.getMessage()));
        }
    }
    
    // Get prediction for a queue (Public)
    @GetMapping("/predict")
    public ResponseEntity<?> predictWaitingTime(
            @RequestParam Long queueId,
            @RequestParam String date,
            @RequestParam Integer tokenNumber) {
        try {
            LocalDate tokenDate = LocalDate.parse(date);
            WaitingTimePredictionService.PredictionResult prediction = 
                predictionService.predictWaitingTime(queueId, tokenDate, tokenNumber);
            
            return ResponseEntity.ok(prediction);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new ErrorResponse("Failed to predict waiting time: " + e.getMessage()));
        }
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
