import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit, Trash2, Clock, Users, Calendar, AlertCircle, Ban, Play, Pause, X } from 'lucide-react';
import { toast } from 'react-toastify';

const QueueManagement = () => {
  const [queues, setQueues] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [closures, setClosures] = useState([]);
  const [closureForm, setClosureForm] = useState({
    closureDate: '',
    reason: ''
  });
  const [editingQueue, setEditingQueue] = useState(null);
  const [queueForm, setQueueForm] = useState({
    departmentName: '',
    queueName: '',
    maxCapacity: '',
    startTime: '',
    endTime: '',
    estimatedTimePerPatient: '',
    description: '',
    operatingDays: [],
    doctorName: ''
  });

  useEffect(() => {
    fetchQueues();
  }, []);

  useEffect(() => {
    if (showModal) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => document.body.classList.remove('no-scroll');
  }, [showModal]);

  const fetchQueues = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/queues/hospital', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setQueues(data);

        // Extract unique departments
        const uniqueDepts = [...new Set(data.map(q => q.departmentName))];
        setDepartments(uniqueDepts);
      } else {
        toast.error('Failed to fetch queues');
      }
    } catch (error) {
      console.error('Error fetching queues:', error);
      toast.error('Error loading queues');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const capacity = parseInt(queueForm.maxCapacity);

    if (capacity < 1 || capacity > 200) {
      toast.error('Daily Token Limit must be between 1 and 200');
      return;
    }

    // Optional: Validate estimated time only if provided
    if (queueForm.estimatedTimePerPatient) {
      const estTime = parseInt(queueForm.estimatedTimePerPatient);
      if (estTime < 5 || estTime > 60) {
        toast.error('Avg. Consultation Time must be between 5 and 60 minutes');
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      const url = editingQueue
        ? `http://localhost:8081/api/queues/${editingQueue.queueId}`
        : 'http://localhost:8081/api/queues';

      const method = editingQueue ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...queueForm,
          maxCapacity: parseInt(queueForm.maxCapacity),
          estimatedTimePerPatient: queueForm.estimatedTimePerPatient ? parseInt(queueForm.estimatedTimePerPatient) : null,
          operatingDays: [...queueForm.operatingDays].sort((a, b) => {
            const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
            return days.indexOf(a) - days.indexOf(b);
          }).join(',')
        })
      });

      if (response.ok) {
        toast.success(editingQueue ? 'Queue updated successfully' : 'Queue created successfully');
        setShowModal(false);
        resetForm();
        fetchQueues();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save queue');
      }
    } catch (error) {
      console.error('Error saving queue:', error);
      toast.error('Error saving queue');
    }
  };

  const handleDelete = async (queueId) => {
    if (!window.confirm('Are you sure you want to delete this queue?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/queues/${queueId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Queue deleted successfully');
        fetchQueues();
      } else {
        toast.error('Failed to delete queue');
      }
    } catch (error) {
      console.error('Error deleting queue:', error);
      toast.error('Error deleting queue');
    }
  };

  const openEditModal = (queue) => {
    setEditingQueue(queue);
    setQueueForm({
      departmentName: queue.departmentName,
      queueName: queue.queueName,
      maxCapacity: queue.maxCapacity.toString(),
      startTime: queue.startTime || '',
      endTime: queue.endTime || '',
      estimatedTimePerPatient: queue.estimatedTimePerPatient?.toString() || '',
      description: queue.description || '',
      operatingDays: queue.operatingDays ? queue.operatingDays.split(',') : [],
      doctorName: queue.doctorName || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingQueue(null);
    setQueueForm({
      departmentName: '',
      queueName: '',
      maxCapacity: '',
      startTime: '',
      endTime: '',
      estimatedTimePerPatient: '',
      description: '',
      operatingDays: [],
      doctorName: ''
    });
  };

  const handleToggleStatus = async (queueId, currentStatus) => {
    const action = currentStatus === 'ACTIVE' ? 'pause' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this queue?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/queues/${queueId}/toggle-status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success(`Queue ${action}d successfully`);
        fetchQueues();
      } else {
        toast.error(`Failed to ${action} queue`);
      }
    } catch (error) {
      console.error('Error toggling queue status:', error);
      toast.error('Error updating queue status');
    }
  };

  const openClosureModal = async (queue) => {
    setSelectedQueue(queue);
    setShowClosureModal(true);
    await fetchClosures(queue.queueId);
  };

  const fetchClosures = async (queueId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/queues/${queueId}/closures`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setClosures(data);
      }
    } catch (error) {
      console.error('Error fetching closures:', error);
    }
  };

  const handleAddClosure = async (e) => {
    e.preventDefault();

    if (!closureForm.closureDate) {
      toast.error('Please select a date');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/queues/${selectedQueue.queueId}/closures`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(closureForm)
      });

      if (response.ok) {
        toast.success('Closure added successfully');
        setClosureForm({ closureDate: '', reason: '' });
        await fetchClosures(selectedQueue.queueId);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to add closure');
      }
    } catch (error) {
      console.error('Error adding closure:', error);
      toast.error('Error adding closure');
    }
  };

  const handleRemoveClosure = async (closureId) => {
    if (!window.confirm('Are you sure you want to remove this closure?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8081/api/queues/closures/${closureId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Closure removed successfully');
        await fetchClosures(selectedQueue.queueId);
      } else {
        toast.error('Failed to remove closure');
      }
    } catch (error) {
      console.error('Error removing closure:', error);
      toast.error('Error removing closure');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Group queues by department
  const queuesByDepartment = queues.reduce((acc, queue) => {
    if (!acc[queue.departmentName]) {
      acc[queue.departmentName] = [];
    }
    acc[queue.departmentName].push(queue);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Queue Management</h2>
          <p className="text-gray-400 text-sm mt-1">Manage department queues and capacity</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-saas-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Queue
        </button>
      </div>

      {/* Queues by Department */}
      {Object.keys(queuesByDepartment).length === 0 ? (
        <div className="text-center py-16 card-saas">
          <div className="bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-10 w-10 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-white">No queues yet</h3>
          <p className="mt-2 text-gray-400">Create your first queue to start managing patient flow.</p>
        </div>
      ) : (
        Object.entries(queuesByDepartment).map(([department, deptQueues]) => (
          <div key={department} className="card-saas p-6">
            <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              {department}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deptQueues.map((queue) => (
                <div key={queue.queueId} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-white">{queue.queueName}</h4>
                      <p className="text-sm text-emerald-400 font-medium">Dr. {queue.doctorName || 'Not Assigned'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openClosureModal(queue)}
                        className="text-orange-400 hover:text-orange-300 p-1"
                        title="Manage Closures"
                      >
                        <Calendar className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(queue.queueId, queue.queueStatus)}
                        className={`p-1 ${queue.queueStatus === 'ACTIVE' ? 'text-yellow-400 hover:text-yellow-300' : 'text-emerald-400 hover:text-emerald-300'}`}
                        title={queue.queueStatus === 'ACTIVE' ? 'Pause Queue' : 'Activate Queue'}
                      >
                        {queue.queueStatus === 'ACTIVE' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => openEditModal(queue)}
                        className="text-emerald-400 hover:text-emerald-300 p-1"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(queue.queueId)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Capacity:</span>
                      <span className="text-white font-medium">
                        {queue.currentCount || 0} / {queue.maxCapacity}
                      </span>
                    </div>
                    {queue.startTime && queue.endTime && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Timings:</span>
                        <span className="text-white font-medium">
                          {queue.startTime} - {queue.endTime}
                        </span>
                      </div>
                    )}
                    {queue.estimatedTimePerPatient && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Avg Time:</span>
                        <span className="text-white font-medium">
                          {queue.estimatedTimePerPatient} min
                        </span>
                      </div>
                    )}
                    <div style={{ borderTop: '1px solid rgba(55, 65, 81, 0.5)', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        !queue.isActive
                          ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                          : queue.queueStatus === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : queue.queueStatus === 'FULL'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        }`}>
                        {queue.isActive ? queue.queueStatus : 'INACTIVE'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Add/Edit Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm overflow-y-auto h-full w-full z-50 p-4">
          <div className="min-h-full flex items-start justify-center">
            <div className="relative modal-glass-saas w-full max-w-2xl my-8">
              <div className="px-6 py-4 border-b border-gray-700/50">
                <h3 className="text-xl font-bold text-white">
                  {editingQueue ? 'Edit Queue' : 'Add New Queue'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Department Name *</label>
                    <input
                      type="text"
                      required
                      value={queueForm.departmentName}
                      onChange={(e) => setQueueForm({ ...queueForm, departmentName: e.target.value })}
                      className="input-saas w-full"
                      placeholder="e.g., Cardiology"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Queue Name *</label>
                    <input
                      type="text"
                      required
                      value={queueForm.queueName}
                      onChange={(e) => setQueueForm({ ...queueForm, queueName: e.target.value })}
                      className="input-saas w-full"
                      placeholder="e.g., General Consultation"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Doctor Name</label>
                    <input
                      type="text"
                      value={queueForm.doctorName}
                      onChange={(e) => setQueueForm({ ...queueForm, doctorName: e.target.value })}
                      className="input-saas w-full"
                      placeholder="e.g., Dr. Smith"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Daily Token Limit *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="200"
                      value={queueForm.maxCapacity}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0);
                        setQueueForm({ ...queueForm, maxCapacity: val.toString() });
                      }}
                      className="input-saas w-full"
                      placeholder="e.g., 50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum tokens per day (typically 30-100)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Avg. Consultation Time (minutes)</label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={queueForm.estimatedTimePerPatient}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0);
                        setQueueForm({ ...queueForm, estimatedTimePerPatient: val.toString() });
                      }}
                      className="input-saas w-full"
                      placeholder="e.g., 15"
                    />
                    <p className="text-xs text-gray-500 mt-1">Optional: For reference only (usually 10-20 min)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Queue Opens At</label>
                    <input
                      type="time"
                      value={queueForm.startTime}
                      onChange={(e) => setQueueForm({ ...queueForm, startTime: e.target.value })}
                      className="input-saas w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">When does this queue start? (e.g., 9:00 AM)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Queue Closes At</label>
                    <input
                      type="time"
                      value={queueForm.endTime}
                      onChange={(e) => setQueueForm({ ...queueForm, endTime: e.target.value })}
                      className="input-saas w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">Last token booking time (e.g., 5:00 PM)</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-400 mb-3">Operating Days</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(day => (
                        <label key={day} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={queueForm.operatingDays.includes(day)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setQueueForm({ ...queueForm, operatingDays: [...queueForm.operatingDays, day] });
                              } else {
                                setQueueForm({ ...queueForm, operatingDays: queueForm.operatingDays.filter(d => d !== day) });
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                          />
                          <span className="text-sm text-gray-300">{day.charAt(0) + day.slice(1).toLowerCase()}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Select the days when this queue will be available</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-400 mb-2">Additional Information</label>
                    <textarea
                      value={queueForm.description}
                      onChange={(e) => setQueueForm({ ...queueForm, description: e.target.value })}
                      className="input-saas w-full h-24 resize-none"
                      placeholder="Any special instructions or requirements for patients..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Optional: Add notes about documents needed, preparation, etc.</p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t-0" style={{ borderTop: '1px solid rgba(55, 65, 81, 0.3)' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="btn-saas-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-saas-primary">
                    {editingQueue ? 'Update Queue' : 'Create Queue'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Closure Management Modal */}
      {showClosureModal && selectedQueue && createPortal(
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm overflow-y-auto h-full w-full z-50 p-4">
          <div className="min-h-full flex items-start justify-center">
            <div className="relative modal-glass-saas w-full max-w-2xl my-8">
              <div className="px-6 py-4 border-b border-gray-700/50 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">Manage Queue Closures</h3>
                  <p className="text-sm text-gray-400 mt-1">{selectedQueue.queueName}</p>
                </div>
                <button
                  onClick={() => {
                    setShowClosureModal(false);
                    setSelectedQueue(null);
                    setClosureForm({ closureDate: '', reason: '' });
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Operating Days Info */}
                <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                  <p className="text-xs text-blue-400 font-medium mb-1">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Queue Operating Days
                  </p>
                  <p className="text-xs text-gray-300">
                    {selectedQueue.operatingDays 
                      ? selectedQueue.operatingDays.split(',').map(day => 
                          day.charAt(0) + day.slice(1).toLowerCase()
                        ).join(', ')
                      : 'All days'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    You can only add closures for days when the queue normally operates.
                  </p>
                </div>

                {/* Add Closure Form */}
                <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700/50">
                  <h4 className="text-sm font-bold text-gray-300 mb-3">Add Closure Date</h4>
                  <form onSubmit={handleAddClosure} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1">Date *</label>
                        <input
                          type="date"
                          required
                          min={new Date().toISOString().split('T')[0]}
                          value={closureForm.closureDate}
                          onChange={(e) => {
                            const selectedDate = new Date(e.target.value + 'T00:00:00');
                            const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
                            
                            // Check if the selected day is in operating days
                            if (selectedQueue.operatingDays && !selectedQueue.operatingDays.includes(dayOfWeek)) {
                              toast.error(`Queue doesn't operate on ${dayOfWeek.charAt(0) + dayOfWeek.slice(1).toLowerCase()}. Please select a valid operating day.`);
                              return;
                            }
                            
                            setClosureForm({ ...closureForm, closureDate: e.target.value });
                          }}
                          className="input-saas w-full text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Select a date when queue operates</p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1">Reason</label>
                        <input
                          type="text"
                          value={closureForm.reason}
                          onChange={(e) => setClosureForm({ ...closureForm, reason: e.target.value })}
                          className="input-saas w-full text-sm"
                          placeholder="e.g., Holiday, Doctor's leave"
                        />
                      </div>
                    </div>
                    <button type="submit" className="btn-saas-primary text-sm w-full">
                      <Ban className="h-4 w-4 inline mr-2" />
                      Add Closure
                    </button>
                  </form>
                </div>

                {/* Existing Closures */}
                <div>
                  <h4 className="text-sm font-bold text-gray-300 mb-3">Scheduled Closures</h4>
                  {closures.length === 0 ? (
                    <div className="text-center py-8 bg-gray-800/20 rounded-lg border border-gray-700/30">
                      <Calendar className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No closures scheduled</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {closures.map((closure) => (
                        <div key={closure.closureId} className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/50 flex justify-between items-center">
                          <div>
                            <div className="text-white font-medium text-sm">
                              {new Date(closure.closureDate).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </div>
                            {closure.reason && (
                              <div className="text-xs text-gray-400 mt-1">{closure.reason}</div>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveClosure(closure.closureId)}
                            className="text-red-400 hover:text-red-300 p-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                  <p className="text-xs text-blue-400">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Patients will not be able to book tokens for dates marked as closed. The system will automatically prevent bookings on non-operating days (like weekends if not selected).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default QueueManagement;
