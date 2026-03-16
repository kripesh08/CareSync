package com.caresync.repository;

import com.caresync.entity.Pharmacy;
import com.caresync.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PharmacyRepository extends JpaRepository<Pharmacy, Long> {
    
    Optional<Pharmacy> findByUser_UserId(Long userId);
    
    Optional<Pharmacy> findByUser(User user);
    
    Optional<Pharmacy> findByLicenseNumber(String licenseNumber);
    
    boolean existsByLicenseNumber(String licenseNumber);
    
    List<Pharmacy> findByApprovalStatus(Pharmacy.ApprovalStatus approvalStatus);
    
    List<Pharmacy> findByCity(String city);
    
    @Query("SELECT p FROM Pharmacy p WHERE p.approvalStatus = 'APPROVED' AND p.city = :city")
    List<Pharmacy> findApprovedPharmaciesByCity(@Param("city") String city);
    
    @Query("SELECT COUNT(p) FROM Pharmacy p WHERE p.approvalStatus = :status")
    long countByApprovalStatus(@Param("status") Pharmacy.ApprovalStatus status);
}