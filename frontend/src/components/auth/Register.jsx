import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowRight, X, AlertTriangle } from 'lucide-react';
import PendingApproval from './PendingApproval';

const Register = () => {
  const [formData, setFormData] = useState({
    // Common fields
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'PATIENT',

    // Pharmacy-specific fields
    pharmacyName: '',
    licenseNumber: '',
    address: '',
    city: '',

    // Hospital-specific fields
    hospitalName: '',
    registrationNumber: '',
    hospitalAddress: '',
    hospitalCity: '',
    supportedInsuranceProviders: [],
  });
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  // If showing pending approval, render that component
  if (pendingApproval) {
    return <PendingApproval userRole={pendingApproval.role} userEmail={pendingApproval.email} />;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handler for adding insurance providers
  const addInsuranceProvider = () => {
    const provider = document.getElementById('newInsuranceProvider').value.trim();
    if (provider && !formData.supportedInsuranceProviders.includes(provider)) {
      setFormData({
        ...formData,
        supportedInsuranceProviders: [...formData.supportedInsuranceProviders, provider]
      });
      document.getElementById('newInsuranceProvider').value = '';
    }
  };

  // Handler for removing insurance providers
  const removeInsuranceProvider = (providerToRemove) => {
    setFormData({
      ...formData,
      supportedInsuranceProviders: formData.supportedInsuranceProviders.filter(
        provider => provider !== providerToRemove
      )
    });
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return false;
    }

    // Role-specific validation
    if (formData.role === 'PHARMACY') {
      if (!formData.pharmacyName || !formData.licenseNumber || !formData.address || !formData.city) {
        toast.error('Please fill in all required pharmacy details');
        return false;
      }
    }

    if (formData.role === 'HOSPITAL') {
      if (!formData.hospitalName || !formData.registrationNumber || !formData.hospitalAddress || !formData.hospitalCity) {
        toast.error('Please fill in all required hospital details');
        return false;
      }
      if (formData.supportedInsuranceProviders.length === 0) {
        toast.error('Please add at least one supported insurance provider');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registrationData } = formData;
      const result = await register(registrationData);

      if (result.success) {
        if (result.needsApproval) {
          // Show pending approval screen
          setPendingApproval({
            role: result.role,
            email: formData.email
          });
        } else {
          // Regular successful registration
          toast.success(result.message || 'Registration successful!');
          navigate('/dashboard');
        }
      } else {
        toast.error(result.message || 'Registration failed');
      }
    } catch (error) {
      toast.error('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const renderRoleSpecificFields = () => {
    switch (formData.role) {
      case 'PATIENT':
        return (
          <div className="bg-green-900/20 border border-green-800/50 p-4 rounded-xl backdrop-blur-sm animate-fade-in">
            <h3 className="text-sm font-semibold text-green-400">Patient Registration</h3>
            <p className="text-sm text-green-300 mt-1">
              Complete your basic registration.
            </p>
          </div>
        );

      case 'PHARMACY':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-blue-900/20 border border-blue-800/50 p-4 rounded-xl backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-blue-400">Pharmacy Registration</h3>
              <p className="text-sm text-blue-300 mt-1">
                Your pharmacy registration will be reviewed by our admin team before approval.
              </p>
            </div>

            <div>
              <label htmlFor="pharmacyName" className="block text-sm font-medium text-gray-400 mb-1">
                Pharmacy Name *
              </label>
              <input
                id="pharmacyName"
                name="pharmacyName"
                type="text"
                required
                className="block w-full bg-gray-800 border-gray-700 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-750 transition-colors h-11 px-4"
                placeholder="Enter pharmacy name"
                value={formData.pharmacyName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-400 mb-1">
                License Number *
              </label>
              <input
                id="licenseNumber"
                name="licenseNumber"
                type="text"
                required
                className="block w-full bg-gray-800 border-gray-700 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-750 transition-colors h-11 px-4"
                placeholder="Enter license number"
                value={formData.licenseNumber}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-400 mb-1">
                Address *
              </label>
              <textarea
                id="address"
                name="address"
                required
                rows={3}
                className="block w-full bg-gray-800 border-gray-700 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-750 transition-colors px-4 py-2"
                placeholder="Enter complete address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-400 mb-1">
                City *
              </label>
              <input
                id="city"
                name="city"
                type="text"
                required
                className="block w-full bg-gray-800 border-gray-700 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-750 transition-colors h-11 px-4"
                placeholder="Enter city"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
          </div>
        );

      case 'HOSPITAL':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-red-900/20 border border-red-800/50 p-4 rounded-xl backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-red-400">Hospital Registration</h3>
              <p className="text-sm text-red-300 mt-1">
                Your hospital registration will be reviewed by our admin team before approval.
              </p>
            </div>

            <div>
              <label htmlFor="hospitalName" className="block text-sm font-medium text-gray-400 mb-1">
                Hospital Name *
              </label>
              <input
                id="hospitalName"
                name="hospitalName"
                type="text"
                required
                className="block w-full bg-gray-800 border-gray-700 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-750 transition-colors h-11 px-4"
                placeholder="Enter hospital name"
                value={formData.hospitalName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-400 mb-1">
                Registration/License Number *
              </label>
              <input
                id="registrationNumber"
                name="registrationNumber"
                type="text"
                required
                className="block w-full bg-gray-800 border-gray-700 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-750 transition-colors h-11 px-4"
                placeholder="Enter registration/license number"
                value={formData.registrationNumber}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="hospitalAddress" className="block text-sm font-medium text-gray-400 mb-1">
                Hospital Address *
              </label>
              <textarea
                id="hospitalAddress"
                name="hospitalAddress"
                required
                rows={3}
                className="block w-full bg-gray-800 border-gray-700 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-750 transition-colors px-4 py-2"
                placeholder="Enter complete hospital address"
                value={formData.hospitalAddress}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="hospitalCity" className="block text-sm font-medium text-gray-400 mb-1">
                City *
              </label>
              <input
                id="hospitalCity"
                name="hospitalCity"
                type="text"
                required
                className="block w-full bg-gray-800 border-gray-700 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-750 transition-colors h-11 px-4"
                placeholder="Enter city"
                value={formData.hospitalCity}
                onChange={handleChange}
              />
            </div>

            {/* Supported Insurance Providers - MANDATORY FIELD */}            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Supported Insurance Providers *
                <span className="text-xs text-gray-500 block font-normal">
                  Add all insurance providers your hospital accepts
                </span>
              </label>

              {/* Add new provider input */}
              <div className="flex gap-2 mb-3">
                <input
                  id="newInsuranceProvider"
                  type="text"
                  placeholder="Enter insurance provider name"
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-11 placeholder-gray-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addInsuranceProvider();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addInsuranceProvider}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-colors duration-200"
                >
                  Add
                </button>
              </div>

              {/* Display added providers */}
              {formData.supportedInsuranceProviders.length > 0 ? (
                <div className="border border-gray-700 rounded-lg p-3 bg-gray-800/50">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    Added Providers ({formData.supportedInsuranceProviders.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {formData.supportedInsuranceProviders.map((provider, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-900/30 text-blue-300 border border-blue-800"
                      >
                        {provider}
                        <button
                          type="button"
                          onClick={() => removeInsuranceProvider(provider)}
                          className="ml-2 text-blue-400 hover:text-blue-200 focus:outline-none rounded-full p-0.5 hover:bg-blue-800/50 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-red-400 mt-1 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Please add at least one insurance provider
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-900/30 blur-3xl animate-pulse-subtle"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-purple-900/30 blur-3xl animate-pulse-subtle"></div>
      </div>

      <div className="max-w-xl w-full space-y-8 z-10 my-4">
        <div className="glass-card p-8 rounded-2xl shadow-2xl border border-gray-800 animate-fade-in">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Create Account
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Join CareSync Health Portal
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-400 mb-1">
                  Full Name *
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  className="block w-full bg-gray-800 border-gray-700 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-750 transition-colors h-11 px-4"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full bg-gray-800 border-gray-700 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-750 transition-colors h-11 px-4"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-400 mb-1">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="block w-full bg-gray-800 border-gray-700 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-750 transition-colors h-11 px-4"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-400 mb-1">
                  Account Type *
                </label>
                <select
                  id="role"
                  name="role"
                  className="block w-full pl-3 pr-10 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-11 transition-all duration-200"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="PATIENT" className="bg-gray-800 text-white">Patient - For Medical services</option>
                  <option value="PHARMACY" className="bg-gray-800 text-white">Pharmacy - Sell Medicines</option>
                  <option value="HOSPITAL" className="bg-gray-800 text-white">Hospital - Manage Services</option>
                </select>
              </div>

              {/* Role-specific fields */}
              {renderRoleSpecificFields()}

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">
                  Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full bg-gray-800 border-gray-700 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-750 transition-colors h-11 px-4"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400 mb-1">
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full bg-gray-800 border-gray-700 text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-750 transition-colors h-11 px-4"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <span className="flex items-center">
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </span>
                )}
              </button>
            </div>

            {(formData.role === 'PHARMACY' || formData.role === 'HOSPITAL') && (
              <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-xl p-4 animate-fade-in">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-500">Approval Required</h3>
                    <p className="text-sm text-yellow-400/80 mt-1">
                      {formData.role === 'PHARMACY' ? 'Pharmacy' : 'Hospital'} registrations require admin approval.
                      You'll receive an email notification once your account is approved.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-blue-500 hover:text-blue-400 transition-colors duration-200"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;