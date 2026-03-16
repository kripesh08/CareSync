import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  FileText,
  Calendar,
  Activity,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const HospitalDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeQueues: 0,
    todayTokens: 0,
    waitingTokens: 0,
    inProgressTokens: 0,
    completedTokens: 0,
    tokensNeedingAttention: 0,
  });
  const [hospitalName, setHospitalName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    fetchHospitalProfile();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/queues/hospital/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHospitalProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/hospital/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHospitalName(data.hospitalName || 'Hospital');
      }
    } catch (error) {
      console.error('Error fetching hospital profile:', error);
    }
  };

  const quickActions = [
    {
      title: 'Queue Management',
      description: 'Manage patient flow and waiting lists',
      icon: Users,
      link: '/hospital/queues',
      color: 'text-green-400',
      bg: 'bg-green-50',
      hover: 'group-hover:text-green-600 group-hover:bg-green-50',
    },
    {
      title: 'Token Board',
      description: 'Real-time token board and patient calling',
      icon: Activity,
      link: '/hospital/tokens',
      color: 'text-purple-400',
      bg: 'bg-purple-50',
      hover: 'group-hover:text-purple-600 group-hover:bg-purple-50',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Hospital Dashboard</h1>
          <p className="text-gray-500 mt-1 text-lg">
            Welcome back, <span className="text-purple-600 font-medium">{hospitalName || 'Administrator'}</span>
          </p>
        </div>
        <div className="relative z-10 hidden md:block">
          <div className="flex items-center space-x-2 text-sm text-gray-500 bg-white/80 px-4 py-2 rounded-full shadow-sm border border-gray-100">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>Hospital Connected</span>
            <span className="mx-2 text-gray-300">|</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 opacity-50 blur-3xl"></div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Queues</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeQueues}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600 font-medium">
            <Activity className="h-4 w-4 mr-1" />
            <span>Live status</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Today's Tokens</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.todayTokens}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1 text-blue-500" />
            <span>Booked for today</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completedTokens}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600 font-medium">
            <CheckCircle className="h-4 w-4 mr-1" />
            <span>Tokens processed</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Needs Attention</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.tokensNeedingAttention}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-xl">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-orange-600 font-medium">
            <Clock className="h-4 w-4 mr-1" />
            <span>Waiting + In Progress</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-purple-600" />
          Management Console
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                to={action.link}
                className="group relative bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-100 transition-all duration-200"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <ArrowRight className="h-5 w-5 text-purple-400" />
                </div>

                <div className="flex items-start">
                  <div className={`p-3 rounded-xl bg-gray-50 text-gray-400 ${action.color} ${action.bg} transition-all duration-200`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">{action.title}</h3>
                    <p className="mt-1 text-sm text-gray-500 group-hover:text-gray-600">{action.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity / Status */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Token Status Overview</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Waiting</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-4">{stats.waitingTokens} tokens</span>
                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500" 
                    style={{ width: stats.todayTokens > 0 ? `${(stats.waitingTokens / stats.todayTokens) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                <span className="text-sm font-medium text-gray-700">In Progress</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-4">{stats.inProgressTokens} tokens</span>
                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500" 
                    style={{ width: stats.todayTokens > 0 ? `${(stats.inProgressTokens / stats.todayTokens) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Completed</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-4">{stats.completedTokens} tokens</span>
                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500" 
                    style={{ width: stats.todayTokens > 0 ? `${(stats.completedTokens / stats.todayTokens) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;