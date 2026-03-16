import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Shield, CheckCircle, AlertTriangle } from 'lucide-react';

const PendingApproval = ({ userRole, userEmail }) => {
  const getRoleInfo = () => {
    switch (userRole) {
      case 'PHARMACY':
        return {
          title: 'Pharmacy Registration Pending',
          description: 'Your pharmacy registration is currently under review by our admin team.',
          icon: Clock,
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
        };
      case 'HOSPITAL':
        return {
          title: 'Hospital Registration Pending',
          description: 'Your hospital registration is currently under review by our admin team.',
          icon: Clock,
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
        };
      default:
        return {
          title: 'Account Pending',
          description: 'Your account is currently under review.',
          icon: Clock,
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20',
        };
    }
  };

  const roleInfo = getRoleInfo();
  const Icon = roleInfo.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-900/30 blur-3xl animate-pulse-subtle"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-purple-900/30 blur-3xl animate-pulse-subtle"></div>
      </div>

      <div className="max-w-md w-full space-y-8 z-10 animate-fade-in">
        <div className="glass-card p-8 rounded-2xl shadow-2xl border border-gray-800">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-blue-900/30 rounded-full flex items-center justify-center mb-4 ring-1 ring-blue-700/50">
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Registration Submitted
            </h2>
          </div>

          <div className={`mt-6 ${roleInfo.bgColor} ${roleInfo.borderColor} border rounded-xl p-5`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Icon className={`h-6 w-6 ${roleInfo.color}`} />
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${roleInfo.color}`}>
                  {roleInfo.title}
                </h3>
                <div className="mt-1 text-sm text-gray-300">
                  <p>{roleInfo.description}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 mt-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-sm text-gray-300">Registration form submitted successfully</span>
              </div>

              <div className="flex items-center">
                <Clock className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0" />
                <span className="text-sm text-gray-300">Waiting for admin approval</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-xl p-4 mt-6">
            <div className="flex">
              <div className="ml-1">
                <h3 className="text-sm font-medium text-yellow-500 mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  What happens next?
                </h3>
                <div className="text-sm text-yellow-400/80 pl-6">
                  <ul className="list-disc space-y-1">
                    <li>Reviewing registration details</li>
                    <li>Process takes 1-2 business days</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              to="/login"
              className="font-medium text-blue-500 hover:text-blue-400 transition-colors"
            >
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;