import React, { useState, useEffect } from 'react';
import { Users, Clock, CheckCircle, Phone, Calendar, RefreshCw, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';

const TokenBoard = () => {
  const [tokens, setTokens] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState({
    totalTokens: 0,
    waitingTokens: 0,
    inProgressTokens: 0,
    completedTokens: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTokens();
    fetchStats();
    
    const interval = setInterval(() => {
      fetchTokens();
      fetchStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [selectedDate]);

  const fetchTokens = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/queue-tokens/hospital/today?date=${selectedDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTokens(data);
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/queue-tokens/hospital/stats?date=${selectedDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          toast.error(errorJson.message || 'Failed to fetch statistics');
        } catch (e) {
          toast.error('Failed to fetch statistics');
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCallToken = async (tokenId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/queue-tokens/${tokenId}/call`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Token called successfully');
        fetchTokens();
        fetchStats();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to call token');
      }
    } catch (error) {
      console.error('Error calling token:', error);
      toast.error('Error calling token');
    }
  };

  const handleCompleteToken = async (tokenId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/queue-tokens/${tokenId}/complete`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Token completed successfully');
        fetchTokens();
        fetchStats();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to complete token');
      }
    } catch (error) {
      console.error('Error completing token:', error);
      toast.error('Error completing token');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'WAITING':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'IN_PROGRESS':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const waitingTokens = tokens.filter(t => t.tokenStatus === 'WAITING');
  const inProgressTokens = tokens.filter(t => t.tokenStatus === 'IN_PROGRESS');

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Token Board</h2>
          <p className="text-gray-400 text-sm mt-1">Real-time queue management</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-saas"
            />
          </div>
          <button onClick={() => { fetchTokens(); fetchStats(); }} className="btn-saas-secondary flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-saas p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Total</div>
              <div className="text-2xl font-bold text-white mt-1">{stats.totalTokens}</div>
            </div>
            <Users className="h-6 w-6 text-blue-400" />
          </div>
        </div>
        <div className="card-saas p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Waiting</div>
              <div className="text-2xl font-bold text-yellow-400 mt-1">{stats.waitingTokens}</div>
            </div>
            <Clock className="h-6 w-6 text-yellow-400" />
          </div>
        </div>
        <div className="card-saas p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">In Progress</div>
              <div className="text-2xl font-bold text-blue-400 mt-1">{stats.inProgressTokens}</div>
            </div>
            <ArrowRight className="h-6 w-6 text-blue-400" />
          </div>
        </div>
        <div className="card-saas p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Completed</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{stats.completedTokens}</div>
            </div>
            <CheckCircle className="h-6 w-6 text-emerald-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-saas p-6">
          <h3 className="text-lg font-bold text-yellow-400 mb-4">Waiting ({waitingTokens.length})</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {waitingTokens.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No tokens waiting</p>
            ) : (
              waitingTokens.map((token) => {
                const queueHasInProgress = inProgressTokens.some(
                  t => t.queue.queueId === token.queue.queueId
                );
                return (
                <div key={token.tokenId} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-2xl font-bold text-yellow-400">#{token.tokenNumber}</div>
                      <div className="text-sm text-gray-400">{token.queue.queueName}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(token.tokenStatus)}`}>
                      {token.tokenStatus}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm mb-3">
                    <div className="text-gray-300">{token.patient.fullName || token.patient.email}</div>
                    {token.patient.phone && <div className="text-gray-400">{token.patient.phone}</div>}
                  </div>
                  <button
                    onClick={() => handleCallToken(token.tokenId)}
                    disabled={queueHasInProgress}
                    className={`w-full text-sm ${queueHasInProgress ? 'btn-saas-secondary opacity-50 cursor-not-allowed' : 'btn-saas-primary'}`}
                  >
                    {queueHasInProgress ? 'Complete current token first' : 'Call Token'}
                  </button>
                </div>
                );
              })
            )}
          </div>
        </div>

        <div className="card-saas p-6">
          <h3 className="text-lg font-bold text-blue-400 mb-4">In Progress ({inProgressTokens.length})</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {inProgressTokens.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No tokens in progress</p>
            ) : (
              inProgressTokens.map((token) => (
                <div key={token.tokenId} className="bg-gray-800/50 p-4 rounded-lg border border-blue-500/30">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-2xl font-bold text-blue-400">#{token.tokenNumber}</div>
                      <div className="text-sm text-gray-400">{token.queue.queueName}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(token.tokenStatus)}`}>
                      {token.tokenStatus}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm mb-3">
                    <div className="text-gray-300">{token.patient.fullName || token.patient.email}</div>
                    {token.patient.phone && <div className="text-gray-400">{token.patient.phone}</div>}
                  </div>
                  <button onClick={() => handleCompleteToken(token.tokenId)} className="w-full btn-saas-primary text-sm bg-emerald-600 hover:bg-emerald-700">
                    Mark Complete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenBoard;
