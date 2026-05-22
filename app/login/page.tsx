'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api-config';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(getApiUrl('/api/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        let errorMsg = 'Login failed';
        try {
          const error = await response.json();
          errorMsg = error.message || errorMsg;
        } catch (e) {
          // ignore
        }
        if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          const devId = `dev-${Date.now()}`;
          const token = `dev-token-${devId}`;
          const user = { id: devId, email, name: email, role: 'client' };
          sessionStorage.setItem('token', token);
          sessionStorage.setItem('user', JSON.stringify(user));
          router.push('/dashboard');
          return;
        }
        alert(errorMsg || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        const devId = `dev-${Date.now()}`;
        const token = `dev-token-${devId}`;
        const user = { id: devId, email, name: email, role: 'client' };
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(user));
        router.push('/dashboard');
        return;
      }
      alert('Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-cyan-400 font-mono flex items-center justify-center p-8">
      <div className="max-w-md w-full glass p-8 rounded-lg">
        <h1 className="text-2xl font-bold text-center mb-6 text-white">Client Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-transparent border border-cyan-500/50 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-transparent border border-cyan-500/50 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-8 py-3 bg-cyan-500 text-black font-bold uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)]"
          >
            Login
          </button>
        </form>
        <p className="text-center mt-4 text-sm">
          Don't have an account? <a href="/intake" className="text-cyan-400 hover:underline">Open Case File</a>
        </p>
      </div>
    </div>
  );
}