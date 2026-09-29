import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, LayoutDashboard, BookOpen, HelpCircle, Users, Download, Plus, 
  Trash2, Edit3, Save, X, CheckCircle2, AlertTriangle, Search, Filter, Lock,
  FileSpreadsheet, ArrowLeft, RefreshCw, Upload, Eye, XCircle, Clock
} from 'lucide-react';
import { assessmentApi } from '../api';
import CodeSnippet from '../components/CodeSnippet';

export default function AdminPortal({ onGoHome }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview, assessments, questions, results, import

  // Data states
  const [stats, setStats] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('set-a');
  const [selectedSection, setSelectedSection] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isNewQuestionModalOpen, setIsNewQuestionModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importTargetAssessment, setImportTargetAssessment] = useState('set-a');
  const [importSuccessMsg, setImportSuccessMsg] = useState('');

  // Student Response Viewer Modal State
  const [selectedStudentResponse, setSelectedStudentResponse] = useState(null);
  const [loadingStudentResponse, setLoadingStudentResponse] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('apti_admin_token');
    if (token) {
      setIsAuthenticated(true);
      loadAllAdminData();
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await assessmentApi.adminLogin({ username, password });
      localStorage.setItem('apti_admin_token', res.data.token);
      setIsAuthenticated(true);
      loadAllAdminData();
    } catch (err) {
      const msg = typeof err === 'string' ? err : (err.message || err.error || 'Invalid admin credentials');
      setLoginError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('apti_admin_token');
    setIsAuthenticated(false);
  };

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, assessRes, resultsRes] = await Promise.all([
        assessmentApi.getAdminStats(),
        assessmentApi.getAdminAssessments(),
        assessmentApi.getAdminResults()
      ]);
      setStats(statsRes.data);
      setAssessments(assessRes.data);
      setResults(resultsRes.data);
      loadQuestions(selectedAssessmentId, selectedSection);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async (assessmentId, section) => {
    try {
      const params = {};
      if (assessmentId) params.assessmentId = assessmentId;
      if (section) params.section = section;
      const res = await assessmentApi.getAdminQuestions(params);
      setQuestions(res.data);
    } catch (err) {
      console.error('Error loading questions:', err);
    }
  };

  const handleViewStudentResponses = async (resultId) => {
    setLoadingStudentResponse(true);
    try {
      const res = await assessmentApi.getStudentResponses(resultId);
      setSelectedStudentResponse(res.data);
    } catch (err) {
      alert('Failed to load student responses: ' + err.message);
    } finally {
      setLoadingStudentResponse(false);
    }
  };

  const handleUpdateAssessment = async (id, payload) => {
    try {
      await assessmentApi.updateAssessment(id, payload);
      loadAllAdminData();
      setEditingAssessment(null);
    } catch (err) {
      alert(err.message || 'Failed to update assessment');
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await assessmentApi.deleteQuestion(id);
      loadQuestions(selectedAssessmentId, selectedSection);
    } catch (err) {
      alert(err.message || 'Failed to delete question');
    }
  };

  const handleSaveQuestion = async (questionData) => {
    try {
      if (questionData.id && !questionData.isNew) {
        await assessmentApi.updateQuestion(questionData.id, questionData);
      } else {
        await assessmentApi.createQuestion(questionData);
      }
      setEditingQuestion(null);
      setIsNewQuestionModalOpen(false);
      loadQuestions(selectedAssessmentId, selectedSection);
    } catch (err) {
      alert(err.message || 'Failed to save question');
    }
  };

  const handleImportQuestions = async () => {
    try {
      const parsed = JSON.parse(importJsonText);
      if (!Array.isArray(parsed)) throw new Error('JSON content must be an array of questions');
      const res = await assessmentApi.importQuestions({
        assessmentId: importTargetAssessment,
        questions: parsed
      });
      setImportSuccessMsg(`Successfully imported ${res.importedCount} questions into ${importTargetAssessment}!`);
      setImportJsonText('');
      loadAllAdminData();
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
  };

  // If not logged in, show Login Box
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
          
          <button
            onClick={onGoHome}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Portal</span>
          </button>

          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3 text-indigo-400">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white">Administrator Login</h2>
            <p className="text-xs text-slate-400 mt-1">Access question bank, candidate records, & configs</p>
          </div>

          {loginError && (
            <div className="p-3 mb-4 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-sm outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition"
            >
              Sign In to Admin Console
            </button>
          </form>

          <p className="text-center text-[11px] text-slate-500 mt-4">
            Authorized administrator credentials required
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Admin Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Administrator Command Center</h1>
            <p className="text-xs text-slate-400">Managing Set A & Set B Assessment Pools and Live Records</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onGoHome}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
          >
            Candidate Portal
          </button>
          <button
            onClick={handleLogout}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 transition"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-800/80">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('assessments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'assessments'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Assessments Manager</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('questions');
            loadQuestions(selectedAssessmentId, selectedSection);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'questions'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Question Bank ({questions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('results')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'results'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Candidate Results ({results.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('import')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'import'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Import Questions</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & OVERALL STATISTICS */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Overall Metrics Cards */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Overall Assessment Statistics</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <p className="text-xs text-slate-400 mb-1">Total Registered Students</p>
                <p className="text-3xl font-extrabold text-white">{stats.totalRegisteredStudents}</p>
                <p className="text-[11px] text-indigo-400 mt-1">Enrolled candidates</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <p className="text-xs text-slate-400 mb-1">Completed Assessments</p>
                <p className="text-3xl font-extrabold text-emerald-400">{stats.totalCompletedAssessments}</p>
                <p className="text-[11px] text-slate-400 mt-1">Evaluated on server</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <p className="text-xs text-slate-400 mb-1">Active / Incomplete Sessions</p>
                <p className="text-3xl font-extrabold text-amber-400">{stats.totalActiveSessions}</p>
                <p className="text-[11px] text-slate-400 mt-1">In progress: {stats.totalActiveSessions}</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <p className="text-xs text-slate-400 mb-1">Average Score & Percentage</p>
                <p className="text-3xl font-extrabold text-indigo-300">{stats.avgScore} <span className="text-sm font-normal text-slate-400">/ 30</span></p>
                <p className="text-[11px] text-slate-400 mt-1">Avg: {stats.avgPercentage}% (Pass: {stats.passRate}%)</p>
              </div>
            </div>
          </div>

          {/* Highest & Lowest Score Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-400 font-semibold uppercase">Highest Overall Score</span>
                <p className="text-2xl font-black text-white">{stats.highestScore} / 30</p>
              </div>
              <span className="text-3xl">🏆</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase">Lowest Overall Score</span>
                <p className="text-2xl font-black text-slate-300">{stats.lowestScore} / 30</p>
              </div>
              <span className="text-3xl">📊</span>
            </div>
          </div>

          {/* Set A vs Set B Side-by-Side Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Set A Stats Card */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-indigo-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-lg text-white">Assessment 1 (Set A) Statistics</h3>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  SET-A
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Total Attempts:</span>
                  <p className="text-xl font-bold text-white mt-0.5">{stats.setA?.totalAttempts || 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Average Score:</span>
                  <p className="text-xl font-bold text-indigo-300 mt-0.5">{stats.setA?.avgScore || 0} / 30</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Highest Score:</span>
                  <p className="text-xl font-bold text-emerald-400 mt-0.5">{stats.setA?.highestScore || 0} / 30</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Lowest Score:</span>
                  <p className="text-xl font-bold text-rose-400 mt-0.5">{stats.setA?.lowestScore || 0} / 30</p>
                </div>
              </div>
            </div>

            {/* Set B Stats Card */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-purple-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-lg text-white">Assessment 2 (Set B) Statistics</h3>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  SET-B
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Total Attempts:</span>
                  <p className="text-xl font-bold text-white mt-0.5">{stats.setB?.totalAttempts || 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Average Score:</span>
                  <p className="text-xl font-bold text-purple-300 mt-0.5">{stats.setB?.avgScore || 0} / 30</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Highest Score:</span>
                  <p className="text-xl font-bold text-emerald-400 mt-0.5">{stats.setB?.highestScore || 0} / 30</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Lowest Score:</span>
                  <p className="text-xl font-bold text-rose-400 mt-0.5">{stats.setB?.lowestScore || 0} / 30</p>
                </div>
              </div>
            </div>

          </div>

          {/* Recent Submissions Table */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <h3 className="font-bold text-base text-white mb-4">Recent Candidate Submissions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Candidate</th>
                    <th className="p-3">Roll Number</th>
                    <th className="p-3">Assessment</th>
                    <th className="p-3">Score & %</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stats.recentResults?.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-850/50">
                      <td className="p-3 font-semibold text-white">{r.studentName}</td>
                      <td className="p-3 font-mono text-indigo-300">{r.rollNumber}</td>
                      <td className="p-3 text-slate-300">{r.assessmentTitle}</td>
                      <td className="p-3 font-mono font-bold text-white">{r.score}/{r.maxScore} ({r.percentage}%)</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.passed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}>
                          {r.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleViewStudentResponses(r.id)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 font-semibold text-[11px] transition"
                        >
                          View Responses
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ASSESSMENTS MANAGER */}
      {activeTab === 'assessments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assessments.map((a) => (
              <div key={a.id} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <h3 className="font-bold text-lg text-white">{a.title}</h3>
                  </div>
                  <span className="text-xs font-mono text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                    ID: {a.id}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{a.description}</p>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400">Duration:</span>
                    <strong className="text-white ml-1.5">{a.durationMinutes} Mins</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Total Marks:</span>
                    <strong className="text-white ml-1.5">{a.totalMarks} Marks</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Pass Mark:</span>
                    <strong className="text-emerald-400 ml-1.5">{a.passPercentage}%</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Questions:</span>
                    <strong className="text-indigo-300 ml-1.5">{a.questionCount || 30} Qs</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(a.allowReview)}
                      onChange={(e) => handleUpdateAssessment(a.id, { allowReview: e.target.checked ? 1 : 0 })}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span className="text-slate-300">Allow Candidate Answer Review</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(a.isActive)}
                      onChange={(e) => handleUpdateAssessment(a.id, { isActive: e.target.checked ? 1 : 0 })}
                      className="rounded bg-slate-800 border-slate-700 text-emerald-600 focus:ring-0"
                    />
                    <span className="text-slate-300">Active Test</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: QUESTION BANK */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedAssessmentId}
                onChange={(e) => {
                  setSelectedAssessmentId(e.target.value);
                  loadQuestions(e.target.value, selectedSection);
                }}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none"
              >
                <option value="set-a">Assessment 1 (Set A)</option>
                <option value="set-b">Assessment 2 (Set B)</option>
              </select>

              <select
                value={selectedSection}
                onChange={(e) => {
                  setSelectedSection(e.target.value);
                  loadQuestions(selectedAssessmentId, e.target.value);
                }}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none"
              >
                <option value="">All Sections</option>
                <option value="Logical Reasoning">Logical Reasoning</option>
                <option value="Basic Mathematics">Basic Mathematics</option>
                <option value="Data Structures & Algorithms">DSA & Algorithms</option>
              </select>
            </div>

            <button
              onClick={() => {
                setEditingQuestion({
                  isNew: true,
                  assessmentId: selectedAssessmentId,
                  section: 'Logical Reasoning',
                  questionText: '',
                  codeSnippet: '',
                  options: [
                    { id: 'A', text: '' },
                    { id: 'B', text: '' },
                    { id: 'C', text: '' },
                    { id: 'D', text: '' }
                  ],
                  correctOptionId: 'A',
                  correctAnswerText: '',
                  explanation: '',
                  marks: 1.0,
                  negativeMarks: 0.0,
                  difficulty: 'Medium'
                });
                setIsNewQuestionModalOpen(true);
              }}
              className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Question</span>
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((q) => (
              <div key={q.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                      Q{q.questionNumber}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {q.section}
                    </span>
                    <span className="text-xs text-slate-400">+{q.marks} Mark</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingQuestion(q);
                        setIsNewQuestionModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title="Edit Question"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 hover:text-white transition"
                      title="Delete Question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-white font-medium whitespace-pre-wrap">{q.questionText}</p>

                {q.codeSnippet && (
                  <pre className="p-3 rounded-xl bg-slate-950 text-indigo-300 font-mono text-xs overflow-x-auto">
                    <code>{q.codeSnippet}</code>
                  </pre>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {q.options?.map((opt) => (
                    <div
                      key={opt.id}
                      className={`p-2 rounded-xl border flex items-center justify-between ${
                        opt.id === q.correctOptionId
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span><strong>{opt.id})</strong> {opt.text}</span>
                      {opt.id === q.correctOptionId && (
                        <span className="text-[10px] font-bold text-emerald-400">Correct</span>
                      )}
                    </div>
                  ))}
                </div>

                {q.explanation && (
                  <p className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                    <strong className="text-slate-300">Explanation:</strong> {q.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CANDIDATE RESULTS & STUDENT RESPONSE VIEWER */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search student name, roll number, organization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            {/* Separate CSV Export Actions */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <a
                href="/api/admin/export/csv?assessmentId=all&token=adm_token_secure_aptitude_2026"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 font-bold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                title="Export all results"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export All (CSV)</span>
              </a>

              <a
                href="/api/admin/export/csv?assessmentId=set-a&token=adm_token_secure_aptitude_2026"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 font-bold px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow transition"
                title="Export Set A results"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Set A (Ranked)</span>
              </a>

              <a
                href="/api/admin/export/csv?assessmentId=set-b&token=adm_token_secure_aptitude_2026"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 font-bold px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow transition"
                title="Export Set B results"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Set B (Ranked)</span>
              </a>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Roll Number</th>
                  <th className="p-3">Assessment</th>
                  <th className="p-3">Score & %</th>
                  <th className="p-3">Breakdown (C/W/S)</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Student Responses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {results
                  .filter(r => 
                    !searchQuery ||
                    r.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    r.candidateEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    r.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((r) => (
                    <tr key={r.id} className="hover:bg-slate-850/50">
                      <td className="p-3">
                        <strong className="text-white block font-semibold">{r.studentName}</strong>
                        <span className="text-slate-500 text-[11px]">{r.organization || 'Candidate'}</span>
                      </td>
                      <td className="p-3 font-mono font-bold text-indigo-300">{r.rollNumber}</td>
                      <td className="p-3 text-slate-300">{r.assessmentTitle}</td>
                      <td className="p-3 font-mono font-bold text-white">
                        {r.score}/{r.maxScore} <span className="text-slate-400 font-normal">({r.percentage}%)</span>
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        <span className="text-emerald-400">{r.correctCount}C</span> / <span className="text-rose-400">{r.incorrectCount}W</span> / <span className="text-slate-400">{r.unansweredCount}S</span>
                      </td>
                      <td className="p-3 font-mono text-slate-400">{Math.floor(r.timeTakenSeconds / 60)}m {r.timeTakenSeconds % 60}s</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.passed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}>
                          {r.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleViewStudentResponses(r.id)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 font-semibold transition"
                        >
                          View Responses
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: IMPORT QUESTIONS WIZARD */}
      {activeTab === 'import' && (
        <div className="max-w-3xl mx-auto p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white">Import Questions via JSON</h3>
            <p className="text-xs text-slate-400">Bulk insert questions into Set-A or Set-B assessment pools.</p>
          </div>

          {importSuccessMsg && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{importSuccessMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Target Assessment</label>
            <select
              value={importTargetAssessment}
              onChange={(e) => setImportTargetAssessment(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none"
            >
              <option value="set-a">Assessment 1 (Set A)</option>
              <option value="set-b">Assessment 2 (Set B)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Question Array (JSON format)</label>
            <textarea
              rows={10}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder={`[
  {
    "section": "Logical Reasoning",
    "questionText": "What comes next in the sequence 2, 4, 8, 16, ___?",
    "options": [
      {"id": "A", "text": "24"},
      {"id": "B", "text": "32"},
      {"id": "C", "text": "64"},
      {"id": "D", "text": "20"}
    ],
    "correctOptionId": "B",
    "correctAnswerText": "32",
    "explanation": "Numbers are powers of 2 (multiplied by 2). 16 * 2 = 32.",
    "marks": 1,
    "negativeMarks": 0,
    "difficulty": "Easy"
  }
]`}
              className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-300 outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          <button
            onClick={handleImportQuestions}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition"
          >
            Import Questions into Database
          </button>
        </div>
      )}

      {/* STUDENT RESPONSE VIEWER MODAL (ADMIN ONLY) */}
      {selectedStudentResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => setSelectedStudentResponse(null)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="border-b border-slate-800 pb-6 mb-6">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2 inline-block">
                Admin Student Response Inspector
              </span>
              <h2 className="text-2xl font-extrabold text-white">
                {selectedStudentResponse.studentName}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                <span>Roll No: <strong className="text-indigo-300 font-mono">{selectedStudentResponse.rollNumber}</strong></span>
                <span>•</span>
                <span>Assessment: <strong className="text-white">{selectedStudentResponse.assessmentTitle}</strong></span>
                <span>•</span>
                <span>Score: <strong className="text-emerald-400 font-bold">{selectedStudentResponse.score} / {selectedStudentResponse.maxScore} ({selectedStudentResponse.percentage}%)</strong></span>
                <span>•</span>
                <span>Time: {Math.floor(selectedStudentResponse.timeTakenSeconds / 60)}m {selectedStudentResponse.timeTakenSeconds % 60}s</span>
              </div>
            </div>

            {/* Question Breakdown List */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Question Responses ({selectedStudentResponse.questionDetails?.length})
              </h3>

              {selectedStudentResponse.questionDetails?.map((q) => (
                <div
                  key={q.questionNumber}
                  className={`p-5 rounded-2xl border bg-slate-950/60 ${
                    q.isCorrect ? 'border-emerald-500/40' : q.status === 'NOT_ANSWERED' ? 'border-slate-800' : 'border-rose-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                        Q{q.questionNumber}
                      </span>
                      <span className="text-xs text-slate-400">{q.section}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {q.isCorrect ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Correct
                        </span>
                      ) : q.status === 'NOT_ANSWERED' ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                          Unanswered
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Incorrect
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-white font-medium mb-3 whitespace-pre-wrap">{q.questionText}</p>

                  {q.codeSnippet && <CodeSnippet code={q.codeSnippet} />}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Student's Answer:</span>
                      <strong className={q.isCorrect ? 'text-emerald-300' : 'text-rose-300'}>
                        [{q.studentAnswerLabel}] {q.studentAnswerText}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Correct Answer:</span>
                      <strong className="text-emerald-400">
                        [{q.correctAnswerLabel}] {q.correctAnswerText}
                      </strong>
                    </div>
                  </div>

                  {q.explanation && (
                    <p className="text-xs text-indigo-300 mt-2 bg-indigo-950/20 p-2.5 rounded-xl border border-indigo-500/20">
                      <strong>Explanation:</strong> {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Question Edit / Create Modal */}
      {isNewQuestionModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-lg text-white">
                {editingQuestion.isNew ? 'Create New Question' : 'Edit Question'}
              </h3>
              <button onClick={() => setIsNewQuestionModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Assessment</label>
                  <select
                    value={editingQuestion.assessmentId}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, assessmentId: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="set-a">Set A</option>
                    <option value="set-b">Set B</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Section</label>
                  <input
                    type="text"
                    value={editingQuestion.section}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, section: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Question Text</label>
                <textarea
                  rows={3}
                  value={editingQuestion.questionText}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, questionText: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Code Snippet (Optional)</label>
                <textarea
                  rows={2}
                  value={editingQuestion.codeSnippet || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, codeSnippet: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-indigo-300"
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="block text-slate-400 font-semibold">Options & Correct Answer</label>
                {editingQuestion.options?.map((opt, idx) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <span className="w-6 font-bold text-indigo-400">{opt.id})</span>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => {
                        const newOpts = [...editingQuestion.options];
                        newOpts[idx].text = e.target.value;
                        setEditingQuestion({ ...editingQuestion, options: newOpts });
                      }}
                      className="flex-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    />
                    <input
                      type="radio"
                      name="correctOpt"
                      checked={editingQuestion.correctOptionId === opt.id}
                      onChange={() => setEditingQuestion({ ...editingQuestion, correctOptionId: opt.id, correctAnswerText: opt.text })}
                      title="Mark as correct option"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Explanation</label>
                <textarea
                  rows={2}
                  value={editingQuestion.explanation || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <button
                onClick={() => handleSaveQuestion(editingQuestion)}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition"
              >
                Save Question to Database
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
