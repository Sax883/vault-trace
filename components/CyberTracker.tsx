'use client';

interface CyberTrackerProps {
  steps: string[];
  currentStage: number;
  progress: number;
}

export default function CyberTracker({ steps, currentStage, progress }: CyberTrackerProps) {
  return (
    <div className="mt-4 rounded-[32px] bg-slate-950/90 border border-cyan-500/10 p-8 shadow-[0_20px_80px_rgba(14,165,233,0.08)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Cybersecurity Tracking</p>
          <h3 className="text-2xl font-semibold text-white">Intelligence Operations Console</h3>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Secure monitoring of your case lifecycle, evidence routing, and forensic validation.
          </p>
        </div>
        <div className="absolute left-6 right-6 top-6 h-2 -translate-y-1/2">
          <div className="h-2 w-full rounded-full bg-white/5" />
          <div className="absolute left-0 top-0 h-2 rounded-full bg-cyan-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="mt-8 flex flex-wrap gap-4 px-2 sm:px-6 justify-center">
          <p className="mt-1 text-lg font-semibold text-white">{progress.toFixed(1)}%</p>
        </div>
      </div>

      <div className="relative mt-8 overflow-x-auto py-6">
        <div className="absolute inset-x-8 top-1/2 h-px bg-gradient-to-r from-cyan-400/20 via-slate-500/20 to-slate-700/10" />
        <div className="relative flex min-w-[760px] items-start justify-between gap-6 px-6">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const completed = stepNumber < currentStage;
            const active = stepNumber === currentStage;
            return (
              <div key={step} className="relative flex w-[170px] flex-col items-center gap-3 text-center">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full border-2 ${
                    completed
                      ? 'border-cyan-400 bg-cyan-400 text-slate-950'
                      : active
                      ? 'border-cyan-300 bg-slate-800 text-cyan-300'
                      : 'border-slate-700 bg-slate-900 text-slate-400'
                  }`}
                >
                  <span className="text-lg font-semibold">{stepNumber}</span>
                </div>
                <div className="space-y-1">
                  <p className={`text-sm font-semibold ${active || completed ? 'text-white' : 'text-slate-300'}`}>
                    {step}
                  </p>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                    {active ? 'In progress' : completed ? 'Completed' : 'Queued'}
                  </p>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full ${
                      completed ? 'bg-cyan-400' : active ? 'bg-gradient-to-r from-cyan-400 to-slate-400/60' : 'bg-slate-700'
                    }`}
                    style={{ width: completed ? '100%' : active ? `${Math.max(25, Math.min(90, progress))}%` : '12%' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Incident Vector</p>
          <p className="mt-3 text-lg font-semibold text-white">Crypto / Wire Hybrid</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Assigned Unit</p>
          <p className="mt-3 text-lg font-semibold text-white">Intelligence &amp; Forensics</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Last Audit</p>
          <p className="mt-3 text-lg font-semibold text-white">{new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
