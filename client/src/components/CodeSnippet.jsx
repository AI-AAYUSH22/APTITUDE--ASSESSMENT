import React from 'react';
import { Terminal } from 'lucide-react';

export default function CodeSnippet({ code, language = 'Java' }) {
  if (!code) return null;

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-slate-800 bg-slate-900/90 shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
          </div>
          <span className="text-xs font-mono text-slate-400 font-medium ml-2">{language} Snippet</span>
        </div>
        <Terminal className="w-3.5 h-3.5 text-slate-500" />
      </div>
      <pre className="p-4 text-sm font-mono text-indigo-300 overflow-x-auto leading-relaxed selection:bg-indigo-700 selection:text-white">
        <code>{code}</code>
      </pre>
    </div>
  );
}
