import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Globe, Users, ChevronRight, Star, Leaf, Sparkle } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  // Redirect if already logged in
  if (user) {
    const dest = user.role === 'PARENT' ? '/dashboard' : '/trail';
    return <Navigate to={dest} replace />;
  }

  // Reusable CSS filter to create the thick white sticker outline
  const stickerEffect = "[filter:drop-shadow(2px_0_0_#fff)_drop-shadow(-2px_0_0_#fff)_drop-shadow(0_2px_0_#fff)_drop-shadow(0_-2px_0_#fff)_drop-shadow(0_6px_4px_rgba(0,0,0,0.15))]";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#87CEEB] to-[#98FB98] font-sans overflow-y-auto relative">
      
      {/* --- DECORATIVE BACKGROUND ELEMENTS (STARS & LEAVES) --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        
        {/* TOP LEFT */}
        <Leaf className="absolute top-[12%] left-[3%] w-12 h-12 md:w-16 md:h-16 text-green-500 stroke-white stroke-[2.5px] -rotate-45 animate-bounce [filter:drop-shadow(0_4px_4px_rgba(0,0,0,0.2))]" style={{ animationDuration: '4s' }} />
        <Star className={`absolute top-[25%] left-[8%] w-12 h-12 md:w-16 md:h-16 text-orange-500 fill-yellow-400 ${stickerEffect} -rotate-12 animate-pulse`} />
        <Sparkle className="absolute top-[42%] left-[5%] w-8 h-8 text-white fill-white animate-ping" style={{ animationDuration: '3s' }} />
        
        {/* BOTTOM LEFT */}
        <Star className={`absolute top-[65%] left-[6%] w-10 h-10 md:w-14 md:h-14 text-pink-600 fill-pink-400 ${stickerEffect} rotate-12 animate-bounce`} style={{ animationDuration: '3.5s' }} />
        <Leaf className="absolute bottom-[15%] left-[4%] w-14 h-14 md:w-20 md:h-20 text-emerald-600 stroke-white stroke-[2.5px] rotate-90 animate-bounce [filter:drop-shadow(0_4px_4px_rgba(0,0,0,0.2))]" style={{ animationDuration: '5s' }} />
        <Star className={`absolute bottom-[8%] left-[12%] w-8 h-8 md:w-10 md:h-10 text-orange-500 fill-yellow-400 ${stickerEffect} -rotate-45 animate-pulse`} style={{ animationDuration: '4s' }} />

        {/* TOP RIGHT */}
        <Star className={`absolute top-[15%] right-[5%] w-14 h-14 md:w-20 md:h-20 text-orange-500 fill-yellow-400 ${stickerEffect} rotate-12 animate-bounce`} style={{ animationDuration: '3s' }} />
        <Leaf className="absolute top-[35%] right-[4%] w-14 h-14 md:w-20 md:h-20 text-green-600 stroke-white stroke-[2.5px] -rotate-12 animate-bounce [filter:drop-shadow(0_4px_4px_rgba(0,0,0,0.2))]" style={{ animationDuration: '6s' }} />
        <Sparkle className="absolute top-[52%] right-[10%] w-10 h-10 text-yellow-200 fill-yellow-200 animate-pulse" style={{ animationDuration: '2s' }} />
        
        {/* BOTTOM RIGHT */}
        <Star className={`absolute top-[68%] right-[6%] w-12 h-12 md:w-16 md:h-16 text-pink-600 fill-pink-400 ${stickerEffect} -rotate-12 animate-bounce`} style={{ animationDuration: '4.5s' }} />
        <Sparkle className="absolute bottom-[25%] right-[15%] w-8 h-8 text-white fill-white animate-ping" style={{ animationDuration: '4s' }} />
        <Star className={`absolute bottom-[10%] right-[8%] w-8 h-8 text-orange-500 fill-yellow-400 ${stickerEffect} rotate-45 animate-pulse`} />

      </div>
      {/* ------------------------------------------------------ */}

      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/40 backdrop-blur-md border-b-4 border-white/60">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 md:h-24">
            
            {/* Logo Section */}
            <div className="flex shrink-0 items-center space-x-1.5 sm:space-x-3">
              <img
                src="/images/S-Logo.png"
                alt="S Logo"
                className="h-8 sm:h-12 md:h-14 w-auto object-contain drop-shadow-md"
              />
              <img
                src="/images/W-Logo.png"
                alt="PAMANA Logo"
                className="h-9 sm:h-14 md:h-20 w-auto object-contain drop-shadow-md"
              />
            </div>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/about" className="text-[#2b5c3b] font-black text-lg hover:text-[#1a2e05] transition-colors">
                About Us
              </Link>
              <Link to="/contact" className="text-[#2b5c3b] font-black text-lg hover:text-[#1a2e05] transition-colors">
                Contact
              </Link>
            </div>

            {/* Auth Buttons */}
            <div className="flex shrink-0 items-center space-x-1.5 sm:space-x-3 md:space-x-4">
              <Link to="/login" className="text-[#2b5c3b] font-black hover:text-[#1a2e05] transition-colors whitespace-nowrap px-1.5 py-2 text-sm sm:px-3 sm:text-base md:px-4 md:text-lg">
                Log in
              </Link>
              <Link to="/register">
                <button className="whitespace-nowrap bg-gradient-to-b from-[#66BB6A] to-[#4CAF50] text-white px-3 py-2 text-sm sm:px-5 sm:py-2.5 sm:text-base md:px-6 md:text-lg rounded-full border-[3px] sm:border-4 border-white shadow-[0_4px_0_#2E7D32] hover:brightness-110 active:border-b-0 active:translate-y-1 active:shadow-none transition-all font-black tracking-wide">
                  Sign Up
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-36 pb-16 md:pt-52 md:pb-24 overflow-hidden flex flex-col items-center justify-center text-center px-4">
        
        {/* "Discover Your Roots" Pill */}
        <div className="inline-flex items-center gap-2 bg-[#FFC107] text-[#5D4037] rounded-full px-5 py-2 mb-8 border-4 border-white shadow-[0_4px_0_#D4A017] rotate-[-2deg]">
          <Star className="w-5 h-5 fill-[#5D4037]" />
          <span className="text-sm md:text-base font-black uppercase tracking-wider">Discover Your Roots</span>
        </div>

        {/* Main Title */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white mb-6 leading-tight tracking-wider [-webkit-text-stroke:2px_#1a2e05] [paint-order:stroke_fill] drop-shadow-[0_6px_0_#1a2e05]">
          Explore Your <br className="md:hidden" />
          <span className="text-[#FFC107]">Filipino</span> Heritage
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-[#1a2e05] font-bold max-w-2xl mx-auto mb-10 bg-white/70 px-6 py-3 rounded-3xl border-4 border-white shadow-sm leading-relaxed">
          A world of interactive, Filipino Language learning awaits! Embark on an
          immersive journey through the rich tapestry of Philippine traditions.
        </p>

        {/* Hero Buttons */}
        <div className="flex flex-col sm:flex-row gap-5 justify-center w-full max-w-md mx-auto">
          <Link to="/register" className="w-full sm:w-auto">
            <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-b from-[#FFB74D] to-[#FF9800] text-white px-10 py-4 rounded-2xl border-4 border-white shadow-[0_8px_0_#E65100] hover:brightness-110 active:border-b-0 active:translate-y-2 active:shadow-none transition-all font-black text-2xl tracking-wider">
              Get Started
              <ChevronRight className="w-6 h-6 stroke-[3]" />
            </button>
          </Link>
          <Link to="/about" className="w-full sm:w-auto">
            <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-b from-[#4CAF50] to-[#388E3C] text-white px-10 py-4 rounded-2xl border-4 border-white shadow-[0_8px_0_#1B5E20] hover:brightness-110 active:border-b-0 active:translate-y-2 active:shadow-none transition-all font-black text-2xl tracking-wider">
              Learn More
            </button>
          </Link>
        </div>
      </section>

      {/* Features Section (Three Pillars) */}
      <section className="relative z-10 py-20 bg-white/40 backdrop-blur-sm border-t-4 border-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-wider [-webkit-text-stroke:1.5px_#1a2e05] [paint-order:stroke_fill] drop-shadow-[0_4px_0_#1a2e05]">
              Discover the Three Pillars
            </h2>
            <p className="text-[#2b5c3b] font-bold text-lg md:text-xl max-w-2xl mx-auto">
              Immerse yourself in a holistic learning experience designed for all ages.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Interactive Lessons */}
            <div className="bg-white/95 backdrop-blur-sm rounded-[2rem] p-8 shadow-[0_8px_0_rgba(0,0,0,0.1)] border-4 border-white hover:-translate-y-2 transition-transform duration-200">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6 text-green-600">
                <BookOpen className="w-8 h-8 stroke-[3]" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3">Interactive Lessons</h3>
              <p className="text-slate-600 font-medium leading-relaxed">
                Engaging modules covering grammar, vocabulary, and cultural context
                with real-time feedback.
              </p>
            </div>

            {/* Culture Hub */}
            <div className="bg-white/95 backdrop-blur-sm rounded-[2rem] p-8 shadow-[0_8px_0_rgba(0,0,0,0.1)] border-4 border-white hover:-translate-y-2 transition-transform duration-200">
              <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mb-6 text-sky-600">
                <Globe className="w-8 h-8 stroke-[3]" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3">Culture Hub</h3>
              <p className="text-slate-600 font-medium leading-relaxed">
                Explore folktales, traditions, history, and regional diversity through
                multimedia content.
              </p>
            </div>

            {/* Community */}
            <div className="bg-white/95 backdrop-blur-sm rounded-[2rem] p-8 shadow-[0_8px_0_rgba(0,0,0,0.1)] border-4 border-white hover:-translate-y-2 transition-transform duration-200">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 text-purple-600">
                <Users className="w-8 h-8 stroke-[3]" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3">Community</h3>
              <p className="text-slate-600 font-medium leading-relaxed">
                Connect with fellow learners, share experiences, and practice together
                in a supportive space.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-[#FFC107] rounded-[2.5rem] p-10 md:p-14 border-8 border-white shadow-[0_12px_0_#D4A017] relative overflow-hidden">
            
            {/* Glossy top effect */}
            <div className="absolute top-0 inset-x-0 h-1/2 bg-white/20 pointer-events-none" />

            <h2 className="relative text-4xl md:text-5xl font-black text-white mb-4 tracking-widest [-webkit-text-stroke:2px_#5D4037] [paint-order:stroke_fill] drop-shadow-[0_4px_0_#5D4037]">
              WIKA!
            </h2>
            <p className="relative text-[#5D4037] font-black text-lg md:text-xl mb-8 max-w-xl mx-auto">
              Start your heritage journey today and discover the beauty of the Filipino language.
            </p>
            <Link to="/register" className="relative inline-block">
              <button className="bg-gradient-to-b from-[#4CAF50] to-[#388E3C] text-white px-10 py-4 rounded-2xl border-4 border-white shadow-[0_6px_0_#1B5E20] hover:brightness-110 active:border-b-0 active:translate-y-1.5 active:shadow-none transition-all font-black text-xl tracking-wider">
                Begin Your Quest
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t-4 border-white/50 py-8 bg-white/20">
        <div className="max-w-7xl mx-auto px-4 text-center text-[#2b5c3b] font-bold">
          <p>© 2024 PAMANA Heritage Quest. Appreciating Filipino Language.</p>
        </div>
      </footer>
      
    </div>
  );
};