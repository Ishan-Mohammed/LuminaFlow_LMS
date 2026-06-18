import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import MentorDashboard from './pages/MentorDashboard.jsx';
import StudentOnboarding from './pages/StudentOnboarding.jsx';
import AboutProject from './pages/AboutProject.jsx';
import AIVoiceMentor from './pages/AIVoiceMentor.jsx';
import { Loader2, Sparkles } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function App() {
  const [page, setPage] = useState('landing'); // 'landing' | 'auth' | 'student-onboarding' | 'student-dashboard' | 'mentor-dashboard' | 'about-project' | 'ai-voice-mentor'
  const [previousPage, setPreviousPage] = useState('landing');
  const [token, setToken] = useState(localStorage.getItem('lumina_token') || null);
  const [user, setUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(!!token);
  const [theme, setTheme] = useState(localStorage.getItem('lumina_theme') || 'dark');

  // Initialize and track theme updates
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('lumina_theme', theme);
  }, [theme]);

  // Validate session on launch if token exists
  useEffect(() => {
    const checkSession = async () => {
      if (!token) {
        if (window.location.pathname === '/ai-voice-mentor') {
          setPage('auth');
        } else {
          setPage('landing');
        }
        setLoadingSession(false);
        return;
      }
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Guard: always check res.ok before parsing JSON — prevents "Unexpected token" crashes
        // when server returns an HTML error page (e.g. cold-start 503, nginx error)
        if (!res.ok) {
          handleLogout();
          return;
        }

        const data = await res.json();
        setUser(data);
        if (data.role === 'mentor') {
          setPage('mentor-dashboard');
        } else {
          if (window.location.pathname === '/ai-voice-mentor') {
            setPage('ai-voice-mentor');
          } else if (data.selected_course_id) {
            setPage('student-dashboard');
          } else {
            setPage('student-onboarding');
          }
        }
      } catch (err) {
        console.error('Session verification failed:', err);
        handleLogout();
      } finally {
        setLoadingSession(false);
      }
    };

    checkSession();
  }, [token]);

  // Listen for back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/ai-voice-mentor') {
        if (token) {
          setPage('ai-voice-mentor');
        } else {
          setPage('auth');
        }
      } else if (path === '/') {
        if (token && user) {
          setPage(user.role === 'mentor' ? 'mentor-dashboard' : 'student-dashboard');
        } else {
          setPage('landing');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [token, user]);

  const navigateToPage = (newPage) => {
    if (newPage === 'ai-voice-mentor') {
      window.history.pushState({}, '', '/ai-voice-mentor');
    } else if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
    setPage(newPage);
  };

  const handleAuthSuccess = (newToken, newUser) => {
    localStorage.setItem('lumina_token', newToken);
    setToken(newToken);
    setUser(newUser);

    if (newUser.role === 'mentor') {
      setPage('mentor-dashboard');
    } else {
      if (window.location.pathname === '/ai-voice-mentor') {
        setPage('ai-voice-mentor');
      } else if (newUser.selected_course_id) {
        setPage('student-dashboard');
      } else {
        setPage('student-onboarding');
      }
    }
  };

  const handleOnboardingComplete = (selectedCourseId, selectedLevel) => {
    setUser(prev => ({
      ...prev,
      selected_course_id: selectedCourseId,
      selected_bootcamp_level: selectedLevel || 'Beginner'
    }));
    setPage('student-dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('lumina_token');
    setToken(null);
    setUser(null);
    setPage('landing');
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const navigateToAbout = () => {
    setPreviousPage(page);
    setPage('about-project');
  };

  const handleAboutBack = () => {
    setPage(previousPage);
  };

  // Session loader screen
  if (loadingSession) {
    return (
      <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center text-white gap-4">
        {/* Particle circles background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0,transparent_60%)]"></div>
        <div className="bg-indigo-600/10 p-4 rounded-3xl border border-indigo-500/25 relative animate-pulse-slow">
          <Sparkles className="h-10 w-10 text-indigo-400" />
        </div>
        <div className="flex items-center gap-2 mt-4">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-400 via-violet-400 to-rose-400 bg-clip-text text-transparent">
            LumionaFlow
          </span>
        </div>
        <p className="text-xs text-slate-500 font-medium tracking-wide">Syncing secure education engine...</p>
      </div>
    );
  }

  return (
    <>
      {/* Ambient Background Circles */}
      <div className="mesh-bg">
        <div className="mesh-circle mesh-circle-1 animate-float"></div>
        <div className="mesh-circle mesh-circle-2 animate-float-slow"></div>
        <div className="mesh-circle mesh-circle-3 animate-float"></div>
      </div>

      {/* Pages Router Switcher */}
      {page === 'landing' && (
        <LandingPage
          onNavigate={navigateToPage}
          isAuthenticated={!!token}
          user={user}
        />
      )}

      {page === 'auth' && (
        <AuthPage
          onNavigate={navigateToPage}
          onAuthSuccess={handleAuthSuccess}
          backendUrl={BACKEND_URL}
        />
      )}

      {page === 'student-onboarding' && (
        <StudentOnboarding
          token={token}
          onOnboardingComplete={handleOnboardingComplete}
          backendUrl={BACKEND_URL}
        />
      )}

      {page === 'about-project' && (
        <AboutProject
          onBack={handleAboutBack}
          userRole={user?.role}
        />
      )}

      {page === 'student-dashboard' && (
        <StudentDashboard
          token={token}
          user={user}
          onLogout={handleLogout}
          backendUrl={BACKEND_URL}
          theme={theme}
          toggleTheme={toggleTheme}
          onNavigateToAbout={navigateToAbout}
          onNavigate={navigateToPage}
        />
      )}

      {page === 'ai-voice-mentor' && (
        <AIVoiceMentor
          token={token}
          user={user}
          onLogout={handleLogout}
          backendUrl={BACKEND_URL}
          theme={theme}
          toggleTheme={toggleTheme}
          onNavigate={navigateToPage}
        />
      )}

      {page === 'mentor-dashboard' && (
        <MentorDashboard
          token={token}
          user={user}
          onLogout={handleLogout}
          backendUrl={BACKEND_URL}
          theme={theme}
          toggleTheme={toggleTheme}
          onNavigateToAbout={navigateToAbout}
        />
      )}
    </>
  );
}
