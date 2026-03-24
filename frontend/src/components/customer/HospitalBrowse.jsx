import React, { useState, useEffect } from 'react';
import { Building2, MapPin, ArrowRight, ShieldCheck, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const HospitalBrowse = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/hospital/approved', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setHospitals(data);
      } else {
        toast.error('Failed to fetch hospitals');
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      toast.error('Error loading hospitals');
    } finally {
      setLoading(false);
    }
  };

  const filteredHospitals = hospitals.filter(hospital =>
    hospital.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hospital.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hospital.supportedInsuranceProviders?.some(p =>
      p.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-slate-900/50 rounded-2xl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Browse Hospitals</h1>
        <p className="text-gray-400 text-sm mt-1">Find hospitals and book queue tokens</p>
      </div>

      {/* Search */}
      <div className="card-saas p-4">
        <input
          type="text"
          placeholder="Search by hospital name, city, or insurance provider..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-saas w-full"
        />
      </div>

      {/* Hospitals List */}
      {filteredHospitals.length === 0 ? (
        <div className="text-center py-16 card-saas">
          <Building2 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white">No hospitals found</h3>
          <p className="mt-2 text-gray-400">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHospitals.map((hospital) => (
            <div key={hospital.hospitalId} className="card-saas p-6 hover:border-blue-500/30 transition-all cursor-pointer"
                 onClick={() => navigate(`/hospital/${hospital.hospitalId}/queues`)}>
              <div className="flex items-start justify-between mb-4">
                <div className="bg-blue-500/10 p-3 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-400" />
                </div>
                <ArrowRight className="h-5 w-5 text-gray-500" />
              </div>

              <h3 className="text-lg font-bold text-white mb-2">{hospital.hospitalName}</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {hospital.address}, {hospital.city}
                </div>
                {hospital.phone && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Phone className="h-4 w-4 shrink-0" />
                    {hospital.phone}
                  </div>
                )}
                {hospital.registrationNumber && (
                  <div className="text-gray-500 text-xs">
                    Reg: {hospital.registrationNumber}
                  </div>
                )}
              </div>

              {/* Insurance Providers */}
              {hospital.supportedInsuranceProviders?.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-green-400" />
                    Insurance accepted
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {hospital.supportedInsuranceProviders.slice(0, 3).map((provider) => (
                      <span key={provider}
                        className="px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-400 border border-green-500/20">
                        {provider}
                      </span>
                    ))}
                    {hospital.supportedInsuranceProviders.length > 3 && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700/50 text-gray-400 border border-slate-600/30">
                        +{hospital.supportedInsuranceProviders.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <button className="w-full mt-4 btn-saas-primary text-sm">
                View Queues
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HospitalBrowse;
