const express = require('express');
const router = express.Router();
const AssessmentService = require('../services/assessmentService');

// Get all active assessments
router.get('/assessments', (req, res) => {
  try {
    const assessments = AssessmentService.getAssessments();
    res.json({ success: true, data: assessments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get assessment details by ID
router.get('/assessments/:id', (req, res) => {
  try {
    const assessment = AssessmentService.getAssessmentById(req.params.id);
    if (!assessment) return res.status(404).json({ success: false, error: 'Assessment not found' });
    res.json({ success: true, data: assessment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Candidate pre-registration verification & Welcome message
router.post('/candidate/verify', (req, res) => {
  try {
    const { fullName, rollNumber, email, organization } = req.body;
    const candidate = AssessmentService.registerCandidate({ fullName, rollNumber, email, organization });
    res.json({
      success: true,
      message: `Welcome, ${candidate.fullName}`,
      data: candidate
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Start a new test session (or resume active one)
router.post('/sessions/start', (req, res) => {
  try {
    const {
      assessmentId,
      assessment_id,
      selected_set,
      selectedSet,
      fullName,
      student_name,
      rollNumber,
      roll_number,
      email,
      organization
    } = req.body;

    const setChoice = selected_set || selectedSet || assessment_id || assessmentId;
    const name = fullName || student_name;
    const roll = rollNumber || roll_number;

    if (!setChoice || !name || !roll) {
      return res.status(400).json({ success: false, error: 'Full Name, Roll Number, and Set Selection (Set A or Set B) are mandatory.' });
    }

    const sessionInfo = AssessmentService.startSession({
      assessmentId: setChoice,
      selected_set: setChoice,
      fullName: name,
      student_name: name,
      rollNumber: roll,
      roll_number: roll,
      email,
      organization
    });

    res.json({ success: true, data: sessionInfo });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Get session metadata/timer status
router.get('/sessions/:sessionId/status', (req, res) => {
  try {
    const sessionInfo = AssessmentService.getSessionInfo(req.params.sessionId);
    res.json({ success: true, data: sessionInfo });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Get single question by 1-based index (Restricted delivery)
router.get('/sessions/:sessionId/question/:questionNumber', (req, res) => {
  try {
    const qNum = parseInt(req.params.questionNumber, 10);
    const question = AssessmentService.getQuestionForSession(req.params.sessionId, qNum);
    res.json({ success: true, data: question });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Save / Upsert answer for a question
router.post('/sessions/:sessionId/answer', (req, res) => {
  try {
    const { questionNumber, selectedOptionKey, status, timeSpentSeconds } = req.body;
    const qNum = parseInt(req.params.questionNumber, 10) || parseInt(questionNumber, 10);
    const result = AssessmentService.saveAnswer(req.params.sessionId, qNum, {
      selectedOptionKey,
      status,
      timeSpentSeconds
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Get navigation palette summary
router.get('/sessions/:sessionId/palette', (req, res) => {
  try {
    const palette = AssessmentService.getPalette(req.params.sessionId);
    res.json({ success: true, data: palette });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Log anti-cheating violation
router.post('/sessions/:sessionId/violation', (req, res) => {
  try {
    const { type, details } = req.body;
    const result = AssessmentService.logViolation(req.params.sessionId, { type, details });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Submit assessment
router.post('/sessions/:sessionId/submit', (req, res) => {
  try {
    const { isAutoSubmit } = req.body;
    const result = AssessmentService.submitSession(req.params.sessionId, !!isAutoSubmit);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Get result details (including student's leaderboard rank)
router.get('/results/:resultId', (req, res) => {
  try {
    const result = AssessmentService.getResult(req.params.resultId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
});

// Public Dynamic Leaderboard (No private candidate details exposed)
router.get('/leaderboard', (req, res) => {
  try {
    const { assessmentId = 'set-a', page = 1, limit = 50 } = req.query;
    const leaderboard = AssessmentService.getLeaderboard({
      assessmentId,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 50
    });
    res.json({ success: true, data: leaderboard });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get answer review (if enabled by admin)
router.get('/results/:resultId/review', (req, res) => {
  try {
    const review = AssessmentService.getAnswerReview(req.params.resultId);
    res.json({ success: true, data: review });
  } catch (err) {
    res.status(403).json({ success: false, error: err.message });
  }
});

module.exports = router;
