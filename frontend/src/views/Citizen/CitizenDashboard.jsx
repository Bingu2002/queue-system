import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { logout } from '../../store/authSlice';
import API from '../../api/axios';

export default function CitizenDashboard() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [offices, setOffices] = useState([]);
  const [activeToken, setActiveToken] = useState(null);
  const [queuePosition, setQueuePosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [notification, setNotification] = useState(null);

  // Fetch offices list and existing active token
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [officesRes, tokenRes] = await Promise.allSettled([
        API.get('/offices'),
        API.get('/tokens/mine'),
      ]);

      if (officesRes.status === 'fulfilled') {
        setOffices(officesRes.value.data || []);
      }

      if (tokenRes.status === 'fulfilled' && tokenRes.value.data) {
        // Backend returns { token, position }
        const data = tokenRes.value.data;
        if (data.token) {
          setActiveToken(data.token);
          setQueuePosition(data.position ?? null);
        } else {
          setActiveToken(data);
          setQueuePosition(null);
        }
      } else {
        setActiveToken(null);
        setQueuePosition(null);
      }
    } catch (err) {
      console.error('Error fetching citizen dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real-time updates via Socket.io
  useEffect(() => {
    if (!activeToken) return;

    const officeId = activeToken.officeId?._id || activeToken.officeId;
    const serviceId = activeToken.serviceId?._id || activeToken.serviceId;
    const tokenId = activeToken._id;

    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    // Join room for queue broadcast and personal token notifications
    socket.emit('join-queue', { officeId, serviceId });
    socket.emit('join-token', { tokenId });

    socket.on('queue-update', (data) => {
      // Re-calculate position when queue advances
      if (data.currentToken !== undefined) {
        const remaining = Math.max(activeToken.tokenNumber - data.currentToken, 0);
        setQueuePosition(remaining);
      }
      fetchDashboardData();
    });

    socket.on('nearly-your-turn', (data) => {
      setNotification(data.message || 'Get ready — your turn is approaching!');
    });

    return () => {
      socket.disconnect();
    };
  }, [activeToken, fetchDashboardData]);

  // Request a new token
  const handleTakeToken = async (officeId, serviceId) => {
    try {
      setActionLoading(true);
      const res = await API.post('/tokens', { officeId, serviceId });
      // API returns token directly
      const newToken = res.data.token || res.data;
      setActiveToken(newToken);
      await fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request virtual token');
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel an active token
  const handleCancelToken = async () => {
    if (!activeToken) return;
    if (!window.confirm('Are you sure you want to cancel your virtual queue token?')) return;

    try {
      setActionLoading(true);
      await API.delete(`/tokens/${activeToken._id}`);
      setActiveToken(null);
      setQueuePosition(null);
      setNotification(null);
      await fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel token');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredOffices = selectedDistrict
    ? offices.filter((o) => o.district?.toLowerCase() === selectedDistrict.toLowerCase())
    : offices;

  // Calculate estimated wait time (mins)
  const avgDuration = activeToken?.serviceId?.avgDuration || 10;
  const estimatedWait = queuePosition !== null ? queuePosition * avgDuration : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🇱🇰</span>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">GovQueue LK</h1>
              <p className="text-xs text-slate-500">Citizen Portal</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-800">{user?.name}</p>
              <p className="text-[11px] text-slate-500">{user?.phone}</p>
            </div>
            <button
              onClick={() => dispatch(logout())}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        {/* Proximity / Alert Banner */}
        {notification && (
          <div className="bg-amber-500 text-white px-4 py-3 rounded-xl font-medium text-sm flex justify-between items-center shadow-sm animate-pulse">
            <div className="flex items-center space-x-2">
              <span>🔔</span>
              <span>{notification}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-xs uppercase tracking-wider bg-black/20 hover:bg-black/30 px-2 py-1 rounded-md"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Active Token Card */}
        {activeToken && (
          <div className="bg-linear-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-2xl shadow-lg border border-blue-500/20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-white/20 backdrop-blur-xs text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                    Live Virtual Token
                  </span>
                  <span className="capitalize bg-emerald-400/20 text-emerald-200 text-xs px-2 py-0.5 rounded-full font-medium">
                    ● {activeToken.status}
                  </span>
                </div>

                <h2 className="text-5xl font-black tracking-tight mt-2">
                  #{activeToken.tokenNumber}
                </h2>

                <div className="mt-3 text-sm text-blue-100 space-y-0.5">
                  <p className="font-semibold text-white">
                    {activeToken.serviceId?.name || 'Government Service'}
                  </p>
                  <p className="text-xs text-blue-200">
                    {activeToken.officeId?.name || 'Department Office'}
                  </p>
                </div>
              </div>

              {/* Metrics & Action */}
              <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 w-full md:w-auto">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 flex gap-4 w-full md:w-auto justify-around">
                  <div className="text-center px-2">
                    <p className="text-xs text-blue-200">Ahead of You</p>
                    <p className="text-xl font-bold">
                      {queuePosition !== null ? queuePosition : '--'}
                    </p>
                  </div>
                  <div className="border-r border-white/20" />
                  <div className="text-center px-2">
                    <p className="text-xs text-blue-200">Est. Wait</p>
                    <p className="text-xl font-bold">
                      {estimatedWait !== null ? `~${estimatedWait}m` : '--'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCancelToken}
                  disabled={actionLoading}
                  className="w-full md:w-auto bg-white/90 hover:bg-white text-red-600 font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  Cancel Token
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Office & Services Browser */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Available Government Offices</h2>
              <p className="text-xs text-slate-500">
                Select a department service below to take an electronic queue number
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label htmlFor="district-select" className="text-xs font-medium text-slate-600 whitespace-nowrap">
                District:
              </label>
              <select
                id="district-select"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full sm:w-44 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">All Districts</option>
                <option value="Colombo">Colombo</option>
                <option value="Kandy">Kandy</option>
                <option value="Galle">Galle</option>
                <option value="Gampaha">Gampaha</option>
              </select>
            </div>
          </div>

          {/* List Content */}
          <div className="mt-4">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Loading offices and service queues...
              </div>
            ) : filteredOffices.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No government offices found matching the selected filter.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOffices.map((office) => (
                  <div
                    key={office._id}
                    className="border border-slate-200 rounded-xl p-4.5 hover:border-slate-300 transition bg-white"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h3 className="font-semibold text-sm text-slate-900">{office.name}</h3>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {office.district} • {office.type}
                      </span>
                    </div>

                    {office.address && (
                      <p className="text-xs text-slate-400 mt-0.5">{office.address}</p>
                    )}

                    <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                      {office.services && office.services.length > 0 ? (
                        office.services.map((service) => (
                          <button
                            key={service._id}
                            disabled={!!activeToken || actionLoading}
                            onClick={() => handleTakeToken(office._id, service._id)}
                            className="text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>Get Token:</span>
                            <span className="font-semibold">{service.name}</span>
                          </button>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No services registered</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}