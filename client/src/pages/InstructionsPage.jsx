import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, ShieldCheck, CheckSquare, Square, AlertTriangle, Clock, HelpCircle, CheckCircle2 } from 'lucide-react';

export default function InstructionsPage({ assessment, onProceed, onBack }) {
  const [agreed, setAgreed] = useState(false);

  if (!assessment) return null;

  const instructions = assessment.instructions || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Top Breadcrumb */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-6 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Assessments</span>
      </button>

      {/* Main Card */}
      <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2 inline-block">
                Assessment Instructions
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {assessment.title}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-slate-400">Duration</p>
                <p className="text-base font-bold font-mono text-indigo-300">{assessment.durationMinutes} Minutes</p>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div className="text-right">
                <p className="text-xs text-slate-400">Total Marks</p>
                <p className="text-base font-bold text-emerald-400">{assessment.totalMarks} Marks</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Structure Overview */}
        <div className="mb-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            <span>Test Blueprint & Section Distribution</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs font-semibold text-indigo-400">Section 1</span>
              <h4 className="text-sm font-bold text-white mt-1">Logical Reasoning</h4>
              <p className="text-xs text-slate-400 mt-2">10 Questions (Q1 - Q10) • 10 Marks</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs font-semibold text-purple-400">Section 2</span>
              <h4 className="text-sm font-bold text-white mt-1">Basic Mathematics</h4>
              <p className="text-xs text-slate-400 mt-2">10 Questions (Q11 - Q20) • 10 Marks</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs font-semibold text-pink-400">Section 3</span>
              <h4 className="text-sm font-bold text-white mt-1">Data Structures (DSA)</h4>
              <p className="text-xs text-slate-400 mt-2">10 Questions (Q21 - Q30) • 10 Marks</p>
            </div>
          </div>
        </div>

        {/* General Guidelines List */}
        <div className="mb-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span>Important Examination Rules</span>
          </h3>

          <div className="space-y-2.5">
            {instructions.map((inst, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs sm:text-sm text-slate-300">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-800 text-indigo-400 font-bold text-xs flex items-center justify-center mt-0.5">
                  {index + 1}
                </span>
                <p className="leading-relaxed">{inst}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Restricted Mode Notice */}
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm mb-2">
            <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span>Restricted Security & Anti-Cheating Protocol Active</span>
          </div>
          <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 pl-1">
            <li>Questions and options are delivered individually via secure backend session keys.</li>
            <li>Tab switching, window resizing, and exiting fullscreen are actively monitored and logged.</li>
            <li>Right-click, developer inspect tools, and copying question content are restricted.</li>
            <li>Timer is controlled server-side; refreshing the page will restore current remaining time.</li>
          </ul>
        </div>

        {/* Agreement Checkbox */}
        <div className="mb-8 pt-4 border-t border-slate-800">
          <label 
            onClick={() => setAgreed(!agreed)}
            className="flex items-start gap-3 cursor-pointer select-none group"
          >
            <div className="pt-0.5">
              {agreed ? (
                <CheckSquare className="w-5 h-5 text-indigo-500 flex-shrink-0" />
              ) : (
                <Square className="w-5 h-5 text-slate-600 group-hover:text-slate-500 flex-shrink-0" />
              )}
            </div>
            <span className="text-xs sm:text-sm text-slate-300 group-hover:text-white leading-normal">
              I have thoroughly read, understood, and agree to abide by all the instructions, time limits, and restricted assessment rules stated above.
            </span>
          </label>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-4">
          <button
            onClick={onProceed}
            disabled={!agreed}
            className={`py-3.5 px-8 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all ${
              agreed
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                : 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            <span>Proceed to Candidate Details</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
