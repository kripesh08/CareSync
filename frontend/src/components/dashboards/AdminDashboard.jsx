import React, { useState, useEffect } from 'react';
import {
  Users, Building2, Shield, CheckCircle, XCircle, AlertTriangle,
  Package, Activity, TrendingUp, Clock, Eye, RefreshCw, Filter,
  ArrowUpRight, LayoutDashboard, List
} from 'lucide-react';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [pendingPharmacies, setPendingPharmacies] = useState([]);
  const [approvedPharmacies, setApprovedPharmacies] = useState([]);
  const [pendingHospitals, setPendingHospitals] = useState([]);
  const [approvedHospitals, setApprovedHospitals] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Red theme for admin
  const theme = {
    primary: 'bg-red-600',
    primaryHover: 'hover:bg-red-700',
    primaryLight: 'bg-red-50',
    primaryText: 'text-red-600',
    primaryBorder: 'border-red-200',
    accent: 'bg-red-100',
    accentText: 'text-red-800',
    badge: 'bg-red-500/10 text-red-400 border-red-500/20'
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch dashboard stats and all category items
      const [statsRes, pendingPharmRes, approvedPharmRes, pendingHospRes, approvedHospRes] = await Promise.all([
        fetch('http://localhost:8081/api/admin/dashboard', { headers }),
        fetch('http://localhost:8081/api/admin/pharmacies/pending', { headers }),
        fetch('http://localhost:8081/api/admin/pharmacies/approved', { headers }),
        fetch('http://localhost:8081/api/admin/hospitals/pending', { headers }),
        fetch('http://localhost:8081/api/admin/hospitals/approved', { headers })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (pendingPharmRes.ok) setPendingPharmacies(await pendingPharmRes.json());
      if (approvedPharmRes.ok) setApprovedPharmacies(await approvedPharmRes.json());
      if (pendingHospRes.ok) setPendingHospitals(await pendingHospRes.json());
      if (approvedHospRes.ok) setApprovedHospitals(await approvedHospRes.json());

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePharmacy = async (pharmacyId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/admin/pharmacies/${pharmacyId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        toast.success('Pharmacy approved successfully');
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error approving pharmacy:', error);
    }
  };

  const handleRejectPharmacy = async (pharmacyId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/admin/pharmacies/${pharmacyId}/reject`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        toast.success('Pharmacy application rejected');
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error rejecting pharmacy:', error);
    }
  };

  const handleApproveHospital = async (hospitalId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/admin/hospitals/${hospitalId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        toast.success('Hospital approved successfully');
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error approving hospital:', error);
    }
  };

  const handleRejectHospital = async (hospitalId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/admin/hospitals/${hospitalId}/reject`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        toast.success('Hospital application rejected');
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error rejecting hospital:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-slate-900/50 rounded-2xl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-6 space-y-6 animate-fade-in">
      {/* Header with Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin Control Center</h1>
          <p className="text-gray-400 text-sm mt-1">System-wide monitoring and entity approvals</p>
        </div>

        <div className="flex p-1 bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 self-start">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'pharmacies', label: 'Pharmacies', icon: Building2 },
            { id: 'hospitals', label: 'Hospitals', icon: Shield }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-slide-in-right">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card-saas p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="spec-label">Total Users</div>
                  <div className="text-3xl font-bold text-white mt-1">{stats.totalUsers || 0}</div>
                  <div className="text-xs text-gray-400 mt-1">Registered accounts</div>
                </div>
                <div className="bg-red-500/10 p-3 rounded-xl">
                  <Users className="h-8 w-8 text-red-400" />
                </div>
              </div>
            </div>

            <div className="card-saas p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="spec-label">Pending Reviews</div>
                  <div className="text-3xl font-bold text-yellow-400 mt-1">
                    {(stats.pendingPharmacies || 0) + (stats.pendingHospitals || 0)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Pharmacies & Hospitals</div>
                </div>
                <div className="bg-yellow-500/10 p-3 rounded-xl">
                  <Clock className="h-8 w-8 text-yellow-400" />
                </div>
              </div>
            </div>

            <div className="card-saas p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="spec-label">Active Queues</div>
                  <div className="text-3xl font-bold text-purple-400 mt-1">
                    {stats.activeQueues || 0}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Out of {stats.totalQueues || 0} total</div>
                </div>
                <div className="bg-purple-500/10 p-3 rounded-xl">
                  <List className="h-8 w-8 text-purple-400" />
                </div>
              </div>
            </div>

            <div className="card-saas p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="spec-label">Today's Tokens</div>
                  <div className="text-3xl font-bold text-blue-400 mt-1">{stats.todayTotalTokens || 0}</div>
                  <div className="text-xs text-gray-400 mt-1">{stats.todayCompletedTokens || 0} completed</div>
                </div>
                <div className="bg-blue-500/10 p-3 rounded-xl">
                  <Activity className="h-8 w-8 text-blue-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Queue Management Stats */}
            <div className="card-saas p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <List className="h-5 w-5 text-purple-500" />
                Queue Management Overview
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-500/10 p-2 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Active Queues</div>
                      <div className="text-xs text-gray-400">Currently operational</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-purple-400">{stats.activeQueues || 0}</div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500/10 p-2 rounded-lg">
                      <Clock className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Waiting Patients</div>
                      <div className="text-xs text-gray-400">Currently in queue</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-400">{stats.todayWaitingTokens || 0}</div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/10 p-2 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Completed Today</div>
                      <div className="text-xs text-gray-400">Patients served</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-emerald-400">{stats.todayCompletedTokens || 0}</div>
                </div>
              </div>
            </div>
            <div className="card-saas p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Pending Applications
              </h3>
              <div className="space-y-4">
                {[...pendingPharmacies, ...pendingHospitals].length === 0 ? (
                  <p className="text-center py-6 text-gray-500 text-sm">Everything caught up!</p>
                ) : (
                  <>
                    {pendingPharmacies.slice(0, 2).map((pharmacy) => (
                      <div key={pharmacy.pharmacyId} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-700/30">
                        <div className="flex items-center gap-3">
                          <div className="bg-emerald-500/10 p-2 rounded-lg">
                            <Building2 className="h-5 w-5 text-emerald-400" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white">{pharmacy.pharmacyName}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Pharmacy</div>
                          </div>
                        </div>
                        <button onClick={() => setActiveTab('pharmacies')} className="text-red-400 hover:text-red-300 text-xs font-medium flex items-center gap-1 transition-colors">
                          Review <ArrowUpRight className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {pendingHospitals.slice(0, 2).map((hospital) => (
                      <div key={hospital.hospitalId} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-700/30">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-500/10 p-2 rounded-lg">
                            <Shield className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white">{hospital.hospitalName}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Hospital</div>
                          </div>
                        </div>
                        <button onClick={() => setActiveTab('hospitals')} className="text-red-400 hover:text-red-300 text-xs font-medium flex items-center gap-1 transition-colors">
                          Review <ArrowUpRight className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            <div className="card-saas p-6">
              <h3 className="text-lg font-bold text-white mb-4">System Overview</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-800/40 p-3 rounded-xl border border-gray-700/50">
                    <div className="text-[10px] text-gray-500 uppercase font-bold">Pharmacies</div>
                    <div className="text-xl font-bold text-white mt-1">{stats.pharmacyUserCount || 0}</div>
                  </div>
                  <div className="bg-gray-800/40 p-3 rounded-xl border border-gray-700/50">
                    <div className="text-[10px] text-gray-500 uppercase font-bold">Hospitals</div>
                    <div className="text-xl font-bold text-white mt-1">{stats.hospitalUserCount || 0}</div>
                  </div>
                  <div className="bg-gray-800/40 p-3 rounded-xl border border-gray-700/50">
                    <div className="text-[10px] text-gray-500 uppercase font-bold">Patients</div>
                    <div className="text-xl font-bold text-white mt-1">{stats.patientCount || 0}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pharmacies Tab Content */}
      {activeTab === 'pharmacies' && (
        <div className="space-y-6 animate-slide-in-right">
          <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-gray-700/30">
            <h2 className="text-xl font-bold text-white">Pharmacy Network</h2>
            <button onClick={fetchDashboardData} className="btn-saas-secondary flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Pending Pharmacies */}
            {pendingPharmacies.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="h-4 w-4" /> New Applications
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingPharmacies.map((pharmacy) => (
                    <div key={pharmacy.pharmacyId} className="card-saas p-0 overflow-hidden group">
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex gap-3">
                            <div className="bg-yellow-500/10 p-2.5 rounded-xl border border-yellow-500/20">
                              <Building2 className="h-6 w-6 text-yellow-400" />
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-white">{pharmacy.pharmacyName}</h4>
                              <p className="text-xs text-gray-500 mt-0.5">{pharmacy.licenseNumber}</p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-5">
                          <div className="bg-gray-800/40 p-2.5 rounded-lg border border-gray-700/50">
                            <div className="spec-label">Location</div>
                            <div className="text-xs text-gray-300 font-medium truncate">{pharmacy.city}</div>
                          </div>
                          <div className="bg-gray-800/40 p-2.5 rounded-lg border border-gray-700/50">
                            <div className="spec-label">Contact</div>
                            <div className="text-xs text-gray-300 font-medium truncate">{pharmacy.user?.phone}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprovePharmacy(pharmacy.pharmacyId)}
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/20"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleRejectPharmacy(pharmacy.pharmacyId)}
                            className="flex-1 py-2.5 bg-gray-700 hover:bg-red-600/20 hover:text-red-400 text-gray-400 rounded-lg text-xs font-bold transition-all border border-transparent hover:border-red-500/20"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Approved Pharmacies */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle className="h-4 w-4" /> Active Partners
              </h3>
              {approvedPharmacies.length === 0 ? (
                <div className="card-saas p-12 text-center text-gray-500 italic text-sm">No active pharmacies found.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {approvedPharmacies.map((pharmacy) => (
                    <div key={pharmacy.pharmacyId} className="card-saas p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex gap-2.5 items-center">
                            <div className="bg-emerald-500/5 p-2 rounded-lg">
                              <Building2 className="h-5 w-5 text-emerald-400/80" />
                            </div>
                            <div className="text-sm font-bold text-white leading-tight">{pharmacy.pharmacyName}</div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">Active</span>
                        </div>
                        <div className="text-[11px] text-gray-500 flex flex-col gap-1.5 mt-4">
                          <div className="flex justify-between border-b border-gray-700/30 pb-1.5">
                            <span>License:</span>
                            <span className="text-gray-300 color-emerald-400">{pharmacy.licenseNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>City:</span>
                            <span className="text-gray-300">{pharmacy.city}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hospitals Tab Content */}
      {activeTab === 'hospitals' && (
        <div className="space-y-6 animate-slide-in-right">
          <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-gray-700/30">
            <h2 className="text-xl font-bold text-white">Hospital Network</h2>
            <button onClick={fetchDashboardData} className="btn-saas-secondary flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Pending Hospitals */}
            {pendingHospitals.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="h-4 w-4" /> New Applications
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingHospitals.map((hospital) => (
                    <div key={hospital.hospitalId} className="card-saas p-0 overflow-hidden group">
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex gap-3">
                            <div className="bg-yellow-500/10 p-2.5 rounded-xl border border-yellow-500/20">
                              <Shield className="h-6 w-6 text-yellow-400" />
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-white">{hospital.hospitalName}</h4>
                              <p className="text-xs text-gray-500 mt-0.5">{hospital.registrationNumber}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3 mb-5 text-xs text-gray-400">
                          <div className="flex gap-2">
                            <span className="w-16">Address:</span>
                            <span className="text-gray-200">{hospital.address}, {hospital.city}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-16">Email:</span>
                            <span className="text-gray-200">{hospital.user?.email}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveHospital(hospital.hospitalId)}
                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-900/20"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleRejectHospital(hospital.hospitalId)}
                            className="flex-1 py-2.5 bg-gray-700 hover:bg-red-600/20 hover:text-red-400 text-gray-400 rounded-lg text-xs font-bold transition-all border border-transparent hover:border-red-500/20"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Approved Hospitals */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle className="h-4 w-4" /> Partner Hospitals
              </h3>
              {approvedHospitals.length === 0 ? (
                <div className="card-saas p-12 text-center text-gray-500 italic text-sm">No active hospitals found.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {approvedHospitals.map((hospital) => (
                    <div key={hospital.hospitalId} className="card-saas p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex gap-2.5 items-center">
                            <div className="bg-blue-500/5 p-2 rounded-lg">
                              <Shield className="h-5 w-5 text-blue-400/80" />
                            </div>
                            <div className="text-sm font-bold text-white leading-tight">{hospital.hospitalName}</div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">Active</span>
                        </div>
                        <div className="text-[11px] text-gray-500 flex flex-col gap-1.5 mt-4">
                          <div className="flex justify-between border-b border-gray-700/30 pb-1.5">
                            <span>Reg No:</span>
                            <span className="text-gray-300">{hospital.registrationNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Phone:</span>
                            <span className="text-gray-300">{hospital.user?.phone}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
