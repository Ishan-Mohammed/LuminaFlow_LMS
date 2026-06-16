import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, FileCheck2, Hourglass, Award, LogOut, Check, X, Sparkles, Loader2, MessageSquare, AlertCircle, GitBranch, FolderArchive, FileText, LayoutDashboard } from 'lucide-react';

export default function MentorDashboard({ token, user, onLogout, backendUrl, theme, toggleTheme, onNavigateToAbout }) {
  // ── State (unchanged) ──────────────────────────────────────────
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [feedbackMap, setFeedbackMap] = useState({});
  const [reviewingId, setReviewingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStudentDetail, setActiveStudentDetail] = useState(null);

  // ── API Calls (unchanged) ──────────────────────────────────────
  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [studentsRes, submissionsRes, analyticsRes] = await Promise.all([
        fetch(`${backendUrl}/api/mentor/students`, { headers }),
        fetch(`${backendUrl}/api/mentor/submissions`, { headers }),
        fetch(`${backendUrl}/api/mentor/analytics`, { headers }),
      ]);
      const studentsData = await studentsRes.json();
      const submissionsData = await submissionsRes.json();
      const analyticsData = await analyticsRes.json();
      if (!studentsRes.ok) throw new Error(studentsData.error || 'Failed to fetch students');
      if (!submissionsRes.ok) throw new Error(submissionsData.error || 'Failed to fetch submissions');
      if (!analyticsRes.ok) throw new Error(analyticsData.error || 'Failed to fetch analytics');
      setStudents(studentsData);
      setSubmissions(submissionsData);
      setAnalytics(analyticsData);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const handleReview = async (submissionId, status) => {
    const feedback = feedbackMap[submissionId] || '';
    if (status === 'rejected' && !feedback.trim()) { setError('Please provide feedback explaining what revisions are required.'); return; }
    setReviewingId(submissionId); setError('');
    try {
      const res = await fetch(`${backendUrl}/api/mentor/submissions/${submissionId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status, feedback }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Review failed.');
      setFeedbackMap({ ...feedbackMap, [submissionId]: '' });
      await fetchData();
    } catch (err) { setError(err.message); }
    finally { setReviewingId(null); }
  };

  const handleFeedbackChange = (id, text) => setFeedbackMap({ ...feedbackMap, [id]: text });

  const chartData = analytics?.studentStats?.length > 0
    ? analytics.studentStats.map(item => ({ name: item.date, Students: item.count }))
    : [
        { name: 'Day 1', Students: 1 }, { name: 'Day 2', Students: 3 },
        { name: 'Day 3', Students: 2 }, { name: 'Day 4', Students: 5 },
        { name: 'Day 5', Students: 4 }, { name: 'Day 6', Students: 7 },
      ];

  const kpiCards = [
    { label: 'Total Students', value: analytics?.activeStudents ?? '—', icon: Users, color: '#7C3AED', bg: 'rgba(124,58,237,0.1)', border: 'rgba(124,58,237,0.2)', sub: 'Enrolled learners' },
    { label: 'Graduates', value: analytics?.completedCourses ?? '—', icon: Award, color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', sub: 'Certified' },
    { label: 'Pending Queue', value: analytics?.pendingReviews ?? '—', icon: Hourglass, color: '#FBBF24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)', sub: 'Awaiting review' },
    { label: 'Completion Rate', value: `${analytics?.completionRate ?? '—'}%`, icon: FileCheck2, color: '#06B6D4', bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.2)', sub: 'Graduate ratio' },
  ];

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#070B14' }}>

      {/* ── Ambient BG ──────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-10 -left-10 w-96 h-96 rounded-full opacity-10 animate-float"
          style={{ background: 'radial-gradient(circle, #312E81, transparent)', filter: 'blur(120px)' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-8 animate-float-slow"
          style={{ background: 'radial-gradient(circle, #06B6D4, transparent)', filter: 'blur(100px)' }} />
      </div>

      {/* ═══════════════════ SIDEBAR ══════════════════════════════ */}
      <aside className="relative z-20 w-72 shrink-0 hidden lg:flex flex-col lg:sticky lg:top-0 lg:h-screen"
        style={{ background: 'rgba(13, 17, 23, 0.9)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="p-2.5 rounded-xl" style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', boxShadow: '0 0 20px rgba(124,58,237,0.35)' }}>
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm text-white" style={{ fontFamily: 'Space Grotesk' }}>LumionaFlow</div>
            <div className="text-[9px] font-semibold uppercase tracking-widest text-slate-600">Mentor Portal</div>
          </div>
        </div>

        {/* Mentor identity */}
        <div className="mx-4 my-4 p-4 rounded-2xl relative" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="absolute top-3 right-3 w-2 h-2 rounded-full animate-pulse-slow" style={{ background: '#7C3AED' }} />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #7C3AED30, #06B6D430)', border: '1px solid rgba(124,58,237,0.3)' }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'M'}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200 truncate">{user?.name}</div>
              <div className="text-[9px] text-slate-500 truncate">{user?.email}</div>
              <div className="text-[9px] font-bold mt-0.5" style={{ color: '#7C3AED' }}>Mentor Access</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {[
            { label: 'Command Center', icon: LayoutDashboard, active: true },
            { label: 'About Project', icon: FileText, action: 'about' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.label}
                onClick={() => item.action === 'about' && onNavigateToAbout?.()}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left"
                style={{
                  color: item.active ? '#A78BFA' : '#64748B',
                  background: item.active ? 'rgba(124,58,237,0.08)' : 'transparent',
                  border: item.active ? '1px solid rgba(124,58,237,0.15)' : '1px solid transparent',
                }}>
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
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

        {/* Mobile nav */}
        <div className="lg:hidden flex items-center justify-between px-5 py-4"
          style={{ background: 'rgba(13,17,23,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}>
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-white" style={{ fontFamily: 'Space Grotesk' }}>Mentor Portal</span>
          </div>
          <button onClick={onLogout} className="text-red-400 text-xs font-semibold">
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="section-label mb-1">Command Center</p>
              <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>
                Mentor Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={onNavigateToAbout}
                className="text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94A3B8' }}>
                <FileText className="h-3.5 w-3.5 inline mr-1.5" />About Project
              </button>
              <button onClick={fetchData}
                className="text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
                style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', color: '#A78BFA' }}>
                Refresh Data
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 p-4 rounded-2xl text-xs font-semibold"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5' }}>
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              <button onClick={() => setError('')} className="ml-auto text-slate-500 hover:text-white">✕</button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-28 gap-4">
              <div className="p-4 rounded-2xl animate-glow-pulse" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <Loader2 className="h-7 w-7 text-purple-400 animate-spin" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Loading mentor command center...</span>
            </div>
          ) : (
            <>
              {/* ── KPI Cards ───────────────────────────────────── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <div key={i} className="stat-card group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-2.5 rounded-xl transition-transform group-hover:scale-110"
                          style={{ background: card.bg, border: `1px solid ${card.border}` }}>
                          <Icon className="h-4 w-4" style={{ color: card.color }} />
                        </div>
                      </div>
                      <div className="text-3xl font-black" style={{ color: card.color, fontFamily: 'Space Grotesk' }}>
                        {card.value}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: '#475569' }}>
                        {card.label}
                      </div>
                      <div className="text-[9px] text-slate-600 mt-0.5">{card.sub}</div>
                    </div>
                  );
                })}
              </div>

              {/* ── Area Chart ──────────────────────────────────── */}
              <div className="glass-panel rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>Student Enrollment Timeline</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Cumulative intake progression over time</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#7C3AED' }} />
                    <span className="text-[10px] text-slate-500 font-semibold">Students</span>
                  </div>
                </div>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="mentorGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.4} />
                          <stop offset="50%" stopColor="#06B6D4" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" stroke="#334155" fontSize={9} tickLine={false} />
                      <YAxis stroke="#334155" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{
                        backgroundColor: '#0D1117', border: '1px solid rgba(124,58,237,0.3)',
                        borderRadius: '12px', color: '#F1F5F9', fontSize: '11px',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                      }} />
                      <Area type="monotone" dataKey="Students" stroke="#7C3AED" strokeWidth={2} fillOpacity={1} fill="url(#mentorGrad)" dot={false} activeDot={{ r: 4, fill: '#06B6D4', strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── Submissions + Students Grid ──────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Submissions Panel */}
                <div className="lg:col-span-7 glass-panel rounded-3xl p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-sm font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>Grading Queue</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">{submissions.length} submission{submissions.length !== 1 ? 's' : ''} to review</p>
                    </div>
                    {submissions.filter(s => s.status === 'pending').length > 0 && (
                      <div className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider"
                        style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#FCD34D' }}>
                        {submissions.filter(s => s.status === 'pending').length} Pending
                      </div>
                    )}
                  </div>

                  {submissions.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                      <div className="p-4 rounded-2xl mb-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <FileCheck2 className="h-6 w-6 text-slate-600" />
                      </div>
                      <p className="text-xs text-slate-500">No submissions yet — queue is clear</p>
                    </div>
                  ) : (
                    <div className="flex-1 space-y-5 max-h-[520px] overflow-y-auto pr-1">
                      {submissions.map((sub) => {
                        const isPending = sub.status === 'pending';
                        const isReviewing = reviewingId === sub.id;
                        const statusStyle = isPending
                          ? { bg: 'rgba(251,191,36,0.05)', border: 'rgba(251,191,36,0.2)', badgeBg: 'rgba(251,191,36,0.1)', badgeColor: '#FCD34D', label: 'Pending' }
                          : sub.status === 'approved'
                          ? { bg: 'rgba(16,185,129,0.04)', border: 'rgba(16,185,129,0.15)', badgeBg: 'rgba(16,185,129,0.1)', badgeColor: '#34D399', label: 'Approved' }
                          : { bg: 'rgba(239,68,68,0.04)', border: 'rgba(239,68,68,0.15)', badgeBg: 'rgba(239,68,68,0.1)', badgeColor: '#FCA5A5', label: 'Revision' };

                        return (
                          <div key={sub.id} className="p-5 rounded-2xl transition-all"
                            style={{ background: statusStyle.bg, border: `1px solid ${statusStyle.border}` }}>
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div>
                                <h4 className="font-bold text-sm text-white leading-snug">{sub.title}</h4>
                                <div className="text-[10px] text-slate-500 mt-1">
                                  <span className="font-bold" style={{ color: '#A78BFA' }}>{sub.studentName}</span>
                                  {' · '}{sub.studentEmail}
                                </div>
                              </div>
                              <span className="text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider shrink-0"
                                style={{ background: statusStyle.badgeBg, color: statusStyle.badgeColor, border: `1px solid ${statusStyle.border}` }}>
                                {statusStyle.label}
                              </span>
                            </div>

                            <p className="text-xs text-slate-400 leading-relaxed p-3 rounded-xl mb-3"
                              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                              {sub.description}
                            </p>

                            {/* Links */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
                              {sub.github_link && (
                                <a href={sub.github_link} target="_blank" rel="noreferrer"
                                  className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold text-slate-300 transition-all"
                                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                  <GitBranch className="h-3.5 w-3.5 text-purple-400 shrink-0" /> View Repository
                                </a>
                              )}
                              {sub.file_path && (
                                <div className="flex items-center gap-2 p-2.5 rounded-xl text-xs text-slate-400"
                                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                  <FolderArchive className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                                  <span className="truncate">{sub.file_path}</span>
                                </div>
                              )}
                            </div>

                            {sub.feedback && !isPending && (
                              <div className="p-3 rounded-xl mb-3" style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)' }}>
                                <div className="section-label mb-1">Feedback given</div>
                                <p className="text-[10px] text-slate-400 italic">"{sub.feedback}"</p>
                              </div>
                            )}

                            {isPending && (
                              <div className="mt-2 pt-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <div className="relative">
                                  <MessageSquare className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-slate-500" />
                                  <input type="text"
                                    placeholder="Write feedback (required for rejection)..."
                                    value={feedbackMap[sub.id] || ''}
                                    onChange={(e) => handleFeedbackChange(sub.id, e.target.value)}
                                    className="glass-input pl-10 text-xs" />
                                </div>
                                <div className="flex gap-2.5">
                                  <button onClick={() => handleReview(sub.id, 'approved')} disabled={isReviewing}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.97]"
                                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34D399' }}>
                                    {isReviewing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                    Approve
                                  </button>
                                  <button onClick={() => handleReview(sub.id, 'rejected')} disabled={isReviewing}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.97]"
                                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5' }}>
                                    {isReviewing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                                    Request Revision
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Student Roster */}
                <div className="lg:col-span-5 glass-panel rounded-3xl p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-sm font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>Student Roster</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">{students.length} enrolled</p>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3 max-h-[520px] overflow-y-auto pr-1">
                    {students.map((student) => {
                      const initials = student.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'S';
                      const projectColors = {
                        approved: { text: '#34D399', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
                        pending: { text: '#FCD34D', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)' },
                        none: { text: '#475569', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)' },
                      };
                      const pc = projectColors[student.projectStatus] || projectColors.none;

                      return (
                        <div key={student.id}
                          onClick={() => setActiveStudentDetail(student)}
                          className="p-4 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-purple-500/30 hover:bg-white/[0.04]"
                          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.3))', border: '1px solid rgba(124,58,237,0.2)' }}>
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-white truncate">{student.name}</div>
                              <div className="text-[9px] text-purple-400 font-medium truncate">{student.courseTitle}</div>
                            </div>
                            <span className="text-[9px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider shrink-0"
                              style={{ background: pc.bg, color: pc.text, border: `1px solid ${pc.border}` }}>
                              {student.projectStatus === 'none' ? 'No sub.' : student.projectStatus}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="text-[9px] text-slate-400 truncate">
                              <span className="font-semibold text-slate-500">Current Chapter:</span> {student.currentModule}
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Track Progress</span>
                                <span className="text-[9px] font-bold" style={{ color: '#7C3AED' }}>
                                  {student.progressPercent}% ({student.completedModules}/{student.totalModules})
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                <div className="h-full rounded-full transition-all duration-700"
                                  style={{ width: `${student.progressPercent}%`, background: 'linear-gradient(90deg, #7C3AED, #06B6D4)' }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {students.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Users className="h-6 w-6 text-slate-600 mb-2" />
                        <p className="text-xs text-slate-500">No students enrolled yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* ── Student Detail Modal ── */}
      {activeStudentDetail && (() => {
        const activeStudent = students.find(s => s.id === activeStudentDetail.id);
        if (!activeStudent) return null;
        const initials = activeStudent.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'S';
        const project = activeStudent.project;
        const cert = activeStudent.certificate;
        const hasProject = !!project;
        const isProjectPending = project?.status === 'pending';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
            style={{ background: 'rgba(7, 11, 20, 0.85)', backdropFilter: 'blur(12px)' }}>
            <div className="w-full max-w-2xl rounded-3xl flex flex-col max-h-[88vh] animate-scale-in"
              style={{ background: '#0D1117', border: '1px solid rgba(124,58,237,0.3)', boxShadow: '0 0 60px rgba(124,58,237,0.2)' }}>
              
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.3))', border: '1px solid rgba(124,58,237,0.2)' }}>
                    {initials}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-snug">{activeStudent.name}</h3>
                    <p className="text-[10px] text-slate-500">{activeStudent.email} · Enrolled {new Date(activeStudent.joinedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <button onClick={() => setActiveStudentDetail(null)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:text-white text-xs transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>✕</button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Track and Progress Summary */}
                <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="section-label mb-1">Selected Learning Track</div>
                      <div className="text-xs font-bold text-white">{activeStudent.courseTitle}</div>
                    </div>
                    <div>
                      <div className="section-label mb-1">Current Milestone Node</div>
                      <div className="text-xs font-bold text-purple-400">{activeStudent.currentModule}</div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Overall Progress</span>
                      <span className="text-[10px] font-bold text-purple-400">
                        {activeStudent.progressPercent}% ({activeStudent.completedModules}/{activeStudent.totalModules} Chapters Completed)
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${activeStudent.progressPercent}%`, background: 'linear-gradient(90deg, #7C3AED, #06B6D4)' }} />
                    </div>
                  </div>
                </div>

                {/* Assessment Performance Checkpoints */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileCheck2 className="h-4 w-4 text-purple-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Assessment Checkpoints</h4>
                  </div>
                  {activeStudent.assessmentScores?.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No quiz scores recorded yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeStudent.assessmentScores.map((score, i) => (
                        <div key={i} className="p-3 rounded-xl flex items-center justify-between"
                          style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <div className="min-w-0 pr-2">
                            <div className="text-[10px] font-semibold text-slate-300 truncate">{score.moduleTitle}</div>
                            <div className="text-[9px] text-slate-500 mt-0.5">
                              {score.completed ? 'Checkpoint Passed' : score.unlocked ? 'Currently Studying' : 'Locked'}
                            </div>
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${score.completed ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-500/5'}`}>
                            {score.score !== null && score.score !== undefined ? `${score.score}%` : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Capstone Project Submission Details */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="h-4 w-4 text-yellow-500" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Capstone Project Console</h4>
                  </div>

                  {!hasProject ? (
                    <div className="p-4 rounded-2xl text-center border border-dashed border-slate-700/50" style={{ background: 'rgba(255,255,255,0.01)' }}>
                      <p className="text-xs text-slate-500">Student has not submitted a capstone project yet.</p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl space-y-4" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-white">{project.title}</div>
                          <div className="text-[9px] text-slate-500 mt-0.5">Submitted {new Date(project.submitted_at).toLocaleString()}</div>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-widest ${
                          project.status === 'approved' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' :
                          project.status === 'rejected' ? 'text-red-400 bg-red-500/10 border border-red-500/20' :
                          'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20'
                        }`}>
                          {project.status === 'rejected' ? 'Revision Needed' : project.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed p-3 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {project.description}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {project.github_link && (
                          <a href={project.github_link} target="_blank" rel="noreferrer"
                            className="flex items-center gap-2 p-2.5 rounded-xl text-[10px] font-semibold text-slate-300 hover:text-white hover:bg-white/[0.04] transition-all"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <GitBranch className="h-3.5 w-3.5 text-purple-400 shrink-0" /> Open Repository
                          </a>
                        )}
                        {project.file_path && (
                          <div className="flex items-center gap-2 p-2.5 rounded-xl text-[10px] text-slate-400"
                            style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <FolderArchive className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                            <span className="truncate">{project.file_path}</span>
                          </div>
                        )}
                      </div>

                      {project.feedback && (
                        <div className="p-3 rounded-xl" style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.12)' }}>
                          <div className="text-[9px] font-semibold text-slate-500 uppercase">Reviewer Feedback</div>
                          <p className="text-xs text-slate-300 italic mt-1">"{project.feedback}"</p>
                        </div>
                      )}

                      {/* Review Section */}
                      {isProjectPending && (
                        <div className="mt-3 pt-3 border-t border-slate-800 space-y-3">
                          <div className="relative">
                            <MessageSquare className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-500" />
                            <input type="text"
                              placeholder="Write reviewer feedback (required for revision request)..."
                              value={feedbackMap[project.id] || ''}
                              onChange={(e) => handleFeedbackChange(project.id, e.target.value)}
                              className="glass-input pl-9 text-xs" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleReview(project.id, 'approved')} disabled={reviewingId === project.id}
                              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all active:scale-[0.98]">
                              <Check className="h-3.5 w-3.5" /> Approve Submission
                            </button>
                            <button onClick={() => handleReview(project.id, 'rejected')} disabled={reviewingId === project.id}
                              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all active:scale-[0.98]">
                              <X className="h-3.5 w-3.5" /> Request Revision
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Digital Verified Certificate Status */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="h-4 w-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Digital Verified Certificate</h4>
                  </div>
                  {cert ? (
                    <div className="p-4 rounded-2xl flex items-center justify-between gold-glow-border relative overflow-hidden"
                      style={{ background: 'rgba(251,191,36,0.03)' }}>
                      <div>
                        <div className="text-xs font-bold text-yellow-400">Issued & Verified</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Code: <span className="font-mono">{cert.certificate_code}</span></div>
                        <div className="text-[9px] text-slate-500 mt-0.5">Issued on {new Date(cert.issued_at).toLocaleDateString()}</div>
                      </div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: 'rgba(251,191,36,0.1)' }}>🎓</div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl border border-dashed border-slate-700/50 text-center" style={{ background: 'rgba(255,255,255,0.01)' }}>
                      <p className="text-xs text-slate-500">Certificate not yet issued (Requires quiz checkpoints passed & approved project).</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
