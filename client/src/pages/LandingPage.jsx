import React, { useEffect, useState } from 'react';
import { ShieldCheck, BrainCircuit, Timer, Shuffle, Lock, ArrowRight, CheckCircle2, Award, Zap, FileText } from 'lucide-react';
import { assessmentApi } from '../api';

export default function LandingPage({ onStartRegistration, onSelectAssessment, onNavigateAdmin }) {
  const handleStart = onStartRegistration || onSelectAssessment;

  useEffect(() => {
    async function loadAssessments() {
      try {
        const res = await assessmentApi.getAssessments();
        setAssessments(res.data || []);
      } catch (err) {
        console.error('Error fetching assessments:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAssessments();
  }, []);

  return (
    <div className="relative overflow-hidden pb-20">
      {/* Background glowing orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-20 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 text-center">
        {/* Host Institution Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-pink-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold mb-6 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>AIML Department & AISA Council • Official Examination Portal</span>
        </div>

        {/* Main Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight mb-6">
          AIML Department & AISA Council: <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Official Aptitude Test
          </span>
        </h1>

        {/* Welcome Statement Subtitle */}
        <div className="max-w-3xl mx-auto mb-10 p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <p className="text-base sm:text-lg text-slate-200 leading-relaxed">
            Welcome to the official Aptitude Test, proudly hosted by the <strong className="text-white">AIML Department in collaboration with the AISA Council</strong>. This assessment is designed to evaluate your <strong className="text-indigo-300">problem-solving abilities</strong>, <strong className="text-purple-300">mathematical foundations</strong>, and core understanding of <strong className="text-pink-300">Data Structures and Algorithms</strong>.
          </p>
        </div>

        {/* Feature Highlights Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-14">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left backdrop-blur-sm">
            <Shuffle className="w-5 h-5 text-indigo-400 mb-2" />
            <h4 className="text-sm font-bold text-white mb-0.5">Session Shuffling</h4>
            <p className="text-xs text-slate-400">Unique question & option sequence per candidate</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left backdrop-blur-sm">
            <Lock className="w-5 h-5 text-purple-400 mb-2" />
            <h4 className="text-sm font-bold text-white mb-0.5">Restricted Delivery</h4>
            <p className="text-xs text-slate-400">Zero front-end answer exposure or full-bank APIs</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left backdrop-blur-sm">
            <Timer className="w-5 h-5 text-amber-400 mb-2" />
            <h4 className="text-sm font-bold text-white mb-0.5">Server Sync Timer</h4>
            <p className="text-xs text-slate-400">Tamper-proof backend clock with auto-submission</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left backdrop-blur-sm">
            <Award className="w-5 h-5 text-emerald-400 mb-2" />
            <h4 className="text-sm font-bold text-white mb-0.5">Instant Analytics</h4>
            <p className="text-xs text-slate-400">Section-wise score breakdowns & certified results</p>
          </div>
        </div>

        {/* Single Primary Action Banner (Set Selection is inside Registration Form) */}
        <div className="max-w-3xl mx-auto mb-14">
          <div className="relative p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-indigo-500/30 shadow-2xl backdrop-blur-xl overflow-hidden group">
            {/* Top Glow Bar */}
            <div className="absolute -top-px left-8 right-8 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mb-5 text-indigo-400 shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition-transform duration-300">
                <BrainCircuit className="w-8 h-8" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
                Ready to Begin Your Assessment?
              </h2>
              <p className="text-sm text-slate-300 max-w-lg mb-8 leading-relaxed">
                Click below to register your identity (Full Name, Roll Number) and select your assigned assessment set (<strong className="text-indigo-300">Set A</strong> or <strong className="text-purple-300">Set B</strong>).
              </p>

              {/* Single Start Aptitude Test Button */}
              <button
                id="start-aptitude-test-btn"
                onClick={handleStart}
                className="w-full sm:w-auto min-w-[280px] py-4 px-8 rounded-2xl font-black text-base flex items-center justify-center gap-3 text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                <span>Start Aptitude Test</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-200" />
              </button>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  30 Multiple-Choice Questions
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-amber-400" />
                  30 Minutes Server Sync
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  Anti-Cheat Protection
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Structure & Syllabus Overview */}
        <div className="max-w-4xl mx-auto text-left">
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <span>Assessment Structure & Section Breakdown</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Section 1</span>
                <h4 className="text-sm font-bold text-white mt-1">🧠 Logical Reasoning</h4>
                <p className="text-xs text-slate-400 mt-1">10 Questions • 10 Marks</p>
                <p className="text-[11px] text-slate-500 mt-2">Patterns, analytical logic, deduction, and sequences.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Section 2</span>
                <h4 className="text-sm font-bold text-white mt-1">📐 Basic Mathematics</h4>
                <p className="text-xs text-slate-400 mt-1">10 Questions • 10 Marks</p>
                <p className="text-[11px] text-slate-500 mt-2">Quantitative aptitude, algebra, percentages, and probability.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">Section 3</span>
                <h4 className="text-sm font-bold text-white mt-1">💻 DSA & Algorithms</h4>
                <p className="text-xs text-slate-400 mt-1">10 Questions • 10 Marks</p>
                <p className="text-[11px] text-slate-500 mt-2">Data structures, recursion, Java code tracing, and time complexity.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
