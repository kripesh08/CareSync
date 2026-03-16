package com.caresync.repository;

import com.caresync.entity.Hospital;
import com.caresync.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HospitalRepository extends JpaRepository<Hospital, Long> {
    
    Optional<Hospital> findByUser(User user);
    
    Optional<Hospital> findByUser_UserId(Long userId);
    
    Optional<Hospital> findByRegistrationNumber(String registrationNumber);
    
    boolean existsByRegistrationNumber(String registrationNumber);
    
    List<Hospital> findByApprovalStatus(Hospital.ApprovalStatus approvalStatus);
    
    List<Hospital> findByCity(String city);
    
    @Query("SELECT h FROM Hospital h WHERE h.approvalStatus = 'APPROVED' AND h.city = :city")
    List<Hospital> findApprovedHospitalsByCity(@Param("city") String city);
    
    @Query("SELECT COUNT(h) FROM Hospital h WHERE h.approvalStatus = :status")
    long countByApprovalStatus(@Param("status") Hospital.ApprovalStatus status);
}