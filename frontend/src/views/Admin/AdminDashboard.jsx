import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import API from '../../api/axios';

export default function AdminDashboard() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [offices, setOffices] = useState([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState(user?.officeId || '');
  const [analytics, setAnalytics] = useState({ today: [], weekly: [] });
  const [queueStates, setQueueStates] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form states for creating a new Office
  const [officeForm, setOfficeForm] = useState({
    name: '',
    district: '',
    type: 'Divisional Secretariat',
    address: '',
  });

  // Form states for creating a new Service
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    avgDuration: 15,
  });

  // 1. Load all offices & attached services
  const fetchOffices = useCallback(async () => {
    try {
      const res = await API.get('/offices');
      const list = res.data || [];
      setOffices(list);

      if (list.length > 0) {
        setSelectedOfficeId((prev) =>
          list.some((o) => o._id === prev) ? prev : user?.officeId || list[0]._id
        );
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load offices' });
    }
  }, [user]);

  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);

  const currentOffice = offices.find((o) => o._id === selectedOfficeId);
  const services = currentOffice?.services || [];

  // 2. Fetch analytics & current queue statuses for selected office
  const fetchOfficeDetails = useCallback(async () => {
    if (!selectedOfficeId) return;
    try {
      setLoading(true);
      const analyticsRes = await API.get(`/admin/analytics/${selectedOfficeId}`);
      setAnalytics(analyticsRes.data);

      // Check open/closed status for each service in this office
      const officeObj = offices.find((o) => o._id === selectedOfficeId);
      if (officeObj?.services?.length) {
        const statusMap = {};
        await Promise.all(
          officeObj.services.map(async (srv) => {
            try {
              const qRes = await API.get('/queue/current', {
                params: { officeId: selectedOfficeId, serviceId: srv._id },
              });
              statusMap[srv._id] = qRes.data.isOpen !== false;
            } catch {
              statusMap[srv._id] = true;
            }
          })
        );
        setQueueStates(statusMap);
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Error loading analytics',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedOfficeId, offices]);

  useEffect(() => {
    fetchOfficeDetails();
  }, [fetchOfficeDetails]);

  // 3. Toggle Queue Open / Closed
  const handleToggleQueue = async (serviceId) => {
    const nextState = !(queueStates[serviceId] ?? true);
    try {
      await API.put('/queue/toggle', {
        officeId: selectedOfficeId,
        serviceId,
        isOpen: nextState,
      });
      setQueueStates((prev) => ({ ...prev, [serviceId]: nextState }));
      setMessage({
        type: 'success',
        text: `Queue ${nextState ? 'opened' : 'closed'} successfully.`,
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to toggle queue',
      });
    }
  };

  // 4. Create New Office
  const handleCreateOffice = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/admin/offices', officeForm);
      setOfficeForm({
        name: '',
        district: '',
        type: 'Divisional Secretariat',
        address: '',
      });
      await fetchOffices();
      setSelectedOfficeId(res.data._id);
      setMessage({ type: 'success', text: 'New government office created!' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to create office',
      });
    }
  };

  // 5. Create New Service under selected office
  const handleCreateService = async (e) => {
    e.preventDefault();
    if (!selectedOfficeId) return;
    try {
      await API.post('/admin/services', {
        ...serviceForm,
        officeId: selectedOfficeId,
        avgDuration: Number(serviceForm.avgDuration),
      });
      setServiceForm({ name: '', description: '', avgDuration: 15 });
      await fetchOffices();
      setMessage({ type: 'success', text: 'New service added to office!' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to create service',
      });
    }
  };

  // Helper to read today's status counts
  const getTodayCount = (status) =>
    analytics.today?.find((item) => item._id === status)?.count || 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🇱🇰</span>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                GovQueue LK — Admin Management & Analytics
              </h1>
              <p className="text-xs text-slate-500">
                System Administration • {user?.name} ({user?.role})
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

      <main className="max-w-6xl mx-auto px-4 mt-6 space-y-6">
        {/* Status Banner */}
        {message.text && (
          <div
            className={`px-4 py-3 rounded-xl text-sm flex justify-between items-center border ${
              message.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
          >
            <span>{message.text}</span>
            <button
              onClick={() => setMessage({ type: '', text: '' })}
              className="text-xs font-bold ml-4 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Office Selector */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Active Branch Overview</h2>
            <p className="text-xs text-slate-500">
              Select a branch to manage queues, add services, or inspect analytics
            </p>
          </div>
          <select
            value={selectedOfficeId}
            onChange={(e) => setSelectedOfficeId(e.target.value)}
            className="border border-slate-300 rounded-xl px-3.5 py-2 text-sm bg-white min-w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {offices.map((o) => (
              <option key={o._id} value={o._id}>
                {o.name} — {o.district}
              </option>
            ))}
          </select>
        </div>

        {/* Today's Analytics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs font-medium text-slate-500">Served Today</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">
              {getTodayCount('served')}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs font-medium text-slate-500">Currently Waiting</p>
            <p className="text-3xl font-black text-blue-600 mt-1">
              {getTodayCount('waiting')}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs font-medium text-slate-500">Skipped / No-Show</p>
            <p className="text-3xl font-black text-amber-600 mt-1">
              {getTodayCount('skipped')}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs font-medium text-slate-500">Cancelled</p>
            <p className="text-3xl font-black text-slate-500 mt-1">
              {getTodayCount('cancelled')}
            </p>
          </div>
        </div>

        {/* Service Queue Controls & Weekly Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Queue Open/Close Switches */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-4">
              Service Queue Controls ({currentOffice?.name || 'Office'})
            </h3>

            {services.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">
                No services configured for this branch yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {services.map((srv) => {
                  const isOpen = queueStates[srv._id] ?? true;
                  return (
                    <div
                      key={srv._id}
                      className="py-3 flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{srv.name}</p>
                        <p className="text-xs text-slate-500">
                          Avg duration: {srv.avgDuration} mins
                        </p>
                      </div>

                      <button
                        onClick={() => handleToggleQueue(srv._id)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                          isOpen
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {isOpen ? '● Queue Open' : '○ Queue Closed'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 7-Day Performance Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-4">
              7-Day Service & Wait Time Analytics
            </h3>

            {loading ? (
              <p className="text-xs text-slate-400 py-4">Loading metrics...</p>
            ) : analytics.weekly?.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">
                No completed tokens recorded in the past 7 days.
              </p>
            ) : (
              <div className="space-y-3">
                {analytics.weekly.map((day) => (
                  <div
                    key={day._id}
                    className="flex items-center justify-between bg-slate-50 px-4 py-2.5 rounded-xl text-xs"
                  >
                    <span className="font-semibold text-slate-700">{day._id}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-emerald-700 font-bold">
                        {day.count} served
                      </span>
                      <span className="text-slate-500">
                        Avg wait: {Math.round(day.avgWait || 0)} min
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create Office & Service Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add New Service Form */}
          <form
            onSubmit={handleCreateService}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4"
          >
            <h3 className="font-bold text-slate-900 text-sm">
              Add Service to {currentOffice?.name || 'Selected Office'}
            </h3>

            <input
              type="text"
              required
              placeholder="Service Name (e.g., Land Registry Extract)"
              value={serviceForm.name}
              onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm"
            />

            <input
              type="text"
              placeholder="Short Description"
              value={serviceForm.description}
              onChange={(e) =>
                setServiceForm({ ...serviceForm, description: e.target.value })
              }
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm"
            />

            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Average Service Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                required
                value={serviceForm.avgDuration}
                onChange={(e) =>
                  setServiceForm({ ...serviceForm, avgDuration: e.target.value })
                }
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition cursor-pointer"
            >
              + Add Service
            </button>
          </form>

          {/* Add New Office Form */}
          <form
            onSubmit={handleCreateOffice}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4"
          >
            <h3 className="font-bold text-slate-900 text-sm">
              Register New Government Office
            </h3>

            <input
              type="text"
              required
              placeholder="Office Name (e.g., Divisional Secretariat - Galle)"
              value={officeForm.name}
              onChange={(e) => setOfficeForm({ ...officeForm, name: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="District (e.g., Galle)"
                value={officeForm.district}
                onChange={(e) =>
                  setOfficeForm({ ...officeForm, district: e.target.value })
                }
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm"
              />

              <select
                value={officeForm.type}
                onChange={(e) => setOfficeForm({ ...officeForm, type: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm bg-white"
              >
                <option value="Divisional Secretariat">Divisional Secretariat</option>
                <option value="Grama Niladhari">Grama Niladhari</option>
                <option value="Hospital">Hospital</option>
                <option value="DMT">DMT</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <input
              type="text"
              required
              placeholder="Street Address"
              value={officeForm.address}
              onChange={(e) =>
                setOfficeForm({ ...officeForm, address: e.target.value })
              }
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm"
            />

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 rounded-xl transition cursor-pointer"
            >
              + Register Office
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}