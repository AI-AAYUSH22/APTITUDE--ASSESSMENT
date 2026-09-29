import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export default function ViolationModal({
  isOpen,
  onDismiss,
  violationCount,
  violationReason
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-lg animate-fade-in">
      <div className="bg-slate-900 border border-rose-600/50 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden text-center">
        {/* Glowing top alert strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500 animate-pulse" />

        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-white mb-1">
          Security Alert: Violation Detected
        </h3>
        
        <div className="inline-block px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-semibold my-2">
          Warning #{violationCount} Logged to Server
        </div>

        <p className="text-sm text-slate-300 my-3 leading-relaxed">
          {violationReason || "Tab switching, leaving fullscreen, or context menu access was detected."}
        </p>

        <p className="text-xs text-slate-400 mb-6 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          ⚠️ All focus changes and window events are logged with precise timestamps on the server and reviewed by the evaluation committee.
        </p>

        <button
          onClick={onDismiss}
          className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition"
        >
          I Understand, Return to Test
        </button>
      </div>
    </div>
  );
}
