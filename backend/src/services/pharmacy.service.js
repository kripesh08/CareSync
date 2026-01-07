const pharmacyRepository = require("../repositories/pharmacy.repository");

/**
 * Create pharmacy profile
 */
const createProfile = async (user_id, data) => {
  // Safety: prevent duplicate profile
  const existing = await pharmacyRepository.findByUserId(user_id);
  if (existing) {
    throw new Error("Pharmacy profile already exists");
  }

  return pharmacyRepository.createPharmacy({
    user_id,
    pharmacy_name: data.pharmacy_name,
    license_number: data.license_number,
    address: data.address,
    city: data.city,
  });
};

/**
 * Get pharmacy by user_id
 * Used by dashboard
 */
const getByUserId = async (user_id) => {
  const pharmacy = await pharmacyRepository.findByUserId(user_id);

  if (!pharmacy) {
    throw new Error("Pharmacy profile not found");
  }

  return pharmacy;
};

module.exports = {
  createProfile,
  getByUserId,
};
