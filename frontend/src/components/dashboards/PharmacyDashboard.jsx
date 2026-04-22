import React, { useState, useEffect } from 'react';
import { Package, ShoppingCart, FileText, AlertTriangle, Plus, Edit, Trash2, Eye, Check, X, Upload, Clock, CheckCircle, XCircle, Search, Filter, ArrowUpRight, TrendingUp, ExternalLink, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';

const PharmacyDashboard = ({ initialTab = 'overview' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);

  // Green theme for pharmacy
  const theme = {
    primary: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-700',
    primaryLight: 'bg-emerald-50',
    primaryText: 'text-emerald-600',
    primaryBorder: 'border-emerald-200',
    accent: 'bg-emerald-100',
    accentText: 'text-emerald-800'
  };

  // State for statistics
  const [stats, setStats] = useState({
    medicines: { totalMedicines: 0, lowStockCount: 0, prescriptionMedicinesCount: 0 },
    orders: { totalOrders: 0, pendingOrders: 0, confirmedOrders: 0, deliveredOrders: 0, prescriptionsToVerify: 0 }
  });

  // State for medicines
  const [medicines, setMedicines] = useState([]);
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [medicineForm, setMedicineForm] = useState({
    medicineName: '',
    genericName: '',
    manufacturer: '',
    description: '',
    price: '',
    stockQuantity: '',
    category: '',
    requiresPrescription: false,
    dosageForm: '',
    strength: ''
  });

  // State for orders
  const [orders, setOrders] = useState([]);
  const [prescriptionsToVerify, setPrescriptionsToVerify] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showCompletedOrders, setShowCompletedOrders] = useState(false);
  const [prescriptionVerification, setPrescriptionVerification] = useState({
    approved: true,
    verificationNotes: ''
  });

  useEffect(() => {
    if (showMedicineModal || showPrescriptionModal) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => document.body.classList.remove('no-scroll');
  }, [showMedicineModal, showPrescriptionModal]);

  useEffect(() => {
    console.log('PharmacyDashboard mounted, fetching data...');
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Add a force refresh function
  const forceRefresh = () => {
    console.log('Force refresh triggered');
    setLoading(true);
    setTimeout(() => {
      fetchDashboardData();
    }, 100);
  };

  const fetchDashboardData = async () => {
    console.log('Fetching dashboard data...');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        toast.error('Authentication token missing. Please login again.');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      console.log('Making API calls with token:', token.substring(0, 20) + '...');

      // Fetch medicines first (most important)
      try {
        console.log('Fetching medicines...');
        const medicinesRes = await fetch('http://localhost:8081/api/medicines/my-medicines', { headers });
        console.log('Medicines response status:', medicinesRes.status);

        if (medicinesRes.ok) {
          const medicinesData = await medicinesRes.json();
          console.log('Medicines data received:', medicinesData);
          setMedicines(medicinesData);
        } else {
          const errorText = await medicinesRes.text();
          console.error('Medicines API error:', medicinesRes.status, errorText);
          setMedicines([]);
        }
      } catch (error) {
        console.error('Error fetching medicines:', error);
        setMedicines([]);
      }

      // Fetch statistics
      try {
        console.log('Fetching medicine stats...');
        const medicineStatsRes = await fetch('http://localhost:8081/api/medicines/stats', { headers });
        console.log('Medicine stats response status:', medicineStatsRes.status);

        if (medicineStatsRes.ok) {
          const medicineStats = await medicineStatsRes.json();
          console.log('Medicine stats received:', medicineStats);

          // Fetch order stats
          console.log('Fetching order stats...');
          const orderStatsRes = await fetch('http://localhost:8081/api/orders/pharmacy/stats', { headers });
          console.log('Order stats response status:', orderStatsRes.status);

          if (orderStatsRes.ok) {
            const orderStats = await orderStatsRes.json();
            console.log('Order stats received:', orderStats);
            setStats({ medicines: medicineStats, orders: orderStats });
          } else {
            console.error('Order stats API error:', orderStatsRes.status);
            setStats({
              medicines: medicineStats,
              orders: { totalOrders: 0, pendingOrders: 0, confirmedOrders: 0, deliveredOrders: 0, prescriptionsToVerify: 0 }
            });
          }
        } else {
          console.error('Medicine stats API error:', medicineStatsRes.status);
          setStats({
            medicines: { totalMedicines: 0, lowStockCount: 0, prescriptionMedicinesCount: 0 },
            orders: { totalOrders: 0, pendingOrders: 0, confirmedOrders: 0, deliveredOrders: 0, prescriptionsToVerify: 0 }
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats({
          medicines: { totalMedicines: 0, lowStockCount: 0, prescriptionMedicinesCount: 0 },
          orders: { totalOrders: 0, pendingOrders: 0, confirmedOrders: 0, deliveredOrders: 0, prescriptionsToVerify: 0 }
        });
      }

      // Fetch orders (all orders for pharmacy)
      try {
        console.log('Fetching orders...');
        const ordersRes = await fetch('http://localhost:8081/api/orders/pharmacy/orders', { headers });
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData);
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
      }

      // Fetch prescriptions (less critical)
      try {
        console.log('Fetching prescriptions...');
        const prescriptionsRes = await fetch('http://localhost:8081/api/orders/pharmacy/prescriptions-to-verify', { headers });
        if (prescriptionsRes.ok) {
          const prescriptionsData = await prescriptionsRes.json();
          setPrescriptionsToVerify(prescriptionsData);
        } else {
          setPrescriptionsToVerify([]);
        }
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
        setPrescriptionsToVerify([]);
      }

      console.log('Dashboard data fetch completed');
    } catch (error) {
      console.error('Error in fetchDashboardData:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleMedicineSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const url = editingMedicine
        ? `http://localhost:8081/api/medicines/${editingMedicine.medicineId}`
        : 'http://localhost:8081/api/medicines';

      const method = editingMedicine ? 'PUT' : 'POST';

      const medicineData = {
        ...medicineForm,
        price: parseFloat(medicineForm.price),
        stockQuantity: parseInt(medicineForm.stockQuantity),
        requiresPrescription: Boolean(medicineForm.requiresPrescription)
      };

      console.log('Submitting medicine data:', medicineData);

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(medicineData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Medicine saved successfully:', result);
        toast.success(editingMedicine ? 'Medicine updated successfully' : 'Medicine added successfully');

        // Close modal and reset form
        setShowMedicineModal(false);
        setEditingMedicine(null);
        resetMedicineForm();

        // Force refresh all data
        console.log('Refreshing dashboard data...');
        await fetchDashboardData();

        // If we're on the medicines tab, make sure it shows the updated list
        if (activeTab !== 'medicines') {
          setActiveTab('medicines');
        }
      } else {
        const error = await response.json();
        console.error('Failed to save medicine:', error);
        toast.error(error.message || 'Failed to save medicine');
      }
    } catch (error) {
      console.error('Error saving medicine:', error);
      toast.error('Error saving medicine');
    }
  };

  const handleDeleteMedicine = async (medicineId) => {
    if (!window.confirm('Are you sure you want to delete this medicine?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/medicines/${medicineId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Medicine deleted successfully');
        fetchDashboardData();
      } else {
        toast.error('Failed to delete medicine');
      }
    } catch (error) {
      console.error('Error deleting medicine:', error);
      toast.error('Error deleting medicine');
    }
  };

  const handleMarkAsDelivered = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/orders/${orderId}/mark-delivered`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deliveryNotes: 'Order delivered successfully' })
      });

      if (response.ok) {
        toast.success('Order marked as delivered');
        fetchDashboardData();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to mark as delivered');
      }
    } catch (error) {
      console.error('Error marking as delivered:', error);
      toast.error('Error marking as delivered');
    }
  };

  const handleRejectOrder = async (orderId) => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/orders/${orderId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejectionReason: reason })
      });

      if (response.ok) {
        toast.success('Order rejected');
        fetchDashboardData();
      } else {
        toast.error('Failed to reject order');
      }
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast.error('Error rejecting order');
    }
  };

  const handleVerifyPrescription = async (orderId, approved, notes) => {
    try {
      const token = localStorage.getItem('token');
      const payload = {
        approved: approved,
        verificationNotes: notes || ''
      };
      
      console.log('Verifying prescription:', { orderId, payload });
      
      const response = await fetch(`http://localhost:8081/api/orders/${orderId}/verify-prescription`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Verification result:', result);
        toast.success(approved ? 'Prescription approved successfully' : 'Prescription rejected successfully');
        setPrescriptionVerification({ approved: true, verificationNotes: '' });
        fetchDashboardData();
      } else {
        const error = await response.json();
        console.error('Verification error:', error);
        toast.error(error.message || 'Failed to verify prescription');
      }
    } catch (error) {
      console.error('Error verifying prescription:', error);
      toast.error('Error verifying prescription');
    }
  };

  const resetMedicineForm = () => {
    console.log('Resetting medicine form');
    setMedicineForm({
      medicineName: '',
      genericName: '',
      manufacturer: '',
      description: '',
      price: '',
      stockQuantity: '',
      category: '',
      requiresPrescription: false,
      dosageForm: '',
      strength: ''
    });
  };

  const openEditMedicine = (medicine) => {
    setEditingMedicine(medicine);
    setMedicineForm({
      medicineName: medicine.medicineName || '',
      genericName: medicine.genericName || '',
      manufacturer: medicine.manufacturer || '',
      description: medicine.description || '',
      price: medicine.price ? medicine.price.toString() : '',
      stockQuantity: medicine.stockQuantity ? medicine.stockQuantity.toString() : '',
      category: medicine.category || '',
      requiresPrescription: Boolean(medicine.requiresPrescription),
      dosageForm: medicine.dosageForm || '',
      strength: medicine.strength || ''
    });
    setShowMedicineModal(true);
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="relative">
          <div className="w-16 h-16 rounded-full absolute border-4 border-solid border-gray-200"></div>
          <div className="w-16 h-16 rounded-full animate-spin absolute border-4 border-solid border-emerald-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="animate-fade-in space-y-8 pb-12 min-h-screen">


        {/* Main Content Area */}
        <div className="animate-slide-in-right">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card p-6 rounded-2xl hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Total Medicines</p>
                      <p className="text-3xl font-bold text-white mt-2">{stats.medicines.totalMedicines}</p>
                    </div>
                    <div className="p-3 bg-emerald-500/10 rounded-xl">
                      <Package className="h-6 w-6 text-emerald-500" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-gray-400">
                    <TrendingUp className="h-4 w-4 mr-1 text-emerald-500" />
                    <span>In inventory</span>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-2xl hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Low Stock</p>
                      <p className="text-3xl font-bold text-white mt-2">{stats.medicines.lowStockCount}</p>
                    </div>
                    <div className="p-3 bg-yellow-500/10 rounded-xl">
                      <AlertTriangle className="h-6 w-6 text-yellow-500" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-yellow-500 font-medium">
                    <span>Needs attention</span>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-2xl hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Pending Orders</p>
                      <p className="text-3xl font-bold text-white mt-2">{stats.orders.pendingOrders}</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                      <ShoppingCart className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-blue-400 font-medium">
                    <span>View orders &rarr;</span>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-2xl hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Verification</p>
                      <p className="text-3xl font-bold text-white mt-2">{stats.orders.prescriptionsToVerify}</p>
                    </div>
                    <div className="p-3 bg-red-500/10 rounded-xl">
                      <FileText className="h-6 w-6 text-red-500" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-red-400 font-medium">
                    {stats.orders.prescriptionsToVerify} waiting review
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="glass-card p-8 relative overflow-hidden rounded-2xl">
                <div className="relative z-10">
                  <h3 className="text-xl font-semibold mb-6 text-white">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => {
                        resetMedicineForm();
                        setEditingMedicine(null);
                        setShowMedicineModal(true);
                      }}
                      className="flex items-center justify-center p-4 bg-gray-800 hover:bg-emerald-600 rounded-xl border border-gray-700 transition-all duration-200 group text-white"
                    >
                      <Plus className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                      <span className="font-medium">Add New Medicine</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('prescriptions')}
                      className="flex items-center justify-center p-4 bg-gray-800 hover:bg-emerald-600 rounded-xl border border-gray-700 transition-all duration-200 group text-white"
                    >
                      <FileText className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                      <span className="font-medium">Verify Prescriptions</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="flex items-center justify-center p-4 bg-gray-800 hover:bg-emerald-600 rounded-xl border border-gray-700 transition-all duration-200 group text-white"
                    >
                      <ShoppingCart className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                      <span className="font-medium">Process Orders</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Medicines Tab */}
          {activeTab === 'medicines' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-white">Inventory Management</h2>
                  {showLowStockOnly && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Low Stock Filter Active
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                    className={`btn-unified ${showLowStockOnly ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' : 'hover-emerald'}`}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {showLowStockOnly ? 'Show All' : 'Low Stock'} ({stats.medicines.lowStockCount})
                  </button>
                  <button
                    onClick={forceRefresh}
                    className="btn-unified hover-emerald"
                  >
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Refresh
                  </button>
                  <button
                    onClick={() => {
                      resetMedicineForm();
                      setEditingMedicine(null);
                      setShowMedicineModal(true);
                    }}
                    className="btn-unified hover-emerald"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Medicine
                  </button>
                </div>
              </div>

              {medicines.length === 0 ? (
                <div className="text-center py-16 glass-card rounded-2xl">
                  <div className="bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="h-10 w-10 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-white">No medicines in inventory</h3>
                  <p className="mt-2 text-gray-400">Get started by adding your first medicine.</p>
                  <button
                    onClick={() => {
                      resetMedicineForm();
                      setEditingMedicine(null);
                      setShowMedicineModal(true);
                    }}
                    className="mt-6 btn-unified hover-emerald"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Medicine
                  </button>
                </div>
              ) : (
                <div className="inventory-card-grid">
                  {medicines
                    .filter(medicine => !showLowStockOnly || medicine.stockQuantity <= 10)
                    .map((medicine) => (
                    <div key={medicine.medicineId} className={`card-saas flex flex-col justify-between ${medicine.stockQuantity <= 10 ? 'border-red-500/30' : ''}`}>
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className="text-emerald-400 p-1">
                            <Package className="h-6 w-6" />
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {medicine.stockQuantity <= 10 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 uppercase tracking-tighter flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Low Stock
                              </span>
                            )}
                            {medicine.requiresPrescription && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-tighter">Rx</span>
                            )}
                            <div className="text-right">
                              <span className="spec-label">Price</span>
                              <div className="text-xl font-bold text-white">₹{medicine.price}</div>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-gray-800/40 p-3 rounded-xl border border-gray-700/50">
                            <div className="spec-label">Medicine</div>
                            <div className="spec-value truncate">{medicine.medicineName}</div>
                          </div>
                          <div className={`bg-gray-800/40 p-3 rounded-xl border ${medicine.stockQuantity <= 10 ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-gray-700/50'}`}>
                            <div className="spec-label">Stock</div>
                            <div className="spec-value flex items-center">
                              <span className={medicine.stockQuantity <= 10 ? 'text-yellow-400 font-bold' : 'text-emerald-400'}>
                                {medicine.stockQuantity}
                              </span>
                              <span className="ml-1 text-[10px] text-gray-500 uppercase">units</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-4 justify-end">
                        <button
                          onClick={() => {
                            setMedicineForm({ ...medicine });
                            setEditingMedicine(medicine);
                            setShowMedicineModal(true);
                          }}
                          className="icon-btn-saas text-emerald-400/80 hover:text-emerald-400 hover:bg-emerald-500/10"
                          title="Update Details"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMedicine(medicine.medicineId)}
                          className="icon-btn-saas text-red-400/80 hover:text-red-400 hover:bg-red-500/10"
                          title="Delete Medicine"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {
            activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-xl font-semibold text-white">
                    {showCompletedOrders ? 'Completed Orders' : 'Orders - Payment Completed'}
                  </h2>
                  <button
                    onClick={() => setShowCompletedOrders(!showCompletedOrders)}
                    className={`btn-unified ${showCompletedOrders ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'hover-emerald'}`}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {showCompletedOrders ? 'Show Pending' : 'Show Completed'}
                  </button>
                </div>

                {showCompletedOrders ? (
                  // Completed Orders View
                  orders.filter(order => order.orderStatus === 'DELIVERED').length === 0 ? (
                    <div className="text-center py-16 glass-card rounded-2xl">
                      <div className="bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="h-10 w-10 text-gray-500" />
                      </div>
                      <h3 className="text-lg font-medium text-white">No completed orders</h3>
                      <p className="mt-2 text-gray-400">Delivered orders will appear here.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders
                        .filter(order => order.orderStatus === 'DELIVERED')
                        .map((order) => (
                        <div key={order.orderId} className="glass-card p-6 rounded-xl border-emerald-500/20">
                          <div className="flex flex-col lg:flex-row justify-between gap-6">
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                                <div>
                                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    {order.medicine.medicineName}
                                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-800/50">
                                      DELIVERED
                                    </span>
                                  </h3>
                                  <p className="text-sm text-gray-400 mt-1">Delivered on {new Date(order.updatedAt).toLocaleDateString()}</p>
                                </div>
                                <div className="text-left sm:text-right">
                                  <p className="text-2xl font-bold text-emerald-400">₹{order.totalAmount}</p>
                                  <p className="text-xs text-gray-400">{order.quantity} units</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Customer</p>
                                  <p className="font-medium text-gray-200">{order.customer.fullName || order.customer.email}</p>
                                  {order.deliveryPhone && (
                                    <p className="text-sm text-gray-400 mt-1">📞 {order.deliveryPhone}</p>
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Delivery Address</p>
                                  <p className="font-medium text-gray-200">{order.deliveryAddress}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  // Pending Orders View
                  orders.filter(order => order.paymentStatus === 'SUCCESS' && order.orderStatus !== 'DELIVERED').length === 0 ? (
                    <div className="text-center py-16 glass-card rounded-2xl">
                      <div className="bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingCart className="h-10 w-10 text-gray-500" />
                      </div>
                      <h3 className="text-lg font-medium text-white">No paid orders to deliver</h3>
                      <p className="mt-2 text-gray-400">Orders will appear here after customers complete payment.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders
                        .filter(order => order.paymentStatus === 'SUCCESS' && order.orderStatus !== 'DELIVERED')
                        .map((order) => (
                      <div key={order.orderId} className="glass-card p-6 rounded-xl hover:bg-gray-800/80 transition-all duration-200">
                        <div className="flex flex-col lg:flex-row justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                              <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                  Order #{order.orderId}
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${order.orderStatus === 'PENDING' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50' :
                                    'bg-blue-900/30 text-blue-400 border border-blue-800/50'
                                    }`}>
                                    {order.orderStatus.replace('_', ' ')}
                                  </span>
                                </h3>
                                <p className="text-sm text-gray-400 mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div className="text-left sm:text-right">
                                <p className="text-2xl font-bold text-emerald-400">₹{order.totalAmount}</p>
                                <p className="text-xs text-gray-400">{order.quantity} items</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Medicine Details</p>
                                <p className="font-medium text-gray-200">{order.medicine.medicineName}</p>
                                <p className="text-xs text-gray-400 mt-1">Quantity: {order.quantity} units</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Customer</p>
                                <p className="font-medium text-gray-200">{order.customer.fullName || order.customer.email}</p>
                                {order.deliveryPhone && (
                                  <p className="text-sm text-gray-400 mt-1">📞 {order.deliveryPhone}</p>
                                )}
                              </div>
                              <div className="md:col-span-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Delivery Address</p>
                                <p className="font-medium text-gray-200">{order.deliveryAddress}</p>
                              </div>
                              {order.requiresPrescription && order.prescriptionImagePath && (
                                <div className="md:col-span-2">
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Prescription</p>
                                  <button
                                    onClick={() => window.open(order.prescriptionImagePath, '_blank')}
                                    className="btn-unified hover-blue inline-flex items-center"
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View Prescription Image
                                  </button>
                                </div>
                              )}
                              {order.customerNotes && (
                                <div className="md:col-span-2">
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Customer Notes</p>
                                  <p className="text-sm text-gray-300 italic">"{order.customerNotes}"</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-row lg:flex-col items-center justify-end gap-3 lg:border-l lg:border-gray-700 lg:pl-6">
                            <button
                              onClick={() => handleMarkAsDelivered(order.orderId)}
                              className="w-full btn-unified hover-emerald"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Mark as Delivered
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  )
                )}
              </div>
            )
          }

          {/* Prescriptions Tab */}
          {
            activeTab === 'prescriptions' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white">Prescription Verification</h2>

                {prescriptionsToVerify.filter(order => order.prescriptionStatus === 'UPLOADED').length === 0 ? (
                  <div className="text-center py-16 glass-card rounded-2xl">
                    <div className="bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-10 w-10 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-white">No prescriptions to verify</h3>
                    <p className="mt-2 text-gray-400">Great job! All prescriptions have been processed.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {prescriptionsToVerify
                      .filter(order => order.prescriptionStatus === 'UPLOADED')
                      .map((order) => (
                      <div key={order.orderId} className="glass-card p-6 rounded-xl hover:bg-gray-800/80 transition-all duration-200">
                        <div className="flex flex-col lg:flex-row justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                  Prescription #{order.orderId}
                                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-900/30 text-red-400 border border-red-800/50">
                                    Verification Required
                                  </span>
                                </h3>
                                <p className="text-sm text-gray-400 mt-1">Uploaded on {new Date(order.updatedAt).toLocaleDateString()}</p>
                              </div>
                              {order.prescriptionImagePath && (
                                <button
                                  onClick={() => window.open(order.prescriptionImagePath, '_blank')}
                                  className="btn-unified hover-blue"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Prescription
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Medicine</p>
                                <p className="font-medium text-gray-200">{order.medicine.medicineName}</p>
                                <p className="text-xs text-gray-400 mt-1">Quantity: {order.quantity} units</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Customer</p>
                                <p className="font-medium text-gray-200">{order.customer.fullName || order.customer.email}</p>
                                {order.deliveryPhone && (
                                  <p className="text-sm text-gray-400 mt-1">📞 {order.deliveryPhone}</p>
                                )}
                              </div>
                              <div className="md:col-span-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Delivery Address</p>
                                <p className="font-medium text-gray-200">{order.deliveryAddress}</p>
                              </div>
                              <div className="md:col-span-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes (Required for Rejection)</p>
                                <textarea
                                  className="w-full mt-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                  placeholder="Add notes for approval or reason for rejection..."
                                  rows="2"
                                  value={prescriptionVerification.verificationNotes}
                                  onChange={(e) => setPrescriptionVerification({ ...prescriptionVerification, verificationNotes: e.target.value })}
                                ></textarea>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-row lg:flex-col items-center justify-end gap-3 lg:border-l lg:border-gray-700 lg:pl-6">
                            <button
                              onClick={() => {
                                const notes = prescriptionVerification.verificationNotes || '';
                                handleVerifyPrescription(order.orderId, true, notes);
                              }}
                              className="w-full btn-unified hover-emerald"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const notes = prescriptionVerification.verificationNotes || '';
                                if (!notes.trim()) {
                                  toast.error('Please provide a reason for rejection');
                                  return;
                                }
                                handleVerifyPrescription(order.orderId, false, notes);
                              }}
                              className="w-full btn-unified hover-red"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          }
        </div>
      </div>

      {/* Medicine Modal */}
      {
        showMedicineModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md overflow-y-auto h-full w-full z-[100] flex items-start justify-center p-4 py-12 animate-fade-in">
            <div className="relative modal-glass-saas w-full max-w-2xl overflow-y-auto max-h-[90vh] animate-slide-in-right">
              <div className="px-6 py-4 flex items-center justify-between border-b border-gray-800/50">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {editingMedicine ? 'Update Medicine' : 'Add New Medicine'}
                </h3>
                <button
                  onClick={() => {
                    setShowMedicineModal(false);
                    setEditingMedicine(null);
                    resetMedicineForm();
                  }}
                  className="close-btn-saas"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 pb-10 modal-content-scroll">
                <form onSubmit={handleMedicineSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Medicine Name *</label>
                      <input
                        type="text"
                        required
                        className="input-saas w-full"
                        value={medicineForm.medicineName}
                        onChange={(e) => setMedicineForm({ ...medicineForm, medicineName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Generic Name *</label>
                      <input
                        type="text"
                        required
                        className="input-saas w-full"
                        value={medicineForm.genericName}
                        onChange={(e) => setMedicineForm({ ...medicineForm, genericName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Manufacturer *</label>
                      <input
                        type="text"
                        required
                        className="input-saas w-full"
                        value={medicineForm.manufacturer}
                        onChange={(e) => setMedicineForm({ ...medicineForm, manufacturer: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Category *</label>
                      <select
                        required
                        className="input-saas w-full cursor-pointer"
                        value={medicineForm.category}
                        onChange={(e) => setMedicineForm({ ...medicineForm, category: e.target.value })}
                      >
                        <option value="">Select Category</option>
                        <option value="Antibiotics">Antibiotics</option>
                        <option value="Pain Relief">Pain Relief</option>
                        <option value="Vitamins">Vitamins</option>
                        <option value="Diabetes">Diabetes</option>
                        <option value="Heart">Heart</option>
                        <option value="Respiratory">Respiratory</option>
                        <option value="Digestive">Digestive</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Price (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        className="input-saas w-full"
                        value={medicineForm.price}
                        onChange={(e) => setMedicineForm({ ...medicineForm, price: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Stock Quantity *</label>
                      <input
                        type="number"
                        required
                        className="input-saas w-full"
                        value={medicineForm.stockQuantity}
                        onChange={(e) => setMedicineForm({ ...medicineForm, stockQuantity: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Dosage Form</label>
                      <select
                        className="input-saas w-full cursor-pointer"
                        value={medicineForm.dosageForm}
                        onChange={(e) => setMedicineForm({ ...medicineForm, dosageForm: e.target.value })}
                      >
                        <option value="">Select Form</option>
                        <option value="Tablet">Tablet</option>
                        <option value="Capsule">Capsule</option>
                        <option value="Syrup">Syrup</option>
                        <option value="Injection">Injection</option>
                        <option value="Cream">Cream</option>
                        <option value="Drops">Drops</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Strength</label>
                      <input
                        type="text"
                        placeholder="e.g., 500mg, 10ml"
                        className="input-saas w-full"
                        value={medicineForm.strength}
                        onChange={(e) => setMedicineForm({ ...medicineForm, strength: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Description</label>
                    <textarea
                      rows={3}
                      className="input-saas w-full resize-none"
                      value={medicineForm.description}
                      onChange={(e) => setMedicineForm({ ...medicineForm, description: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-800/40 rounded-xl border border-gray-700/50">
                    <div className="flex items-center">
                      <input
                        id="requiresPrescription"
                        name="requiresPrescription"
                        type="checkbox"
                        className="h-5 w-5 text-emerald-500 focus:ring-emerald-500/20 border-gray-600 rounded bg-gray-900 cursor-pointer"
                        checked={Boolean(medicineForm.requiresPrescription)}
                        onChange={(e) => setMedicineForm({ ...medicineForm, requiresPrescription: e.target.checked })}
                      />
                      <label htmlFor="requiresPrescription" className="ml-3 text-sm font-semibold text-gray-300 cursor-pointer select-none">
                        Requires Prescription
                      </label>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${medicineForm.requiresPrescription ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-gray-700/30 text-gray-500 border border-gray-700/50'}`}>
                      {medicineForm.requiresPrescription ? 'Yes' : 'No'}
                    </span>
                  </div>

                  <div className="flex justify-end items-center gap-4 pt-8 pb-12">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMedicineModal(false);
                        setEditingMedicine(null);
                        resetMedicineForm();
                      }}
                      className="btn-saas-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-saas-primary"
                    >
                      {editingMedicine ? 'Update' : 'Add'}
                    </button>
                  </div>
                  {/* Added spacer for better visibility */}
                  <div className="h-12" />
                </form>
              </div>
            </div>
          </div>
        )
      }

      {/* Prescription Verification Modal */}
      {
        showPrescriptionModal && selectedOrder && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md overflow-y-auto h-full w-full z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-in-right">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Verify Prescription
                </h3>
                <button
                  onClick={() => {
                    setShowPrescriptionModal(false);
                    setSelectedOrder(null);
                    setPrescriptionVerification({ approved: true, verificationNotes: '' });
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Order Details Summary */}
                <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Order ID</span>
                    <span className="text-gray-900 font-bold">#{selectedOrder.orderId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Patient Name</span>
                    <span className="text-gray-900 font-bold">{selectedOrder.customer.fullName}</span>
                  </div>
                </div>

                {/* Prescription Image */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Prescription Document</label>
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                    <img
                      src={`http://localhost:8081/api/orders/prescription/${selectedOrder.prescriptionPath}`}
                      alt="Prescription"
                      className="h-full w-full object-contain"
                    />
                    <a
                      href={`http://localhost:8081/api/orders/prescription/${selectedOrder.prescriptionPath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg hover:bg-white transition-all group"
                      title="View Full Resolution"
                    >
                      <ExternalLink className="h-5 w-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                    </a>
                  </div>
                </div>

                {/* Verification Actions */}
                <div className="space-y-4">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Verification Status</label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`
                    relative flex cursor-pointer rounded-xl border p-4 shadow-sm hover:border-emerald-400 focus:outline-none transition-all
                    ${prescriptionVerification.approved ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50' : 'border-gray-200'}
                  `}>
                      <input
                        type="radio"
                        name="verification"
                        className="sr-only"
                        checked={prescriptionVerification.approved}
                        onChange={() => setPrescriptionVerification({ ...prescriptionVerification, approved: true })}
                      />
                      <div className="flex w-full items-center justify-center">
                        <CheckCircle2 className={`h-5 w-5 mr-2 ${prescriptionVerification.approved ? 'text-emerald-600' : 'text-gray-400'}`} />
                        <span className={`font-medium ${prescriptionVerification.approved ? 'text-emerald-900' : 'text-gray-900'}`}>Approve</span>
                      </div>
                    </label>

                    <label className={`
                    relative flex cursor-pointer rounded-xl border p-4 shadow-sm hover:border-red-400 focus:outline-none transition-all
                    ${!prescriptionVerification.approved ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : 'border-gray-200'}
                  `}>
                      <input
                        type="radio"
                        name="verification"
                        className="sr-only"
                        checked={!prescriptionVerification.approved}
                        onChange={() => setPrescriptionVerification({ ...prescriptionVerification, approved: false })}
                      />
                      <div className="flex w-full items-center justify-center">
                        <XCircle className={`h-5 w-5 mr-2 ${!prescriptionVerification.approved ? 'text-red-600' : 'text-gray-400'}`} />
                        <span className={`font-medium ${!prescriptionVerification.approved ? 'text-red-900' : 'text-gray-900'}`}>Reject</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Verification Notes</label>
                  <textarea
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    placeholder="Add notes about the prescription verification..."
                    value={prescriptionVerification.verificationNotes}
                    onChange={(e) => setPrescriptionVerification({ ...prescriptionVerification, verificationNotes: e.target.value })}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    onClick={() => {
                      setShowPrescriptionModal(false);
                      setSelectedOrder(null);
                      setPrescriptionVerification({ approved: true, verificationNotes: '' });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleVerifyPrescription(selectedOrder.orderId)}
                    className={`px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors ${prescriptionVerification.approved
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                      }`}
                  >
                    {prescriptionVerification.approved ? 'Approve' : 'Reject'} Prescription
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </>
  );
};

export default PharmacyDashboard;