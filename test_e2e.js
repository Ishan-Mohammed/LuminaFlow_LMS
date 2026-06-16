import { initDatabase, dbGet, dbRun, dbAll } from './backend/src/db.js';

const BACKEND_URL = `${import.meta.env.VITE_BACKEND_URL}`;

async function runTest() {
  console.log('=== STARTING PROGRAMMATIC E2E INTEGRATION TEST ===');

  // Let's generate a unique email to avoid collisions
  const randNum = Math.floor(Math.random() * 100000);
  const studentEmail = `jordan.${randNum}@gmail.com`;
  const studentName = `Jordan Smith ${randNum}`;
  const password = 'password123';

  // 1. Sign up student
  console.log('\n[1] Registering student...');
  const signupRes = await fetch(`${BACKEND_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: studentName, email: studentEmail, password, role: 'student' })
  });
  const signupData = await signupRes.json();
  if (!signupRes.ok) {
    console.error('Signup failed:', signupData);
    process.exit(1);
  }
  console.log('Signup successful:', signupData.message);

  // 2. Log in student
  console.log('\n[2] Logging in student...');
  const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: studentEmail, password })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    console.error('Login failed:', loginData);
    process.exit(1);
  }
  const studentToken = loginData.token;
  const studentId = loginData.user.id;
  console.log('Login successful. Token acquired. Student ID:', studentId);

  // 3. Select Track
  console.log('\n[3] Selecting course track: course-ai-dev (AI Software Development)...');
  const selectRes = await fetch(`${BACKEND_URL}/api/student/select-course`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({ courseId: 'course-ai-dev' })
  });
  const selectData = await selectRes.json();
  if (!selectRes.ok) {
    console.error('Course selection failed:', selectData);
    process.exit(1);
  }
  console.log('Track enrolled successfully:', selectData.message);

  // 4. Fetch Roadmap
  console.log('\n[4] Retrieving student roadmap...');
  const roadmapRes = await fetch(`${BACKEND_URL}/api/student/roadmap`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const roadmapData = await roadmapRes.json();
  if (!roadmapRes.ok) {
    console.error('Roadmap fetch failed:', roadmapData);
    process.exit(1);
  }
  console.log('Roadmap retrieved successfully. Module count:', roadmapData.roadmap.length);
  roadmapData.roadmap.forEach((m, idx) => {
    console.log(`  - Mod ${idx + 1}: ${m.title} (unlocked: ${m.unlocked}, completed: ${m.completed})`);
  });

  // Let's pass all 4 modules by completing their quizzes to qualify for the certificate!
  for (let i = 0; i < roadmapData.roadmap.length; i++) {
    const mod = roadmapData.roadmap[i];
    console.log(`\n[5.${i + 1}] Grading checkpoint for module: ${mod.title}`);

    // Retrieve correct answers directly from database to bypass security check
    const assessment = await dbGet('SELECT * FROM assessments WHERE module_id = ?', [mod.id]);
    if (!assessment) {
      console.error(`No assessment found for module ${mod.id}`);
      process.exit(1);
    }
    const questions = JSON.parse(assessment.questions);
    const correctAnswers = questions.map(q => q.correctIndex);

    // Submit answers
    const submitRes = await fetch(`${BACKEND_URL}/api/student/quiz/${mod.id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ answers: correctAnswers })
    });
    const submitData = await submitRes.json();
    if (!submitRes.ok) {
      console.error(`Quiz submission failed for module ${mod.id}:`, submitData);
      process.exit(1);
    }
    console.log(`Quiz grading result: Score = ${submitData.score}%, Passed = ${submitData.passed}`);
  }

  // 5. Submit Capstone Project
  console.log('\n[6] Submitting Capstone Project...');
  const projectRes = await fetch(`${BACKEND_URL}/api/student/project`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      title: 'My AI Automation Pipeline',
      description: 'A custom RAG search system with Node.js API endpoints.',
      githubLink: 'https://github.com/jordansmith/my-ai-pipeline',
      fileName: 'capstone_rag_v1.zip'
    })
  });
  const projectData = await projectRes.json();
  if (!projectRes.ok) {
    console.error('Project submission failed:', projectData);
    process.exit(1);
  }
  console.log('Project submitted. Status is now:', projectData.status || 'pending');

  // 6. Mentor Login
  console.log('\n[7] Mentor Sarah Vance logging in...');
  const mentorLoginRes = await fetch(`${BACKEND_URL}/api/auth/mentor-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Sarah Vance', password: '123456' })
  });
  const mentorLoginData = await mentorLoginRes.json();
  if (!mentorLoginRes.ok) {
    console.error('Mentor login failed:', mentorLoginData);
    process.exit(1);
  }
  const mentorToken = mentorLoginData.token;
  console.log('Mentor login successful. Token acquired.');

  // 7. Get submissions to find our project ID
  console.log('\n[8] Mentor retrieving submissions queue...');
  const submissionsRes = await fetch(`${BACKEND_URL}/api/mentor/submissions`, {
    headers: { 'Authorization': `Bearer ${mentorToken}` }
  });
  const submissionsData = await submissionsRes.json();
  if (!submissionsRes.ok) {
    console.error('Failed to get submissions:', submissionsData);
    process.exit(1);
  }
  const mySubmission = submissionsData.find(sub => sub.user_id === studentId);
  if (!mySubmission) {
    console.error('Could not find submission for student:', studentId);
    process.exit(1);
  }
  console.log('Student submission found in mentor queue. ID:', mySubmission.id);

  // 8. Mentor Reviews Project
  console.log('\n[9] Mentor reviewing and approving project...');
  const reviewRes = await fetch(`${BACKEND_URL}/api/mentor/submissions/${mySubmission.id}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mentorToken}`
    },
    body: JSON.stringify({
      status: 'approved',
      feedback: 'Excellent code structure and clean RAG integration.'
    })
  });
  const reviewData = await reviewRes.json();
  if (!reviewRes.ok) {
    console.error('Project review failed:', reviewData);
    process.exit(1);
  }
  console.log('Project review submitted successfully:', reviewData.message);
  console.log('Certificate issued status:', reviewData.certificateIssued);

  // 9. Fetch Certificate as Student
  console.log('\n[10] Student retrieving final certificate...');
  const certRes = await fetch(`${BACKEND_URL}/api/student/certificate`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const certData = await certRes.json();
  if (!certRes.ok) {
    console.error('Failed to fetch certificate:', certData);
    process.exit(1);
  }
  console.log('Certificate retrieved successfully!');
  console.log('  - Certificate Code:', certData.certificate_code);
  console.log('  - Issued At:', certData.issued_at);

  console.log('\n=== ALL TEST STEPS PASSED SUCCESSFULLY! ===');
  process.exit(0);
}

runTest().catch(err => {
  console.error('Unhandled error in E2E test:', err);
  process.exit(1);
});
