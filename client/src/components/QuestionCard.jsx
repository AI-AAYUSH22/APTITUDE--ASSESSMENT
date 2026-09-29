import React from 'react';
import { Bookmark, ChevronLeft, ChevronRight, CheckCircle2, RotateCcw, Send, Layers } from 'lucide-react';
import CodeSnippet from './CodeSnippet';

export default function QuestionCard({
  question,
  selectedOptionKey,
  onSelectOption,
  onClearOption,
  onNext,
  onPrevious,
  onMarkForReview,
  onSubmitPrompt,
  isFirst,
  isLast,
  isSaving
}) {
  if (!question) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-900/50 rounded-2xl border border-slate-800 animate-pulse">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading restricted question from secure server...</p>
        </div>
      </div>
    );
  }

  const {
    questionNumber,
    totalQuestions,
    section,
    questionText,
    codeSnippet,
    marks,
    options,
    difficulty
  } = question;

  return (
    <div className="flex flex-col h-full bg-slate-900/70 border border-slate-800/90 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
      {/* Question Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 font-bold text-sm border border-indigo-500/30">
            Q{questionNumber}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                {section}
              </span>
              <span className="text-xs text-slate-400">
                Question <span className="text-white font-medium">{questionNumber}</span> of {totalQuestions}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            +{marks} Mark
          </span>
          {difficulty && (
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {difficulty}
            </span>
          )}
        </div>
      </div>

      {/* Main Question Body Area */}
      <div className="p-6 md:p-8 flex-1 overflow-y-auto restricted-exam-mode">
        {/* Question Text */}
        <div className="text-slate-100 text-base md:text-lg font-medium leading-relaxed whitespace-pre-wrap select-none mb-6">
          {questionText}
        </div>

        {/* Code Snippet if applicable */}
        {codeSnippet && <CodeSnippet code={codeSnippet} />}

        {/* Options List */}
        <div className="space-y-3 mt-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Select one option:
          </p>
          {options && options.map((option, idx) => {
            const isSelected = selectedOptionKey === option.key;
            return (
              <label
                key={option.key}
                onClick={() => onSelectOption(option.key)}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer select-none group ${
                  isSelected
                    ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                    : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'
                }`}>
                  {option.label}
                </div>

                <div className="flex-1 text-sm md:text-base font-normal pt-0.5 leading-snug">
                  {option.text}
                </div>

                <div className="flex-shrink-0 pt-0.5">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-600 text-white'
                      : 'border-slate-700 bg-slate-950/60'
                  }`}>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Footer Controls & Navigation */}
      <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
        {/* Left Actions (Clear & Mark) */}
        <div className="flex items-center gap-2">
          {selectedOptionKey && (
            <button
              onClick={onClearOption}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all"
              title="Clear chosen option"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear Answer</span>
            </button>
          )}

          <button
            onClick={onMarkForReview}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all"
            title="Mark this question to review later"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span>Mark for Review & Next</span>
          </button>
        </div>

        {/* Right Navigation Actions (Previous, Save & Next, Submit) */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevious}
            disabled={isFirst || isSaving}
            className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl border transition-all ${
              isFirst
                ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {!isLast ? (
            <button
              onClick={onNext}
              disabled={isSaving}
              className="flex items-center gap-1.5 text-xs font-bold px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all"
            >
              <span>Save & Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onSubmitPrompt}
              className="flex items-center gap-1.5 text-xs font-bold px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Assessment</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
