import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, AlertCircle, Package } from 'lucide-react';
import { toast } from 'react-toastify';

const MedicineSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({
    quantity: 1,
    customerNotes: '',
    deliveryAddress: '',
    deliveryPhone: ''
  });

  // Load all medicines on component mount
  useEffect(() => {
    loadAllMedicines();
  }, []);

  const loadAllMedicines = async () => {
    setLoading(true);
    try {
      console.log('Loading all medicines...');
      const response = await fetch('http://localhost:8081/api/medicines/all');
      console.log('Load all response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('All medicines loaded:', data);
        setMedicines(data);
        if (data.length === 0) {
          toast.info('No medicines available yet. Please check back later.');
        }
      } else {
        const errorText = await response.text();
        console.error('Load error:', errorText);
        toast.error('Failed to load medicines: ' + response.status);
      }
    } catch (error) {
      console.error('Error loading medicines:', error);
      toast.error('Error connecting to server. Please check if backend is running on port 8081.');
    } finally {
      setLoading(false);
    }
  };

  const searchMedicines = async () => {
    if (!searchTerm.trim()) {
      // Don't clear medicines, just load all instead
      loadAllMedicines();
      return;
    }

    setLoading(true);
    try {
      console.log('Searching for:', searchTerm);
      const response = await fetch(`http://localhost:8081/api/medicines/search/name?name=${encodeURIComponent(searchTerm)}`);
      console.log('Search response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Medicines found:', data);
        setMedicines(data);
        if (data.length === 0) {
          toast.info('No medicines found matching your search');
        }
      } else {
        const errorText = await response.text();
        console.error('Search error:', errorText);
        toast.error('Failed to search medicines: ' + response.status);
      }
    } catch (error) {
      console.error('Error searching medicines:', error);
      toast.error('Error connecting to server. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchMedicines();
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

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
        const result = await response.json();
        toast.success('Order placed successfully!');
        setShowOrderModal(false);
        setSelectedMedicine(null);
        setOrderForm({
          quantity: 1,
          customerNotes: '',
          deliveryAddress: '',
          deliveryPhone: ''
        });
        
        // Show prescription upload message if required
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

  return (
    <div className="w-full min-h-screen py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Search Medicines</h1>
        <p className="text-gray-600 mt-2">Find and order medicines from verified pharmacies</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search for medicines by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Search Results */}
      {medicines.length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {medicines.map((medicine) => (
              <li key={medicine.medicineId} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">{medicine.medicineName}</h3>
                      <div className="flex items-center space-x-2">
                        {medicine.requiresPrescription && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Prescription Required
                          </span>
                        )}
                        {medicine.stockQuantity < 10 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Low Stock
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <p><strong>Generic Name:</strong> {medicine.genericName}</p>
                        <p><strong>Manufacturer:</strong> {medicine.manufacturer}</p>
                        <p><strong>Category:</strong> {medicine.category}</p>
                      </div>
                      <div>
                        <p><strong>Price:</strong> ₹{medicine.price}</p>
                        <p><strong>Available Stock:</strong> {medicine.stockQuantity}</p>
                        <p><strong>Form:</strong> {medicine.dosageForm}</p>
                      </div>
                      <div>
                        <p><strong>Strength:</strong> {medicine.strength}</p>
                        <p><strong>Pharmacy:</strong> {medicine.pharmacy.pharmacyName}</p>
                        <p><strong>Location:</strong> {medicine.pharmacy.city}</p>
                      </div>
                    </div>
                    {medicine.description && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600"><strong>Description:</strong> {medicine.description}</p>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => {
                        setSelectedMedicine(medicine);
                        setShowOrderModal(true);
                      }}
                      disabled={medicine.stockQuantity === 0}
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
                        medicine.stockQuantity === 0
                          ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                          : 'text-white bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {medicine.stockQuantity === 0 ? 'Out of Stock' : 'Order Now'}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No Results */}
      {searchTerm && !loading && medicines.length === 0 && (
        <div className="text-center py-8">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No medicines found</h3>
          <p className="mt-1 text-sm text-gray-500">Try searching with different keywords.</p>
        </div>
      )}

      {/* Order Modal */}
      {showOrderModal && selectedMedicine && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-start justify-center p-4 py-12 animate-fade-in">
          <div className="relative modal-glass-saas w-full max-w-md overflow-y-auto max-h-[90vh] animate-slide-in-right">
            <div className="px-6 py-4 border-b border-gray-700/50 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white tracking-tight">Order Medicine</h3>
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
              <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/30 mb-6">
                <h4 className="text-lg font-bold text-white mb-2">{selectedMedicine.medicineName}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400 block uppercase text-[10px] font-bold tracking-widest">Price</span>
                    <span className="text-white font-bold text-base">₹{selectedMedicine.price}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block uppercase text-[10px] font-bold tracking-widest">Available</span>
                    <span className="text-white font-bold text-base">{selectedMedicine.stockQuantity} Units</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700/30">
                   <p className="text-sm text-gray-400"><span className="font-bold text-gray-300">Pharmacy:</span> {selectedMedicine.pharmacy.pharmacyName}</p>
                   <p className="text-sm text-gray-400"><span className="font-bold text-gray-300">Location:</span> {selectedMedicine.pharmacy.city}</p>
                </div>
                {selectedMedicine.requiresPrescription && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
                    <p className="text-xs text-red-400 leading-relaxed font-medium">
                      Prescription required. Please upload your prescription in the dashboard after placing the order.
                    </p>
                  </div>
                )}
              </div>

              <form onSubmit={handleOrderSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedMedicine.stockQuantity}
                    required
                    className="input-saas"
                    value={orderForm.quantity}
                    onChange={(e) => setOrderForm({...orderForm, quantity: e.target.value})}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">Order total</span>
                    <span className="text-lg font-bold text-emerald-400">₹{(selectedMedicine.price * orderForm.quantity).toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Delivery Address *</label>
                  <textarea
                    rows={3}
                    required
                    className="input-saas resize-none"
                    placeholder="Enter your complete delivery address"
                    value={orderForm.deliveryAddress}
                    onChange={(e) => setOrderForm({...orderForm, deliveryAddress: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Delivery Phone</label>
                  <input
                    type="tel"
                    className="input-saas"
                    placeholder="Phone number for delivery contact"
                    value={orderForm.deliveryPhone}
                    onChange={(e) => setOrderForm({...orderForm, deliveryPhone: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Notes (Optional)</label>
                  <textarea
                    rows={2}
                    className="input-saas resize-none"
                    placeholder="Any special instructions"
                    value={orderForm.customerNotes}
                    onChange={(e) => setOrderForm({...orderForm, customerNotes: e.target.value})}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-8 pb-4">
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
                    Place Order
                  </button>
                </div>
                {/* Space for visibility */}
                <div className="h-10" />
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineSearch;