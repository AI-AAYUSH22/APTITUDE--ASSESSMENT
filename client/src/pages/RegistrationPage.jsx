import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, User, Hash, Mail, Building, ShieldCheck, AlertCircle, Play, CheckCircle2 } from 'lucide-react';
import { assessmentApi } from '../api';

export default function RegistrationPage({ assessment, onStartTest, onBack }) {
  const [formData, setFormData] = useState({
    fullName: '',
    rollNumber: '',
    email: '',
    organization: ''
  });

  const [verifiedCandidate, setVerifiedCandidate] = useState(null); // Welcome step state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  // Step 1: Verify and show Welcome Confirmation
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

    setLoading(true);
    setError('');

    try {
      const res = await assessmentApi.verifyCandidate({
        fullName: formData.fullName.trim(),
        rollNumber: formData.rollNumber.trim(),
        email: formData.email.trim(),
        organization: formData.organization.trim()
      });
      setVerifiedCandidate(res.data);
    } catch (err) {
      setError(err.message || 'Verification failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Start test session and enter fullscreen
  const handleLaunchTest = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await assessmentApi.startSession({
        assessmentId: assessment.id,
        fullName: formData.fullName.trim(),
        rollNumber: formData.rollNumber.trim(),
        email: formData.email.trim(),
        organization: formData.organization.trim()
      });

      if (res.data.alreadyCompleted) {
        setError(res.data.message || 'You have already completed this assessment.');
        setLoading(false);
        return;
      }

      // Enter fullscreen for restricted test mode
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

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Top Breadcrumb */}
      <button
        onClick={verifiedCandidate ? () => setVerifiedCandidate(null) : onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-6 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{verifiedCandidate ? 'Edit Candidate Details' : 'Back to Instructions'}</span>
      </button>

      {/* Main Form Container */}
      <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md relative overflow-hidden">
        
        {/* Glow Top */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

        {!verifiedCandidate ? (
          <>
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3 text-indigo-400">
                <User className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Student Registration</h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Registering for <span className="text-indigo-300 font-semibold">{assessment.title}</span>
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center gap-3 text-rose-300 text-xs sm:text-sm">
                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
              
              {/* Full Name (Mandatory) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
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
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-500 text-sm outline-none transition"
                  />
                </div>
              </div>

              {/* Roll Number / Student ID (Mandatory) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
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
                    placeholder="e.g. CS2026-088"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-500 text-sm outline-none transition font-mono uppercase"
                  />
                </div>
              </div>

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
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-500 text-sm outline-none transition"
                  />
                </div>
              </div>

              {/* Organization (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  College / Organization <span className="text-slate-500">(Optional)</span>
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    placeholder="e.g. Institute of Engineering"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-500 text-sm outline-none transition"
                  />
                </div>
              </div>

              {/* Submit / Verify Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying Student Identity...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue & Review Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>
          </>
        ) : (
          /* Step 2: Welcome Confirmation Card */
          <div className="text-center py-4 space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/10">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                Identity Confirmed
              </span>
              <h2 className="text-3xl font-extrabold text-white mt-3">
                Welcome, {verifiedCandidate.fullName}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Student ID: <strong className="font-mono text-indigo-300">{verifiedCandidate.rollNumber}</strong>
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center gap-3 text-rose-300 text-xs sm:text-sm text-left">
                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Assessment Confirmation Details */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Target Paper:</span>
                <strong className="text-white text-sm">{assessment.title}</strong>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Total Questions:</span>
                <strong className="text-indigo-300 font-mono">30 Questions (30 Marks)</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Duration:</span>
                <strong className="text-emerald-400 font-mono">{assessment.durationMinutes} Minutes</strong>
              </div>
            </div>

            {/* Launch Assessment Action */}
            <div className="pt-2">
              <button
                onClick={handleLaunchTest}
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/25 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Allocating Server Session & Shuffling Pool...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Start Assessment Now</span>
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
