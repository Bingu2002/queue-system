import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import { useSocket } from '../../context/SocketContext';
import API from '../../api/axios';

export default function OfficerDashboard() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const socket = useSocket();

  const [offices, setOffices] = useState([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState(user?.officeId || '');
  const [selectedServiceId, setSelectedServiceId] = useState('');

  const [queueData, setQueueData] = useState({
    tokens: [],
    currentToken: 0,
    lastToken: 0,
    servedToday: 0,
  });

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Load offices and attached services
  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const res = await API.get('/offices');
        const list = res.data || [];
        setOffices(list);

        // Preselect office if assigned to officer, otherwise pick first
        const defaultOffice =
          list.find((o) => o._id === user?.officeId) || list[0];

        if (defaultOffice) {
          setSelectedOfficeId(defaultOffice._id);
          if (defaultOffice.services?.length > 0) {
            setSelectedServiceId(defaultOffice.services[0]._id);
          }
        }
      } catch (err) {
        setError('Failed to load offices');
      }
    };
    fetchOffices();
  }, [user]);

  const currentOffice = offices.find((o) => o._id === selectedOfficeId);
  const availableServices = currentOffice?.services || [];

  // Handle office dropdown change
  const handleOfficeChange = (e) => {
    const officeId = e.target.value;
    setSelectedOfficeId(officeId);
    const officeObj = offices.find((o) => o._id === officeId);
    setSelectedServiceId(officeObj?.services?.[0]?._id || '');
  };

  // 2. Fetch live queue state for selected office & service
  const fetchQueue = useCallback(async () => {
    if (!selectedOfficeId || !selectedServiceId) return;
    try {
      setLoading(true);
      setError('');
      const res = await API.get('/queue/current', {
        params: { officeId: selectedOfficeId, serviceId: selectedServiceId },
      });
      setQueueData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading queue');
    } finally {
      setLoading(false);
    }
  }, [selectedOfficeId, selectedServiceId]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // 3. Real-time Socket.io listener for new tokens joining
  useEffect(() => {
    if (!socket || !selectedOfficeId || !selectedServiceId) return;

    socket.emit('join-queue', {
      officeId: selectedOfficeId,
      serviceId: selectedServiceId,
    });

    const handleQueueUpdate = () => {
      fetchQueue();
    };

    socket.on('queue-update', handleQueueUpdate);
    socket.on('queue-status-changed', handleQueueUpdate);

    return () => {
      socket.off('queue-update', handleQueueUpdate);
      socket.off('queue-status-changed', handleQueueUpdate);
    };
  }, [socket, selectedOfficeId, selectedServiceId, fetchQueue]);

  // 4. Call Next Token
  const handleCallNext = async () => {
    if (!selectedOfficeId || !selectedServiceId) return;
    try {
      setActionLoading(true);
      setError('');
      await API.post('/queue/next', {
        officeId: selectedOfficeId,
        serviceId: selectedServiceId,
      });
      await fetchQueue();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to call next token');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Update active token status ('served' | 'skipped')
  const handleUpdateStatus = async (tokenId, status) => {
    try {
      setActionLoading(true);
      setError('');
      await API.put(`/queue/status/${tokenId}`, { status });
      await fetchQueue();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update token status');
    } finally {
      setActionLoading(false);
    }
  };

  // Identify currently called token & waiting list
  const activeCalledToken = queueData.tokens.find(
    (t) => t.status === 'called' && t.tokenNumber === queueData.currentToken
  ) || queueData.tokens.find((t) => t.status === 'called');

  const waitingTokens = queueData.tokens.filter((t) => t.status === 'waiting');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🇱🇰</span>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                GovQueue LK — Officer Console
              </h1>
              <p className="text-xs text-slate-500">
                Counter Operations • {user?.name} ({user?.role})
              </p>
            </div>
          </div>

          <button
            onClick={() => dispatch(logout())}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-6 space-y-6">
        {/* Counter Selection Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Select Government Office
            </label>
            <select
              value={selectedOfficeId}
              onChange={handleOfficeChange}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {offices.map((office) => (
                <option key={office._id} value={office._id}>
                  {office.name} ({office.district})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Select Service Counter
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              disabled={availableServices.length === 0}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            >
              {availableServices.length === 0 ? (
                <option value="">No services available</option>
              ) : (
                availableServices.map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.name} (~{service.avgDuration} mins)
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Metrics Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
            <p className="text-xs font-medium text-slate-500">Now Serving</p>
            <p className="text-3xl font-black text-blue-600 mt-1">
              #{queueData.currentToken || 0}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
            <p className="text-xs font-medium text-slate-500">Waiting in Line</p>
            <p className="text-3xl font-black text-amber-600 mt-1">
              {waitingTokens.length}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
            <p className="text-xs font-medium text-slate-500">Served Today</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">
              {queueData.servedToday}
            </p>
          </div>
        </div>

        {/* Active Desk Control Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              Active Counter Desk
            </span>

            {activeCalledToken ? (
              <div className="mt-3">
                <h2 className="text-4xl font-black text-slate-900">
                  Token #{activeCalledToken.tokenNumber}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Citizen:{' '}
                  <span className="font-semibold">
                    {activeCalledToken.citizenId?.name || 'Walk-in Guest'}
                  </span>{' '}
                  ({activeCalledToken.citizenId?.phone || activeCalledToken.guestPhone || 'No phone'})
                </p>
              </div>
            ) : (
              <div className="mt-3">
                <h2 className="text-2xl font-bold text-slate-400">No Active Citizen at Desk</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Click "Call Next Citizen" to summon the next waiting token.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            {activeCalledToken && (
              <>
                <button
                  onClick={() => handleUpdateStatus(activeCalledToken._id, 'served')}
                  disabled={actionLoading}
                  className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition disabled:opacity-50 cursor-pointer"
                >
                  ✓ Mark Served
                </button>
                <button
                  onClick={() => handleUpdateStatus(activeCalledToken._id, 'skipped')}
                  disabled={actionLoading}
                  className="flex-1 md:flex-none bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition disabled:opacity-50 cursor-pointer"
                >
                  ↷ Skip / No-Show
                </button>
              </>
            )}

            <button
              onClick={handleCallNext}
              disabled={actionLoading || waitingTokens.length === 0}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-xs transition disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer"
            >
              {actionLoading ? 'Processing...' : '📢 Call Next Citizen'}
            </button>
          </div>
        </div>

        {/* Waiting Queue Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">Upcoming Waiting Queue</h3>
            <button
              onClick={fetchQueue}
              className="text-xs text-blue-600 hover:underline cursor-pointer"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading queue...</div>
          ) : waitingTokens.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No citizens currently waiting in this queue.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {waitingTokens.map((token, idx) => (
                <div
                  key={token._id}
                  className="px-6 py-3.5 flex justify-between items-center hover:bg-slate-50 transition"
                >
                  <div className="flex items-center space-x-4">
                    <span className="font-black text-base text-slate-800 w-12">
                      #{token.tokenNumber}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {token.citizenId?.name || 'Walk-in Guest'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {token.citizenId?.phone || token.guestPhone || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {idx === 0 && (
                      <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">
                        Up Next
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {new Date(token.issuedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
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