import React, { useMemo } from 'react';
import { Sparkles, Award, ArrowRight, Zap, ShieldCheck, Layers, Star, ChevronRight, Play, BookOpen, Cpu, Video, Code, Bot, Users, ClipboardCheck, Mic } from 'lucide-react';

// Deterministic particle data (no random on render)
const PARTICLES = Array.from({ length: 55 }, (_, i) => ({
  id: i,
  left: `${((i * 37 + 13) % 92) + 4}%`,
  size: (i % 3) + 2,
  duration: `${14 + (i % 10)}s`,
  delay: `-${(i * 1.3) % 12}s`,
  opacity: 0.12 + (i % 5) * 0.04,
  color: i % 3 === 0 ? '#7C3AED' : i % 3 === 1 ? '#06B6D4' : '#312E81',
}));

const FEATURES = [
  {
    icon: Layers,
    color: 'purple',
    iconBg: 'bg-purple-electric/10 border-purple-electric/20 text-purple-electric',
    title: 'Personal Learning Journals',
    description: 'Study notes rendered in clean serif notebooks, free from dashboard clutter. Your own Notion-style learning space.',
  },
  {
    icon: ShieldCheck,
    color: 'cyan',
    iconBg: 'bg-cyan-accent/10 border-cyan-accent/20 text-cyan-accent',
    title: 'Intelligent Competency Gates',
    description: 'Every module is locked behind a scored checkpoint. Pass with ≥70% to unlock the next milestone automatically.',
  },
  {
    icon: Award,
    color: 'gold',
    iconBg: 'bg-gold-brand/10 border-gold-brand/20 text-gold-brand',
    title: 'Verified Digital Credentials',
    description: 'Complete all milestones, earn mentor approval, and receive a cryptographically signed certificate instantly.',
  },
];

const OVERVIEW_FEATURES = [
  {
    icon: BookOpen,
    title: 'Structured Learning Paths',
    description: 'Sequenced roadmap modules guiding you step-by-step from core foundations to advanced applications.',
    colorClass: 'text-purple-400 bg-purple-400/10 border-purple-400/20'
  },
  {
    icon: Cpu,
    title: 'AI Foundations',
    description: 'Acquire core knowledge in machine learning, model architectures, and fundamental AI concepts.',
    colorClass: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
  },
  {
    icon: Video,
    title: 'AI Content Creation',
    description: 'Master generative tools for text, images, video, and audio production with prompt engineering.',
    colorClass: 'text-pink-400 bg-pink-400/10 border-pink-400/20'
  },
  {
    icon: Code,
    title: 'AI Software Development',
    description: 'Design and deploy full-stack software using modern AI coding assistants and API integrations.',
    colorClass: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20'
  },
  {
    icon: Bot,
    title: 'Agentic Automation',
    description: 'Develop and coordinate autonomous AI agents to handle real-world tasks and workflows automatically.',
    colorClass: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
  },
  {
    icon: Zap,
    title: 'AgentEx Bootcamp',
    description: 'Accelerate learning with hands-on bootcamp tracks designed for building agentic state machines.',
    colorClass: 'text-amber-400 bg-amber-400/10 border-amber-400/20'
  },
  {
    icon: Users,
    title: 'Mentor Review System',
    description: 'Submit capstone projects for evaluation by human mentors to receive detailed code and architectural reviews.',
    colorClass: 'text-blue-400 bg-blue-400/10 border-blue-400/20'
  },
  {
    icon: ClipboardCheck,
    title: 'Assessments',
    description: 'Lock in progress with structured checkpoint quizzes that require a passing score of 70% or more.',
    colorClass: 'text-rose-400 bg-rose-400/10 border-rose-400/20'
  },
  {
    icon: Award,
    title: 'Certifications',
    description: 'Receive cryptographically signed digital credentials when you complete a track and pass reviews.',
    colorClass: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
  },
  {
    icon: Mic,
    title: 'AI Voice Mentor',
    description: 'Engage in conversational audio learning with an AI voice mentor to test your conceptual knowledge.',
    colorClass: 'text-teal-400 bg-teal-400/10 border-teal-400/20'
  }
];

const JOURNEY_STEPS = [
  {
    step: '01',
    title: 'Select a Track & Level',
    description: 'Choose from 4 specialized courses and select your target level (Beginner, Intermediate, or Advanced).',
    glow: 'text-purple-400'
  },
  {
    step: '02',
    title: 'Engage the AI Voice Mentor',
    description: 'Engage in real-time conversational Q&A to test your knowledge vocally and lock in core terminology.',
    glow: 'text-cyan-400'
  },
  {
    step: '03',
    title: 'Unlock Progress Gates',
    description: 'Study module notes and video guides, then pass structured quiz gates with a score of 70% or more.',
    glow: 'text-indigo-400'
  },
  {
    step: '04',
    title: 'Build Capstone Projects',
    description: 'Put theory into practice by developing complete solutions mapped to real-world applications.',
    glow: 'text-pink-400'
  },
  {
    step: '05',
    title: 'Get Mentor Feedback',
    description: 'Submit your code or assets to mentors for manual reviews, detailed evaluation, and approval.',
    glow: 'text-blue-400'
  },
  {
    step: '06',
    title: 'Earn Verifiable Credentials',
    description: 'Instantly download your cryptographically signed certificate of competency upon finishing all milestones.',
    glow: 'text-yellow-500'
  }
];

export default function LandingPage({ onNavigate, isAuthenticated, user }) {
  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen text-slate-200" style={{ backgroundColor: '#070B14' }}>

      {/* ── Particle Field ──────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="particle animate-particle"
            style={{
              left: p.left,
              bottom: '-10px',
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              opacity: p.opacity,
              animationDuration: p.duration,
              animationDelay: p.delay,
              boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            }}
          />
        ))}
        {/* Gradient Mesh */}
        <div className="absolute -top-1/4 -left-1/4 w-[60vw] h-[60vw] rounded-full opacity-20 animate-float"
          style={{ background: 'radial-gradient(circle, #312E81 0%, transparent 65%)', filter: 'blur(120px)' }} />
        <div className="absolute -bottom-1/4 -right-1/4 w-[55vw] h-[55vw] rounded-full opacity-15 animate-float-slow"
          style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 65%)', filter: 'blur(120px)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] rounded-full opacity-10 animate-float"
          style={{ background: 'radial-gradient(circle, #06B6D4 0%, transparent 65%)', filter: 'blur(100px)', animationDelay: '3s' }} />
      </div>

      {/* ── Floating Nav ────────────────────────────────────────── */}
      <header className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-5xl">
        <nav className="flex items-center justify-between px-5 py-3 rounded-2xl border"
          style={{
            background: 'rgba(13, 17, 23, 0.8)',
            backdropFilter: 'blur(20px)',
            borderColor: 'rgba(255,255,255,0.08)',
            boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
          }}>
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}>
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white" style={{ fontFamily: 'Space Grotesk' }}>
              LumionaFlow
            </span>
          </div>

          <div className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-400">
            <button onClick={() => scrollToSection('features')} className="hover:text-cyan-400 transition-colors">Methodology</button>
            <button onClick={() => scrollToSection('overview')} className="hover:text-cyan-400 transition-colors">Overview</button>
            <button onClick={() => scrollToSection('journey')} className="hover:text-cyan-400 transition-colors">Journey</button>
          </div>

          <div className="flex items-center gap-2.5">
            {isAuthenticated ? (
              <button
                onClick={() => onNavigate(user?.role === 'mentor' ? 'mentor-dashboard' : 'student-dashboard')}
                className="text-xs font-bold px-4 py-2 rounded-xl text-white transition-all active:scale-[0.97]"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}>
                Go to Dashboard
              </button>
            ) : (
              <>
                <button onClick={() => onNavigate('auth')}
                  className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-2 transition-colors">
                  Sign In
                </button>
                <button onClick={() => onNavigate('auth')}
                  className="text-xs font-bold px-4 py-2 rounded-xl text-white transition-all active:scale-[0.97]"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', boxShadow: '0 0 20px rgba(124,58,237,0.3)' }}>
                  Get Started
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* ── Hero Section ────────────────────────────────────────── */}
      <section className="relative z-10 min-h-[80vh] flex flex-col items-center justify-center pt-36 pb-16 px-6 text-center overflow-hidden">

        {/* Badge pill */}
        <div className="animate-fade-slide-up opacity-0 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8"
          style={{
            background: 'rgba(124,58,237,0.1)',
            border: '1px solid rgba(124,58,237,0.3)',
            color: '#A78BFA',
            animationFillMode: 'forwards',
          }}>
          <Zap className="h-3 w-3" />
          AI-Powered Learning Automation Engine
          <ChevronRight className="h-3 w-3" />
        </div>

        {/* Main heading */}
        <h1 className="animate-fade-slide-up opacity-0 delay-200 font-bold tracking-tight leading-none max-w-4xl"
          style={{ fontSize: 'clamp(3rem, 8vw, 7rem)', fontFamily: 'Space Grotesk', animationFillMode: 'forwards' }}>
          <span className="text-white">LUMIONA</span>
          <span className="gradient-text">FLOW</span>
        </h1>

        <div className="animate-fade-slide-up opacity-0 delay-300 mt-4 text-xs md:text-sm font-semibold tracking-widest uppercase"
          style={{ animationFillMode: 'forwards' }}>
          <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent filter drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]">
            Powered by EduFlick AI
          </span>
        </div>

        <p className="animate-fade-slide-up opacity-0 delay-400 mt-6 text-xl md:text-2xl font-light text-slate-400 max-w-2xl leading-relaxed"
          style={{ animationFillMode: 'forwards' }}>
          Transforming Learning Through{' '}
          <span className="gradient-text-cyan font-semibold">Intelligent Automation</span>
        </p>

        <p className="animate-fade-slide-up opacity-0 delay-500 mt-4 text-sm text-slate-500 max-w-xl leading-relaxed"
          style={{ animationFillMode: 'forwards' }}>
          Automate learning journeys, unlock progress gates, receive mentor reviews, and earn verified credentials through a structured, intelligent workflow.
        </p>

        {/* CTAs */}
        <div className="animate-fade-slide-up opacity-0 delay-700 mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center"
          style={{ animationFillMode: 'forwards' }}>
          <button onClick={() => onNavigate('auth')}
            className="group flex items-center gap-2.5 px-8 py-4 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.97]"
            style={{
              background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
              boxShadow: '0 0 30px rgba(124,58,237,0.4), 0 4px 20px rgba(0,0,0,0.3)',
            }}>
            Start Your Learning Journey
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button onClick={() => scrollToSection('features')}
            className="flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-semibold text-slate-300 transition-all hover:text-white"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Play className="h-3.5 w-3.5 text-cyan-400" />
            See How It Works
          </button>
        </div>
      </section>

      {/* ── Features Section ────────────────────────────────────── */}
      <section id="features" className="relative z-10 py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <p className="section-label mb-4">Platform Methodology</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white max-w-2xl mx-auto" style={{ fontFamily: 'Space Grotesk' }}>
              Built for{' '}
              <span className="gradient-text">serious learners</span>
            </h2>
            <p className="mt-5 text-slate-400 text-base max-w-lg mx-auto leading-relaxed">
              We replace passive content catalogs with structured pathfinding maps that verify real competencies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="group glass-panel glass-panel-hover rounded-3xl p-8 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-2xl ${f.iconBg} border flex items-center justify-center mb-6 transition-all group-hover:scale-110`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Platform Overview Section ────────────────────────────────────── */}
      <section id="overview" className="relative z-10 py-24 px-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="section-label mb-4">Platform Overview</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white max-w-2xl mx-auto" style={{ fontFamily: 'Space Grotesk' }}>
              LumionaFlow & <span className="gradient-text-cyan">EduFlick AI</span> Features
            </h2>
            <p className="mt-4 text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
              Explore the core capabilities that drive our automated learning ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {OVERVIEW_FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="group glass-panel glass-panel-hover rounded-3xl p-7 transition-all duration-300">
                  <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center mb-5 transition-all group-hover:scale-110 ${f.colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2.5">{f.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Learning Journey Section ────────────────────────────── */}
      <section id="journey" className="relative z-10 py-24 px-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="section-label mb-4">Learning Journey</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white max-w-2xl mx-auto" style={{ fontFamily: 'Space Grotesk' }}>
              Your Pathway to <span className="gradient-text">Competency</span>
            </h2>
            <p className="mt-4 text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
              Follow our structured, automated flow to master real-world AI skills.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {JOURNEY_STEPS.map((s, i) => (
              <div key={i} className="glass-panel glass-panel-hover rounded-3xl p-7 flex flex-col justify-between transition-all duration-300">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className={`text-2xl font-black font-mono opacity-80 ${s.glow}`}>{s.step}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2.5">{s.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass-panel rounded-3xl p-14" style={{ background: 'rgba(124,58,237,0.06)', borderColor: 'rgba(124,58,237,0.2)' }}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-5" style={{ fontFamily: 'Space Grotesk' }}>
              Ready to begin your<br />
              <span className="gradient-text">learning journey?</span>
            </h2>
            <p className="text-slate-400 text-base mb-10 max-w-md mx-auto leading-relaxed">
              Begin your journey on LumionaFlow today and build real, verified competency through learning automation.
            </p>
            <button onClick={() => onNavigate('auth')}
              className="group inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                boxShadow: '0 0 40px rgba(124,58,237,0.4)',
              }}>
              Start Your Learning Journey
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="relative z-10 py-10 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}>
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-white tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>LumionaFlow</span>
          </div>
          <div className="flex gap-6 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Support</span>
          </div>
          <p className="text-xs text-slate-700">© {new Date().getFullYear()} LumionaFlow. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
