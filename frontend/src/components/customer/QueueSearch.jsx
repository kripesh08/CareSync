import React, { useState, useEffect } from 'react';
import { Search, Users, Clock, MapPin, Building2, Ticket, AlertCircle, Calendar, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const QueueSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDateForView, setSelectedDateForView] = useState(new Date().toISOString().split('T')[0]);
  const navigate = useNavigate();

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        searchQueues();
      } else if (searchTerm.trim().length === 0) {
        setQueues([]);
      }
    }, 500); // Debounce search

    return () => clearTimeout(delaySearch);
  }, [searchTerm, selectedDateForView]);

  const searchQueues = async () => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8081/api/queues/search?query=${encodeURIComponent(searchTerm.trim())}&date=${selectedDateForView}`);
      
      if (response.ok) {
        const data = await response.json();
        setQueues(data);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to search queues' }));
        console.error('Search error:', errorData);
        toast.error(errorData.message || 'Failed to search queues');
      }
    } catch (error) {
      console.error('Error searching queues:', error);
      toast.error('Error searching queues');
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
          tokenDate: bookingDate
        })
      });

      if (response.ok) {
        const tokenData = await response.json();
        toast.success('Token booked successfully! Please complete payment.');
        setShowBookingModal(false);
        
        // Redirect to payment
        handlePayment(tokenData.tokenId);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to book token');
      }
    } catch (error) {
      console.error('Error booking token:', error);
      toast.error('Error booking token');
    }
  };

  const handlePayment = async (tokenId) => {
    try {
      const token = localStorage.getItem('token');
      
      // Create Razorpay order
      const orderResponse = await fetch(`http://localhost:8081/api/queue-tokens/${tokenId}/create-razorpay-order`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!orderResponse.ok) {
        toast.error('Failed to create payment order');
        return;
      }

      const orderData = await orderResponse.json();
      
      // Open Razorpay checkout
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
              toast.success('Payment successful! Token confirmed.');
              navigate('/my-tokens');
            } else {
              toast.error('Payment verification failed');
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

  // Group queues by hospital
  const queuesByHospital = queues.reduce((acc, queue) => {
    const hospitalName = queue.hospital?.hospitalName || 'Unknown Hospital';
    if (!acc[hospitalName]) {
      acc[hospitalName] = {
        hospital: queue.hospital,
        queues: []
      };
    }
    acc[hospitalName].queues.push(queue);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Search Queue Tokens</h1>
          <p className="text-gray-400 text-sm mt-1">Find available queues by department or consultation type</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <input
            type="date"
            value={selectedDateForView}
            onChange={(e) => setSelectedDateForView(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="input-saas"
          />
        </div>
      </div>

      {/* Search */}
      <div className="card-saas p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by department (e.g., Cardiology, Orthopedics) or consultation type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-saas w-full pl-10"
          />
        </div>
        {searchTerm && (
          <p className="text-xs text-gray-400 mt-2">
            {searchTerm.trim().length < 2 
              ? 'Type at least 2 characters to search...' 
              : `Searching for queues matching "${searchTerm}"...`}
          </p>
        )}
      </div>

      {/* Info Card */}
      {searchTerm.trim().length >= 2 && (
        <div className="card-saas p-4 bg-blue-500/10 border-blue-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-300">
              <p className="font-bold text-blue-400 mb-1">Token Booking Fee: ₹50</p>
              <p>This fee will be deducted from your consultation charges and helps prevent no-shows.</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Search Results */}
      {!loading && searchTerm.trim().length >= 2 && Object.keys(queuesByHospital).length === 0 && (
        <div className="text-center py-16 card-saas">
          <Search className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white">No queues found</h3>
          <p className="mt-2 text-gray-400">Try searching for different departments like "Cardiology", "Orthopedics", or "General Medicine".</p>
        </div>
      )}

      {/* Results by Hospital */}
      {!loading && Object.entries(queuesByHospital).map(([hospitalName, { hospital, queues: hospitalQueues }]) => (
        <div key={hospitalName} className="card-saas p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{hospitalName}</h3>
                {hospital?.city && (
                  <p className="text-sm text-gray-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {hospital.city}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => navigate(`/hospital/${hospital?.hospitalId}/queues`)}
              className="btn-saas-secondary text-sm"
            >
              View All Queues
            </button>
          </div>

          {/* Group queues by department */}
          {hospitalQueues.reduce((acc, queue) => {
            if (!acc[queue.departmentName]) {
              acc[queue.departmentName] = [];
            }
            acc[queue.departmentName].push(queue);
            return acc;
          }, {}) && Object.entries(hospitalQueues.reduce((acc, queue) => {
            if (!acc[queue.departmentName]) {
              acc[queue.departmentName] = [];
            }
            acc[queue.departmentName].push(queue);
            return acc;
          }, {})).map(([department, deptQueues]) => (
            <div key={department} className="mb-4 last:mb-0">
              <h4 className="text-md font-bold text-blue-400 mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                {department}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deptQueues.map((queue) => {
                  const availableSlots = queue.availableSlots || 0;
                  const bookedCount = queue.bookedCount || 0;
                  const isAvailable = availableSlots > 0 && queue.queueStatus === 'ACTIVE';
                  
                  return (
                    <div key={queue.queueId} className={`bg-gray-800/50 p-4 rounded-lg border ${
                      isAvailable ? 'border-gray-700/50' : 'border-red-500/30'
                    }`}>
                      <div className="mb-3">
                        <h5 className="font-bold text-white">{queue.queueName}</h5>
                        <p className="text-xs text-gray-400 mt-1">{queue.description || 'General consultation'}</p>
                      </div>

                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Available Slots:</span>
                          <span className={`font-bold ${isAvailable ? 'text-emerald-400' : 'text-red-400'}`}>
                            {availableSlots} / {queue.maxCapacity}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Booked:</span>
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
                          setBookingDate(selectedDateForView);
                          setShowBookingModal(true);
                        }}
                        disabled={!isAvailable}
                        className={`w-full text-sm flex items-center justify-center gap-2 ${
                          isAvailable ? 'btn-saas-primary' : 'btn-saas-secondary opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <Ticket className="h-4 w-4" />
                        {isAvailable ? 'Book Token' : 'Queue Full'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ))}

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
                    <span className="text-gray-400">Hospital:</span>
                    <span className="text-white font-medium">{selectedQueue.hospital?.hospitalName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Department:</span>
                    <span className="text-white font-medium">{selectedQueue.departmentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Queue:</span>
                    <span className="text-white font-medium">{selectedQueue.queueName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Token Fee:</span>
                    <span className="text-emerald-400 font-bold">₹50</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Select Date
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="input-saas w-full"
                />
              </div>

              <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                <p className="text-xs text-gray-300">
                  <AlertCircle className="h-4 w-4 inline mr-1 text-blue-400" />
                  You'll receive your token number after payment. The ₹50 fee will be adjusted in your consultation charges.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700/30">
                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setSelectedQueue(null);
                  }}
                  className="btn-saas-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBookToken}
                  className="btn-saas-primary"
                >
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

export default QueueSearch;