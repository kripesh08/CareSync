import React, { useState, useEffect } from 'react';
import { User, Building2, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const HospitalProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hospitalData, setHospitalData] = useState(null);

  // Purple theme for hospital
  const theme = {
    primary: 'bg-purple-600',
    primaryHover: 'hover:bg-purple-700',
    primaryLight: 'bg-purple-50',
    primaryText: 'text-purple-600',
    primaryBorder: 'border-purple-200',
    accent: 'bg-purple-100',
    accentText: 'text-purple-800'
  };

  useEffect(() => {
    fetchHospitalProfile();
  }, []);

  const fetchHospitalProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch('http://localhost:8081/api/hospital/profile', { headers });

      if (response.ok) {
        const data = await response.json();
        console.log('Hospital profile data:', data);
        setHospitalData(data);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        toast.error(errorData.message || 'Failed to load hospital profile');
      }
    } catch (error) {
      console.error('Error fetching hospital profile:', error);
      toast.error('Error loading profile data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600`}></div>
      </div>
    );
  }

  if (!hospitalData) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Hospital Profile Not Found</h3>
          <p className="text-yellow-700">
            No hospital profile is associated with your account. This could mean:
          </p>
          <ul className="list-disc list-inside text-yellow-700 mt-2 space-y-1">
            <li>Your hospital registration is still pending approval</li>
            <li>Your hospital registration was not completed</li>
            <li>There was an error during registration</li>
          </ul>
          <p className="text-yellow-700 mt-4">
            Please contact support or try registering again if needed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Hospital Profile</h1>
        <p className="text-gray-600 mt-2">View your hospital information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className={`${theme.primary} px-6 py-4`}>
          <div className="flex items-center">
            <div className={`${theme.primaryLight} p-3 rounded-full`}>
              <Building2 className={`h-8 w-8 ${theme.primaryText}`} />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-white">
                {hospitalData?.hospitalName || 'Hospital Name'}
              </h2>
              <p className="text-purple-100">
                Registration: {hospitalData?.registrationNumber || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2 text-gray-500" />
                Basic Information
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Hospital Name</label>
                  <p className="mt-1 text-sm text-gray-900">{hospitalData?.hospitalName || 'Not provided'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Registration Number</label>
                  <p className="mt-1 text-sm text-gray-900">{hospitalData?.registrationNumber || 'Not provided'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Registration Date</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    {hospitalData?.createdAt ? new Date(hospitalData.createdAt).toLocaleDateString() : 'Not available'}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Phone className="h-5 w-5 mr-2 text-gray-500" />
                Contact Information
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email Address</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <Mail className="h-4 w-4 mr-1 text-gray-400" />
                    {user?.email || 'Not provided'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Phone Number</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <Phone className="h-4 w-4 mr-1 text-gray-400" />
                    {hospitalData?.phone || 'Not provided'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Address</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-start">
                    <MapPin className="h-4 w-4 mr-1 mt-0.5 text-gray-400 flex-shrink-0" />
                    <span>
                      {hospitalData?.address || 'Not provided'}
                      {hospitalData?.city && `, ${hospitalData.city}`}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalProfile;
