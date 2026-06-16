import React, { useState } from 'react';
import { Compass, Sparkles, Loader2, BookOpen, Brain, PenTool, Code, Cpu, AlertCircle, ChevronRight, Check } from 'lucide-react';

const TRACKS = [
  {
    id: 'course-ai-foundations',
    title: 'AI Foundations',
    subtitle: 'AI & Data Science',
    icon: Brain,
    gradient: 'from-purple-electric to-indigo-deep',
    iconBg: 'rgba(124,58,237,0.15)',
    iconBorder: 'rgba(124,58,237,0.3)',
    iconColor: '#A78BFA',
    activeBorder: 'rgba(124,58,237,0.5)',
    activeGlow: 'rgba(124,58,237,0.15)',
    description: 'Master artificial intelligence fundamentals — from Turing tests to machine learning, AI tools, and ethical considerations.',
    duration: '4 Modules · ~8 hrs',
    modules: ['Introduction to Artificial Intelligence', 'Machine Learning Fundamentals', 'AI Tools and Applications', 'AI Ethics and Future Trends'],
  },
  {
    id: 'course-ai-content',
    title: 'AI Content Creation',
    subtitle: 'AI Marketing & Design',
    icon: PenTool,
    gradient: 'from-cyan-accent to-purple-electric',
    iconBg: 'rgba(6,182,212,0.15)',
    iconBorder: 'rgba(6,182,212,0.3)',
    iconColor: '#67E8F9',
    activeBorder: 'rgba(6,182,212,0.5)',
    activeGlow: 'rgba(6,182,212,0.12)',
    description: 'Learn content strategies, AI-powered writing, visual asset creation, and automated publishing workflows.',
    duration: '4 Modules · ~7 hrs',
    modules: ['Content Strategy Fundamentals', 'AI-Powered Content Generation', 'Visual & Multimedia Creation', 'Content Optimization & Publishing'],
  },
  {
    id: 'course-ai-dev',
    title: 'AI Software Development',
    subtitle: 'AI Engineering',
    icon: Code,
    gradient: 'from-gold-brand to-cyan-accent',
    iconBg: 'rgba(251,191,36,0.12)',
    iconBorder: 'rgba(251,191,36,0.25)',
    iconColor: '#FCD34D',
    activeBorder: 'rgba(251,191,36,0.4)',
    activeGlow: 'rgba(251,191,36,0.08)',
    description: 'Build real AI applications using API integrations, RAG systems, vector databases, and cloud deployment.',
    duration: '4 Modules · ~10 hrs',
    modules: ['Introduction to AI Development', 'APIs & AI Integrations', 'Building AI Applications', 'Deployment & Project Development'],
  },
  {
    id: 'course-agentic-auto',
    title: 'Agentic Automation',
    subtitle: 'DevOps & Process Automation',
    icon: Cpu,
    gradient: 'from-indigo-deep to-cyan-accent',
    iconBg: 'rgba(49,46,129,0.3)',
    iconBorder: 'rgba(124,58,237,0.3)',
    iconColor: '#818CF8',
    activeBorder: 'rgba(124,58,237,0.4)',
    activeGlow: 'rgba(124,58,237,0.1)',
    description: 'Design autonomous agents, build multi-step workflow pipelines, and create end-to-end automation systems.',
    duration: '4 Modules · ~9 hrs',
    modules: ['Introduction to Automation Systems', 'Workflow Design & Automation', 'AI Agents & Decision Making', 'End-to-End Automation Projects'],
  },
];

export default function StudentOnboarding({ token, onOnboardingComplete, backendUrl }) {
  const [selectedTrack, setSelectedTrack] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('Beginner');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSelectTrack = async () => {
    if (!selectedTrack) { setError('Please select a learning track to generate your roadmap.'); return; }
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/student/select-course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ courseId: selectedTrack, bootcampLevel: selectedLevel }),
      });
      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const data = isJson ? await res.json() : { error: `Server error (${res.status})` };
      if (!res.ok) throw new Error(data.error || 'Failed to register selected course.');
      onOnboardingComplete(selectedTrack, selectedLevel);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const selected = TRACKS.find(t => t.id === selectedTrack);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#070B14' }}>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-15 animate-float"
          style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)', filter: 'blur(100px)' }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-10 animate-float-slow"
          style={{ background: 'radial-gradient(circle, #06B6D4 0%, transparent 70%)', filter: 'blur(100px)' }} />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center py-16 px-6">
        {/* Header */}
        <div className="text-center mb-14 animate-fade-slide-up opacity-0" style={{ animationFillMode: 'forwards' }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', color: '#67E8F9' }}>
            <Compass className="h-3 w-3" />
            Step 1 of 1 — Choose Your Path
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Space Grotesk' }}>
            Personalize Your<br />
            <span style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Learning Journey
            </span>
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Choose one of our four AI learning tracks. Your roadmap will be generated automatically with sequential checkpoints.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2.5 p-4 rounded-2xl mb-8 text-xs font-semibold max-w-2xl w-full"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5' }}>
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {/* Track Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-5xl mb-12">
          {TRACKS.map((track, i) => {
            const Icon = track.icon;
            const isSelected = selectedTrack === track.id;
            return (
              <div key={track.id}
                onClick={() => { setSelectedTrack(track.id); setError(''); }}
                className={`relative cursor-pointer rounded-3xl p-6 transition-all duration-300 group animate-fade-slide-up opacity-0`}
                style={{
                  background: isSelected
                    ? `rgba(${track.id === 'course-ai-foundations' ? '124,58,237' : track.id === 'course-ai-content' ? '6,182,212' : track.id === 'course-ai-dev' ? '251,191,36' : '124,58,237'}, 0.06)`
                    : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${isSelected ? track.activeBorder : 'rgba(255,255,255,0.07)'}`,
                  boxShadow: isSelected ? `0 0 40px ${track.activeGlow}, 0 8px 30px rgba(0,0,0,0.4)` : '0 4px 20px rgba(0,0,0,0.3)',
                  backdropFilter: 'blur(20px)',
                  transform: isSelected ? 'scale(1.01)' : undefined,
                  animationDelay: `${i * 0.1}s`,
                  animationFillMode: 'forwards',
                }}>

                {/* Selected check */}
                {isSelected && (
                  <div className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}>
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}

                {/* Icon + Title */}
                <div className="flex items-start gap-4 mb-5">
                  <div className="p-3 rounded-2xl shrink-0 transition-transform group-hover:scale-110"
                    style={{ background: track.iconBg, border: `1px solid ${track.iconBorder}` }}>
                    <Icon className="h-5 w-5" style={{ color: track.iconColor }} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: track.iconColor }}>
                      {track.subtitle}
                    </div>
                    <h3 className="text-base font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>{track.title}</h3>
                    <div className="text-[10px] text-slate-500 mt-0.5">{track.duration}</div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-5">{track.description}</p>

                {/* Module list */}
                <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                    <BookOpen className="h-3 w-3" /> Learning Chapters
                  </div>
                  <div className="space-y-1.5">
                    {track.modules.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-[10px] text-slate-400">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[8px] font-bold"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748B' }}>
                          {idx + 1}
                        </div>
                        {m}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          {selected && (
            <div className="space-y-3 max-w-sm mx-auto p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] mb-6 text-left">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1 text-center">
                Select Your Bootcamp Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => {
                  const isActive = selectedLevel === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSelectedLevel(lvl)}
                      className="py-2.5 rounded-xl text-xs font-bold transition-all"
                      style={{
                        background: isActive ? 'linear-gradient(135deg, #7C3AED, #06B6D4)' : 'rgba(255,255,255,0.03)',
                        border: isActive ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(255,255,255,0.06)',
                        color: isActive ? '#fff' : '#64748B',
                      }}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500 text-center leading-normal mt-2">
                {selectedLevel === 'Beginner' && 'Easy • Core foundations & guided labs.'}
                {selectedLevel === 'Intermediate' && 'Medium • Hands-on projects & tool chains.'}
                {selectedLevel === 'Advanced' && 'Hard • Production architectures & deployments.'}
              </p>
            </div>
          )}

          {selected && (
            <div className="text-xs text-slate-400 mb-2">
              Selected Course: <span className="font-bold text-white">{selected.title}</span>
            </div>
          )}
          <button onClick={handleSelectTrack} disabled={loading || !selectedTrack}
            className="group inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.97] shimmer"
            style={{
              background: selectedTrack ? 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)' : 'rgba(255,255,255,0.05)',
              boxShadow: selectedTrack ? '0 0 30px rgba(124,58,237,0.4)' : 'none',
              color: selectedTrack ? '#fff' : '#475569',
              cursor: selectedTrack ? 'pointer' : 'not-allowed',
            }}>
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating Roadmap...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Generate My Learning Roadmap <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
            )}
          </button>
          <p className="text-[10px] text-slate-600">Your sequential milestone roadmap is generated automatically</p>
        </div>
      </div>
    </div>
  );
}
