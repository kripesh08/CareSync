package com.caresync.service;

import com.caresync.entity.Medicine;
import com.caresync.entity.Pharmacy;
import com.caresync.entity.User;
import com.caresync.repository.MedicineRepository;
import com.caresync.repository.PharmacyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class MedicineService {
    
    @Autowired
    private MedicineRepository medicineRepository;
    
    @Autowired
    private PharmacyRepository pharmacyRepository;
    
    // Get pharmacy by user
    private Pharmacy getPharmacyByUser(User user) {
        return pharmacyRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Pharmacy profile not found for user"));
    }
    
    // Add new medicine
    public Medicine addMedicine(User pharmacyUser, Medicine medicine) {
        Pharmacy pharmacy = getPharmacyByUser(pharmacyUser);
        
        // Check if pharmacy is approved
        if (pharmacy.getApprovalStatus() != Pharmacy.ApprovalStatus.APPROVED) {
            throw new RuntimeException("Pharmacy must be approved to add medicines");
        }
        
        // Check for duplicate medicine name in the same pharmacy
        if (medicineRepository.existsByPharmacyAndMedicineNameIgnoreCase(pharmacy, medicine.getMedicineName())) {
            throw new RuntimeException("Medicine with this name already exists in your pharmacy");
        }
        
        medicine.setPharmacy(pharmacy);
        medicine.setIsActive(true);
        
        return medicineRepository.save(medicine);
    }
    
    // Update medicine
    public Medicine updateMedicine(User pharmacyUser, Long medicineId, Medicine updatedMedicine) {
        Pharmacy pharmacy = getPharmacyByUser(pharmacyUser);
        
        Medicine existingMedicine = medicineRepository.findByPharmacyAndMedicineId(pharmacy, medicineId)
                .orElseThrow(() -> new RuntimeException("Medicine not found"));
        
        // Check for duplicate name (excluding current medicine)
        if (!existingMedicine.getMedicineName().equalsIgnoreCase(updatedMedicine.getMedicineName()) &&
            medicineRepository.existsByPharmacyAndMedicineNameIgnoreCase(pharmacy, updatedMedicine.getMedicineName())) {
            throw new RuntimeException("Medicine with this name already exists in your pharmacy");
        }
        
        // Update fields
        existingMedicine.setMedicineName(updatedMedicine.getMedicineName());
        existingMedicine.setGenericName(updatedMedicine.getGenericName());
        existingMedicine.setManufacturer(updatedMedicine.getManufacturer());
        existingMedicine.setDescription(updatedMedicine.getDescription());
        existingMedicine.setPrice(updatedMedicine.getPrice());
        existingMedicine.setStockQuantity(updatedMedicine.getStockQuantity());
        existingMedicine.setCategory(updatedMedicine.getCategory());
        existingMedicine.setRequiresPrescription(updatedMedicine.getRequiresPrescription());
        existingMedicine.setDosageForm(updatedMedicine.getDosageForm());
        existingMedicine.setStrength(updatedMedicine.getStrength());
        
        return medicineRepository.save(existingMedicine);
    }
    
    // Delete medicine (soft delete)
    public void deleteMedicine(User pharmacyUser, Long medicineId) {
        Pharmacy pharmacy = getPharmacyByUser(pharmacyUser);
        
        Medicine medicine = medicineRepository.findByPharmacyAndMedicineId(pharmacy, medicineId)
                .orElseThrow(() -> new RuntimeException("Medicine not found"));
        
        medicine.setIsActive(false);
        medicineRepository.save(medicine);
    }
    
    // Get all medicines for a pharmacy
    public List<Medicine> getMedicinesByPharmacy(User pharmacyUser) {
        Pharmacy pharmacy = getPharmacyByUser(pharmacyUser);
        return medicineRepository.findByPharmacyAndIsActiveTrue(pharmacy);
    }
    
    // Get medicine by ID for a pharmacy
    public Medicine getMedicineById(User pharmacyUser, Long medicineId) {
        Pharmacy pharmacy = getPharmacyByUser(pharmacyUser);
        return medicineRepository.findByPharmacyAndMedicineId(pharmacy, medicineId)
                .orElseThrow(() -> new RuntimeException("Medicine not found"));
    }
    
    // Search medicines (public - for customers)
    public List<Medicine> searchMedicines(String name, String category, Boolean requiresPrescription) {
        if ((name == null || name.trim().isEmpty()) && category == null && requiresPrescription == null) {
            // Return all active medicines if no filters provided
            return medicineRepository.findAll().stream()
                    .filter(Medicine::getIsActive)
                    .toList();
        }
        return medicineRepository.searchMedicines(name, category, requiresPrescription);
    }
    
    // Search medicines by name (public - for customers)
    public List<Medicine> searchMedicinesByName(String name) {
        if (name == null || name.trim().isEmpty()) {
            // Return all active medicines if search term is empty
            return medicineRepository.findAll().stream()
                    .filter(Medicine::getIsActive)
                    .toList();
        }
        return medicineRepository.findByMedicineNameContainingIgnoreCase(name);
    }
    
    // Get medicines by category (public - for customers)
    public List<Medicine> getMedicinesByCategory(String category) {
        return medicineRepository.findByCategoryAndIsActiveTrue(category);
    }
    
    // Get medicine details by ID (public - for customers)
    public Medicine getMedicineDetails(Long medicineId) {
        return medicineRepository.findById(medicineId)
                .filter(Medicine::getIsActive)
                .orElseThrow(() -> new RuntimeException("Medicine not found or not available"));
    }
    
    // Update stock quantity
    public Medicine updateStock(User pharmacyUser, Long medicineId, Integer newStockQuantity) {
        Pharmacy pharmacy = getPharmacyByUser(pharmacyUser);
        
        Medicine medicine = medicineRepository.findByPharmacyAndMedicineId(pharmacy, medicineId)
                .orElseThrow(() -> new RuntimeException("Medicine not found"));
        
        medicine.setStockQuantity(newStockQuantity);
        return medicineRepository.save(medicine);
    }
    
    // Reduce stock (for order processing)
    public Medicine reduceStock(Long medicineId, Integer quantity) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new RuntimeException("Medicine not found"));
        
        if (medicine.getStockQuantity() < quantity) {
            throw new RuntimeException("Insufficient stock. Available: " + medicine.getStockQuantity() + ", Required: " + quantity);
        }
        
        medicine.setStockQuantity(medicine.getStockQuantity() - quantity);
        return medicineRepository.save(medicine);
    }
    
    // Get low stock medicines for a pharmacy
    public List<Medicine> getLowStockMedicines(User pharmacyUser, Integer threshold) {
        Pharmacy pharmacy = getPharmacyByUser(pharmacyUser);
        return medicineRepository.findLowStockMedicinesByPharmacy(pharmacy, threshold != null ? threshold : 10);
    }
    
    // Get pharmacy statistics
    public PharmacyMedicineStats getPharmacyMedicineStats(User pharmacyUser) {
        Pharmacy pharmacy = getPharmacyByUser(pharmacyUser);
        
        long totalMedicines = medicineRepository.countByPharmacyAndIsActiveTrue(pharmacy);
        List<Medicine> lowStockMedicines = medicineRepository.findLowStockMedicinesByPharmacy(pharmacy, 10);
        long prescriptionMedicines = medicineRepository.findByPharmacy(pharmacy).stream()
                .mapToLong(m -> m.getRequiresPrescription() ? 1 : 0)
                .sum();
        
        return new PharmacyMedicineStats(totalMedicines, lowStockMedicines.size(), prescriptionMedicines);
    }
    
    // DTO for pharmacy medicine statistics
    public static class PharmacyMedicineStats {
        private long totalMedicines;
        private long lowStockCount;
        private long prescriptionMedicinesCount;
        
        public PharmacyMedicineStats(long totalMedicines, long lowStockCount, long prescriptionMedicinesCount) {
            this.totalMedicines = totalMedicines;
            this.lowStockCount = lowStockCount;
            this.prescriptionMedicinesCount = prescriptionMedicinesCount;
        }
        
        // Getters
        public long getTotalMedicines() { return totalMedicines; }
        public long getLowStockCount() { return lowStockCount; }
        public long getPrescriptionMedicinesCount() { return prescriptionMedicinesCount; }
    }
    
    // Admin methods
    @Transactional(readOnly = true)
    public List<Medicine> getAllMedicines() {
        return medicineRepository.findAll();
    }
    
    public void deleteMedicineByAdmin(Long medicineId) {
        if (!medicineRepository.existsById(medicineId)) {
            throw new RuntimeException("Medicine not found");
        }
        medicineRepository.deleteById(medicineId);
    }
}
