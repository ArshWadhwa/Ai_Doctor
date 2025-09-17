import React from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Brain, Mic, Image, Clock, Menu, X } from 'lucide-react';

const LandingPage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-blue-900 text-white">
      {/* Enhanced Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-slate-900/95 backdrop-blur-lg border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">MediCare AI</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-white/80 hover:text-white transition-colors font-medium px-3 py-2 rounded-lg hover:bg-white/10">Features</a>
              <a href="#about" className="text-white/80 hover:text-white transition-colors font-medium px-3 py-2 rounded-lg hover:bg-white/10">About</a>
              <a href="#contact" className="text-white/80 hover:text-white transition-colors font-medium px-3 py-2 rounded-lg hover:bg-white/10">Contact</a>
              <a href="#blog" className="text-white/80 hover:text-white transition-colors font-medium px-3 py-2 rounded-lg hover:bg-white/10">Blog</a>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link 
                to="/consultation" 
                className="text-white/80 hover:text-white transition-colors font-medium px-4 py-2 rounded-lg hover:bg-white/10"
              >
                Login
              </Link>
              <Link 
                to="/consultation" 
                className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-6 py-2.5 rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden bg-slate-900/95 backdrop-blur-lg border-t border-white/10">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <a href="#features" className="block text-white/80 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">Features</a>
                <a href="#about" className="block text-white/80 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">About</a>
                <a href="#contact" className="block text-white/80 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">Contact</a>
                <a href="#blog" className="block text-white/80 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">Blog</a>
                <div className="pt-4 pb-2 border-t border-white/10 mt-4">
                  <Link to="/consultation" className="block text-white/80 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">Login</Link>
                  <Link to="/consultation" className="block bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-3 py-2 rounded-lg font-semibold mt-2 text-center">Get Started</Link>
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
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6">
                Your Health <br />
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                  Our Care
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-white/90 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Get instant medical analysis with our cutting-edge AI technology. 
                Upload medical images, record your symptoms, and receive professional 
                diagnostic insights with ICD-10 codes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link 
                  to="/consultation" 
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300 text-center"
                >
                  Start Free Consultation
                </Link>
                <a 
                  href="#features" 
                  className="border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-center"
                >
                  Learn More
                </a>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="flex-1 flex justify-center lg:justify-end">
              <div className="relative w-80 h-80 sm:w-96 sm:h-96">
                {/* Animated background circles */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-400/20 animate-pulse"></div>
                <div className="absolute inset-4 rounded-full bg-gradient-to-r from-cyan-500/20 to-teal-400/20 animate-pulse delay-1000"></div>
                
                {/* Floating medical icons */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Stethoscope className="w-16 h-16 text-blue-400 absolute top-12 left-12 animate-bounce" />
                  <Brain className="w-14 h-14 text-cyan-400 absolute top-16 right-16 animate-bounce delay-500" />
                  <Mic className="w-12 h-12 text-teal-400 absolute bottom-20 left-16 animate-bounce delay-1000" />
                  <Image className="w-14 h-14 text-blue-300 absolute bottom-16 right-12 animate-bounce delay-1500" />
                  <Clock className="w-10 h-10 text-cyan-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-spin" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Revolutionary Medical AI Features
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
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
              <div key={index} className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-slate-800/70 hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center mb-6 mx-auto">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-center">{feature.title}</h3>
                <p className="text-white/80 leading-relaxed text-center">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-slate-900/70 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Company Info */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">AI Medical Doctor</span>
              </div>
              <p className="text-white/70 leading-relaxed">
                Advanced AI-powered medical consultation platform for modern healthcare.
              </p>
            </div>

            {/* Quick Links */}
            <div className="text-center">
              <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
              <div className="space-y-2">
                <a href="#features" className="block text-white/70 hover:text-white transition-colors">Features</a>
                <a href="#about" className="block text-white/70 hover:text-white transition-colors">About</a>
                <Link to="/consultation" className="block text-white/70 hover:text-white transition-colors">Get Started</Link>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="text-center md:text-right">
              <h4 className="text-lg font-semibold text-white mb-4">Important</h4>
              <p className="text-white/70 text-sm leading-relaxed">
                This AI system is for educational purposes only. 
                Always consult with licensed medical professionals.
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center text-center">
            <p className="text-white/60 text-sm">&copy; 2025 AI Medical Doctor. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <a href="#privacy" className="text-white/60 hover:text-white/80 text-sm transition-colors">Privacy</a>
              <a href="#terms" className="text-white/60 hover:text-white/80 text-sm transition-colors">Terms</a>
              <a href="#contact" className="text-white/60 hover:text-white/80 text-sm transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
