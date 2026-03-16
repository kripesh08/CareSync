package com.caresync.util;

import com.caresync.entity.*;
import com.caresync.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
public class DataGenerator {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private QueueRepository queueRepository;
    
    @Autowired
    private QueueTokenRepository tokenRepository;
    
    @Autowired
    private HospitalRepository hospitalRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    private Random random = new Random();
    
    @Transactional
    public void generateTestData() {
        System.out.println("Starting test data generation...");
        
        // Generate 50 patients
        List<User> patients = generatePatients(50);
        System.out.println("Generated " + patients.size() + " patients");
        
        // Get all active queues
        List<Queue> queues = queueRepository.findAll().stream()
                .filter(q -> q.getIsActive() && q.getQueueStatus() == Queue.QueueStatus.ACTIVE)
                .toList();
        
        if (queues.isEmpty()) {
            System.out.println("No active queues found. Please create queues first.");
            return;
        }
        
        System.out.println("Found " + queues.size() + " active queues");
        
        // Generate tokens for past 30 days
        LocalDate startDate = LocalDate.now().minusDays(30);
        LocalDate endDate = LocalDate.now().minusDays(1);
        
        int totalTokens = 0;
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            DayOfWeek dayOfWeek = date.getDayOfWeek();
            
            for (Queue queue : queues) {
                // Check if queue operates on this day
                if (queue.getOperatingDays() != null && 
                    !queue.getOperatingDays().contains(dayOfWeek.toString())) {
                    continue;
                }
                
                // Generate 20-40 tokens per queue per day
                int tokensForDay = 20 + random.nextInt(21);
                tokensForDay = Math.min(tokensForDay, queue.getMaxCapacity());
                
                // Get existing tokens for this queue and date to avoid duplicates
                List<QueueToken> existingTokens = tokenRepository.findByQueueAndTokenDateOrderByTokenNumberAsc(queue, date);
                int startTokenNumber = existingTokens.size() + 1;
                
                // Only generate if there's room
                int tokensToGenerate = Math.min(tokensForDay - existingTokens.size(), tokensForDay);
                
                for (int i = 0; i < tokensToGenerate; i++) {
                    User patient = patients.get(random.nextInt(patients.size()));
                    
                    // Check if patient already has token for this queue on this date
                    if (tokenRepository.findByQueueAndPatientAndTokenDate(queue, patient, date).isPresent()) {
                        continue;
                    }
                    
                    QueueToken token = createHistoricalToken(queue, patient, startTokenNumber + i, date);
                    tokenRepository.save(token);
                    totalTokens++;
                }
            }
        }
        
        System.out.println("Generated " + totalTokens + " historical tokens");
        System.out.println("Test data generation completed!");
    }
    
    private List<User> generatePatients(int count) {
        List<User> patients = new ArrayList<>();
        
        for (int i = 1; i <= count; i++) {
            // Check if user already exists
            String email = "patient" + i + "@test.com";
            if (userRepository.findByEmail(email).isPresent()) {
                patients.add(userRepository.findByEmail(email).get());
                continue;
            }
            
            User patient = new User();
            patient.setEmail(email);
            patient.setPasswordHash(passwordEncoder.encode("password123"));
            patient.setFullName("Test Patient " + i);
            patient.setPhone("98765" + String.format("%05d", i));
            patient.setRole(User.Role.PATIENT);
            patient.setIsActive(true);
            
            patients.add(userRepository.save(patient));
        }
        
        return patients;
    }
    
    private QueueToken createHistoricalToken(Queue queue, User patient, int tokenNumber, LocalDate date) {
        QueueToken token = new QueueToken();
        token.setQueue(queue);
        token.setPatient(patient);
        token.setTokenNumber(tokenNumber);
        token.setTokenDate(date);
        token.setTokenFee(new BigDecimal("50.00"));
        token.setPaymentStatus(QueueToken.PaymentStatus.COMPLETED);
        token.setPaymentTransactionId("TEST_" + System.currentTimeMillis() + "_" + random.nextInt(10000));
        
        // Simulate realistic token flow
        LocalTime startTime = queue.getStartTime() != null ? queue.getStartTime() : LocalTime.of(9, 0);
        
        // Calculate estimated time
        int minutesPerPatient = queue.getEstimatedTimePerPatient() != null ? 
                                queue.getEstimatedTimePerPatient() : 15;
        
        // Add some randomness (±5 minutes)
        minutesPerPatient += (random.nextInt(11) - 5);
        
        LocalDateTime estimatedTime = date.atTime(startTime).plusMinutes((tokenNumber - 1) * minutesPerPatient);
        token.setEstimatedTime(estimatedTime);
        
        // Most tokens are completed
        if (random.nextDouble() < 0.85) { // 85% completion rate
            token.setTokenStatus(QueueToken.TokenStatus.COMPLETED);
            
            // Called time: estimated time ± 10 minutes
            LocalDateTime calledTime = estimatedTime.plusMinutes(random.nextInt(21) - 10);
            token.setCalledAt(calledTime);
            
            // Completed time: called time + actual consultation time (10-25 minutes)
            int actualConsultationTime = 10 + random.nextInt(16);
            LocalDateTime completedTime = calledTime.plusMinutes(actualConsultationTime);
            token.setCompletedAt(completedTime);
            
        } else if (random.nextDouble() < 0.7) { // 10% cancelled
            token.setTokenStatus(QueueToken.TokenStatus.CANCELLED);
        } else { // 5% no-show
            token.setTokenStatus(QueueToken.TokenStatus.NO_SHOW);
        }
        
        return token;
    }
}
