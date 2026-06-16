import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Promisified database functions
export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

export const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Initialize Tables and Seed Data
export const initDatabase = async () => {
  try {
    // 1. Users
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('student', 'mentor')) NOT NULL,
        createdAt TEXT NOT NULL,
        selected_course_id TEXT
      )
    `);

    // Run migrations to ensure columns exist
    try {
      await dbRun('ALTER TABLE users ADD COLUMN selected_course_id TEXT');
      console.log('Migration: Added selected_course_id column to users.');
    } catch (e) {
      // Column already exists
    }

    // 2. Courses
    await dbRun(`
      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        track TEXT NOT NULL
      )
    `);

    // 3. Modules
    await dbRun(`
      CREATE TABLE IF NOT EXISTS modules (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        video_url TEXT,
        notes TEXT,
        resources TEXT,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
      )
    `);

    // 4. Assessments
    await dbRun(`
      CREATE TABLE IF NOT EXISTS assessments (
        id TEXT PRIMARY KEY,
        module_id TEXT UNIQUE NOT NULL,
        questions TEXT NOT NULL, -- JSON string representing quiz questions
        passing_score INTEGER NOT NULL DEFAULT 70,
        FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
      )
    `);

    // 5. Progress
    await dbRun(`
      CREATE TABLE IF NOT EXISTS progress (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        module_id TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        unlocked INTEGER NOT NULL DEFAULT 0,
        score INTEGER,
        completed_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
        UNIQUE(user_id, module_id)
      )
    `);

    // 6. Projects
    await dbRun(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        github_link TEXT,
        file_path TEXT,
        status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) NOT NULL DEFAULT 'pending',
        feedback TEXT,
        submitted_at TEXT NOT NULL,
        reviewed_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Migrations for projects table
    try {
      await dbRun('ALTER TABLE projects ADD COLUMN github_link TEXT');
      console.log('Migration: Added github_link column to projects.');
    } catch (e) {}
    try {
      await dbRun('ALTER TABLE projects ADD COLUMN file_path TEXT');
      console.log('Migration: Added file_path column to projects.');
    } catch (e) {}

    // 7. Certificates
    await dbRun(`
      CREATE TABLE IF NOT EXISTS certificates (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        certificate_code TEXT UNIQUE NOT NULL,
        issued_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Additional migrations for level-based curriculum
    try {
      await dbRun('ALTER TABLE users ADD COLUMN selected_bootcamp_level TEXT DEFAULT "Beginner"');
      console.log('Migration: Added selected_bootcamp_level column to users.');
    } catch (e) {}

    try {
      await dbRun('ALTER TABLE modules ADD COLUMN bootcamp_level TEXT DEFAULT "Beginner"');
      console.log('Migration: Added bootcamp_level column to modules.');
    } catch (e) {}

    try {
      await dbRun('ALTER TABLE certificates ADD COLUMN course_id TEXT');
      console.log('Migration: Added course_id column to certificates.');
    } catch (e) {}

    try {
      await dbRun('ALTER TABLE certificates ADD COLUMN bootcamp_level TEXT');
      console.log('Migration: Added bootcamp_level column to certificates.');
    } catch (e) {}

    console.log('Database tables verified/created successfully.');

    // Seed Data
    await seedData();

    // Upgrade quiz questions with module-specific content (runs on every server start)
    await upgradeQuizQuestions();

  } catch (err) {
    console.error('Error during database initialization:', err);
  }
};

const seedData = async () => {
  // Check if seeding is already done (we expect 48 modules in total)
  const moduleCount = await dbGet('SELECT COUNT(*) as count FROM modules');
  if (moduleCount.count === 48) {
    console.log('Database already has seeded 48 level-based modules. Skipping seed.');
    return;
  }

  console.log('Clearing old modules/assessments and seeding new level-based initial data...');
  // Clean old module-related records to avoid constraint violations
  await dbRun('DELETE FROM progress');
  await dbRun('DELETE FROM assessments');
  await dbRun('DELETE FROM modules');
  await dbRun('DELETE FROM courses');

  // 1. Seed Users (if not exists)
  const studentSalt = await bcrypt.genSalt(10);
  const studentHashedPassword = await bcrypt.hash('password123', studentSalt);
  const mentorSalt = await bcrypt.genSalt(10);
  const mentorHashedPassword = await bcrypt.hash('password123', mentorSalt);

  const studentId = 'student-uuid-001';
  const mentorId = 'mentor-uuid-001';

  await dbRun(
    'INSERT OR IGNORE INTO users (id, name, email, password, role, createdAt, selected_course_id, selected_bootcamp_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [studentId, 'Alex Mercer', 'student@luminaflow.com', studentHashedPassword, 'student', new Date().toISOString(), null, 'Beginner']
  );

  await dbRun(
    'INSERT OR IGNORE INTO users (id, name, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
    [mentorId, 'Dr. Sarah Vance', 'mentor@luminaflow.com', mentorHashedPassword, 'mentor', new Date().toISOString()]
  );

  // 2. Seed 4 Courses/Tracks
  const courses = [
    {
      id: 'course-ai-foundations',
      title: 'AI Foundations',
      description: 'Master the building blocks of artificial intelligence, basic algorithms, tools, and social implications.',
      track: 'AI & Data Science'
    },
    {
      id: 'course-ai-content',
      title: 'AI Content Creation',
      description: 'Learn content strategies, prompt engineering guidelines, visual asset design, and text optimizations.',
      track: 'AI Marketing & Design'
    },
    {
      id: 'course-ai-dev',
      title: 'AI Software Development',
      description: 'Build complete applications using LLM API integrations, vector indexes, and cloud hosting deploy setups.',
      track: 'AI Software Engineering'
    },
    {
      id: 'course-agentic-auto',
      title: 'Agentic Automation',
      description: 'Design autonomous agents, trigger state machines, and build resilient commercial business automations.',
      track: 'DevOps & Process Automation'
    }
  ];

  for (const c of courses) {
    await dbRun(
      'INSERT INTO courses (id, title, description, track) VALUES (?, ?, ?, ?)',
      [c.id, c.title, c.description, c.track]
    );
  }

  // 3. Level-specific modules definitions
  const courseLevelsModules = {
    'course-ai-foundations': {
      'Beginner': [
        'Understanding Artificial Intelligence',
        'Introduction to Prompt Engineering',
        'Exploring Popular AI Tools',
        'Fundamentals Assessment'
      ],
      'Intermediate': [
        'Machine Learning Concepts',
        'LLM Workflows and Applications',
        'AI Problem Solving Projects',
        'Intermediate Assessment'
      ],
      'Advanced': [
        'Advanced AI Systems',
        'Model Evaluation and Optimization',
        'Enterprise AI Use Cases',
        'Advanced Capstone Assessment'
      ]
    },
    'course-ai-content': {
      'Beginner': [
        'Fundamentals of Content Creation',
        'AI Writing Tools',
        'Basic Image Generation',
        'Beginner Assessment'
      ],
      'Intermediate': [
        'Prompt Engineering for Content',
        'Multimedia Content Production',
        'Content Automation Workflows',
        'Intermediate Assessment'
      ],
      'Advanced': [
        'Brand Content Systems',
        'Video and Visual AI Pipelines',
        'Multi-Platform Publishing Automation',
        'Advanced Capstone Assessment'
      ]
    },
    'course-ai-dev': {
      'Beginner': [
        'AI Development Basics',
        'Introduction to APIs',
        'AI Coding Assistants',
        'Beginner Assessment'
      ],
      'Intermediate': [
        'AI Integration Projects',
        'Working with APIs',
        'GitHub Collaboration',
        'Intermediate Assessment'
      ],
      'Advanced': [
        'Full Stack AI Applications',
        'Production Deployment',
        'Scalable AI Systems',
        'Advanced Capstone Assessment'
      ]
    },
    'course-agentic-auto': {
      'Beginner': [
        'Introduction to Automation',
        'Workflow Fundamentals',
        'Basic AI Agents',
        'Beginner Assessment'
      ],
      'Intermediate': [
        'Multi-Step Workflows',
        'Tool Calling Systems',
        'Agent Collaboration',
        'Intermediate Assessment'
      ],
      'Advanced': [
        'Autonomous Agent Architectures',
        'Enterprise Automation Frameworks',
        'End-to-End Automation Projects',
        'Advanced Capstone Assessment'
      ]
    }
  };

  // 4. Seeding loop for Modules and Assessments
  for (const [courseId, levels] of Object.entries(courseLevelsModules)) {
    for (const [level, moduleTitles] of Object.entries(levels)) {
      for (let index = 0; index < moduleTitles.length; index++) {
        const title = `Module ${index + 1}: ${moduleTitles[index]}`;
        const shortTitle = moduleTitles[index];
        const courseShort = courseId.replace('course-', '');
        const levelShort = level.substring(0, 3).toLowerCase();
        const moduleId = `mod-${courseShort}-${levelShort}-${index + 1}`;
        
        const description = `Learn the core requirements, design architectures, and implementation patterns for ${shortTitle}.`;
        const video_url = 'https://www.w3schools.com/html/mov_bbb.mp4';
        const notes = `# ${title}
Welcome to ${courses.find(c => c.id === courseId).title} (${level} Level).
In this module, we will explore:
- Essential concepts of ${shortTitle}
- Key terminology and standard methodologies
- Practical exercises and verification steps.`;
        const resources = JSON.stringify([
          { name: `${shortTitle} Documentation`, url: 'https://wikipedia.org' }
        ]);

        await dbRun(
          'INSERT INTO modules (id, course_id, title, description, order_index, video_url, notes, resources, bootcamp_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [moduleId, courseId, title, description, index + 1, video_url, notes, resources, level]
        );

        // Generate dynamic questions based on Course, Level, and Module
        const difficulty = level === 'Beginner' ? 'Easy' : level === 'Intermediate' ? 'Moderate' : 'Challenging';
        const questions = [
          {
            question: `[${difficulty}] In the context of ${shortTitle}, what is the primary concept?`,
            options: [`The correct answer for ${shortTitle}`, `An invalid definition for ${shortTitle}`, 'A general unrelated concept', 'None of the above'],
            correctIndex: 0
          },
          {
            question: `[${difficulty}] Which of the following is a key requirement of ${shortTitle}?`,
            options: ['An obsolete approach', `The main requirement of ${shortTitle}`, 'A secondary layout optimization', 'A non-functional constraint'],
            correctIndex: 1
          },
          {
            question: `[${difficulty}] How is the implementation of ${shortTitle} typically verified?`,
            options: ['Using deprecated third-party logs', 'By omitting check assertions', `Through standard ${shortTitle} test checkpoints`, 'By resetting server dependencies'],
            correctIndex: 2
          }
        ];

        await dbRun(
          'INSERT INTO assessments (id, module_id, questions, passing_score) VALUES (?, ?, ?, ?)',
          [`quiz-${courseShort}-${levelShort}-${index + 1}`, moduleId, JSON.stringify(questions), 70]
        );
      }
    }
  }

  console.log('Database seeded successfully with 4 Tracks, 48 Level-based Modules and Quizzes.');
};

const upgradeQuizQuestions = async () => {
  console.log('Quiz questions handled directly during seeding.');
};
