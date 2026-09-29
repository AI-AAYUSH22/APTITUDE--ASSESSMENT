const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NOW_REGION);
let dbPath;

if (isServerless) {
  dbPath = path.join('/tmp', 'assessment.db');
  const rootDbPath = path.join(__dirname, '..', 'assessment.db');
  if (!fs.existsSync(dbPath) && fs.existsSync(rootDbPath)) {
    try {
      fs.copyFileSync(rootDbPath, dbPath);
    } catch (e) {
      console.warn('Could not copy root database to /tmp:', e.message);
    }
  }
} else {
  dbPath = path.join(__dirname, '..', 'assessment.db');
}

const db = new Database(dbPath, { timeout: 10000 }); // 10s busy timeout for high concurrency

// Enable performance pragmas safely
try {
  if (!isServerless) {
    db.pragma('journal_mode = WAL');
  } else {
    db.pragma('journal_mode = DELETE');
  }
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000'); // 64MB cache
  db.pragma('foreign_keys = ON');
  db.pragma('temp_store = MEMORY');
} catch (pragmaErr) {
  console.warn('Pragma warning:', pragmaErr.message);
}

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      durationMinutes INTEGER DEFAULT 30,
      totalMarks INTEGER DEFAULT 30,
      passPercentage REAL DEFAULT 40.0,
      maxViolations INTEGER DEFAULT 3,
      instructionsJson TEXT,
      isActive INTEGER DEFAULT 1,
      allowReview INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      assessmentId TEXT NOT NULL,
      questionNumber INTEGER NOT NULL,
      section TEXT NOT NULL,
      questionText TEXT NOT NULL,
      codeSnippet TEXT,
      optionsJson TEXT NOT NULL,
      correctOptionId TEXT NOT NULL,
      correctAnswerText TEXT NOT NULL,
      explanation TEXT,
      marks REAL DEFAULT 1.0,
      negativeMarks REAL DEFAULT 0.0,
      difficulty TEXT DEFAULT 'Medium',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(assessmentId) REFERENCES assessments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS candidates (
      id TEXT PRIMARY KEY,
      fullName TEXT NOT NULL,
      email TEXT,
      organization TEXT,
      rollNumber TEXT NOT NULL UNIQUE,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assessment_sessions (
      id TEXT PRIMARY KEY,
      sessionToken TEXT NOT NULL UNIQUE,
      candidateId TEXT NOT NULL,
      assessmentId TEXT NOT NULL,
      status TEXT DEFAULT 'ACTIVE',
      startedAt INTEGER NOT NULL,
      expiresAt INTEGER NOT NULL,
      completedAt INTEGER,
      totalQuestions INTEGER NOT NULL,
      currentQuestionIndex INTEGER DEFAULT 1,
      randomizedOrderJson TEXT NOT NULL,
      optionsMappingJson TEXT NOT NULL,
      violationCount INTEGER DEFAULT 0,
      violationsLogJson TEXT DEFAULT '[]',
      FOREIGN KEY(candidateId) REFERENCES candidates(id),
      FOREIGN KEY(assessmentId) REFERENCES assessments(id)
    );

    CREATE TABLE IF NOT EXISTS student_responses (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL,
      candidateId TEXT NOT NULL,
      studentName TEXT NOT NULL,
      rollNumber TEXT NOT NULL,
      assessmentId TEXT NOT NULL,
      questionId TEXT NOT NULL,
      selectedOptionKey TEXT,
      selectedOptionText TEXT,
      originalOptionId TEXT,
      isCorrect INTEGER DEFAULT 0,
      status TEXT DEFAULT 'NOT_ANSWERED',
      answeredAt INTEGER,
      timeSpentSeconds INTEGER DEFAULT 0,
      FOREIGN KEY(sessionId) REFERENCES assessment_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY(questionId) REFERENCES questions(id)
    );

    CREATE TABLE IF NOT EXISTS results (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL UNIQUE,
      candidateId TEXT NOT NULL,
      studentName TEXT NOT NULL,
      rollNumber TEXT NOT NULL,
      assessmentId TEXT NOT NULL,
      totalQuestions INTEGER NOT NULL,
      attemptedCount INTEGER NOT NULL,
      correctCount INTEGER NOT NULL,
      incorrectCount INTEGER NOT NULL,
      unansweredCount INTEGER NOT NULL,
      score REAL NOT NULL,
      maxScore REAL NOT NULL,
      percentage REAL NOT NULL,
      passed INTEGER NOT NULL,
      timeTakenSeconds INTEGER NOT NULL,
      sectionBreakdownJson TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(sessionId) REFERENCES assessment_sessions(id),
      FOREIGN KEY(candidateId) REFERENCES candidates(id),
      FOREIGN KEY(assessmentId) REFERENCES assessments(id)
    );
  `);

  // Safe schema migrations
  try {
    const assessCols = db.prepare("PRAGMA table_info(assessments)").all().map(c => c.name);
    if (!assessCols.includes('maxViolations')) {
      db.prepare("ALTER TABLE assessments ADD COLUMN maxViolations INTEGER DEFAULT 3").run();
    }

    const sessionCols = db.prepare("PRAGMA table_info(assessment_sessions)").all().map(c => c.name);
    if (!sessionCols.includes('sessionToken')) {
      db.prepare("ALTER TABLE assessment_sessions ADD COLUMN sessionToken TEXT").run();
      db.exec("UPDATE assessment_sessions SET sessionToken = id WHERE sessionToken IS NULL");
    }
    if (!sessionCols.includes('currentQuestionIndex')) {
      db.prepare("ALTER TABLE assessment_sessions ADD COLUMN currentQuestionIndex INTEGER DEFAULT 1").run();
    }

    const resultsCols = db.prepare("PRAGMA table_info(results)").all().map(c => c.name);
    if (!resultsCols.includes('studentName')) {
      db.prepare("ALTER TABLE results ADD COLUMN studentName TEXT").run();
    }
    if (!resultsCols.includes('rollNumber')) {
      db.prepare("ALTER TABLE results ADD COLUMN rollNumber TEXT").run();
    }
    db.exec(`
      UPDATE results
      SET studentName = (SELECT fullName FROM candidates WHERE candidates.id = results.candidateId),
          rollNumber = (SELECT rollNumber FROM candidates WHERE candidates.id = results.candidateId)
      WHERE studentName IS NULL OR rollNumber IS NULL;
    `);
  } catch (err) {
    console.warn("Migration warning:", err.message);
  }

  // Ensure high-concurrency indexes
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_student_resp_session_q ON student_responses(sessionId, questionId);
    CREATE INDEX IF NOT EXISTS idx_student_resp_session ON student_responses(sessionId);
    CREATE INDEX IF NOT EXISTS idx_student_resp_candidate ON student_responses(candidateId);
    CREATE INDEX IF NOT EXISTS idx_student_resp_assessment ON student_responses(assessmentId);

    CREATE INDEX IF NOT EXISTS idx_results_ranking ON results(assessmentId, score DESC, timeTakenSeconds ASC, createdAt ASC);
    CREATE INDEX IF NOT EXISTS idx_results_candidate ON results(candidateId);
    CREATE INDEX IF NOT EXISTS idx_results_rollNumber ON results(rollNumber);
    CREATE INDEX IF NOT EXISTS idx_results_session ON results(sessionId);
    CREATE INDEX IF NOT EXISTS idx_results_score ON results(score);
    CREATE INDEX IF NOT EXISTS idx_results_createdAt ON results(createdAt);

    CREATE INDEX IF NOT EXISTS idx_candidates_roll ON candidates(rollNumber);
    CREATE INDEX IF NOT EXISTS idx_questions_assessment ON questions(assessmentId, questionNumber);
    CREATE INDEX IF NOT EXISTS idx_sessions_candidate ON assessment_sessions(candidateId, assessmentId, status);
  `);

  seedDefaultAssessments();
}

function seedDefaultAssessments() {
  const existingSetA = db.prepare('SELECT id FROM assessments WHERE id = ?').get('set-a');
  if (!existingSetA) {
    const insertAssessment = db.prepare(`
      INSERT INTO assessments (id, title, description, durationMinutes, totalMarks, passPercentage, maxViolations, instructionsJson, isActive, allowReview)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAssessment.run(
      'set-a',
      'Aptitude Assessment - Set A',
      'Comprehensive aptitude test evaluating Logical Reasoning, Basic Mathematics, and Data Structures & Algorithms.',
      30,
      30,
      40.0,
      3,
      JSON.stringify([
        "The test contains 30 multiple-choice questions across 3 sections.",
        "Section 1: Logical Reasoning (10 Marks, Q1-Q10)",
        "Section 2: Basic Mathematics (10 Marks, Q11-Q20)",
        "Section 3: DSA (Data Structures & Algorithms) (10 Marks, Q21-Q30)",
        "Each correct answer carries 1 mark. There is no negative marking.",
        "Total duration is 30 minutes with strict server-side synchronization.",
        "Do not switch tabs, exit fullscreen, or reload unprompted. Anti-cheat monitoring is active.",
        "Maximum of 3 violation warnings permitted before automated restricted submission.",
        "Once submitted or when the timer reaches 00:00, the test will be evaluated automatically."
      ]),
      1,
      1
    );

    insertAssessment.run(
      'set-b',
      'Aptitude Assessment - Set B',
      'Independent alternate aptitude test evaluating Logical Reasoning, Basic Mathematics, and Data Structures & Algorithms.',
      30,
      30,
      40.0,
      3,
      JSON.stringify([
        "The test contains 30 multiple-choice questions across 3 sections.",
        "Section 1: Logical Reasoning (10 Marks, Q1-Q10)",
        "Section 2: Basic Mathematics (10 Marks, Q11-Q20)",
        "Section 3: DSA (Data Structures & Algorithms) (10 Marks, Q21-Q30)",
        "Each correct answer carries 1 mark. There is no negative marking.",
        "Total duration is 30 minutes with strict server-side synchronization.",
        "Questions and answer options are uniquely randomized per candidate attempt.",
        "Maximum of 3 violation warnings permitted before automated restricted submission."
      ]),
      1,
      1
    );

    seedQuestionsFromFile('set-a', path.join(__dirname, '..', 'set_a_data.json'));
    seedQuestionsFromFile('set-b', path.join(__dirname, '..', 'set_b_data.json'));
    console.log('Successfully initialized database and seeded Set A & Set B assessments!');
  }

  const existingTeAiml = db.prepare('SELECT id FROM assessments WHERE id = ?').get('te-aiml');
  if (!existingTeAiml) {
    const insertAssessment = db.prepare(`
      INSERT INTO assessments (id, title, description, durationMinutes, totalMarks, passPercentage, maxViolations, instructionsJson, isActive, allowReview)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAssessment.run(
      'te-aiml',
      'TE AIML Engineering Aptitude Test',
      'Official examination for TE AIML Engineering students evaluating Logic and Reasoning, Basic Mathematics, and DSA.',
      60,
      30,
      40.0,
      3,
      JSON.stringify([
        "All questions carry 1 mark each. There is no negative marking.",
        "Total 30 multiple-choice questions across 3 sections (Logic & Reasoning, Basic Mathematics, DSA).",
        "Total test duration is 60 minutes with server-side synchronization.",
        "Use of calculators or electronic devices is not permitted.",
        "Anti-cheat monitoring is strictly active with automated restricted submission upon violations."
      ]),
      1,
      1
    );

    seedQuestionsFromFile('te-aiml', path.join(__dirname, '..', 'te_aiml_data.json'));
    console.log('Successfully seeded TE AIML Engineering Aptitude Test!');
  }
}

function seedQuestionsFromFile(assessmentId, filePath) {
  if (!fs.existsSync(filePath)) return;
  const questions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const insertQuestion = db.prepare(`
    INSERT INTO questions (
      id, assessmentId, questionNumber, section, questionText, codeSnippet,
      optionsJson, correctOptionId, correctAnswerText, explanation, marks, negativeMarks, difficulty
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items) => {
    for (const q of items) {
      const qId = `${assessmentId}-q${q.questionNumber}`;
      insertQuestion.run(
        qId,
        assessmentId,
        q.questionNumber,
        q.section,
        q.questionText,
        q.codeSnippet || null,
        JSON.stringify(q.options),
        q.correctOptionId,
        q.correctAnswerText,
        q.explanation || '',
        q.marks || 1.0,
        q.negativeMarks || 0.0,
        q.difficulty || 'Medium'
      );
    }
  });

  insertMany(questions);
}

initDb();

module.exports = db;
