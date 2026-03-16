import React, { useState } from 'react';
import { Database, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const DataManagement = () => {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerateData = async () => {
    if (!window.confirm('This will generate 50 test patients and historical token data for the past 30 days. Continue?')) {
      return;
    }

    setGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/admin/data/generate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Test data generated successfully!');
        setGenerated(true);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to generate data');
      }
    } catch (error) {
      console.error('Error generating data:', error);
      toast.error('Error generating test data');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Data Management</h2>
        <p className="text-gray-400 text-sm mt-1">Generate test data for AI predictions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Generate Data Card */}
        <div className="card-saas p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-500/10 p-3 rounded-lg">
              <Database className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Generate Test Data</h3>
              <p className="text-sm text-gray-400">Create historical data for predictions</p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
              <p className="text-sm text-gray-300">
                <CheckCircle className="h-4 w-4 inline text-emerald-400 mr-2" />
                50 test patients
              </p>
            </div>
            <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
              <p className="text-sm text-gray-300">
                <CheckCircle className="h-4 w-4 inline text-emerald-400 mr-2" />
                30 days of historical tokens
              </p>
            </div>
            <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
              <p className="text-sm text-gray-300">
                <CheckCircle className="h-4 w-4 inline text-emerald-400 mr-2" />
                Realistic completion times
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateData}
            disabled={generating || generated}
            className={`w-full ${generating || generated ? 'btn-saas-secondary opacity-50' : 'btn-saas-primary'}`}
          >
            {generating ? 'Generating...' : generated ? 'Data Generated ✓' : 'Generate Data'}
          </button>
        </div>

        {/* AI Predictions Card */}
        <div className="card-saas p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-500/10 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI Predictions</h3>
              <p className="text-sm text-gray-400">Machine learning features</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
              <p className="text-sm font-medium text-white mb-1">Waiting Time Prediction</p>
              <p className="text-xs text-gray-400">
                Predicts waiting time based on day of week, token number, and historical patterns
              </p>
            </div>
            <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
              <p className="text-sm font-medium text-white mb-1">Peak Hours Analysis</p>
              <p className="text-xs text-gray-400">
                Identifies busiest hours to help patients plan their visit
              </p>
            </div>
            <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
              <p className="text-sm font-medium text-white mb-1">Confidence Scoring</p>
              <p className="text-xs text-gray-400">
                Shows prediction accuracy based on available data
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300">
            <p className="font-bold text-yellow-400 mb-1">Important Notes</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Data generation may take 30-60 seconds depending on the number of queues</li>
              <li>This creates test data only - it won't affect real patient records</li>
              <li>AI predictions improve with more historical data</li>
              <li>You can run this multiple times to add more data</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagement;
