import React from 'react';
import { ArrowLeft, Sparkles, Code2, Users, FolderKanban, Database, Zap, Shield, Trophy } from 'lucide-react';

const TEAM = [
  {
    name: 'Ishan Mohammed',
    role: 'Project Lead & Backend Development',
    initials: 'IM',
    from: '#7C3AED', to: '#06B6D4',
    skills: ['Node.js', 'Express', 'System Architecture'],
  },
  {
    name: 'Indrajith S.',
    role: 'Frontend Development',
    initials: 'IS',
    from: '#06B6D4', to: '#FBBF24',
    skills: ['React.js', 'UI/UX Design', 'Vite'],
  },
  {
    name: 'Vignesh V. Gopal',
    role: 'Database Design, Documentation & Testing',
    initials: 'VG',
    from: '#FBBF24', to: '#7C3AED',
    skills: ['SQLite', 'QA Testing', 'Documentation'],
  },
];

const TECH_STACK = [
  { label: 'React + Vite', icon: Code2, color: '#61DAFB', desc: 'Frontend framework' },
  { label: 'Node.js + Express', icon: Zap, color: '#68A063', desc: 'Backend API server' },
  { label: 'SQLite + Promises', icon: Database, color: '#06B6D4', desc: 'Persistent storage' },
  { label: 'JWT Auth', icon: Shield, color: '#FBBF24', desc: 'Secure authentication' },
  { label: 'Automation Engine', icon: Sparkles, color: '#7C3AED', desc: 'Progress orchestration' },
  { label: 'Certificate System', icon: Trophy, color: '#F59E0B', desc: 'Verified credentials' },
];

export default function AboutProject({ onBack, userRole }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#070B14' }}>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 animate-float"
          style={{ background: 'radial-gradient(circle, #7C3AED, transparent)', filter: 'blur(120px)' }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-8 animate-float-slow"
          style={{ background: 'radial-gradient(circle, #06B6D4, transparent)', filter: 'blur(100px)' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">

        {/* Back button */}
        <button onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-white transition-colors mb-12">
          <ArrowLeft className="h-3.5 w-3.5" /> Return to Dashboard
        </button>

        {/* Header */}
        <div className="text-center mb-14 animate-fade-slide-up opacity-0" style={{ animationFillMode: 'forwards' }}>
          <div className="inline-flex p-3 rounded-2xl mb-5"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <FolderKanban className="h-6 w-6 text-purple-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3" style={{ fontFamily: 'Space Grotesk' }}>
            About the{' '}
            <span style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Project
            </span>
          </h1>
          <p className="section-label">LumionaFlow — LMS Automation Engine</p>
        </div>

        {/* Mission Block */}
        <div className="glass-panel rounded-3xl p-8 mb-8 animate-fade-slide-up opacity-0 delay-200" style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl" style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <Sparkles className="h-4 w-4 text-purple-400" />
            </div>
            <span className="section-label">Project Mission</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed mb-5">
            LumionaFlow is an intelligent learning management system built to demonstrate progression-driven automation. By enforcing linear roadmap milestones, gated assessment scoring checks, and capstone project validations, it shifts learning tracking away from passive content lists to a verified, gamified journey with real accountability.
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            The platform features JWT-secured authentication, sequential module unlocking, mentor-reviewed project submissions, and automated certificate generation — demonstrating a full production-grade LMS workflow with zero manual intervention once a student begins.
          </p>
        </div>

        {/* Tech Stack */}
        <div className="mb-8 animate-fade-slide-up opacity-0 delay-300" style={{ animationFillMode: 'forwards' }}>
          <h2 className="text-base font-bold text-white mb-4" style={{ fontFamily: 'Space Grotesk' }}>
            Technology Stack
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {TECH_STACK.map((tech, i) => {
              const Icon = tech.icon;
              return (
                <div key={i} className="glass-panel glass-panel-hover rounded-2xl p-4 transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="h-4 w-4 shrink-0" style={{ color: tech.color }} />
                    <span className="text-xs font-bold text-white">{tech.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">{tech.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team */}
        <div className="animate-fade-slide-up opacity-0 delay-400" style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
              <Users className="h-3.5 w-3.5 text-cyan-400" />
            </div>
            <h2 className="text-base font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>Development Team</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TEAM.map((member, i) => (
              <div key={i} className="glass-panel glass-panel-hover rounded-3xl p-6 text-center transition-all">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-lg font-bold text-white relative"
                  style={{
                    background: `linear-gradient(135deg, ${member.from}, ${member.to})`,
                    boxShadow: `0 0 20px ${member.from}40`,
                  }}>
                  {member.initials}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 bg-emerald-500"
                    style={{ borderColor: '#0D1117' }} />
                </div>
                <h3 className="text-sm font-bold text-white mb-1" style={{ fontFamily: 'Space Grotesk' }}>{member.name}</h3>
                <p className="text-[10px] text-slate-500 mb-4 leading-snug">{member.role}</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {member.skills.map((skill, j) => (
                    <span key={j} className="text-[9px] font-bold px-2.5 py-1 rounded-lg"
                      style={{ background: `${member.from}18`, color: member.from, border: `1px solid ${member.from}30` }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back CTA */}
        <div className="mt-12 text-center animate-fade-slide-up opacity-0 delay-500" style={{ animationFillMode: 'forwards' }}>
          <button onClick={onBack}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', boxShadow: '0 0 25px rgba(124,58,237,0.3)' }}>
            <ArrowLeft className="h-4 w-4" />
            Return to {userRole === 'mentor' ? 'Mentor' : 'Student'} Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
