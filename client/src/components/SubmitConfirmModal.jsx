import React from 'react';
import { AlertCircle, CheckCircle2, Clock, HelpCircle, Bookmark, Send, X } from 'lucide-react';

export default function SubmitConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  palette = [],
  remainingSeconds,
  isSubmitting
}) {
  if (!isOpen) return null;

  const total = palette.length;
  const answered = palette.filter(p => p.status === 'ANSWERED' || p.status === 'MARKED_AND_ANSWERED').length;
  const marked = palette.filter(p => p.status === 'MARKED_FOR_REVIEW').length;
  const unanswered = total - answered;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Glow Header */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Submit Assessment</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-300 mb-5 leading-relaxed">
          Are you sure you want to end and submit your assessment? Once submitted, you cannot change your answers.
        </p>

        {/* Summary Stat Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400">Answered</span>
            </div>
            <p className="text-xl font-extrabold text-white">{answered} <span className="text-xs text-slate-500 font-normal">/ {total}</span></p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 mb-1">
              <HelpCircle className="w-4 h-4 text-rose-400" />
              <span className="text-xs text-slate-400">Unanswered</span>
            </div>
            <p className="text-xl font-extrabold text-rose-300">{unanswered} <span className="text-xs text-slate-500 font-normal">/ {total}</span></p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 mb-1">
              <Bookmark className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-400">Marked Review</span>
            </div>
            <p className="text-xl font-extrabold text-amber-300">{marked}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span className="text-xs text-slate-400">Time Left</span>
            </div>
            <p className="text-xl font-mono font-extrabold text-indigo-300">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold transition"
          >
            Continue Test
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Yes, Submit</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
