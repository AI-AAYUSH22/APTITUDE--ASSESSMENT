const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// Shuffle array using Fisher-Yates algorithm
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

class AssessmentService {
  /**
   * Get all active public assessments (metadata only)
   */
  static getAssessments() {
    return db.prepare(`
      SELECT a.id, a.title, a.description, a.durationMinutes, a.totalMarks, a.passPercentage,
             a.maxViolations, a.instructionsJson, a.isActive, a.allowReview,
             COUNT(q.id) as questionCount
      FROM assessments a
      LEFT JOIN questions q ON a.id = q.assessmentId
      WHERE a.isActive = 1
      GROUP BY a.id
    `).all().map(a => ({
      ...a,
      instructions: JSON.parse(a.instructionsJson || '[]')
    }));
  }

  /**
   * Get assessment details by ID
   */
  static getAssessmentById(assessmentId) {
    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(assessmentId);
    if (!assessment) return null;
    const questionCount = db.prepare('SELECT COUNT(*) as cnt FROM questions WHERE assessmentId = ?').get(assessmentId).cnt;
    return {
      ...assessment,
      questionCount,
      instructions: JSON.parse(assessment.instructionsJson || '[]')
    };
  }

  /**
   * Candidate verification / pre-registration
   */
  static registerCandidate({ fullName, rollNumber, email = '', organization = '' }) {
    if (!fullName || !fullName.trim()) {
      throw new Error('Full Name is mandatory');
    }
    if (!rollNumber || !rollNumber.trim()) {
      throw new Error('Roll Number / Student ID is mandatory');
    }

    const cleanName = fullName.trim();
    const cleanRoll = rollNumber.trim().toUpperCase();

    let candidate = db.prepare('SELECT * FROM candidates WHERE rollNumber = ?').get(cleanRoll);
    if (!candidate) {
      const candidateId = uuidv4();
      db.prepare(`
        INSERT INTO candidates (id, fullName, email, organization, rollNumber)
        VALUES (?, ?, ?, ?, ?)
      `).run(candidateId, cleanName, email.trim().toLowerCase(), organization.trim(), cleanRoll);
      candidate = { id: candidateId, fullName: cleanName, email, organization, rollNumber: cleanRoll };
    } else {
      db.prepare(`
        UPDATE candidates SET fullName = ?, email = COALESCE(NULLIF(?, ''), email), organization = COALESCE(NULLIF(?, ''), organization)
        WHERE id = ?
      `).run(cleanName, email.trim().toLowerCase(), organization.trim(), candidate.id);
      candidate.fullName = cleanName;
    }

    return candidate;
  }

  /**
   * Start or resume a secure assessment session for a candidate
   */
  static startSession({ assessmentId, selected_set, selectedSet, fullName, student_name, rollNumber, roll_number, email = '', organization = '' }) {
    const rawSet = (selected_set || selectedSet || assessmentId || '').toString().trim();
    const upperSet = rawSet.toUpperCase();
    let normAssessmentId = '';

    if (upperSet === 'SET_A' || upperSet === 'SET-A' || upperSet === 'SETA' || upperSet === 'SET A' || rawSet === 'set-a') {
      normAssessmentId = 'set-a';
    } else if (upperSet === 'SET_B' || upperSet === 'SET-B' || upperSet === 'SETB' || upperSet === 'SET B' || rawSet === 'set-b') {
      normAssessmentId = 'set-b';
    } else {
      throw new Error('Please select a valid Assessment Set (Set A or Set B).');
    }

    const candidateName = (fullName || student_name || '').trim();
    const candidateRoll = (rollNumber || roll_number || '').trim();

    if (!candidateName) {
      throw new Error('Full Name is mandatory.');
    }
    if (!candidateRoll) {
      throw new Error('Roll Number / Student ID is mandatory.');
    }

    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ? AND isActive = 1').get(normAssessmentId);
    if (!assessment) {
      throw new Error('Assessment not found or inactive');
    }

    const candidate = this.registerCandidate({ fullName: candidateName, rollNumber: candidateRoll, email, organization });

    // Check if candidate already has an active session for this assessment
    const existingSession = db.prepare(`
      SELECT * FROM assessment_sessions
      WHERE candidateId = ? AND assessmentId = ? AND status = 'ACTIVE'
    `).get(candidate.id, normAssessmentId);

    const now = Date.now();

    if (existingSession) {
      if (now >= existingSession.expiresAt) {
        return this.submitSession(existingSession.id, true);
      } else {
        // Return existing active session without re-randomizing
        return this.getSessionInfo(existingSession.id, existingSession.sessionToken);
      }
    }

    // Check if candidate already completed this assessment
    const completedResult = db.prepare(`
      SELECT * FROM results WHERE candidateId = ? AND assessmentId = ?
    `).get(candidate.id, normAssessmentId);

    if (completedResult) {
      return {
        alreadyCompleted: true,
        resultId: completedResult.id,
        message: 'You have already completed this assessment.'
      };
    }

    // Fetch all questions for this assessment
    const allQuestions = db.prepare('SELECT id, questionNumber, section, optionsJson, correctOptionId FROM questions WHERE assessmentId = ?').all(normAssessmentId);
    if (allQuestions.length === 0) {
      throw new Error('No questions found in this assessment pool');
    }

    // 1. Shuffle question order (Fisher-Yates)
    const shuffledQuestions = shuffleArray(allQuestions);
    const randomizedOrder = shuffledQuestions.map(q => q.id);

    // 2. Shuffle options for each question and create secure mapping
    const optionsMapping = {};
    shuffledQuestions.forEach(q => {
      const rawOptions = JSON.parse(q.optionsJson);
      const shuffledOpts = shuffleArray(rawOptions);

      const mappedOptions = shuffledOpts.map((opt, idx) => {
        const optionKey = `opt_${idx + 1}`;
        return {
          key: optionKey,
          originalId: opt.id,
          text: opt.text,
          label: String.fromCharCode(65 + idx)
        };
      });

      optionsMapping[q.id] = mappedOptions;
    });

    const sessionId = uuidv4();
    const sessionToken = `tok_${uuidv4().replace(/-/g, '')}`;
    const durationMs = assessment.durationMinutes * 60 * 1000;
    const expiresAt = now + durationMs;

    db.prepare(`
      INSERT INTO assessment_sessions (
        id, sessionToken, candidateId, assessmentId, status, startedAt, expiresAt, totalQuestions,
        currentQuestionIndex, randomizedOrderJson, optionsMappingJson, violationCount, violationsLogJson
      ) VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?, 1, ?, ?, 0, '[]')
    `).run(
      sessionId,
      sessionToken,
      candidate.id,
      normAssessmentId,
      now,
      expiresAt,
      randomizedOrder.length,
      JSON.stringify(randomizedOrder),
      JSON.stringify(optionsMapping)
    );

    // Initialize student responses in DB
    const initResponse = db.prepare(`
      INSERT INTO student_responses (
        id, sessionId, candidateId, studentName, rollNumber, assessmentId, questionId, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'NOT_VISITED')
    `);

    const insertAll = db.transaction(() => {
      randomizedOrder.forEach(qId => {
        initResponse.run(
          uuidv4(),
          sessionId,
          candidate.id,
          candidate.fullName,
          candidate.rollNumber,
          normAssessmentId,
          qId
        );
      });
    });
    insertAll();

    return this.getSessionInfo(sessionId, sessionToken);
  }

  /**
   * Get session status, remaining time, candidate info, and progress summary with token check
   */
  static getSessionInfo(sessionId, sessionToken = null) {
    let query = `
      SELECT s.*, a.title as assessmentTitle, a.durationMinutes, a.totalMarks, a.maxViolations,
             c.fullName as candidateName, c.email as candidateEmail, c.organization, c.rollNumber
      FROM assessment_sessions s
      JOIN assessments a ON s.assessmentId = a.id
      JOIN candidates c ON s.candidateId = c.id
      WHERE s.id = ?
    `;
    const params = [sessionId];

    if (sessionToken) {
      query += ' AND (s.sessionToken = ? OR s.id = ?)';
      params.push(sessionToken, sessionToken);
    }

    const session = db.prepare(query).get(...params);

    if (!session) {
      throw new Error('Assessment session not found or unauthorized');
    }

    const now = Date.now();
    const remainingSeconds = Math.max(0, Math.floor((session.expiresAt - now) / 1000));

    // Auto-expire if timer ran out
    if (remainingSeconds === 0 && session.status === 'ACTIVE') {
      return this.submitSession(sessionId, true);
    }

    // Fetch previously saved answers map for session recovery
    const savedResponses = db.prepare(`
      SELECT questionId, selectedOptionKey, status
      FROM student_responses
      WHERE sessionId = ?
    `).all(sessionId);

    const randomizedOrder = JSON.parse(session.randomizedOrderJson);
    const answersMap = {};
    randomizedOrder.forEach((qId, idx) => {
      const resp = savedResponses.find(r => r.questionId === qId);
      if (resp && resp.selectedOptionKey) {
        answersMap[idx + 1] = {
          selectedOptionKey: resp.selectedOptionKey,
          status: resp.status
        };
      }
    });

    return {
      sessionId: session.id,
      sessionToken: session.sessionToken,
      assessmentId: session.assessmentId,
      assessmentTitle: session.assessmentTitle,
      durationMinutes: session.durationMinutes,
      totalMarks: session.totalMarks,
      maxViolations: session.maxViolations || 3,
      currentQuestionIndex: session.currentQuestionIndex || 1,
      candidate: {
        id: session.candidateId,
        name: session.candidateName,
        email: session.candidateEmail,
        organization: session.organization,
        rollNumber: session.rollNumber
      },
      status: session.status,
      totalQuestions: session.totalQuestions,
      startedAt: session.startedAt,
      expiresAt: session.expiresAt,
      remainingSeconds,
      violationCount: session.violationCount,
      answersMap
    };
  }

  /**
   * Get single question securely by 1-based display index
   */
  static getQuestionForSession(sessionId, displayIndex) {
    const session = db.prepare('SELECT * FROM assessment_sessions WHERE id = ?').get(sessionId);
    if (!session) throw new Error('Session not found');

    const now = Date.now();
    if (now >= session.expiresAt && session.status === 'ACTIVE') {
      this.submitSession(sessionId, true);
      throw new Error('Session has expired');
    }

    if (session.status !== 'ACTIVE') {
      throw new Error(`Assessment is already ${session.status.toLowerCase()}`);
    }

    const randomizedOrder = JSON.parse(session.randomizedOrderJson);
    const optionsMapping = JSON.parse(session.optionsMappingJson);

    if (displayIndex < 1 || displayIndex > randomizedOrder.length) {
      throw new Error('Invalid question index');
    }

    // Save current question index in session state for fast resume
    db.prepare('UPDATE assessment_sessions SET currentQuestionIndex = ? WHERE id = ?').run(displayIndex, sessionId);

    const targetQuestionId = randomizedOrder[displayIndex - 1];

    // Fetch question from DB (WITHOUT correct answer or explanation)
    const question = db.prepare(`
      SELECT id, section, questionText, codeSnippet, difficulty, marks
      FROM questions WHERE id = ?
    `).get(targetQuestionId);

    if (!question) throw new Error('Question not found');

    const mappedOptions = optionsMapping[targetQuestionId] || [];
    const clientOptions = mappedOptions.map(opt => ({
      key: opt.key,
      label: opt.label,
      text: opt.text
    }));

    // Get current response status for this question in this session
    const currentResp = db.prepare(`
      SELECT selectedOptionKey, status, timeSpentSeconds
      FROM student_responses WHERE sessionId = ? AND questionId = ?
    `).get(sessionId, targetQuestionId);

    if (currentResp && currentResp.status === 'NOT_VISITED') {
      db.prepare(`
        UPDATE student_responses SET status = 'NOT_ANSWERED'
        WHERE sessionId = ? AND questionId = ?
      `).run(sessionId, targetQuestionId);
    }

    const remainingSeconds = Math.max(0, Math.floor((session.expiresAt - now) / 1000));

    return {
      questionNumber: displayIndex,
      totalQuestions: randomizedOrder.length,
      section: question.section,
      questionText: question.questionText,
      codeSnippet: question.codeSnippet,
      difficulty: question.difficulty,
      marks: question.marks,
      options: clientOptions,
      currentSelectedOptionKey: currentResp ? currentResp.selectedOptionKey : null,
      currentStatus: currentResp ? (currentResp.status === 'NOT_VISITED' ? 'NOT_ANSWERED' : currentResp.status) : 'NOT_ANSWERED',
      remainingSeconds
    };
  }

  /**
   * Save candidate's answer with Idempotent Upsert logic and timestamp acknowledgement
   */
  static saveAnswer(sessionId, displayIndex, { selectedOptionKey, status, timeSpentSeconds = 0 }) {
    const session = db.prepare('SELECT * FROM assessment_sessions WHERE id = ?').get(sessionId);
    if (!session) throw new Error('Session not found');

    const now = Date.now();
    if (now >= session.expiresAt && session.status === 'ACTIVE') {
      this.submitSession(sessionId, true);
      throw new Error('Session has expired');
    }

    if (session.status !== 'ACTIVE') {
      throw new Error('Cannot update answers for completed session');
    }

    const randomizedOrder = JSON.parse(session.randomizedOrderJson);
    const optionsMapping = JSON.parse(session.optionsMappingJson);

    if (displayIndex < 1 || displayIndex > randomizedOrder.length) {
      throw new Error('Invalid question index');
    }

    const questionId = randomizedOrder[displayIndex - 1];
    const qOptions = optionsMapping[questionId] || [];
    const chosenOpt = qOptions.find(o => o.key === selectedOptionKey);

    let effectiveStatus = status || 'NOT_ANSWERED';
    if (selectedOptionKey) {
      if (status === 'MARKED_FOR_REVIEW') {
        effectiveStatus = 'MARKED_AND_ANSWERED';
      } else {
        effectiveStatus = 'ANSWERED';
      }
    } else {
      if (status === 'MARKED_FOR_REVIEW') {
        effectiveStatus = 'MARKED_FOR_REVIEW';
      } else if (status === 'CLEAR') {
        effectiveStatus = 'NOT_ANSWERED';
      }
    }

    const syncTimestamp = Date.now();

    // Idempotent upsert into student_responses
    const upsertStmt = db.prepare(`
      INSERT INTO student_responses (
        id, sessionId, candidateId, studentName, rollNumber, assessmentId, questionId,
        selectedOptionKey, selectedOptionText, originalOptionId, status, answeredAt, timeSpentSeconds
      )
      SELECT
        ?, s.id, c.id, c.fullName, c.rollNumber, s.assessmentId, ?,
        ?, ?, ?, ?, ?, ?
      FROM assessment_sessions s
      JOIN candidates c ON s.candidateId = c.id
      WHERE s.id = ?
      ON CONFLICT(sessionId, questionId) DO UPDATE SET
        selectedOptionKey = excluded.selectedOptionKey,
        selectedOptionText = excluded.selectedOptionText,
        originalOptionId = excluded.originalOptionId,
        status = excluded.status,
        answeredAt = excluded.answeredAt,
        timeSpentSeconds = student_responses.timeSpentSeconds + excluded.timeSpentSeconds
    `);

    upsertStmt.run(
      uuidv4(),
      questionId,
      selectedOptionKey || null,
      chosenOpt ? chosenOpt.text : null,
      chosenOpt ? chosenOpt.originalId : null,
      effectiveStatus,
      syncTimestamp,
      timeSpentSeconds,
      sessionId
    );

    return {
      success: true,
      questionNumber: displayIndex,
      status: effectiveStatus,
      syncedAt: syncTimestamp
    };
  }

  /**
   * Get palette overview for fast jump navigation
   */
  static getPalette(sessionId) {
    const session = db.prepare('SELECT * FROM assessment_sessions WHERE id = ?').get(sessionId);
    if (!session) throw new Error('Session not found');

    const randomizedOrder = JSON.parse(session.randomizedOrderJson);
    const responses = db.prepare(`
      SELECT sr.questionId, sr.status, sr.selectedOptionKey, q.section
      FROM student_responses sr
      JOIN questions q ON sr.questionId = q.id
      WHERE sr.sessionId = ?
    `).all(sessionId);

    const respMap = {};
    responses.forEach(r => {
      respMap[r.questionId] = r;
    });

    const palette = randomizedOrder.map((qId, idx) => {
      const resp = respMap[qId] || { status: 'NOT_VISITED', section: 'General' };
      return {
        questionNumber: idx + 1,
        status: resp.status,
        hasAnswer: !!resp.selectedOptionKey,
        section: resp.section
      };
    });

    return {
      sessionId,
      totalQuestions: randomizedOrder.length,
      palette,
      remainingSeconds: Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000))
    };
  }

  /**
   * Log anti-cheating violation with configurable threshold auto-submission
   */
  static logViolation(sessionId, { type, details }) {
    const session = db.prepare(`
      SELECT s.*, a.maxViolations
      FROM assessment_sessions s
      JOIN assessments a ON s.assessmentId = a.id
      WHERE s.id = ?
    `).get(sessionId);

    if (!session) return { success: false };

    const logs = JSON.parse(session.violationsLogJson || '[]');
    const newEntry = {
      type,
      details,
      timestamp: Date.now()
    };
    logs.push(newEntry);

    const newCount = session.violationCount + 1;
    const maxViolations = session.maxViolations || 3;

    db.prepare(`
      UPDATE assessment_sessions
      SET violationCount = ?, violationsLogJson = ?
      WHERE id = ?
    `).run(newCount, JSON.stringify(logs), sessionId);

    // If max threshold reached, auto-submit session
    let autoLocked = false;
    if (newCount >= maxViolations && session.status === 'ACTIVE') {
      this.submitSession(sessionId, true);
      autoLocked = true;
    }

    return {
      success: true,
      violationCount: newCount,
      maxViolations,
      autoLocked,
      warningMessage: autoLocked
        ? `Assessment access restricted: Reached maximum violation limit (${newCount}/${maxViolations}). Test has been auto-submitted.`
        : `Warning ${newCount}/${maxViolations}: Leaving assessment screen is strictly prohibited.`
    };
  }

  /**
   * Atomic Idempotent Submission: Evaluates all student responses in a single transaction
   */
  static submitSession(sessionId, isAutoSubmit = false) {
    // 1. Check if result already exists (Idempotency guarantee)
    const existingResult = db.prepare('SELECT id FROM results WHERE sessionId = ?').get(sessionId);
    if (existingResult) {
      return this.getResult(existingResult.id);
    }

    const session = db.prepare(`
      SELECT s.*, a.totalMarks, a.passPercentage, a.durationMinutes,
             c.id as candId, c.fullName as studentName, c.rollNumber
      FROM assessment_sessions s
      JOIN assessments a ON s.assessmentId = a.id
      JOIN candidates c ON s.candidateId = c.id
      WHERE s.id = ?
    `).get(sessionId);

    if (!session) throw new Error('Session not found');

    const now = Date.now();
    const randomizedOrder = JSON.parse(session.randomizedOrderJson);
    const optionsMapping = JSON.parse(session.optionsMappingJson);

    // Fetch all student responses join with questions
    const responses = db.prepare(`
      SELECT sr.*, q.section, q.correctOptionId, q.correctAnswerText, q.marks, q.negativeMarks, q.difficulty
      FROM student_responses sr
      JOIN questions q ON sr.questionId = q.id
      WHERE sr.sessionId = ?
    `).all(sessionId);

    let attemptedCount = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let totalScore = 0;
    let maxScore = 0;

    const sectionBreakdown = {};
    const resultId = uuidv4();
    const timeTakenSeconds = Math.min(
      session.durationMinutes * 60,
      Math.max(1, Math.floor((now - session.startedAt) / 1000))
    );

    // Execute submission atomically inside a transaction
    const executeAtomicSubmission = db.transaction(() => {
      // Lock session
      db.prepare(`
        UPDATE assessment_sessions
        SET status = ?, completedAt = ?
        WHERE id = ?
      `).run(isAutoSubmit ? 'EXPIRED' : 'COMPLETED', now, sessionId);

      const updateRespCorrect = db.prepare('UPDATE student_responses SET isCorrect = ? WHERE sessionId = ? AND questionId = ?');

      responses.forEach(resp => {
        const secName = resp.section || 'General';
        if (!sectionBreakdown[secName]) {
          sectionBreakdown[secName] = {
            section: secName,
            totalQuestions: 0,
            attempted: 0,
            correct: 0,
            incorrect: 0,
            unanswered: 0,
            score: 0,
            maxScore: 0
          };
        }

        const sec = sectionBreakdown[secName];
        sec.totalQuestions += 1;
        sec.maxScore += resp.marks;
        maxScore += resp.marks;

        if (!resp.selectedOptionKey) {
          unansweredCount += 1;
          sec.unanswered += 1;
          updateRespCorrect.run(0, sessionId, resp.questionId);
        } else {
          attemptedCount += 1;
          sec.attempted += 1;

          const qOptions = optionsMapping[resp.questionId] || [];
          const chosenOpt = qOptions.find(o => o.key === resp.selectedOptionKey);

          const isCorrect = chosenOpt && chosenOpt.originalId === resp.correctOptionId;

          if (isCorrect) {
            correctCount += 1;
            sec.correct += 1;
            totalScore += resp.marks;
            sec.score += resp.marks;
            updateRespCorrect.run(1, sessionId, resp.questionId);
          } else {
            incorrectCount += 1;
            sec.incorrect += 1;
            totalScore -= (resp.negativeMarks || 0);
            sec.score -= (resp.negativeMarks || 0);
            updateRespCorrect.run(0, sessionId, resp.questionId);
          }
        }
      });

      totalScore = Math.max(0, totalScore);
      const percentage = maxScore > 0 ? Number(((totalScore / maxScore) * 100).toFixed(2)) : 0;
      const passed = percentage >= session.passPercentage ? 1 : 0;

      db.prepare(`
        INSERT INTO results (
          id, sessionId, candidateId, studentName, rollNumber, assessmentId, totalQuestions, attemptedCount,
          correctCount, incorrectCount, unansweredCount, score, maxScore, percentage,
          passed, timeTakenSeconds, sectionBreakdownJson
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        resultId,
        sessionId,
        session.candId,
        session.studentName,
        session.rollNumber,
        session.assessmentId,
        randomizedOrder.length,
        attemptedCount,
        correctCount,
        incorrectCount,
        unansweredCount,
        totalScore,
        maxScore,
        percentage,
        passed,
        timeTakenSeconds,
        JSON.stringify(Object.values(sectionBreakdown))
      );
    });

    executeAtomicSubmission();

    return this.getResult(resultId);
  }

  /**
   * Get calculated result including dynamic leaderboard rank
   */
  static getResult(resultId) {
    const result = db.prepare(`
      SELECT r.*, a.title as assessmentTitle, a.allowReview,
             c.fullName as candidateName, c.email as candidateEmail, c.organization, c.rollNumber,
             s.violationCount
      FROM results r
      JOIN assessments a ON r.assessmentId = a.id
      JOIN candidates c ON r.candidateId = c.id
      JOIN assessment_sessions s ON r.sessionId = s.id
      WHERE r.id = ? OR r.sessionId = ?
    `).get(resultId, resultId);

    if (!result) throw new Error('Result not found');

    const rankQuery = db.prepare(`
      SELECT COUNT(*) + 1 as rank
      FROM results
      WHERE assessmentId = ?
        AND (
          score > ?
          OR (score = ? AND timeTakenSeconds < ?)
          OR (score = ? AND timeTakenSeconds = ? AND createdAt < ?)
        )
    `).get(
      result.assessmentId,
      result.score,
      result.score, result.timeTakenSeconds,
      result.score, result.timeTakenSeconds, result.createdAt
    );

    const rank = rankQuery ? rankQuery.rank : 1;
    const totalInAssessment = db.prepare('SELECT COUNT(*) as count FROM results WHERE assessmentId = ?').get(result.assessmentId).count;

    return {
      resultId: result.id,
      sessionId: result.sessionId,
      assessmentId: result.assessmentId,
      assessmentTitle: result.assessmentTitle,
      studentName: result.studentName || result.candidateName,
      candidate: {
        id: result.candidateId,
        name: result.studentName || result.candidateName,
        email: result.candidateEmail,
        organization: result.organization,
        rollNumber: result.rollNumber
      },
      totalQuestions: result.totalQuestions,
      attemptedCount: result.attemptedCount,
      correctCount: result.correctCount,
      incorrectCount: result.incorrectCount,
      unansweredCount: result.unansweredCount,
      score: result.score,
      maxScore: result.maxScore,
      percentage: result.percentage,
      passed: Boolean(result.passed),
      timeTakenSeconds: result.timeTakenSeconds,
      violationCount: result.violationCount,
      sectionBreakdown: JSON.parse(result.sectionBreakdownJson || '[]'),
      allowReview: Boolean(result.allowReview),
      createdAt: result.createdAt,
      rank,
      totalInAssessment
    };
  }

  /**
   * Get dynamic leaderboard from central database (No client computation)
   */
  static getLeaderboard({ assessmentId = 'set-a', page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (assessmentId && assessmentId !== 'all') {
      whereClause += ' AND r.assessmentId = ?';
      params.push(assessmentId);
    }

    const countQuery = db.prepare(`SELECT COUNT(*) as total FROM results r ${whereClause}`);
    const totalCount = countQuery.get(...params).total;

    const query = `
      SELECT r.id as resultId, r.studentName, r.score, r.maxScore, r.percentage,
             r.timeTakenSeconds, r.createdAt, a.title as assessmentTitle, r.assessmentId
      FROM results r
      JOIN assessments a ON r.assessmentId = a.id
      ${whereClause}
      ORDER BY r.score DESC, r.timeTakenSeconds ASC, r.createdAt ASC
      LIMIT ? OFFSET ?
    `;

    const rawLeaderboard = db.prepare(query).all(...params, limit, offset);

    const leaderboard = rawLeaderboard.map((row, index) => ({
      rank: offset + index + 1,
      studentName: row.studentName,
      score: row.score,
      maxScore: row.maxScore,
      percentage: row.percentage,
      timeTakenSeconds: row.timeTakenSeconds,
      assessmentTitle: row.assessmentTitle,
      assessmentId: row.assessmentId,
      submittedAt: row.createdAt
    }));

    return {
      assessmentId,
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
      leaderboard
    };
  }

  /**
   * Admin Student Response Viewer
   */
  static getStudentResponsesForAdmin(resultId) {
    const result = db.prepare(`
      SELECT r.*, a.title as assessmentTitle, s.optionsMappingJson, s.randomizedOrderJson,
             c.email as candidateEmail, c.organization, s.violationCount, s.violationsLogJson
      FROM results r
      JOIN assessments a ON r.assessmentId = a.id
      JOIN candidates c ON r.candidateId = c.id
      JOIN assessment_sessions s ON r.sessionId = s.id
      WHERE r.id = ?
    `).get(resultId);

    if (!result) throw new Error('Result record not found');

    const optionsMapping = JSON.parse(result.optionsMappingJson || '{}');
    const randomizedOrder = JSON.parse(result.randomizedOrderJson || '[]');
    const violations = JSON.parse(result.violationsLogJson || '[]');

    const questions = db.prepare(`
      SELECT q.id, q.questionNumber, q.section, q.questionText, q.codeSnippet,
             q.correctOptionId, q.correctAnswerText, q.explanation, q.marks,
             sr.selectedOptionKey, sr.selectedOptionText, sr.originalOptionId, sr.isCorrect, sr.status, sr.timeSpentSeconds
      FROM questions q
      LEFT JOIN student_responses sr ON q.id = sr.questionId AND sr.sessionId = ?
      WHERE q.assessmentId = ?
    `).all(result.sessionId, result.assessmentId);

    const questionMap = {};
    questions.forEach(q => { questionMap[q.id] = q; });

    const questionDetails = randomizedOrder.map((qId, idx) => {
      const q = questionMap[qId];
      const opts = optionsMapping[qId] || [];
      const chosenOpt = opts.find(o => o.key === q.selectedOptionKey);

      return {
        questionNumber: idx + 1,
        section: q.section,
        questionText: q.questionText,
        codeSnippet: q.codeSnippet,
        marks: q.marks,
        studentAnswerLabel: chosenOpt ? chosenOpt.label : 'Not Attempted',
        studentAnswerText: chosenOpt ? chosenOpt.text : 'Unanswered',
        correctAnswerLabel: opts.find(o => o.originalId === q.correctOptionId)?.label || '',
        correctAnswerText: q.correctAnswerText,
        isCorrect: Boolean(q.isCorrect),
        status: q.status || 'NOT_ANSWERED',
        explanation: q.explanation,
        timeSpentSeconds: q.timeSpentSeconds || 0
      };
    });

    return {
      resultId: result.id,
      sessionId: result.sessionId,
      studentName: result.studentName,
      rollNumber: result.rollNumber,
      email: result.candidateEmail,
      organization: result.organization,
      assessmentTitle: result.assessmentTitle,
      assessmentId: result.assessmentId,
      score: result.score,
      maxScore: result.maxScore,
      percentage: result.percentage,
      timeTakenSeconds: result.timeTakenSeconds,
      submittedAt: result.createdAt,
      violationCount: result.violationCount,
      violations,
      sectionBreakdown: JSON.parse(result.sectionBreakdownJson || '[]'),
      questionDetails
    };
  }

  /**
   * Get detailed answer review for candidate (if allowed)
   */
  static getAnswerReview(resultId) {
    const result = db.prepare(`
      SELECT r.*, a.allowReview, s.optionsMappingJson, s.randomizedOrderJson
      FROM results r
      JOIN assessments a ON r.assessmentId = a.id
      JOIN assessment_sessions s ON r.sessionId = s.id
      WHERE r.id = ? OR r.sessionId = ?
    `).get(resultId, resultId);

    if (!result) throw new Error('Result not found');
    if (!result.allowReview) throw new Error('Answer review is restricted for this assessment');

    const optionsMapping = JSON.parse(result.optionsMappingJson);
    const randomizedOrder = JSON.parse(result.randomizedOrderJson);

    const questions = db.prepare(`
      SELECT q.id, q.questionNumber, q.section, q.questionText, q.codeSnippet,
             q.correctOptionId, q.correctAnswerText, q.explanation, q.marks,
             sr.selectedOptionKey, sr.status as answerStatus, sr.isCorrect
      FROM questions q
      JOIN student_responses sr ON q.id = sr.questionId AND sr.sessionId = ?
      WHERE q.assessmentId = ?
    `).all(result.sessionId, result.assessmentId);

    const questionMap = {};
    questions.forEach(q => { questionMap[q.id] = q; });

    const reviewList = randomizedOrder.map((qId, idx) => {
      const q = questionMap[qId];
      const opts = optionsMapping[qId] || [];
      const selected = opts.find(o => o.key === q.selectedOptionKey);

      return {
        questionNumber: idx + 1,
        section: q.section,
        questionText: q.questionText,
        codeSnippet: q.codeSnippet,
        options: opts.map(o => ({
          key: o.key,
          label: o.label,
          text: o.text,
          isCorrect: o.originalId === q.correctOptionId,
          isSelected: o.key === q.selectedOptionKey
        })),
        userSelectedLabel: selected ? selected.label : 'Not Attempted',
        correctLabel: opts.find(o => o.originalId === q.correctOptionId)?.label || '',
        isCorrect: Boolean(q.isCorrect),
        explanation: q.explanation,
        marks: q.marks
      };
    });

    return {
      resultId: result.id,
      assessmentTitle: result.assessmentTitle,
      questions: reviewList
    };
  }
}

module.exports = AssessmentService;
