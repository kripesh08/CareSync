import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  X
} from 'lucide-react';

const PharmacyManagement = () => {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPharmacies();
  }, []);

  useEffect(() => {
    if (showModal || showRejectModal) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => document.body.classList.remove('no-scroll');
  }, [showModal, showRejectModal]);

  const fetchPharmacies = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/admin/pharmacies/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPharmacies(data);
      }
    } catch (error) {
      console.error('Error fetching pharmacies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePharmacy = async (pharmacyId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:8081/api/admin/pharmacies/${pharmacyId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      fetchPharmacies();
      setShowModal(false);
    } catch (error) {
      console.error('Error approving pharmacy:', error);
    }
  };

  const handleRejectPharmacy = async (pharmacyId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:8081/api/admin/pharmacies/${pharmacyId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectionReason })
      });
      fetchPharmacies();
      setShowModal(false);
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting pharmacy:', error);
    }
  };

  const getStatusInfo = (approvalStatus) => {
    if (approvalStatus === 'APPROVED') {
      return { icon: CheckCircle, text: 'Approved' };
    } else if (approvalStatus === 'PENDING') {
      return { icon: Clock, text: 'Pending' };
    } else {
      return { icon: XCircle, text: 'Rejected' };
    }
  };

  const filteredPharmacies = pharmacies.filter(pharmacy => {
    const matchesSearch = pharmacy.pharmacyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharmacy.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || pharmacy.approvalStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-2xl font-bold text-white">Pharmacy Management</h1>
          <p className="mt-1 text-sm text-gray-400">
            Review and manage pharmacy registrations
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-saas">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Search pharmacies..."
            className="input-saas"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="input-saas"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Pharmacies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPharmacies.map((pharmacy) => {
          const statusInfo = getStatusInfo(pharmacy.approvalStatus);
          const StatusIcon = statusInfo.icon;

          return (
            <div
              key={pharmacy.pharmacyId}
              className="card-saas cursor-pointer hover:bg-gray-800/60 transition-all"
              onClick={() => {
                setSelectedPharmacy(pharmacy);
                setShowModal(true);
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {pharmacy.pharmacyName}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div>
                      <span className="font-medium text-gray-300">License:</span> {pharmacy.licenseNumber}
                    </div>
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mt-0.5 mr-1 flex-shrink-0" />
                      <span>{pharmacy.address}, {pharmacy.city}</span>
                    </div>
                  </div>
                </div>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${pharmacy.approvalStatus === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    pharmacy.approvalStatus === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusInfo.text}
                </div>
              </div>

              <div className="text-xs text-gray-500">
                Registered: {new Date(pharmacy.createdAt).toLocaleDateString()}
              </div>
            </div>
          );
        })}
      </div>

      {filteredPharmacies.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-500" />
          <h3 className="mt-2 text-sm font-medium text-white">No pharmacies found</h3>
          <p className="mt-1 text-sm text-gray-400">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      {/* Details Modal */}
      {showModal && selectedPharmacy && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="modal-glass-saas max-w-3xl w-full my-8 p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-700/50">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Building2 className="h-8 w-8 text-emerald-400" />
                  <h2 className="text-3xl font-bold text-white">{selectedPharmacy.pharmacyName}</h2>
                </div>
                <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${selectedPharmacy.approvalStatus === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    selectedPharmacy.approvalStatus === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                  {getStatusInfo(selectedPharmacy.approvalStatus).icon &&
                    React.createElement(getStatusInfo(selectedPharmacy.approvalStatus).icon, { className: "h-4 w-4 mr-1.5 inline" })}
                  {getStatusInfo(selectedPharmacy.approvalStatus).text}
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="icon-btn-saas text-gray-400 hover:text-white hover:bg-red-500/10"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-6">
                <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/30">
                  <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 block">License Number</label>
                  <p className="text-white text-lg font-medium">{selectedPharmacy.licenseNumber}</p>
                </div>

                <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/30">
                  <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 block flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Location
                  </label>
                  <p className="text-white text-lg">{selectedPharmacy.address}</p>
                  <p className="text-gray-300 text-sm mt-1">{selectedPharmacy.city}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/30">
                  <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3 block">Contact Information</label>
                  <div className="space-y-2">
                    <div className="flex items-center text-white">
                      <span className="text-gray-400 text-sm w-16">Email:</span>
                      <span className="text-emerald-400">{selectedPharmacy.user?.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-white">
                      <span className="text-gray-400 text-sm w-16">Phone:</span>
                      <span className="text-emerald-400">{selectedPharmacy.user?.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/30">
                  <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 block">Registration Date</label>
                  <p className="text-white text-lg">{new Date(selectedPharmacy.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</p>
                  <p className="text-gray-400 text-sm mt-1">{new Date(selectedPharmacy.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {selectedPharmacy.approvalStatus === 'PENDING' && (
              <div className="flex gap-4 pt-6 border-t border-gray-700/50">
                <button
                  onClick={() => handleApprovePharmacy(selectedPharmacy.pharmacyId)}
                  className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-all hover:shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  Approve Pharmacy
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(true);
                  }}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-all hover:shadow-lg hover:shadow-red-500/20 flex items-center justify-center gap-2"
                >
                  <XCircle className="h-5 w-5" />
                  Reject Pharmacy
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Rejection Modal */}
      {showRejectModal && selectedPharmacy && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="modal-glass-saas max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Reject Pharmacy</h3>
            <p className="text-gray-400 mb-4">Please provide a reason for rejecting this pharmacy registration:</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="input-saas w-full h-32 resize-none mb-4"
              placeholder="Enter rejection reason..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="flex-1 bg-gray-700 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectPharmacy(selectedPharmacy.pharmacyId)}
                className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PharmacyManagement;