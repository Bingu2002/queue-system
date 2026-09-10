import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/authSlice';
import API from '../api/axios';

export default function Login() {
  const [form, setForm] = useState({ phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/auth/login', form);
      dispatch(loginSuccess(res.data));
      const role = res.data.user.role;
      if (role === 'officer') navigate('/officer/dashboard');
      else if (role === 'admin' || role === 'superadmin') navigate('/admin/dashboard');
      else navigate('/citizen/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 text-center">GovQueue 🇱🇰</h2>
        <p className="text-gray-500 text-sm text-center mb-6">Sign in to your account</p>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="tel"
            required
            placeholder="Mobile Number"
            className="w-full p-2.5 border rounded-lg"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            type="password"
            required
            placeholder="Password"
            className="w-full p-2.5 border rounded-lg"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
        <p className="text-sm text-gray-500 text-center mt-4">
          Need an account? <Link to="/register" className="text-blue-600 font-medium">Register</Link>
        </p>
      </div>
    </div>
  );
}