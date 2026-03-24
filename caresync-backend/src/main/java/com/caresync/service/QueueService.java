package com.caresync.service;

import com.caresync.entity.Hospital;
import com.caresync.entity.Queue;
import com.caresync.entity.QueueClosure;
import com.caresync.entity.QueueToken;
import com.caresync.entity.User;
import com.caresync.repository.HospitalRepository;
import com.caresync.repository.QueueClosureRepository;
import com.caresync.repository.QueueRepository;
import com.caresync.repository.QueueTokenRepository;
import com.caresync.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class QueueService {
    
    @Autowired
    private QueueRepository queueRepository;
    
    @Autowired
    private QueueTokenRepository queueTokenRepository;
    
    @Autowired
    private QueueClosureRepository queueClosureRepository;
    
    @Autowired
    private HospitalRepository hospitalRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    // Create queue (Hospital)
    public Queue createQueue(User hospitalUser, Queue queue) {
        Hospital hospital = getHospitalByUser(hospitalUser);
        queue.setHospital(hospital);
        queue.setCurrentCount(0);
        queue.setQueueStatus(Queue.QueueStatus.ACTIVE);
        return queueRepository.save(queue);
    }
    
    // Update queue (Hospital)
    public Queue updateQueue(User hospitalUser, Long queueId, Queue queueData) {
        Hospital hospital = getHospitalByUser(hospitalUser);
        Queue queue = queueRepository.findByHospitalAndQueueId(hospital, queueId)
                .orElseThrow(() -> new RuntimeException("Queue not found"));
        
        queue.setDepartmentName(queueData.getDepartmentName());
        queue.setQueueName(queueData.getQueueName());
        queue.setMaxCapacity(queueData.getMaxCapacity());
        queue.setStartTime(queueData.getStartTime());
        queue.setEndTime(queueData.getEndTime());
        queue.setEstimatedTimePerPatient(queueData.getEstimatedTimePerPatient());
        queue.setDescription(queueData.getDescription());
        queue.setOperatingDays(queueData.getOperatingDays());
        queue.setDoctorName(queueData.getDoctorName());
        
        return queueRepository.save(queue);
    }
    
    // Delete queue (Hospital) - Hard delete
    public void deleteQueue(User hospitalUser, Long queueId) {
        Hospital hospital = getHospitalByUser(hospitalUser);
        Queue queue = queueRepository.findByHospitalAndQueueId(hospital, queueId)
                .orElseThrow(() -> new RuntimeException("Queue not found"));
        
        // Delete associated records first (mandatory for hard delete)
        queueTokenRepository.deleteByQueue(queue);
        queueClosureRepository.deleteByQueue(queue);
        
        // Then delete the queue permanently
        queueRepository.delete(queue);
    }
    
    // Get all queues for hospital
    public List<Queue> getHospitalQueues(User hospitalUser) {
        Hospital hospital = getHospitalByUser(hospitalUser);
        return queueRepository.findByHospitalOrderByDepartmentNameAsc(hospital);
    }
    
    // Get departments for hospital
    public List<String> getHospitalDepartments(User hospitalUser) {
        Hospital hospital = getHospitalByUser(hospitalUser);
        return queueRepository.findDistinctDepartmentsByHospital(hospital);
    }
    
    // Get available queues (for patients)
    public List<Queue> getAvailableQueues() {
        return queueRepository.findAll().stream()
                .filter(q -> q.getIsActive() && 
                           q.getQueueStatus() == Queue.QueueStatus.ACTIVE &&
                           q.getCurrentCount() < q.getMaxCapacity())
                .toList();
    }
    
    // Get queues by hospital (for patients)
    public List<Queue> getQueuesByHospital(Long hospitalId) {
        Hospital hospital = hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new RuntimeException("Hospital not found"));
        return queueRepository.findByHospitalAndIsActiveTrueOrderByDepartmentNameAsc(hospital);
    }
    
    // Get queues by hospital with date-specific availability
    public List<Map<String, Object>> getQueuesByHospitalWithAvailability(Long hospitalId, LocalDate date) {
        Hospital hospital = hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new RuntimeException("Hospital not found"));
        List<Queue> queues = queueRepository.findByHospitalAndIsActiveTrueOrderByDepartmentNameAsc(hospital);
        
        return queues.stream().map(queue -> {
            Map<String, Object> queueData = new HashMap<>();
            queueData.put("queueId", queue.getQueueId());
            queueData.put("departmentName", queue.getDepartmentName());
            queueData.put("queueName", queue.getQueueName());
            queueData.put("maxCapacity", queue.getMaxCapacity());
            queueData.put("startTime", queue.getStartTime());
            queueData.put("endTime", queue.getEndTime());
            queueData.put("estimatedTimePerPatient", queue.getEstimatedTimePerPatient());
            queueData.put("description", queue.getDescription());
            queueData.put("queueStatus", queue.getQueueStatus());
            queueData.put("operatingDays", queue.getOperatingDays());
            queueData.put("doctorName", queue.getDoctorName());
            queueData.put("hospital", queue.getHospital());
            
            // Get booked count for the specific date
            long bookedCount = queueTokenRepository.countByQueueAndTokenDate(queue, date);
            queueData.put("bookedCount", bookedCount);
            queueData.put("availableSlots", queue.getMaxCapacity() - bookedCount);
            
            return queueData;
        }).toList();
    }
    
    // Search queues by department or consultation type
    public List<Queue> searchQueues(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAvailableQueues();
        }
        return queueRepository.searchQueues(query.trim());
    }
    
    // Search queues with date-specific availability
    public List<Map<String, Object>> searchQueuesWithAvailability(String query, LocalDate date) {
        List<Queue> queues;
        if (query == null || query.trim().isEmpty()) {
            queues = getAvailableQueues();
        } else {
            queues = queueRepository.searchQueues(query.trim());
        }
        
        return queues.stream().map(queue -> {
            Map<String, Object> queueData = new HashMap<>();
            queueData.put("queueId", queue.getQueueId());
            queueData.put("departmentName", queue.getDepartmentName());
            queueData.put("queueName", queue.getQueueName());
            queueData.put("maxCapacity", queue.getMaxCapacity());
            queueData.put("startTime", queue.getStartTime());
            queueData.put("endTime", queue.getEndTime());
            queueData.put("estimatedTimePerPatient", queue.getEstimatedTimePerPatient());
            queueData.put("description", queue.getDescription());
            queueData.put("queueStatus", queue.getQueueStatus());
            queueData.put("operatingDays", queue.getOperatingDays());
            queueData.put("doctorName", queue.getDoctorName());
            queueData.put("hospital", queue.getHospital());
            
            // Get booked count for the specific date
            long bookedCount = queueTokenRepository.countByQueueAndTokenDate(queue, date);
            queueData.put("bookedCount", bookedCount);
            queueData.put("availableSlots", queue.getMaxCapacity() - bookedCount);
            
            return queueData;
        }).toList();
    }
    
    // Get hospital dashboard statistics
    public Map<String, Object> getHospitalDashboardStats(User hospitalUser) {
        Hospital hospital = getHospitalByUser(hospitalUser);
        LocalDate today = LocalDate.now();
        
        Map<String, Object> stats = new HashMap<>();
        
        // Active queues count
        long activeQueues = queueRepository.countByHospitalAndIsActiveTrue(hospital);
        stats.put("activeQueues", activeQueues);
        
        // Today's token statistics
        Object result = queueTokenRepository.getHospitalTokenStatistics(hospital.getHospitalId(), today);
        if (result != null) {
            Object[] tokenStats;
            if (result instanceof List) {
                List<?> list = (List<?>) result;
                if (list.isEmpty()) {
                    tokenStats = new Object[0];
                } else {
                    Object first = list.get(0);
                    if (first instanceof Object[]) {
                        tokenStats = (Object[]) first;
                    } else {
                        tokenStats = new Object[]{first};
                    }
                }
            } else if (result instanceof Object[]) {
                tokenStats = (Object[]) result;
            } else {
                tokenStats = new Object[]{result};
            }

            if (tokenStats.length > 0) {
                // Check if the first element is ITSELF an array (defensive check for nested results)
                if (tokenStats[0] != null && tokenStats[0].getClass().isArray()) {
                    Object[] innerStats = (Object[]) tokenStats[0];
                    stats.put("todayTokens", innerStats.length > 0 && innerStats[0] != null ? ((Number) innerStats[0]).longValue() : 0L);
                    stats.put("waitingTokens", innerStats.length > 1 && innerStats[1] != null ? ((Number) innerStats[1]).longValue() : 0L);
                    stats.put("inProgressTokens", innerStats.length > 2 && innerStats[2] != null ? ((Number) innerStats[2]).longValue() : 0L);
                    stats.put("completedTokens", innerStats.length > 3 && innerStats[3] != null ? ((Number) innerStats[3]).longValue() : 0L);
                } else {
                    stats.put("todayTokens", tokenStats.length > 0 && tokenStats[0] != null ? ((Number) tokenStats[0]).longValue() : 0L);
                    stats.put("waitingTokens", tokenStats.length > 1 && tokenStats[1] != null ? ((Number) tokenStats[1]).longValue() : 0L);
                    stats.put("inProgressTokens", tokenStats.length > 2 && tokenStats[2] != null ? ((Number) tokenStats[2]).longValue() : 0L);
                    stats.put("completedTokens", tokenStats.length > 3 && tokenStats[3] != null ? ((Number) tokenStats[3]).longValue() : 0L);
                }
            } else {
                stats.put("todayTokens", 0L);
                stats.put("waitingTokens", 0L);
                stats.put("inProgressTokens", 0L);
                stats.put("completedTokens", 0L);
            }
        } else {
            stats.put("todayTokens", 0L);
            stats.put("waitingTokens", 0L);
            stats.put("inProgressTokens", 0L);
            stats.put("completedTokens", 0L);
        }
        
        // Tokens needing attention (waiting + in progress)
        List<?> tokensNeedingAttention = queueTokenRepository.findTokensNeedingAttention(hospital.getHospitalId(), today);
        stats.put("tokensNeedingAttention", tokensNeedingAttention.size());
        
        return stats;
    }
    
    // Helper method
    private Hospital getHospitalByUser(User user) {
        return hospitalRepository.findByUser_UserId(user.getUserId())
                .orElseThrow(() -> new RuntimeException("Hospital profile not found for user ID: " + user.getUserId() + " (" + user.getEmail() + ")"));
    }
    
    // Get today's booked count for a queue
    public long getTodayBookedCount(Queue queue, LocalDate date) {
        return queueTokenRepository.countByQueueAndTokenDateAndPaymentStatus(queue, date, QueueToken.PaymentStatus.COMPLETED);
    }
    
    // ===== QUEUE CLOSURE MANAGEMENT =====
    
    // Add closure for specific date
    public QueueClosure addQueueClosure(User hospitalUser, Long queueId, LocalDate closureDate, String reason) {
        Hospital hospital = getHospitalByUser(hospitalUser);
        Queue queue = queueRepository.findByHospitalAndQueueId(hospital, queueId)
                .orElseThrow(() -> new RuntimeException("Queue not found"));
        
        // Check if closure already exists
        if (queueClosureRepository.existsByQueueAndClosureDate(queue, closureDate)) {
            throw new RuntimeException("Closure already exists for this date");
        }
        
        QueueClosure closure = new QueueClosure(queue, closureDate, reason);
        return queueClosureRepository.save(closure);
    }
    
    // Remove closure for specific date
    public void removeQueueClosure(User hospitalUser, Long closureId) {
        QueueClosure closure = queueClosureRepository.findById(closureId)
                .orElseThrow(() -> new RuntimeException("Closure not found"));
        
        Hospital hospital = getHospitalByUser(hospitalUser);
        if (!closure.getQueue().getHospital().getHospitalId().equals(hospital.getHospitalId())) {
            throw new RuntimeException("Unauthorized access");
        }
        
        queueClosureRepository.delete(closure);
    }
    
    // Get all closures for a queue
    public List<QueueClosure> getQueueClosures(User hospitalUser, Long queueId) {
        Hospital hospital = getHospitalByUser(hospitalUser);
        Queue queue = queueRepository.findByHospitalAndQueueId(hospital, queueId)
                .orElseThrow(() -> new RuntimeException("Queue not found"));
        
        return queueClosureRepository.findByQueueAndClosureDateGreaterThanEqualOrderByClosureDateAsc(
            queue, LocalDate.now()
        );
    }
    
    // Check if queue is closed on a specific date
    public boolean isQueueClosedOnDate(Queue queue, LocalDate date) {
        return queueClosureRepository.existsByQueueAndClosureDate(queue, date);
    }
    
    // Toggle queue status (ACTIVE <-> PAUSED)
    public Queue toggleQueueStatus(User hospitalUser, Long queueId) {
        Hospital hospital = getHospitalByUser(hospitalUser);
        Queue queue = queueRepository.findByHospitalAndQueueId(hospital, queueId)
                .orElseThrow(() -> new RuntimeException("Queue not found"));
        
        // Toggle between ACTIVE and PAUSED only
        if (queue.getQueueStatus() == Queue.QueueStatus.ACTIVE || queue.getQueueStatus() == Queue.QueueStatus.FULL) {
            queue.setQueueStatus(Queue.QueueStatus.PAUSED);
        } else if (queue.getQueueStatus() == Queue.QueueStatus.PAUSED || queue.getQueueStatus() == Queue.QueueStatus.CLOSED) {
            queue.setQueueStatus(Queue.QueueStatus.ACTIVE);
        }
        
        return queueRepository.save(queue);
    }

    // Temporary method to cleanup inactive queues from database
    @jakarta.annotation.PostConstruct
    public void cleanupExistingInactiveQueues() {
        try {
            List<Queue> inactiveQueues = queueRepository.findAll().stream()
                    .filter(q -> !q.getIsActive())
                    .toList();
            
            if (!inactiveQueues.isEmpty()) {
                System.out.println("Cleaning up " + inactiveQueues.size() + " inactive queues...");
                for (Queue queue : inactiveQueues) {
                    queueTokenRepository.deleteByQueue(queue);
                    queueClosureRepository.deleteByQueue(queue);
                    queueRepository.delete(queue);
                    System.out.println("Hard deleted queue ID: " + queue.getQueueId());
                }
            }
        } catch (Exception e) {
            System.err.println("Error during inactive queue cleanup: " + e.getMessage());
        }
    }
}
