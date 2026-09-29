import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import InstructionsPage from './pages/InstructionsPage';
import RegistrationPage from './pages/RegistrationPage';
import ExamPortal from './pages/ExamPortal';
import ResultPage from './pages/ResultPage';
import AdminPortal from './pages/AdminPortal';
import LeaderboardPage from './pages/LeaderboardPage';
import { assessmentApi } from './api';

export default function App() {
  const [currentView, setCurrentView] = useState('landing'); // landing, instructions, registration, exam, result, admin, leaderboard
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [leaderboardDefaultSet, setLeaderboardDefaultSet] = useState('set-a');

  // Check if there is an active session in localStorage on page load
  useEffect(() => {
    const savedSessionId = localStorage.getItem('apti_active_session_id');
    if (savedSessionId) {
      assessmentApi.getSessionStatus(savedSessionId)
        .then(res => {
          if (res.data && res.data.status === 'ACTIVE') {
            setSessionData(res.data);
            setCurrentView('exam');
          } else {
            localStorage.removeItem('apti_active_session_id');
          }
        })
        .catch(() => {
          localStorage.removeItem('apti_active_session_id');
        });
    }
  }, []);

  const handleStartRegistration = () => {
    setSelectedAssessment(null);
    setCurrentView('registration');
  };

  const handleProceedToRegistration = () => {
    setCurrentView('registration');
  };

  const handleStartTest = (session) => {
    setSessionData(session);
    setSelectedAssessment({
      id: session.assessmentId,
      title: session.assessmentTitle
    });
    localStorage.setItem('apti_active_session_id', session.sessionId);
    setCurrentView('exam');
  };

  const handleCompleteExam = (result) => {
    localStorage.removeItem('apti_active_session_id');
    setResultData(result);
    setCurrentView('result');
  };

  const handleNavigateLeaderboard = (assessmentId = 'set-a') => {
    setLeaderboardDefaultSet(assessmentId || 'set-a');
    setCurrentView('leaderboard');
  };

  const handleGoHome = () => {
    setSelectedAssessment(null);
    setSessionData(null);
    setCurrentView('landing');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        candidate={sessionData?.candidate || resultData?.candidate}
        assessmentTitle={selectedAssessment?.title || sessionData?.assessmentTitle || resultData?.assessmentTitle}
        onNavigateAdmin={() => setCurrentView('admin')}
        onNavigateLeaderboard={handleNavigateLeaderboard}
        onGoHome={handleGoHome}
      />

      {/* Main Content Router */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onStartRegistration={handleStartRegistration}
            onNavigateAdmin={() => setCurrentView('admin')}
          />
        )}

        {currentView === 'instructions' && (
          <InstructionsPage
            assessment={selectedAssessment}
            onProceed={handleProceedToRegistration}
            onBack={() => setCurrentView('landing')}
          />
        )}

        {currentView === 'registration' && (
          <RegistrationPage
            assessment={selectedAssessment}
            onStartTest={handleStartTest}
            onBack={() => setCurrentView('landing')}
          />
        )}

        {currentView === 'exam' && sessionData && (
          <ExamPortal
            sessionData={sessionData}
            onCompleteExam={handleCompleteExam}
          />
        )}

        {currentView === 'result' && resultData && (
          <ResultPage
            resultData={resultData}
            onGoHome={handleGoHome}
            onNavigateLeaderboard={handleNavigateLeaderboard}
          />
        )}

        {currentView === 'leaderboard' && (
          <LeaderboardPage
            defaultSet={leaderboardDefaultSet}
            onGoHome={handleGoHome}
          />
        )}

        {currentView === 'admin' && (
          <AdminPortal
            onGoHome={handleGoHome}
          />
        )}
      </main>

      {/* Footer (hidden in exam mode) */}
      {currentView !== 'exam' && (
        <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2026 AptiPro Assessment System • Restricted Evaluation Engine</p>
            <div className="flex items-center gap-4 text-slate-400">
              <button onClick={() => handleNavigateLeaderboard('set-a')} className="hover:text-white">
                Set A Leaderboard
              </button>
              <span>•</span>
              <button onClick={() => handleNavigateLeaderboard('set-b')} className="hover:text-white">
                Set B Leaderboard
              </button>
              <span>•</span>
              <button onClick={() => setCurrentView('admin')} className="text-indigo-400 hover:underline">
                Admin Console
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
