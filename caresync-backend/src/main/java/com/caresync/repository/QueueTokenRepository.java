package com.caresync.repository;

import com.caresync.entity.Queue;
import com.caresync.entity.QueueToken;
import com.caresync.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface QueueTokenRepository extends JpaRepository<QueueToken, Long> {
    
    // Find tokens by patient
    List<QueueToken> findByPatientOrderByCreatedAtDesc(User patient);
    
    // Find tokens by queue and date
    List<QueueToken> findByQueueAndTokenDateOrderByTokenNumberAsc(Queue queue, LocalDate tokenDate);
    
    // Find tokens by queue, date and status
    List<QueueToken> findByQueueAndTokenDateAndTokenStatusOrderByTokenNumberAsc(Queue queue, LocalDate tokenDate, QueueToken.TokenStatus status);
    
    // Find tokens by queue, date and status (for single result)
    List<QueueToken> findByQueueAndTokenDateAndTokenStatus(Queue queue, LocalDate tokenDate, QueueToken.TokenStatus status);
    
    // Count tokens ahead in queue
    long countByQueueAndTokenDateAndTokenStatusAndTokenNumberLessThan(Queue queue, LocalDate tokenDate, QueueToken.TokenStatus status, Integer tokenNumber);
    
    // Find patient's token for specific queue and date
    Optional<QueueToken> findByQueueAndPatientAndTokenDate(Queue queue, User patient, LocalDate tokenDate);
    
    // Get next token number for queue and date
    @Query(value = "SELECT COALESCE(MAX(CAST(token_number AS INTEGER)), 0) FROM queue_tokens WHERE queue_id = :queueId AND token_date = :tokenDate AND token_number IS NOT NULL", nativeQuery = true)
    Integer getMaxTokenNumberForQueueAndDate(@Param("queueId") Long queueId, @Param("tokenDate") LocalDate tokenDate);
    
    // Count tokens by queue and date
    long countByQueueAndTokenDate(Queue queue, LocalDate tokenDate);

    // Count paid tokens by queue and date (used for capacity check)
    long countByQueueAndTokenDateAndPaymentStatus(Queue queue, LocalDate tokenDate, QueueToken.PaymentStatus paymentStatus);
    
    // Count tokens by status for queue and date
    long countByQueueAndTokenDateAndTokenStatus(Queue queue, LocalDate tokenDate, QueueToken.TokenStatus status);
    
    // Find tokens by hospital (through queue)
    @Query("SELECT qt FROM QueueToken qt WHERE qt.queue.hospital.hospitalId = :hospitalId ORDER BY qt.createdAt DESC")
    List<QueueToken> findByHospitalId(@Param("hospitalId") Long hospitalId);
    
    // Find tokens needing attention (waiting or in progress)
    @Query("SELECT qt FROM QueueToken qt WHERE qt.queue.hospital.hospitalId = :hospitalId AND qt.tokenDate = :date AND qt.tokenStatus IN ('WAITING', 'IN_PROGRESS') ORDER BY qt.tokenNumber ASC")
    List<QueueToken> findTokensNeedingAttention(@Param("hospitalId") Long hospitalId, @Param("date") LocalDate date);
    
    // Get queue statistics for hospital
    @Query("SELECT " +
           "COUNT(qt) as totalTokens, " +
           "COALESCE(SUM(CASE WHEN qt.tokenStatus = 'WAITING' THEN 1 ELSE 0 END), 0) as waitingTokens, " +
           "COALESCE(SUM(CASE WHEN qt.tokenStatus = 'IN_PROGRESS' THEN 1 ELSE 0 END), 0) as inProgressTokens, " +
           "COALESCE(SUM(CASE WHEN qt.tokenStatus = 'COMPLETED' THEN 1 ELSE 0 END), 0) as completedTokens " +
           "FROM QueueToken qt WHERE qt.queue.hospital.hospitalId = :hospitalId AND qt.tokenDate = :date")
    Object[] getHospitalTokenStatistics(@Param("hospitalId") Long hospitalId, @Param("date") LocalDate date);
    
    // Count tokens by date
    long countByTokenDate(LocalDate tokenDate);
    
    // Count tokens by date and status
    long countByTokenDateAndTokenStatus(LocalDate tokenDate, QueueToken.TokenStatus status);
}
