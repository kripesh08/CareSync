package com.caresync.service;

import com.caresync.entity.*;
import com.caresync.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class TokenService {
    
    @Autowired
    private QueueTokenRepository tokenRepository;
    
    @Autowired
    private QueueRepository queueRepository;
    
    @Autowired
    private QueueClosureRepository queueClosureRepository;
    
    @Autowired
    private HospitalRepository hospitalRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RazorpayService razorpayService;
    
    private static final BigDecimal TOKEN_FEE = new BigDecimal("50.00");
    
    // Book token (Patient)
    public QueueToken bookToken(User patient, Long queueId, LocalDate tokenDate) {
        Queue queue = queueRepository.findById(queueId)
                .orElseThrow(() -> new RuntimeException("Queue not found"));
        
        // Reject past dates
        if (tokenDate.isBefore(LocalDate.now())) {
            throw new RuntimeException("Cannot book a token for a past date");
        }

        // Check if queue is available
        if (!queue.getIsActive() || queue.getQueueStatus() != Queue.QueueStatus.ACTIVE) {
            throw new RuntimeException("Queue is not available for booking");
        }
        
        // Check if queue is closed on this specific date
        if (queueClosureRepository.existsByQueueAndClosureDate(queue, tokenDate)) {
            throw new RuntimeException("Queue is closed on this date. Please select another date.");
        }
        
        // Check if queue operates on the selected day
        if (queue.getOperatingDays() != null && !queue.getOperatingDays().isEmpty()) {
            String dayOfWeek = tokenDate.getDayOfWeek().toString();
            if (!queue.getOperatingDays().contains(dayOfWeek)) {
                throw new RuntimeException("Queue is not available on " + dayOfWeek.charAt(0) + dayOfWeek.substring(1).toLowerCase());
            }
        }
        
        // Check capacity — only count paid tokens
        long currentTokens = tokenRepository.countByQueueAndTokenDateAndPaymentStatus(queue, tokenDate, QueueToken.PaymentStatus.COMPLETED);
        if (currentTokens >= queue.getMaxCapacity()) {
            throw new RuntimeException("Queue is full for this date");
        }
        
        // Check if patient already has a pending or active token for this queue and date
        if (tokenRepository.findByQueueAndPatientAndTokenDate(queue, patient, tokenDate).isPresent()) {
            throw new RuntimeException("You already have a token for this queue on this date");
        }

        // Create reservation — token number assigned only after payment
        QueueToken token = new QueueToken(queue, patient, tokenDate, TOKEN_FEE);
        token.setPaymentStatus(QueueToken.PaymentStatus.PENDING);
        token.setTokenStatus(QueueToken.TokenStatus.WAITING);

        return tokenRepository.save(token);
    }
    
    // Process payment (Patient)
    public QueueToken processPayment(Long tokenId, User patient, String razorpayPaymentId) {
        QueueToken token = tokenRepository.findById(tokenId)
                .orElseThrow(() -> new RuntimeException("Token not found"));
        
        if (!token.getPatient().getUserId().equals(patient.getUserId())) {
            throw new RuntimeException("Unauthorized access");
        }
        
        if (token.getPaymentStatus() == QueueToken.PaymentStatus.COMPLETED) {
            throw new RuntimeException("Payment already completed");
        }
        
        // Assign token number now — first to pay gets #1
        Integer nextTokenNumber = tokenRepository.getMaxTokenNumberForQueueAndDate(
            token.getQueue().getQueueId(), token.getTokenDate()) + 1;
        token.setTokenNumber(nextTokenNumber);

        // Calculate estimated time based on assigned token number
        LocalDateTime estimatedTime = calculateEstimatedTime(token.getQueue(), nextTokenNumber, token.getTokenDate());
        token.setEstimatedTime(estimatedTime);

        // Update payment status
        token.setPaymentStatus(QueueToken.PaymentStatus.COMPLETED);
        token.setPaymentTransactionId(razorpayPaymentId);

        QueueToken saved = tokenRepository.save(token);

        // Increment queue count only after confirmed payment
        Queue queue = token.getQueue();
        queue.setCurrentCount(queue.getCurrentCount() + 1);
        queueRepository.save(queue);

        return saved;
    }
    
    // Get patient tokens
    public List<QueueToken> getPatientTokens(User patient) {
        return tokenRepository.findByPatientOrderByCreatedAtDesc(patient);
    }
    
    // Cancel token (Patient)
    public QueueToken cancelToken(Long tokenId, User patient) {
        QueueToken token = tokenRepository.findById(tokenId)
                .orElseThrow(() -> new RuntimeException("Token not found"));
        
        if (!token.getPatient().getUserId().equals(patient.getUserId())) {
            throw new RuntimeException("Unauthorized access");
        }
        
        if (token.getTokenStatus() == QueueToken.TokenStatus.IN_PROGRESS ||
            token.getTokenStatus() == QueueToken.TokenStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel token in progress or completed");
        }
        
        token.setTokenStatus(QueueToken.TokenStatus.CANCELLED);
        
        // Update queue count
        Queue queue = token.getQueue();
        queue.setCurrentCount(Math.max(0, queue.getCurrentCount() - 1));
        queueRepository.save(queue);
        
        return tokenRepository.save(token);
    }
    
    // Get hospital tokens for today (Hospital)
    public List<QueueToken> getHospitalTokensForToday(User hospitalUser) {
        Hospital hospital = getHospitalByUser(hospitalUser);
        return tokenRepository.findTokensNeedingAttention(hospital.getHospitalId(), LocalDate.now());
    }
    
    // Get hospital tokens for specific date (Hospital)
    public List<QueueToken> getHospitalTokensForDate(User hospitalUser, LocalDate date) {
        Hospital hospital = getHospitalByUser(hospitalUser);
        return tokenRepository.findTokensNeedingAttention(hospital.getHospitalId(), date);
    }
    
    @Transactional(readOnly = true)
    public List<QueueToken> getHospitalTokensByStatus(User hospitalUser, LocalDate date, QueueToken.TokenStatus status) {
        Hospital hospital = getHospitalByUser(hospitalUser);
        return tokenRepository.findByHospitalIdAndTokenDateAndTokenStatusOrderByTokenNumberAsc(hospital.getHospitalId(), date, status);
    }

    // Get all hospital tokens (Hospital)
    public List<QueueToken> getAllHospitalTokens(User hospitalUser) {
        Hospital hospital = getHospitalByUser(hospitalUser);
        return tokenRepository.findByHospitalId(hospital.getHospitalId());
    }
    
    // Call next token (Hospital)
    public QueueToken callToken(User hospitalUser, Long tokenId) {
        Hospital hospital = getHospitalByUser(hospitalUser);
        QueueToken token = tokenRepository.findById(tokenId)
                .orElseThrow(() -> new RuntimeException("Token not found"));
        
        if (!token.getQueue().getHospital().getHospitalId().equals(hospital.getHospitalId())) {
            throw new RuntimeException("Unauthorized access");
        }
        
        if (token.getTokenStatus() != QueueToken.TokenStatus.WAITING) {
            throw new RuntimeException("Token is not in waiting status");
        }

        // Ensure no other token is already IN_PROGRESS for this queue today
        List<QueueToken> inProgress = tokenRepository.findByQueueAndTokenDateAndTokenStatus(
            token.getQueue(), token.getTokenDate(), QueueToken.TokenStatus.IN_PROGRESS);
        if (!inProgress.isEmpty()) {
            throw new RuntimeException("Token #" + inProgress.get(0).getTokenNumber() + " is already in progress. Complete it before calling the next token.");
        }
        
        token.setTokenStatus(QueueToken.TokenStatus.IN_PROGRESS);
        token.setCalledAt(LocalDateTime.now());
        
        return tokenRepository.save(token);
    }
    
    // Complete token (Hospital)
    public QueueToken completeToken(User hospitalUser, Long tokenId) {
        Hospital hospital = getHospitalByUser(hospitalUser);
        QueueToken token = tokenRepository.findById(tokenId)
                .orElseThrow(() -> new RuntimeException("Token not found"));
        
        if (!token.getQueue().getHospital().getHospitalId().equals(hospital.getHospitalId())) {
            throw new RuntimeException("Unauthorized access");
        }
        
        if (token.getTokenStatus() != QueueToken.TokenStatus.IN_PROGRESS) {
            throw new RuntimeException("Token is not in progress");
        }
        
        token.setTokenStatus(QueueToken.TokenStatus.COMPLETED);
        token.setCompletedAt(LocalDateTime.now());
        
        return tokenRepository.save(token);
    }
    
    // Get token statistics (Hospital)
    public TokenStatistics getTokenStatistics(User hospitalUser, LocalDate date) {
        Hospital hospital = getHospitalByUser(hospitalUser);
        Object result = tokenRepository.getHospitalTokenStatistics(hospital.getHospitalId(), date);
        
        if (result != null) {
            Object[] stats;
            if (result instanceof List) {
                List<?> list = (List<?>) result;
                if (list.isEmpty()) return new TokenStatistics(0, 0, 0, 0);
                stats = (Object[]) list.get(0);
            } else {
                stats = (Object[]) result;
            }
            
            if (stats != null && stats.length > 0) {
                // Check if it's a nested array
                if (stats[0] != null && stats[0].getClass().isArray()) {
                    Object[] innerStats = (Object[]) stats[0];
                    
                    long totalTokens = innerStats[0] != null ? ((Number) innerStats[0]).longValue() : 0L;
                    long waitingTokens = innerStats[1] != null ? ((Number) innerStats[1]).longValue() : 0L;
                    long inProgressTokens = innerStats[2] != null ? ((Number) innerStats[2]).longValue() : 0L;
                    long completedTokens = innerStats[3] != null ? ((Number) innerStats[3]).longValue() : 0L;
                    
                    return new TokenStatistics(totalTokens, waitingTokens, inProgressTokens, completedTokens);
                } else if (stats.length >= 4) {
                    // Direct array access
                    long totalTokens = stats[0] != null ? ((Number) stats[0]).longValue() : 0L;
                    long waitingTokens = stats[1] != null ? ((Number) stats[1]).longValue() : 0L;
                    long inProgressTokens = stats[2] != null ? ((Number) stats[2]).longValue() : 0L;
                    long completedTokens = stats[3] != null ? ((Number) stats[3]).longValue() : 0L;
                    
                    return new TokenStatistics(totalTokens, waitingTokens, inProgressTokens, completedTokens);
                }
            }
        }
        
        return new TokenStatistics(0, 0, 0, 0);
    }
    
    // Get queue status for a patient's token
    public Map<String, Object> getQueueStatus(Long tokenId, User patient) {
        QueueToken token = tokenRepository.findById(tokenId)
                .orElseThrow(() -> new RuntimeException("Token not found"));
        
        if (!token.getPatient().getUserId().equals(patient.getUserId())) {
            throw new RuntimeException("Unauthorized access");
        }
        
        Map<String, Object> status = new HashMap<>();
        status.put("tokenNumber", token.getTokenNumber());
        status.put("tokenStatus", token.getTokenStatus());
        status.put("tokenDate", token.getTokenDate());
        
        // Get current token being served (IN_PROGRESS)
        List<QueueToken> inProgressTokens = tokenRepository.findByQueueAndTokenDateAndTokenStatus(
            token.getQueue(), token.getTokenDate(), QueueToken.TokenStatus.IN_PROGRESS
        );
        
        if (!inProgressTokens.isEmpty()) {
            QueueToken currentToken = inProgressTokens.get(0);
            status.put("currentTokenNumber", currentToken.getTokenNumber());
            status.put("currentTokenId", currentToken.getTokenId());
        } else {
            status.put("currentTokenNumber", null);
        }
        
        // Count tokens ahead (WAITING tokens with lower number)
        if (token.getTokenStatus() == QueueToken.TokenStatus.WAITING && token.getTokenNumber() != null) {
            long tokensAhead = tokenRepository.countByQueueAndTokenDateAndTokenStatusAndTokenNumberLessThan(
                token.getQueue(), token.getTokenDate(), QueueToken.TokenStatus.WAITING, token.getTokenNumber()
            );
            status.put("tokensAhead", tokensAhead);
        } else {
            status.put("tokensAhead", 0);
        }
        
        // Get total completed today
        long completedCount = tokenRepository.countByQueueAndTokenDateAndTokenStatus(
            token.getQueue(), token.getTokenDate(), QueueToken.TokenStatus.COMPLETED
        );
        status.put("completedToday", completedCount);
        
        // Get total tokens for the day
        long totalTokens = tokenRepository.countByQueueAndTokenDate(token.getQueue(), token.getTokenDate());
        status.put("totalTokens", totalTokens);

        // Add queue timing info for client-side estimated arrival calculation
        status.put("avgTimePerPatient", token.getQueue().getEstimatedTimePerPatient());
        status.put("queueStartTime", token.getQueue().getStartTime() != null ? token.getQueue().getStartTime().toString() : null);
        status.put("hospitalName", token.getQueue().getHospital().getHospitalName());
        status.put("departmentName", token.getQueue().getDepartmentName());
        status.put("queueName", token.getQueue().getQueueName());

        return status;
    }
    
    // Helper methods
    private LocalDateTime calculateEstimatedTime(Queue queue, Integer tokenNumber, LocalDate tokenDate) {
        if (queue.getStartTime() == null || queue.getEstimatedTimePerPatient() == null) {
            return null;
        }
        
        LocalDateTime startDateTime = tokenDate.atTime(queue.getStartTime());
        int minutesToAdd = (tokenNumber - 1) * queue.getEstimatedTimePerPatient();
        return startDateTime.plusMinutes(minutesToAdd);
    }
    
    private Hospital getHospitalByUser(User user) {
        return hospitalRepository.findByUser_UserId(user.getUserId())
                .orElseThrow(() -> new RuntimeException("Hospital profile not found for user ID: " + user.getUserId() + " (" + user.getEmail() + ")"));
    }
    
    // DTO for statistics
    public static class TokenStatistics {
        private long totalTokens;
        private long waitingTokens;
        private long inProgressTokens;
        private long completedTokens;
        
        public TokenStatistics(long totalTokens, long waitingTokens, long inProgressTokens, long completedTokens) {
            this.totalTokens = totalTokens;
            this.waitingTokens = waitingTokens;
            this.inProgressTokens = inProgressTokens;
            this.completedTokens = completedTokens;
        }
        
        public long getTotalTokens() { return totalTokens; }
        public long getWaitingTokens() { return waitingTokens; }
        public long getInProgressTokens() { return inProgressTokens; }
        public long getCompletedTokens() { return completedTokens; }
    }
}
