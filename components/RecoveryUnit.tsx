'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const RecoveryUnit = () => {
  const router = useRouter();
  const [progress, setProgress] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);

  const logSequence: string[] = [
    "[00:00:00] Loading cryptographic kernel modules...",
    "[00:00:02] TLS 1.3 handshake with node-va-017",
    "[00:00:04] Neural-AI correlation engine online | Confidence: 99.97%",
    "[00:00:06] Blockchain oracles sync | BTC, ETH, BSC, SOL",
    "[00:00:08] Initializing secure client workspace..."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => router.push('/dashboard'), 2000); // Redirect after 2 seconds
          return 100;
        }
        return prev + 1;
      });
    }, 100);

    logSequence.forEach((text, index) => {
      setTimeout(() => {
        setLogs((prev) => [...prev, text]);
      }, index * 1500);
    });

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050505] text-cyan-400 font-mono flex flex-col items-center justify-center p-8 uppercase tracking-[0.2em]">
      {/* Hexagon Logo */}
      <div className="relative mb-12">
        <div className="w-24 h-24 border border-cyan-500/30 rounded-full animate-pulse absolute -inset-4" />
        <div className="w-16 h-16 border-2 border-cyan-400 flex items-center justify-center relative overflow-hidden"
             style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
          <span className="text-2xl font-bold glow">R</span>
        </div>
      </div>

      <h1 className="text-xl font-bold tracking-[0.4em] mb-2 text-shadow-cyan">Recovery Unit</h1>
      <p className="text-[10px] text-cyan-600 mb-8">Initializing VaultTrace Neural-AI Core</p>

      {/* Loading Bar */}
      <div className="w-64 h-[2px] bg-cyan-950 mb-10 relative">
        <div
          className="h-full bg-cyan-400 shadow-[0_0_15px_#22d3ee] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Terminal Logs */}
      <div className="max-w-lg text-center space-y-2">
        {logs.map((log, i) => (
          <p key={i} className="text-[9px] text-cyan-500/80 animate-fade-in">{log}</p>
        ))}
      </div>

      <style jsx>{`
        .glow { text-shadow: 0 0 10px #22d3ee; }
        .text-shadow-cyan { text-shadow: 0 0 5px rgba(34, 211, 238, 0.5); }
        @keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default RecoveryUnit;