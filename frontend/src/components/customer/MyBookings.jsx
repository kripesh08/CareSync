import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, XCircle, Upload, Eye, RefreshCw, Pill, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const MyBookings = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/bookings/my-bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        toast.error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handlePrescriptionUpload = async (e) => {
    e.preventDefault();

    if (!prescriptionFile) {
      toast.error('Please select a prescription file');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('prescription', prescriptionFile);

      const response = await fetch(`http://localhost:8081/api/bookings/${selectedOrder.orderId}/upload-prescription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        toast.success('Prescription uploaded successfully');
        setShowPrescriptionModal(false);
        setSelectedOrder(null);
        setPrescriptionFile(null);
        fetchOrders();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to upload prescription');
      }
    } catch (error) {
      console.error('Error uploading prescription:', error);
      toast.error('Error uploading prescription');
    }
  };

  const handlePayment = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      
      // Step 1: Create Razorpay order
      const orderResponse = await fetch(`http://localhost:8081/api/bookings/${orderId}/create-razorpay-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        toast.error(error.message || 'Failed to create payment order');
        return;
      }

      const orderData = await orderResponse.json();
      
      // Step 2: Open Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'CareSync',
        description: 'Medicine Order Payment',
        order_id: orderData.orderId,
        handler: async function (response) {
          // Step 3: Verify payment on backend
          try {
            const verifyResponse = await fetch(`http://localhost:8081/api/bookings/${orderId}/payment`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              })
            });

            if (verifyResponse.ok) {
              toast.success('Payment successful! Your order is confirmed.');
              fetchOrders();
            } else {
              const error = await verifyResponse.json();
              toast.error(error.message || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Error verifying payment:', error);
            toast.error('Error verifying payment');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        theme: {
          color: '#3B82F6'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
      razorpay.on('payment.failed', function (response) {
        toast.error('Payment failed: ' + response.error.description);
      });
      
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Error processing payment');
    }
  };

  const handleCancelOrder = async (orderId) => {
    const reason = window.prompt('Please provide a reason for cancellation:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cancellationReason: reason })
      });

      if (response.ok) {
        toast.success('Order cancelled successfully');
        fetchOrders();
      } else {
        toast.error('Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Error cancelling order');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'CONFIRMED':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'DELIVERED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'CANCELLED':
      case 'REJECTED':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'CONFIRMED':
        return <Package className="h-4 w-4" />;
      case 'DELIVERED':
        return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED':
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
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
          <h1 className="text-2xl font-bold text-white tracking-tight">My Bookings</h1>
          <p className="text-gray-400 text-sm mt-1">View and manage your medicine orders</p>
        </div>
        <button
          onClick={fetchOrders}
          className="btn-saas-secondary flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="text-center py-16 card-saas">
          <div className="mx-auto h-24 w-24 bg-gray-800/40 rounded-full flex items-center justify-center mb-4">
            <Package className="h-12 w-12 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-white">No orders yet</h3>
          <p className="mt-2 text-gray-400">Start by searching for medicines you need.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.orderId} className="card-saas p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500/10 p-2 rounded-lg">
                        <Pill className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">{order.medicine.medicineName}</h4>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mt-2 sm:mt-0 w-fit ${getStatusColor(order.orderStatus)}`}>
                      {getStatusIcon(order.orderStatus)}
                      <span className="uppercase tracking-wide">{order.orderStatus}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
                      <div className="spec-label">Amount</div>
                      <div className="text-white font-semibold">{order.quantity} units × ₹{order.unitPrice}</div>
                      <div className="text-blue-400 font-bold mt-1">Total: ₹{order.totalAmount}</div>
                    </div>

                    <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
                      <div className="spec-label">Pharmacy</div>
                      <div className="text-white font-medium truncate">{order.pharmacy.pharmacyName}</div>
                      <div className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {order.pharmacy.city}
                      </div>
                    </div>

                    <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
                      <div className="spec-label">Payment Status</div>
                      <div className={`text-sm font-bold ${
                        order.paymentStatus === 'SUCCESS' ? 'text-emerald-400' :
                        order.paymentStatus === 'PENDING' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {order.paymentStatus}
                      </div>
                      {order.requiresPrescription && (
                        <div className="text-xs text-gray-400 mt-1">
                          Rx: {order.prescriptionStatus}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Show rejection reason if prescription was rejected */}
                  {order.prescriptionStatus === 'REJECTED' && order.prescriptionVerificationNotes && (
                    <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-red-400 uppercase tracking-wide mb-1">Rejection Reason</div>
                          <div className="text-sm text-gray-300">{order.prescriptionVerificationNotes}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-row lg:flex-col gap-2 lg:pl-6 lg:border-l border-gray-700/30">
                  {(order.requiresPrescription && order.prescriptionStatus === 'PENDING_UPLOAD') && (
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowPrescriptionModal(true);
                      }}
                      className="btn-saas-primary text-xs flex items-center gap-1.5 justify-center"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload Rx
                    </button>
                  )}

                  {order.requiresPrescription && order.prescriptionImagePath && (
                    <button
                      onClick={() => window.open(order.prescriptionImagePath, '_blank')}
                      className="btn-saas-secondary text-xs flex items-center gap-1.5 justify-center"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Rx
                    </button>
                  )}

                  {order.paymentStatus === 'PENDING' && 
                   order.orderStatus !== 'CANCELLED' &&
                   order.orderStatus !== 'REJECTED' &&
                   (!order.requiresPrescription || order.prescriptionStatus === 'VERIFIED' || order.prescriptionStatus === 'NOT_REQUIRED') && (
                    <button
                      onClick={() => handlePayment(order.orderId)}
                      className="btn-saas-primary text-xs flex items-center gap-1.5 justify-center"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Pay Now
                    </button>
                  )}

                  {(order.orderStatus === 'PENDING' || order.orderStatus === 'CONFIRMED') && 
                   order.paymentStatus === 'PENDING' && 
                   order.orderStatus !== 'CANCELLED' &&
                   order.orderStatus !== 'REJECTED' && (
                    <button
                      onClick={() => handleCancelOrder(order.orderId)}
                      className="btn-saas-secondary text-xs flex items-center gap-1.5 justify-center hover:text-red-400 hover:border-red-500/20"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prescription Upload Modal */}
      {showPrescriptionModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="relative modal-glass-saas w-full max-w-md overflow-hidden animate-slide-in-right">
            <div className="px-6 py-4 border-b border-gray-700/50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Upload Prescription</h3>
              <button
                onClick={() => {
                  setShowPrescriptionModal(false);
                  setSelectedOrder(null);
                  setPrescriptionFile(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handlePrescriptionUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Select File</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-700 border-dashed rounded-xl hover:border-blue-500/50 transition-colors cursor-pointer relative bg-gray-800/20">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-500" />
                      <div className="flex text-sm text-gray-400 justify-center">
                        <label className="relative cursor-pointer rounded-md font-medium text-blue-400 hover:text-blue-300">
                          <span>Upload a file</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            required
                            className="sr-only"
                            onChange={(e) => setPrescriptionFile(e.target.files[0])}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                      {prescriptionFile && (
                        <p className="text-sm text-emerald-400 font-medium mt-2">
                          ✓ {prescriptionFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPrescriptionModal(false);
                      setSelectedOrder(null);
                      setPrescriptionFile(null);
                    }}
                    className="btn-saas-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-saas-primary">
                    Upload
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
