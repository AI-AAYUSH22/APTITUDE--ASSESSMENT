import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export default function TimerDisplay({ initialSeconds, onExpire }) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (onExpire) onExpire();
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onExpire) onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, onExpire]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isUrgent = secondsLeft > 0 && secondsLeft <= 300; // Under 5 mins
  const isCritical = secondsLeft > 0 && secondsLeft <= 60; // Under 1 min

  return (
    <div className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-all duration-300 ${
      isCritical
        ? 'bg-rose-950/60 border-rose-500 text-rose-300 animate-timer-alert'
        : isUrgent
        ? 'bg-amber-950/40 border-amber-500/60 text-amber-300'
        : 'bg-slate-900/90 border-slate-800 text-slate-200 shadow-inner'
    }`}>
      <Clock className={`w-4 h-4 ${isCritical ? 'text-rose-400 animate-pulse' : isUrgent ? 'text-amber-400' : 'text-indigo-400'}`} />
      
      <div className="flex items-center gap-1.5 font-mono text-sm font-bold tracking-wider">
        <span>{String(minutes).padStart(2, '0')}</span>
        <span className="opacity-70 animate-pulse">:</span>
        <span>{String(seconds).padStart(2, '0')}</span>
      </div>

      {isUrgent && (
        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 ml-1">
          Low Time
        </span>
      )}
    </div>
  );
}
