package com.caresync.service;

import com.caresync.entity.Pharmacy;
import com.caresync.entity.User;
import com.caresync.repository.PharmacyRepository;
import com.caresync.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class PharmacyService {
    
    @Autowired
    private PharmacyRepository pharmacyRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    public Pharmacy createPharmacy(Long userId, String pharmacyName, String licenseNumber, 
                                 String address, String city) {
        // Verify user exists and has PHARMACY role
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (user.getRole() != User.Role.PHARMACY) {
            throw new RuntimeException("User must have PHARMACY role");
        }
        
        // Check if pharmacy already exists for this user
        if (pharmacyRepository.findByUser_UserId(userId).isPresent()) {
            throw new RuntimeException("Pharmacy already exists for this user");
        }
        
        // Check if license number is unique
        if (pharmacyRepository.existsByLicenseNumber(licenseNumber)) {
            throw new RuntimeException("License number already exists");
        }
        
        // Create pharmacy without contact details (using User's contact info)
        Pharmacy pharmacy = new Pharmacy(user, pharmacyName, licenseNumber, address, city);
        return pharmacyRepository.save(pharmacy);
    }
    
    @Transactional(readOnly = true)
    public List<Pharmacy> getAllPharmacies() {
        return pharmacyRepository.findAll();
    }
    
    @Transactional(readOnly = true)
    public List<Pharmacy> getApprovedPharmacies() {
        return pharmacyRepository.findByApprovalStatus(Pharmacy.ApprovalStatus.APPROVED);
    }
    
    @Transactional(readOnly = true)
    public List<Pharmacy> getPendingPharmacies() {
        return pharmacyRepository.findByApprovalStatus(Pharmacy.ApprovalStatus.PENDING);
    }
    
    @Transactional(readOnly = true)
    public Optional<Pharmacy> getPharmacyByUserId(Long userId) {
        return pharmacyRepository.findByUser_UserId(userId);
    }
    
    @Transactional(readOnly = true)
    public List<Pharmacy> getPharmaciesByCity(String city) {
        return pharmacyRepository.findApprovedPharmaciesByCity(city);
    }
    
    public Pharmacy approvePharmacy(Long pharmacyId) {
        Pharmacy pharmacy = pharmacyRepository.findById(pharmacyId)
                .orElseThrow(() -> new RuntimeException("Pharmacy not found"));
        
        pharmacy.setApprovalStatus(Pharmacy.ApprovalStatus.APPROVED);
        return pharmacyRepository.save(pharmacy);
    }
    
    public Pharmacy rejectPharmacy(Long pharmacyId, String rejectionReason) {
        Pharmacy pharmacy = pharmacyRepository.findById(pharmacyId)
                .orElseThrow(() -> new RuntimeException("Pharmacy not found"));
        
        pharmacy.setApprovalStatus(Pharmacy.ApprovalStatus.REJECTED);
        pharmacy.setRejectionReason(rejectionReason);
        return pharmacyRepository.save(pharmacy);
    }
    
    public void deletePharmacy(Long pharmacyId) {
        if (!pharmacyRepository.existsById(pharmacyId)) {
            throw new RuntimeException("Pharmacy not found");
        }
        pharmacyRepository.deleteById(pharmacyId);
    }
}