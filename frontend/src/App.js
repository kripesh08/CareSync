import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Dashboard Components
import AdminDashboard from './components/dashboards/AdminDashboard';
import PatientDashboard from './components/dashboards/PatientDashboard';
import PharmacyDashboard from './components/dashboards/PharmacyDashboard';
import HospitalDashboard from './components/dashboards/HospitalDashboard';

// Page Components
import UserManagement from './components/admin/UserManagement';
import PharmacyManagement from './components/admin/PharmacyManagement';
import HospitalManagement from './components/admin/HospitalManagement';
import MedicineManagement from './components/admin/MedicineManagement';
import OrderManagement from './components/admin/OrderManagement';
import DataManagement from './components/admin/DataManagement';
import QueueManagementAdmin from './components/admin/QueueManagementAdmin';

// Customer Components
import MedicineSearch from './components/customer/MedicineSearch';
import PharmacyBrowse from './components/customer/PharmacyBrowse';
import MyBookings from './components/customer/MyBookings';
import PatientProfile from './components/customer/PatientProfile';

// Pharmacy Components
import PharmacyProfile from './components/pharmacy/PharmacyProfile';

// Hospital Components
import QueueManagement from './components/hospital/QueueManagement';
import TokenBoard from './components/hospital/TokenBoard';
import HospitalProfile from './components/hospital/HospitalProfile';

// Customer Hospital Components
import HospitalBrowse from './components/customer/HospitalBrowse';
import QueueBrowse from './components/customer/QueueBrowse';
import QueueSearch from './components/customer/QueueSearch';
import MyTokens from './components/customer/MyTokens';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              {/* Default redirect based on role */}
              <Route index element={<Navigate to="/dashboard" replace />} />

              {/* Dashboard Routes */}
              <Route path="dashboard" element={<DashboardRouter />} />

              {/* Patient Routes */}
              <Route path="search-medicines" element={
                <ProtectedRoute requiredRole="PATIENT">
                  <MedicineSearch />
                </ProtectedRoute>
              } />
              <Route path="browse-pharmacies" element={
                <ProtectedRoute requiredRole="PATIENT">
                  <PharmacyBrowse />
                </ProtectedRoute>
              } />
              <Route path="my-bookings" element={
                <ProtectedRoute requiredRole="PATIENT">
                  <MyBookings />
                </ProtectedRoute>
              } />
              <Route path="patient/profile" element={
                <ProtectedRoute requiredRole="PATIENT">
                  <PatientProfile />
                </ProtectedRoute>
              } />
              <Route path="browse-hospitals" element={
                <ProtectedRoute requiredRole="PATIENT">
                  <HospitalBrowse />
                </ProtectedRoute>
              } />
              <Route path="hospital/:hospitalId/queues" element={
                <ProtectedRoute requiredRole="PATIENT">
                  <QueueBrowse />
                </ProtectedRoute>
              } />
              <Route path="my-tokens" element={
                <ProtectedRoute requiredRole="PATIENT">
                  <MyTokens />
                </ProtectedRoute>
              } />
              <Route path="search-queues" element={
                <ProtectedRoute requiredRole="PATIENT">
                  <QueueSearch />
                </ProtectedRoute>
              } />

              {/* Pharmacy Routes */}
              <Route path="pharmacy/inventory" element={
                <ProtectedRoute requiredRole="PHARMACY">
                  <PharmacyDashboard initialTab="medicines" />
                </ProtectedRoute>
              } />
              <Route path="pharmacy/prescriptions" element={
                <ProtectedRoute requiredRole="PHARMACY">
                  <PharmacyDashboard initialTab="prescriptions" />
                </ProtectedRoute>
              } />
              <Route path="pharmacy/orders" element={
                <ProtectedRoute requiredRole="PHARMACY">
                  <PharmacyDashboard initialTab="orders" />
                </ProtectedRoute>
              } />
              <Route path="pharmacy/profile" element={
                <ProtectedRoute requiredRole="PHARMACY">
                  <PharmacyProfile />
                </ProtectedRoute>
              } />

              {/* Hospital Routes */}
              <Route path="hospital/queues" element={
                <ProtectedRoute requiredRole="HOSPITAL">
                  <QueueManagement />
                </ProtectedRoute>
              } />
              <Route path="hospital/tokens" element={
                <ProtectedRoute requiredRole="HOSPITAL">
                  <TokenBoard />
                </ProtectedRoute>
              } />
              <Route path="hospital/profile" element={
                <ProtectedRoute requiredRole="HOSPITAL">
                  <HospitalProfile />
                </ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="admin/users" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <UserManagement />
                </ProtectedRoute>
              } />
              <Route path="admin/pharmacies" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <PharmacyManagement />
                </ProtectedRoute>
              } />
              <Route path="admin/hospitals" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <HospitalManagement />
                </ProtectedRoute>
              } />
              <Route path="admin/medicines" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <MedicineManagement />
                </ProtectedRoute>
              } />
              <Route path="admin/orders" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <OrderManagement />
                </ProtectedRoute>
              } />
              <Route path="admin/data-management" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <DataManagement />
                </ProtectedRoute>
              } />
              <Route path="admin/queue-management" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <QueueManagementAdmin />
                </ProtectedRoute>
              } />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>

          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss={false}
            draggable={false}
            pauseOnHover={true}
            limit={3}
            theme="dark"
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

// Component to route to appropriate dashboard based on user role
const DashboardRouter = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'PATIENT':
      return <PatientDashboard />;
    case 'PHARMACY':
      return <PharmacyDashboard />;
    case 'HOSPITAL':
      return <HospitalDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default App;
