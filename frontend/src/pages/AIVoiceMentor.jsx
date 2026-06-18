import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Mic, 
  Square, 
  ArrowLeft, 
  Send, 
  Volume2, 
  User, 
  Loader2, 
  AlertCircle, 
  MessageSquare, 
  BookOpen, 
  RefreshCw,
  Info
} from 'lucide-react';

export default function AIVoiceMentor({ token, user, onLogout, backendUrl, theme, toggleTheme, onNavigate }) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'speaking'
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [history, setHistory] = useState([
    {
      role: 'assistant',
      content: `Hello ${user?.name?.split(' ')[0] || 'Learner'}! I am your EduFlick AI Voice Mentor. Tap the microphone orb and ask me anything about AI, Prompt Engineering, Content Creation, Software Development, or Agentic Automation.`
    }
  ]);
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [isRecognitionSupported, setIsRecognitionSupported] = useState(true);
  
  // Voice selection state
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [isTtsMuted, setIsTtsMuted] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing...');

  // Cycle loading messages when status is 'processing'
  useEffect(() => {
    if (status !== 'processing') {
      setLoadingMessage('Processing...');
      return;
    }
    const loaders = ['Processing...', 'Thinking...', 'Generating Response...'];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % loaders.length;
      setLoadingMessage(loaders[idx]);
    }, 1500);
    return () => clearInterval(interval);
  }, [status]);

  const transcriptEndRef = useRef(null);
  const chatEndRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsRecognitionSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setStatus('listening');
      setError('');
      setCurrentTranscript('');
    };

    rec.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setCurrentTranscript(final || interim);
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        setStatus('idle');
      } else {
        setError(`Microphone error: ${event.error}. Please ensure mic permission is granted.`);
        setStatus('idle');
      }
    };

    rec.onend = () => {
      // If we finished recording and have transcripts, trigger completion
      setStatus((prevStatus) => {
        if (prevStatus === 'listening') {
          return 'processing';
        }
        return prevStatus;
      });
    };

    setRecognition(rec);
  }, []);

  // Initialize Voices for Speech Synthesis
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      const englishVoices = allVoices.filter(v => v.lang.startsWith('en'));
      setVoices(englishVoices);
      
      if (englishVoices.length > 0) {
        // Choose Google US English or a natural voice if available, otherwise first English voice
        const preferredVoice = englishVoices.find(v => 
          v.name.toLowerCase().includes('google') || 
          v.name.toLowerCase().includes('natural') ||
          v.name.toLowerCase().includes('samantha')
        ) || englishVoices[0];
        
        setSelectedVoice(preferredVoice.name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Sync auto-scrolling
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentTranscript]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Execute Groq completion request when status changes to 'processing'
  useEffect(() => {
    const handleProcessing = async () => {
      if (status !== 'processing') return;

      const queryText = currentTranscript.trim() || textInput.trim();
      if (!queryText) {
        setStatus('idle');
        return;
      }

      // Add user message to history
      const newHistory = [...history, { role: 'user', content: queryText }];
      setHistory(newHistory);
      setTextInput('');
      setError('');
      setAiResponse('');

      try {
        // Call sendToGroq with transcript text
        const responseText = await sendToGroq(queryText);
        
        // Display response
        setAiResponse(responseText);
        
        // Add to conversation history
        setHistory(prev => [...prev, { role: 'assistant', content: responseText }]);

        // Trigger text-to-speech if not muted
        if (!isTtsMuted) {
          speakResponse(responseText);
        } else {
          setStatus('idle');
        }
      } catch (err) {
        console.error('Processing error:', err);
        setError(err.message || 'Failed to generate a response from the AI Mentor. Please try again.');
        setStatus('idle');
      }
    };

    handleProcessing();
  }, [status]);

  const startSession = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel(); // Stop any current speech
    }
    
    if (recognition) {
      try {
        recognition.start();
      } catch (err) {
        console.error('Recognition start failed', err);
        recognition.stop();
        setTimeout(() => recognition.start(), 300);
      }
    } else {
      setError("Speech recognition is not supported in this browser. Please use Google Chrome, Edge, or Safari.");
    }
  };

  const stopSession = () => {
    if (recognition && status === 'listening') {
      recognition.stop();
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setStatus('idle');
  };

  const sendToGroq = async (text) => {
    try {
      const response = await fetch(`${backendUrl}/api/voice-ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: text })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch response from AI Mentor.');
      }

      if (!data.response) {
        throw new Error('Received an empty response from the AI Mentor.');
      }

      return data.response;
    } catch (err) {
      console.error('sendToGroq failed:', err);
      throw err;
    }
  };

  const speakResponse = (text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setStatus('idle');
      return;
    }

    window.speechSynthesis.cancel();

    // Clean text of markdown characters before speaking for clean audio output
    const cleanText = text
      .replace(/[*_`#]/g, '') // remove markdown symbols
      .replace(/-\s+/g, '')  // remove bullet formatting
      .replace(/\[(.*?)\]\(.*?\)/g, '$1'); // replace links with just link text

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    if (selectedVoice) {
      const voiceObj = window.speechSynthesis.getVoices().find(v => v.name === selectedVoice);
      if (voiceObj) {
        utterance.voice = voiceObj;
      }
    }

    utterance.onstart = () => setStatus('speaking');
    utterance.onend = () => setStatus('idle');
    utterance.onerror = (e) => {
      console.error('Speech synthesis error', e);
      setStatus('idle');
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim() || status === 'processing') return;

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    setCurrentTranscript(textInput);
    setStatus('processing');
  };

  const clearHistory = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setStatus('idle');
    setCurrentTranscript('');
    setAiResponse('');
    setError('');
    setHistory([
      {
        role: 'assistant',
        content: `Conversation restarted. I am ready to guide you, ${user?.name?.split(' ')[0] || 'Learner'}.`
      }
    ]);
  };

  // Custom UI Typewriter text effect component
  const TypewriterText = ({ text }) => {
    const [displayedText, setDisplayedText] = useState('');
    
    useEffect(() => {
      setDisplayedText('');
      if (!text) return;
      
      let index = 0;
      const interval = setInterval(() => {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
        if (index >= text.length) {
          clearInterval(interval);
        }
      }, 12);
      
      return () => clearInterval(interval);
    }, [text]);

    return <span className="whitespace-pre-line">{displayedText}</span>;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#070B14', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Dynamic CSS Styles inside page */}
      <style>{`
        @keyframes orb-breath {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 15px rgba(124, 58, 237, 0.2)); }
          50% { transform: scale(1.05); filter: drop-shadow(0 0 30px rgba(124, 58, 237, 0.5)); }
        }
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes rotate-slow-rev {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes bar-grow {
          0%, 100% { height: 10px; }
          50% { height: 35px; }
        }
        .animate-bar-1 { animation: bar-grow 0.8s ease-in-out infinite; }
        .animate-bar-2 { animation: bar-grow 1.1s ease-in-out infinite 0.15s; }
        .animate-bar-3 { animation: bar-grow 0.9s ease-in-out infinite 0.3s; }
        .animate-bar-4 { animation: bar-grow 1.3s ease-in-out infinite 0.1s; }
        .animate-bar-5 { animation: bar-grow 0.7s ease-in-out infinite 0.4s; }
        
        .pulse-wave {
          animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>

      {/* Floating Particles and Ambient Mesh Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Glow backgrounds */}
        <div className="absolute top-[-10%] left-[20%] w-[50vw] h-[50vw] rounded-full opacity-10 animate-float"
          style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)', filter: 'blur(120px)' }} />
        <div className="absolute bottom-[-10%] right-[10%] w-[45vw] h-[45vw] rounded-full opacity-10 animate-float-slow"
          style={{ background: 'radial-gradient(circle, #06B6D4 0%, transparent 70%)', filter: 'blur(100px)' }} />
          
        {/* Subtle particle items */}
        {[...Array(15)].map((_, i) => (
          <div key={i} className="absolute rounded-full opacity-15"
            style={{
              width: `${(i % 3) + 2}px`,
              height: `${(i % 3) + 2}px`,
              left: `${(i * 17 + 13) % 95}%`,
              top: `${(i * 11 + 23) % 90}%`,
              background: i % 2 === 0 ? '#7C3AED' : '#06B6D4',
              boxShadow: `0 0 10px ${i % 2 === 0 ? '#7C3AED' : '#06B6D4'}`,
            }}
          />
        ))}
      </div>

      {/* ── HEADER ────────────────────────────────────────────────── */}
      <header className="relative z-20 px-6 py-4 border-b border-white/[0.05]" 
        style={{ background: 'rgba(13, 17, 23, 0.7)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate('student-dashboard')}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white transition-colors bg-white/[0.03] border border-white/[0.05]"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl" style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', boxShadow: '0 0 15px rgba(124,58,237,0.3)' }}>
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-sm text-white tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>LumionaFlow</span>
                <span className="text-[9px] font-semibold text-purple-400 block tracking-widest uppercase">AI Mentor Suite</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Voice configuration info */}
            {window.speechSynthesis && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <Volume2 className="h-3.5 w-3.5 text-slate-500" />
                <select 
                  value={selectedVoice} 
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="bg-transparent text-[11px] font-semibold text-slate-400 focus:outline-none max-w-[150px] cursor-pointer"
                >
                  {voices.map((v, idx) => (
                    <option key={idx} value={v.name} className="bg-[#0D1117] text-slate-300">
                      {v.name.replace('Microsoft', '').replace('Google', '').trim()} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button 
              onClick={clearHistory}
              className="text-[11px] font-bold px-3 py-2 rounded-xl text-slate-400 hover:text-white bg-white/[0.03] border border-white/[0.05] flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="h-3 w-3" /> Reset Session
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: HERO, VOICE CARD & STATUS PANEL (7 columns on large screens) */}
        <section className="lg:col-span-5 space-y-6">
          
          {/* PREMIUM HERO SECTION */}
          <div className="glass-panel rounded-3xl p-6 relative overflow-hidden" 
            style={{ 
              background: 'linear-gradient(135deg, rgba(13,17,23,0.95), rgba(25,18,48,0.7))', 
              border: '1px solid rgba(124,58,237,0.18)' 
            }}
          >
            {/* Ambient visual background inside card */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 bg-cyan-400 blur-2xl" />
            
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9px] font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950/30 border border-cyan-800/40">
                <Sparkles className="h-2.5 w-2.5 animate-spin" style={{ animationDuration: '4s' }} /> Advanced AI Feature
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
                AI Voice Mentor
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Talk naturally with your AI learning mentor and receive real-time educational guidance. Master AI fundamentals, Prompt Engineering, software development, and Agentic Automation systems.
              </p>
            </div>
          </div>

          {/* AI VOICE ASSISTANT EXPERIENCE CARD */}
          <div className="glass-panel rounded-3xl p-8 relative flex flex-col items-center justify-center text-center overflow-hidden"
            style={{ 
              background: 'rgba(13, 17, 23, 0.8)', 
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.06)' 
            }}
          >
            {/* Visual State Badges */}
            <div className="absolute top-4 flex gap-1.5 justify-center">
              <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider transition-all duration-300 border flex items-center gap-1.5 ${
                status === 'idle' ? 'bg-slate-800/50 border-slate-700 text-slate-400' :
                status === 'listening' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 animate-pulse' :
                status === 'processing' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
                'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  status === 'idle' ? 'bg-slate-500' :
                  status === 'listening' ? 'bg-cyan-400 animate-ping' :
                  status === 'processing' ? 'bg-purple-400 animate-pulse' :
                  'bg-indigo-400 animate-pulse'
                }`} />
                {status}
              </span>
            </div>

            {/* ANIMATED AI VOICE ORB */}
            <div className="relative flex items-center justify-center w-52 h-52 mt-8 mb-6">
              
              {/* Orb outer shadow glows */}
              <div className={`absolute inset-4 rounded-full blur-3xl transition-all duration-1000 ${
                status === 'listening' ? 'bg-cyan-500/25 scale-110' :
                status === 'processing' ? 'bg-purple-500/20' :
                status === 'speaking' ? 'bg-indigo-500/30 scale-105' :
                'bg-indigo-500/5 scale-90'
              }`} />

              {/* Processing Spinners */}
              {status === 'processing' && (
                <>
                  <div className="absolute inset-2 rounded-full border border-dashed border-purple-500/40 animate-spin" 
                    style={{ animationDuration: '8s' }} />
                  <div className="absolute -inset-2 rounded-full border border-dashed border-cyan-400/20 animate-spin" 
                    style={{ animationDuration: '12s', animationDirection: 'reverse' }} />
                </>
              )}

              {/* Listening Ripple waves */}
              {status === 'listening' && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-500/50 pulse-wave" style={{ animationDelay: '0s' }} />
                  <div className="absolute -inset-3 rounded-full border border-cyan-500/30 pulse-wave" style={{ animationDelay: '0.8s' }} />
                  <div className="absolute -inset-6 rounded-full border border-cyan-500/10 pulse-wave" style={{ animationDelay: '1.6s' }} />
                </>
              )}

              {/* Speaking pulse rings */}
              {status === 'speaking' && (
                <>
                  <div className="absolute -inset-1.5 rounded-full border-2 border-indigo-400/20 animate-pulse" style={{ animationDuration: '1.5s' }} />
                  <div className="absolute -inset-4 rounded-full border border-purple-500/15 animate-pulse" style={{ animationDuration: '2.5s' }} />
                </>
              )}

              {/* Core Orb Container */}
              <div 
                onClick={status === 'idle' ? startSession : stopSession}
                className={`relative w-44 h-44 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-500 group border ${
                  status === 'listening' ? 'bg-gradient-to-tr from-cyan-950 via-slate-900 to-cyan-900 border-cyan-400/70 shadow-[0_0_35px_rgba(6,182,212,0.4)]' :
                  status === 'processing' ? 'bg-gradient-to-tr from-purple-950 via-slate-900 to-indigo-950 border-purple-400/50 shadow-[0_0_30px_rgba(124,58,237,0.3)]' :
                  status === 'speaking' ? 'bg-gradient-to-tr from-indigo-950 via-slate-900 to-purple-950 border-indigo-400/60 shadow-[0_0_40px_rgba(99,102,241,0.5)] scale-105' :
                  'bg-gradient-to-tr from-slate-900 to-[#0b101d] border-white/5 shadow-inner hover:border-purple-500/30 hover:scale-103'
                }`}
                style={{
                  animation: status === 'idle' ? 'orb-breath 4s ease-in-out infinite' : undefined
                }}
              >
                {/* Visualizing Orb graphics based on state */}
                {status === 'idle' && (
                  <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-purple-300 transition-colors">
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] group-hover:bg-purple-500/10 group-hover:border-purple-500/20 transition-all">
                      <Mic className="h-9 w-9 text-slate-400 group-hover:text-purple-400 transition-all" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-600 group-hover:text-slate-400 transition-colors">Start Session</span>
                  </div>
                )}

                {status === 'listening' && (
                  <div className="flex flex-col items-center gap-2 text-cyan-400 animate-pulse">
                    <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-400/30">
                      <Mic className="h-9 w-9 text-cyan-300 animate-bounce" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-300">Speak Now</span>
                  </div>
                )}

                {status === 'processing' && (
                  <div className="flex flex-col items-center gap-2 text-purple-400">
                    <Loader2 className="h-10 w-10 animate-spin text-purple-300" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-300">{loadingMessage}</span>
                  </div>
                )}

                {status === 'speaking' && (
                  <div className="flex flex-col items-center gap-2 text-white">
                    {/* Visual Audio Bars jumping */}
                    <div className="flex items-end gap-1.5 h-10 mb-1">
                      <div className="w-1 bg-indigo-400 rounded-full animate-bar-1" />
                      <div className="w-1 bg-purple-400 rounded-full animate-bar-2" />
                      <div className="w-1 bg-cyan-400 rounded-full animate-bar-3" />
                      <div className="w-1 bg-purple-400 rounded-full animate-bar-4" />
                      <div className="w-1 bg-indigo-400 rounded-full animate-bar-5" />
                    </div>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-300">Mentor speaking</span>
                  </div>
                )}
              </div>
            </div>

            {/* VOICE CONTROL PANEL */}
            <div className="w-full flex justify-center gap-4 mt-2">
              {status === 'idle' ? (
                <button
                  onClick={startSession}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold text-white transition-all active:scale-[0.97] hover:shadow-purple-500/15"
                  style={{
                    background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                    boxShadow: '0 4px 20px rgba(124, 58, 237, 0.3)'
                  }}
                >
                  <Mic className="h-3.5 w-3.5" /> Start Talking
                </button>
              ) : (
                <button
                  onClick={stopSession}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold text-white bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 transition-all active:scale-[0.97]"
                >
                  <Square className="h-3.5 w-3.5 text-red-400 fill-red-400" /> Stop Session
                </button>
              )}

              {/* Mute button */}
              <button
                onClick={() => {
                  setIsTtsMuted(!isTtsMuted);
                  if (window.speechSynthesis) window.speechSynthesis.cancel();
                }}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
                  isTtsMuted 
                    ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                    : 'bg-white/[0.03] border-white/[0.05] text-slate-400 hover:text-white'
                }`}
                title={isTtsMuted ? "Unmute Mentor Audio output" : "Mute Mentor Audio output"}
              >
                <Volume2 className={`h-4 w-4 ${isTtsMuted ? 'opacity-50' : ''}`} />
              </button>
            </div>
            
            {/* Error notifications */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl text-left text-xs font-semibold mt-6 w-full animate-scale-in"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', color: '#FCA5A5' }}>
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> 
                <div>
                  <div className="font-bold">Session Warning</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{error}</div>
                </div>
              </div>
            )}

            {!isRecognitionSupported && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl text-left text-xs mt-6 w-full bg-yellow-500/5 border border-yellow-500/15 text-yellow-200">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Browser Compatibility Note</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Voice speech recognition isn't fully supported in your browser. Use Google Chrome or Microsoft Edge, or interact using the text chat console on the right instead!
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: TRANSCRIPTS, RESPONSES & HISTORY CHAT (7 columns on large screens) */}
        <section className="lg:col-span-7 space-y-6">
          
          {/* CONVERSATION HISTORY & CHAT INTERFACE */}
          <div className="glass-panel rounded-3xl flex flex-col h-[580px] overflow-hidden"
            style={{ 
              background: 'rgba(13, 17, 23, 0.75)', 
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.06)' 
            }}
          >
            {/* Chat Header */}
            <div className="px-5 py-3.5 border-b border-white/[0.05] flex justify-between items-center bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-bold text-white tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>Conversation Log</span>
              </div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                {history.length - 1} message{history.length - 1 !== 1 ? 's' : ''} exchanged
              </span>
            </div>

            {/* Scrollable chat thread */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {history.map((msg, idx) => {
                const isAssistant = msg.role === 'assistant';
                return (
                  <div 
                    key={idx} 
                    className={`flex items-start gap-3 max-w-[85%] animate-fade-slide-up ${
                      isAssistant ? 'mr-auto' : 'ml-auto flex-row-reverse'
                    }`}
                  >
                    {/* Avatar Icon */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                      isAssistant 
                        ? 'bg-purple-950/40 border-purple-500/20 text-purple-400' 
                        : 'bg-cyan-950/40 border-cyan-500/20 text-cyan-400'
                    }`}>
                      {isAssistant ? <Sparkles className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                    </div>

                    {/* Bubble Content */}
                    <div className="space-y-1">
                      <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                        isAssistant 
                          ? 'bg-white/[0.02] border border-white/[0.04] text-slate-200 rounded-tl-sm' 
                          : 'bg-gradient-to-br from-indigo-950 to-indigo-900 border border-indigo-500/20 text-slate-100 rounded-tr-sm'
                      }`}>
                        {/* If it is the absolute latest message being printed, typewrite it. Otherwise render normally */}
                        {isAssistant && idx === history.length - 1 && aiResponse && status === 'speaking' ? (
                          <TypewriterText text={msg.content} />
                        ) : (
                          <span className="whitespace-pre-line">{msg.content}</span>
                        )}
                      </div>
                      
                      {/* Sub-label */}
                      <span className={`text-[8px] font-semibold text-slate-600 block ${!isAssistant ? 'text-right' : ''}`}>
                        {isAssistant ? 'AI Mentor' : 'You'}
                      </span>
                    </div>
                  </div>
                );
              })}
              
              {/* Processing typing loader indicator */}
              {status === 'processing' && (
                <div className="flex items-start gap-3 max-w-[85%] animate-pulse">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border bg-purple-950/40 border-purple-500/20 text-purple-400">
                    <Sparkles className="h-3.5 w-3.5 animate-spin" />
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-2xl rounded-tl-sm flex flex-col gap-2">
                    <div className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0s' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                    <span className="text-[10px] text-purple-400 font-semibold">{loadingMessage}</span>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* LIVE SPEECH TRANSCRIPT / TEXT CONSOLE INPUT PANEL */}
            <div className="p-4 border-t border-white/[0.05] bg-white/[0.01] space-y-3">
              {/* Show live speech transcription dynamically */}
              {status === 'listening' && currentTranscript && (
                <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/10 animate-pulse text-xs text-slate-300 max-h-[70px] overflow-y-auto">
                  <div className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest mb-1">Live Transcription</div>
                  <div className="italic">"{currentTranscript}..."</div>
                  <div ref={transcriptEndRef} />
                </div>
              )}

              {/* Chat Text Input form as fallback input channel */}
              <form onSubmit={handleTextSubmit} className="flex gap-2">
                <input 
                  type="text" 
                  value={textInput} 
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={status === 'listening' ? "Speak to your mic..." : "Type your message here..."}
                  disabled={status === 'processing'}
                  className="flex-1 glass-input text-xs" 
                />
                <button 
                  type="submit" 
                  disabled={!textInput.trim() || status === 'processing'}
                  className="p-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white font-bold transition-all active:scale-[0.97] shrink-0 border border-purple-500/20"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>

          </div>

        </section>

      </main>
      
      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="relative z-20 py-4 px-6 mt-6 border-t border-white/[0.05]" style={{ background: 'rgba(13,17,23,0.9)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg" style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}>
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span className="font-bold text-xs text-slate-300" style={{ fontFamily: 'Space Grotesk' }}>LumionaFlow LMS</span>
          </div>
          <p className="text-[10px] text-slate-500">
            Powered by Groq llama-3.3-70b-versatile. Speech recognition & playback utilizes native browser Speech APIs.
          </p>
        </div>
      </footer>

    </div>
  );
}
