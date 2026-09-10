import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/authSlice';
import API from '../api/axios';

export default function Register() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/auth/register', form);
      dispatch(loginSuccess(res.data));
      navigate('/citizen/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 text-center">GovQueue 🇱🇰</h2>
        <p className="text-gray-500 text-sm text-center mb-6">Create an account to join queues</p>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            required
            placeholder="Full Name"
            className="w-full p-2.5 border rounded-lg"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="tel"
            required
            placeholder="Mobile Number (e.g. 0771234567)"
            className="w-full p-2.5 border rounded-lg"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email (Optional)"
            className="w-full p-2.5 border rounded-lg"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
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
            {loading ? 'Submitting...' : 'Register'}
          </button>
        </form>
        <p className="text-sm text-gray-500 text-center mt-4">
          Already registered? <Link to="/login" className="text-blue-600 font-medium">Log In</Link>
        </p>
      </div>
    </div>
  );
}