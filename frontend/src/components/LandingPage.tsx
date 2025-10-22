import React from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Brain, Mic, Image, Clock, Menu, X } from 'lucide-react';

const LandingPage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Enhanced Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-medical-green to-medical-green-light rounded-lg flex items-center justify-center shadow-lg">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">MediCare AI</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-medical-green transition-colors font-medium px-3 py-2 rounded-lg hover:bg-medical-green-accent">Features</a>
              <a href="#about" className="text-gray-600 hover:text-medical-green transition-colors font-medium px-3 py-2 rounded-lg hover:bg-medical-green-accent">About</a>
              <a href="#contact" className="text-gray-600 hover:text-medical-green transition-colors font-medium px-3 py-2 rounded-lg hover:bg-medical-green-accent">Contact</a>
              <a href="#blog" className="text-gray-600 hover:text-medical-green transition-colors font-medium px-3 py-2 rounded-lg hover:bg-medical-green-accent">Blog</a>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link 
                to="/auth" 
                className="text-gray-600 hover:text-medical-green transition-colors font-medium px-4 py-2 rounded-lg hover:bg-medical-green-accent"
              >
                Sign In
              </Link>
              <Link 
                to="/auth" 
                className="bg-gradient-to-r from-medical-green to-medical-green-light text-white px-6 py-2.5 rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 hover:from-medical-green-dark hover:to-medical-green"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-medical-green p-2 rounded-lg hover:bg-medical-green-accent transition-colors"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden bg-white/95 backdrop-blur-lg border-t border-gray-200">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <a href="#features" className="block text-gray-600 hover:text-medical-green px-3 py-2 rounded-lg hover:bg-medical-green-accent transition-colors">Features</a>
                <a href="#about" className="block text-gray-600 hover:text-medical-green px-3 py-2 rounded-lg hover:bg-medical-green-accent transition-colors">About</a>
                <a href="#contact" className="block text-gray-600 hover:text-medical-green px-3 py-2 rounded-lg hover:bg-medical-green-accent transition-colors">Contact</a>
                <a href="#blog" className="block text-gray-600 hover:text-medical-green px-3 py-2 rounded-lg hover:bg-medical-green-accent transition-colors">Blog</a>
                <div className="pt-4 pb-2 border-t border-gray-200 mt-4">
                  <Link to="/auth" className="block text-gray-600 hover:text-medical-green px-3 py-2 rounded-lg hover:bg-medical-green-accent transition-colors">Sign In</Link>
                  <Link to="/auth" className="block bg-gradient-to-r from-medical-green to-medical-green-light text-white px-3 py-2 rounded-lg font-semibold mt-2 text-center">Get Started</Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
  


      {/* Enhanced Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Hero Content */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6 text-gray-900">
                Your Health <br />
                <span className="bg-gradient-to-r from-medical-green via-medical-green-light to-primary-400 bg-clip-text text-transparent">
                  Our Care
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Get instant medical analysis with our cutting-edge AI technology. 
                Upload medical images, record your symptoms, and receive professional 
                diagnostic insights with ICD-10 codes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link 
                  to="/auth" 
                  className="bg-gradient-to-r from-medical-green to-medical-green-light text-white px-8 py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300 text-center hover:from-medical-green-dark hover:to-medical-green"
                >
                  Start Free Consultation
                </Link>
                <a 
                  href="#features" 
                  className="border-2 border-medical-green text-medical-green px-8 py-4 rounded-xl font-semibold hover:bg-medical-green-accent hover:border-medical-green-light transition-all duration-300 text-center"
                >
                  Learn More
                </a>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="flex-1 flex justify-center lg:justify-end">
              <div className="relative w-80 h-80 sm:w-96 sm:h-96">
                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
                  {/* Animated Video */}
                  <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    className="w-full h-full object-cover"
                  >
                    <source src="/Animated_Video_Generation_From_Image.mp4" type="video/mp4" />
                    {/* Fallback image if video doesn't load */}
                    Your browser does not support the video tag.
                  </video>
                  
                  {/* Optional subtle overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-medical-green/5 to-transparent pointer-events-none"></div>
                </div>
                
                {/* Floating medical icons */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-medical-green-accent rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <Stethoscope className="w-8 h-8 text-medical-green" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <Brain className="w-7 h-7 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Medical Illustration Section */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Advanced AI-Powered Medical Consultation
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Experience seamless medical analysis with voice recording, AI diagnosis, and comprehensive reporting
            </p>
          </div>
          
          <div className="flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" className="w-full max-w-5xl h-auto" role="img" aria-label="AI Medical Doctor illustration">
              <defs>
                {/* Green gradients */}
                <linearGradient id="gradA" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#22c55e"/>
                  <stop offset="1" stopColor="#16a34a"/>
                </linearGradient>

                <linearGradient id="gradB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#86efac" stopOpacity="0.9"/>
                  <stop offset="1" stopColor="#bbf7d0" stopOpacity="0.9"/>
                </linearGradient>

                {/* Glass effect */}
                <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#ffffff" stopOpacity="0.8"/>
                  <stop offset="1" stopColor="#ffffff" stopOpacity="0.4"/>
                </linearGradient>

                <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="8" stdDeviation="18" floodColor="#22c55e" floodOpacity="0.2"/>
                </filter>

                <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="12" result="b"/>
                  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>

                <symbol id="icon-cross" viewBox="0 0 24 24">
                  <path d="M13 11h6v2h-6v6h-2v-6H5v-2h6V5h2z" fill="#22c55e"/>
                </symbol>

                {/* Subtle panel background */}
                <linearGradient id="xrayGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#f0fdf4"/>
                  <stop offset="1" stopColor="#dcfce7"/>
                </linearGradient>
              </defs>

              {/* Background */}
              <rect width="1200" height="600" fill="#ffffff"/>

              {/* Left: Waveform + microphone */}
              <g transform="translate(60,120)">
                <g transform="translate(0,0)" filter="url(#softShadow)">
                  <rect x="18" y="0" width="120" height="170" rx="36" fill="url(#glass)" stroke="#22c55e" strokeOpacity="0.3"/>
                  <rect x="54" y="18" width="36" height="80" rx="12" fill="#22c55e" opacity="0.1"/>
                  <rect x="44" y="110" width="64" height="18" rx="9" fill="#22c55e" opacity="0.15"/>
                  <path d="M60 142 q20 12 40 0" stroke="#22c55e" strokeOpacity="0.3" strokeWidth="6" fill="none" strokeLinecap="round"/>
                  <circle cx="78" cy="42" r="6" fill="#22c55e" opacity="0.2"/>
                </g>

                {/* Waveform - Fixed width to prevent overflow */}
                <g transform="translate(160,36)">
                  <rect x="0" y="60" width="140" height="8" rx="4" fill="#22c55e" opacity="0.1"/>
                  <g fill="#22c55e" opacity="0.9">
                    <rect x="12" y="40" width="6" height="36" rx="3">
                      <animate attributeName="height" values="24;56;24" dur="2.6s" repeatCount="indefinite"/>
                      <animate attributeName="y" values="48;24;48" dur="2.6s" repeatCount="indefinite"/>
                    </rect>
                    <rect x="28" y="28" width="6" height="56" rx="3">
                      <animate attributeName="height" values="36;72;36" dur="3s" repeatCount="indefinite"/>
                      <animate attributeName="y" values="48;24;48" dur="3s" repeatCount="indefinite"/>
                    </rect>
                    <rect x="44" y="46" width="6" height="38" rx="3">
                      <animate attributeName="height" values="20;48;20" dur="2s" repeatCount="indefinite"/>
                      <animate attributeName="y" values="56;36;56" dur="2s" repeatCount="indefinite"/>
                    </rect>
                    <rect x="60" y="22" width="6" height="68" rx="3">
                      <animate attributeName="height" values="28;72;28" dur="3.4s" repeatCount="indefinite"/>
                      <animate attributeName="y" values="56;24;56" dur="3.4s" repeatCount="indefinite"/>
                    </rect>
                    <rect x="76" y="34" width="6" height="44" rx="3">
                      <animate attributeName="height" values="32;60;32" dur="2.8s" repeatCount="indefinite"/>
                      <animate attributeName="y" values="48;28;48" dur="2.8s" repeatCount="indefinite"/>
                    </rect>
                    <rect x="92" y="42" width="6" height="28" rx="3">
                      <animate attributeName="height" values="16;40;16" dur="2.2s" repeatCount="indefinite"/>
                      <animate attributeName="y" values="52;36;52" dur="2.2s" repeatCount="indefinite"/>
                    </rect>
                    <rect x="108" y="26" width="6" height="60" rx="3">
                      <animate attributeName="height" values="40;72;40" dur="3.2s" repeatCount="indefinite"/>
                      <animate attributeName="y" values="46;24;46" dur="3.2s" repeatCount="indefinite"/>
                    </rect>
                    <rect x="124" y="38" width="6" height="36" rx="3">
                      <animate attributeName="height" values="24;52;24" dur="2.4s" repeatCount="indefinite"/>
                      <animate attributeName="y" values="50;32;50" dur="2.4s" repeatCount="indefinite"/>
                    </rect>
                  </g>
                </g>
              </g>

              {/* Center: Glass card Doctor + AI */}
              <g transform="translate(340,70)" filter="url(#softShadow)">
                <rect x="0" y="0" width="440" height="460" rx="28" fill="url(#glass)" stroke="#22c55e" strokeOpacity="0.2"/>
                <rect x="6" y="6" width="428" height="448" rx="22" fill="none" stroke="url(#gradA)" strokeWidth="1" opacity="0.08"/>

                <g transform="translate(34,42)">
                  <ellipse cx="100" cy="100" rx="68" ry="82" fill="#f0fdf4"/>
                  <rect x="62" y="84" width="76" height="28" rx="8" fill="url(#gradA)" opacity="0.9"/>
                  <path d="M76 150 q24 24 48 0" stroke="#22c55e" strokeWidth="5" fill="none" strokeLinecap="round"/>
                  <circle cx="90" cy="152" r="6" fill="#bbf7d0"/>
                  <circle cx="134" cy="152" r="6" fill="#bbf7d0"/>

                  {/* Neural nodes */}
                  <g transform="translate(24,18)">
                    <circle cx="30" cy="25" r="5" fill="#fff" stroke="#22c55e" strokeWidth="2"/>
                    <circle cx="70" cy="12" r="5" fill="#fff" stroke="#16a34a" strokeWidth="2"/>
                    <circle cx="95" cy="36" r="5" fill="#fff" stroke="#86efac" strokeWidth="2"/>
                    <circle cx="55" cy="62" r="5" fill="#fff" stroke="#bbf7d0" strokeWidth="2"/>
                    {/* Connection lines */}
                    <path d="M35 25 L65 12 M70 17 L90 36 M60 62 L90 36" stroke="#22c55e" strokeWidth="1" opacity="0.3"/>
                  </g>
                </g>

                {/* Right: X-ray panel - Fixed positioning */}
                <g transform="translate(240,40)">
                  <rect x="0" y="0" width="160" height="200" rx="12" fill="url(#xrayGrad)" stroke="#22c55e" strokeOpacity="0.4"/>
                  <path d="M20 50 q25 15 50 0 q25 -15 50 0" fill="none" stroke="#22c55e" strokeOpacity="0.2" strokeWidth="6" strokeLinecap="round"/>
                  <circle cx="80" cy="100" r="28" fill="#dcfce7" opacity="0.3"/>
                  {/* ICD-10 code inside the panel */}
                  <g transform="translate(26,160)">
                    <rect x="0" y="0" width="108" height="32" rx="8" fill="#f0fdf4" stroke="#22c55e" strokeOpacity="0.2"/>
                    <text x="12" y="22" fontFamily="Inter, Arial" fontSize="12" fill="#000">ICD-10: R07.9</text>
                  </g>
                </g>

                {/* Buttons - Adjusted positioning */}
                <g transform="translate(34,360)">
                  <rect x="0" y="0" width="200" height="48" rx="12" fill="url(#gradA)" filter="url(#glow)"/>
                  <text x="20" y="32" fontFamily="Inter, Arial" fontSize="14" fill="#fff" fontWeight="600">Start Consultation</text>

                  <rect x="220" y="0" width="140" height="48" rx="12" fill="#f0fdf4" stroke="#22c55e" strokeOpacity="0.2"/>
                  <text x="248" y="32" fontFamily="Inter, Arial" fontSize="14" fill="#000">Upload Image</text>
                </g>
              </g>

              {/* Right: Analytics card - Repositioned to prevent overflow */}
              <g transform="translate(820,120)">
                <rect x="0" y="0" width="220" height="300" rx="20" fill="url(#glass)" stroke="#22c55e" strokeOpacity="0.2" filter="url(#softShadow)"/>
                <g transform="translate(16,20)">
                  <text x="0" y="18" fontFamily="Inter, Arial" fontSize="13" fill="#000">Session Insights</text>
                  <g transform="translate(0,36)" fill="#22c55e">
                    <rect x="0" y="28" width="16" height="32" rx="4"/>
                    <rect x="26" y="14" width="16" height="46" rx="4"/>
                    <rect x="52" y="6" width="16" height="54" rx="4"/>
                    <rect x="78" y="22" width="16" height="38" rx="4"/>
                    <rect x="104" y="16" width="16" height="44" rx="4"/>
                    <rect x="130" y="10" width="16" height="50" rx="4"/>
                  </g>
                  <text x="0" y="140" fontFamily="Inter, Arial" fontSize="11" fill="#000">Top ICD-10 Codes</text>
                  <g transform="translate(0,150)">
                    <rect x="0" y="0" width="180" height="32" rx="6" fill="#f0fdf4"/>
                    <text x="10" y="22" fontFamily="Inter, Arial" fontSize="11" fill="#000">R07.9 — Chest Pain</text>
                  </g>
                  <g transform="translate(0,190)">
                    <rect x="0" y="0" width="180" height="32" rx="6" fill="#f0fdf4"/>
                    <text x="10" y="22" fontFamily="Inter, Arial" fontSize="11" fill="#000">J06.9 — Upper Respiratory</text>
                  </g>
                  <g transform="translate(0,230)">
                    <rect x="0" y="0" width="180" height="32" rx="6" fill="#f0fdf4"/>
                    <text x="10" y="22" fontFamily="Inter, Arial" fontSize="11" fill="#000">M25.9 — Joint Disorder</text>
                  </g>
                </g>
              </g>

              {/* Decorative crosses - Repositioned to stay within bounds */}
              <g fill="#22c55e" opacity="0.2">
                <use href="#icon-cross" x="40" y="520" width="24" height="24"/>
                <use href="#icon-cross" x="1050" y="40" width="24" height="24"/>
                <use href="#icon-cross" x="180" y="80" width="20" height="20"/>
              </g>

              <desc>Illustration showing an AI-driven medical consultation in green and white: microphone with waveform, doctor card with neural nodes, X-ray panel, analytics card.</desc>
            </svg>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
              Revolutionary Medical AI Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of medical diagnosis with our advanced AI technology
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Image,
                title: "Medical Image Analysis",
                description: "Upload X-rays, MRIs, skin conditions, or any medical images for instant AI-powered analysis and diagnostic insights."
              },
              {
                icon: Mic,
                title: "Voice-to-Text Symptoms",
                description: "Record your symptoms naturally. Our advanced speech recognition converts your voice to text for comprehensive analysis."
              },
              {
                icon: Brain,
                title: "AI Doctor Responses",
                description: "Get professional medical insights powered by advanced AI models, including differential diagnoses and ICD-10 medical codes."
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white backdrop-blur-sm border border-gray-200 rounded-2xl p-8 hover:bg-medical-green-accent hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                <div className="w-16 h-16 bg-gradient-to-r from-medical-green to-medical-green-light rounded-xl flex items-center justify-center mb-6 mx-auto">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-center text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-center">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gray-900 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Company Info */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-medical-green to-medical-green-light rounded-lg flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">AI Medical Doctor</span>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Advanced AI-powered medical consultation platform for modern healthcare.
              </p>
            </div>

            {/* Quick Links */}
            <div className="text-center">
              <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
              <div className="space-y-2">
                <a href="#features" className="block text-gray-300 hover:text-medical-green-light transition-colors">Features</a>
                <a href="#about" className="block text-gray-300 hover:text-medical-green-light transition-colors">About</a>
                <Link to="/auth" className="block text-gray-300 hover:text-medical-green-light transition-colors">Get Started</Link>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="text-center md:text-right">
              <h4 className="text-lg font-semibold text-white mb-4">Important</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                This AI system is for educational purposes only. 
                Always consult with licensed medical professionals.
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-700 pt-8 flex flex-col sm:flex-row justify-between items-center text-center">
            <p className="text-gray-400 text-sm">&copy; 2025 AI Medical Doctor. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <a href="#privacy" className="text-gray-400 hover:text-medical-green-light text-sm transition-colors">Privacy</a>
              <a href="#terms" className="text-gray-400 hover:text-medical-green-light text-sm transition-colors">Terms</a>
              <a href="#contact" className="text-gray-400 hover:text-medical-green-light text-sm transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
