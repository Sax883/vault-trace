import React from 'react';

export default function Operations() {
  return (
    <div className="min-h-screen bg-[#020617] text-cyan-200 p-10 font-sans">
      <div className="max-w-4xl mx-auto bg-[#070911] border border-cyan-900/30 rounded-2xl p-10 shadow-xl">
        <h1 className="text-3xl font-extrabold text-white mb-4">Operational Workflow — Trace Vault</h1>
        <p className="text-sm text-slate-300 mb-6">This document explains the immediate steps taken by the Trace Vault platform after a client registers and files a case. The workflow balances automated triage, secure data handling, and analyst-led forensic work to maximize recovery velocity while protecting client privacy.</p>

        <section className="space-y-4 mb-6">
          <h2 className="text-xl font-semibold text-cyan-300">Step 1 — Instant Signup & Case Submission (Data Ingestion)</h2>
          <p className="text-sm text-slate-300">When a client presses "Submit Case" the platform:</p>
          <ul className="list-disc ml-6 text-sm text-slate-300 space-y-1">
            <li>Generates a unique Case ID and locks the submitted record to prevent modification.</li>
            <li>Immediately ingests transaction identifiers (TxIDs), banking references and uploaded evidence for automated analysis.</li>
            <li>Triggers automated compliance and risk triage to identify priority vectors and jurisdictional constraints.</li>
            <li>Dispatches an immediate confirmation email and an internal portal notification to establish trust and next steps.</li>
          </ul>
          <div className="mt-3 p-4 bg-slate-900/60 border border-slate-700 rounded">
            <strong className="text-cyan-300">Automated Email (example):</strong>
            <p className="text-sm text-slate-300 mt-2">Subject: Case Received & Registered: Case ID #[Case_Number] - Trace Vault</p>
            <p className="text-sm text-slate-300">Body: Acknowledge receipt of your narrative and uploaded evidence. Assign tracking number. Explicit instructions on what NOT to do. Prompt the client to log into the secure dashboard.</p>
          </div>
        </section>

        <section className="space-y-4 mb-6">
          <h2 className="text-xl font-semibold text-cyan-300">Step 2 — Client Dashboard Initialization (First Login State)</h2>
          <p className="text-sm text-slate-300">On the client's first dashboard login the UI reflects an active pipeline:</p>
          <ul className="list-disc ml-6 text-sm text-slate-300 space-y-1">
            <li><strong>Case Status Tracker:</strong> visual step-indicators showing the pipeline (Submitted → Under Technical Assessment → Tracing Active → Legal/Exchange Outreach → Resolution). The initial state is <em>Under Review / Technical Assessment</em>.</li>
            <li><strong>Evidence Vault:</strong> secure display of uploaded files alongside cryptographic hashes to demonstrate data integrity and immutability.</li>
            <li><strong>System Notification / First Dashboard Reply:</strong> an automated message in the portal inbox: <em>"Welcome to Trace Vault. Your case file has been securely routed to our intelligence unit. A cyber analyst is currently reviewing the transaction paths provided. Expect a preliminary forensic feasibility update within 24–48 hours."</em></li>
          </ul>
        </section>

        <section className="space-y-4 mb-6">
          <h2 className="text-xl font-semibold text-cyan-300">Step 3 — Analysts' First Actions & Background Assessment</h2>
          <p className="text-sm text-slate-300">Analysts and automated scripts perform an immediate technical validation to remove dead-ends before committing human hours:</p>
          <ul className="list-disc ml-6 text-sm text-slate-300 space-y-1">
            <li><strong>Crypto / Fiat Triage:</strong> for crypto cases, TxIDs are analyzed with blockchain explorers and clustering tools to locate unspent outputs or movement to on/off ramps (CEX). For wire/fiat, routing numbers and beneficiary banks are flagged for jurisdictional review.</li>
            <li><strong>Entity Profiling:</strong> cross-reference domains, email headers and phone numbers with threat intelligence feeds and historical case indicators.</li>
          </ul>
        </section>

        <section className="space-y-4 mb-6">
          <h2 className="text-xl font-semibold text-cyan-300">Step 4 — The First Human Response (Feasibility Milestone)</h2>
          <p className="text-sm text-slate-300">Within the initial feasibility window (typically 24 hours) an assigned analyst provides a tailored assessment through the portal and by follow-up email.</p>
          <div className="mt-2 p-4 bg-slate-900/60 border border-slate-700 rounded">
            <strong className="text-cyan-300">Initial Forensic Assessment (example):</strong>
            <p className="text-sm text-slate-300 mt-2">"Our technical team has completed the initial footprinting of your case. We have mapped the movement of your assets to the target wallets/accounts. Current Findings: Asset Vector: [Crypto / Wire Transfer]. Current Location: traced to a high-volume cluster associated with [Exchange/Intermediate Holding]. Next Milestone: preparing Forensic Subpoena Package / Asset Freeze Notice. Please verify the attached timeline is accurate."</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-cyan-300">Operational Takeaways</h2>
          <ul className="list-disc ml-6 text-sm text-slate-300 space-y-1">
            <li><strong>Speed Defeats Friction:</strong> automated acknowledgements and a dashboard notification within five minutes significantly reduce client churn and establish trust.</li>
            <li><strong>Data Isolation & Integrity:</strong> the initial dashboard state must communicate that submitted data is locked, hashed, and being processed by an intelligence unit.</li>
          </ul>
        </section>

      </div>
    </div>
  );
}
