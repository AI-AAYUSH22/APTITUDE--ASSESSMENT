const API_BASE = '/api';

export async function fetchApi(endpoint, options = {}) {
  const adminToken = localStorage.getItem('apti_admin_token');
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const contentType = response.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        if (!response.ok) {
          throw new Error(response.status === 401 ? 'Invalid username or password' : `Server error (${response.status})`);
        }
        data = { success: true, data: text };
      }
    }

    if (!response.ok || data.success === false) {
      throw new Error(data.error || (response.status === 401 ? 'Invalid username or password' : 'An unexpected error occurred'));
    }

    return data;
  } catch (err) {
    if (err.message && err.message.includes('Failed to fetch')) {
      throw new Error('Could not connect to server. Please ensure the backend is running.');
    }
    throw err;
  }
}

export const assessmentApi = {
  // Public Candidate Endpoints
  getAssessments: () => fetchApi('/assessments'),
  getAssessmentById: (id) => fetchApi(`/assessments/${id}`),
  verifyCandidate: (payload) => fetchApi('/candidate/verify', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  startSession: (candidateData) => fetchApi('/sessions/start', {
    method: 'POST',
    body: JSON.stringify(candidateData)
  }),
  getSessionStatus: (sessionId) => fetchApi(`/sessions/${sessionId}/status`),
  getQuestion: (sessionId, qNum) => fetchApi(`/sessions/${sessionId}/question/${qNum}`),
  saveAnswer: (sessionId, payload) => fetchApi(`/sessions/${sessionId}/answer`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getPalette: (sessionId) => fetchApi(`/sessions/${sessionId}/palette`),
  logViolation: (sessionId, payload) => fetchApi(`/sessions/${sessionId}/violation`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  submitSession: (sessionId, isAutoSubmit = false) => fetchApi(`/sessions/${sessionId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ isAutoSubmit })
  }),
  getResult: (resultId) => fetchApi(`/results/${resultId}`),
  getReview: (resultId) => fetchApi(`/results/${resultId}/review`),
  getLeaderboard: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/leaderboard${query ? `?${query}` : ''}`);
  },

  // Admin Endpoints
  adminLogin: (credentials) => fetchApi('/admin/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  getAdminStats: () => fetchApi('/admin/stats'),
  getAdminAssessments: () => fetchApi('/admin/assessments'),
  updateAssessment: (id, payload) => fetchApi(`/admin/assessments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),
  createAssessment: (payload) => fetchApi('/admin/assessments', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getAdminQuestions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/admin/questions${query ? `?${query}` : ''}`);
  },
  createQuestion: (payload) => fetchApi('/admin/questions', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  updateQuestion: (id, payload) => fetchApi(`/admin/questions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }),
  deleteQuestion: (id) => fetchApi(`/admin/questions/${id}`, {
    method: 'DELETE'
  }),
  importQuestions: (payload) => fetchApi('/admin/questions/import', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getAdminResults: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/admin/results${query ? `?${query}` : ''}`);
  },
  getStudentResponses: (resultId) => fetchApi(`/admin/results/${resultId}/responses`),
  getViolations: () => fetchApi('/admin/violations')
};
