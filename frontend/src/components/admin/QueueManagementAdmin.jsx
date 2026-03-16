import React, { useState, useEffect } from 'react';
import { List, Search, Filter, Building2, Users, Clock, TrendingUp, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const QueueManagementAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [queues, setQueues] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchHospitals();
  }, []);

  useEffect(() => {
    if (selectedHospital) {
      fetchQueues(selectedHospital);
    }
  }, [selectedHospital]);

  const fetchHospitals = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching hospitals...');
      const response = await fetch('http://localhost:8081/api/admin/hospitals/approved', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('Hospital response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Hospitals data:', data);
        setHospitals(data);
        if (data.length > 0) {
          setSelectedHospital(data[0].hospitalId);
        } else {
          toast.info('No approved hospitals found');
        }
      } else {
        toast.error('Failed to load hospitals');
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      toast.error('Failed to load hospitals');
    } finally {
      setLoading(false);
    }
  };

  const fetchQueues = async (hospitalId) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching queues for hospital:', hospitalId);
      const response = await fetch(`http://localhost:8081/api/admin/queues/hospital/${hospitalId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('Queues response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Queues data:', data);
        setQueues(data);
      } else {
        const error = await response.text();
        console.error('Queue fetch error:', error);
        toast.error('Failed to load queues');
      }
    } catch (error) {
      console.error('Error fetching queues:', error);
      toast.error('Failed to load queues');
    }
  };

  // Group queues by department
  const groupedQueues = queues.reduce((acc, queue) => {
    const dept = queue.departmentName || 'Other';
    if (!acc[dept]) {
      acc[dept] = [];
    }
    acc[dept].push(queue);
    return acc;
  }, {});

  // Filter queues
  const filteredDepartments = Object.keys(groupedQueues).reduce((acc, dept) => {
    const filtered = groupedQueues[dept].filter(queue => {
      const matchesSearch = queue.queueName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           queue.departmentName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' ||
                           (filterStatus === 'active' && queue.isActive && queue.queueStatus === 'ACTIVE') ||
                           (filterStatus === 'paused' && queue.queueStatus === 'PAUSED') ||
                           (filterStatus === 'inactive' && !queue.isActive);
      return matchesSearch && matchesStatus;
    });

    if (filtered.length > 0) {
      acc[dept] = filtered;
    }
    return acc;
  }, {});

  // Calculate statistics
  const totalQueues = queues.length;
  const activeQueues = queues.filter(q => q.isActive && q.queueStatus === 'ACTIVE').length;
  const pausedQueues = queues.filter(q => q.queueStatus === 'PAUSED').length;
  const totalDepartments = Object.keys(groupedQueues).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Queue Management</h2>
        <p className="text-gray-400 text-sm mt-1">Monitor and manage hospital queues across the system</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-saas p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 uppercase font-bold">Total Queues</div>
              <div className="text-2xl font-bold text-white mt-1">{totalQueues}</div>
            </div>
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <List className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card-saas p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 uppercase font-bold">Active Queues</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{activeQueues}</div>
            </div>
            <div className="bg-emerald-500/10 p-2 rounded-lg">
              <CheckCircle className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="card-saas p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 uppercase font-bold">Paused Queues</div>
              <div className="text-2xl font-bold text-yellow-400 mt-1">{pausedQueues}</div>
            </div>
            <div className="bg-yellow-500/10 p-2 rounded-lg">
              <AlertCircle className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="card-saas p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 uppercase font-bold">Departments</div>
              <div className="text-2xl font-bold text-purple-400 mt-1">{totalDepartments}</div>
            </div>
            <div className="bg-purple-500/10 p-2 rounded-lg">
              <Building2 className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-saas p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Hospital Selector */}
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-400 mb-2">Select Hospital</label>
            <select
              value={selectedHospital || ''}
              onChange={(e) => setSelectedHospital(Number(e.target.value))}
              className="input-saas w-full"
            >
              {hospitals.map(hospital => (
                <option key={hospital.hospitalId} value={hospital.hospitalId}>
                  {hospital.hospitalName}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-400 mb-2">Search Queues</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by queue or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-saas w-full pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-400 mb-2">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-saas w-full"
            >
              <option value="all">All Queues</option>
              <option value="active">Active Only</option>
              <option value="paused">Paused Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Queues by Department */}
      {hospitals.length === 0 ? (
        <div className="card-saas p-12 text-center">
          <Building2 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white">No Approved Hospitals</h3>
          <p className="mt-2 text-gray-400">There are no approved hospitals in the system yet.</p>
        </div>
      ) : queues.length === 0 ? (
        <div className="card-saas p-12 text-center">
          <List className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white">No Queues Found</h3>
          <p className="mt-2 text-gray-400">
            {selectedHospital 
              ? `${hospitals.find(h => h.hospitalId === selectedHospital)?.hospitalName || 'This hospital'} hasn't created any queues yet.`
              : 'No queues have been created yet.'}
          </p>
          <p className="mt-1 text-sm text-gray-500">Hospitals can create queues from their Queue Management page.</p>
        </div>
      ) : Object.keys(filteredDepartments).length === 0 ? (
        <div className="card-saas p-12 text-center">
          <List className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white">No queues found</h3>
          <p className="mt-2 text-gray-400">Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(filteredDepartments).map(([department, deptQueues]) => (
            <div key={department} className="card-saas p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 p-2 rounded-lg">
                    <Building2 className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{department}</h3>
                    <p className="text-xs text-gray-400">{deptQueues.length} queue{deptQueues.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deptQueues.map(queue => (
                  <div key={queue.queueId} className="bg-gray-800/30 p-4 rounded-lg border border-gray-700/30">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-white text-sm">{queue.queueName}</h4>
                        <p className="text-xs text-gray-400 mt-1">{queue.description || 'No description'}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        queue.isActive && queue.queueStatus === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : queue.queueStatus === 'PAUSED'
                          ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      }`}>
                        {queue.isActive ? queue.queueStatus : 'Inactive'}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Capacity:</span>
                        <span className="text-white font-medium">{queue.maxCapacity} patients</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Timings:</span>
                        <span className="text-white font-medium">
                          {queue.startTime || 'N/A'} - {queue.endTime || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Avg Time:</span>
                        <span className="text-white font-medium">{queue.estimatedTimePerPatient || 15} min</span>
                      </div>
                      {queue.operatingDays && (
                        <div className="pt-2 border-t border-gray-700/30">
                          <span className="text-gray-400 text-[10px]">Operating Days:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {queue.operatingDays.split(',').map(day => (
                              <span key={day} className="px-1.5 py-0.5 bg-gray-700/50 rounded text-[9px] text-gray-300">
                                {day.substring(0, 3)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QueueManagementAdmin;
