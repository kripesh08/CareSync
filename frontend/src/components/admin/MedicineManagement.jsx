import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Pill,
  Search,
  Shield,
  Trash2,
  Building2
} from 'lucide-react';

const MedicineManagement = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    if (deleteConfirm) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => document.body.classList.remove('no-scroll');
  }, [deleteConfirm]);

  const fetchMedicines = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching medicines from admin endpoint...');
      console.log('Token:', token ? 'Present' : 'Missing');

      const response = await fetch('http://localhost:8081/api/admin/all-medicines', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const data = await response.json();
        console.log('Medicines data:', data);
        console.log('Number of medicines:', data.length);
        setMedicines(data);
      } else {
        const errorText = await response.text();
        console.error('Response not OK:', response.status, response.statusText);
        console.error('Error body:', errorText);
        alert(`Failed to fetch medicines: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
      alert(`Error fetching medicines: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedicine = async (medicineId) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Deleting medicine:', medicineId);

      const response = await fetch(`http://localhost:8081/api/admin/medicines/${medicineId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Delete response:', response.status);

      if (response.ok) {
        console.log('Medicine deleted successfully');
        fetchMedicines();
        setDeleteConfirm(null);
      } else {
        const errorText = await response.text();
        console.error('Failed to delete medicine:', response.status, errorText);
        alert(`Failed to delete medicine: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting medicine:', error);
      alert('Error deleting medicine: ' + error.message);
    }
  };

  const filteredMedicines = medicines.filter(medicine => {
    const matchesSearch = medicine.medicineName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || medicine.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(medicines.map(m => m.category).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Medicine Management</h1>
          <p className="mt-1 text-sm text-gray-400">
            View medicine catalog and information
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-saas">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Search medicines..."
            className="input-saas"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="input-saas"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="card-saas overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800/40">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Medicine
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Prescription Required
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Pharmacy
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredMedicines.map((medicine) => (
                <tr key={medicine.medicineId} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Pill className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="text-sm font-medium text-white">
                        {medicine.medicineName}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {medicine.category || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {medicine.prescriptionRequired ? (
                        <>
                          <Shield className="h-4 w-4 text-red-400 mr-2" />
                          <span className="text-sm text-red-400">Required</span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">Not Required</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 mr-2 text-gray-500" />
                      {medicine.pharmacy?.pharmacyName || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${medicine.stockQuantity <= 10 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                      {medicine.stockQuantity} units
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => setDeleteConfirm(medicine.medicineId)}
                      className="icon-btn-saas text-red-400/80 hover:text-red-400 hover:bg-red-500/10"
                      title="Delete Medicine"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredMedicines.length === 0 && (
          <div className="text-center py-12">
            <Pill className="mx-auto h-12 w-12 text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-white">No medicines found</h3>
            <p className="mt-1 text-sm text-gray-400">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="modal-glass-saas max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Medicine</h3>
              <p className="text-gray-400">
                Are you sure you want to delete this medicine? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-700 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteMedicine(deleteConfirm)}
                className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MedicineManagement;