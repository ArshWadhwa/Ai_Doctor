import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  AsklepiosCross, 
  ActionPlusButton 
} from './BrandElements';
import { 
  Mic, 
  Upload, 
  Activity, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight, 
  X, 
  Menu,
  Stethoscope,
  Volume2,
  Clock,
  History,
  Send,
  AlertTriangle
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'voice' | 'vision' | 'insights'>('voice');
  const [isWaveActive, setIsWaveActive] = useState(true);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickSymptom, setQuickSymptom] = useState('');

  const navLinks = [
    { name: 'Homepage', href: '#home', active: true },
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Clinical Preview', href: '#diagnostics' },
    { name: 'Safety', href: '#safety' },
  ];

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const id = href.substring(1);
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#edf2f7] py-3 sm:py-6 px-2 sm:px-6 lg:px-8 flex flex-col items-center justify-start antialiased text-slate-900">
      {/* Outer Floating Viewport Canvas */}
      <main className="w-full max-w-[1440px] bg-white rounded-[28px] sm:rounded-[42px] border border-slate-200/80 shadow-2xl relative overflow-hidden flex flex-col">
        
        {/* Navigation Bar */}
        <header className="w-full px-6 sm:px-12 py-5 sm:py-7 flex items-center justify-between z-30 relative border-b border-slate-100/80 bg-white/90 backdrop-blur-md">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none" aria-label="Medly Home">
            <div className="w-10 h-10 flex items-center justify-center text-slate-900 transition-transform duration-300 group-hover:rotate-90 group-hover:text-blue-600">
              <AsklepiosCross size={28} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-950">
              Medly
            </span>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-7 lg:gap-9" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleAnchorClick(e, link.href)}
                className={`text-[14px] lg:text-[15px] font-medium transition-all relative py-1 ${
                  link.active
                    ? 'text-slate-950 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {link.active && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-slate-900 rounded-full" />
                )}
                {link.name}
              </a>
            ))}
          </nav>

          {/* Right Action Menu */}
          <div className="flex items-center gap-4 sm:gap-6">
            <a 
              href="#safety" 
              onClick={(e) => handleAnchorClick(e, '#safety')}
              className="hidden sm:inline-block text-[14px] lg:text-[15px] font-medium text-slate-700 hover:text-slate-950 transition-colors"
            >
              Clinical Safety
            </a>

            <Link 
              to="/auth" 
              className="hidden sm:inline-block text-[14px] font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              Sign In
            </Link>

            <ActionPlusButton to="/auth" title="Get Started / Try For Free" />

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden px-6 py-4 border-b border-slate-200 bg-white/95 backdrop-blur-md z-40">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    handleAnchorClick(e, link.href);
                  }}
                  className="text-base font-medium text-slate-700 hover:text-blue-600 py-1.5"
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-blue-600"
                >
                  Sign In / Register
                </Link>
                <Link
                  to="/consultation"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-slate-800"
                >
                  Start Consultation
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* HERO SECTION WITH BACKGROUND VIDEO & HIGH-END OVERLAYS */}
        <section id="home" className="relative w-full min-h-[620px] sm:min-h-[700px] lg:min-h-[740px] flex flex-col justify-end p-6 sm:p-12 lg:p-16 overflow-hidden">
          
          {/* Background Video Container */}
          <div className="absolute inset-0 w-full h-full overflow-hidden select-none z-0">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline 
              preload="auto"
              className="w-full h-full object-cover object-center scale-[1.02] transition-opacity duration-1000"
            >
              <source src="/generate_video_od_this_its_m.mp4" type="video/mp4" />
            </video>

            {/* Subtle Gradient Overlays for High Contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-white/10 z-[1]" />
            <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/20 to-transparent z-[1]" />
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white to-transparent z-[2]" />
          </div>

          {/* Hero Content Grid - Elegantly Placed on Top */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end relative z-10 w-full pb-2">
            
            {/* Left Headline & Clean Description */}
            <div className="lg:col-span-8 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-md text-blue-700 border border-blue-200/80 shadow-sm mb-4">
                <Sparkles size={13} />
                <span>AI-Powered Medical Consultation</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[60px] font-bold text-slate-950 tracking-tight leading-[1.06] mb-4 drop-shadow-[0_2px_10px_rgba(255,255,255,0.8)]">
                Introducing Medly <br />
                <span className="text-slate-900 font-extrabold">Personalized Health AI</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-700 font-normal leading-relaxed max-w-xl bg-white/70 backdrop-blur-md p-3 rounded-2xl border border-white/60">
                Get instant medical insights by describing your symptoms with your voice, typing your concerns, or uploading medical photos. Medly generates structured differential assessments, suggests ICD-10 codes, and plays back doctor audio guidance.
              </p>
            </div>

            {/* Right "Try For Free" Floating Glass Card */}
            <div className="lg:col-span-4 flex justify-start lg:justify-end">
              <div className="w-full max-w-[350px] bg-white/85 backdrop-blur-xl border border-white/80 rounded-3xl p-6 sm:p-7 shadow-2xl hover:shadow-blue-500/10 transition-all relative flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-slate-950">
                      Try For Free
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                      Instant Triage
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                    Describe any symptom or attach an image to receive immediate medical insights and ICD-10 classification.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {['Chest discomfort', 'Persistent cough', 'Skin rash'].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setQuickSymptom(tag);
                          setShowQuickModal(true);
                        }}
                        className="text-xs bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-2.5 py-1 rounded-lg border border-slate-200/80 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-200/60">
                  <Link 
                    to="/auth" 
                    className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                  >
                    Launch Consultation <ChevronRight size={14} />
                  </Link>

                  <button 
                    onClick={() => setShowQuickModal(true)}
                    className="w-10 h-10 bg-slate-900 hover:bg-blue-600 active:scale-95 text-white rounded-2xl flex items-center justify-center transition-all shadow-md"
                    title="Quick Check"
                  >
                    <span className="text-xl font-medium leading-none">+</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Interactive Diagnostic Engine Preview */}
        <section id="diagnostics" className="w-full px-6 sm:px-12 lg:px-16 py-16 sm:py-20 bg-slate-50/60 border-t border-slate-100">
          <div className="max-w-3xl mb-12">
            <span className="text-xs sm:text-sm font-bold tracking-wider text-blue-600 uppercase mb-2 block">
              Multi-Modal Health Consultation
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-950 tracking-tight">
              Real-time diagnosis across voice, scans, and clinical symptoms.
            </h2>
            <p className="text-base text-slate-600 mt-3">
              Experience how Medly translates spoken symptoms and uploaded images into structured medical insights and spoken doctor responses.
            </p>
          </div>

          {/* Interactive Showcase Tabs */}
          <div className="w-full bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 lg:p-10">
            {/* Tab Headers */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 pb-6 border-b border-slate-100">
              <button
                onClick={() => setActiveTab('voice')}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  activeTab === 'voice'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                <Mic size={16} />
                Voice Consultation & Audio Response
              </button>

              <button
                onClick={() => setActiveTab('vision')}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  activeTab === 'vision'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                <Upload size={16} />
                Medical Image & Scan Analysis
              </button>

              <button
                onClick={() => setActiveTab('insights')}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  activeTab === 'insights'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                <Activity size={16} />
                Health Insights & ICD-10 Codes
              </button>
            </div>

            {/* Tab Content Display */}
            <div className="mt-8">
              {activeTab === 'voice' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Left: Animated Audio Input */}
                  <div className="lg:col-span-6 bg-slate-50 rounded-2xl p-6 border border-slate-200/70">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Voice Signal Processing
                        </span>
                      </div>
                      <span className="text-xs font-mono text-slate-500">00:08 / 00:30</span>
                    </div>

                    {/* Animated Sound Waveform */}
                    <div className="h-24 bg-white rounded-xl border border-slate-200/60 p-4 flex items-center justify-center gap-1.5">
                      {[32, 64, 45, 85, 95, 70, 40, 60, 90, 100, 75, 45, 80, 65, 30, 85, 92, 50, 35, 70, 90, 60, 40].map((h, i) => (
                        <div
                          key={i}
                          className="w-1.5 bg-blue-500 rounded-full transition-all duration-300"
                          style={{
                            height: isWaveActive ? `${Math.min(h, 75)}%` : '20%',
                            opacity: isWaveActive ? 0.7 + (i % 3) * 0.1 : 0.4
                          }}
                        />
                      ))}
                    </div>

                    {/* Speech to text transcript */}
                    <div className="mt-4 p-3.5 bg-white rounded-xl border border-slate-200/60">
                      <p className="text-xs text-slate-400 font-medium mb-1">Transcribed Patient Speech:</p>
                      <p className="text-sm text-slate-800 italic">
                        "I've experienced a persistent dry cough and chest tightness for the past 3 days, especially worse at night."
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <button
                        onClick={() => setIsWaveActive(!isWaveActive)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
                      >
                        <Volume2 size={14} />
                        {isWaveActive ? 'Pause Waveform Preview' : 'Play Waveform Preview'}
                      </button>
                      <span className="text-xs text-slate-500">Spoken Audio Playback</span>
                    </div>
                  </div>

                  {/* Right: Structured Clinical Analysis */}
                  <div className="lg:col-span-6 flex flex-col gap-4">
                    <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                          Differential Assessment
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white">
                          Clinical Match
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 mb-1">
                        Acute Bronchitis / Tracheobronchial Irritation
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Symptoms indicate lower airway mucosal irritation. Monitor for fever progression, wheezing, or respiratory fatigue.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                        <span className="text-[11px] text-slate-400 uppercase font-semibold block mb-1">
                          Assigned ICD-10 Code
                        </span>
                        <span className="text-base font-mono font-bold text-slate-900">
                          J20.9 (Bronchitis)
                        </span>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                        <span className="text-[11px] text-slate-400 uppercase font-semibold block mb-1">
                          Assessment Level
                        </span>
                        <span className="text-base font-semibold text-blue-700 flex items-center gap-1">
                          <Clock size={16} /> Standard Evaluation
                        </span>
                      </div>
                    </div>

                    <Link
                      to="/consultation"
                      className="mt-2 w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 transition-all"
                    >
                      <span>Start Your Consultation</span>
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              )}

              {activeTab === 'vision' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-6 bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
                    <div className="relative w-full max-w-sm aspect-[4/3] bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-700 opacity-90" />
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />
                      <div className="absolute w-36 h-28 border-2 border-cyan-400 rounded bg-cyan-400/10 flex flex-col justify-between p-2 shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                        <span className="text-[10px] font-mono font-bold bg-cyan-400 text-slate-950 px-1 py-0.5 rounded w-max">
                          Lesion Detected
                        </span>
                        <span className="text-[10px] font-mono text-cyan-200">
                          Erythema Pattern
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 z-10 font-mono">Dermatological Image Preview</span>
                    </div>
                  </div>

                  <div className="lg:col-span-6 flex flex-col gap-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      Medical Image Evaluation
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900">
                      Visual AI for Skin Lesions, Scans & Photos
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Upload photos of skin rashes, external swelling, eye irritation, or medical scans. Medly analyzes visible characteristics alongside your reported symptoms to suggest potential conditions.
                    </p>
                    <ul className="space-y-2.5 my-2">
                      {[
                        'Support for JPG, PNG, and camera photos directly from mobile or desktop',
                        'Differential assessment with primary and secondary considerations',
                        'Automatic ICD-10 medical code assignment'
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2.5 text-sm text-slate-700">
                          <CheckCircle2 size={16} className="text-blue-600 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      to="/consultation"
                      className="py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium text-sm w-max transition-colors"
                    >
                      Upload A Medical Image
                    </Link>
                  </div>
                </div>
              )}

              {activeTab === 'insights' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-6 flex flex-col gap-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      Consultation Graph & Records
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900">
                      Track Symptoms & Trends Over Time
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Every consultation is saved to your private history. Medly identifies repeated complaints, tracks health checks over time, and highlights recurring patterns.
                    </p>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-lg font-bold text-blue-600">ICD-10 Mapped</span>
                        <span className="text-xs text-slate-500 block mt-1">Standardized Clinical Codes</span>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-lg font-bold text-slate-900">Saved History</span>
                        <span className="text-xs text-slate-500 block mt-1">Available in Your Dashboard</span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-6 bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold uppercase text-slate-700">Recent Session Records</span>
                      <span className="text-xs text-blue-600 font-semibold">Consultation Log</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { code: 'R07.9', name: 'Chest Discomfort Evaluation', level: 'High Attention', date: 'Session 1' },
                        { code: 'J06.9', name: 'Acute Upper Respiratory (Cold)', level: 'Moderate', date: 'Session 2' },
                        { code: 'L23.9', name: 'Contact Dermatitis / Rash', level: 'Mild', date: 'Session 3' },
                      ].map((item, index) => (
                        <div key={index} className="p-3 bg-white rounded-xl border border-slate-200/70 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-mono font-bold text-blue-600 mr-2">{item.code}</span>
                            <span className="text-sm font-medium text-slate-900">{item.name}</span>
                          </div>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            item.level === 'High Attention' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.level}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 3: Features & Capabilities */}
        <section id="features" className="w-full px-6 sm:px-12 lg:px-16 py-16 sm:py-20 bg-white">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs sm:text-sm font-bold tracking-wider text-blue-600 uppercase mb-2 block">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-950 tracking-tight">
              Designed for simple, fast, and informative medical triage.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Mic,
                title: "Voice-To-Text Symptom Input",
                desc: "Record your symptoms directly through your microphone. Your spoken words are transcribed into text automatically without typing."
              },
              {
                icon: Stethoscope,
                title: "Differential Medical Analysis",
                desc: "Get an informative breakdown of possible causes, self-care measures, key warning signs, and relevant ICD-10 medical codes."
              },
              {
                icon: Volume2,
                title: "Doctor Audio Voice Response",
                desc: "Listen to the consultation advice spoken out loud through natural speech synthesis, making it easy to review on any device."
              },
              {
                icon: Upload,
                title: "Medical Image Upload",
                desc: "Attach photos of skin rashes, visual injuries, or medical documents to give the AI visual context alongside your symptoms."
              },
              {
                icon: History,
                title: "Complete Consultation History",
                desc: "Every completed consultation, symptom transcription, and diagnostic assessment is safely saved to your personal history."
              },
              {
                icon: Sparkles,
                title: "Health History & Precautions",
                desc: "AI cross-references your consultation records to track symptom recurrence and answer questions on what activities to avoid."
              }
            ].map((card, i) => (
              <div 
                key={i} 
                className="p-8 rounded-3xl bg-slate-50 hover:bg-blue-50/40 border border-slate-200/80 hover:border-blue-200 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 mb-6 shadow-sm group-hover:scale-105 transition-transform">
                    <card.icon size={22} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">
                    {card.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: Clean Platform Highlights */}
        <section className="w-full px-6 sm:px-12 lg:px-16 py-14 bg-slate-950 text-white">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { label: 'Input Modalities', value: 'Voice, Image & Text' },
              { label: 'Diagnostic Classification', value: 'ICD-10 Standard' },
              { label: 'Response Delivery', value: 'Text & Spoken Audio' },
              { label: 'Account History', value: 'Private & Stored' }
            ].map((metric, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-400 tracking-tight mb-2">
                  {metric.value}
                </span>
                <span className="text-xs sm:text-sm text-slate-400 font-medium">
                  {metric.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: Safety & Medical Responsibility */}
        <section id="safety" className="w-full px-6 sm:px-12 lg:px-16 py-14 bg-slate-50 border-t border-slate-200/80">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white border border-slate-200 text-blue-600 mx-auto shadow-sm">
              <ShieldCheck size={26} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Clinical Disclaimer & Safety Notice
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Medly provides preliminary symptom assessment, educational information, and ICD-10 suggestions. It is designed to assist you in preparing for a discussion with a healthcare provider and does not constitute a formal medical diagnosis or prescription.
            </p>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 text-left flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Emergency Warning:</strong> If you are experiencing sudden chest pain, severe shortness of breath, sudden weakness or numbness on one side of your body, severe bleeding, or loss of consciousness, please call emergency services immediately (911 or your local emergency number).
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 6: Conversion CTA */}
        <section className="w-full px-6 sm:px-12 lg:px-16 py-16 sm:py-24 bg-gradient-to-b from-white to-blue-50/40 flex flex-col items-center text-center">
          <div className="w-12 h-12 flex items-center justify-center text-blue-600 mb-4">
            <AsklepiosCross size={36} />
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-slate-950 tracking-tight max-w-2xl mb-4">
            Start your personalized health consultation today.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-xl mb-8">
            Speak your symptoms, attach an image, and receive instant diagnostic clarity and audio guidance.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              to="/auth"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold text-base shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>Get Started For Free</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/consultation"
              className="px-8 py-4 bg-white hover:bg-slate-100 text-slate-800 rounded-2xl font-semibold text-base border border-slate-200 transition-all"
            >
              Start Consultation Directly
            </Link>
          </div>
        </section>

        {/* Modern Footer */}
        <footer className="w-full px-6 sm:px-12 lg:px-16 py-12 border-t border-slate-200/80 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-10">
            <div className="md:col-span-5">
              <div className="flex items-center gap-3 mb-3">
                <AsklepiosCross size={24} className="text-slate-900" />
                <span className="font-bold text-xl text-slate-900">Medly</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm">
                AI medical doctor providing voice-guided symptom consultation, medical image inspection, ICD-10 diagnostic insights, and spoken audio responses.
              </p>
            </div>

            <div className="md:col-span-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Consultation Features</h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li><Link to="/consultation" className="hover:text-blue-600">Voice Consultation</Link></li>
                <li><Link to="/consultation" className="hover:text-blue-600">Medical Image Upload</Link></li>
                <li><Link to="/health-insights" className="hover:text-blue-600">Health Insights</Link></li>
                <li><Link to="/consultation-history" className="hover:text-blue-600">Consultation History</Link></li>
              </ul>
            </div>

            <div className="md:col-span-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Health Notice</h4>
              <p className="text-xs text-slate-500 leading-relaxed p-3 bg-slate-50 rounded-xl border border-slate-200">
                Medly is an artificial intelligence triage and educational support assistant. For medical treatment, prescriptions, or urgent care, always consult a licensed doctor or call emergency services.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
            <p>&copy; {new Date().getFullYear()} Medly. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#safety" onClick={(e) => handleAnchorClick(e, '#safety')} className="hover:text-slate-600">Medical Disclaimer</a>
              <a href="#home" onClick={(e) => handleAnchorClick(e, '#home')} className="hover:text-slate-600">Back to Top</a>
            </div>
          </div>
        </footer>

      </main>

      {/* Interactive Quick Modal for "Try For Free" button */}
      {showQuickModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AsklepiosCross size={20} className="text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Quick Symptom Check</h3>
              </div>
              <button 
                onClick={() => setShowQuickModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-600 mb-4">
              Enter your symptoms to open your personal consultation session:
            </p>

            <input
              type="text"
              value={quickSymptom}
              onChange={(e) => setQuickSymptom(e.target.value)}
              placeholder="e.g. persistent headache with mild fever"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowQuickModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <Link
                to="/consultation"
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium text-center hover:bg-blue-700 shadow-md shadow-blue-500/25"
              >
                Continue
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
