/**
 * Lightweight bilingual strings for PAMANA.
 *
 * Filipino is always shown; English appears underneath for learners who read
 * English but are still getting familiar with Tagalog. Target vocabulary stays
 * Filipino — only instructions, chrome and feedback get an English partner.
 */
export interface Bi {
  fil: string
  en: string
}

export const bi = (fil: string, en: string): Bi => ({ fil, en })

/** Shared chrome, feedback and step names used on more than one screen. */
export const STRINGS = {
  // Navigation
  back: bi('Bumalik', 'Back'),
  backHome: bi('Bumalik sa Home', 'Back to Home'),
  retry: bi('Subukan Muli', 'Try Again'),

  // Header chrome
  score: bi('Iskor', 'Score'),
  progressAria: bi('Progreso ng pagsasanay', 'Practice progress'),

  // Audio controls
  listen: bi('Pakinggan', 'Listen'),
  listenWord: bi('Pakinggan ang salita', 'Listen to the word'),
  listenSentence: bi('Pakinggan ang pangungusap', 'Listen to the sentence'),
  listenSound: bi('Pakinggan ang tunog', 'Listen to the sound'),
  listenConsonant: bi('Pakinggan ang katinig', 'Listen to the consonant'),
  listenVowel: bi('Pakinggan ang patinig', 'Listen to the vowel'),
  listenAgain: bi('Pindutin para marinig ulit', 'Press to hear it again'),

  // Feedback
  correct: bi('Correct! Great job!'),
  tryAgain: bi('Hindi pa tama — subukan ulit!', 'Not quite — try again!'),

  // Step names
  stepListen: bi('Pakinggan', 'Listen'),
  stepBlend: bi('Pagsama ng Tunog', 'Blending Sounds'),
  stepIdentify: bi('Kilalanin', 'Identify'),
  stepRhyme: bi('Tumalinghaga', 'Rhyming'),
  stepRead: bi('Basahin', 'Read'),
  stepUse: bi('Gamitin', 'Use'),

  // Completion screen
  practiceComplete: bi('Pagsasanay Tapos Na!', 'Practice Complete!'),
  playAgain: bi('Maglaro Ulit', 'Play Again'),
  yourScore: bi('Iyong Iskor', 'Your Score'),
  accuracy: bi('Katumpakan', 'Accuracy'),
  moduleComplete: bi('Natapos ang Modyul!', 'Module Complete!'),
} as const

/** Encouragement lines for the completion screen, by accuracy band. */
export const encouragementFor = (percentage: number): Bi => {
  if (percentage === 100) {
    return bi('🌟 Perpekto! Napakahusay mo!', '🌟 Perfect! You did an amazing job!')
  }
  if (percentage >= 75) {
    return bi(
      '🎉 Napakagaling! Kaunting praktis na lang at perpekto na!',
      '🎉 So close to perfect! A little more practice and you’ll get there!'
    )
  }
  return bi(
    '💪 Magaling na simula! Ipagpatuloy ang pagsasanay upang lalong gumaling!',
    '💪 A great start! Keep practicing and you’ll get even better!'
  )
}
