package com.caresync.repository;

import com.caresync.entity.Queue;
import com.caresync.entity.QueueClosure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface QueueClosureRepository extends JpaRepository<QueueClosure, Long> {
    
    // Find closure for specific queue and date
    Optional<QueueClosure> findByQueueAndClosureDate(Queue queue, LocalDate closureDate);
    
    // Find all closures for a queue
    List<QueueClosure> findByQueueOrderByClosureDateAsc(Queue queue);
    
    // Find all closures for a queue after a specific date
    List<QueueClosure> findByQueueAndClosureDateGreaterThanEqualOrderByClosureDateAsc(Queue queue, LocalDate fromDate);
    
    // Check if queue is closed on a specific date
    boolean existsByQueueAndClosureDate(Queue queue, LocalDate closureDate);
}
