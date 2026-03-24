import React, { useState, useEffect } from 'react';
import { Package, Search, Eye, Calendar, User, Building2, Pill, FileText, DollarSign, X } from 'lucide-react';
import { toast } from 'react-toastify';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/admin/orders/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        toast.error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.medicine?.medicineName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.pharmacy?.pharmacyName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || order.orderStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'CONFIRMED': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'DELIVERED': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'CANCELLED': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      case 'REJECTED': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-400';
      case 'SUCCESS': return 'text-green-400';
      case 'FAILED': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Order Management</h2>
        <p className="text-gray-400 text-sm mt-1">View and manage all medicine orders</p>
      </div>

      {/* Filters */}
      <div className="card-saas p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by medicine, patient, or pharmacy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-saas w-full pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-saas"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card-saas overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50 border-b border-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Medicine</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Pharmacy</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-400">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.orderId} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                      #{order.orderId}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {order.customer?.fullName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {order.medicine?.medicineName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {order.pharmacy?.pharmacyName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {order.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                      ₹{order.totalAmount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowDetailsModal(true);
                        }}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50 p-4">
          <div className="min-h-full flex items-center justify-center">
            <div className="relative modal-glass-saas w-full max-w-3xl my-8">
              <div className="px-6 py-4 border-b border-gray-700/50 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Order Details - #{selectedOrder.orderId}</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Order Status */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold border ${getStatusColor(selectedOrder.orderStatus)}`}>
                    {selectedOrder.orderStatus}
                  </span>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Order Date</p>
                    <p className="text-white font-medium">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30">
                  <h4 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Customer Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Name</p>
                      <p className="text-white">{selectedOrder.customer?.fullName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Email</p>
                      <p className="text-white">{selectedOrder.customer?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Phone</p>
                      <p className="text-white">{selectedOrder.customer?.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Pharmacy Information */}
                <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30">
                  <h4 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Pharmacy Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Name</p>
                      <p className="text-white">{selectedOrder.pharmacy?.pharmacyName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">City</p>
                      <p className="text-white">{selectedOrder.pharmacy?.city || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400">Address</p>
                      <p className="text-white">{selectedOrder.pharmacy?.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Medicine Information */}
                <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30">
                  <h4 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                    <Pill className="h-4 w-4" />
                    Medicine Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Medicine Name</p>
                      <p className="text-white font-medium">{selectedOrder.medicine?.medicineName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Category</p>
                      <p className="text-white">{selectedOrder.medicine?.category || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Prescription Required</p>
                      <p className="text-white">{selectedOrder.requiresPrescription ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Price per Unit</p>
                      <p className="text-white">₹{selectedOrder.unitPrice || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30">
                  <h4 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Order Details
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Quantity</span>
                      <span className="text-white font-medium">{selectedOrder.quantity} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Amount</span>
                      <span className="text-white font-bold text-lg">₹{selectedOrder.totalAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Payment Status</span>
                      <span className={`font-medium ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                        {selectedOrder.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Prescription */}
                {selectedOrder.prescriptionImagePath && (
                  <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30">
                    <h4 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Prescription
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status</span>
                        <span className="text-white">{selectedOrder.prescriptionStatus}</span>
                      </div>
                      <a
                        href={selectedOrder.prescriptionImagePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline inline-block"
                      >
                        View Prescription
                      </a>
                      {selectedOrder.prescriptionVerificationNotes && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-400">Verification Notes</p>
                          <p className="text-gray-300">{selectedOrder.prescriptionVerificationNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Pharmacy Notes */}
                {selectedOrder.pharmacyNotes && (
                  <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30">
                    <h4 className="text-sm font-bold text-gray-400 uppercase mb-2">Pharmacy Notes</h4>
                    <p className="text-gray-300">{selectedOrder.pharmacyNotes}</p>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-700/30 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="btn-saas-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
