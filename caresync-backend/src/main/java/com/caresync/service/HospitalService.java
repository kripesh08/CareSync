package com.caresync.service;

import com.caresync.controller.HospitalController;
import com.caresync.entity.Hospital;
import com.caresync.entity.User;
import com.caresync.repository.HospitalRepository;
import com.caresync.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class HospitalService {
    
    @Autowired
    private HospitalRepository hospitalRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Transactional(readOnly = true)
    public List<Hospital> getAllHospitals() {
        return hospitalRepository.findAll();
    }
    
    @Transactional(readOnly = true)
    public List<Hospital> getApprovedHospitals() {
        return hospitalRepository.findByApprovalStatus(Hospital.ApprovalStatus.APPROVED);
    }
    
    @Transactional(readOnly = true)
    public List<Hospital> getPendingHospitals() {
        return hospitalRepository.findByApprovalStatus(Hospital.ApprovalStatus.PENDING);
    }
    
    @Transactional(readOnly = true)
    public Hospital getHospitalByUserId(Long userId) {
        return hospitalRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException("Hospital not found for user"));
    }
    
    @Transactional(readOnly = true)
    public HospitalController.HospitalProfileResponse getHospitalProfileWithPhone(Long userId) {
        Hospital hospital = hospitalRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new RuntimeException("Hospital not found for user"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        HospitalController.HospitalProfileResponse response = new HospitalController.HospitalProfileResponse();
        response.setHospitalId(hospital.getHospitalId());
        response.setHospitalName(hospital.getHospitalName());
        response.setRegistrationNumber(hospital.getRegistrationNumber());
        response.setAddress(hospital.getAddress());
        response.setCity(hospital.getCity());
        response.setSupportedInsuranceProviders(hospital.getSupportedInsuranceProviders());
        response.setApprovalStatus(hospital.getApprovalStatus());
        response.setCreatedAt(hospital.getCreatedAt());
        response.setPhone(user.getPhone());
        
        return response;
    }
    
    @Transactional(readOnly = true)
    public List<Hospital> getHospitalsByCity(String city) {
        return hospitalRepository.findApprovedHospitalsByCity(city);
    }
    
    @Transactional(readOnly = true)
    public Hospital getHospitalById(Long hospitalId) {
        return hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new RuntimeException("Hospital not found"));
    }
    
    public Hospital approveHospital(Long hospitalId) {
        Hospital hospital = hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new RuntimeException("Hospital not found"));
        
        hospital.setApprovalStatus(Hospital.ApprovalStatus.APPROVED);
        return hospitalRepository.save(hospital);
    }
    
    public Hospital rejectHospital(Long hospitalId, String rejectionReason) {
        Hospital hospital = hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new RuntimeException("Hospital not found"));
        
        hospital.setApprovalStatus(Hospital.ApprovalStatus.REJECTED);
        hospital.setRejectionReason(rejectionReason);
        return hospitalRepository.save(hospital);
    }
    
    public void deleteHospital(Long hospitalId) {
        if (!hospitalRepository.existsById(hospitalId)) {
            throw new RuntimeException("Hospital not found");
        }
        hospitalRepository.deleteById(hospitalId);
    }
    
    @Transactional(readOnly = true)
    public long getPendingHospitalsCount() {
        return hospitalRepository.countByApprovalStatus(Hospital.ApprovalStatus.PENDING);
    }
    
    @Transactional(readOnly = true)
    public long getApprovedHospitalsCount() {
        return hospitalRepository.countByApprovalStatus(Hospital.ApprovalStatus.APPROVED);
    }
}