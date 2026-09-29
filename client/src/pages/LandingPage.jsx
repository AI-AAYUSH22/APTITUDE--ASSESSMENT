import React, { useEffect, useState } from 'react';
import { ShieldCheck, BrainCircuit, Timer, Shuffle, Lock, ArrowRight, CheckCircle2, Award, Zap, FileText } from 'lucide-react';
import { assessmentApi } from '../api';

export default function LandingPage({ onSelectAssessment, onNavigateAdmin }) {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

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

        {/* Assessment Selection Header */}
        <div className="text-left mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-indigo-400" />
            <span>Select Your Assessment Paper</span>
          </h2>
          <p className="text-sm text-slate-400">Choose from the two independent assessment papers below to begin.</p>
        </div>

        {/* Assessment Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {loading ? (
            <div className="col-span-2 py-16 text-center bg-slate-900/40 rounded-3xl border border-slate-800 animate-pulse">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-400">Loading available assessment modules...</p>
            </div>
          ) : assessments.length === 0 ? (
            <div className="col-span-2 py-12 text-center bg-slate-900/50 rounded-3xl border border-slate-800">
              <p className="text-slate-300">No active assessments found.</p>
            </div>
          ) : (
            assessments.map((test, index) => {
              const isSetA = test.id === 'set-a';
              return (
                <div
                  key={test.id}
                  className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-6 sm:p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col justify-between"
                >
                  {/* Glowing Top Corner */}
                  <div className={`absolute -top-px left-10 right-10 h-0.5 bg-gradient-to-r ${isSetA ? 'from-indigo-500 via-blue-500 to-indigo-500' : 'from-purple-500 via-pink-500 to-purple-500'} opacity-60 group-hover:opacity-100 transition-opacity`} />

                  <div>
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                        isSetA 
                          ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' 
                          : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                      }`}>
                        Paper {isSetA ? '1 (Set-A)' : '2 (Set-B)'}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                        <Timer className="w-3.5 h-3.5 text-slate-400" />
                        {test.durationMinutes} Minutes
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-extrabold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                      {test.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-slate-300 mb-6 line-clamp-2">
                      {test.description}
                    </p>

                    {/* Quick Specs Table */}
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 mb-6 text-center">
                      <div>
                        <p className="text-[11px] text-slate-400">Total Questions</p>
                        <p className="text-base font-bold text-white">{test.questionCount || 30}</p>
                      </div>
                      <div className="border-x border-slate-800">
                        <p className="text-[11px] text-slate-400">Total Marks</p>
                        <p className="text-base font-bold text-indigo-400">{test.totalMarks} Marks</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400">Passing Score</p>
                        <p className="text-base font-bold text-emerald-400">{test.passPercentage}%</p>
                      </div>
                    </div>

                    {/* Section Breakdown Pills */}
                    <div className="space-y-2 mb-6">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Evaluation Sections:</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60">
                          🧠 Logical Reasoning (10 Qs)
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60">
                          📐 Basic Mathematics (10 Qs)
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60">
                          💻 DSA & Coding (10 Qs)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Launch Button */}
                  <button
                    onClick={() => onSelectAssessment(test)}
                    className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 text-white shadow-lg transition-all ${
                      isSetA
                        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-indigo-600/25'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-600/25'
                    }`}
                  >
                    <span>Attempt {isSetA ? 'Assessment 1 (Set A)' : 'Assessment 2 (Set B)'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
