/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, MessageSquare, Send, Check } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#87CEEB] to-[#98FB98] p-6 md:p-12 relative overflow-y-auto">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-50 flex items-center gap-2 text-white font-black text-lg bg-black/20 hover:bg-black/30 px-4 py-2 rounded-2xl backdrop-blur-sm transition-all"
      >
        <ArrowLeft className="w-6 h-6 stroke-[3]" /> Back
      </button>

      {/* 👇 Matched the exact margins from AboutPage */}
      <div className="max-w-3xl mx-auto mt-10 md:mt-16 relative z-10">
        
        {/* 👇 Matched the title spacing and style from AboutPage */}
        <div className="text-center mb-10 mt-6 md:mt-0">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-wider [-webkit-text-stroke:2px_#1a2e05] [paint-order:stroke_fill] drop-shadow-[0_6px_0_#1a2e05]">
            Contact <span className="text-[#FFC107]">Us</span>
          </h1>
          <p className="text-lg md:text-xl text-[#1a2e05] font-bold bg-white/70 px-6 py-4 rounded-3xl border-4 border-white shadow-sm inline-block max-w-2xl">
            Have questions? We'd love to hear from you!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white/95 backdrop-blur-md rounded-[2rem] p-6 border-4 border-white shadow-[0_8px_0_rgba(0,0,0,0.1)] flex items-center gap-4 hover:-translate-y-1 transition-transform cursor-pointer">
            <div className="bg-[#00B0FF] p-4 rounded-2xl text-white">
              <Mail className="w-8 h-8" />
            </div>
            <div>
              <p className="font-black text-slate-800 text-lg">Email Us</p>
              <p className="font-bold text-slate-500">support@pamana.com</p>
            </div>
          </div>
          
          <div className="bg-white/95 backdrop-blur-md rounded-[2rem] p-6 border-4 border-white shadow-[0_8px_0_rgba(0,0,0,0.1)] flex items-center gap-4 hover:-translate-y-1 transition-transform cursor-pointer">
            <div className="bg-[#4CAF50] p-4 rounded-2xl text-white">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div>
              <p className="font-black text-slate-800 text-lg">Message Us</p>
              <p className="font-bold text-slate-500">Facebook & Instagram</p>
            </div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] p-8 md:p-10 border-4 border-white shadow-[0_12px_0_rgba(0,0,0,0.1)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-600 uppercase ml-2">Name</label>
                <input type="text" required placeholder="Your name" className="w-full p-4 bg-slate-100 rounded-2xl font-bold border-2 border-transparent focus:border-[#4CAF50] focus:outline-none focus:ring-4 focus:ring-[#4CAF50]/30 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-600 uppercase ml-2">Email</label>
                <input type="email" required placeholder="your@email.com" className="w-full p-4 bg-slate-100 rounded-2xl font-bold border-2 border-transparent focus:border-[#4CAF50] focus:outline-none focus:ring-4 focus:ring-[#4CAF50]/30 transition-all" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-600 uppercase ml-2">Message</label>
              <textarea required placeholder="How can we help you?" rows={4} className="w-full p-4 bg-slate-100 rounded-2xl font-bold border-2 border-transparent focus:border-[#4CAF50] focus:outline-none focus:ring-4 focus:ring-[#4CAF50]/30 transition-all resize-none"></textarea>
            </div>

            <button type="submit" className={`w-full py-4 rounded-2xl border-4 border-white shadow-[0_8px_0_#1B5E20] transition-all font-black text-xl tracking-wider flex items-center justify-center gap-2 ${sent ? 'bg-[#FFC107] text-[#5D4037] shadow-[0_4px_0_#D4A017]' : 'bg-gradient-to-b from-[#4CAF50] to-[#388E3C] text-white hover:brightness-110 active:border-b-0 active:translate-y-2 active:shadow-none'}`}>
              {sent ? (
                <><Check className="w-6 h-6 stroke-[3]" /> Sent Successfully!</>
              ) : (
                <><Send className="w-6 h-6 stroke-[3]" /> Send Message</>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};