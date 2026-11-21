import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Heart, Shield } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#87CEEB] to-[#98FB98] p-6 md:p-12 relative overflow-y-auto">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-50 flex items-center gap-2 text-white font-black text-lg bg-black/20 hover:bg-black/30 px-4 py-2 rounded-2xl backdrop-blur-sm transition-all"
      >
        <ArrowLeft className="w-6 h-6 stroke-[3]" /> Back
      </button>

      {/* 👇 Giilisan ang mt-16 ngadto sa mt-10 aron mo-saka ang tibuok content */}
      <div className="max-w-4xl mx-auto mt-10 md:mt-16 relative z-10">
        
        {/* 👇 Giadjust ang margin bottom ug gidugangan ang top margin para mo-center sa space */}
        <div className="text-center mb-10 mt-6 md:mt-0">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-wider [-webkit-text-stroke:2px_#1a2e05] [paint-order:stroke_fill] drop-shadow-[0_6px_0_#1a2e05]">
            About <span className="text-[#FFC107]">PAMANA</span>
          </h1>
          <p className="text-xl text-[#1a2e05] font-bold bg-white/70 px-6 py-4 rounded-3xl border-4 border-white shadow-sm inline-block">
            Preserving the Filipino Language, One Quest at a Time.
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] p-8 md:p-12 shadow-[0_12px_0_rgba(0,0,0,0.1)] border-4 border-white space-y-8 text-slate-700 text-lg leading-relaxed font-medium">
          
          <div className="flex items-start gap-4">
            <div className="bg-green-100 p-4 rounded-2xl shrink-0 text-green-600 mt-1">
              <Star className="w-8 h-8 stroke-[3]" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">Our Mission</h2>
              <p>
                PAMANA (Philippine Indigenous and Modern Arts for Nurturing Appreciation) was born out of a simple goal: to make learning the Filipino language fun, interactive, and deeply rooted in our rich cultural heritage. We believe that language is the key to understanding our identity.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-sky-100 p-4 rounded-2xl shrink-0 text-sky-600 mt-1">
              <Shield className="w-8 h-8 stroke-[3]" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">Why We Built This</h2>
              <p>
                Many children growing up today struggle to connect with their roots. Traditional methods of learning can be boring. We gamified the experience—turning vocabulary, grammar, and culture into an epic quest. With Lino and Liway as your guides, every lesson becomes an adventure.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-pink-100 p-4 rounded-2xl shrink-0 text-pink-600 mt-1">
              <Heart className="w-8 h-8 stroke-[3]" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">For Every Learner</h2>
              <p>
                Whether you are a young learner exploring words for the first time, or a parent helping your child connect with their heritage, PAMANA is designed to bring families together through the beauty of the Filipino language.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};