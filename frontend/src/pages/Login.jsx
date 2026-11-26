import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { loginSuccess } from '../store/authSlice';

const ROLES = [
  {
    id: 'citizen',
    label: 'Citizen',
    subtitle: 'Book a virtual token & track your queue position',
    redirect: '/citizen/dashboard',
    demoPhone: '',
  },
  {
    id: 'officer',
    label: 'Officer',
    subtitle: 'Manage counter operations & call next citizen',
    redirect: '/officer/dashboard',
    demoPhone: '0711111111',
  },
  {
    id: 'admin',
    label: 'Admin',
    subtitle: 'Configure branches, services, queues & analytics',
    redirect: '/admin/dashboard',
    demoPhone: '0722222222',
  },
];

export default function Login() {
  const [selectedPortal, setSelectedPortal] = useState('citizen');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const activeRole = ROLES.find((r) => r.id === selectedPortal);

  const handlePortalSwitch = (roleId) => {
    setSelectedPortal(roleId);
    setError('');
  };

  const fillDemoCredentials = () => {
    if (activeRole?.demoPhone) {
      setPhone(activeRole.demoPhone);
      setPassword('password123');
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await API.post('/auth/login', { phone, password });
      const { token, user } = res.data;

      // Verify the account role matches the selected login portal
      const isAllowed =
        (selectedPortal === 'citizen' && user.role === 'citizen') ||
        (selectedPortal === 'officer' && ['officer', 'admin', 'superadmin'].includes(user.role)) ||
        (selectedPortal === 'admin' && ['admin', 'superadmin'].includes(user.role));

      if (!isAllowed) {
        setError(
          `This account is registered as "${user.role}". Please switch to the ${
            user.role === 'citizen' ? 'Citizen' : user.role === 'officer' ? 'Officer' : 'Admin'
          } login tab.`
        );
        setLoading(false);
        return;
      }

      dispatch(loginSuccess({ user, token }));
      navigate(activeRole.redirect);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xs p-7">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            GovQueue <span className="text-sm font-bold text-blue-600">LK</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Select your portal to sign in
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl mb-5">
          {ROLES.map((role) => {
            const active = selectedPortal === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => handlePortalSwitch(role.id)}
                className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  active
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {role.label}
              </button>
            );
          })}
        </div>

        {/* Portal Context Banner */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 mb-5 flex items-center justify-between gap-2">
          <p className="text-xs text-slate-600">{activeRole.subtitle}</p>
          {activeRole.demoPhone && (
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="shrink-0 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg transition cursor-pointer"
            >
              Demo Fill
            </button>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mobile Number
            </label>
            <input
              type="text"
              required
              placeholder="07XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-xl transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Signing in...' : `Sign In as ${activeRole.label}`}
          </button>
        </form>

        {/* Footer Link: Only show self-registration on Citizen tab */}
        <div className="mt-5 text-center text-xs text-slate-500">
          {selectedPortal === 'citizen' ? (
            <>
              Need a citizen account?{' '}
              <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                Register
              </Link>
            </>
          ) : (
            <span>Staff accounts are provisioned by your branch administrator.</span>
          )}
        </div>
      </div>
    </div>
  );
}