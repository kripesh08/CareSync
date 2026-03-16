import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2,
  Search,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  X
} from 'lucide-react';

const HospitalManagement = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchHospitals();
  }, []);

  useEffect(() => {
    if (showModal || showRejectModal) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => document.body.classList.remove('no-scroll');
  }, [showModal, showRejectModal]);

  const fetchHospitals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/admin/hospitals/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHospitals(data);
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveHospital = async (hospitalId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:8081/api/admin/hospitals/${hospitalId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      fetchHospitals();
      setShowModal(false);
    } catch (error) {
      console.error('Error approving hospital:', error);
    }
  };

  const handleRejectHospital = async (hospitalId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:8081/api/admin/hospitals/${hospitalId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectionReason })
      });
      fetchHospitals();
      setShowModal(false);
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting hospital:', error);
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

  const filteredHospitals = hospitals.filter(hospital => {
    const matchesSearch = hospital.hospitalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || hospital.approvalStatus === statusFilter;

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
          <h1 className="text-2xl font-bold text-white">Hospital Management</h1>
          <p className="mt-1 text-sm text-gray-400">
            Review and manage hospital registrations
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-saas">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Search hospitals..."
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

      {/* Hospitals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHospitals.map((hospital) => {
          const statusInfo = getStatusInfo(hospital.approvalStatus);
          const StatusIcon = statusInfo.icon;

          return (
            <div
              key={hospital.hospitalId}
              className="card-saas cursor-pointer hover:bg-gray-800/60 transition-all"
              onClick={() => {
                setSelectedHospital(hospital);
                setShowModal(true);
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {hospital.hospitalName}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                      <span>{hospital.address}, {hospital.city}</span>
                    </div>
                    {hospital.supportedInsuranceProviders && hospital.supportedInsuranceProviders.length > 0 && (
                      <div className="flex items-start">
                        <Shield className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-gray-300">{hospital.supportedInsuranceProviders.length} Insurance Providers</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${hospital.approvalStatus === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    hospital.approvalStatus === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusInfo.text}
                </div>
              </div>

              <div className="text-xs text-gray-500">
                Registered: {new Date(hospital.createdAt).toLocaleDateString()}
              </div>
            </div>
          );
        })}
      </div>

      {filteredHospitals.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-500" />
          <h3 className="mt-2 text-sm font-medium text-white">No hospitals found</h3>
          <p className="mt-1 text-sm text-gray-400">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      {/* Details Modal */}
      {showModal && selectedHospital && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="modal-glass-saas max-w-3xl w-full my-8 p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-700/50">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Building2 className="h-8 w-8 text-purple-400" />
                  <h2 className="text-3xl font-bold text-white">{selectedHospital.hospitalName}</h2>
                </div>
                <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${selectedHospital.approvalStatus === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    selectedHospital.approvalStatus === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                  {getStatusInfo(selectedHospital.approvalStatus).icon &&
                    React.createElement(getStatusInfo(selectedHospital.approvalStatus).icon, { className: "h-4 w-4 mr-1.5 inline" })}
                  {getStatusInfo(selectedHospital.approvalStatus).text}
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
                  <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 block">Registration Number</label>
                  <p className="text-white text-lg font-medium">{selectedHospital.registrationNumber}</p>
                </div>

                <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/30">
                  <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 block flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Location
                  </label>
                  <p className="text-white text-lg">{selectedHospital.address}</p>
                  <p className="text-gray-300 text-sm mt-1">{selectedHospital.city}</p>
                </div>

                <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/30">
                  <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3 block">Contact Information</label>
                  <div className="space-y-2">
                    <div className="flex items-center text-white">
                      <span className="text-gray-400 text-sm w-16">Email:</span>
                      <span className="text-purple-400">{selectedHospital.user?.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-white">
                      <span className="text-gray-400 text-sm w-16">Phone:</span>
                      <span className="text-purple-400">{selectedHospital.user?.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {selectedHospital.supportedInsuranceProviders && selectedHospital.supportedInsuranceProviders.length > 0 && (
                  <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/30">
                    <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3 block flex items-center">
                      <Shield className="h-4 w-4 mr-1" />
                      Insurance Providers ({selectedHospital.supportedInsuranceProviders.length})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedHospital.supportedInsuranceProviders.map((provider, index) => (
                        <span key={index} className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-sm font-medium">
                          {provider}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/30">
                  <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 block">Registration Date</label>
                  <p className="text-white text-lg">{new Date(selectedHospital.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</p>
                  <p className="text-gray-400 text-sm mt-1">{new Date(selectedHospital.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {selectedHospital.approvalStatus === 'PENDING' && (
              <div className="flex gap-4 pt-6 border-t border-gray-700/50">
                <button
                  onClick={() => handleApproveHospital(selectedHospital.hospitalId)}
                  className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-all hover:shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  Approve Hospital
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(true);
                  }}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-all hover:shadow-lg hover:shadow-red-500/20 flex items-center justify-center gap-2"
                >
                  <XCircle className="h-5 w-5" />
                  Reject Hospital
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Rejection Modal */}
      {showRejectModal && selectedHospital && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="modal-glass-saas max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Reject Hospital</h3>
            <p className="text-gray-400 mb-4">Please provide a reason for rejecting this hospital registration:</p>
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
                onClick={() => handleRejectHospital(selectedHospital.hospitalId)}
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

export default HospitalManagement;