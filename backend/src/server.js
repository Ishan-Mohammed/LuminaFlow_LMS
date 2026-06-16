import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { initDatabase, dbGet, dbRun, dbAll } from './db.js';
import { registerUser, loginUser, getMe, authenticateToken, requireRole } from './auth.js';
import { validateAssessment, verifyCourseCompletion } from './automation.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json());

// Auth Endpoints
app.post('/api/auth/signup', registerUser);
app.post('/api/auth/login', loginUser);
app.get('/api/auth/me', authenticateToken, getMe);

// Dedicated Mentor Login Endpoint
app.post('/api/auth/mentor-login', async (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name || !password) {
      return res.status(400).json({ error: 'Mentor Name and password are required.' });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'LUMINAFLOW_SUPER_SECRET_KEY_123';

    if (password !== '123456') {
      // Check if mentor exists and check password
      const user = await dbGet('SELECT * FROM users WHERE name = ? AND role = "mentor"', [name]);
      if (user) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
          return res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, selected_course_id: user.selected_course_id }
          });
        }
      }
      return res.status(400).json({ error: 'Invalid password. For demo access, please use 123456.' });
    }

    // Password is 123456 (Demo Access)
    let user = await dbGet('SELECT * FROM users WHERE name = ? AND role = "mentor"', [name]);
    if (!user) {
      // Auto-register the mentor
      const mentorId = crypto.randomUUID();
      const email = `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@luminaflow.com`;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123456', salt);
      const createdAt = new Date().toISOString();

      await dbRun(
        'INSERT INTO users (id, name, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        [mentorId, name, email, hashedPassword, 'mentor', createdAt]
      );
      user = { id: mentorId, name, email, role: 'mentor', selected_course_id: null };
    }

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      message: 'Mentor login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, selected_course_id: user.selected_course_id }
    });
  } catch (err) {
    console.error('Mentor login endpoint error:', err);
    res.status(500).json({ error: 'Server error during mentor authentication.' });
  }
});

// --- STUDENT ENDPOINTS ---

// Get student's roadmap / module progression list
app.get('/api/student/roadmap', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const userId = req.user.id;

    // Get selected_course_id and level first
    const user = await dbGet('SELECT selected_course_id, selected_bootcamp_level FROM users WHERE id = ?', [userId]);
    if (!user || !user.selected_course_id) {
      return res.json({ selectedCourse: null, selectedLevel: 'Beginner', roadmap: [] });
    }
    const bootcampLevel = user.selected_bootcamp_level || 'Beginner';

    // Get modules for this course and level, and left join progress
    const roadmap = await dbAll(
      `SELECT m.id, m.title, m.description, m.order_index, m.bootcamp_level,
              COALESCE(p.completed, 0) as completed,
              COALESCE(p.unlocked, 0) as unlocked,
              p.score, p.completed_at
       FROM modules m
       LEFT JOIN progress p ON m.id = p.module_id AND p.user_id = ?
       WHERE m.course_id = ? AND m.bootcamp_level = ?
       ORDER BY m.order_index ASC`,
      [userId, user.selected_course_id, bootcampLevel]
    );

    res.json({ selectedCourse: user.selected_course_id, selectedLevel: bootcampLevel, roadmap });
  } catch (err) {
    console.error('Error fetching roadmap:', err);
    res.status(500).json({ error: 'Failed to fetch roadmap status' });
  }
});

// Select / Onboard track course
app.post('/api/student/select-course', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId, bootcampLevel } = req.body;
    const level = bootcampLevel || 'Beginner';

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required.' });
    }

    // Verify course exists
    const course = await dbGet('SELECT * FROM courses WHERE id = ?', [courseId]);
    if (!course) {
      return res.status(404).json({ error: 'Selected track course not found.' });
    }

    // Update user selected course and level
    await dbRun('UPDATE users SET selected_course_id = ?, selected_bootcamp_level = ? WHERE id = ?', [courseId, level, userId]);

    // Clean previous progress
    await dbRun('DELETE FROM progress WHERE user_id = ?', [userId]);

    // Get modules in this course and level
    const modules = await dbAll('SELECT id, order_index FROM modules WHERE course_id = ? AND bootcamp_level = ? ORDER BY order_index ASC', [courseId, level]);

    // Seed progress milestones
    for (const mod of modules) {
      const unlocked = mod.order_index === 1 ? 1 : 0;
      const progressId = crypto.randomUUID();
      await dbRun(
        'INSERT INTO progress (id, user_id, module_id, completed, unlocked) VALUES (?, ?, ?, ?, ?)',
        [progressId, userId, mod.id, 0, unlocked]
      );
    }

    res.json({ message: 'Course registered and roadmap timeline generated successfully.' });
  } catch (err) {
    console.error('Error selecting course:', err);
    res.status(500).json({ error: 'Failed to complete course selection.' });
  }
});

// Select / Switch Bootcamp Level
app.post('/api/student/select-level', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { bootcampLevel } = req.body;

    if (!bootcampLevel || !['Beginner', 'Intermediate', 'Advanced'].includes(bootcampLevel)) {
      return res.status(400).json({ error: 'Invalid bootcamp level.' });
    }

    // Get student's current selected course
    const user = await dbGet('SELECT selected_course_id FROM users WHERE id = ?', [userId]);
    if (!user || !user.selected_course_id) {
      return res.status(400).json({ error: 'Please select a course first.' });
    }

    // Update level
    await dbRun('UPDATE users SET selected_bootcamp_level = ? WHERE id = ?', [bootcampLevel, userId]);

    // Clean previous progress
    await dbRun('DELETE FROM progress WHERE user_id = ?', [userId]);

    // Get modules in this course and level
    const modules = await dbAll('SELECT id, order_index FROM modules WHERE course_id = ? AND bootcamp_level = ? ORDER BY order_index ASC', [user.selected_course_id, bootcampLevel]);

    // Seed progress milestones
    for (const mod of modules) {
      const unlocked = mod.order_index === 1 ? 1 : 0;
      const progressId = crypto.randomUUID();
      await dbRun(
        'INSERT INTO progress (id, user_id, module_id, completed, unlocked) VALUES (?, ?, ?, ?, ?)',
        [progressId, userId, mod.id, 0, unlocked]
      );
    }

    res.json({ message: `Switched to ${bootcampLevel} level successfully.` });
  } catch (err) {
    console.error('Error selecting level:', err);
    res.status(500).json({ error: 'Failed to switch bootcamp level.' });
  }
});

// Get detailed module contents (only if unlocked)
app.get('/api/student/module/:id', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const userId = req.user.id;
    const moduleId = req.params.id;

    // Verify module is unlocked for the student
    const progress = await dbGet(
      'SELECT unlocked FROM progress WHERE user_id = ? AND module_id = ?',
      [userId, moduleId]
    );

    if (!progress || !progress.unlocked) {
      return res.status(403).json({ error: 'This module is locked. Complete the previous module quiz first.' });
    }

    const moduleData = await dbGet(
      'SELECT id, title, description, order_index, video_url, notes, resources FROM modules WHERE id = ?',
      [moduleId]
    );

    if (!moduleData) {
      return res.status(404).json({ error: 'Module not found' });
    }

    res.json({
      ...moduleData,
      resources: JSON.parse(moduleData.resources || '[]')
    });
  } catch (err) {
    console.error('Error fetching module:', err);
    res.status(500).json({ error: 'Failed to fetch module details' });
  }
});

// Get Quiz assessment for a module (exclude correct indices for security)
app.get('/api/student/quiz/:moduleId', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const userId = req.user.id;
    const moduleId = req.params.moduleId;

    // Verify module is unlocked
    const progress = await dbGet(
      'SELECT unlocked FROM progress WHERE user_id = ? AND module_id = ?',
      [userId, moduleId]
    );

    if (!progress || !progress.unlocked) {
      return res.status(403).json({ error: 'This assessment is locked.' });
    }

    const assessment = await dbGet(
      'SELECT id, module_id, questions, passing_score FROM assessments WHERE module_id = ?',
      [moduleId]
    );

    if (!assessment) {
      return res.status(404).json({ error: 'No assessment found for this module.' });
    }

    // Strip out correct answer index for student safety
    const parsedQuestions = JSON.parse(assessment.questions);
    const safeQuestions = parsedQuestions.map((q) => ({
      question: q.question,
      options: q.options
    }));

    res.json({
      id: assessment.id,
      module_id: assessment.module_id,
      passing_score: assessment.passing_score,
      questions: safeQuestions
    });
  } catch (err) {
    console.error('Error fetching quiz:', err);
    res.status(500).json({ error: 'Failed to retrieve assessment' });
  }
});

// Submit Quiz assessment answers
app.post('/api/student/quiz/:moduleId/submit', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const userId = req.user.id;
    const moduleId = req.params.moduleId;
    const { answers } = req.body; // Array of selected option indices

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Answers array is required' });
    }

    const result = await validateAssessment(userId, moduleId, answers);
    res.json(result);
  } catch (err) {
    console.error('Error submitting quiz:', err);
    res.status(500).json({ error: err.message || 'Failed to grade assessment' });
  }
});

// Submit Project
app.post('/api/student/project', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, githubLink, fileName } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Project title and description are required.' });
    }

    // Check if project already exists
    const existingProject = await dbGet('SELECT * FROM projects WHERE user_id = ?', [userId]);
    const submittedAt = new Date().toISOString();

    if (existingProject) {
      // Allow update if not approved (i.e. allows re-submitting rejected or editing pending)
      if (existingProject.status === 'approved') {
        return res.status(400).json({ error: 'Your project has already been approved and finalized.' });
      }

      await dbRun(
        'UPDATE projects SET title = ?, description = ?, github_link = ?, file_path = ?, status = "pending", feedback = NULL, submitted_at = ? WHERE user_id = ?',
        [title, description, githubLink || null, fileName || null, submittedAt, userId]
      );

      return res.json({ message: 'Project re-submitted successfully', status: 'pending' });
    } else {
      // Create new submission
      const projectId = crypto.randomUUID();
      await dbRun(
        'INSERT INTO projects (id, user_id, title, description, github_link, file_path, status, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [projectId, userId, title, description, githubLink || null, fileName || null, 'pending', submittedAt]
      );

      return res.status(201).json({ message: 'Project submitted successfully', status: 'pending' });
    }
  } catch (err) {
    console.error('Error submitting project:', err);
    res.status(500).json({ error: 'Failed to submit project' });
  }
});

// Get Student Project Status
app.get('/api/student/project', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const userId = req.user.id;
    const project = await dbGet('SELECT title, description, status, feedback, github_link, file_path, submitted_at, reviewed_at FROM projects WHERE user_id = ?', [userId]);
    res.json(project || null);
  } catch (err) {
    console.error('Error fetching project:', err);
    res.status(500).json({ error: 'Failed to get project status' });
  }
});

// Get Student Certificate
app.get('/api/student/certificate', authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await dbGet('SELECT selected_course_id, selected_bootcamp_level FROM users WHERE id = ?', [userId]);
    if (!user || !user.selected_course_id) {
      return res.json(null);
    }
    const bootcampLevel = user.selected_bootcamp_level || 'Beginner';
    const certificate = await dbGet(
      'SELECT certificate_code, issued_at, course_id, bootcamp_level FROM certificates WHERE user_id = ? AND course_id = ? AND bootcamp_level = ?',
      [userId, user.selected_course_id, bootcampLevel]
    );
    res.json(certificate || null);
  } catch (err) {
    console.error('Error fetching certificate:', err);
    res.status(500).json({ error: 'Failed to fetch certificate status' });
  }
});

// --- MENTOR ENDPOINTS ---

// View all students and their dynamic progress percentages
app.get('/api/mentor/students', authenticateToken, requireRole('mentor'), async (req, res) => {
  try {
    const students = await dbAll(
      `SELECT u.id, u.name, u.email, u.createdAt, u.selected_course_id,
              (SELECT COUNT(*) FROM progress p WHERE p.user_id = u.id AND p.completed = 1) as completedCount
       FROM users u
       WHERE u.role = 'student'
       ORDER BY u.name ASC`
    );

    const mappedStudents = await Promise.all(students.map(async (s) => {
      let totalCount = 4;
      let courseTitle = 'Not Onboarded';
      let currentModule = 'Not Onboarded';
      let completedModulesList = [];
      let assessmentScores = [];
      let project = null;
      let certificate = null;

      if (s.selected_course_id) {
        // Fetch course info
        const course = await dbGet('SELECT title FROM courses WHERE id = ?', [s.selected_course_id]);
        if (course) {
          courseTitle = course.title;
        }

        // Fetch modules and progress
        const roadmap = await dbAll(
          `SELECT m.id, m.title, m.description, m.order_index,
                  COALESCE(p.completed, 0) as completed,
                  COALESCE(p.unlocked, 0) as unlocked,
                  p.score, p.completed_at
           FROM modules m
           LEFT JOIN progress p ON m.id = p.module_id AND p.user_id = ?
           WHERE m.course_id = ?
           ORDER BY m.order_index ASC`,
          [s.id, s.selected_course_id]
        );

        totalCount = roadmap.length || 4;

        // Determine current module (first unlocked but uncompleted module)
        const activeMod = roadmap.find(m => m.unlocked && !m.completed);
        if (activeMod) {
          currentModule = activeMod.title;
        } else if (roadmap.length > 0 && roadmap.every(m => m.completed)) {
          currentModule = 'All Modules Completed';
        } else {
          currentModule = 'Not Started';
        }

        // Completed modules list
        completedModulesList = roadmap
          .filter(m => m.completed)
          .map(m => ({
            id: m.id,
            title: m.title,
            score: m.score,
            completed_at: m.completed_at
          }));

        // Assessment scores mapping
        assessmentScores = roadmap.map(m => ({
          moduleId: m.id,
          moduleTitle: m.title,
          score: m.score,
          completed: m.completed,
          unlocked: m.unlocked
        }));
      }

      // Fetch project
      const dbProject = await dbGet('SELECT * FROM projects WHERE user_id = ?', [s.id]);
      if (dbProject) {
        project = dbProject;
      }

      // Fetch certificate
      const dbCert = await dbGet('SELECT * FROM certificates WHERE user_id = ?', [s.id]);
      if (dbCert) {
        certificate = dbCert;
      }

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        joinedAt: s.createdAt,
        projectStatus: project?.status || 'none',
        progressPercent: totalCount > 0 ? Math.round((s.completedCount / totalCount) * 100) : 0,
        completedModules: s.completedCount,
        totalModules: totalCount,
        courseTitle,
        currentModule,
        completedModulesList,
        assessmentScores,
        project,
        certificate
      };
    }));

    res.json(mappedStudents);
  } catch (err) {
    console.error('Error getting mentor students:', err);
    res.status(500).json({ error: 'Failed to query students progress' });
  }
});


// View project submissions
app.get('/api/mentor/submissions', authenticateToken, requireRole('mentor'), async (req, res) => {
  try {
    const submissions = await dbAll(
      `SELECT p.id, p.user_id, p.title, p.description, p.github_link, p.file_path, p.status, p.feedback, p.submitted_at, p.reviewed_at,
              u.name as studentName, u.email as studentEmail
       FROM projects p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.submitted_at DESC`
    );

    res.json(submissions);
  } catch (err) {
    console.error('Error getting submissions:', err);
    res.status(500).json({ error: 'Failed to fetch project submissions' });
  }
});

// Review/Grade project submission
app.post('/api/mentor/submissions/:id/review', authenticateToken, requireRole('mentor'), async (req, res) => {
  try {
    const projectId = req.params.id;
    const { status, feedback } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be approved or rejected.' });
    }

    const project = await dbGet('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!project) {
      return res.status(404).json({ error: 'Project submission not found' });
    }

    const reviewedAt = new Date().toISOString();
    await dbRun(
      'UPDATE projects SET status = ?, feedback = ?, reviewed_at = ? WHERE id = ?',
      [status, feedback || '', reviewedAt, projectId]
    );

    // Automation Trigger: If approved, run course completion and potential certificate issuing logic
    let certificate = null;
    if (status === 'approved') {
      const completion = await verifyCourseCompletion(project.user_id);
      if (completion.completed) {
        certificate = completion.certificate;
      }
    }

    res.json({
      message: `Project status updated to ${status}`,
      projectStatus: status,
      certificateIssued: !!certificate,
      certificate
    });

  } catch (err) {
    console.error('Error reviewing project:', err);
    res.status(500).json({ error: 'Failed to process project review' });
  }
});

// Mentor Learning Analytics
app.get('/api/mentor/analytics', authenticateToken, requireRole('mentor'), async (req, res) => {
  try {
    const totalStudents = await dbGet('SELECT COUNT(*) as count FROM users WHERE role = "student"');
    const totalCertificates = await dbGet('SELECT COUNT(*) as count FROM certificates');
    const pendingReviews = await dbGet('SELECT COUNT(*) as count FROM projects WHERE status = "pending"');

    // Calculate dynamic completion rate: % of students with a generated certificate
    const studentsCount = totalStudents.count || 0;
    const certCount = totalCertificates.count || 0;
    const completionRate = studentsCount > 0 ? Math.round((certCount / studentsCount) * 100) : 0;

    // Build timeline charts data: count registrations per day or return sample stats
    const studentStats = await dbAll(
      `SELECT SUBSTR(createdAt, 1, 10) as date, COUNT(*) as count
       FROM users
       WHERE role = 'student'
       GROUP BY date
       ORDER BY date ASC`
    );

    res.json({
      activeStudents: studentsCount,
      completedCourses: certCount,
      pendingReviews: pendingReviews.count,
      completionRate,
      studentStats
    });

  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ error: 'Failed to load mentor telemetry metrics' });
  }
});

// Initialize database schema and seed data, then start the server
const start = async () => {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`LumionaFlow Backend service running on http://localhost:${PORT}`);
  });
};

start();

// Export for Vercel serverless
export default app;
