const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const AssessmentService = require('../services/assessmentService');

// Admin auth middleware
const ADMIN_TOKEN = 'adm_token_secure_aptitude_2026';

function adminAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['x-admin-token'];
  if (authHeader === `Bearer ${ADMIN_TOKEN}` || authHeader === ADMIN_TOKEN || req.query.token === ADMIN_TOKEN) {
    return next();
  }
  return res.status(401).json({ success: false, error: 'Unauthorized admin access' });
}

// Admin login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'Aayush-Killer-25' && password === 'Aayush@22#') {
    return res.json({
      success: true,
      data: {
        token: ADMIN_TOKEN,
        user: { username: 'Aayush-Killer-25', role: 'Super Administrator' }
      }
    });
  }
  return res.status(401).json({ success: false, error: 'Invalid admin username or password' });
});

// Proctoring & Anti-Cheat Violations Monitor
router.get('/violations', adminAuth, (req, res) => {
  try {
    const sessions = db.prepare(`
      SELECT s.id as sessionId, s.sessionToken, s.status, s.startedAt, s.completedAt,
             s.violationCount, s.violationsLogJson,
             c.fullName as studentName, c.rollNumber, c.email, c.organization,
             a.title as assessmentTitle, a.maxViolations,
             r.score, r.maxScore, r.passed
      FROM assessment_sessions s
      JOIN candidates c ON s.candidateId = c.id
      JOIN assessments a ON s.assessmentId = a.id
      LEFT JOIN results r ON s.id = r.sessionId
      ORDER BY s.violationCount DESC, s.startedAt DESC
    `).all().map(s => ({
      ...s,
      violationsLog: JSON.parse(s.violationsLogJson || '[]')
    }));

    const totalViolationsRecorded = sessions.reduce((acc, s) => acc + (s.violationCount || 0), 0);
    const flaggedStudents = sessions.filter(s => s.violationCount > 0);
    const autoLockedCount = sessions.filter(s => s.status === 'EXPIRED' || (s.violationCount >= s.maxViolations)).length;

    res.json({
      success: true,
      data: {
        summary: {
          totalViolationsRecorded,
          flaggedStudentsCount: flaggedStudents.length,
          autoLockedCount,
          totalMonitoredSessions: sessions.length
        },
        violations: sessions
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin stats: Comprehensive Overall Statistics + Set A & Set B breakdown
router.get('/stats', adminAuth, (req, res) => {
  try {
    const totalRegisteredStudents = db.prepare('SELECT COUNT(*) as count FROM candidates').get().count;
    const totalCompletedAssessments = db.prepare('SELECT COUNT(*) as count FROM results').get().count;
    const totalActiveSessions = db.prepare("SELECT COUNT(*) as count FROM assessment_sessions WHERE status = 'ACTIVE'").get().count;
    const totalIncompleteSessions = db.prepare("SELECT COUNT(*) as count FROM assessment_sessions WHERE status != 'COMPLETED'").get().count;

    // Overall Score Metrics
    const overallMetrics = db.prepare(`
      SELECT AVG(score) as avgScore,
             MAX(score) as highestScore,
             MIN(score) as lowestScore,
             AVG(percentage) as avgPercentage,
             SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) as passedCount
      FROM results
    `).get();

    // Set A Metrics
    const setAMetrics = db.prepare(`
      SELECT COUNT(*) as totalAttempts,
             AVG(score) as avgScore,
             MAX(score) as highestScore,
             MIN(score) as lowestScore,
             AVG(percentage) as avgPercentage
      FROM results
      WHERE assessmentId = 'set-a'
    `).get();

    // Set B Metrics
    const setBMetrics = db.prepare(`
      SELECT COUNT(*) as totalAttempts,
             AVG(score) as avgScore,
             MAX(score) as highestScore,
             MIN(score) as lowestScore,
             AVG(percentage) as avgPercentage
      FROM results
      WHERE assessmentId = 'set-b'
    `).get();

    const recentResults = db.prepare(`
      SELECT r.*, a.title as assessmentTitle, c.email as candidateEmail, c.organization
      FROM results r
      JOIN assessments a ON r.assessmentId = a.id
      JOIN candidates c ON r.candidateId = c.id
      ORDER BY r.createdAt DESC
      LIMIT 15
    `).all().map(r => ({
      ...r,
      sectionBreakdown: JSON.parse(r.sectionBreakdownJson || '[]')
    }));

    res.json({
      success: true,
      data: {
        totalRegisteredStudents,
        totalCompletedAssessments,
        totalActiveSessions,
        totalIncompleteSessions,
        avgScore: overallMetrics.avgScore ? Number(overallMetrics.avgScore.toFixed(2)) : 0,
        highestScore: overallMetrics.highestScore !== null ? overallMetrics.highestScore : 0,
        lowestScore: overallMetrics.lowestScore !== null ? overallMetrics.lowestScore : 0,
        avgPercentage: overallMetrics.avgPercentage ? Number(overallMetrics.avgPercentage.toFixed(2)) : 0,
        passRate: totalCompletedAssessments > 0 ? Number(((overallMetrics.passedCount / totalCompletedAssessments) * 100).toFixed(1)) : 0,
        setA: {
          totalAttempts: setAMetrics.totalAttempts,
          avgScore: setAMetrics.avgScore ? Number(setAMetrics.avgScore.toFixed(2)) : 0,
          highestScore: setAMetrics.highestScore !== null ? setAMetrics.highestScore : 0,
          lowestScore: setAMetrics.lowestScore !== null ? setAMetrics.lowestScore : 0,
          avgPercentage: setAMetrics.avgPercentage ? Number(setAMetrics.avgPercentage.toFixed(2)) : 0
        },
        setB: {
          totalAttempts: setBMetrics.totalAttempts,
          avgScore: setBMetrics.avgScore ? Number(setBMetrics.avgScore.toFixed(2)) : 0,
          highestScore: setBMetrics.highestScore !== null ? setBMetrics.highestScore : 0,
          lowestScore: setBMetrics.lowestScore !== null ? setBMetrics.lowestScore : 0,
          avgPercentage: setBMetrics.avgPercentage ? Number(setBMetrics.avgPercentage.toFixed(2)) : 0
        },
        recentResults
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Student Response Viewer (Full question-by-question breakdown for a student)
router.get('/results/:resultId/responses', adminAuth, (req, res) => {
  try {
    const details = AssessmentService.getStudentResponsesForAdmin(req.params.resultId);
    res.json({ success: true, data: details });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
});

// Get all assessments (admin view)
router.get('/assessments', adminAuth, (req, res) => {
  try {
    const assessments = db.prepare(`
      SELECT a.*, COUNT(q.id) as questionCount
      FROM assessments a
      LEFT JOIN questions q ON a.id = q.assessmentId
      GROUP BY a.id
      ORDER BY a.createdAt ASC
    `).all().map(a => ({
      ...a,
      instructions: JSON.parse(a.instructionsJson || '[]')
    }));
    res.json({ success: true, data: assessments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update assessment settings
router.put('/assessments/:id', adminAuth, (req, res) => {
  try {
    const { title, description, durationMinutes, totalMarks, passPercentage, instructions, isActive, allowReview } = req.body;
    db.prepare(`
      UPDATE assessments
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          durationMinutes = COALESCE(?, durationMinutes),
          totalMarks = COALESCE(?, totalMarks),
          passPercentage = COALESCE(?, passPercentage),
          instructionsJson = COALESCE(?, instructionsJson),
          isActive = COALESCE(?, isActive),
          allowReview = COALESCE(?, allowReview)
      WHERE id = ?
    `).run(
      title,
      description,
      durationMinutes,
      totalMarks,
      passPercentage,
      instructions ? JSON.stringify(instructions) : null,
      isActive !== undefined ? (isActive ? 1 : 0) : null,
      allowReview !== undefined ? (allowReview ? 1 : 0) : null,
      req.params.id
    );

    res.json({ success: true, message: 'Assessment updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all questions with filters
router.get('/questions', adminAuth, (req, res) => {
  try {
    const { assessmentId, section } = req.query;
    let query = 'SELECT * FROM questions WHERE 1=1';
    const params = [];

    if (assessmentId) {
      query += ' AND assessmentId = ?';
      params.push(assessmentId);
    }
    if (section) {
      query += ' AND section = ?';
      params.push(section);
    }

    query += ' ORDER BY assessmentId ASC, questionNumber ASC';
    const questions = db.prepare(query).all(...params).map(q => ({
      ...q,
      options: JSON.parse(q.optionsJson)
    }));

    res.json({ success: true, data: questions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new question
router.post('/questions', adminAuth, (req, res) => {
  try {
    const { assessmentId, section, questionText, codeSnippet, options, correctOptionId, correctAnswerText, explanation, marks, negativeMarks, difficulty } = req.body;
    
    const count = db.prepare('SELECT COUNT(*) as count FROM questions WHERE assessmentId = ?').get(assessmentId).count;
    const qNumber = count + 1;
    const questionId = `${assessmentId}-q${qNumber}-${uuidv4().slice(0, 4)}`;

    db.prepare(`
      INSERT INTO questions (
        id, assessmentId, questionNumber, section, questionText, codeSnippet,
        optionsJson, correctOptionId, correctAnswerText, explanation, marks, negativeMarks, difficulty
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      questionId,
      assessmentId,
      qNumber,
      section || 'General',
      questionText,
      codeSnippet || null,
      JSON.stringify(options || []),
      correctOptionId,
      correctAnswerText || '',
      explanation || '',
      marks || 1.0,
      negativeMarks || 0.0,
      difficulty || 'Medium'
    );

    res.json({ success: true, data: { id: questionId } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update a question
router.put('/questions/:id', adminAuth, (req, res) => {
  try {
    const { section, questionText, codeSnippet, options, correctOptionId, correctAnswerText, explanation, marks, negativeMarks, difficulty } = req.body;
    
    db.prepare(`
      UPDATE questions
      SET section = COALESCE(?, section),
          questionText = COALESCE(?, questionText),
          codeSnippet = COALESCE(?, codeSnippet),
          optionsJson = COALESCE(?, optionsJson),
          correctOptionId = COALESCE(?, correctOptionId),
          correctAnswerText = COALESCE(?, correctAnswerText),
          explanation = COALESCE(?, explanation),
          marks = COALESCE(?, marks),
          negativeMarks = COALESCE(?, negativeMarks),
          difficulty = COALESCE(?, difficulty)
      WHERE id = ?
    `).run(
      section,
      questionText,
      codeSnippet,
      options ? JSON.stringify(options) : null,
      correctOptionId,
      correctAnswerText,
      explanation,
      marks,
      negativeMarks,
      difficulty,
      req.params.id
    );

    res.json({ success: true, message: 'Question updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete a question
router.delete('/questions/:id', adminAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM questions WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Question deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Bulk import questions
router.post('/questions/import', adminAuth, (req, res) => {
  try {
    const { assessmentId, questions } = req.body;
    if (!assessmentId || !Array.isArray(questions)) {
      return res.status(400).json({ success: false, error: 'assessmentId and questions array required' });
    }

    const insertQuestion = db.prepare(`
      INSERT INTO questions (
        id, assessmentId, questionNumber, section, questionText, codeSnippet,
        optionsJson, correctOptionId, correctAnswerText, explanation, marks, negativeMarks, difficulty
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((items) => {
      let currentCount = db.prepare('SELECT COUNT(*) as cnt FROM questions WHERE assessmentId = ?').get(assessmentId).cnt;
      for (const q of items) {
        currentCount += 1;
        const qId = `${assessmentId}-q${currentCount}-${uuidv4().slice(0, 4)}`;
        insertQuestion.run(
          qId,
          assessmentId,
          currentCount,
          q.section || 'General',
          q.questionText,
          q.codeSnippet || null,
          JSON.stringify(q.options || []),
          q.correctOptionId || 'A',
          q.correctAnswerText || '',
          q.explanation || '',
          q.marks || 1.0,
          q.negativeMarks || 0.0,
          q.difficulty || 'Medium'
        );
      }
    });

    insertMany(questions);
    res.json({ success: true, importedCount: questions.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all candidate results with search & filtering
router.get('/results', adminAuth, (req, res) => {
  try {
    const { assessmentId, search, passed } = req.query;
    let query = `
      SELECT r.*, a.title as assessmentTitle,
             c.email as candidateEmail, c.organization,
             s.violationCount, s.startedAt, s.completedAt
      FROM results r
      JOIN assessments a ON r.assessmentId = a.id
      JOIN candidates c ON r.candidateId = c.id
      JOIN assessment_sessions s ON r.sessionId = s.id
      WHERE 1=1
    `;
    const params = [];

    if (assessmentId && assessmentId !== 'all') {
      query += ' AND r.assessmentId = ?';
      params.push(assessmentId);
    }
    if (passed !== undefined && passed !== '') {
      query += ' AND r.passed = ?';
      params.push(passed === 'true' || passed === '1' ? 1 : 0);
    }
    if (search) {
      query += ' AND (r.studentName LIKE ? OR c.email LIKE ? OR r.rollNumber LIKE ? OR c.organization LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    query += ' ORDER BY r.createdAt DESC';
    const results = db.prepare(query).all(...params).map(r => ({
      ...r,
      sectionBreakdown: JSON.parse(r.sectionBreakdownJson || '[]')
    }));

    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Export results as CSV with Rank (Support for Set A, Set B, or All)
router.get('/export/csv', adminAuth, (req, res) => {
  try {
    const { assessmentId } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (assessmentId && assessmentId !== 'all') {
      whereClause += ' AND r.assessmentId = ?';
      params.push(assessmentId);
    }

    const query = `
      SELECT r.id as resultId, r.studentName, r.rollNumber, c.email, c.organization,
             a.title as assessmentTitle, r.assessmentId, r.score, r.maxScore, r.percentage,
             r.correctCount, r.incorrectCount, r.unansweredCount, r.timeTakenSeconds,
             s.violationCount, r.createdAt
      FROM results r
      JOIN assessments a ON r.assessmentId = a.id
      JOIN candidates c ON r.candidateId = c.id
      JOIN assessment_sessions s ON r.sessionId = s.id
      ${whereClause}
      ORDER BY r.score DESC, r.timeTakenSeconds ASC, r.createdAt ASC
    `;

    const results = db.prepare(query).all(...params);

    let filename = 'all_results.csv';
    if (assessmentId === 'set-a') filename = 'set_a_results.csv';
    else if (assessmentId === 'set-b') filename = 'set_b_results.csv';

    let csv = 'Rank,Student Name,Roll Number,Email,Organization,Assessment,Score,Max Score,Percentage,Correct,Incorrect,Unanswered,Time Taken (s),Violations,Submission Time\n';
    
    results.forEach((row, idx) => {
      const rank = idx + 1;
      csv += `${rank},"${row.studentName}","${row.rollNumber}","${row.email || ''}","${row.organization || ''}","${row.assessmentTitle}",${row.score},${row.maxScore},${row.percentage}%,${row.correctCount},${row.incorrectCount},${row.unansweredCount},${row.timeTakenSeconds},${row.violationCount || 0},"${row.createdAt}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
