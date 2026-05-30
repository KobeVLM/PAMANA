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
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-900">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-green-950/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img src="/images/Logo1.png" alt="PAMANA Logo" className="h-8 w-8 rounded-full object-cover" />
              <span className="text-white font-bold text-xl">PAMANA</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/about" className="text-white/80 hover:text-pamana-gold transition-colors">About Us</Link>
              <Link to="/contact" className="text-white/80 hover:text-pamana-gold transition-colors">Contact</Link>
            </div>
            <div className="flex items-center space-x-3">
              <Link to="/login">
                <Button variant="ghost" className="text-white hover:text-pamana-gold hover:bg-white/10">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-pamana-gold text-green-950 hover:bg-yellow-400">
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
            className="w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-green-950/50 via-green-900/30 to-green-950" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 border border-white/20">
            <Star className="w-4 h-4 text-pamana-gold fill-pamana-gold" />
            <span className="text-sm text-white/90">Discover Your Roots</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6">
            Explore Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pamana-gold to-yellow-300">
              Filipino Heritage
            </span>
          </h1>
          
          <p className="text-xl text-green-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            A world of interactive, Filipino Language learning awaits! Embark on an immersive journey through the rich tapestry of Philippine traditions.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-pamana-gold text-green-950 hover:bg-yellow-400 text-lg px-8 h-14 rounded-xl font-semibold group">
                Get Started
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/about">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg px-8 h-14 rounded-xl">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-green-950/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Discover the Three Pillars
            </h2>
            <p className="text-green-200 text-lg max-w-2xl mx-auto">
              Immerse yourself in a holistic learning experience designed for all ages
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Interactive Lessons */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-pamana-gold/50 transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-pamana-gold/20 rounded-xl flex items-center justify-center mb-6">
                <BookOpen className="w-7 h-7 text-pamana-gold" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Interactive Lessons</h3>
              <p className="text-green-200 leading-relaxed">
                Engaging modules covering grammar, vocabulary, and cultural context with real-time feedback.
              </p>
            </div>
            
            {/* Culture Hub */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-pamana-gold/50 transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-pamana-gold/20 rounded-xl flex items-center justify-center mb-6">
                <Globe className="w-7 h-7 text-pamana-gold" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Culture Hub</h3>
              <p className="text-green-200 leading-relaxed">
                Explore folktales, traditions, history, and regional diversity through multimedia content.
              </p>
            </div>
            
            {/* Community */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-pamana-gold/50 transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-pamana-gold/20 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-pamana-gold" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Community</h3>
              <p className="text-green-200 leading-relaxed">
                Connect with fellow learners, share experiences, and practice together in a supportive space.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-pamana-gold/10 to-pamana-green/10 rounded-3xl p-10 border border-white/10 backdrop-blur-sm">
            <h2 className="text-3xl font-bold text-white mb-4">WIKA!</h2>
            <p className="text-green-100 text-lg mb-8 max-w-xl mx-auto">
              Start your heritage journey today and discover the beauty of the Filipino language.
            </p>
            <Link to="/register">
              <Button size="lg" className="bg-white text-green-950 hover:bg-green-50 text-lg px-10 h-14 rounded-xl font-semibold">
                Begin Your Quest
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-green-300/60 text-sm">
          <p>© 2024 PAMANA Heritage Quest. Appreciating Filipino Language.</p>
        </div>
      </footer>
    </div>
  );
};
