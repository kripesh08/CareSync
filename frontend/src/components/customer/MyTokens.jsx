import React, { useState, useEffect } from 'react';
import { Ticket, Clock, CheckCircle, XCircle, Calendar, Building2, Users, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const MyTokens = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queueStatuses, setQueueStatuses] = useState({});

  useEffect(() => {
    fetchTokens();
    // Request browser notification permission for token call alerts
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Smart polling — 5s if patient has active token, 30s otherwise
  useEffect(() => {
    const hasActiveToken = tokens.some(t =>
      t.tokenStatus === 'WAITING' || t.tokenStatus === 'IN_PROGRESS'
    );
    const interval = setInterval(() => {
      fetchTokens(); // fetchQueueStatuses is called inside fetchTokens
    }, hasActiveToken ? 5000 : 30000);

    return () => clearInterval(interval);
  }, [tokens]);

  const fetchTokens = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/queue-tokens/my-tokens', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();

        // Detect token called (WAITING → IN_PROGRESS) and notify
        setTokens(prev => {
          data.forEach(newT => {
            const old = prev.find(o => o.tokenId === newT.tokenId);
            if (old?.tokenStatus === 'WAITING' && newT.tokenStatus === 'IN_PROGRESS') {
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('CareSync — Your turn!', {
                  body: `Token #${newT.tokenNumber} is being called. Please proceed to the consultation room.`,
                });
              }
            }
          });
          return data;
        });
        fetchQueueStatuses(data);
      } else {
        toast.error('Failed to fetch tokens');
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
      toast.error('Error loading tokens');
    } finally {
      setLoading(false);
    }
  };

  const fetchQueueStatuses = async (latestTokens) => {
    const token = localStorage.getItem('token');
    const statuses = {};
    const list = latestTokens || tokens;

    for (const queueToken of list) {
      if (['WAITING', 'IN_PROGRESS'].includes(queueToken.tokenStatus)) {
        try {
          const response = await fetch(`http://localhost:8081/api/queue-tokens/${queueToken.tokenId}/queue-status`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            const data = await response.json();
            statuses[queueToken.tokenId] = data;
          }
        } catch (error) {
          console.error(`Error fetching status for token ${queueToken.tokenId}:`, error);
        }
      }
    }
    
    setQueueStatuses(statuses);
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
              fetchTokens();
            } else {
              toast.error('Payment verification failed');
            }
          } catch (err) {
            toast.error('Error verifying payment');
          }
        },
        theme: { color: '#3B82F6' },
        modal: {
          ondismiss: function () {
            toast.info('Payment cancelled. Complete payment to confirm your slot.');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        toast.error('Payment failed: ' + response.error.description);
      });
      razorpay.open();
      
    } catch (error) {
      toast.error('Failed to create payment order');
    }
  };

  const handleCancelToken = async (tokenId) => {
    if (!window.confirm('Are you sure you want to cancel this token?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/queue-tokens/${tokenId}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Token cancelled successfully');
        fetchTokens();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to cancel token');
      }
    } catch (error) {
      console.error('Error cancelling token:', error);
      toast.error('Error cancelling token');
    }
  };

  const calcEstimatedArrival = (queueStatus) => {
    const { tokensAhead, avgTimePerPatient } = queueStatus;
    if (tokensAhead == null) return null;
    if (tokensAhead === 0) return { time: null, waitMins: 0, tokensAhead: 0 };
    if (!avgTimePerPatient) return null;
    const waitMins = tokensAhead * avgTimePerPatient;
    const arrival = new Date(Date.now() + waitMins * 60000);
    return {
      time: arrival.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      waitMins,
      tokensAhead
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'WAITING':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'IN_PROGRESS':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'CANCELLED':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      case 'NO_SHOW':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'WAITING':
        return <Clock className="h-4 w-4" />;
      case 'IN_PROGRESS':
        return <AlertCircle className="h-4 w-4" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED':
      case 'NO_SHOW':
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
          <h1 className="text-2xl font-bold text-white tracking-tight">My Tokens</h1>
          <p className="text-gray-400 text-sm mt-1">View and manage your queue tokens</p>
        </div>
        <button
          onClick={fetchTokens}
          className="btn-saas-secondary flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Tokens List */}
      {tokens.length === 0 ? (
        <div className="text-center py-16 card-saas">
          <div className="mx-auto h-24 w-24 bg-gray-800/40 rounded-full flex items-center justify-center mb-4">
            <Ticket className="h-12 w-12 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-white">No tokens yet</h3>
          <p className="mt-2 text-gray-400">Book a queue token at any hospital to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tokens.map((token) => (
            <div key={token.tokenId} className="card-saas p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500/10 p-3 rounded-lg">
                        <Ticket className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-blue-400">
                        {token.tokenNumber ? `#${token.tokenNumber}` : <span className="text-lg text-yellow-400">Pending Payment</span>}
                      </div>
                        <div className="text-sm text-gray-400">{token.queue.queueName}</div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mt-2 sm:mt-0 w-fit ${getStatusColor(token.tokenStatus)}`}>
                      {getStatusIcon(token.tokenStatus)}
                      <span className="uppercase tracking-wide">{token.tokenStatus}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
                      <div className="spec-label">Hospital</div>
                      <div className="text-white font-medium flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {token.queue.hospital.hospitalName}
                      </div>
                      <div className="text-gray-400 text-xs mt-1">{token.queue.hospital.city}</div>
                    </div>

                    <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
                      <div className="spec-label">Department & Queue</div>
                      <div className="text-white font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {token.queue.departmentName}
                      </div>
                      <div className="text-gray-400 text-xs mt-1">{token.queue.queueName}</div>
                    </div>

                    <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
                      <div className="spec-label">Date & Time</div>
                      <div className="text-white font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(token.tokenDate).toLocaleDateString()}
                      </div>
                      {/* Show live estimate if available, else fall back to static */}
                      {(() => {
                        const qs = queueStatuses[token.tokenId];
                        if (token.tokenStatus === 'IN_PROGRESS') {
                          return <div className="text-yellow-400 text-xs mt-1 font-medium">Your turn now</div>;
                        }
                        if (token.tokenStatus === 'WAITING') {
                          if (qs) {
                            // Live data available
                            if (qs.tokensAhead === 0) {
                              return <div className="text-yellow-400 text-xs mt-1 font-medium">Your turn soon</div>;
                            }
                            const live = calcEstimatedArrival(qs);
                            if (live?.time) {
                              return <div className="text-blue-400 text-xs mt-1">Est: ~{live.time}</div>;
                            }
                          }
                          // fallback to static while live data loads
                          if (token.estimatedTime) {
                            return <div className="text-gray-400 text-xs mt-1">Est: {new Date(token.estimatedTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>;
                          }
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Payment:</span>
                    <span className={`font-bold ${
                      token.paymentStatus === 'COMPLETED' ? 'text-emerald-400' :
                      token.paymentStatus === 'PENDING' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {token.paymentStatus}
                    </span>
                    {token.paymentStatus === 'COMPLETED' && (
                      <span className="text-gray-400">• ₹{token.tokenFee}</span>
                    )}
                  </div>

                  {/* Status Messages */}
                  {['WAITING', 'IN_PROGRESS', 'PENDING_PAYMENT'].includes(token.tokenStatus) && queueStatuses[token.tokenId] && (() => {
                    const qs = queueStatuses[token.tokenId];
                    const arrival = calcEstimatedArrival(qs);
                    return (
                      <div className="mt-3 space-y-2">
                        {/* Estimated arrival — prominent card */}
                        {token.tokenStatus === 'WAITING' && qs.tokensAhead > 0 && (() => {
                          const arrival = calcEstimatedArrival(qs);
                          if (!arrival?.time) return null;
                          return (
                            <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-blue-400 shrink-0" />
                                <div>
                                  <p className="text-xs text-gray-400">Estimated time to visit</p>
                                  <p className="text-xl font-bold text-blue-400">{arrival.time}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-400">Wait</p>
                                <p className="text-lg font-bold text-white">
                                  {arrival.waitMins < 60
                                    ? `~${arrival.waitMins} min`
                                    : `~${Math.floor(arrival.waitMins / 60)}h ${arrival.waitMins % 60}m`}
                                </p>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Queue progress row */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-gray-800/40 p-2 rounded-lg border border-gray-700/30">
                            <p className="text-xs text-gray-400">Tokens Ahead</p>
                            <p className="text-lg font-bold text-yellow-400">{qs.tokensAhead}</p>
                          </div>
                          <div className="bg-gray-800/40 p-2 rounded-lg border border-gray-700/30">
                            <p className="text-xs text-gray-400">Now Serving</p>
                            <p className="text-lg font-bold text-blue-400">
                              {qs.currentTokenNumber ? `#${qs.currentTokenNumber}` : '—'}
                            </p>
                          </div>
                          <div className="bg-gray-800/40 p-2 rounded-lg border border-gray-700/30">
                            <p className="text-xs text-gray-400">Completed</p>
                            <p className="text-lg font-bold text-emerald-400">{qs.completedToday}</p>
                          </div>
                        </div>

                        {qs.tokensAhead === 0 && token.tokenStatus === 'WAITING' && (
                          <div className="bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                            <p className="text-sm text-yellow-400 font-medium">⚡ You're next! Please be ready at the hospital.</p>
                          </div>
                        )}
                        {token.tokenStatus === 'IN_PROGRESS' && (
                          <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                            <p className="text-sm text-blue-400 font-medium">🔔 Your token is being called! Please proceed to the consultation room.</p>
                          </div>
                        )}
                        {token.tokenStatus === 'PENDING_PAYMENT' && (
                          <div className="bg-orange-500/10 p-3 rounded-lg border border-orange-500/20">
                            <p className="text-sm text-orange-400 font-medium">⚠ Complete payment to confirm your slot. Time shown is tentative.</p>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 text-right">Auto-refreshes every 30s</p>
                      </div>
                    );
                  })()}
                  {token.tokenStatus === 'COMPLETED' && token.completedAt && (
                    <div className="mt-3 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                      <p className="text-sm text-emerald-400">
                        ✓ Completed on {new Date(token.completedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-row lg:flex-col gap-2 lg:pl-6 lg:border-l border-gray-700/30">
                  {token.paymentStatus === 'PENDING' && (
                    <button
                      onClick={() => handlePayment(token.tokenId)}
                      className="btn-saas-primary text-xs flex items-center gap-1.5 justify-center"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Pay Now
                    </button>
                  )}

                  {token.tokenStatus === 'WAITING' && token.paymentStatus === 'COMPLETED' && (
                    <button
                      onClick={() => handleCancelToken(token.tokenId)}
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
    </div>
  );
};

export default MyTokens;
