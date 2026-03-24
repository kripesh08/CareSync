import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Clock, Calendar, ArrowLeft, Ticket, AlertCircle, TrendingUp } from 'lucide-react';
import { toast } from 'react-toastify';

const QueueBrowse = () => {
  const { hospitalId } = useParams();
  const navigate = useNavigate();
  const [queues, setQueues] = useState([]);
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);

  // Always today — no advance booking
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const todayLabel = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const todayDay = today.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

  useEffect(() => {
    fetchQueues();
  }, [hospitalId]);

  const fetchQueues = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/queues/hospital/${hospitalId}?date=${todayStr}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setQueues(data);
        if (data.length > 0 && data[0].hospital) {
          setHospital(data[0].hospital);
        }
      } else {
        toast.error('Failed to fetch queues');
      }
    } catch (error) {
      toast.error('Error loading queues');
    } finally {
      setLoading(false);
    }
  };

  const handleBookToken = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/queue-tokens/book', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          queueId: selectedQueue.queueId,
          tokenDate: todayStr
        })
      });

      if (response.ok) {
        const tokenData = await response.json();
        setShowBookingModal(false);
        setPrediction(null);
        handlePayment(tokenData.tokenId);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to book token');
      }
    } catch (error) {
      toast.error('Error booking token');
    }
  };

  const fetchPrediction = async (queueId) => {
    setLoadingPrediction(true);
    try {
      const queue = queues.find(q => q.queueId === queueId);
      const nextTokenNumber = (queue?.bookedCount || 0) + 1;
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8081/api/admin/data/predict?queueId=${queueId}&date=${todayStr}&tokenNumber=${nextTokenNumber}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.ok) {
        setPrediction(await response.json());
      }
    } catch (error) {
      // prediction is optional, fail silently
    } finally {
      setLoadingPrediction(false);
    }
  };

  const handlePayment = async (tokenId) => {
    try {
      const token = localStorage.getItem('token');
      const orderResponse = await fetch(`http://localhost:8081/api/queue-tokens/${tokenId}/create-razorpay-order`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!orderResponse.ok) { toast.error('Failed to create payment order'); return; }

      const orderData = await orderResponse.json();
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'CareSync - Queue Token',
        description: 'Token Booking Fee',
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            const verifyResponse = await fetch(`http://localhost:8081/api/queue-tokens/${tokenId}/payment`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              })
            });
    if (verifyResponse.ok) {
              toast.success('Payment successful! Token confirmed.');
              navigate('/my-tokens');
            } else {
              const error = await verifyResponse.json();
              toast.error(error.message || 'Payment verification failed');
            }
          } catch (err) {
            toast.error('Error verifying payment');
          }
        },
        prefill: { name: '', email: '', contact: '' },
        theme: { color: '#3B82F6' },
        modal: {
          ondismiss: function () {
            // User closed the modal — not an error
            toast.info('Payment cancelled. Your token is reserved for 10 minutes.');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response) => {
        toast.error('Payment failed: ' + response.error.description);
      });
      razorpay.open();
      // NOTE: do NOT wrap razorpay.open() result — it throws on modal dismiss which is not an error
    } catch (error) {
      // Only show error for fetch failures, not Razorpay modal events
      if (error && error.message && !error.message.includes('modal')) {
        toast.error('Failed to create payment order');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-slate-900/50 rounded-2xl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const queuesByDepartment = queues.reduce((acc, queue) => {
    if (!acc[queue.departmentName]) acc[queue.departmentName] = [];
    acc[queue.departmentName].push(queue);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={() => navigate('/browse-hospitals')} className="btn-saas-secondary">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {hospital?.hospitalName || 'Hospital Queues'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">Select a queue to book your token</p>
        </div>
        {/* Today's date — display only, no picker */}
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Calendar className="h-4 w-4" />
          {todayLabel}
        </div>
      </div>

      {/* Info Card */}
      <div className="card-saas p-4 bg-blue-500/10 border-blue-500/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300">
            <p className="font-bold text-blue-400 mb-1">Token Booking Fee: ₹50</p>
            <p>This fee will be deducted from your consultation charges and helps prevent no-shows.</p>
          </div>
        </div>
      </div>

      {/* Queues by Department */}
      {Object.keys(queuesByDepartment).length === 0 ? (
        <div className="text-center py-16 card-saas">
          <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white">No queues available today</h3>
          <p className="mt-2 text-gray-400">This hospital hasn't set up any queues for today.</p>
        </div>
      ) : (
        Object.entries(queuesByDepartment).map(([department, deptQueues]) => (
          <div key={department} className="card-saas p-6">
            <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              {department}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deptQueues.map((queue) => {
                const availableSlots = queue.availableSlots || 0;
                const bookedCount = queue.bookedCount || 0;
                const operatesOnDay = !queue.operatingDays ||
                  queue.operatingDays.split(',').map(d => d.trim()).includes(todayDay);
                const isAvailable = availableSlots > 0 &&
                  (queue.queueStatus === 'OPEN' || queue.queueStatus === 'ACTIVE') &&
                  operatesOnDay;

                return (
                  <div key={queue.queueId} className={`bg-gray-800/50 p-4 rounded-lg border ${
                    isAvailable ? 'border-gray-700/50' : 'border-red-500/30'
                  }`}>
                    <div className="mb-3">
                      <h4 className="font-bold text-white">{queue.queueName}</h4>
                      <p className="text-sm text-blue-400 font-medium">Dr. {queue.doctorName || 'Not Assigned'}</p>
                      <p className="text-xs text-gray-400 mt-1">{queue.description || 'General consultation'}</p>
                      {!operatesOnDay && (
                        <p className="text-xs text-red-400 mt-1 font-medium">
                          Not operating on {todayDay.charAt(0) + todayDay.slice(1).toLowerCase()}s
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Available Slots:</span>
                        <span className={`font-bold ${isAvailable ? 'text-emerald-400' : 'text-red-400'}`}>
                          {availableSlots} / {queue.maxCapacity}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Booked Today:</span>
                        <span className="text-blue-400 font-medium">{bookedCount}</span>
                      </div>
                      {queue.startTime && queue.endTime && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Timings:</span>
                          <span className="text-white">{queue.startTime} - {queue.endTime}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedQueue(queue);
                        setShowBookingModal(true);
                        fetchPrediction(queue.queueId);
                      }}
                      disabled={!isAvailable}
                      className={`w-full text-sm flex items-center justify-center gap-2 ${
                        isAvailable ? 'btn-saas-primary' : 'btn-saas-secondary opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <Ticket className="h-4 w-4" />
                      {isAvailable ? 'Book Token' : availableSlots === 0 ? 'Queue Full' : !operatesOnDay ? `Closed Today` : 'Unavailable'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedQueue && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative modal-glass-saas w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-700/50">
              <h3 className="text-xl font-bold text-white">Book Token</h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Department:</span>
                    <span className="text-white font-medium">{selectedQueue.departmentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Queue:</span>
                    <span className="text-white font-medium">{selectedQueue.queueName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Doctor:</span>
                    <span className="text-white font-medium">Dr. {selectedQueue.doctorName || 'Not Assigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date:</span>
                    <span className="text-white font-medium">{todayLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Token Fee:</span>
                    <span className="text-emerald-400 font-bold">₹50</span>
                  </div>
                </div>
              </div>

              {/* AI Prediction */}
              {loadingPrediction && (
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50 animate-pulse">
                  <p className="text-sm text-gray-400">Calculating estimated wait time...</p>
                </div>
              )}
              {prediction && !loadingPrediction && (
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 rounded-lg border border-blue-500/20">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-blue-400 mb-2">AI Prediction</p>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-400">Estimated Wait:</span>
                          <span className="text-white font-bold ml-2">{prediction.formattedWaitingTime}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Avg Time/Token:</span>
                          <span className="text-white font-medium ml-2">{Math.round(prediction.averageTimePerToken)} min</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Peak Hour:</span>
                          <span className="text-white font-medium ml-2">{prediction.peakHoursInfo.peakHourRange}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Based on historical data from {prediction.dayOfWeek.toLowerCase()}s • {prediction.confidenceLevel} confidence
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                <p className="text-xs text-gray-300">
                  <AlertCircle className="h-4 w-4 inline mr-1 text-blue-400" />
                  You'll receive your token number after payment. The ₹50 fee will be adjusted in your consultation charges.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700/30">
                <button
                  onClick={() => { setShowBookingModal(false); setSelectedQueue(null); setPrediction(null); }}
                  className="btn-saas-secondary"
                >
                  Cancel
                </button>
                <button onClick={handleBookToken} className="btn-saas-primary">
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueueBrowse;
