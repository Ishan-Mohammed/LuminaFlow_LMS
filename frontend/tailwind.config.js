/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        'indigo-deep': '#312E81',
        'purple-electric': '#7C3AED',
        'cyan-accent': '#06B6D4',
        'gold-brand': '#FBBF24',
        'bg-base': '#070B14',
        'bg-panel': '#0D1117',
        'bg-elevated': '#0F1629',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'fade-slide-up': 'fadeSlideUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.4s ease-out forwards',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'gradient-shift': 'gradientShift 6s ease infinite',
        'border-glow': 'borderGlow 3s ease-in-out infinite',
        'particle-drift': 'particleDrift linear infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-18px) rotate(1.5deg)' },
        },
        fadeSlideUp: {
          'from': { opacity: '0', transform: 'translateY(24px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        scaleIn: {
          'from': { opacity: '0', transform: 'scale(0.95)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(124,58,237,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(124,58,237,0.6), 0 0 60px rgba(6,182,212,0.2)' },
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        borderGlow: {
          '0%, 100%': { borderColor: 'rgba(124,58,237,0.4)', boxShadow: '0 0 0 0 rgba(124,58,237,0)' },
          '50%': { borderColor: 'rgba(6,182,212,0.6)', boxShadow: '0 0 20px rgba(6,182,212,0.2)' },
        },
        particleDrift: {
          '0%': { transform: 'translateY(0) translateX(0)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '0.5' },
          '100%': { transform: 'translateY(-90vh) translateX(20px)', opacity: '0' },
        },
      },
      boxShadow: {
        'glow-purple': '0 0 30px rgba(124,58,237,0.25)',
        'glow-cyan': '0 0 30px rgba(6,182,212,0.25)',
        'glow-gold': '0 0 30px rgba(251,191,36,0.2)',
        'panel': '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
        'elevated': '0 8px 40px rgba(0,0,0,0.6)',
      },
      backgroundSize: {
        '200%': '200% 200%',
      },
    },
  },
  plugins: [],
}
