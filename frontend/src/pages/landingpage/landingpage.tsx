import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { BookOpen, Globe, Users, ChevronRight, Star } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  // Redirect if already logged in
  if (user) {
    const dest = user.role === 'PARENT' ? '/dashboard' : user.role === 'TEACHER' ? '/klase' : '/trail';
    return <Navigate to={dest} replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1f14] via-[#0d2b1e] to-[#0a2418]">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a1f14]/85 backdrop-blur-md border-b border-[#B8E8C8]/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img
                src="/images/Logo1.png"
                alt="PAMANA Logo"
                className="h-8 w-8 rounded-full object-cover ring-2 ring-[#50C878]/40"
              />
              <span className="text-[#FEFCF3] font-bold text-xl">PAMANA</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/about"
                className="text-[#B8E8C8]/80 hover:text-[#50C878] transition-colors"
              >
                About Us
              </Link>
              <Link
                to="/contact"
                className="text-[#B8E8C8]/80 hover:text-[#50C878] transition-colors"
              >
                Contact
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <Link to="/login">
                <Button
                  variant="ghost"
                  className="text-[#FEFCF3] hover:text-[#50C878] hover:bg-[#50C878]/10"
                >
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-[#50C878] text-[#0a1f14] hover:bg-[#6ddb92] font-semibold shadow-lg shadow-[#50C878]/30">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/LandingPage1.png"
            alt="Filipino Heritage"
            className="w-full h-full object-cover opacity-60"
          />
          {/* Dark overlay with emerald/mint tint */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a1f14]/70 via-[#0d2b1e]/40 to-[#0a2418]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-[#50C878]/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 border border-[#50C878]/30">
            <Star className="w-4 h-4 text-[#50C878] fill-[#50C878]" />
            <span className="text-sm text-[#B8E8C8] font-medium">Discover Your Roots</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-[#FEFCF3] mb-6 leading-tight">
            Explore Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#50C878] to-[#B8E8C8]">
              Filipino Heritage
            </span>
          </h1>

          <p className="text-xl text-[#B8E8C8]/90 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            A world of interactive, Filipino Language learning awaits! Embark on an
            immersive journey through the rich tapestry of Philippine traditions.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button
                size="lg"
                className="bg-[#50C878] text-[#0a1f14] hover:bg-[#6ddb92] text-lg px-8 h-14 rounded-xl font-bold shadow-lg shadow-[#50C878]/40 group transition-all"
              >
                Get Started
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/about">
              <Button
                size="lg"
                variant="outline"
                className="border-[#B8E8C8]/40 text-[#B8E8C8] hover:bg-[#50C878]/10 hover:border-[#50C878]/60 text-lg px-8 h-14 rounded-xl"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#0a1f14]/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#FEFCF3] mb-4">
              Discover the Three Pillars
            </h2>
            <p className="text-[#B8E8C8]/80 text-lg max-w-2xl mx-auto">
              Immerse yourself in a holistic learning experience designed for all ages
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Interactive Lessons */}
            <div className="bg-[#FEFCF3]/5 backdrop-blur-sm rounded-2xl p-8 border border-[#B8E8C8]/20 hover:border-[#50C878]/50 transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-[#50C878]/20 rounded-xl flex items-center justify-center mb-6">
                <BookOpen className="w-7 h-7 text-[#50C878]" />
              </div>
              <h3 className="text-xl font-bold text-[#FEFCF3] mb-3">Interactive Lessons</h3>
              <p className="text-[#B8E8C8]/80 leading-relaxed">
                Engaging modules covering grammar, vocabulary, and cultural context
                with real-time feedback.
              </p>
            </div>

            {/* Culture Hub */}
            <div className="bg-[#FEFCF3]/5 backdrop-blur-sm rounded-2xl p-8 border border-[#B8E8C8]/20 hover:border-[#50C878]/50 transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-[#50C878]/20 rounded-xl flex items-center justify-center mb-6">
                <Globe className="w-7 h-7 text-[#50C878]" />
              </div>
              <h3 className="text-xl font-bold text-[#FEFCF3] mb-3">Culture Hub</h3>
              <p className="text-[#B8E8C8]/80 leading-relaxed">
                Explore folktales, traditions, history, and regional diversity through
                multimedia content.
              </p>
            </div>

            {/* Community */}
            <div className="bg-[#FEFCF3]/5 backdrop-blur-sm rounded-2xl p-8 border border-[#B8E8C8]/20 hover:border-[#50C878]/50 transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-[#50C878]/20 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-[#50C878]" />
              </div>
              <h3 className="text-xl font-bold text-[#FEFCF3] mb-3">Community</h3>
              <p className="text-[#B8E8C8]/80 leading-relaxed">
                Connect with fellow learners, share experiences, and practice together
                in a supportive space.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-[#50C878]/15 to-[#B8E8C8]/10 rounded-3xl p-10 border border-[#50C878]/30 backdrop-blur-sm">
            <h2 className="text-3xl font-bold text-[#FEFCF3] mb-4">WIKA!</h2>
            <p className="text-[#B8E8C8] text-lg mb-8 max-w-xl mx-auto">
              Start your heritage journey today and discover the beauty of the Filipino
              language.
            </p>
            <Link to="/register">
              <Button
                size="lg"
                className="bg-[#FEFCF3] text-[#0a1f14] hover:bg-[#B8E8C8] text-lg px-10 h-14 rounded-xl font-bold shadow-lg shadow-[#50C878]/20"
              >
                Begin Your Quest
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#B8E8C8]/15 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-[#B8E8C8]/50 text-sm">
          <p>© 2024 PAMANA Heritage Quest. Appreciating Filipino Language.</p>
        </div>
      </footer>
    </div>
  );
};