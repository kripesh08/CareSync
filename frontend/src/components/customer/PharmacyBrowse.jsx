import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Phone, Mail, Package, Pill, ShoppingCart, ArrowLeft, Search, Filter } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const PharmacyBrowse = () => {
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [medicinesLoading, setMedicinesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({
    quantity: 1,
    customerNotes: '',
    deliveryAddress: '',
    deliveryPhone: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchPharmacies();
  }, []);

  const fetchPharmacies = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8081/api/pharmacy/approved');
      if (response.ok) {
        const data = await response.json();
        setPharmacies(data);
      } else {
        toast.error('Failed to fetch pharmacies');
      }
    } catch (error) {
      console.error('Error fetching pharmacies:', error);
      toast.error('Error fetching pharmacies');
    } finally {
      setLoading(false);
    }
  };

  const fetchPharmacyMedicines = async (pharmacyId) => {
    setMedicinesLoading(true);
    try {
      const response = await fetch(`http://localhost:8081/api/medicines/search?name=`);
      if (response.ok) {
        const allMedicines = await response.json();
        // Filter medicines by pharmacy
        const pharmacyMedicines = allMedicines.filter(m => m.pharmacy.pharmacyId === pharmacyId);
        setMedicines(pharmacyMedicines);
      } else {
        toast.error('Failed to fetch medicines');
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
      toast.error('Error fetching medicines');
    } finally {
      setMedicinesLoading(false);
    }
  };

  const handlePharmacyClick = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    fetchPharmacyMedicines(pharmacy.pharmacyId);
  };

  const handleBackToList = () => {
    setSelectedPharmacy(null);
    setMedicines([]);
    setSearchTerm('');
  };

  const handleOrderClick = (medicine) => {
    setSelectedMedicine(medicine);
    setShowOrderModal(true);
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    
    const quantity = parseInt(orderForm.quantity);
    if (isNaN(quantity) || quantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }
    
    if (quantity > selectedMedicine.stockQuantity) {
      toast.error(`Cannot order more than available stock (${selectedMedicine.stockQuantity})`);
      return;
    }

    if (!orderForm.deliveryAddress.trim()) {
      toast.error('Please provide delivery address');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('medicineId', selectedMedicine.medicineId);
      formData.append('quantity', parseInt(orderForm.quantity));
      formData.append('deliveryAddress', orderForm.deliveryAddress);
      formData.append('deliveryPhone', orderForm.deliveryPhone);
      if (orderForm.customerNotes) {
        formData.append('customerNotes', orderForm.customerNotes);
      }

      const response = await fetch('http://localhost:8081/api/bookings/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        toast.success('Order placed successfully!');
        setShowOrderModal(false);
        setSelectedMedicine(null);
        setOrderForm({
          quantity: 1,
          customerNotes: '',
          deliveryAddress: '',
          deliveryPhone: ''
        });
        
        if (selectedMedicine.requiresPrescription) {
          toast.info('This medicine requires prescription. Please upload your prescription from your dashboard.');
        }
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Error placing order');
    }
  };

  const cities = ['ALL', ...new Set(pharmacies.map(p => p.city))];

  const filteredPharmacies = pharmacies.filter(pharmacy => {
    const matchesCity = cityFilter === 'ALL' || pharmacy.city === cityFilter;
    const matchesSearch = pharmacy.pharmacyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pharmacy.city.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCity && matchesSearch;
  });

  const filteredMedicines = medicines.filter(medicine =>
    medicine.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.genericName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-slate-900/50 rounded-2xl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 pb-12 min-h-screen px-4 sm:px-6 lg:px-8">
      {!selectedPharmacy ? (
        <>
          {/* Pharmacy List View */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Browse Pharmacies</h1>
              <p className="text-gray-400 text-sm mt-1">Find pharmacies near you and explore their medicine inventory</p>
            </div>
          </div>

          {/* Filters */}
          <div className="card-saas p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search pharmacies..."
                  className="input-saas pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="input-saas"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              >
                {cities.map(city => (
                  <option key={city} value={city}>{city === 'ALL' ? 'All Cities' : city}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pharmacy Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPharmacies.map((pharmacy) => (
              <div
                key={pharmacy.pharmacyId}
                onClick={() => handlePharmacyClick(pharmacy)}
                className="card-saas p-6 cursor-pointer hover:scale-105 transition-transform duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-emerald-500/10 p-3 rounded-xl">
                    <Building2 className="h-8 w-8 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2">{pharmacy.pharmacyName}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <MapPin className="h-4 w-4" />
                        <span>{pharmacy.address}, {pharmacy.city}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Phone className="h-4 w-4" />
                        <span>{pharmacy.user?.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{pharmacy.user?.email || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-700/30">
                      <span className="text-xs text-emerald-400 font-medium">Click to view medicines →</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPharmacies.length === 0 && (
            <div className="card-saas p-12 text-center">
              <Building2 className="mx-auto h-16 w-16 text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-white">No pharmacies found</h3>
              <p className="text-gray-400 mt-2">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Pharmacy Medicines View */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToList}
                className="btn-saas-secondary flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">{selectedPharmacy.pharmacyName}</h1>
                <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {selectedPharmacy.address}, {selectedPharmacy.city}
                </p>
              </div>
            </div>
          </div>

          {/* Search Medicines */}
          <div className="card-saas p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search medicines in this pharmacy..."
                className="input-saas pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Medicines List */}
          {medicinesLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMedicines.length === 0 ? (
                <div className="card-saas p-12 text-center">
                  <Package className="mx-auto h-16 w-16 text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-white">No medicines found</h3>
                  <p className="text-gray-400 mt-2">This pharmacy hasn't added any medicines yet.</p>
                </div>
              ) : (
                filteredMedicines.map((medicine) => (
                  <div key={medicine.medicineId} className="card-saas p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="bg-blue-500/10 p-3 rounded-xl">
                            <Pill className="h-6 w-6 text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-white">{medicine.medicineName}</h3>
                              {medicine.requiresPrescription && (
                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                  Rx Required
                                </span>
                              )}
                              {medicine.stockQuantity < 10 && medicine.stockQuantity > 0 && (
                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                  Low Stock
                                </span>
                              )}
                              {medicine.stockQuantity === 0 && (
                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                  Out of Stock
                                </span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-3">
                              <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
                                <div className="spec-label">Generic Name</div>
                                <div className="text-white font-medium">{medicine.genericName}</div>
                              </div>
                              <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
                                <div className="spec-label">Manufacturer</div>
                                <div className="text-white font-medium">{medicine.manufacturer}</div>
                              </div>
                              <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
                                <div className="spec-label">Category</div>
                                <div className="text-white font-medium">{medicine.category}</div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-3">
                              <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
                                <div className="spec-label">Dosage Form</div>
                                <div className="text-white font-medium">{medicine.dosageForm}</div>
                              </div>
                              <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
                                <div className="spec-label">Strength</div>
                                <div className="text-white font-medium">{medicine.strength}</div>
                              </div>
                              <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
                                <div className="spec-label">Available Stock</div>
                                <div className="text-white font-medium">{medicine.stockQuantity} units</div>
                              </div>
                            </div>

                            {medicine.description && (
                              <div className="mt-3 text-sm text-gray-400">
                                <span className="font-medium text-gray-300">Description:</span> {medicine.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 lg:pl-6 lg:border-l border-gray-700/30 lg:min-w-[200px]">
                        <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 text-center">
                          <div className="spec-label">Price</div>
                          <div className="text-3xl font-bold text-blue-400">₹{medicine.price}</div>
                          <div className="text-xs text-gray-400 mt-1">per unit</div>
                        </div>
                        <button
                          onClick={() => handleOrderClick(medicine)}
                          disabled={medicine.stockQuantity === 0}
                          className={`btn-saas-primary flex items-center gap-2 justify-center ${
                            medicine.stockQuantity === 0 ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          {medicine.stockQuantity === 0 ? 'Out of Stock' : 'Order Now'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Order Modal */}
      {showOrderModal && selectedMedicine && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-start justify-center p-4 py-12 animate-fade-in">
          <div className="relative modal-glass-saas w-full max-w-md overflow-y-auto max-h-[90vh] animate-slide-in-right">
            <div className="px-6 py-4 border-b border-gray-700/50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Order Medicine</h3>
              <button
                onClick={() => {
                  setShowOrderModal(false);
                  setSelectedMedicine(null);
                  setOrderForm({
                    quantity: 1,
                    customerNotes: '',
                    deliveryAddress: '',
                    deliveryPhone: ''
                  });
                }}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all font-bold text-lg"
              >
                ×
              </button>
            </div>

            <div className="p-6 pb-10">
              <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700/30 mb-6">
                <h4 className="text-sm font-bold text-white mb-3">{selectedMedicine.medicineName}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">Price:</span>
                    <span className="text-white font-bold ml-2">₹{selectedMedicine.price}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Available:</span>
                    <span className="text-white font-bold ml-2">{selectedMedicine.stockQuantity}</span>
                  </div>
                </div>
                {selectedMedicine.requiresPrescription && (
                  <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
                    ⚠️ Prescription required. Upload after placing order.
                  </div>
                )}
              </div>

              <form onSubmit={handleOrderSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedMedicine.stockQuantity}
                    required
                    className="input-saas"
                    value={orderForm.quantity}
                    onChange={(e) => setOrderForm({...orderForm, quantity: e.target.value})}
                  />
                  <p className="mt-1 text-sm text-gray-400">
                    Total: ₹{(selectedMedicine.price * orderForm.quantity).toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">Delivery Address *</label>
                  <textarea
                    rows={3}
                    required
                    className="input-saas"
                    placeholder="Enter your complete delivery address"
                    value={orderForm.deliveryAddress}
                    onChange={(e) => setOrderForm({...orderForm, deliveryAddress: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">Delivery Phone</label>
                  <input
                    type="tel"
                    className="input-saas"
                    placeholder="Phone number for delivery contact"
                    value={orderForm.deliveryPhone}
                    onChange={(e) => setOrderForm({...orderForm, deliveryPhone: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">Notes (Optional)</label>
                  <textarea
                    rows={2}
                    className="input-saas"
                    placeholder="Any special instructions"
                    value={orderForm.customerNotes}
                    onChange={(e) => setOrderForm({...orderForm, customerNotes: e.target.value})}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-8 pb-12">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOrderModal(false);
                      setSelectedMedicine(null);
                      setOrderForm({
                        quantity: 1,
                        customerNotes: '',
                        deliveryAddress: '',
                        deliveryPhone: ''
                      });
                    }}
                    className="btn-saas-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-saas-primary">
                    Place Order - ₹{(selectedMedicine.price * orderForm.quantity).toFixed(2)}
                  </button>
                </div>
                {/* Added spacer for better visibility */}
                <div className="h-10" />
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyBrowse;
