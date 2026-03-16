import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical,
  CheckCircle,
  XCircle,
  Edit,
  Trash2
} from 'lucide-react';
import { userAPI } from '../../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:8081/api/admin/users/${userId}/activate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      fetchUsers();
    } catch (error) {
      console.error('Error activating user:', error);
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user? They will not be able to login.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      console.log('Deactivating user:', userId);
      const response = await fetch(`http://localhost:8081/api/admin/users/${userId}/deactivate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Deactivate response:', response.status);
      
      if (response.ok) {
        console.log('User deactivated successfully');
        fetchUsers();
      } else {
        console.error('Failed to deactivate user:', response.status);
        alert('Failed to deactivate user');
      }
    } catch (error) {
      console.error('Error deactivating user:', error);
      alert('Error deactivating user: ' + error.message);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || 
                         (statusFilter === 'ACTIVE' && user.isActive) ||
                         (statusFilter === 'INACTIVE' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage user accounts and permissions
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-saas">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search users..."
            className="input-saas"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <select
            className="input-saas"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">All Roles</option>
            <option value="PATIENT">Patient</option>
            <option value="PHARMACY">Pharmacy</option>
            <option value="HOSPITAL">Hospital</option>
          </select>
          
          <select
            className="input-saas"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card-saas overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800/40">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.userId} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-white">
                        {user.fullName}
                      </div>
                      <div className="text-sm text-gray-400">
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'ADMIN' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      user.role === 'PATIENT' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      user.role === 'PHARMACY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {/* Show approval status for pharmacy/hospital users, account status for others */}
                      {(user.role === 'PHARMACY' || user.role === 'HOSPITAL') && user.approvalStatus ? (
                        <>
                          {user.approvalStatus === 'APPROVED' && user.isActive ? (
                            <>
                              <CheckCircle className="h-5 w-5 text-emerald-400 mr-2" />
                              <span className="text-sm text-emerald-400">Active</span>
                            </>
                          ) : user.approvalStatus === 'APPROVED' && !user.isActive ? (
                            <>
                              <XCircle className="h-5 w-5 text-red-400 mr-2" />
                              <span className="text-sm text-red-400">Deactivated</span>
                            </>
                          ) : user.approvalStatus === 'PENDING' ? (
                            <>
                              <div className="h-5 w-5 rounded-full border-2 border-yellow-400 mr-2"></div>
                              <span className="text-sm text-yellow-400">Pending Approval</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-5 w-5 text-red-400 mr-2" />
                              <span className="text-sm text-red-400">Rejected</span>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {user.isActive ? (
                            <>
                              <CheckCircle className="h-5 w-5 text-emerald-400 mr-2" />
                              <span className="text-sm text-emerald-400">Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-5 w-5 text-red-400 mr-2" />
                              <span className="text-sm text-red-400">Inactive</span>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {/* Only show activate/deactivate for non-rejected users or patients */}
                      {(user.role === 'PATIENT' || user.approvalStatus !== 'REJECTED') && (
                        <>
                          {user.isActive ? (
                            <button
                              onClick={() => handleDeactivateUser(user.userId)}
                              className="icon-btn-saas text-red-400/80 hover:text-red-400 hover:bg-red-500/10"
                              title="Deactivate User"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivateUser(user.userId)}
                              className="icon-btn-saas text-emerald-400/80 hover:text-emerald-400 hover:bg-emerald-500/10"
                              title="Activate User"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                          )}
                        </>
                      )}
                      {/* Show rejection status for rejected users */}
                      {user.approvalStatus === 'REJECTED' && (
                        <span className="text-xs text-red-400 italic">
                          Rejected - Can re-register
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-white">No users found</h3>
            <p className="mt-1 text-sm text-gray-400">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;