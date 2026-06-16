import crypto from 'crypto';
import { dbGet, dbRun, dbAll } from './db.js';

/**
 * Automates unlocking the next module in sequence for a student.
 */
export const unlockNextModule = async (userId, currentModuleId) => {
  try {
    // Get current module's order_index, course_id, AND bootcamp_level
    const currentModule = await dbGet('SELECT order_index, course_id, bootcamp_level FROM modules WHERE id = ?', [currentModuleId]);
    if (!currentModule) return;

    // Find next module within the SAME course and SAME bootcamp_level
    const nextModule = await dbGet(
      'SELECT id FROM modules WHERE course_id = ? AND bootcamp_level = ? AND order_index = ?',
      [currentModule.course_id, currentModule.bootcamp_level, currentModule.order_index + 1]
    );

    if (nextModule) {
      // Unlock the next module in progress
      const existingProgress = await dbGet(
        'SELECT id FROM progress WHERE user_id = ? AND module_id = ?',
        [userId, nextModule.id]
      );

      if (existingProgress) {
        await dbRun(
          'UPDATE progress SET unlocked = 1 WHERE user_id = ? AND module_id = ?',
          [userId, nextModule.id]
        );
      } else {
        await dbRun(
          'INSERT INTO progress (id, user_id, module_id, completed, unlocked) VALUES (?, ?, ?, 0, 1)',
          [crypto.randomUUID(), userId, nextModule.id]
        );
      }
      console.log(`Automation: Unlocked module ${nextModule.id} for user ${userId}`);
    } else {
      console.log(`Automation: User ${userId} has completed the final module quiz.`);
    }
  } catch (err) {
    console.error('Error in unlockNextModule automation:', err);
  }
};

/**
 * Verifies if all criteria are met for course completion and generates certificate.
 * Conditions:
 * 1. All modules in the course level are completed (progress.completed = 1)
 * 2. Assessment scores are logged
 * 3. A project has been submitted and approved (projects.status = 'approved')
 */
export const verifyCourseCompletion = async (userId) => {
  try {
    // Get the student's selected course and selected bootcamp level
    const user = await dbGet('SELECT selected_course_id, selected_bootcamp_level FROM users WHERE id = ?', [userId]);
    if (!user || !user.selected_course_id) {
      return { completed: false, reason: 'No course selected' };
    }
    const bootcampLevel = user.selected_bootcamp_level || 'Beginner';

    // 1. Check modules completion count for this specific course and bootcamp level
    const totalModules = await dbGet(
      'SELECT COUNT(*) as count FROM modules WHERE course_id = ? AND bootcamp_level = ?',
      [user.selected_course_id, bootcampLevel]
    );
    const completedProgress = await dbGet(
      `SELECT COUNT(*) as count FROM progress p
       JOIN modules m ON p.module_id = m.id
       WHERE p.user_id = ? AND p.completed = 1 AND m.course_id = ? AND m.bootcamp_level = ?`,
      [userId, user.selected_course_id, bootcampLevel]
    );

    if (completedProgress.count < totalModules.count) {
      console.log(`Automation: User ${userId} has not completed all modules for ${user.selected_course_id} at ${bootcampLevel} level (${completedProgress.count}/${totalModules.count})`);
      return { completed: false, reason: 'Pending module completion' };
    }

    // 2. Check if a project is approved
    const approvedProject = await dbGet(
      'SELECT * FROM projects WHERE user_id = ? AND status = "approved"',
      [userId]
    );

    if (!approvedProject) {
      console.log(`Automation: User ${userId} does not have an approved project`);
      return { completed: false, reason: 'Pending project approval' };
    }

    // 3. Check if certificate already exists for this level
    const existingCert = await dbGet(
      'SELECT * FROM certificates WHERE user_id = ? AND course_id = ? AND bootcamp_level = ?',
      [userId, user.selected_course_id, bootcampLevel]
    );
    if (existingCert) {
      console.log(`Automation: Certificate already exists for user ${userId} at ${bootcampLevel} level`);
      return { completed: true, certificate: existingCert };
    }

    // 4. Generate Certificate
    const certificateId = crypto.randomUUID();
    const certCode = 'LUMINA-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const issuedAt = new Date().toISOString();

    await dbRun(
      'INSERT INTO certificates (id, user_id, certificate_code, issued_at, course_id, bootcamp_level) VALUES (?, ?, ?, ?, ?, ?)',
      [certificateId, userId, certCode, issuedAt, user.selected_course_id, bootcampLevel]
    );

    console.log(`Automation: Generated certificate ${certCode} for user ${userId} at ${bootcampLevel} level`);
    const newCert = { id: certificateId, user_id: userId, certificate_code: certCode, issued_at: issuedAt, course_id: user.selected_course_id, bootcamp_level: bootcampLevel };
    return {
      completed: true,
      certificate: newCert
    };

  } catch (err) {
    console.error('Error in verifyCourseCompletion automation:', err);
    return { completed: false, error: err.message };
  }
};

/**
 * Validates quiz answers and updates progress.
 */
export const validateAssessment = async (userId, moduleId, submittedAnswers) => {
  try {
    // Get the assessment
    const assessment = await dbGet('SELECT * FROM assessments WHERE module_id = ?', [moduleId]);
    if (!assessment) {
      throw new Error('No assessment found for this module');
    }

    const questions = JSON.parse(assessment.questions);
    let correctCount = 0;

    questions.forEach((q, index) => {
      if (submittedAnswers[index] !== undefined && submittedAnswers[index] === q.correctIndex) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= assessment.passing_score;

    // Retrieve previous progress record
    const progress = await dbGet(
      'SELECT * FROM progress WHERE user_id = ? AND module_id = ?',
      [userId, moduleId]
    );

    if (!progress) {
      throw new Error('User progress record not initialized');
    }

    if (!progress.unlocked) {
      throw new Error('This module is locked');
    }

    // Save score and completion status
    const completed = passed ? 1 : progress.completed; // Retain completed if already completed
    const completedAt = (passed && !progress.completed) ? new Date().toISOString() : progress.completed_at;

    await dbRun(
      'UPDATE progress SET score = ?, completed = ?, completed_at = ? WHERE user_id = ? AND module_id = ?',
      [score, completed, completedAt, userId, moduleId]
    );

    // If passed, trigger unlocking the next module
    if (passed) {
      await unlockNextModule(userId, moduleId);
      // Re-run completion checks in case project is already approved
      await verifyCourseCompletion(userId);
    }

    return {
      passed,
      score,
      correctCount,
      totalQuestions: questions.length,
      passingScore: assessment.passing_score
    };

  } catch (err) {
    console.error('Error in validateAssessment:', err);
    throw err;
  }
};
