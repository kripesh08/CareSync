import React, { useState, useEffect } from 'react';
import { User, Building2, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const PharmacyProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pharmacyData, setPharmacyData] = useState(null);

  // Green theme for pharmacy
  const theme = {
    primary: 'bg-green-600',
    primaryHover: 'hover:bg-green-700',
    primaryLight: 'bg-green-50',
    primaryText: 'text-green-600',
    primaryBorder: 'border-green-200',
    accent: 'bg-green-100',
    accentText: 'text-green-800'
  };

  useEffect(() => {
    fetchPharmacyProfile();
  }, []);

  const fetchPharmacyProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch('http://localhost:8081/api/pharmacy/profile', { headers });

      if (response.ok) {
        const data = await response.json();
        console.log('Pharmacy profile data:', data);
        setPharmacyData(data);
      } else {
        toast.error('Failed to load pharmacy profile');
      }
    } catch (error) {
      console.error('Error fetching pharmacy profile:', error);
      toast.error('Error loading profile data');
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 border-green-600`}></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Pharmacy Profile</h1>
        <p className="text-gray-600 mt-2">View your pharmacy information</p>
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
                {pharmacyData?.pharmacyName || 'Pharmacy Name'}
              </h2>
              <p className="text-green-100">
                License: {pharmacyData?.licenseNumber || 'N/A'}
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
                  <label className="block text-sm font-medium text-gray-500">Pharmacy Name</label>
                  <p className="mt-1 text-sm text-gray-900">{pharmacyData?.pharmacyName || 'Not provided'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">License Number</label>
                  <p className="mt-1 text-sm text-gray-900">{pharmacyData?.licenseNumber || 'Not provided'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Registration Date</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    {pharmacyData?.createdAt ? new Date(pharmacyData.createdAt).toLocaleDateString() : 'Not available'}
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
                    {user?.phone || pharmacyData?.user?.phone || 'Not provided'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">Address</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-start">
                    <MapPin className="h-4 w-4 mr-1 mt-0.5 text-gray-400 flex-shrink-0" />
                    <span>
                      {pharmacyData?.address || 'Not provided'}
                      {pharmacyData?.city && `, ${pharmacyData.city}`}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>


          {/* Approval Status Details */}



        </div>
      </div>
    </div>
  );
};

export default PharmacyProfile;