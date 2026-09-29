import React, { useEffect, useState, useCallback, useRef } from 'react';
import TimerDisplay from '../components/TimerDisplay';
import QuestionCard from '../components/QuestionCard';
import QuestionPalette from '../components/QuestionPalette';
import SubmitConfirmModal from '../components/SubmitConfirmModal';
import ViolationModal from '../components/ViolationModal';
import SyncStatusBadge from '../components/SyncStatusBadge';
import { assessmentApi } from '../api';
import { Maximize2, ShieldAlert, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function ExamPortal({ sessionData, onCompleteExam }) {
  const { sessionId, sessionToken } = sessionData;
  const [currentQNum, setCurrentQNum] = useState(sessionData.currentQuestionIndex || 1);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedOptionKey, setSelectedOptionKey] = useState(null);
  const [palette, setPalette] = useState([]);
  const [remainingSeconds, setRemainingSeconds] = useState(sessionData.remainingSeconds || 1800);
  const [loadingQuestion, setLoadingQuestion] = useState(true);

  // Sync state & Offline Retry Queue
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced', 'syncing', 'offline'
  const [pendingSyncQueue, setPendingSyncQueue] = useState([]);
  const [localAnswersMap, setLocalAnswersMap] = useState(sessionData.answersMap || {});

  // Modals state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [violationModal, setViolationModal] = useState({
    isOpen: false,
    count: sessionData.violationCount || 0,
    maxViolations: sessionData.maxViolations || 3,
    message: ''
  });

  const questionStartTimeRef = useRef(Date.now());
  const isSubmittingRef = useRef(false);
  const syncQueueRef = useRef([]);

  // Keep ref updated
  useEffect(() => {
    syncQueueRef.current = pendingSyncQueue;
  }, [pendingSyncQueue]);

  // Fetch current question securely from server
  const loadQuestion = useCallback(async (qNum) => {
    setLoadingQuestion(true);
    try {
      const res = await assessmentApi.getQuestion(sessionId, qNum);
      setCurrentQuestion(res.data);
      
      // Check local answers map first (immediate UI), fallback to server
      const localAns = localAnswersMap[qNum];
      if (localAns) {
        setSelectedOptionKey(localAns.selectedOptionKey);
      } else {
        setSelectedOptionKey(res.data.currentSelectedOptionKey || null);
      }

      if (res.data.remainingSeconds !== undefined) {
        setRemainingSeconds(res.data.remainingSeconds);
      }
      questionStartTimeRef.current = Date.now();
    } catch (err) {
      console.error('Error loading question:', err);
      if (err.message.includes('expired')) {
        handleFinalSubmit(true);
      }
    } finally {
      setLoadingQuestion(false);
    }
  }, [sessionId, localAnswersMap]);

  // Fetch palette metadata
  const loadPalette = useCallback(async () => {
    try {
      const res = await assessmentApi.getPalette(sessionId);
      setPalette(res.data.palette || []);
      if (res.data.remainingSeconds !== undefined) {
        setRemainingSeconds(res.data.remainingSeconds);
      }
    } catch (err) {
      console.error('Error loading palette:', err);
    }
  }, [sessionId]);

  // Initial load
  useEffect(() => {
    loadQuestion(currentQNum);
    loadPalette();
  }, [currentQNum, loadQuestion, loadPalette]);

  // Background Sync Worker: Process offline / pending answer queue
  useEffect(() => {
    const processSyncQueue = async () => {
      if (syncQueueRef.current.length === 0 || isSubmittingRef.current) return;
      
      setSyncStatus('syncing');
      const item = syncQueueRef.current[0];

      try {
        await assessmentApi.saveAnswer(sessionId, item);
        // Remove processed item
        setPendingSyncQueue(prev => prev.slice(1));
        setSyncStatus(syncQueueRef.current.length <= 1 ? 'synced' : 'syncing');
        loadPalette();
      } catch (err) {
        console.warn('Sync attempt failed, will retry:', err.message);
        setSyncStatus('offline');
      }
    };

    const interval = setInterval(processSyncQueue, 3000);
    return () => clearInterval(interval);
  }, [sessionId, loadPalette]);

  // Save / Queue answer
  const saveCurrentAnswer = async (targetOptionKey = selectedOptionKey, statusOverride = null) => {
    if (!sessionId || isSubmittingRef.current) return;
    
    let status = statusOverride;
    if (!status) {
      status = targetOptionKey ? 'ANSWERED' : 'NOT_ANSWERED';
    }

    const payload = {
      questionNumber: currentQNum,
      selectedOptionKey: targetOptionKey,
      status,
      timeSpentSeconds: Math.max(1, Math.floor((Date.now() - questionStartTimeRef.current) / 1000))
    };

    // 1. Instant local update
    setLocalAnswersMap(prev => ({
      ...prev,
      [currentQNum]: { selectedOptionKey: targetOptionKey, status }
    }));

    // 2. Direct API call with fallback to Queue
    setSyncStatus('syncing');
    try {
      await assessmentApi.saveAnswer(sessionId, payload);
      setSyncStatus('synced');
      loadPalette();
    } catch (err) {
      console.warn('Network error saving answer. Adding to offline queue:', err.message);
      setSyncStatus('offline');
      setPendingSyncQueue(prev => [...prev.filter(i => i.questionNumber !== currentQNum), payload]);
    }
  };

  // Option selection handler
  const handleSelectOption = (key) => {
    setSelectedOptionKey(key);
    saveCurrentAnswer(key, 'ANSWERED');
  };

  // Clear answer handler
  const handleClearOption = () => {
    setSelectedOptionKey(null);
    saveCurrentAnswer(null, 'CLEAR');
  };

  // Mark for review & next
  const handleMarkForReview = async () => {
    await saveCurrentAnswer(selectedOptionKey, 'MARKED_FOR_REVIEW');
    if (currentQNum < (palette.length || 30)) {
      setCurrentQNum(prev => prev + 1);
    }
  };

  // Save & Next
  const handleNext = async () => {
    await saveCurrentAnswer(selectedOptionKey);
    if (currentQNum < (palette.length || 30)) {
      setCurrentQNum(prev => prev + 1);
    }
  };

  // Previous
  const handlePrevious = async () => {
    await saveCurrentAnswer(selectedOptionKey);
    if (currentQNum > 1) {
      setCurrentQNum(prev => prev - 1);
    }
  };

  // Jump from palette
  const handleSelectFromPalette = async (qNum) => {
    if (qNum === currentQNum) return;
    await saveCurrentAnswer(selectedOptionKey);
    setCurrentQNum(qNum);
  };

  // Final submit
  const handleFinalSubmit = async (isAutoSubmit = false) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }

      const res = await assessmentApi.submitSession(sessionId, isAutoSubmit);
      onCompleteExam(res.data);
    } catch (err) {
      console.error('Submission failed:', err);
      try {
        const res = await assessmentApi.getResult(sessionId);
        onCompleteExam(res.data);
      } catch (e2) {
        alert('Assessment submitted. Loading results...');
      }
    } finally {
      setIsSubmitting(false);
      setIsSubmitModalOpen(false);
    }
  };

  // Anti-cheating violation logger
  const triggerViolation = useCallback(async (reason) => {
    if (isSubmittingRef.current) return;
    try {
      const res = await assessmentApi.logViolation(sessionId, {
        type: 'WINDOW_FOCUS_CHANGE',
        details: reason
      });

      const { violationCount, maxViolations, autoLocked, warningMessage } = res.data;

      setViolationModal({
        isOpen: true,
        count: violationCount,
        maxViolations: maxViolations || 3,
        message: warningMessage || `Warning ${violationCount}/${maxViolations}: Screen switching is monitored.`
      });

      if (autoLocked) {
        setTimeout(() => {
          handleFinalSubmit(true);
        }, 2000);
      }
    } catch (err) {
      console.error('Error logging violation:', err);
    }
  }, [sessionId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation('Page hidden / Candidate switched tabs or minimized window.');
      }
    };

    const handleWindowBlur = () => {
      triggerViolation('Window lost focus / Candidate clicked outside test environment.');
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    const handleCopyPaste = (e) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e) => {
      if (
        e.keyCode === 123 || // F12
        (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) ||
        (e.ctrlKey && ['u', 'U', 'c', 'C', 'v', 'V', 'x', 'X', 's', 'S'].includes(e.key))
      ) {
        e.preventDefault();
        return false;
      }

      // Keyboard shortcuts: 1-4
      if (['1', '2', '3', '4'].includes(e.key) && currentQuestion?.options) {
        const idx = parseInt(e.key, 10) - 1;
        if (currentQuestion.options[idx]) {
          handleSelectOption(currentQuestion.options[idx].key);
        }
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !isSubmittingRef.current) {
        triggerViolation('Candidate exited Fullscreen Mode / attempted browser switch.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('dragstart', handleCopyPaste);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('dragstart', handleCopyPaste);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [triggerViolation, currentQuestion]);

  const requestFullscreen = () => {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col restricted-exam-mode">
      
      {/* Exam Header Bar */}
      <div className="sticky top-0 z-30 bg-slate-900/90 border-b border-slate-800 backdrop-blur-xl px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Test Name & Candidate info */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">
                {sessionData.assessmentTitle}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>Student: <strong className="text-slate-300">{sessionData.candidate?.name}</strong></span>
                <span>•</span>
                <span className="font-mono text-indigo-300">{sessionData.candidate?.rollNumber}</span>
              </div>
            </div>
          </div>

          {/* Sync Status Badge, Violations & Timer */}
          <div className="flex items-center gap-3">
            <SyncStatusBadge
              status={syncStatus}
              pendingCount={pendingSyncQueue.length}
            />

            {violationModal.count > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Violations: {violationModal.count}/{sessionData.maxViolations || 3}</span>
              </div>
            )}

            <TimerDisplay
              initialSeconds={remainingSeconds}
              onExpire={() => handleFinalSubmit(true)}
            />

            <button
              onClick={requestFullscreen}
              className="hidden md:flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Enter Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Fullscreen</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Exam Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left / Center: Question Area (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-[calc(100vh-140px)] min-h-[550px]">
          <QuestionCard
            question={currentQuestion}
            selectedOptionKey={selectedOptionKey}
            onSelectOption={handleSelectOption}
            onClearOption={handleClearOption}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onMarkForReview={handleMarkForReview}
            onSubmitPrompt={() => setIsSubmitModalOpen(true)}
            isFirst={currentQNum === 1}
            isLast={currentQNum === (palette.length || 30)}
            isSaving={syncStatus === 'syncing'}
          />
        </div>

        {/* Right: Question Navigation Palette (4 cols) */}
        <div className="lg:col-span-4 flex flex-col h-[calc(100vh-140px)] min-h-[550px]">
          <QuestionPalette
            palette={palette}
            currentQuestionNumber={currentQNum}
            onSelectQuestion={handleSelectFromPalette}
            onSubmitPrompt={() => setIsSubmitModalOpen(true)}
          />
        </div>

      </main>

      {/* Submit Confirmation Modal */}
      <SubmitConfirmModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirm={() => handleFinalSubmit(false)}
        palette={palette}
        remainingSeconds={remainingSeconds}
        isSubmitting={isSubmitting}
      />

      {/* Anti-Cheating Alert Modal */}
      <ViolationModal
        isOpen={violationModal.isOpen}
        onDismiss={() => setViolationModal({ ...violationModal, isOpen: false })}
        violationCount={violationModal.count}
        violationReason={violationModal.message}
      />

    </div>
  );
}
