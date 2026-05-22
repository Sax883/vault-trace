'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api-config';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dbStatus, setDbStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [dbMessage, setDbMessage] = useState<string>('Checking database...');

  useEffect(() => {
    let mounted = true;
    async function check() {
      try {
        const res = await fetch(getApiUrl('/api/health'));
        const json = await res.json();
        if (!mounted) return;
        if (res.ok && json.connected) {
          setDbStatus('ok');
          setDbMessage('Database connected');
        } else if (res.ok && json.devFallback) {
          setDbStatus('error');
          setDbMessage('Dev fallback: DB not connected (local)');
        } else {
          setDbStatus('error');
          setDbMessage(json.error || 'Database not available');
        }
      } catch (err) {
        if (!mounted) return;
        setDbStatus('error');
        setDbMessage('Health check failed');
      }
    }
    check();
    return () => { mounted = false; };
  }, []);

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
        const error = await response.json();
        alert(error.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-mono flex items-center justify-center p-8">
      <div className="max-w-md w-full glass p-6 rounded-lg relative">
        <div className="absolute right-4 top-4 flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${dbStatus === 'checking' ? 'bg-yellow-400 animate-pulse' : dbStatus === 'ok' ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
          <span className="text-xs text-slate-300">{dbMessage}</span>
        </div>
        <h1 className="text-2xl font-bold text-center mb-6 text-white">Client Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-transparent border border-teal-500/50 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-transparent border border-teal-500/50 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-8 py-3 bg-teal-500 text-black font-bold uppercase tracking-widest hover:bg-teal-400 transition-all shadow-[0_0_20px_rgba(20,184,166,0.18)]"
          >
            Login
          </button>
        </form>
        <p className="text-center mt-4 text-sm">
          Don't have an account? <a href="/intake" className="text-teal-300 hover:underline">Open Case File</a>
        </p>
      </div>
    </div>
  );
}