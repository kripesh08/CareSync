import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, Clock, CheckCircle, Search, Pill } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const PatientDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    rejectedOrders: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/bookings/my-bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const stats = {
          totalOrders: data.filter(o => o.orderStatus !== 'CANCELLED' && o.orderStatus !== 'REJECTED').length,
          pendingOrders: data.filter(o => o.paymentStatus === 'PENDING' && o.orderStatus !== 'CANCELLED' && o.orderStatus !== 'REJECTED').length,
          confirmedOrders: data.filter(o => o.paymentStatus === 'SUCCESS' && o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED' && o.orderStatus !== 'REJECTED').length,
          deliveredOrders: data.filter(o => o.orderStatus === 'DELIVERED').length,
          cancelledOrders: data.filter(o => o.orderStatus === 'CANCELLED').length,
          rejectedOrders: data.filter(o => o.orderStatus === 'REJECTED').length
        };
        setStats(stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-slate-900/50 rounded-2xl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Patient Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Overview of your health and orders</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card-saas p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="spec-label">Total Orders</div>
              <div className="text-3xl font-bold text-white mt-1">{stats.totalOrders}</div>
              <div className="text-xs text-gray-400 mt-1">Active orders</div>
            </div>
            <div className="bg-blue-500/10 p-3 rounded-xl">
              <ShoppingCart className="h-8 w-8 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card-saas p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="spec-label">Pending Payment</div>
              <div className="text-3xl font-bold text-yellow-400 mt-1">{stats.pendingOrders}</div>
              <div className="text-xs text-gray-400 mt-1">Awaiting payment</div>
            </div>
            <div className="bg-yellow-500/10 p-3 rounded-xl">
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="card-saas p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="spec-label">Confirmed</div>
              <div className="text-3xl font-bold text-indigo-400 mt-1">{stats.confirmedOrders}</div>
              <div className="text-xs text-gray-400 mt-1">In progress</div>
            </div>
            <div className="bg-indigo-500/10 p-3 rounded-xl">
              <Package className="h-8 w-8 text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="card-saas p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="spec-label">Delivered</div>
              <div className="text-3xl font-bold text-emerald-400 mt-1">{stats.deliveredOrders}</div>
              <div className="text-xs text-gray-400 mt-1">Completed</div>
            </div>
            <div className="bg-emerald-500/10 p-3 rounded-xl">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="card-saas p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="spec-label">Cancelled</div>
              <div className="text-3xl font-bold text-gray-400 mt-1">{stats.cancelledOrders}</div>
              <div className="text-xs text-gray-400 mt-1">By you</div>
            </div>
            <div className="bg-gray-500/10 p-3 rounded-xl">
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="card-saas p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="spec-label">Rejected</div>
              <div className="text-3xl font-bold text-red-400 mt-1">{stats.rejectedOrders}</div>
              <div className="text-xs text-gray-400 mt-1">By pharmacy</div>
            </div>
            <div className="bg-red-500/10 p-3 rounded-xl">
              <CheckCircle className="h-8 w-8 text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-saas p-8">
        <h3 className="text-xl font-semibold mb-6 text-white">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/search-medicines')}
            className="flex items-center justify-center p-6 bg-gray-800 hover:bg-blue-600 rounded-xl border border-gray-700 transition-all duration-200 group text-white"
          >
            <Search className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Search Medicines</span>
          </button>
          <button
            onClick={() => navigate('/browse-pharmacies')}
            className="flex items-center justify-center p-6 bg-gray-800 hover:bg-blue-600 rounded-xl border border-gray-700 transition-all duration-200 group text-white"
          >
            <Pill className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Browse Pharmacies</span>
          </button>
          <button
            onClick={() => navigate('/my-bookings')}
            className="flex items-center justify-center p-6 bg-gray-800 hover:bg-blue-600 rounded-xl border border-gray-700 transition-all duration-200 group text-white"
          >
            <Package className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform" />
            <span className="font-medium">View My Orders</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
