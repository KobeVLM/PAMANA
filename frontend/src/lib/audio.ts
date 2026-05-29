// Global AudioContext singleton
let globalAudioContext: AudioContext | null = null;

export function getAudioContext() {
  if (!globalAudioContext) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    globalAudioContext = new AudioContextClass();
  }
  if (globalAudioContext.state === 'suspended') {
    globalAudioContext.resume().catch(() => {});
  }
  return globalAudioContext;
}

// Unlock audio context on first user interaction
if (typeof window !== 'undefined') {
  const unlock = () => {
    getAudioContext();
    window.removeEventListener('click', unlock);
    window.removeEventListener('touchstart', unlock);
  };
  window.addEventListener('click', unlock);
  window.addEventListener('touchstart', unlock);
}

// Cache for decoded audio buffers
const audioBufferCache = new Map<string, AudioBuffer>();

/**
 * Preloads an audio file into the Web Audio API buffer cache.
 */
export async function preloadAudio(url: string): Promise<AudioBuffer | null> {
  if (audioBufferCache.has(url)) {
    return audioBufferCache.get(url)!;
  }
  try {
    const ctx = getAudioContext();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    audioBufferCache.set(url, audioBuffer);
    return audioBuffer;
  } catch (err) {
    console.warn(`Failed to preload audio: ${url}`, err);
    return null;
  }
}

/**
 * Plays an audio file using Web Audio API. 
 * If it's not preloaded, it will fetch and play it.
 */
export async function playAudio(url: string): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  const buffer = await preloadAudio(url);
  if (!buffer) return;

  try {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch (err) {
    console.warn(`Failed to play audio: ${url}`, err);
  }
}
