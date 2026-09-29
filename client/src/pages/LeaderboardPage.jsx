import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Search, ArrowLeft, RefreshCw, Users, Clock, Flame } from 'lucide-react';
import { assessmentApi } from '../api';

export default function LeaderboardPage({ onGoHome, defaultSet = 'set-a' }) {
  const [activeSet, setActiveSet] = useState(defaultSet); // 'set-a' or 'set-b'
  const [leaderboardData, setLeaderboardData] = useState({ leaderboard: [], totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadLeaderboard(activeSet, page);
  }, [activeSet, page]);

  const loadLeaderboard = async (assessmentId, currentPage) => {
    setLoading(true);
    try {
      const res = await assessmentApi.getLeaderboard({
        assessmentId,
        page: currentPage,
        limit: 50
      });
      setLeaderboardData(res.data);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredList = (leaderboardData.leaderboard || []).filter(item =>
    !search || item.studentName.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Top Breadcrumb */}
      <button
        onClick={onGoHome}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-6 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Assessments</span>
      </button>

      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden mb-8 text-center">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-indigo-500" />
        
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 text-amber-400 shadow-lg shadow-amber-500/10">
          <Trophy className="w-8 h-8" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
          Official Aptitude Assessment — Leaderboard
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Live centralized rankings verified directly by the evaluation engine with automated tie-breaker logic.
        </p>

        {/* Set A vs Set B Toggle Tabs */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => { setActiveSet('set-a'); setPage(1); }}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md ${
              activeSet === 'set-a'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white ring-2 ring-indigo-500/40'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Assessment 1 (Set A) Leaderboard
          </button>

          <button
            onClick={() => { setActiveSet('set-b'); setPage(1); }}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md ${
              activeSet === 'set-b'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white ring-2 ring-purple-500/40'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Assessment 2 (Set B) Leaderboard
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 mb-6">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search candidate name on leaderboard..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Total Participants: <strong className="text-white">{leaderboardData.totalCount}</strong></span>
          </div>
          <button
            onClick={() => loadLeaderboard(activeSet, page)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Leaderboard Table Container */}
      <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Loading verified leaderboard rankings...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
            <p>No candidate records found for {activeSet === 'set-a' ? 'Set A' : 'Set B'}.</p>
            <p className="text-xs text-slate-500 mt-1">Be the first student to attempt and rank on this leaderboard!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[11px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6 text-center w-24">Rank</th>
                  <th className="py-4 px-6">Student Name</th>
                  <th className="py-4 px-6 text-center">Score</th>
                  <th className="py-4 px-6 text-center">Percentage</th>
                  <th className="py-4 px-6 text-right">Time Taken</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredList.map((row) => {
                  const isTop1 = row.rank === 1;
                  const isTop2 = row.rank === 2;
                  const isTop3 = row.rank === 3;

                  return (
                    <tr
                      key={row.resultId}
                      className={`hover:bg-slate-850/50 transition-colors ${
                        isTop1 ? 'bg-amber-500/5' : isTop2 ? 'bg-slate-300/5' : isTop3 ? 'bg-amber-700/5' : ''
                      }`}
                    >
                      {/* Rank Badge */}
                      <td className="py-4 px-6 text-center">
                        {isTop1 ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-sm shadow-sm">
                            🥇 1
                          </span>
                        ) : isTop2 ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-300/20 text-slate-200 border border-slate-300/40 font-bold text-sm shadow-sm">
                            🥈 2
                          </span>
                        ) : isTop3 ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-700/20 text-amber-400 border border-amber-700/40 font-bold text-sm shadow-sm">
                            🥉 3
                          </span>
                        ) : (
                          <span className="font-mono text-slate-400 text-xs">
                            #{row.rank}
                          </span>
                        )}
                      </td>

                      {/* Student Name */}
                      <td className="py-4 px-6">
                        <span className={`font-semibold ${isTop1 ? 'text-amber-200' : 'text-white'}`}>
                          {row.studentName}
                        </span>
                      </td>

                      {/* Score */}
                      <td className="py-4 px-6 text-center">
                        <span className="font-mono font-bold text-white bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                          {row.score} / {row.maxScore}
                        </span>
                      </td>

                      {/* Percentage */}
                      <td className="py-4 px-6 text-center">
                        <span className="font-mono font-bold text-emerald-400">
                          {row.percentage}%
                        </span>
                      </td>

                      {/* Time Taken */}
                      <td className="py-4 px-6 text-right font-mono text-xs text-slate-400">
                        {formatTime(row.timeTakenSeconds)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
