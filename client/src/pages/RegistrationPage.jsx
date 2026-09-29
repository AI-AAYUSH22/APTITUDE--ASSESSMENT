import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, User, Hash, Mail, Building, ShieldCheck, AlertCircle, Play, CheckCircle2, Layers, BrainCircuit, Timer, FileCheck2 } from 'lucide-react';
import { assessmentApi } from '../api';

export default function RegistrationPage({ assessment, onStartTest, onBack }) {
  const [formData, setFormData] = useState({
    fullName: '',
    rollNumber: '',
    selectedSet: assessment?.id ? (assessment.id === 'set-b' ? 'SET_B' : 'SET_A') : '',
    email: '',
    organization: ''
  });

  const [verifiedCandidate, setVerifiedCandidate] = useState(null); // Welcome confirmation step
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  // Step 1: Validate Details and Show Welcome Confirmation
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setError('Full Name is mandatory.');
      return;
    }
    if (!formData.rollNumber.trim()) {
      setError('Roll Number / Student ID is mandatory.');
      return;
    }
    if (!formData.selectedSet) {
      setError('Please select an Assessment Set (Set A or Set B).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await assessmentApi.verifyCandidate({
        fullName: formData.fullName.trim(),
        rollNumber: formData.rollNumber.trim(),
        email: formData.email.trim(),
        organization: formData.organization.trim()
      });
      setVerifiedCandidate({
        ...res.data,
        selectedSet: formData.selectedSet
      });
    } catch (err) {
      setError(err.message || 'Verification failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Start test session, generate server shuffle, and enter fullscreen
  const handleLaunchTest = async () => {
    setLoading(true);
    setError('');

    try {
      const targetSetId = formData.selectedSet === 'SET_B' ? 'set-b' : 'set-a';
      const res = await assessmentApi.startSession({
        assessmentId: targetSetId,
        assessment_id: targetSetId,
        selected_set: formData.selectedSet,
        selectedSet: formData.selectedSet,
        fullName: formData.fullName.trim(),
        student_name: formData.fullName.trim(),
        rollNumber: formData.rollNumber.trim(),
        roll_number: formData.rollNumber.trim(),
        email: formData.email.trim(),
        organization: formData.organization.trim()
      });

      if (res.data.alreadyCompleted) {
        setError(res.data.message || 'You have already completed this assessment.');
        setLoading(false);
        return;
      }

      // Enter fullscreen for restricted exam environment
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (fsErr) {
        console.warn('Fullscreen request bypassed:', fsErr);
      }

      onStartTest(res.data);
    } catch (err) {
      setError(err.message || 'Failed to initialize assessment session.');
    } finally {
      setLoading(false);
    }
  };

  const isSetB = formData.selectedSet === 'SET_B';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Top Breadcrumb */}
      <button
        onClick={verifiedCandidate ? () => setVerifiedCandidate(null) : onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-6 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 transition cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{verifiedCandidate ? 'Modify Registration Details' : 'Back to Home'}</span>
      </button>

      {/* Main Form Container */}
      <div className="bg-slate-900/85 border border-slate-800/90 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md relative overflow-hidden">
        
        {/* Glow Top */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {!verifiedCandidate ? (
          <>
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3.5 text-indigo-400 shadow-lg shadow-indigo-600/20">
                <User className="w-7 h-7" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-1.5">
                Student Registration
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                Please enter your student details and select your assigned assessment paper to proceed.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center gap-3 text-rose-300 text-xs sm:text-sm animate-shake">
                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
              
              {/* Full Name (Mandatory) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Full Name <span className="text-rose-400">* (Mandatory)</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-500 text-sm outline-none transition"
                  />
                </div>
              </div>

              {/* Roll Number / Student ID (Mandatory) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Roll Number / Student ID <span className="text-rose-400">* (Mandatory)</span>
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="rollNumber"
                    required
                    value={formData.rollNumber}
                    onChange={handleChange}
                    placeholder="e.g. CS2026-088 or 25"
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-500 text-sm outline-none transition font-mono uppercase"
                  />
                </div>
              </div>

              {/* Set Selection Dropdown (Mandatory) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Assessment Set <span className="text-rose-400">* (Mandatory)</span>
                </label>
                <div className="relative">
                  <Layers className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    name="selectedSet"
                    required
                    value={formData.selectedSet}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-3.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-sm outline-none transition appearance-none cursor-pointer"
                  >
                    <option value="" disabled className="bg-slate-900 text-slate-500">
                      -- Select Assessment Set --
                    </option>
                    <option value="SET_A" className="bg-slate-900 text-white">
                      Set A (Paper 1 • 30 Questions • 30 Mins)
                    </option>
                    <option value="SET_B" className="bg-slate-900 text-white">
                      Set B (Paper 2 • 30 Questions • 30 Mins)
                    </option>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                    ▼
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Questions will be securely retrieved and randomized specifically for your chosen set.
                </p>
              </div>

              {/* Optional Fields Collapsible/Subtle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Email (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Email Address <span className="text-slate-500">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="student@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 focus:border-indigo-500 text-white placeholder-slate-600 text-xs outline-none transition"
                    />
                  </div>
                </div>

                {/* Organization (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    College / Dept <span className="text-slate-500">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="organization"
                      value={formData.organization}
                      onChange={handleChange}
                      placeholder="e.g. AIML Dept"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 focus:border-indigo-500 text-white placeholder-slate-600 text-xs outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Submit / Verify Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition duration-200 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying Student Identity...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue & Review Assessment Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>
          </>
        ) : (
          /* Step 2: Welcome Confirmation Card */
          <div className="text-center py-2 space-y-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/10">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 inline-block mb-3">
                Registration Verified
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                Welcome, {verifiedCandidate.fullName}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
                Roll Number / Student ID: <strong className="font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{verifiedCandidate.rollNumber}</strong>
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center gap-3 text-rose-300 text-xs sm:text-sm text-left">
                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Assessment Confirmation Details */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <span className="text-slate-400 font-medium">Selected Assessment Paper:</span>
                <span className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                  isSetB 
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                }`}>
                  {isSetB ? 'Set B (Paper 2)' : 'Set A (Paper 1)'}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <span className="text-slate-400 font-medium">Total Questions:</span>
                <strong className="text-white font-mono text-sm">30 Questions (30 Marks)</strong>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <span className="text-slate-400 font-medium">Test Duration:</span>
                <strong className="text-amber-400 font-mono text-sm">30 Minutes (Server Clock)</strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Security & Shuffling:</span>
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Randomized Session Order Active
                </span>
              </div>
            </div>

            {/* Anti-Cheat & Environment Advisory */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-left text-[11px] text-slate-400 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <p>
                Upon clicking <strong>Start Test</strong>, the test will expand to Fullscreen. Switching tabs or exiting fullscreen triggers anti-cheat violation logging.
              </p>
            </div>

            {/* Launch Assessment Action */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setVerifiedCandidate(null)}
                className="w-full sm:w-1/3 py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
              >
                Change Details / Set
              </button>

              <button
                id="start-assessment-btn"
                onClick={handleLaunchTest}
                disabled={loading}
                className="w-full sm:w-2/3 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:via-teal-500 hover:to-indigo-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:scale-[1.01] active:scale-[0.99] transition duration-200 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Allocating Server Session & Shuffling Pool...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Start Test</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
