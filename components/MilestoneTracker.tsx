import React from 'react';
import { CheckCircle, ShieldAlert, Activity, FileSearch, ShieldCheck } from 'lucide-react';

const milestones = [
  { id: 1, title: 'Case Intake & Evidence Review', desc: 'Verifying submitted transaction hashes and documentation.', icon: <FileSearch size={20}/> },
  { id: 2, title: 'Network Forensic Audit', desc: 'Tracing asset movement across blockchain oracles and nodes.', icon: <Activity size={20}/> },
  { id: 3, title: 'Verification Protocol', desc: 'Confirming asset location and legal jurisdiction.', icon: <ShieldAlert size={20}/> },
  { id: 4, title: 'Final Advisory Report', desc: 'Compiling forensic findings for recovery authorization.', icon: <ShieldCheck size={20}/> },
];

const MilestoneTracker = ({ currentStage = 2 }) => {
  return (
    <div className="bg-[#0a0a0a] border border-cyan-900/30 p-8 rounded-lg max-w-2xl w-full font-mono">
      <div className="flex items-center justify-between mb-10">
        <h2 className="text-white text-lg font-bold tracking-widest uppercase">Case Timeline: <span className="text-cyan-400">VT-7743-B</span></h2>
        <span className="text-[10px] text-cyan-600 animate-pulse">● SYSTEM LIVE</span>
      </div>

      <div className="space-y-0">
        {milestones.map((step, index) => {
          const isCompleted = step.id < currentStage;
          const isCurrent = step.id === currentStage;

          return (
            <div key={step.id} className="relative flex gap-6 pb-12 last:pb-0">
              {/* Connecting Line */}
              {index !== milestones.length - 1 && (
                <div className={`absolute left-[19px] top-10 w-[2px] h-full ${isCompleted ? 'bg-cyan-500' : 'bg-gray-800'}`} />
              )}

              {/* Icon / Status Indicator */}
              <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500
                ${isCompleted ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_15px_#22d3ee]' :
                  isCurrent ? 'bg-black border-cyan-400 text-cyan-400 animate-pulse shadow-[0_0_20px_rgba(34,211,238,0.3)]' :
                  'bg-black border-gray-800 text-gray-700'}`}>
                {isCompleted ? <CheckCircle size={24} /> : step.icon}
              </div>

              {/* Text Content */}
              <div className="flex flex-col justify-center">
                <h3 className={`text-sm font-bold tracking-wide uppercase transition-colors duration-500
                  ${isCurrent ? 'text-cyan-400 shadow-cyan-400' : isCompleted ? 'text-white' : 'text-gray-600'}`}>
                  {step.title}
                </h3>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                  {step.desc}
                </p>
                {isCurrent && (
                  <div className="mt-2 flex gap-1">
                    <span className="h-1 w-8 bg-cyan-500 animate-pulse"></span>
                    <span className="h-1 w-4 bg-cyan-800"></span>
                    <span className="text-[9px] text-cyan-400 ml-2">ANALYZING...</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MilestoneTracker;