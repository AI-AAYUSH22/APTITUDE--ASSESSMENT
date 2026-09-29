import React from 'react';
import { ShieldCheck, BookOpen, User, Lock, Trophy } from 'lucide-react';

export default function Navbar({ currentView, candidate, assessmentTitle, onNavigateAdmin, onNavigateLeaderboard, onGoHome }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={currentView === 'exam' ? null : onGoHome}
          className={`flex items-center gap-3 ${currentView === 'exam' ? 'cursor-default' : 'cursor-pointer group'}`}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-brand-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                AptiPro
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Secure v2.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">AIML Dept & AISA Council Assessment Portal</p>
          </div>
        </div>

        {/* Center Title (in Exam or Result mode) */}
        {assessmentTitle && (
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <BookOpen className="w-4 h-4 text-brand-400" />
            <span className="text-sm font-semibold text-slate-200">{assessmentTitle}</span>
          </div>
        )}

        {/* Right Actions / Candidate Info / Leaderboard Link */}
        <div className="flex items-center gap-3">
          {currentView !== 'exam' && (
            <button
              onClick={() => onNavigateLeaderboard('set-a')}
              className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm ${
                currentView === 'leaderboard'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 ring-1 ring-amber-500/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-slate-800 hover:border-amber-500/30'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Leaderboard</span>
            </button>
          )}

          {candidate && currentView === 'exam' && (
            <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                <User className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-200 leading-tight">{candidate.name}</p>
                <p className="text-[10px] text-slate-400 leading-tight font-mono">{candidate.rollNumber}</p>
              </div>
            </div>
          )}

          {currentView !== 'exam' && (
            <button
              onClick={onNavigateAdmin}
              className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-sm ${
                currentView === 'admin'
                  ? 'bg-indigo-600 text-white shadow-indigo-600/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Admin Console</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
