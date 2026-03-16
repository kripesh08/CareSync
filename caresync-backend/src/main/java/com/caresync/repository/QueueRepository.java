package com.caresync.repository;

import com.caresync.entity.Hospital;
import com.caresync.entity.Queue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QueueRepository extends JpaRepository<Queue, Long> {
    
    // Find queues by hospital
    List<Queue> findByHospitalOrderByDepartmentNameAsc(Hospital hospital);
    
    // Find active queues by hospital
    List<Queue> findByHospitalAndIsActiveTrueOrderByDepartmentNameAsc(Hospital hospital);
    
    // Find queue by hospital and queue ID
    Optional<Queue> findByHospitalAndQueueId(Hospital hospital, Long queueId);
    
    // Find queues by department
    List<Queue> findByHospitalAndDepartmentNameOrderByQueueNameAsc(Hospital hospital, String departmentName);
    
    // Find active queues by department
    List<Queue> findByHospitalAndDepartmentNameAndIsActiveTrueOrderByQueueNameAsc(Hospital hospital, String departmentName);
    
    // Get distinct departments for a hospital
    @Query("SELECT DISTINCT q.departmentName FROM Queue q WHERE q.hospital = :hospital AND q.isActive = true ORDER BY q.departmentName")
    List<String> findDistinctDepartmentsByHospital(@Param("hospital") Hospital hospital);
    
    // Count active queues by hospital
    long countByHospitalAndIsActiveTrue(Hospital hospital);
    
    // Find queues with available capacity
    @Query("SELECT q FROM Queue q WHERE q.hospital = :hospital AND q.isActive = true AND q.currentCount < q.maxCapacity AND q.queueStatus = 'ACTIVE'")
    List<Queue> findAvailableQueuesByHospital(@Param("hospital") Hospital hospital);
    
    // Search queues by department name or queue name (case-insensitive)
    @Query("SELECT q FROM Queue q WHERE q.isActive = true AND q.queueStatus = 'ACTIVE' AND " +
           "(LOWER(q.departmentName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(q.queueName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(q.description) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY q.hospital.hospitalName, q.departmentName, q.queueName")
    List<Queue> searchQueues(@Param("query") String query);
    
    // Count queues by status
    long countByIsActiveAndQueueStatus(boolean isActive, Queue.QueueStatus queueStatus);
}
