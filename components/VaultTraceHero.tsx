import React from 'react';
import Link from 'next/link';

const VaultTraceHero = () => {
  return (
    <div className="relative bg-[#020617] min-h-screen flex items-center justify-center overflow-hidden font-mono text-cyan-500">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px]"></div>

      {/* Radial Gradient for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.05),transparent_70%)]"></div>

      <div className="relative z-10 text-center px-4 max-w-4xl">
        {/* Sub-header */}
        <div className="inline-block py-1 px-3 border border-cyan-500/30 rounded-full bg-cyan-950/20 mb-6">
          <span className="text-[10px] tracking-[0.3em] uppercase">Security Operations Center Online</span>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4 text-white">
          VAULT<span className="text-cyan-400">TRACE</span> ADVISORY
        </h1>

        <p className="text-cyan-600/80 text-sm md:text-lg mb-10 max-w-2xl mx-auto uppercase tracking-widest leading-relaxed">
          Forensic Asset Tracking. Risk Mitigation. <br/>
          Professional Financial Oversight.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <Link href="/intake">
            <button className="px-8 py-3 bg-cyan-500 text-black font-bold uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)]">
              Open Case File
            </button>
          </Link>
          <Link href="/login">
            <button className="px-8 py-3 border border-cyan-500/50 text-cyan-500 font-bold uppercase tracking-widest hover:bg-cyan-500/10 transition-all">
              Client Login
            </button>
          </Link>
        </div>
      </div>

      {/* Decorative Corner Borders */}
      <div className="absolute top-10 left-10 w-20 h-20 border-t-2 border-l-2 border-cyan-500/30"></div>
      <div className="absolute bottom-10 right-10 w-20 h-20 border-b-2 border-r-2 border-cyan-500/30"></div>
    </div>
  );
};

export default VaultTraceHero;