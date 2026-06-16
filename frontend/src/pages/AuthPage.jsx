import React, { useState } from 'react';
import { Mail, Lock, User, Sparkles, UserCheck, ShieldAlert, ArrowLeft, Loader2, Zap, GraduationCap } from 'lucide-react';

const BRAND_FEATURES = [
  { icon: Zap, label: 'Intelligent Automation', desc: 'Sequential milestones unlock automatically as you progress.' },
  { icon: GraduationCap, label: 'Mentor-Verified Credentials', desc: 'Certificates issued only after expert review and approval.' },
  { icon: Sparkles, label: 'AI-Powered Assessments', desc: 'Smart quizzes that reinforce exactly what you just learned.' },
];

export default function AuthPage({ onNavigate, onAuthSuccess, backendUrl }) {
  const [authMode, setAuthMode] = useState('student-login'); // 'student-login' | 'student-signup' | 'mentor-login'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (authMode === 'mentor-login') {
      if (!name.trim()) { setError('Please enter your Mentor Name.'); return; }
      if (!password) { setError('Please enter your password.'); return; }
    } else if (authMode === 'student-login') {
      if (!email || !password) { setError('Email and password are required.'); return; }
    } else { // student-signup
      if (!name) { setError('Please enter your name.'); return; }
      if (!email || !password) { setError('Email and password are required.'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    }

    setLoading(true);
    try {
      let endpoint = '';
      let payload = {};

      if (authMode === 'mentor-login') {
        endpoint = '/api/auth/mentor-login';
        payload = { name, password };
      } else if (authMode === 'student-login') {
        endpoint = '/api/auth/login';
        payload = { email, password };
      } else {
        endpoint = '/api/auth/signup';
        payload = { name, email, password, role: 'student' };
      }

      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Authentication failed');

      setSuccess(
        authMode === 'mentor-login'
          ? 'Welcome back, Mentor! Opening control console...'
          : authMode === 'student-login'
          ? 'Welcome back! Opening your workspace...'
          : 'Account created! Preparing your journey...'
      );
      setTimeout(() => onAuthSuccess(data.token, data.user), 1200);
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#070B14' }}>

      {/* ── Left Brand Panel (desktop only) ─────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(135deg, #0D1117 0%, #0F1629 50%, #0D1117 100%)' }}>

        {/* Ambient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full animate-float"
            style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div className="absolute bottom-20 right-10 w-72 h-72 rounded-full animate-float-slow"
            style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)', filter: 'blur(70px)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(49,46,129,0.3) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 rounded-2xl" style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}>
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
            LumionaFlow
          </span>
        </div>

        {/* Main copy */}
        <div className="relative z-10 space-y-10">
          <div>
            <h2 className="text-5xl font-bold text-white leading-tight mb-4" style={{ fontFamily: 'Space Grotesk' }}>
              Your intelligent<br />
              <span style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                learning journey
              </span><br />
              starts here.
            </h2>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              An AI-powered LMS that automates your path from beginner to certified professional.
            </p>
          </div>

          <div className="space-y-5">
            {BRAND_FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="p-2.5 rounded-xl shrink-0" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)' }}>
                    <Icon className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white mb-0.5">{f.label}</div>
                    <div className="text-xs text-slate-500 leading-relaxed">{f.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom credentials hint */}
        <div className="relative z-10 text-xs text-slate-600">
          Demo Student: student@luminaflow.com · password123 | Demo Mentor: Sarah Vance · 123456
        </div>
      </div>

      {/* ── Right Form Panel ─────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }} />

        <div className="w-full max-w-[400px] animate-scale-in">
          {/* Back button */}
          <button onClick={() => onNavigate('landing')}
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-white transition-colors mb-8">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </button>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}>
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-base text-white" style={{ fontFamily: 'Space Grotesk' }}>LumionaFlow</span>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk' }}>
              {authMode === 'mentor-login' ? 'Mentor Portal' : authMode === 'student-login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-sm text-slate-500">
              {authMode === 'mentor-login' ? 'Access your student dashboard monitoring tools.' : authMode === 'student-login' ? 'Sign in to continue your learning journey.' : 'Join and start your intelligent learning path.'}
            </p>
          </div>

          {/* Tab toggle */}
          <div className="flex p-1 rounded-xl mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {[
              { id: 'student-login', label: 'Student Login' },
              { id: 'student-signup', label: 'Student Signup' },
              { id: 'mentor-login', label: 'Mentor Login' }
            ].map(tab => (
              <button key={tab.id} type="button"
                onClick={() => { setAuthMode(tab.id); setError(''); setSuccess(''); setName(''); setEmail(''); setPassword(''); setConfirmPassword(''); }}
                className="flex-1 py-2 text-[10px] font-bold rounded-lg transition-all"
                style={
                  authMode === tab.id
                    ? { background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.2))', color: '#E2E8F0', border: '1px solid rgba(124,58,237,0.3)' }
                    : { color: '#64748B' }
                }>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl mb-5 text-xs font-medium"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5' }}>
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl mb-5 text-xs font-medium"
              style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', color: '#67E8F9' }}>
              <UserCheck className="h-4 w-4 shrink-0 mt-0.5 text-cyan-400" />
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === 'mentor-login' && (
              <div>
                <label className="section-label block mb-1.5">Mentor Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input type="text" placeholder="Dr. Sarah Vance" value={name} onChange={e => setName(e.target.value)}
                    className="glass-input pl-11" required />
                </div>
              </div>
            )}

            {authMode === 'student-signup' && (
              <div>
                <label className="section-label block mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input type="text" placeholder="Alex Mercer" value={name} onChange={e => setName(e.target.value)}
                    className="glass-input pl-11" required />
                </div>
              </div>
            )}

            {authMode !== 'mentor-login' && (
              <div>
                <label className="section-label block mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
                    className="glass-input pl-11" required />
                </div>
              </div>
            )}

            <div>
              <label className="section-label block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                  className="glass-input pl-11" required />
              </div>
            </div>

            {authMode === 'student-signup' && (
              <div>
                <label className="section-label block mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    className="glass-input pl-11" required />
                </div>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
              style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                boxShadow: '0 0 25px rgba(124,58,237,0.3)',
                opacity: loading ? 0.7 : 1,
              }}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : (authMode === 'mentor-login' ? 'Mentor Sign In' : authMode === 'student-login' ? 'Student Sign In' : 'Create Student Account')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
