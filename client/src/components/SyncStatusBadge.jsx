import React from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SyncStatusBadge({ status, pendingCount = 0, lastSyncedAt }) {
  // status: 'synced', 'syncing', 'offline', 'error'
  if (status === 'syncing') {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold animate-pulse">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
        <span>Saving Answer...</span>
      </div>
    );
  }

  if (status === 'offline' || status === 'error' || pendingCount > 0) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-bold animate-pulse">
        <CloudOff className="w-3.5 h-3.5 text-rose-400" />
        <span>Connection Issue • {pendingCount} Pending Retry</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-sm">
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
      <span>All Answers Synced</span>
    </div>
  );
}
