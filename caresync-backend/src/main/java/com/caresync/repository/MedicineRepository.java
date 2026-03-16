package com.caresync.repository;

import com.caresync.entity.Medicine;
import com.caresync.entity.Pharmacy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    
    // Find medicines by pharmacy
    List<Medicine> findByPharmacy(Pharmacy pharmacy);
    
    // Find active medicines by pharmacy
    List<Medicine> findByPharmacyAndIsActiveTrue(Pharmacy pharmacy);
    
    // Find medicine by pharmacy and medicine ID
    Optional<Medicine> findByPharmacyAndMedicineId(Pharmacy pharmacy, Long medicineId);
    
    // Search medicines by name (case-insensitive)
    @Query("SELECT m FROM Medicine m WHERE LOWER(m.medicineName) LIKE LOWER(CONCAT('%', :name, '%')) AND m.isActive = true")
    List<Medicine> findByMedicineNameContainingIgnoreCase(@Param("name") String name);
    
    // Search medicines by generic name (case-insensitive)
    @Query("SELECT m FROM Medicine m WHERE LOWER(m.genericName) LIKE LOWER(CONCAT('%', :genericName, '%')) AND m.isActive = true")
    List<Medicine> findByGenericNameContainingIgnoreCase(@Param("genericName") String genericName);
    
    // Find medicines by category
    List<Medicine> findByCategoryAndIsActiveTrue(String category);
    
    // Find medicines that require prescription
    List<Medicine> findByRequiresPrescriptionTrueAndIsActiveTrue();
    
    // Find medicines with low stock (less than specified quantity)
    @Query("SELECT m FROM Medicine m WHERE m.stockQuantity < :threshold AND m.isActive = true")
    List<Medicine> findLowStockMedicines(@Param("threshold") Integer threshold);
    
    // Find medicines by pharmacy with low stock
    @Query("SELECT m FROM Medicine m WHERE m.pharmacy = :pharmacy AND m.stockQuantity < :threshold AND m.isActive = true")
    List<Medicine> findLowStockMedicinesByPharmacy(@Param("pharmacy") Pharmacy pharmacy, @Param("threshold") Integer threshold);
    
    // Search medicines by multiple criteria
    @Query("SELECT m FROM Medicine m WHERE " +
           "(:name IS NULL OR LOWER(m.medicineName) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
           "(:category IS NULL OR m.category = :category) AND " +
           "(:requiresPrescription IS NULL OR m.requiresPrescription = :requiresPrescription) AND " +
           "m.isActive = true")
    List<Medicine> searchMedicines(@Param("name") String name, 
                                  @Param("category") String category, 
                                  @Param("requiresPrescription") Boolean requiresPrescription);
    
    // Count medicines by pharmacy
    long countByPharmacy(Pharmacy pharmacy);
    
    // Count active medicines by pharmacy
    long countByPharmacyAndIsActiveTrue(Pharmacy pharmacy);
    
    // Check if medicine name exists for a pharmacy (for duplicate prevention)
    boolean existsByPharmacyAndMedicineNameIgnoreCase(Pharmacy pharmacy, String medicineName);
}