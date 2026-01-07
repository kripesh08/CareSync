const pharmacyRepo = require("../repositories/pharmacy.repository");

/**
 * Create pharmacy profile (business logic)
 */
const createProfile = async (user_id, data) => {
  const existing = await pharmacyRepo.findByUserId(user_id);

  if (existing) {
    throw new Error("Pharmacy profile already exists");
  }

  return pharmacyRepo.createPharmacy({
    user_id,
    pharmacy_name: data.pharmacy_name,
    license_number: data.license_number,
    address: data.address,
    city: data.city,
  });
};

module.exports = {
  createProfile,
};
