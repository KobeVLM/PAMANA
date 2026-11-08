import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAudio } from "@/contexts/AudioContext";
import { AppShell } from "@/components/layout/AppShell";
import api from "@/lib/api";
import { Lock, Volume2, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewItem {
  id: string;
  type: "pantig" | "salita" | "talasalitaan" | "pangungusap";
  text: string;
  subtext?: string;
  audioUrl: string;
  imageUrl?: string;
  isUnlocked: boolean;
  category?: string;
}

export const ModulesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { playAudio } = useAudio();

  const [items, setItems] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "pantig" | "salita" | "talasalitaan" | "pangungusap"
  >("pantig");
  const [playingId, setPlayingId] = useState<string | null>(null);

  const [openCabinet, setOpenCabinet] = useState<{
    title: string;
    category: string;
  } | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!user?.id) return;
      setIsLoading(true);

      try {
        const progressRes = await api.get(`/modules/progress/${user?.id}`);
        const progress = progressRes.data;
        const unlockedModules = progress
          .filter((p: any) => p.isUnlocked)
          .map((p: any) => p.moduleNumber);

        let allItems: ReviewItem[] = [];

        // --- PANTIG (Module 1 Syllables) ---
        if (unlockedModules.includes(1)) {
          const consonants = ["b","d","g","h","k","l","m","n","ng","p","r","s","t","w","y"];
          const vowels = ["a", "e", "i", "o", "u"];

          consonants.forEach((cons) => {
            vowels.forEach((vowel) => {
              const syllable = cons + vowel;
              allItems.push({
                id: `pantig-${syllable}`,
                type: "pantig",
                category: cons.toUpperCase(),
                text: `${cons.toUpperCase()} + ${vowel.toUpperCase()}`,
                subtext: `= ${syllable.toUpperCase()}`,
                audioUrl: `/audio/syllables/${syllable}.mp3`,
                isUnlocked: true,
              });
            });
          });
        }

        // --- SALITA (Module 2 Body Parts ONLY) ---
        if (unlockedModules.includes(2)) {
          const mod2Words = ["mata", "kamay", "ilong", "bibig", "tenga", "ulo", "paa", "likod", "tiyan", "noo"];
          mod2Words.forEach((word) => {
            allItems.push({
              id: `salita-m2-${word}`,
              type: "salita",
              text: word,
              audioUrl: `/audio/words/${word}.mp3`,
              imageUrl: `/images/module2/${word}.png`,
              isUnlocked: true,
            });
          });
        }

        // --- TALASALITAAN (Module 3 Family & Home) ---
        if (unlockedModules.includes(3)) {
          const mod3Words = ["Nanay", "Tatay", "Lola", "Lolo", "Kuya", "Ate", "bahay", "kain", "tulog"];
          mod3Words.forEach((word) => {
            allItems.push({
              id: `tal-m3-${word}`,
              type: "talasalitaan",
              text: word,
              audioUrl: `/audio/words/${word.toLowerCase()}.mp3`,
              imageUrl: `/images/module3/${word.toLowerCase()}.png`,
              isUnlocked: true,
            });
          });
        }

        // --- PANGUNGUSAP (Module 4) ---
        if (unlockedModules.includes(4)) {
          const sentences = [
            { id: "1", text: "Ako si Lolo" },
            { id: "2", text: "Kumain si Nanay" },
            { id: "3", text: "Malinis ang bahay" },
            { id: "4", text: "Bumasa si Ate" },
            { id: "5", text: "Uminom si Kuya" },
            { id: "6", text: "Saan si Lola?" },
            { id: "7", text: "Sino si Tatay?" },
            { id: "8", text: "Nasaan ang baso?" },
            { id: "9", text: "Kailan ka tulog?" },
          ];

          sentences.forEach((s) => {
            allItems.push({
              id: `sentence-${s.id}`,
              type: "pangungusap",
              text: s.text,
              // Ensure this matches your folder structure perfectly
              audioUrl: `/static/assets/audio/npc/sentence_${s.id}.mp3`,
              isUnlocked: true,
            });
          });
        }

        setItems(allItems);
      } catch (error) {
        console.error("Failed to load review data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [user?.id]);

  const filteredItems = items.filter((item) => item.type === activeTab);

  const consonantsList = ["B","D","G","H","K","L","M","N","NG","P","R","S","T","W","Y"];

  const getCabinetItems = (consonant: string) => {
    return items.filter(
      (item) => item.type === "pantig" && item.category === consonant
    );
  };

  const handlePlayAudio = (item: ReviewItem) => {
    if (!item.audioUrl) return;
    setPlayingId(item.id);
    
    // Fallback to browser Text-to-Speech if the audio fails to load
    playAudio(item.audioUrl, { fallbackText: item.text }).catch(() => {
      console.log("Audio failed, using TTS fallback");
      const utterance = new SpeechSynthesisUtterance(item.text);
      utterance.lang = "tl-PH";
      window.speechSynthesis.speak(utterance);
    });

    setTimeout(() => setPlayingId(null), 1500);
  };

  const getCardTheme = (tab: string) => {
    switch (tab) {
      case "pantig":
        return { bgImage: "url('/images/module-bg/m1_w.png')" };
      case "salita":
        return { bgImage: "url('/images/module-bg/m2_w.png')" };
      case "talasalitaan":
        return { bgImage: "url('/images/module-bg/m3_w.png')" };
      case "pangungusap":
        return { bgImage: "url('/images/module-bg/m4_w.png')" };
      default:
        return { bgImage: "none" };
    }
  };

  const currentTheme = getCardTheme(activeTab);

  return (
    <AppShell>
      <div
        className="relative w-full h-full overflow-y-auto bg-cover bg-center bg-no-repeat flex flex-col font-sans"
        style={{ backgroundImage: "url('/images/module-bg/modulebg.png')" }}
      >
        <div className="absolute inset-0 bg-black/20 pointer-events-none z-0" />

        {/* TRANSPARENT STICKY HEADER */}
        <div className="sticky top-0 z-40 pb-6 pt-3">
          
          <div className="relative w-full flex justify-between items-start px-4 md:px-6 min-h-[90px] pointer-events-none">
            <button
              onClick={() => navigate("/trail")}
              className="absolute left-24 top-4 pointer-events-auto cursor-pointer hover:scale-110 hover:-translate-y-1 hover:drop-shadow-xl active:scale-95 active:translate-y-1 transition-all duration-200 z-30"
            >
              <img src="/images/back_btn.png" alt="Back" className="h-10 md:h-12 w-auto object-contain drop-shadow-[0_6px_4px_rgba(0,0,0,0.5)]" />
            </button>

            <div className="absolute left-1/2 -translate-x-1/2 top-4 pointer-events-auto z-20">
              <img src="/images/module-bg/modules.png" alt="Aking Talasalitaan" className="h-12 md:h-16 w-auto object-contain drop-shadow-xl" />
            </div>
          </div>

          <div className="relative z-20 max-w-5xl mx-auto w-full px-4 mt-2">
            <div className="flex gap-1 md:gap-2 bg-white/95 backdrop-blur-md p-2.5 rounded-[2rem] shadow-[0_8px_20px_rgba(0,0,0,0.3)] border-4 border-white/80">
              {(["pantig", "salita", "talasalitaan", "pangungusap"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 py-3 md:py-4 rounded-xl font-black text-sm md:text-xl transition-colors duration-200 capitalize tracking-wide",
                    activeTab === tab
                      ? "bg-[#d6d63f] text-[#3b440a] shadow-[0_4px_0_#949420]"
                      : "text-[#5a6b5d] hover:bg-black/10"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="relative z-20 p-4 md:p-6 pt-4 max-w-5xl mx-auto w-full pb-24">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-20 gap-4 bg-white/70 backdrop-blur-md rounded-3xl border-4 border-white max-w-md mx-auto shadow-xl">
              <div className="w-16 h-16 border-8 border-[#a4cba9] border-t-[#2d5e3e] rounded-full animate-spin"></div>
              <p className="text-[#2d5e3e] font-black text-xl animate-pulse">Binubuksan ang aklat...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-24 bg-white/80 backdrop-blur-md rounded-[3rem] border-4 border-dashed border-[#a4cba9] max-w-lg mx-auto shadow-xl">
              <Lock className="w-20 h-20 mx-auto mb-4 text-[#a4cba9]" />
              <h3 className="font-black text-2xl text-[#2d5e3e] mb-2">Wala pang laman dito!</h3>
              <p className="text-[#5a6b5d] font-bold text-lg px-8">Magpatuloy sa pagsagot ng mga module para makapag-unlock ng mga bagong aralin.</p>
            </div>
          ) : activeTab === "pantig" ? (
            /* CABINET VIEW FOR PANTIG ONLY */
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 animate-in fade-in zoom-in duration-300 mt-2">
              {consonantsList.map((cons) => {
                const cabinetItems = getCabinetItems(cons);
                if (cabinetItems.length === 0) return null;

                return (
                  <button
                    key={cons}
                    onClick={() => setOpenCabinet({ title: `Mga Pantig ng "${cons}"`, category: cons })}
                    className="relative flex flex-col items-center justify-center w-[120px] md:w-[150px] h-[120px] md:h-[150px] rounded-[2rem] border-b-[8px] border-[#5c2e16] shadow-lg hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)] transition-all duration-200 active:translate-y-1 active:border-b-0 overflow-hidden bg-cover bg-center"
                    style={{ backgroundImage: "url('/images/module-bg/m1_w.png')" }}
                  >
                    <span className="relative z-10 text-4xl md:text-5xl font-black text-white" style={{ WebkitTextStroke: "3px black", paintOrder: "stroke fill" }}>
                      {cons}
                    </span>
                    <span className="relative z-10 text-white font-black mt-1 uppercase tracking-wider text-xs md:text-sm" style={{ WebkitTextStroke: "1.5px black", paintOrder: "stroke fill" }}>
                      {cabinetItems.length} Pantig
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* NORMAL GRID VIEW FOR SALITA, TALASALITAAN, PANGUNGUSAP */
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-4">
              {filteredItems.map((item, index) => {
                const isPlaying = playingId === item.id;
                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    style={{ animationDelay: `${index * 30}ms`, backgroundImage: currentTheme.bgImage }}
                    className={cn(
                      "relative w-[140px] md:w-[170px] flex flex-col items-center justify-center p-4 pt-6 rounded-[2rem] transition-all duration-300 animate-in fade-in zoom-in fill-mode-both shadow-xl bg-cover bg-center border-b-[8px]",
                      "border-[#5c2e16]",
                      "hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)] cursor-pointer",
                      isPlaying && "scale-105 border-[#d6d63f] shadow-[0_0_20px_rgba(214,214,63,0.6)]"
                    )}
                    onClick={() => handlePlayAudio(item)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handlePlayAudio(item);
                      }
                    }}
                  >
                    <div className="absolute -top-3 -right-2 bg-[#d6d63f] text-[#3b440a] rounded-full p-1.5 shadow-[0_3px_0_#949420] z-10">
                      <Star className="w-4 h-4 fill-current" />
                    </div>

                    {item.imageUrl ? (
                      <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-[1.2rem] flex items-center justify-center mb-3 border-2 border-gray-200 shadow-sm overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={item.text}
                          className="w-full h-full object-cover drop-shadow-md"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-[1.2rem] flex items-center justify-center mb-3 border-2 border-gray-200 shadow-sm">
                        <Volume2 className={cn("w-10 h-10 md:w-12 md:h-12", isPlaying ? "text-[#d6d63f] animate-ping" : "text-[#2d5e3e]")} />
                      </div>
                    )}

                    <div className="text-center w-full px-1">
                      <h3 className="font-black text-lg md:text-xl leading-tight uppercase tracking-wide text-white" style={{ WebkitTextStroke: "3px black", paintOrder: "stroke fill" }}>
                        {item.text}
                      </h3>
                    </div>

                    <div className={cn("mt-3 p-2 rounded-full transition-colors shadow-md border", isPlaying ? "bg-[#d6d63f] text-[#3b440a] border-[#b5b52d]" : "bg-white text-[#2d5e3e] border-gray-200")}>
                      <Volume2 className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL FOR PANTIG CABINET */}
      {openCabinet && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setOpenCabinet(null)}
          onKeyDown={(e) => { if (e.key === "Escape") setOpenCabinet(null); }}
        >
          <div
            role="presentation"
            className="relative bg-[#FAF3E0] rounded-[3rem] p-6 md:p-10 max-w-2xl w-full shadow-[0_20px_50px_rgba(0,0,0,0.6)] border-8 border-[#a4cba9] transform scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpenCabinet(null)}
              className="absolute top-4 right-4 md:top-6 md:right-6 bg-[#f4f9f0] text-[#2d5e3e] hover:bg-red-500 hover:text-white p-2.5 rounded-full transition-all duration-200 z-50 shadow-md border-2 border-[#a4cba9] hover:border-red-600 active:scale-90"
            >
              <X className="w-6 h-6 stroke-[3] pointer-events-none" />
            </button>

            <h2 className="text-3xl md:text-4xl font-black text-[#2d5e3e] text-center mb-8 drop-shadow-sm font-heading">
              {openCabinet.title}
            </h2>

            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {getCabinetItems(openCabinet.category).map((item) => {
                const isPlaying = playingId === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={(e) => { e.stopPropagation(); handlePlayAudio(item); }}
                    className={cn(
                      "flex flex-col items-center justify-center w-[120px] md:w-[140px] p-3 pt-5 rounded-[1.5rem] bg-cover bg-center border-b-[8px] border-[#5c2e16] hover:-translate-y-1 hover:shadow-lg cursor-pointer transition-all duration-200 active:translate-y-1 active:border-b-0",
                      isPlaying && "scale-105 shadow-[0_0_25px_rgba(214,214,63,0.8)] border-[#d6d63f]"
                    )}
                    style={{ backgroundImage: "url('/images/module-bg/m1_w.png')" }}
                  >
                    <div className="w-14 h-14 bg-white rounded-[1rem] flex items-center justify-center mb-3 border-2 border-gray-200 shadow-sm">
                      <Volume2 className={cn("w-6 h-6", isPlaying ? "text-[#d6d63f] animate-ping" : "text-[#2d5e3e]")} />
                    </div>

                    <span className="text-xl md:text-2xl font-black text-white mb-1 text-center leading-tight" style={{ WebkitTextStroke: "3px black", paintOrder: "stroke fill" }}>
                      {item.text}
                    </span>
                    <span className="text-sm md:text-base font-black text-white text-center" style={{ WebkitTextStroke: "2px black", paintOrder: "stroke fill" }}>
                      {item.subtext}
                    </span>

                    <div className={cn("mt-3 p-2 rounded-full transition-colors shadow-md border-2", isPlaying ? "bg-[#d6d63f] text-[#3b440a] border-[#b5b52d] animate-bounce" : "bg-white text-[#2d5e3e] border-[#e3ebe0]")}>
                      <Volume2 className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};