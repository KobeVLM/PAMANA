import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useAudio } from "@/contexts/AudioContext";
import { PracticeCompletion } from "@/components/practice/PracticeCompletion";
import {
  AccuracyChip,
  PracticeModeBadge,
  PracticeStepRail,
  ProgressPill,
} from "@/components/practice/PracticeHud";
import { GestureDemo } from "@/components/learning/GestureDemo";
import { ScaffoldMessage } from "@/components/learning/ScaffoldMessage";
import { NPCDialogue } from "@/components/game/NPCDialogue";
import { AudioPlayer } from "@/components/game/AudioPlayer";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { BilingualText } from "@/components/common/BilingualText";
import { useAudioElement, useSfx } from "@/hooks/useGameAudio";
import { usePracticeAnswerProgress } from "@/hooks/usePracticeAnswerProgress";
import { useFocusView } from "@/hooks/useFocusView";
import { FocusViewToggle } from "@/components/learning/FocusViewToggle";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { bi } from "@/lib/i18n";
import { fadedDistractorId, scaffoldStage } from "@/lib/scaffolding";
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
const GESTURE_LABEL = bi(
  'Pindutin ang tamang sagot',
  'Tap the correct answer'
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
  const answerProgress = usePracticeAnswerProgress(totalRounds, {
    itemType: "vocabulary_word",
    moduleNumber: 2,
  });
  const { recordAnswer, reset: resetAnswerProgress } = answerProgress;

  const { focusView, toggleFocusView } = useFocusView();
  const [showGesture, setShowGesture] = useState(true);
  const finishGesture = useCallback(() => setShowGesture(false), []);

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
        setShowGesture(true);
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
      setShowGesture(true);
    } else {
      setIsComplete(true);
    }
  }, [roundIndex, roundWords]);

  const submitAnswer = useCallback(
    async (optionId: string, guided = false) => {
      if (!currentWord || !correctId || (selectedId && !guided) || isSubmitting) return;

      duckBGM(2000);
      // Guided confirmation after stage 3 counts as a solved item; the wrong
      // attempts that led there are already in the answer log.
      const isCorrect = guided || optionId === correctId;
      const newAttempts = isCorrect ? attempts : attempts + 1;
      const attemptStage = scaffoldStage(newAttempts);
      recordAnswer(currentWord.wordId, isCorrect, "basahin");

      setSelectedId(optionId);
      setFeedback(isCorrect ? "correct" : "incorrect");

      if (isCorrect) {
        setCelebrate((c) => c + 1);
        playTarget();
      } else {
        setAttempts(newAttempts);
        playWrong();
        // Stage 1 replays the target word alongside the encouragement.
        if (attemptStage === 1) playTarget();
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
    [currentWord, correctId, selectedId, isSubmitting, attempts, advance, playTarget, playWrong, duckBGM, recordAnswer]
  );

  const handleSelect = useCallback(
    (optionId: string) => submitAnswer(optionId),
    [submitAnswer]
  );

  const handleGuidedConfirm = useCallback(() => {
    if (correctId) void submitAnswer(correctId, true);
  }, [correctId, submitAnswer]);

  const handlePlayAgain = useCallback(() => {
    const picked = pickRoundWords(roundWords);
    setRoundWords(picked);
    setRoundIndex(0);
    setCurrentWord(picked[0] ?? null);
    setShowGesture(true);
    resetAnswerProgress();
    setIsComplete(false);
    if (bgmRef.current) bgmRef.current.play()?.catch(() => {});
  }, [roundWords, resetAnswerProgress]);

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
    const accuracy = answerProgress.accuracy ?? 0;
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

  const stage = scaffoldStage(attempts);
  const fadedId = fadedDistractorId(stage, options, correctId);

  return (
    <div
      className="relative h-screen w-full bg-cover bg-center flex flex-col font-sans overflow-hidden"
      style={{ backgroundImage: "url('/images/module-bg/m-Garden.jpg')" }}
    >
      <div data-decorative className="absolute inset-0 bg-black/10 z-0 pointer-events-none" />

      {/* Top Bar: title on its own row, HUD centred below it. */}
      <div className="relative w-full z-20 flex flex-col items-center p-4 md:p-6">
        <div className="relative w-full flex items-start justify-between min-h-[72px] md:min-h-[96px]">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black px-4 py-2 rounded-full border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 transition-all shadow-lg z-30"
          >
            <ArrowLeft className="w-5 h-5 stroke-[3]" />
            Bumalik
          </button>

          <div data-decorative className="absolute left-1/2 -translate-x-1/2 top-0 md:top-2 pointer-events-none z-20 flex flex-col items-center justify-center w-full leading-tight">
            <h1
              className="text-3xl md:text-5xl lg:text-6xl font-black text-center tracking-wide"
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
              className="text-2xl md:text-4xl lg:text-5xl font-black text-center tracking-wide mt-1 md:mt-2"
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
        </div>

        {/* HUD stays visible in Focus View; Focus View lives by the mascot. */}
        <div className="relative z-30 mt-2 flex flex-wrap items-center justify-center gap-2 md:gap-3">
          <ProgressPill
            value={answerProgress.progress}
            label={`${answerProgress.correctItems}/${totalRounds}`}
          />
          <AccuracyChip accuracy={answerProgress.accuracy} />
          <PracticeModeBadge />
        </div>
      </div>

      {/* Sub-level Steps are decorative in Focus View; the HUD stays visible. */}
      <div data-decorative>
        <PracticeStepRail
          className="mt-1 md:mt-2"
          steps={steps.map((step, idx) => ({
            label: STEP_LABELS[step].split(". ")[1],
            state: idx === currentStepIndex ? "current" : idx < currentStepIndex ? "done" : "pending",
          }))}
        />
      </div>
    
      {/* Main Game Content */}
      {/* 👇 Removed pt-20 to let it center naturally, and adjusted the gap */}
      <div className="flex-1 relative flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 pb-3 mt-1 md:mt-2 z-10 gap-2 md:gap-3">
        
        {/* NPC Dialogue */}
        <div className="w-full flex justify-center z-30 scale-105 md:scale-110 origin-top mb-2">
          <div className="relative inline-flex">
            <FocusViewToggle
              enabled={focusView}
              onToggle={toggleFocusView}
              className="absolute -left-3 -top-3 z-30 px-2 py-1 text-[10px] md:text-xs"
            />
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
        <div className="relative w-full max-w-2xl px-4 md:px-0 mt-2">
          {showGesture && (
            <GestureDemo label={GESTURE_LABEL} onComplete={finishGesture} />
          )}
          <div className="grid grid-cols-4 gap-3 md:gap-6 w-full">
            {options.map((opt) => {
              const isSelected = selectedId === opt.id;
              const isActuallyCorrect = correctId === opt.id;
              const isFaded = fadedId === opt.id;

              const showGreen = isSelected && isActuallyCorrect;
              // Stage 3 reveals the correct answer for comparison.
              const showHintGreen = stage >= 3 && isActuallyCorrect;
              const isWrong = isSelected && !isActuallyCorrect;

              let bgImg = "/images/Y_button.png";
              if (showGreen || showHintGreen) bgImg = "/images/G_button.png";
              else if (isWrong) bgImg = "/images/R_button.png";

              return (
                <button
                  key={opt.id}
                  aria-label={isFaded ? `${opt.label} (tinanggal)` : opt.label}
                  onClick={() => void handleSelect(opt.id)}
                  disabled={
                    showGesture ||
                    isSubmitting ||
                    isFaded ||
                    (!!selectedId && !isWrong)
                  }
                  className={cn(
                    "relative aspect-square flex items-center justify-center bg-contain bg-center bg-no-repeat transition-transform hover:scale-105 active:scale-95 disabled:hover:scale-100 outline-none focus-visible:ring-4 focus-visible:ring-amber-400 rounded-[20%] overflow-hidden drop-shadow-md",
                    isFaded && "opacity-25 grayscale"
                  )}
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

        {/* Feedback Area: progressive scaffolding instead of a generic retry */}
        <div className="w-full flex items-center justify-center mt-1">
          {feedback === "correct" && (
            <div className="px-6 py-2 rounded-full font-bold text-white shadow-lg animate-bounce bg-green-500">
              Tama! Magaling!
            </div>
          )}
          <ScaffoldMessage
            stage={stage}
            target={currentWord.word.toUpperCase()}
            onReplay={playTarget}
            onConfirm={handleGuidedConfirm}
          />
        </div>
      </div>
    </div>
  );
};

export default WordPracticePage;