package com.caresync.dto;

import com.caresync.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public class RegisterRequest {
    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name must not exceed 100 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Size(max = 15, message = "Phone must not exceed 15 characters")
    private String phone;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotNull(message = "Role is required")
    private User.Role role;

    // Nested objects for role-specific data
    private PharmacyData pharmacyData;
    private HospitalData hospitalData;

    // Constructors
    public RegisterRequest() {}

    // Getters and Setters
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public User.Role getRole() { return role; }
    public void setRole(User.Role role) { this.role = role; }

    public PharmacyData getPharmacyData() { return pharmacyData; }
    public void setPharmacyData(PharmacyData pharmacyData) { this.pharmacyData = pharmacyData; }

    public HospitalData getHospitalData() { return hospitalData; }
    public void setHospitalData(HospitalData hospitalData) { this.hospitalData = hospitalData; }

    // Nested classes for role-specific data
    public static class PharmacyData {
        @NotBlank(message = "Pharmacy name is required")
        @Size(max = 200, message = "Pharmacy name must not exceed 200 characters")
        private String pharmacyName;

        @NotBlank(message = "License number is required")
        @Size(max = 100, message = "License number must not exceed 100 characters")
        private String licenseNumber;

        @NotBlank(message = "Address is required")
        @Size(max = 500, message = "Address must not exceed 500 characters")
        private String address;

        @NotBlank(message = "City is required")
        @Size(max = 100, message = "City must not exceed 100 characters")
        private String city;

        // Constructors
        public PharmacyData() {}

        // Getters and Setters
        public String getPharmacyName() { return pharmacyName; }
        public void setPharmacyName(String pharmacyName) { this.pharmacyName = pharmacyName; }

        public String getLicenseNumber() { return licenseNumber; }
        public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }

        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }

        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }
    }

    public static class HospitalData {
        @NotBlank(message = "Hospital name is required")
        @Size(max = 200, message = "Hospital name must not exceed 200 characters")
        private String hospitalName;

        @NotBlank(message = "Registration/License number is required")
        @Size(max = 100, message = "Registration number must not exceed 100 characters")
        private String registrationNumber;

        @NotBlank(message = "Hospital address is required")
        @Size(max = 500, message = "Address must not exceed 500 characters")
        private String address;

        @NotBlank(message = "City is required")
        @Size(max = 100, message = "City must not exceed 100 characters")
        private String city;

        @NotNull(message = "Supported insurance providers list is required")
        private List<String> supportedInsuranceProviders;

        // Constructors
        public HospitalData() {}

        // Getters and Setters
        public String getHospitalName() { return hospitalName; }
        public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }

        public String getRegistrationNumber() { return registrationNumber; }
        public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }

        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }

        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }

        public List<String> getSupportedInsuranceProviders() { return supportedInsuranceProviders; }
        public void setSupportedInsuranceProviders(List<String> supportedInsuranceProviders) { 
            this.supportedInsuranceProviders = supportedInsuranceProviders; 
        }
    }
}