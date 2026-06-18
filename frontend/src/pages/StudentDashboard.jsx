import React, { useState, useEffect } from 'react';
import { Play, FileText, CheckCircle2, Lock, Sparkles, Award, ClipboardCheck, ArrowRight, LogOut, Loader2, Compass, Check, AlertCircle, FileSpreadsheet, Printer, Flame, GitBranch, FolderArchive, LayoutDashboard, BookOpen, Target, Trophy, ChevronRight, Clock } from 'lucide-react';

const CATALOG_TRACKS = [
  {
    id: 'course-ai-foundations',
    title: 'AI Foundations',
    subtitle: 'AI & Data Science',
    duration: '4 Modules · ~8 hrs',
    description: 'Master artificial intelligence fundamentals — from Turing tests to machine learning, AI tools, and ethical considerations.',
    outcomes: [
      'Understand Turing tests and AI heuristics',
      'Master supervised/unsupervised machine learning concepts',
      'Build semantic search systems using LLM embeddings',
      'Analyze alignment risks and global AI ethical frameworks'
    ],
    modules: [
      { title: 'Module 1: Introduction to Artificial Intelligence', desc: 'Explore the history of intelligence, neural weights, and standard expert systems.' },
      { title: 'Module 2: Machine Learning Fundamentals', desc: 'Understand regression, decision trees, backpropagation, and loss functions.' },
      { title: 'Module 3: AI Tools and Applications', desc: 'Experiment with modern LLMs, embedding models, and vector stores.' },
      { title: 'Module 4: AI Ethics and Future Trends', desc: 'Examine copyright, data privacy safeguards, bias, and neural alignment trends.' }
    ]
  },
  {
    id: 'course-ai-content',
    title: 'AI Content Creation',
    subtitle: 'AI Marketing & Design',
    duration: '4 Modules · ~7 hrs',
    description: 'Learn content strategies, AI-powered writing, visual asset creation, and automated publishing workflows.',
    outcomes: [
      'Construct SEO strategy structures and user personas',
      'Write automated marketing copy loops using LLMs',
      'Create multimedia visual layouts using image diffusion weights',
      'Setup CTR A/B testing and automated publishing schedules'
    ],
    modules: [
      { title: 'Module 1: Content Strategy Fundamentals', desc: 'Pillars of copy strategies, SEO keyword tracking, and persona targeting.' },
      { title: 'Module 2: AI-Powered Content Generation', desc: 'Automating high-quality copywriting, blog drafts, and structured email pipelines.' },
      { title: 'Module 3: Visual and Multimedia Content Creation', desc: 'Design images, scripts, and video mockups using text-to-image engines.' },
      { title: 'Module 4: Content Optimization and Publishing', desc: 'Analytics score telemetry, automated publishing slots, and metrics tracking.' }
    ]
  },
  {
    id: 'course-ai-dev',
    title: 'AI Software Development',
    subtitle: 'AI Software Engineering',
    duration: '4 Modules · ~10 hrs',
    description: 'Build complete applications using LLM API integrations, vector indexes, and cloud hosting deploy setups.',
    outcomes: [
      'Setup Node/Python API security environments',
      'Build streaming chat interfaces and function calling triggers',
      'Design Retrieval-Augmented Generation (RAG) applications',
      'Containerize applications using Docker and serverless deployment structures'
    ],
    modules: [
      { title: 'Module 1: Introduction to AI Development', desc: 'API authentications, package installations, and developer environments.' },
      { title: 'Module 2: APIs and AI Integrations', desc: 'Streaming completions, structured outputs, function calling mechanisms.' },
      { title: 'Module 3: Building AI Applications', desc: 'Implement Retrieval-Augmented Generation (RAG) and vector database connections.' },
      { title: 'Module 4: Deployment and Project Development', desc: 'Docker setups, serverless deployment configurations, and runtime telemetry.' }
    ]
  },
  {
    id: 'course-agentic-auto',
    title: 'Agentic Automation',
    subtitle: 'DevOps & Process Automation',
    duration: '4 Modules · ~9 hrs',
    description: 'Design autonomous agents, trigger state machines, and build resilient commercial business automations.',
    outcomes: [
      'Design webhook listeners and data payload transform pipelines',
      'Master ReAct reasoning loop prompts and agent architectures',
      'Orchestrate multi-step self-healing process execution streams',
      'Implement real-time alert logs and production telemetry adapters'
    ],
    modules: [
      { title: 'Module 1: Introduction to Automation Systems', desc: 'Event webhooks, API polling systems, and workflow structure logic.' },
      { title: 'Module 2: Workflow Design and Automation', desc: 'Trigger actions, data format transformations, and multi-step pipeline scripts.' },
      { title: 'Module 3: AI Agents and Decision Making', desc: 'Agentic feedback loops, tool selection patterns, and error recovery tracks.' },
      { title: 'Module 4: End-to-End Automation Projects', desc: 'Establish complete automated databases, telemetry alerts, and final deployment.' }
    ]
  }
];

export default function StudentDashboard({ token, user, onLogout, backendUrl, theme, toggleTheme, onNavigateToAbout, onNavigate }) {
  // ── State (unchanged) ──────────────────────────────────────────
  const [roadmap, setRoadmap] = useState([]);
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' | 'catalog' | 'project'
  const [expandedCatalogIdx, setExpandedCatalogIdx] = useState(0);
  const [activeModuleId, setActiveModuleId] = useState('');
  const [activeModuleDetails, setActiveModuleDetails] = useState(null);
  const [activeLevel, setActiveLevel] = useState(user?.selected_bootcamp_level || 'Beginner');

  const [project, setProject] = useState(null);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [fileName, setFileName] = useState('');

  const [certificate, setCertificate] = useState(null);

  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);

  const [loadingRoadmap, setLoadingRoadmap] = useState(true);
  const [loadingModule, setLoadingModule] = useState(false);
  const [submittingProject, setSubmittingProject] = useState(false);
  const [error, setError] = useState('');

  const learningStreak = 4;

  const completedCount = roadmap.filter(m => m.completed).length;
  const unlockedCount = roadmap.filter(m => m.unlocked && !m.completed).length;
  const totalCount = roadmap.length || 1;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // ── API Calls (unchanged) ──────────────────────────────────────
  const apiFetch = async (endpoint, options = {}) => {
    const url = `${import.meta.env.VITE_BACKEND_URL}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };
    const res = await fetch(url, { ...options, headers });
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json() : null;

    if (!res.ok) {
      const errorMsg = (data && data.error) || `Server error (${res.status})`;
      throw new Error(errorMsg);
    }
    return data;
  };

  const fetchRoadmap = async () => {
    try {
      const data = await apiFetch('/api/student/roadmap');
      setRoadmap(data.roadmap || []);
      if (data.selectedLevel) {
        setActiveLevel(data.selectedLevel);
        user.selected_bootcamp_level = data.selectedLevel;
      }
      const rList = data.roadmap || [];
      if (rList.length > 0 && !activeModuleId) {
        const firstActive = rList.find(m => m.unlocked && !m.completed) || rList.find(m => m.unlocked) || rList[0];
        setActiveModuleId(firstActive.id);
      }
    } catch (err) { setError(err.message); }
    finally { setLoadingRoadmap(false); }
  };

  const handleLevelSwitch = async (newLvl) => {
    setError('');
    setLoadingRoadmap(true);
    try {
      await apiFetch('/api/student/select-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bootcampLevel: newLvl }),
      });
      user.selected_bootcamp_level = newLvl;
      setActiveLevel(newLvl);
      setActiveModuleId('');
      setActiveModuleDetails(null);
      await fetchRoadmap();
      // Fetch certificates mapping for this new level
      try {
        const certData = await apiFetch('/api/student/certificate');
        setCertificate(certData);
      } catch (certErr) {
        setCertificate(null);
      }
    } catch (err) {
      setError(err.message);
      setLoadingRoadmap(false);
    }
  };

  const fetchModuleDetails = async (id) => {
    if (!id) return;
    setLoadingModule(true); setError('');
    try {
      const data = await apiFetch(`/api/student/module/${id}`);
      setActiveModuleDetails(data);
    } catch (err) { setError(err.message); setActiveModuleDetails(null); }
    finally { setLoadingModule(false); }
  };

  const fetchProjectStatus = async () => {
    try {
      const data = await apiFetch('/api/student/project');
      if (data) setProject(data);
    } catch (err) { console.error('Project query error:', err); }
  };

  const fetchCertificate = async () => {
    try {
      const data = await apiFetch('/api/student/certificate');
      if (data) setCertificate(data);
    } catch (err) { console.error('Certificate query error:', err); }
  };

  useEffect(() => { fetchRoadmap(); fetchProjectStatus(); fetchCertificate(); }, [token]);
  useEffect(() => { if (activeModuleId) fetchModuleDetails(activeModuleId); }, [activeModuleId]);

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    if (!newProjectTitle.trim() || !newProjectDesc.trim()) { setError('Please fill out project title and description.'); return; }
    setSubmittingProject(true); setError('');
    try {
      await apiFetch('/api/student/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newProjectTitle, description: newProjectDesc, githubLink, fileName }),
      });
      setProject({ title: newProjectTitle, description: newProjectDesc, github_link: githubLink, file_path: fileName, status: 'pending' });
      setNewProjectTitle(''); setNewProjectDesc(''); setGithubLink(''); setFileName('');
    } catch (err) { setError(err.message); }
    finally { setSubmittingProject(false); }
  };

  const handleStartQuiz = async () => {
    setError('');
    try {
      const data = await apiFetch(`/api/student/quiz/${activeModuleId}`);
      setQuizData(data); setQuizAnswers({}); setQuizResult(null); setShowQuizModal(true);
    } catch (err) { setError(err.message); }
  };

  const handleQuizSubmit = async () => {
    const totalQuestions = quizData.questions.length;
    const answersArray = [];
    for (let i = 0; i < totalQuestions; i++) answersArray.push(quizAnswers[i] !== undefined ? quizAnswers[i] : -1);
    try {
      const data = await apiFetch(`/api/student/quiz/${activeModuleId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersArray }),
      });
      setQuizResult(data); fetchRoadmap(); fetchCertificate();
    } catch (err) { setError(err.message); }
  };

  const confettiColors = ['#7C3AED', '#06B6D4', '#FBBF24', '#F43F5E', '#10B981', '#A78BFA'];

  // ── Active module info ─────────────────────────────────────────
  const activeModuleRoadmapData = roadmap.find(m => m.id === activeModuleId);

  // ── Sidebar nav items ──────────────────────────────────────────
  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, action: null },
    { label: 'About Project', icon: FileText, action: 'about' },
  ];

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#070B14', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Confetti ──────────────────────────────────────────────── */}
      {certificate && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
          {[...Array(60)].map((_, i) => (
            <div key={i} className="confetti-piece" style={{
              left: `${(i * 1.67) % 98}%`,
              backgroundColor: confettiColors[i % confettiColors.length],
              animationDelay: `${(i * 0.07) % 4}s`,
              animationDuration: `${3 + (i % 3)}s`,
              borderRadius: i % 2 === 0 ? '50%' : '2px',
            }} />
          ))}
        </div>
      )}

      {/* ── Ambient BG ────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-[40vw] h-[40vw] rounded-full opacity-10 animate-float"
          style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)', filter: 'blur(120px)' }} />
        <div className="absolute bottom-0 right-0 w-[35vw] h-[35vw] rounded-full opacity-8 animate-float-slow"
          style={{ background: 'radial-gradient(circle, #06B6D4 0%, transparent 70%)', filter: 'blur(100px)' }} />
      </div>

      {/* ═══════════════════ SIDEBAR ══════════════════════════════ */}
      <aside className="relative z-20 w-72 shrink-0 flex flex-col lg:sticky lg:top-0 lg:h-screen hidden lg:flex"
        style={{ background: 'rgba(13, 17, 23, 0.9)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="p-2.5 rounded-xl" style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', boxShadow: '0 0 20px rgba(124,58,237,0.35)' }}>
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm text-white tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>LumionaFlow</div>
            <div className="text-[9px] font-semibold uppercase tracking-widest text-slate-600">Learning Studio</div>
          </div>
        </div>

        {/* Identity card */}
        <div className="mx-4 my-4 p-4 rounded-2xl relative" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-500 animate-pulse-slow" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #7C3AED40, #06B6D440)', border: '1px solid rgba(124,58,237,0.3)' }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-slate-200 truncate">{user?.name}</div>
              <div className="text-[9px] text-slate-500 truncate">{user?.email}</div>
            </div>
          </div>

          {/* Progress ring */}
          <div className="flex items-center gap-4 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="relative w-14 h-14 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                <circle cx="30" cy="30" r="28" fill="none"
                  stroke="url(#progressGrad)" strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="progress-ring-circle"
                />
                <defs>
                  <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">{progressPercent}%</div>
            </div>
            <div>
              <div className="text-xs font-bold text-white">{completedCount}/{totalCount}</div>
              <div className="text-[9px] text-slate-500">Modules done</div>
            </div>
          </div>
        </div>

        {/* Streak Widget */}
        <div className="mx-4 mb-4 p-4 rounded-2xl flex items-center gap-3"
          style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)' }}>
          <div className="p-2.5 rounded-xl gold-flame-glow shrink-0"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
            <Flame className="h-4 w-4 text-yellow-400 fill-yellow-400" />
          </div>
          <div>
            <div className="text-xs font-black text-yellow-400">{learningStreak} Day Streak 🔥</div>
            <div className="text-[9px] text-slate-500">Keep your momentum going</div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-1">
          {[
            { id: 'courses', label: 'Learning Progress', icon: BookOpen },
            { id: 'catalog', label: 'Course Catalog', icon: Compass },
            { id: 'project', label: 'Project Submission', icon: Award },
            { id: 'ai-voice-mentor', label: 'AI Voice Mentor', icon: Sparkles },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button key={item.id}
                onClick={() => {
                  if (item.id === 'ai-voice-mentor') {
                    onNavigate('ai-voice-mentor');
                  } else {
                    setActiveTab(item.id);
                    setError('');
                  }
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left"
                style={{
                  color: isActive ? '#A78BFA' : '#64748B',
                  background: isActive ? 'rgba(124,58,237,0.08)' : 'transparent',
                  border: isActive ? '1px solid rgba(124,58,237,0.15)' : '1px solid transparent',
                }}>
                <Icon className="h-4 w-4" style={{ color: isActive ? '#A78BFA' : undefined }} />
                {item.label}
              </button>
            );
          })}

          <button
            onClick={onNavigateToAbout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-slate-500 hover:text-slate-200 text-left">
            <FileText className="h-4 w-4 text-slate-500" />
            About Project
          </button>
        </nav>

        {/* Bottom actions */}
        <div className="px-3 pb-5 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
          <button onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
            style={{ color: '#EF4444', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}>
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ═══════════════════ MAIN CONTENT ═════════════════════════ */}
      <main className="relative z-10 flex-1 overflow-auto">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-5 py-4"
          style={{ background: 'rgba(13,17,23,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}>
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-white" style={{ fontFamily: 'Space Grotesk' }}>LumionaFlow</span>
          </div>
          <button onClick={onLogout} className="text-red-400 text-xs font-semibold flex items-center gap-1">
            <LogOut className="h-3.5 w-3.5" /> Out
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto animate-fade-in">
          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="section-label mb-1">Good day, learner</p>
              <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>
                {user?.name?.split(' ')[0] || 'Student'}'s Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={onNavigateToAbout}
                className="text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94A3B8' }}>
                <FileText className="h-3.5 w-3.5 inline mr-1.5" />About Project
              </button>
              <button onClick={onLogout}
                className="text-xs font-semibold px-4 py-2.5 rounded-xl transition-all lg:hidden"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#FCA5A5' }}>
                <LogOut className="h-3.5 w-3.5 inline mr-1.5" /> Logout
              </button>
            </div>
          </div>

          {/* Mobile Tab Selector */}
          <div className="flex lg:hidden gap-1.5 p-1 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            {[
              { id: 'courses', label: 'Progress', icon: BookOpen },
              { id: 'catalog', label: 'Catalog', icon: Compass },
              { id: 'project', label: 'Project', icon: Award },
              { id: 'ai-voice-mentor', label: 'AI Voice', icon: Sparkles },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'ai-voice-mentor') {
                      onNavigate('ai-voice-mentor');
                    } else {
                      setActiveTab(item.id);
                      setError('');
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[10px] font-bold transition-all"
                  style={{
                    color: isActive ? '#A78BFA' : '#64748B',
                    background: isActive ? 'rgba(124,58,237,0.08)' : 'transparent',
                    border: isActive ? '1px solid rgba(124,58,237,0.15)' : '1px solid transparent',
                  }}
                >
                  <Icon className="h-3 w-3" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Quick error banner */}
          {error && (
            <div className="flex items-center gap-2.5 p-4 rounded-2xl text-xs font-semibold animate-scale-in"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5' }}>
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              <button onClick={() => setError('')} className="ml-auto text-slate-500 hover:text-white">✕</button>
            </div>
          )}

          {/* TAB CONDITIONAL RENDERING */}
          {activeTab === 'courses' && (
            <div className="space-y-6">
              {/* Course Overview Hero Widget */}
              <div className="glass-panel rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6"
                style={{ background: 'linear-gradient(135deg, rgba(13,17,23,0.95), rgba(25,18,48,0.65))', border: '1px solid rgba(124,58,237,0.2)' }}>
                
                {/* Background ambient mesh inside the card */}
                <div className="absolute inset-0 pointer-events-none z-0 opacity-15">
                  <div className="absolute top-0 right-0 w-64 h-64 rounded-full" style={{ background: 'radial-gradient(circle, #06B6D4, transparent)', filter: 'blur(50px)' }} />
                  <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full" style={{ background: 'radial-gradient(circle, #7C3AED, transparent)', filter: 'blur(40px)' }} />
                </div>

                <div className="relative z-10 flex-1 space-y-3">
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider"
                    style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', color: '#06B6D4' }}>
                    Active Track
                  </span>
                  <h2 className="text-xl md:text-2xl font-black text-white" style={{ fontFamily: 'Space Grotesk' }}>
                    {CATALOG_TRACKS.find(t => t.id === user?.selected_course_id)?.title || 'No Enrolled Course'}
                  </h2>
                  {user?.selected_course_id && (
                    <div className="flex gap-1 p-1 rounded-xl bg-white/[0.02] border border-white/[0.05] max-w-xs my-1.5">
                      {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => {
                        const isActive = activeLevel === lvl;
                        return (
                          <button
                            key={lvl}
                            onClick={() => handleLevelSwitch(lvl)}
                            className="flex-1 py-1 px-2.5 rounded-lg text-[9px] font-bold transition-all"
                            style={{
                              background: isActive ? 'linear-gradient(135deg, #7C3AED, #06B6D4)' : 'transparent',
                              border: isActive ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
                              color: isActive ? '#fff' : '#64748B',
                            }}
                          >
                            {lvl}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <p className="text-xs text-slate-400 max-w-xl">
                    {CATALOG_TRACKS.find(t => t.id === user?.selected_course_id)?.description || 'Head over to the Course Catalog to select your learning journey and start gaining skills.'}
                  </p>
                  
                  {user?.selected_course_id && (
                    <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-400 pt-1">
                      <div>
                        <span className="text-slate-500">Current Chapter:</span>{' '}
                        <span className="text-purple-400 font-bold">
                          {roadmap.find(m => m.unlocked && !m.completed)?.title || (roadmap.every(m => m.completed) ? 'All Completed' : 'None')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Next Milestone:</span>{' '}
                        <span className="text-cyan-400 font-bold">
                          {roadmap.filter(m => !m.unlocked)[0]?.title || 'Final Capstone Project'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {user?.selected_course_id && (
                  <div className="relative z-10 flex flex-col items-center gap-4 shrink-0 p-4 rounded-2xl w-full md:w-auto" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-4">
                      {/* Circular Progress Ring */}
                      <div className="relative w-14 h-14">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
                          <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                          <circle cx="30" cy="30" r="26" fill="none"
                            stroke="url(#heroRingGrad)" strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 26}
                            strokeDashoffset={(2 * Math.PI * 26) - (progressPercent / 100) * (2 * Math.PI * 26)}
                            className="progress-ring-circle"
                          />
                          <defs>
                            <linearGradient id="heroRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#7C3AED" />
                              <stop offset="100%" stopColor="#06B6D4" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white">{progressPercent}%</div>
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-black text-white">{completedCount}/{totalCount}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Modules Complete</div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        const activeNode = roadmap.find(m => m.unlocked && !m.completed) || roadmap.find(m => m.unlocked) || roadmap[0];
                        if (activeNode) setActiveModuleId(activeNode.id);
                      }}
                      className="w-full py-2 px-4 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98] animate-glow-pulse flex items-center justify-center gap-1.5"
                      style={{
                        background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                      }}>
                      <Play className="h-3 w-3 fill-white" /> Quick Continue Learning
                    </button>
                  </div>
                )}
              </div>

              {/* Learning Roadmap Nodes and Lesson Content Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Left side: Journey Node Map */}
                <div className="xl:col-span-4 glass-panel rounded-3xl p-5 flex flex-col relative overflow-hidden" style={{ minHeight: '480px' }}>
                  <div className="flex items-center gap-2.5 mb-6">
                    <div className="p-1.5 rounded-lg" style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>
                      <GitBranch className="h-3.5 w-3.5 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>Interactive Path Map</h2>
                      <p className="text-[10px] text-slate-500">Your visual sequence path map</p>
                    </div>
                  </div>

                  {loadingRoadmap ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
                      <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                      <span className="text-xs text-slate-500">Retrieving path timeline...</span>
                    </div>
                  ) : roadmap.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
                      <Compass className="h-8 w-8 text-slate-700 mb-2.5" />
                      <p className="text-xs text-slate-400">Please choose a course track from the catalog to build your learning path map.</p>
                    </div>
                  ) : (
                    <div className="relative pl-7 py-4 flex-1 flex flex-col justify-between">
                      {/* Interactive connected SVG path line background */}
                      <div className="absolute left-[2px] top-6 bottom-6 w-[2px] pointer-events-none z-0">
                        <svg className="w-full h-full" style={{ overflow: 'visible' }}>
                          <line x1="0" y1="0" x2="0" y2="100%" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
                          <line x1="0" y1="0" x2="0" y2={`${(completedCount / Math.max(1, totalCount - 1)) * 100}%`}
                            stroke="#7C3AED" strokeWidth="2"
                            strokeDasharray="4 4"
                            className="active-path-animation"
                            style={{ animation: 'dash 3s linear infinite' }}
                          />
                        </svg>
                      </div>

                      {/* Timeline node map */}
                      <div className="space-y-6 relative z-10">
                        {roadmap.map((mod, modIdx) => {
                          const isActive = mod.id === activeModuleId;
                          const inProgress = mod.unlocked && !mod.completed;
                          const isLocked = !mod.unlocked;
                          const isCompleted = mod.completed;
                          
                          // Determine node colors and shadows
                          let nodeColor = 'rgba(255,255,255,0.05)';
                          let nodeBorder = 'rgba(255,255,255,0.08)';
                          let shadowGlow = undefined;
                          
                          if (isCompleted) {
                            nodeColor = '#10B981';
                            nodeBorder = 'rgba(16,185,129,0.3)';
                          } else if (inProgress) {
                            nodeColor = '#7C3AED';
                            nodeBorder = 'rgba(124,58,237,0.5)';
                            shadowGlow = '0 0 15px rgba(124,58,237,0.5)';
                          } else if (mod.unlocked) {
                            nodeColor = 'rgba(124,58,237,0.1)';
                            nodeBorder = 'rgba(124,58,237,0.3)';
                          }

                          return (
                            <div key={mod.id}
                              onClick={() => { if (mod.unlocked) setActiveModuleId(mod.id); }}
                              className="group relative flex items-start gap-4 transition-all duration-200"
                              style={{ cursor: mod.unlocked ? 'pointer' : 'default', opacity: isLocked ? 0.45 : 1 }}>
                              
                              {/* Node Circle */}
                              <div className="relative shrink-0 mt-1">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold -ml-11 z-10 relative transition-transform group-hover:scale-105"
                                  style={{
                                    background: nodeColor,
                                    border: `2px solid ${nodeBorder}`,
                                    boxShadow: shadowGlow,
                                  }}>
                                  {isCompleted ? (
                                    <Check className="h-3.5 w-3.5 text-white" />
                                  ) : isLocked ? (
                                    <Lock className="h-3 w-3 text-slate-500" />
                                  ) : (
                                    <span className="text-[10px] text-white">{modIdx + 1}</span>
                                  )}
                                </div>
                              </div>

                              {/* Hover details card (absolute tooltip on node card hover) */}
                              <div className="absolute bottom-full left-4 mb-2 hidden group-hover:block z-30 w-64 p-4 rounded-xl glass-panel shadow-2xl animate-scale-in"
                                style={{ background: '#0D1117', border: '1px solid rgba(124,58,237,0.35)' }}>
                                <div className="text-[9px] font-bold uppercase tracking-widest text-purple-400 mb-1">
                                  Module {modIdx + 1} · Duration: {modIdx % 2 === 0 ? '2.5 hrs' : '2 hrs'}
                                </div>
                                <h4 className="text-xs font-bold text-white mb-1.5 leading-snug">{mod.title}</h4>
                                <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">{mod.description || 'Gain core proficiency concepts in this structured lesson segment.'}</p>
                                <div className="flex justify-between items-center text-[9px] font-semibold pt-1.5 border-t border-white/[0.04]">
                                  <span className="text-slate-500">Status</span>
                                  <span style={{ color: isCompleted ? '#34D399' : inProgress ? '#F59E0B' : isLocked ? '#64748B' : '#A78BFA' }}>
                                    {isCompleted ? `Passed (${mod.score}%)` : inProgress ? 'In Progress' : isLocked ? 'Locked' : 'Available'}
                                  </span>
                                </div>
                              </div>

                              {/* Node card */}
                              <div className={`flex-1 p-3.5 rounded-2xl transition-all ${isActive ? 'neon-border-purple' : 'glass-panel-hover'}`}
                                style={{
                                  background: isActive ? 'rgba(124,58,237,0.06)' : 'rgba(255,255,255,0.02)',
                                  border: isActive ? undefined : '1px solid rgba(255,255,255,0.05)',
                                }}>
                                <div className="text-xs font-bold text-white leading-snug">{mod.title}</div>
                                {isCompleted ? (
                                  <div className="text-[9px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                                    <Check className="h-3 w-3" /> Checkpoint Verified ({mod.score}%)
                                  </div>
                                ) : inProgress ? (
                                  <div className="text-[9px] text-purple-400 font-semibold mt-1 animate-pulse-slow">
                                    → Currently Studying
                                  </div>
                                ) : isLocked ? (
                                  <div className="text-[9px] text-slate-500 font-semibold mt-1 flex items-center gap-1">
                                    <Lock className="h-2.5 w-2.5" /> Locked Checkpoint
                                  </div>
                                ) : (
                                  <div className="text-[9px] text-cyan-400 font-semibold mt-1">
                                    Available Checkpoint
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right side: Lesson notebook details viewer */}
                <div className="xl:col-span-8 glass-panel rounded-3xl p-6 flex flex-col">
                  {loadingModule ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                      <span className="text-xs text-slate-500">Opening secure notes...</span>
                    </div>
                  ) : activeModuleDetails ? (
                    <div className="space-y-6">
                      {/* Header info */}
                      <div className="flex items-start justify-between gap-4 pb-5 border-b border-white/[0.05]">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider bg-purple-500/10 border border-purple-500/20 text-purple-300">
                              Module {roadmap.findIndex(m => m.id === activeModuleId) + 1} of {roadmap.length}
                            </span>
                            {activeModuleRoadmapData?.completed && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                Verified
                              </span>
                            )}
                          </div>
                          <h2 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
                            {activeModuleDetails.title}
                          </h2>
                          {activeModuleDetails.description && (
                            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{activeModuleDetails.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Video Player */}
                      {activeModuleDetails.video_url && (
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-video bg-black/40 border border-white/[0.05]">
                          <video src={activeModuleDetails.video_url} controls className="w-full h-full object-cover" />
                        </div>
                      )}

                      {/* Notebook Content */}
                      {activeModuleDetails.notes && (
                        <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/[0.03] shadow-inner">
                          <div className="section-label mb-4">Study Notebook</div>
                          <div className="notebook-content">
                            {activeModuleDetails.notes.split('\n\n').map((para, pIdx) => {
                              if (para.startsWith('# ')) return <h1 key={pIdx}>{para.substring(2)}</h1>;
                              if (para.startsWith('## ')) return <h2 key={pIdx}>{para.substring(3)}</h2>;
                              if (para.startsWith('### ')) return <h3 key={pIdx}>{para.substring(4)}</h3>;
                              if (para.startsWith('- ')) {
                                return (
                                  <ul key={pIdx}>
                                    {para.split('\n').map((li, lIdx) => (
                                      <li key={lIdx}>{li.substring(2)}</li>
                                    ))}
                                  </ul>
                                );
                              }
                              if (para.startsWith('> ')) return <blockquote key={pIdx}>{para.substring(2)}</blockquote>;
                              return <p key={pIdx}>{para}</p>;
                            })}
                          </div>
                        </div>
                      )}

                      {/* Resources */}
                      {activeModuleDetails.resources && activeModuleDetails.resources.length > 0 && (
                        <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/[0.03]">
                          <div className="section-label mb-3">Resource Attachments</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {activeModuleDetails.resources.map((res, rIdx) => (
                              <a key={rIdx} href={res.url} target="_blank" rel="noreferrer"
                                className="flex items-center gap-2 p-3 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.04] transition-all"
                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <FileText className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                                <span className="truncate">{res.name}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Footer Actions / Assessment */}
                      <div className="flex items-center justify-between pt-5 border-t border-white/[0.05] gap-4">
                        <div className="text-xs text-slate-500">
                          <span className="font-bold text-slate-400">Quiz Checkpoint:</span> Score ≥70% to unlock the next chapter.
                        </div>
                        {activeModuleRoadmapData?.completed ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <Check className="h-4 w-4" /> Checkpoint Verified
                          </div>
                        ) : (
                          <button onClick={handleStartQuiz}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.97] animate-glow-pulse shrink-0"
                            style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}>
                            <ClipboardCheck className="h-4 w-4" /> Start Assessment Quiz
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-28 text-center">
                      <BookOpen className="h-7 w-7 text-slate-600 mb-3" />
                      <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                        Please select an unlocked chapter from the journey roadmap to view notes and complete the checkpoint assessment.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'catalog' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="glass-panel rounded-3xl p-6" style={{ background: 'linear-gradient(135deg, rgba(13,17,23,0.95), rgba(20,25,35,0.7))' }}>
                <h2 className="text-xl font-bold text-white font-grotesk" style={{ fontFamily: 'Space Grotesk' }}>Curriculum Catalog</h2>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  Explore and select from all four available learning tracks. You can switch tracks at any time; your roadmap and progress milestones will update automatically.
                </p>
              </div>

              {/* Accordion Course Cards */}
              <div className="space-y-4 animate-fade-slide-up">
                {CATALOG_TRACKS.map((track, trackIdx) => {
                  const isExpanded = expandedCatalogIdx === trackIdx;
                  const isEnrolled = user?.selected_course_id === track.id;
                  
                  return (
                    <div key={track.id} 
                      className={`glass-panel rounded-3xl transition-all ${isEnrolled ? 'neon-border-cyan bg-cyan-950/5' : 'glass-panel-hover'}`}>
                      {/* Accordion Header */}
                      <div onClick={() => setExpandedCatalogIdx(isExpanded ? -1 : trackIdx)}
                        className="p-6 flex items-center justify-between cursor-pointer">
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                            <span className="section-label text-cyan-400">{track.subtitle}</span>
                            <span className="text-[10px] text-slate-500 font-semibold">{track.duration}</span>
                            {isEnrolled && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                                Active Enrollment
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>{track.title}</h3>
                        </div>
                        <ChevronRight className={`h-5 w-5 text-slate-500 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>

                      {/* Accordion Expandable Content */}
                      {isExpanded && (
                        <div className="px-6 pb-6 pt-2 border-t border-white/[0.04] space-y-6 animate-fade-in">
                          <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">{track.description}</p>
                          
                          {/* Track Quick Stats */}
                          <div className="flex flex-wrap items-center gap-6 p-4 rounded-2xl bg-white/[0.01] border border-white/[0.03] text-xs font-semibold text-slate-400">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-cyan-400" />
                              <span>{track.modules.length} Modules Total</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-cyan-400" />
                              <span>Estimated Duration: {track.duration.split(' · ')[1] || track.duration}</span>
                            </div>
                          </div>

                          {/* Learning Outcomes */}
                          <div className="space-y-2.5">
                            <div className="section-label">Learning Outcomes</div>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
                              {track.outcomes.map((out, outcomesIdx) => (
                                <li key={outcomesIdx} className="flex items-start gap-2">
                                  <Target className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                                  <span>{out}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Module Outline */}
                          <div className="space-y-3">
                            <div className="section-label">Module Outlines</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {track.modules.map((mod, outlineModIdx) => {
                                // Determine status of this module
                                let status = 'Locked';
                                if (isEnrolled) {
                                  const roadmapMod = roadmap.find(rm => rm.title.trim().toLowerCase() === mod.title.trim().toLowerCase());
                                  if (roadmapMod) {
                                    if (roadmapMod.completed) status = 'Completed';
                                    else if (roadmapMod.unlocked) status = 'Available';
                                  }
                                } else {
                                  if (outlineModIdx === 0) status = 'Available';
                                }

                                // Status styling
                                let statusBadge = (
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700/50 text-slate-500 flex items-center gap-1">
                                    <Lock className="h-2.5 w-2.5" /> Locked
                                  </span>
                                );
                                if (status === 'Completed') {
                                  statusBadge = (
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1">
                                      <Check className="h-2.5 w-2.5" /> Completed
                                    </span>
                                  );
                                } else if (status === 'Available') {
                                  statusBadge = (
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center gap-1">
                                      <Check className="h-2.5 w-2.5" /> Available
                                    </span>
                                  );
                                }

                                return (
                                  <div key={outlineModIdx} className="p-4 rounded-2xl bg-white/[0.01] border border-white/[0.03] flex flex-col justify-between gap-2">
                                    <div>
                                      <div className="flex items-start justify-between gap-3 mb-1">
                                        <div className="text-xs font-bold text-white leading-snug">
                                          Module {outlineModIdx + 1}: {mod.title.split(': ')[1] || mod.title}
                                        </div>
                                        <div className="shrink-0">{statusBadge}</div>
                                      </div>
                                      <p className="text-[11px] text-slate-500 leading-relaxed">{mod.desc}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Enroll Button */}
                          <div className="pt-4 flex justify-end">
                            {isEnrolled ? (
                              <button disabled
                                className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-500 bg-slate-800/40 border border-slate-700/50 cursor-not-allowed">
                                Enrolled & studying this path
                              </button>
                            ) : (
                              <button 
                                onClick={async () => {
                                  setError('');
                                  try {
                                    await apiFetch('/api/student/select-course', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ courseId: track.id })
                                    });
                                    user.selected_course_id = track.id; // update local session
                                    setActiveModuleId('');
                                    setActiveModuleDetails(null);
                                    await fetchRoadmap();
                                    setActiveTab('courses');
                                  } catch (err) {
                                    setError(err.message);
                                  }
                                }}
                                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98] hover:shadow-cyan/10"
                                style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)', boxShadow: '0 0 15px rgba(124,58,237,0.2)' }}>
                                Select & Enroll in Track
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'project' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-slide-up">
              {/* Capstone Project submission console */}
              <div className="lg:col-span-8 glass-panel rounded-3xl p-6 space-y-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
                    <Award className="h-3.5 w-3.5 text-yellow-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>Capstone Project Console</h2>
                    <p className="text-[10px] text-slate-500">Graduation Project Submission</p>
                  </div>
                </div>

                {project ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-white">{project.title}</h3>
                        <p className="text-[9px] text-slate-500">Submitted {new Date(project.submitted_at || Date.now()).toLocaleString()}</p>
                      </div>
                      
                      {project.status === 'pending' && (
                        <span className="text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                          Pending Review
                        </span>
                      )}
                      {project.status === 'approved' && (
                        <span className="text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          Approved ✓
                        </span>
                      )}
                      {project.status === 'rejected' && (
                        <span className="text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider bg-red-500/10 border border-red-500/20 text-red-400">
                          Revision Needed
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed p-4 rounded-xl bg-white/[0.01] border border-white/[0.04]">
                      {project.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {project.github_link && (
                        <a href={project.github_link} target="_blank" rel="noreferrer"
                          className="flex items-center gap-2 p-3 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.03] transition-all bg-white/[0.01] border border-white/[0.05]">
                          <GitBranch className="h-4 w-4 text-purple-400 shrink-0" />
                          <span>Repository Link</span>
                        </a>
                      )}
                      {project.file_path && (
                        <div className="flex items-center gap-2 p-3 rounded-xl text-xs text-slate-400 bg-white/[0.01] border border-white/[0.05]">
                          <FolderArchive className="h-4 w-4 text-cyan-400 shrink-0" />
                          <span className="truncate">{project.file_path}</span>
                        </div>
                      )}
                    </div>

                    {project.feedback && (
                      <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
                        <div className="section-label mb-1.5">Mentor Feedback</div>
                        <p className="text-xs text-slate-300 italic leading-relaxed">"{project.feedback}"</p>
                      </div>
                    )}

                    {project.status === 'rejected' && (
                      <button onClick={() => setProject(null)}
                        className="text-xs font-bold px-4 py-2.5 rounded-xl transition-all border border-purple-500/30 text-purple-300 bg-purple-500/10 hover:bg-purple-500/20">
                        Edit & Resubmit Project
                      </button>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleProjectSubmit} className="space-y-4">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      To graduate and claim your credential, you must submit a Capstone Project demonstrating automation, LLM tool integration, or agent designs.
                    </p>
                    
                    <div>
                      <label className="section-label block mb-1.5">Project Title</label>
                      <input type="text" placeholder="E.g. Intelligent RAG Assistant System"
                        value={newProjectTitle} onChange={e => setNewProjectTitle(e.target.value)}
                        className="glass-input text-xs" required />
                    </div>

                    <div>
                      <label className="section-label block mb-1.5">Project Description</label>
                      <textarea rows={4} placeholder="Describe the application flow, key API integrations, and automation triggers..."
                        value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)}
                        className="glass-input text-xs resize-none" required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="section-label block mb-1.5">GitHub Repository Link</label>
                        <input type="url" placeholder="https://github.com/username/repo"
                          value={githubLink} onChange={e => setGithubLink(e.target.value)}
                          className="glass-input text-xs" />
                      </div>
                      
                      <div>
                        <label className="section-label block mb-1.5">Project Files / Mock Code Upload</label>
                        <div className="flex items-center gap-3 glass-input h-[46px]">
                          <input type="file" id="capstone-file" className="hidden"
                            onChange={e => { if (e.target.files?.[0]) setFileName(e.target.files[0].name); }} />
                          <label htmlFor="capstone-file" className="cursor-pointer text-[10px] font-bold px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-slate-200">
                            Select File
                          </label>
                          <span className="text-[10px] text-slate-500 truncate">{fileName || 'No files selected'}</span>
                        </div>
                      </div>
                    </div>

                    <button type="submit" disabled={submittingProject}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.97]"
                      style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', boxShadow: '0 0 20px rgba(124,58,237,0.25)' }}>
                      {submittingProject ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting Project...</>
                      ) : (
                        <>Submit Capstone Project <ArrowRight className="h-3.5 w-3.5" /></>
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* Verified Digital Credentials Card (Certificate) */}
              <div className="lg:col-span-4">
                {certificate ? (
                  <div className="glass-panel rounded-3xl p-6 gold-glow-border relative overflow-hidden flex flex-col justify-between" style={{ minHeight: '320px', background: 'rgba(251,191,36,0.03)' }}>
                    {/* Glow design element */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-15"
                        style={{ background: 'radial-gradient(circle, #FBBF24, transparent)', filter: 'blur(40px)' }} />
                    </div>

                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-400 animate-pulse-slow" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400">Digital Verified Credential</span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>AgentEx {certificate.bootcamp_level} Certificate</h3>
                      
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 bg-yellow-500/10 border border-yellow-500/20">🎓</div>
                        <div>
                          <div className="text-[10px] font-black text-yellow-300 uppercase tracking-wider">
                            {CATALOG_TRACKS.find(t => t.id === certificate.course_id)?.title || 'AI Foundations'}
                          </div>
                          <div className="text-[9px] text-slate-400 mt-0.5">All checkpoints verified · Project approved</div>
                        </div>
                      </div>

                      <div className="text-[10px] font-mono text-yellow-200/80 p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10 inline-block">
                        Code: {certificate.certificate_code}
                      </div>
                    </div>

                    <button onClick={() => window.print()}
                      className="relative z-10 w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs font-bold transition-all active:scale-[0.97]"
                      style={{ background: 'linear-gradient(135deg, #FBBF24, #F59E0B)', color: '#000', boxShadow: '0 0 20px rgba(251,191,36,0.3)' }}>
                      <Printer className="h-4 w-4" /> Print Credential
                    </button>
                  </div>
                ) : (
                  <div className="glass-panel rounded-3xl p-5 flex flex-col justify-between opacity-50 border-dashed" style={{ minHeight: '180px' }}>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Lock className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Certificate Locked</span>
                      </div>
                      <p className="text-[10px] text-slate-500 max-w-xs leading-relaxed">
                        Complete all 4 modules (score ≥70% on each assessment quiz) and receive Capstone Project approval from your mentor to unlock your digital verified certificate.
                      </p>
                    </div>
                    <Award className="h-8 w-8 text-slate-700 shrink-0" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ═══════════════════ QUIZ MODAL ═══════════════════════════ */}
      {showQuizModal && quizData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(7, 11, 20, 0.85)', backdropFilter: 'blur(16px)' }}>
          <div className="w-full max-w-lg rounded-3xl flex flex-col max-h-[88vh] animate-scale-in"
            style={{ background: '#0D1117', border: '1px solid rgba(124,58,237,0.3)', boxShadow: '0 0 60px rgba(124,58,237,0.2)' }}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <h3 className="text-sm font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>Assessment Checkpoint</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Pass with ≥{quizData.passing_score}% to unlock next module</p>
              </div>
              <button onClick={() => setShowQuizModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:text-white text-xs transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}>✕</button>
            </div>

            {/* Questions */}
            <div className="flex-1 overflow-y-auto p-6 space-y-7">
              {!quizResult ? (
                quizData.questions.map((q, qIdx) => (
                  <div key={qIdx}>
                    <div className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: '#7C3AED' }}>
                      Question {qIdx + 1} of {quizData.questions.length}
                    </div>
                    <div className="text-sm font-semibold text-white mb-3 leading-snug">{q.question}</div>
                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const selected = quizAnswers[qIdx] === optIdx;
                        return (
                          <div key={optIdx}
                            onClick={() => setQuizAnswers({ ...quizAnswers, [qIdx]: optIdx })}
                            className="cursor-pointer p-3.5 rounded-xl text-xs transition-all"
                            style={{
                              background: selected ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.02)',
                              border: selected ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.06)',
                              color: selected ? '#E2E8F0' : '#64748B',
                              boxShadow: selected ? '0 0 15px rgba(124,58,237,0.1)' : undefined,
                            }}>
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold"
                                style={{
                                  background: selected ? 'linear-gradient(135deg, #7C3AED, #06B6D4)' : 'rgba(255,255,255,0.05)',
                                  color: selected ? '#fff' : '#475569',
                                }}>
                                {String.fromCharCode(65 + optIdx)}
                              </div>
                              {opt}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-5">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      background: quizResult.passed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      border: `2px solid ${quizResult.passed ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
                    }}>
                    {quizResult.passed
                      ? <Check className="h-7 w-7 text-emerald-400" />
                      : <AlertCircle className="h-7 w-7 text-red-400" />}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white mb-1" style={{ fontFamily: 'Space Grotesk' }}>
                      {quizResult.passed ? 'Checkpoint Verified! 🎉' : 'Checkpoint Failed'}
                    </h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                      {quizResult.passed
                        ? `You scored ${quizResult.score}%. The next module has been unlocked automatically.`
                        : `You scored ${quizResult.score}%. Review the module notes and try again.`}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                    {[
                      { label: 'Score', value: `${quizResult.score}%`, color: quizResult.passed ? '#10B981' : '#EF4444' },
                      { label: 'Correct', value: `${quizResult.correctCount}/${quizResult.totalQuestions}`, color: '#06B6D4' },
                    ].map((stat, i) => (
                      <div key={i} className="p-4 rounded-xl text-center"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="text-xl font-black" style={{ color: stat.color, fontFamily: 'Space Grotesk' }}>{stat.value}</div>
                        <div className="section-label mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 flex justify-end" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {!quizResult ? (
                <button onClick={handleQuizSubmit}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.97]"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', boxShadow: '0 0 20px rgba(124,58,237,0.25)' }}>
                  Submit Answers
                </button>
              ) : (
                <button onClick={() => { setShowQuizModal(false); setQuizResult(null); }}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Print Certificate (unchanged) ──────────────────────── */}
      {certificate && (
        <div className="hidden print:block fixed inset-0 z-[100] bg-white text-black p-16 overflow-hidden" style={{ fontFamily: 'serif' }}>
          <div className="border-8 border-double border-gray-800 p-10 h-full flex flex-col justify-between text-center">
            <div>
              <span className="text-xs tracking-[0.3em] uppercase font-bold block mb-6">
                AgentEx {certificate.bootcamp_level} Certificate
              </span>
              <h1 className="text-6xl font-black tracking-widest mb-8">
                {CATALOG_TRACKS.find(t => t.id === certificate.course_id)?.title || 'Luminaflow Track'}
              </h1>
              <p className="text-sm italic text-gray-600 max-w-lg mx-auto mb-6">
                This certifies that the curriculum pathway, checkpoint assessments, and capstone project criteria have been successfully completed at the **{certificate.bootcamp_level}** level by:
              </p>
              <h2 className="text-4xl font-black underline decoration-2 underline-offset-8">{user?.name}</h2>
            </div>
            <div className="flex justify-between items-end px-12">
              <div className="text-left text-xs"><div className="font-bold">Credential ID</div><div className="font-mono mt-1">{certificate.certificate_code}</div></div>
              <div className="text-center text-xs max-w-[150px]"><div className="border-b border-gray-400 pb-2 italic">Dr. Sarah Vance</div><div className="font-bold mt-1.5">LumionaFlow Mentor</div></div>
              <div className="text-right text-xs"><div className="font-bold">Date Issued</div><div className="mt-1">{new Date(certificate.issued_at).toLocaleDateString()}</div></div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
