package com.caresync.service;

import com.caresync.dto.AuthRequest;
import com.caresync.dto.AuthResponse;
import com.caresync.dto.RegisterRequest;
import com.caresync.entity.Hospital;
import com.caresync.entity.Pharmacy;
import com.caresync.entity.User;
import com.caresync.repository.HospitalRepository;
import com.caresync.repository.PharmacyRepository;
import com.caresync.repository.UserRepository;
import com.caresync.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PharmacyRepository pharmacyRepository;
    
    @Autowired
    private HospitalRepository hospitalRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    public AuthResponse register(RegisterRequest request) {
        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("User already exists with email: " + request.getEmail());
        }
        
        // Create new user
        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setIsActive(true);
        
        User savedUser = userRepository.save(user);
        
        // Handle role-specific registration
        boolean needsApproval = false;
        String message = "Registration successful";
        
        switch (request.getRole()) {
            case PHARMACY:
                needsApproval = handlePharmacyRegistration(savedUser, request.getPharmacyData());
                message = "Pharmacy registration submitted for approval";
                break;
            case HOSPITAL:
                needsApproval = handleHospitalRegistration(savedUser, request.getHospitalData());
                message = "Hospital registration submitted for approval";
                break;
            case PATIENT:
                // Patients are approved immediately
                break;
            case ADMIN:
                // Admins should not register through this endpoint
                throw new RuntimeException("Admin registration not allowed through this endpoint");
        }
        
        // Generate JWT token
        String token = jwtUtil.generateToken(savedUser.getUserId(), savedUser.getRole().name());
        
        return new AuthResponse(token, savedUser.getRole(), message, !needsApproval);
    }
    
    private boolean handlePharmacyRegistration(User user, RegisterRequest.PharmacyData pharmacyData) {
        if (pharmacyData == null) {
            throw new RuntimeException("Pharmacy data is required for pharmacy registration");
        }
        
        // Check if user already has a pharmacy profile (for re-registration after rejection)
        Optional<Pharmacy> existingPharmacy = pharmacyRepository.findByUser(user);
        if (existingPharmacy.isPresent()) {
            Pharmacy pharmacy = existingPharmacy.get();
            // Allow re-registration only if previously rejected
            if (pharmacy.getApprovalStatus() == Pharmacy.ApprovalStatus.REJECTED) {
                // Delete old rejected pharmacy profile
                pharmacyRepository.delete(pharmacy);
            } else {
                throw new RuntimeException("Pharmacy profile already exists for this user");
            }
        }
        
        // Check if license number already exists
        if (pharmacyRepository.existsByLicenseNumber(pharmacyData.getLicenseNumber())) {
            throw new RuntimeException("Pharmacy with this license number already exists");
        }
        
        Pharmacy pharmacy = new Pharmacy();
        pharmacy.setUser(user);
        pharmacy.setPharmacyName(pharmacyData.getPharmacyName());
        pharmacy.setLicenseNumber(pharmacyData.getLicenseNumber());
        pharmacy.setAddress(pharmacyData.getAddress());
        pharmacy.setCity(pharmacyData.getCity());
        pharmacy.setApprovalStatus(Pharmacy.ApprovalStatus.PENDING); // Requires approval
        pharmacy.setRejectionReason(null); // Clear any old rejection reason
        
        pharmacyRepository.save(pharmacy);
        return true; // Needs approval
    }
    
    private boolean handleHospitalRegistration(User user, RegisterRequest.HospitalData hospitalData) {
        if (hospitalData == null) {
            throw new RuntimeException("Hospital data is required for hospital registration");
        }
        
        // Check if user already has a hospital profile (for re-registration after rejection)
        Optional<Hospital> existingHospital = hospitalRepository.findByUser(user);
        if (existingHospital.isPresent()) {
            Hospital hospital = existingHospital.get();
            // Allow re-registration only if previously rejected
            if (hospital.getApprovalStatus() == Hospital.ApprovalStatus.REJECTED) {
                // Delete old rejected hospital profile
                hospitalRepository.delete(hospital);
            } else {
                throw new RuntimeException("Hospital profile already exists for this user");
            }
        }
        
        Hospital hospital = new Hospital();
        hospital.setUser(user);
        hospital.setHospitalName(hospitalData.getHospitalName());
        hospital.setRegistrationNumber(hospitalData.getRegistrationNumber());
        hospital.setAddress(hospitalData.getAddress());
        hospital.setCity(hospitalData.getCity());
        hospital.setSupportedInsuranceProviders(hospitalData.getSupportedInsuranceProviders());
        hospital.setApprovalStatus(Hospital.ApprovalStatus.PENDING); // Requires approval
        hospital.setRejectionReason(null); // Clear any old rejection reason
        
        hospitalRepository.save(hospital);
        return true; // Needs approval
    }
    
    public AuthResponse login(AuthRequest request) {
        // Check for super admin credentials first
        if ("admin@caresync.com".equals(request.getEmail()) && "admin123".equals(request.getPassword())) {
            // Generate JWT token for super admin (using ID 0 for super admin)
            String token = jwtUtil.generateToken(0L, "ADMIN");
            return new AuthResponse(token, User.Role.ADMIN, "Super Admin login successful", true);
        }
        
        // Find user by email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));
        
        // Check if user is active
        if (!user.getIsActive()) {
            throw new RuntimeException("Your account has been deactivated. Please contact the administrator for assistance.");
        }
        
        // For pharmacy and hospital users, check if they are approved
        if (user.getRole() == User.Role.PHARMACY) {
            Pharmacy pharmacy = pharmacyRepository.findByUser(user)
                    .orElseThrow(() -> new RuntimeException("Pharmacy profile not found"));
            if (pharmacy.getApprovalStatus() == Pharmacy.ApprovalStatus.PENDING) {
                throw new RuntimeException("Your pharmacy registration is still pending approval");
            } else if (pharmacy.getApprovalStatus() == Pharmacy.ApprovalStatus.REJECTED) {
                String message = "Your pharmacy registration was rejected";
                if (pharmacy.getRejectionReason() != null && !pharmacy.getRejectionReason().isEmpty()) {
                    message += ": " + pharmacy.getRejectionReason();
                }
                message += ". Please contact admin or re-register with correct information.";
                throw new RuntimeException(message);
            }
        } else if (user.getRole() == User.Role.HOSPITAL) {
            Hospital hospital = hospitalRepository.findByUser(user)
                    .orElseThrow(() -> new RuntimeException("Hospital profile not found"));
            if (hospital.getApprovalStatus() == Hospital.ApprovalStatus.PENDING) {
                throw new RuntimeException("Your hospital registration is still pending approval");
            } else if (hospital.getApprovalStatus() == Hospital.ApprovalStatus.REJECTED) {
                String message = "Your hospital registration was rejected";
                if (hospital.getRejectionReason() != null && !hospital.getRejectionReason().isEmpty()) {
                    message += ": " + hospital.getRejectionReason();
                }
                message += ". Please contact admin or re-register with correct information.";
                throw new RuntimeException(message);
            }
        }
        
        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }
        
        // Generate JWT token
        String token = jwtUtil.generateToken(user.getUserId(), user.getRole().name());
        
        return new AuthResponse(token, user.getRole(), "Login successful");
    }
    
    @Transactional(readOnly = true)
    public User getCurrentUser(Long userId) {
        // Handle super admin case
        if (userId == 0L) {
            // Create a virtual super admin user object
            User superAdmin = new User();
            superAdmin.setUserId(0L);
            superAdmin.setFullName("Super Administrator");
            superAdmin.setEmail("admin@caresync.com");
            superAdmin.setPhone("N/A");
            superAdmin.setRole(User.Role.ADMIN);
            superAdmin.setIsActive(true);
            return superAdmin;
        }
        
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
    
    public User updateUser(User user) {
        return userRepository.save(user);
    }
}