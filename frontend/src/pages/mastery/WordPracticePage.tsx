import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useAudio } from "@/contexts/AudioContext";
import { PracticeCompletion } from "@/components/practice/PracticeCompletion";
import { NPCDialogue } from "@/components/game/NPCDialogue";
import { AudioPlayer } from "@/components/game/AudioPlayer";
import { HINT_AFTER_ATTEMPTS } from "@/components/game/constants";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { BilingualText } from "@/components/common/BilingualText";
import { useAudioElement, useSfx } from "@/hooks/useGameAudio";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { bi } from "@/lib/i18n";
import api from "@/lib/api";
import type { ModuleProgress } from "@/types";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import bgmAudioFile from "@/components/music/ig-bgmusic.mp3";

interface VocabWord {
  wordId: string;
  word: string;
  domain: string;
  audioUrl: string;
  imageUrl: string;
  ordinal?: number;
}

interface VocabularyItemDto {
  wordId?: string;
  id?: string;
  word: string;
  domain: string;
  audioUrl: string;
  imageUrl: string;
  ordinal?: number;
}

interface MatchOptionDto {
  wordId?: string;
  id?: string;
  word?: string;
  label?: string;
  imageUrl?: string;
}

const NPC_LINE = bi(
  'Basahin! Alin ang tamang salitang nakasulat?',
  'Read! Which is the correct written word?'
);
const ROUND_TOTAL = 5;
const STEP_LABELS: Record<string, string> = {
  pakinggan: "1. Pakinggan",
  kilalanin: "2. Kilalanin",
  basahin: "3. Basahin",
  gamitin: "4. Gamitin",
};

const DOMAIN_LABELS: Record<string, string> = {
  self_body: 'Bahagi ng Katawan',
  family_home: 'Pamilya at Tahanan',
};

const pickRoundWords = (words: VocabWord[]): VocabWord[] => {
  const sorted = [...words].sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0));
  return sorted.slice(0, ROUND_TOTAL);
};

export const WordPracticePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stopAudio } = useAudio();
  const { playWrong } = useSfx();

  const [roundWords, setRoundWords] = useState<VocabWord[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  const [currentWord, setCurrentWord] = useState<VocabWord | null>(null);
  const [options, setOptions] = useState<{ id: string; label: string; imageUrl?: string }[]>([]);
  const [correctId, setCorrectId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [celebrate, setCelebrate] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  
  // 👇 Added attempts state to fix the immediate green hint
  const [attempts, setAttempts] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  
  // NPC Audio Flow
  const [npcIntroDone, setNpcIntroDone] = useState(false);
  const hasPlayedNpcRef = useRef(false);

  const totalRounds = roundWords.length || ROUND_TOTAL;

  useScrollToTop(String(roundIndex));

  // --- BGM Volume Ducking Logic ---
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const bgmDuckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const defaultVolume = 0.3;
  const duckedVolume = 0.05;

  useEffect(() => {
    const audio = new Audio(bgmAudioFile);
    audio.loop = true;
    audio.volume = defaultVolume;
    bgmRef.current = audio;

    const startAudio = () => {
      const isBgmEnabled = localStorage.getItem("pamana_bgm") !== "false";
      if (isBgmEnabled && audio.paused) {
        audio.play()?.catch(() => console.log("Autoplay blocked by browser"));
      }
    };

    startAudio();

    const handleSettingsChange = () => {
      const isBgmEnabled = localStorage.getItem("pamana_bgm") !== "false";
      if (!isBgmEnabled) audio.pause();
      else audio.play()?.catch(() => {});
    };

    window.addEventListener("pamana_settings_changed", handleSettingsChange);
    
    const handleInteraction = () => {
      if (audio.paused) startAudio();
      document.removeEventListener("click", handleInteraction);
    };
    document.addEventListener("click", handleInteraction);

    return () => {
      audio.pause();
      document.removeEventListener("click", handleInteraction);
      window.removeEventListener("pamana_settings_changed", handleSettingsChange);
      if (bgmDuckTimerRef.current) clearTimeout(bgmDuckTimerRef.current);
    };
  }, []);

  const duckBGM = useCallback((durationMs = 2000) => {
    if (bgmRef.current) bgmRef.current.volume = duckedVolume;
    if (bgmDuckTimerRef.current) clearTimeout(bgmDuckTimerRef.current);
    bgmDuckTimerRef.current = setTimeout(() => {
      if (bgmRef.current) bgmRef.current.volume = defaultVolume;
    }, durationMs);
  }, []);

  useEffect(() => {
    if (currentWord) duckBGM(4000);
  }, [currentWord, currentWord?.wordId, duckBGM]);

  useEffect(() => {
    if (isComplete && bgmRef.current) bgmRef.current.pause();
  }, [isComplete]);

  useEffect(() => {
    return () => { stopAudio(); };
  }, [stopAudio]);
  // --------------------------------

  const { replay: playTarget } = useAudioElement(currentWord?.audioUrl ?? null);

  // Route guard: Module 2 must be complete first.
  const checkPrerequisite = useCallback(async () => {
    if (!user?.id) return { allowed: false };
    const res = await api.get(`/modules/progress/${user.id}`);
    const mod = (res.data as ModuleProgress[]).find((p) => p.moduleNumber === 2);
    return { allowed: Boolean(mod?.isComplete) };
  }, [user?.id]);

  const loadVocabulary = useCallback(async () => {
    const res = await api.get('/vocabulary/all');
    if (!Array.isArray(res.data)) throw new Error('Malformed vocabulary response');
    return (res.data as VocabularyItemDto[]).map((item) => ({
      wordId: String(item.wordId ?? item.id),
      word: item.word,
      domain: item.domain,
      audioUrl: item.audioUrl,
      imageUrl: item.imageUrl,
      ordinal: item.ordinal,
    }));
  }, []);

  const init = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const guard = await checkPrerequisite();
      if (!guard.allowed) {
        navigate('/trail', { replace: true });
        return;
      }
      const vocab = await loadVocabulary();
      const picked = pickRoundWords(vocab);
      setRoundWords(picked);
      if (picked.length > 0) {
        setCurrentWord(picked[0]);
        setRoundIndex(0);
      }
    } catch (err) {
      setLoadError(err);
    } finally {
      setIsLoading(false);
    }
  }, [checkPrerequisite, loadVocabulary, navigate]);

  useEffect(() => {
    void init();
  }, [init]);

  // Load options when current word changes
  const loadOptions = useCallback(async () => {
    if (!currentWord) return;
    try {
      const res = await api.get(`/vocabulary/match/${currentWord.wordId}?step=basahin`);
      const opts = res.data?.options as MatchOptionDto[] | undefined;
      if (Array.isArray(opts)) {
        setOptions(opts.map((o) => ({
          id: String(o.wordId ?? o.id),
          label: o.word ?? o.label ?? "",
          imageUrl: o.imageUrl,
        })));
        setCorrectId(String(res.data?.targetWordId ?? currentWord.wordId));
      }
    } catch {
      toast.error("Hindi ma-load ang mga opsyon.");
    }
  }, [currentWord]);

  useEffect(() => {
    if (currentWord) {
      setSelectedId(null);
      setCorrectId(null);
      setFeedback(null);
      setImageFailed(false);
      setOptions([]);
      setAttempts(0); // 👈 Reset attempts on new word
      void loadOptions();
    }
  }, [currentWord, loadOptions]);

  // Unlock the word audio only after Lolo's instruction has finished
  const handleNpcAudioEnd = useCallback(() => {
    hasPlayedNpcRef.current = true;
    setNpcIntroDone(true);
  }, []);

  useEffect(() => {
    if (roundIndex === 0) {
      setNpcIntroDone(false);
      hasPlayedNpcRef.current = false;
    }
  }, [roundIndex]);

  const advance = useCallback(() => {
    if (roundIndex < roundWords.length - 1) {
      const nextIdx = roundIndex + 1;
      setRoundIndex(nextIdx);
      setCurrentWord(roundWords[nextIdx]);
    } else {
      setIsComplete(true);
    }
  }, [roundIndex, roundWords]);

  const handleSelect = useCallback(
    async (optionId: string) => {
      if (!currentWord || !correctId || selectedId || isSubmitting) return;
      
      duckBGM(2000);
      const isCorrect = optionId === correctId;
      
      setSelectedId(optionId);
      setFeedback(isCorrect ? "correct" : "incorrect");
      
      if (isCorrect) {
        setCelebrate((c) => c + 1);
        setScore((s) => s + 1);
        playTarget();
      } else {
        setAttempts((a) => a + 1); // 👈 Increment attempts on wrong answer
        playWrong();
      }

      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        if (isCorrect) {
          setTimeout(advance, 1200);
        } else {
          setTimeout(() => {
            setSelectedId(null);
            setFeedback(null);
          }, 1200);
        }
      }, 500);
    },
    [currentWord, correctId, selectedId, isSubmitting, advance, playTarget, playWrong, duckBGM]
  );

  const handlePlayAgain = useCallback(() => {
    const picked = pickRoundWords(roundWords);
    setRoundWords(picked);
    setRoundIndex(0);
    setCurrentWord(picked[0] ?? null);
    setScore(0);
    setIsComplete(false);
    if (bgmRef.current) bgmRef.current.play()?.catch(() => {});
  }, [roundWords]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#EAF0D8] flex items-center justify-center">
        <LoadingState message="Inihahanda ang pagsasanay..." />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen w-full bg-[#EAF0D8] flex items-center justify-center">
        <ErrorState
          description="Hindi ma-load ang pagsasanay. Pakisubukan muli."
          onRetry={() => void init()}
        />
      </div>
    );
  }

  if (isComplete) {
    const accuracy = totalRounds > 0 ? Math.round((score / totalRounds) * 100) : 0;
    return (
      <div className="min-h-screen w-full bg-[#EAF0D8] flex items-center justify-center p-4">
        <PracticeCompletion
          title="Natapos mo ang Practice Mode!"
          message={`Matagumpay mong natapos ang ${totalRounds} salita sa pagtutugma ng salita.`}
          messageEn={`You successfully finished matching all ${totalRounds} words.`}
          score={accuracy}
          total={100}
          onRetry={handlePlayAgain}
          retryLabel="Subukan Ulit"
          retryLabelEn="Try Again"
          retrying={false}
          onExit={() => navigate('/home')}
          exitLabel="Bumalik sa Home"
          illustration={
            <img
              src="/images/Lolo-C.png"
              alt="Lolo"
              width={256}
              height={256}
              decoding="async"
              className="mx-auto h-52 w-52 object-contain drop-shadow-2xl sm:h-64 sm:w-64"
            />
          }
        />
      </div>
    );
  }

  if (!currentWord) return null;

  const domainLabel = DOMAIN_LABELS[currentWord.domain] ?? currentWord.domain;
  
  // Fake steps for the visual progress bar
  const steps = ["pakinggan", "kilalanin", "basahin", "gamitin"];
  const currentStepIndex = 2; // Hardcoded to "basahin" for this practice mode

  return (
    <div
      className="relative h-screen w-full bg-cover bg-center flex flex-col font-sans overflow-hidden"
      style={{ backgroundImage: "url('/images/module-bg/m-Garden.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/10 z-0 pointer-events-none" />

      {/* TOP BAR */}
      <div className="relative w-full z-20 flex justify-between items-start p-4 md:p-6 min-h-[100px] md:min-h-[140px]">
        
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black px-4 py-2 mt-2 rounded-full border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 transition-all shadow-lg z-30"
        >
          <ArrowLeft className="w-5 h-5 stroke-[3]" />
          Bumalik
        </button>

        <div className="absolute left-1/2 -translate-x-1/2 top-2 md:top-4 pointer-events-none z-20 flex flex-col items-center justify-center w-full leading-tight">
          <h1 
            className="text-4xl md:text-6xl lg:text-7xl font-black text-center tracking-wide"
            style={{
              color: "#FFD700", 
              WebkitTextStroke: "3px black", 
              paintOrder: "stroke fill",
              textShadow: "0 4px 4px rgba(0,0,0,0.4)", 
            }}
          >
            Pagsasanay:
          </h1>
          <h1 
            className="text-3xl md:text-5xl lg:text-6xl font-black text-center tracking-wide mt-1 md:mt-2"
            style={{
              color: "#FFD700", 
              WebkitTextStroke: "3px black", 
              paintOrder: "stroke fill",
              textShadow: "0 4px 4px rgba(0,0,0,0.4)", 
            }}
          >
            Pagtutugma ng Salita
          </h1>
        </div>
        
        <div className="flex flex-col items-end z-30 mt-1 gap-3">
          
          <div className="flex items-center bg-[#8CC63F] border-[4px] border-[#6A9C2C] rounded-full p-1.5 pr-5 shadow-[0_4px_6px_rgba(0,0,0,0.3)] w-48 md:w-64 lg:w-80">
            <div className="flex-1 h-5 md:h-8 bg-[#2F6A3E] rounded-full border-[3px] border-[#204D2B] shadow-[inset_0_3px_5px_rgba(0,0,0,0.6)] overflow-hidden relative">
              <div
                className="absolute top-0 left-0 h-full bg-[#8CC63F] rounded-full transition-all duration-500 border-r-2 border-[#6A9C2C]"
                style={{ width: `${Math.round(((roundIndex + 1) / totalRounds) * 100)}%` }}
              />
            </div>
            <span className="ml-2 md:ml-3 text-white font-black text-lg md:text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] min-w-[3ch] text-right tracking-wide">
              {roundIndex + 1}/{totalRounds}
            </span>
          </div>

          <div className="bg-[#2d5e3e]/95 backdrop-blur-md px-4 py-1.5 md:px-6 md:py-2 rounded-full border-4 border-[#a4cba9] shadow-[0_4px_0_#1e422b]">
            <span className="text-sm md:text-base font-black text-white font-heading drop-shadow-md uppercase tracking-wider">
              Practice Mode
            </span>
          </div>
        </div>
      </div>

      {/* Sub-level Steps */}
      <div className="relative z-20 flex justify-center flex-wrap gap-2 md:gap-4 mt-2 md:mt-4 px-4">
        {steps.map((step, idx) => {
          const isCurrent = idx === currentStepIndex;
          const isDone = idx < currentStepIndex;
          const label = STEP_LABELS[step].split(". ")[1];

          return (
            <div
              key={step}
              className={cn(
                "px-4 py-1.5 md:px-6 md:py-2 rounded-full font-bold text-xs md:text-sm border-b-4 shadow-md whitespace-nowrap transition-all",
                isCurrent
                  ? "bg-amber-400 border-amber-500 text-amber-950 scale-105"
                  : isDone
                  ? "bg-green-500 border-green-600 text-white"
                  : "bg-gray-200 border-gray-300 text-gray-600"
              )}
            >
              {label}
            </div>
          );
        })}
      </div>
    
      {/* Main Game Content */}
      {/* 👇 Removed pt-20 to let it center naturally, and adjusted the gap */}
      <div className="flex-1 relative flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 pb-6 mt-4 z-10 gap-2 md:gap-4">
        
        {/* NPC Dialogue */}
        <div className="w-full flex justify-center z-30 scale-105 md:scale-110 origin-top mb-2">
          <NPCDialogue
            npc="lolo"
            line={NPC_LINE.fil}
            lineEn={NPC_LINE.en}
            audioUrl="/static/assets/audio/npc/lolo_mod3_basahin.mp3"
            autoPlay={roundIndex === 0 && !npcIntroDone}
            onAudioEnd={handleNpcAudioEnd}
            celebrate={celebrate}
            resetKey={roundIndex}
            moduleNumber={2}
          />
        </div>

        {/* Equation Board */}
        <div
          className="relative w-full max-w-2xl bg-cover bg-center bg-no-repeat rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center border-b-[8px] border-[#5c2e16] h-[200px] md:h-[220px]"
          style={{ backgroundImage: "url('/images/module-bg/m2_w.png')" }}
        >
          <div className="relative z-10 w-full flex items-center justify-center h-full">
            
            {/* Domain Badge */}
            <div className="absolute -top-2 -left-2 md:-top-4 md:-left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border-2 border-[#a4cba9] shadow-md z-20">
              <span className="text-xs font-bold text-[#2d5e3e] uppercase tracking-wide">
                {domainLabel}
              </span>
            </div>

            {/* Content Container */}
            <div className="flex flex-col items-center justify-center gap-3 w-full h-full pt-1">
              {selectedId === null ? (
                <>
                  <div onClickCapture={() => duckBGM(2000)}>
                    <AudioPlayer
                      key={`${currentWord.wordId}-${npcIntroDone}`}
                      audioUrl={currentWord.audioUrl}
                      autoPlay={npcIntroDone}
                      fallbackText={currentWord.word}
                      size="lg"
                      label=""
                      labelEn=""
                    />
                  </div>
                  <BilingualText
                    as="p"
                    fil="Pakinggan muli"
                    en="Tap to hear it again"
                    className="text-center"
                    filClassName="text-lg md:text-xl font-black text-white [-webkit-text-stroke:3px_black] [paint-order:stroke_fill]"
                    enClassName="text-base md:text-lg font-black text-white [-webkit-text-stroke:2px_black] [paint-order:stroke_fill]"
                  />
                </>
              ) : (
                <>
                  {currentWord.imageUrl && !imageFailed && (
                    <img
                      src={currentWord.imageUrl}
                      alt={currentWord.word}
                      onError={() => setImageFailed(true)}
                      className="h-20 w-20 md:h-24 md:w-24 animate-bounce-in rounded-xl border-2 border-white bg-white object-cover drop-shadow-md"
                    />
                  )}
                  <span 
                    className="font-black text-3xl md:text-5xl uppercase tracking-wider text-white"
                    style={{ WebkitTextStroke: "3.5px black", paintOrder: "stroke fill" }}
                  >
                    {currentWord.word}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Options / Choices */}
        <div className="w-full max-w-2xl px-4 md:px-0 mt-2">
          <div className="grid grid-cols-4 gap-3 md:gap-6 w-full">
            {options.map((opt) => {
              const isSelected = selectedId === opt.id;
              const isActuallyCorrect = correctId === opt.id;
              
              const showGreen = isSelected && isActuallyCorrect;
              const showHintGreen = attempts >= HINT_AFTER_ATTEMPTS && isActuallyCorrect;
              const isWrong = isSelected && !isActuallyCorrect;

              let bgImg = "/images/Y_button.png";
              if (showGreen || showHintGreen) bgImg = "/images/G_button.png";
              else if (isWrong) bgImg = "/images/R_button.png";

              return (
                <button
                  key={opt.id}
                  onClick={() => void handleSelect(opt.id)}
                  disabled={isSubmitting || (!!selectedId && !isWrong)}
                  className="relative aspect-square flex items-center justify-center bg-contain bg-center bg-no-repeat transition-transform hover:scale-105 active:scale-95 disabled:hover:scale-100 outline-none focus-visible:ring-4 focus-visible:ring-amber-400 rounded-[20%] overflow-hidden drop-shadow-md"
                  style={{ backgroundImage: `url(${bgImg})` }}
                >
                  <span
                    className="text-2xl md:text-4xl font-black text-white mt-1 md:mt-2 drop-shadow-[0_4px_2px_rgba(0,0,0,0.4)] text-center leading-tight px-2"
                    style={{
                      WebkitTextStroke: "2px #2A1B10",
                      paintOrder: "stroke fill",
                    }}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback Area */}
        <div className="h-10 w-full flex items-center justify-center mt-1">
          {feedback && (
            <div
              className={cn(
                "px-6 py-2 rounded-full font-bold text-white shadow-lg animate-bounce",
                feedback === "correct" ? "bg-green-500" : "bg-red-500"
              )}
            >
              {feedback === "correct" ? "Tama! Magaling!" : "Almost ! Try again."}
            </div>
          )}
          {attempts >= HINT_AFTER_ATTEMPTS && !selectedId && (
            <div className="px-6 py-2 rounded-full font-bold bg-green-500 text-white shadow-lg">
              Hint: It's color Green!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordPracticePage;