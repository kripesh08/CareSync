import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Building2, Shield, CheckCircle, XCircle, AlertTriangle,
  Package, Activity, TrendingUp, Clock, Eye, RefreshCw, Filter,
  ArrowUpRight, LayoutDashboard, List, MapPin, ExternalLink
} from 'lucide-react';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
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

      // Fetch dashboard stats only
      const response = await fetch('http://localhost:8081/api/admin/dashboard', { headers });
      if (response.ok) {
        setStats(await response.json());
      }

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
    <div className="space-y-6 animate-fade-in">
      {/* Header with Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin Control Center</h1>
          <p className="text-gray-400 text-sm mt-1">System-wide monitoring and entity approvals</p>
        </div>

        <div className="flex gap-2 self-start mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold no-underline hover:no-underline ${activeTab === 'overview'
              ? 'bg-red-600 text-white !shadow-none !border-none !outline-none'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50 border border-gray-800 transition-all duration-200'
              }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </button>

          <Link
            to="/admin/pharmacies"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 text-gray-400 hover:text-white hover:bg-gray-800/50 border border-gray-800 no-underline hover:no-underline"
          >
            <Building2 className="h-4 w-4" />
            Pharmacies
          </Link>

          <Link
            to="/admin/hospitals"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 text-gray-400 hover:text-white hover:bg-gray-800/50 border border-gray-800 no-underline hover:no-underline"
          >
            <Shield className="h-4 w-4" />
            Hospitals
          </Link>
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
                  <div className="spec-label">Network Partners</div>
                  <div className="text-3xl font-bold text-emerald-400 mt-1">
                    {(stats.pharmacyUserCount || 0) + (stats.hospitalUserCount || 0)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Pharmacies & Hospitals</div>
                </div>
                <div className="bg-emerald-500/10 p-3 rounded-xl">
                  <Building2 className="h-8 w-8 text-emerald-400" />
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
                  <div className="text-xs text-gray-400 mt-1">Operational systems</div>
                </div>
                <div className="bg-purple-500/10 p-3 rounded-xl">
                  <Activity className="h-8 w-8 text-purple-400" />
                </div>
              </div>
            </div>

            <div className="card-saas p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="spec-label">Today's Tokens</div>
                  <div className="text-3xl font-bold text-blue-400 mt-1">{stats.todayTotalTokens || 0}</div>
                  <div className="text-xs text-gray-400 mt-1">System activity</div>
                </div>
                <div className="bg-blue-500/10 p-3 rounded-xl">
                  <TrendingUp className="h-8 w-8 text-blue-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="card-saas p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-red-500" />
                  System Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700/30">
                    <div className="text-sm font-medium text-gray-400 mb-1">User Growth</div>
                    <div className="text-2xl font-bold text-white">{stats.totalUsers || 0}</div>
                    <div className="mt-2 text-[10px] text-gray-500 uppercase tracking-widest">Total registered</div>
                  </div>
                  <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700/30">
                    <div className="text-sm font-medium text-gray-400 mb-1">Today's Traffic</div>
                    <div className="text-2xl font-bold text-white">{stats.todayTotalTokens || 0}</div>
                    <div className="mt-2 text-[10px] text-gray-500 uppercase tracking-widest">Tokens issued</div>
                  </div>
                </div>
              </div>
              
              <div className="card-saas p-6 border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-center gap-3 mb-2 text-emerald-400">
                  <CheckCircle className="h-5 w-5" />
                  <h4 className="text-sm font-bold uppercase tracking-widest">System Health</h4>
                </div>
                <p className="text-xs text-emerald-500/80 leading-relaxed font-medium">
                  All systems operational. Queue analytics and pharmacy inventories are syncing correctly.
                </p>
              </div>
            </div>

            <div className="card-saas p-6">
              <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/admin/users"
                  className="flex items-center justify-between p-4 bg-gray-800/40 rounded-xl border border-gray-700/50 hover:bg-red-600 transition-all group no-underline hover:no-underline"
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-red-400 group-hover:text-white" />
                    <span className="text-sm font-medium text-gray-200 group-hover:text-white">User Directory</span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-500 group-hover:text-white" />
                </Link>
                <Link
                  to="/admin/pharmacies"
                  className="flex items-center justify-between p-4 bg-gray-800/40 rounded-xl border border-gray-700/50 hover:bg-emerald-600 transition-all group no-underline hover:no-underline"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-emerald-400 group-hover:text-white" />
                    <span className="text-sm font-medium text-gray-200 group-hover:text-white">Pharmacy Network</span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-500 group-hover:text-white" />
                </Link>
                <Link
                  to="/admin/hospitals"
                  className="flex items-center justify-between p-4 bg-gray-800/40 rounded-xl border border-gray-700/50 hover:bg-blue-600 transition-all group no-underline hover:no-underline"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-blue-400 group-hover:text-white" />
                    <span className="text-sm font-medium text-gray-200 group-hover:text-white">Hospital Network</span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-500 group-hover:text-white" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
