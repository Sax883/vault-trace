'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api-config';

export default function Intake() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    amountLost: '',
    description: '',
    evidence: null as File | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(getApiUrl('/api/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          amountLost: parseFloat(formData.amountLost) || 0,
          description: formData.description,
          evidence: formData.evidence ? formData.evidence.name : null,
        }),
      });

      if (response.ok) {
        console.log('Case submitted successfully');
        router.push('/recovery');
      } else {
        const error = await response.json();
        alert(error.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({ ...formData, evidence: e.target.files[0] });
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-cyan-400 font-mono p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-white">Case Intake Form</h1>
        <form onSubmit={handleSubmit} className="space-y-6 glass p-8 rounded-lg">
          <div>
            <label className="block text-sm font-bold mb-2">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-transparent border border-cyan-500/50 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 bg-transparent border border-cyan-500/50 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 bg-transparent border border-cyan-500/50 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Amount Lost or Want to Recover ($)</label>
            <input
              type="number"
              value={formData.amountLost}
              onChange={(e) => setFormData({ ...formData, amountLost: e.target.value })}
              className="w-full px-4 py-2 bg-transparent border border-cyan-500/50 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Enter amount in USD"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Describe Your Financial Situation</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-transparent border border-cyan-500/50 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 h-32"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Upload Evidence (Hashes, Screenshots, Reports)</label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full px-4 py-2 bg-transparent border border-cyan-500/50 rounded text-white file:bg-cyan-500 file:text-black file:border-none file:px-4 file:py-1 file:rounded file:mr-4"
              multiple
            />
          </div>
          <button
            type="submit"
            className="w-full px-8 py-3 bg-cyan-500 text-black font-bold uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)]"
          >
            Submit Case
          </button>
        </form>
      </div>
    </div>
  );
}