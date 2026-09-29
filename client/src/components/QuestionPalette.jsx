import React, { useState } from 'react';
import { Layers, Send, CheckCircle2, Bookmark, Circle, HelpCircle } from 'lucide-react';

export default function QuestionPalette({
  palette = [],
  currentQuestionNumber,
  onSelectQuestion,
  onSubmitPrompt
}) {
  const [activeSectionFilter, setActiveSectionFilter] = useState('ALL');

  // Extract unique sections
  const sections = ['ALL', ...Array.from(new Set(palette.map(p => p.section).filter(Boolean)))];

  // Filter questions by section
  const filteredPalette = activeSectionFilter === 'ALL'
    ? palette
    : palette.filter(p => p.section === activeSectionFilter);

  // Compute status counts
  const answeredCount = palette.filter(p => p.status === 'ANSWERED').length;
  const markedCount = palette.filter(p => p.status === 'MARKED_FOR_REVIEW').length;
  const markedAndAnsweredCount = palette.filter(p => p.status === 'MARKED_AND_ANSWERED').length;
  const notAnsweredCount = palette.filter(p => p.status === 'NOT_ANSWERED').length;
  const notVisitedCount = palette.filter(p => p.status === 'NOT_VISITED').length;

  const getStatusStyle = (item, isCurrent) => {
    let base = 'font-bold text-xs rounded-xl flex items-center justify-center transition-all shadow-sm';
    
    if (isCurrent) {
      base += ' ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-105';
    }

    switch (item.status) {
      case 'ANSWERED':
        return `${base} bg-emerald-600 hover:bg-emerald-500 text-white`;
      case 'MARKED_FOR_REVIEW':
        return `${base} bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold`;
      case 'MARKED_AND_ANSWERED':
        return `${base} bg-purple-600 hover:bg-purple-500 text-white`;
      case 'NOT_ANSWERED':
        return `${base} bg-rose-600/80 hover:bg-rose-500 text-white`;
      case 'NOT_VISITED':
      default:
        return `${base} bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/60`;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/80 border border-slate-800/90 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden">
      {/* Palette Header */}
      <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-sm text-slate-200">Question Palette</h3>
          </div>
          <span className="text-xs font-mono text-indigo-300 bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 rounded">
            {answeredCount + markedAndAnsweredCount}/{palette.length} Done
          </span>
        </div>

        {/* Section Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
          {sections.map(sec => (
            <button
              key={sec}
              onClick={() => setActiveSectionFilter(sec)}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeSectionFilter === sec
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {sec === 'ALL' ? 'All Questions' : sec.length > 15 ? sec.slice(0, 14) + '...' : sec}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Question Bubbles */}
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="grid grid-cols-5 gap-2.5">
          {filteredPalette.map((item) => {
            const isCurrent = item.questionNumber === currentQuestionNumber;
            return (
              <button
                key={item.questionNumber}
                onClick={() => onSelectQuestion(item.questionNumber)}
                className={`h-10 w-full ${getStatusStyle(item, isCurrent)}`}
                title={`Question ${item.questionNumber} (${item.status.replace(/_/g, ' ')})`}
              >
                {item.questionNumber}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Legend */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-2 text-xs">
        <p className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider mb-2">Status Legend</p>
        
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-emerald-600 flex-shrink-0" />
            <span className="text-slate-300">Answered ({answeredCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-rose-600/80 flex-shrink-0" />
            <span className="text-slate-300">Not Answered ({notAnsweredCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-amber-500 flex-shrink-0" />
            <span className="text-slate-300">Marked Review ({markedCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-purple-600 flex-shrink-0" />
            <span className="text-slate-300">Ans & Marked ({markedAndAnsweredCount})</span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700 flex-shrink-0" />
            <span className="text-slate-400">Not Visited ({notVisitedCount})</span>
          </div>
        </div>

        {/* Big Submit Button */}
        <div className="pt-3">
          <button
            onClick={onSubmitPrompt}
            className="w-full flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Full Test</span>
          </button>
        </div>
      </div>
    </div>
  );
}
