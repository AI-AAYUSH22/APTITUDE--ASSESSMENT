import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Award, CheckCircle2, XCircle, HelpCircle, Clock, AlertTriangle, Printer, RotateCcw, Eye, ShieldCheck, User, Building, Hash, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { assessmentApi } from '../api';
import CodeSnippet from '../components/CodeSnippet';

export default function ResultPage({ resultData, onGoHome, onNavigateLeaderboard }) {
  const [reviewData, setReviewData] = useState(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const {
    candidate,
    studentName,
    assessmentTitle,
    assessmentId,
    totalQuestions,
    attemptedCount,
    correctCount,
    incorrectCount,
    unansweredCount,
    score,
    maxScore,
    percentage,
    passed,
    timeTakenSeconds,
    violationCount,
    sectionBreakdown,
    allowReview,
    resultId,
    rank,
    totalInAssessment
  } = resultData;

  const displayName = studentName || candidate?.name || 'Student';

  useEffect(() => {
    if (passed) {
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  }, [passed]);

  const handleLoadReview = async () => {
    if (reviewData) {
      setShowReview(!showReview);
      return;
    }
    setLoadingReview(true);
    setReviewError('');
    try {
      const res = await assessmentApi.getReview(resultId);
      setReviewData(res.data);
      setShowReview(true);
    } catch (err) {
      setReviewError(err.message || 'Answer key review is restricted for this assessment.');
    } finally {
      setLoadingReview(false);
    }
  };

  const minutesTaken = Math.floor(timeTakenSeconds / 60);
  const secondsTaken = timeTakenSeconds % 60;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-4 mb-6 print:hidden">
        <button
          onClick={onGoHome}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Return to Assessments</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateLeaderboard(assessmentId)}
            className="inline-flex items-center gap-2 text-xs font-bold text-amber-300 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition shadow-sm"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>View Leaderboard</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 text-xs font-bold text-white px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 shadow transition"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-400" />
            <span>Print Scorecard</span>
          </button>
        </div>
      </div>

      {/* Main Scorecard Container */}
      <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md relative overflow-hidden mb-8">
        
        {/* Top Decorative Strip */}
        <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${
          passed ? 'from-emerald-500 via-teal-500 to-indigo-500' : 'from-amber-500 via-rose-500 to-red-500'
        }`} />

        {/* Candidate Profile Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 mb-2 inline-block">
              Assessment Completed
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Congratulations, {displayName}!
            </h1>
            <p className="text-xs text-slate-400 mt-1">{assessmentTitle}</p>
          </div>

          <div className="flex items-center gap-4 bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              <User className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">{displayName}</p>
              <p className="text-xs text-slate-400">{candidate?.email || 'Registered Candidate'}</p>
              <p className="text-xs text-indigo-300 font-mono mt-0.5">{candidate?.organization ? `${candidate.organization} • ` : ''}{candidate?.rollNumber}</p>
            </div>
          </div>
        </div>

        {/* Big Score / Leaderboard Rank Banner */}
        <div className={`p-6 sm:p-8 rounded-3xl mb-8 border flex flex-wrap items-center justify-between gap-6 ${
          passed
            ? 'bg-emerald-950/40 border-emerald-500/40'
            : 'bg-rose-950/30 border-rose-500/30'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
              passed ? 'bg-emerald-600 text-white shadow-emerald-600/30' : 'bg-rose-600 text-white shadow-rose-600/30'
            }`}>
              {passed ? <Award className="w-9 h-9" /> : <AlertTriangle className="w-9 h-9" />}
            </div>
            <div>
              <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {passed ? 'Assessment Passed' : 'Needs Improvement'}
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mt-1">
                Score: {score} / {maxScore} <span className="text-xl font-normal text-slate-400 font-mono">({percentage}%)</span>
              </h2>
            </div>
          </div>

          {/* Dynamic Rank & Timing */}
          <div className="flex items-center gap-6">
            {rank !== undefined && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
                <div className="flex items-center justify-center gap-1 text-amber-400 mb-0.5">
                  <Trophy className="w-4 h-4" />
                  <span className="text-[11px] font-bold uppercase">Current Rank</span>
                </div>
                <p className="text-2xl font-black text-amber-300 font-mono">
                  #{rank} <span className="text-xs font-normal text-slate-400">/ {totalInAssessment || 1}</span>
                </p>
              </div>
            )}

            <div className="text-right">
              <p className="text-xs text-slate-400">Time Taken</p>
              <p className="text-lg font-bold font-mono text-indigo-300">
                {minutesTaken}m {secondsTaken}s
              </p>
              {violationCount > 0 && (
                <p className="text-[11px] text-rose-400 font-mono mt-1">
                  Violations: {violationCount}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
            <p className="text-xs text-slate-400">Correct Answers</p>
            <p className="text-2xl font-black text-emerald-400">{correctCount}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
            <XCircle className="w-5 h-5 text-rose-400 mx-auto mb-1.5" />
            <p className="text-xs text-slate-400">Incorrect Answers</p>
            <p className="text-2xl font-black text-rose-400">{incorrectCount}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
            <HelpCircle className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
            <p className="text-xs text-slate-400">Unanswered</p>
            <p className="text-2xl font-black text-amber-300">{unansweredCount}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
            <Award className="w-5 h-5 text-indigo-400 mx-auto mb-1.5" />
            <p className="text-xs text-slate-400">Total Attempted</p>
            <p className="text-2xl font-black text-white">{attemptedCount} <span className="text-xs text-slate-500 font-normal">/ {totalQuestions}</span></p>
          </div>
        </div>

        {/* Section-Wise Breakdown */}
        <div className="mb-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Section-Wise Performance Breakdown</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {sectionBreakdown && sectionBreakdown.map((sec, idx) => {
              const secPercentage = sec.maxScore > 0 ? ((sec.score / sec.maxScore) * 100).toFixed(0) : 0;
              return (
                <div key={idx} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h4 className="text-sm font-bold text-white">{sec.section}</h4>
                      <span className="text-xs font-mono font-bold text-indigo-300">{sec.score}/{sec.maxScore}</span>
                    </div>

                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                        style={{ width: `${secPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 text-center text-[11px] pt-2 border-t border-slate-800/80">
                    <div>
                      <span className="text-emerald-400 font-bold">{sec.correct}</span>
                      <p className="text-slate-500">Correct</p>
                    </div>
                    <div>
                      <span className="text-rose-400 font-bold">{sec.incorrect}</span>
                      <p className="text-slate-500">Wrong</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold">{sec.unanswered}</span>
                      <p className="text-slate-500">Skipped</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Answer Review Button (If Allowed) */}
        {allowReview && (
          <div className="pt-4 border-t border-slate-800 print:hidden">
            <button
              onClick={handleLoadReview}
              disabled={loadingReview}
              className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition"
            >
              <Eye className="w-4 h-4 text-indigo-400" />
              <span>{showReview ? 'Hide Solutions Review' : 'View Question-by-Question Solutions & Explanations'}</span>
              {showReview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        )}

      </div>

      {/* Detailed Question Review List */}
      {showReview && reviewData && (
        <div className="space-y-4 animate-fade-in print:block">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-white">Comprehensive Question Review & Explanations</h3>
            <span className="text-xs text-slate-400">{reviewData.questions?.length} Questions</span>
          </div>

          {reviewData.questions.map((q) => {
            return (
              <div
                key={q.questionNumber}
                className={`p-6 rounded-2xl border bg-slate-900/90 shadow-md ${
                  q.isCorrect ? 'border-emerald-600/40' : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">
                      Q{q.questionNumber}
                    </span>
                    <span className="text-xs text-slate-400">{q.section}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {q.isCorrect ? (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Correct (+{q.marks})
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Incorrect
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm font-medium text-white mb-3 leading-relaxed whitespace-pre-wrap">
                  {q.questionText}
                </p>

                {q.codeSnippet && <CodeSnippet code={q.codeSnippet} />}

                <div className="space-y-2 mb-4">
                  {q.options.map((opt) => {
                    let optStyle = 'border-slate-800 bg-slate-950/40 text-slate-300';
                    if (opt.isCorrect) {
                      optStyle = 'border-emerald-500/60 bg-emerald-950/30 text-emerald-200 font-semibold';
                    } else if (opt.isSelected && !opt.isCorrect) {
                      optStyle = 'border-rose-500/60 bg-rose-950/30 text-rose-200 line-through';
                    }

                    return (
                      <div key={opt.key} className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${optStyle}`}>
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded flex items-center justify-center font-bold bg-slate-800 text-slate-300 text-[10px]">
                            {opt.label}
                          </span>
                          <span>{opt.text}</span>
                        </div>

                        {opt.isCorrect && (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Correct Answer
                          </span>
                        )}
                        {opt.isSelected && !opt.isCorrect && (
                          <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Your Choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200">
                    <strong className="text-indigo-300 block mb-0.5">Explanation:</strong>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
