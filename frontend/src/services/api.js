import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => {
    // Handle different registration types
    if (userData.role === 'PHARMACY') {
      return api.post('/auth/register', {
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        role: userData.role,
        pharmacyData: {
          pharmacyName: userData.pharmacyName,
          licenseNumber: userData.licenseNumber,
          address: userData.address,
          city: userData.city,
        }
      });
    } else if (userData.role === 'HOSPITAL') {
      return api.post('/auth/register', {
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        role: userData.role,
        hospitalData: {
          hospitalName: userData.hospitalName,
          registrationNumber: userData.registrationNumber,
          address: userData.hospitalAddress,
          city: userData.hospitalCity,
          supportedInsuranceProviders: userData.supportedInsuranceProviders || [],
        }
      });
    } else {
      // Regular user registration (PATIENT)
      return api.post('/auth/register', {
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        role: userData.role,
      });
    }
  },
  getCurrentUser: () => api.get('/auth/me'),
};

// User API
export const userAPI = {
  getAllUsers: () => api.get('/users'),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getUsersByRole: (role) => api.get(`/users/role/${role}`),
  activateUser: (id) => api.put(`/users/${id}/activate`),
  deactivateUser: (id) => api.put(`/users/${id}/deactivate`),
};

// Pharmacy API
export const pharmacyAPI = {
  getAllPharmacies: () => api.get('/pharmacies'),
  getPharmacyById: (id) => api.get(`/pharmacies/${id}`),
  createPharmacy: (pharmacyData) => api.post('/pharmacies', pharmacyData),
  updatePharmacy: (id, pharmacyData) => api.put(`/pharmacies/${id}`, pharmacyData),
  deletePharmacy: (id) => api.delete(`/pharmacies/${id}`),
  approvePharmacy: (id) => api.put(`/pharmacies/${id}/approve`),
  rejectPharmacy: (id) => api.put(`/pharmacies/${id}/reject`),
  getPendingPharmacies: () => api.get('/pharmacies/pending'),
  getApprovedPharmacies: () => api.get('/pharmacies/approved'),
};

// Hospital API
export const hospitalAPI = {
  getAllHospitals: () => api.get('/hospitals'),
  getHospitalById: (id) => api.get(`/hospitals/${id}`),
  createHospital: (hospitalData) => api.post('/hospitals', hospitalData),
  updateHospital: (id, hospitalData) => api.put(`/hospitals/${id}`, hospitalData),
  deleteHospital: (id) => api.delete(`/hospitals/${id}`),
};

// Medicine API
export const medicineAPI = {
  getAllMedicines: () => api.get('/medicines'),
  getMedicineById: (id) => api.get(`/medicines/${id}`),
  createMedicine: (medicineData) => api.post('/medicines', medicineData),
  updateMedicine: (id, medicineData) => api.put(`/medicines/${id}`, medicineData),
  deleteMedicine: (id) => api.delete(`/medicines/${id}`),
  searchMedicines: (query) => api.get(`/medicines/search?q=${query}`),
};

// Prescription API
export const prescriptionAPI = {
  getAllPrescriptions: () => api.get('/prescriptions'),
  getPrescriptionById: (id) => api.get(`/prescriptions/${id}`),
  createPrescription: (prescriptionData) => api.post('/prescriptions', prescriptionData),
  updatePrescription: (id, prescriptionData) => api.put(`/prescriptions/${id}`, prescriptionData),
  getPrescriptionsByPatient: (patientId) => api.get(`/prescriptions/patient/${patientId}`),
  getPrescriptionsByDoctor: (doctorId) => api.get(`/prescriptions/doctor/${doctorId}`),
  fulfillPrescription: (id) => api.put(`/prescriptions/${id}/fulfill`),
  cancelPrescription: (id) => api.put(`/prescriptions/${id}/cancel`),
};

// Payment API
export const paymentAPI = {
  getAllPayments: () => api.get('/payments'),
  getPaymentById: (id) => api.get(`/payments/${id}`),
  createPayment: (paymentData) => api.post('/payments', paymentData),
  processPayment: (id, gatewayReference) => api.put(`/payments/${id}/process?gatewayReference=${gatewayReference}`),
  getPaymentsByUser: (userId) => api.get(`/payments/user/${userId}`),
  getTodayRevenue: () => api.get('/payments/revenue/today'),
};

export default api;