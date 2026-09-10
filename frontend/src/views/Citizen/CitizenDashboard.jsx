import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import API from '../../api/axios';

export default function CitizenDashboard() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [offices, setOffices] = useState([]);
  const [activeToken, setActiveToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [officesRes, tokenRes] = await Promise.allSettled([
        API.get('/offices'),
        API.get('/tokens/mine'),
      ]);

      if (officesRes.status === 'fulfilled') {
        setOffices(officesRes.value.data);
      }
      if (tokenRes.status === 'fulfilled' && tokenRes.value.data) {
        setActiveToken(tokenRes.value.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleTakeToken = async (officeId, serviceId) => {
    try {
      const res = await API.post('/tokens', { officeId, serviceId });
      setActiveToken(res.data.token);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request token');
    }
  };

  const handleCancelToken = async () => {
    if (!activeToken) return;
    try {
      await API.delete(`/tokens/${activeToken._id}`);
      setActiveToken(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel token');
    }
  };

  const filteredOffices = selectedDistrict
    ? offices.filter((o) => o.district?.toLowerCase() === selectedDistrict.toLowerCase())
    : offices;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">GovQueue 🇱🇰</h1>
          <p className="text-xs text-gray-500">Logged in as {user?.name} ({user?.phone})</p>
        </div>
        <button
          onClick={() => dispatch(logout())}
          className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition"
        >
          Sign Out
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        {/* Active Token Card */}
        {activeToken && (
          <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <span className="bg-blue-500 text-xs px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">Active Token</span>
              <h2 className="text-4xl font-extrabold mt-2">#{activeToken.tokenNumber}</h2>
              <p className="text-blue-100 text-sm mt-1">Status: <strong className="capitalize text-white">{activeToken.status}</strong></p>
            </div>
            <button
              onClick={handleCancelToken}
              className="bg-white text-red-600 hover:bg-red-50 text-sm font-semibold px-4 py-2 rounded-xl transition shadow-sm"
            >
              Cancel Token
            </button>
          </div>
        )}

        {/* Office Browser */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Available Government Offices</h2>
              <p className="text-xs text-gray-500">Select an office and service to take a virtual token</p>
            </div>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Districts</option>
              <option value="Colombo">Colombo</option>
              <option value="Kandy">Kandy</option>
              <option value="Galle">Galle</option>
              <option value="Gampaha">Gampaha</option>
            </select>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400">Loading offices...</p>
          ) : filteredOffices.length === 0 ? (
            <p className="text-sm text-gray-500">No offices found matching selection.</p>
          ) : (
            <div className="space-y-4">
              {filteredOffices.map((office) => (
                <div key={office._id} className="border border-gray-200 rounded-xl p-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">{office.name}</h3>
                    <p className="text-xs text-gray-500">{office.district} • {office.type}</p>
                  </div>

                  <div className="mt-3 border-t border-gray-100 pt-3 flex flex-wrap gap-2">
                    {office.services && office.services.length > 0 ? (
                      office.services.map((service) => (
                        <button
                          key={service._id}
                          disabled={!!activeToken}
                          onClick={() => handleTakeToken(office._id, service._id)}
                          className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed border border-blue-200 px-3 py-1.5 rounded-lg font-medium transition"
                        >
                          Get Token: {service.name}
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400">No active services listed</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}