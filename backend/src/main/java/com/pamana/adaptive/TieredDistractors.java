package com.pamana.adaptive;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

/**
 * Deterministic distractor rules for the three adaptive tiers.
 *
 * <p>Rules follow the validation plan:
 * <ul>
 *   <li>FOUNDATIONAL — distractors are clearly different (different initial
 *       consonants and vowels for syllables, different initial letters for
 *       words), so beginners can eliminate them by sight or sound.</li>
 *   <li>STANDARD — the legacy pools: same vowel with other consonants, or
 *       same-domain words in ordinal order.</li>
 *   <li>CHALLENGE — minimal pairs and visually/similar-sounding words, plus
 *       multi-syllable word context for the word-context sublevels.</li>
 * </ul>
 *
 * <p>Every rule is a pure function of the item, so the Content Bank can be
 * seeded once and reused without per-request randomness.
 */
public final class TieredDistractors {

    public static final int OPTION_COUNT = 3;
    public static final String ACTIVITY_VOCABULARY = "vocabulary";
    public static final String ACTIVITY_SYLLABLE = "syllable";

    private static final String[] CLOSE_CONSONANTS = {
            // b d g h k l m n ng p r s t w y  (index order of SyllableContent.CONSONANTS)
            "p,d,g",  // b
            "t,b,n",  // d
            "k,b,d",  // g
            "k,g,b",  // h
            "g,t,p",  // k
            "r,n,d",  // l
            "n,b,p",  // m
            "m,l,d",  // n
            "n,k,g",  // ng
            "b,k,t",  // p
            "l,d,n",  // r
            "t,d,n",  // s
            "d,p,k",  // t
            "b,k,p",  // w
            "l,n,d"   // y
    };

    private TieredDistractors() {
    }

    // ── Syllables ───────────────────────────────────────────────────────────

    public static List<String> forSyllable(String subLevel, int setId, AdaptiveTier tier) {
        String target = SyllableContent.targetSyllable(subLevel, setId);
        return switch (tier) {
            case FOUNDATIONAL -> foundationalSyllables(target);
            case CHALLENGE -> challengeSyllables(subLevel, target);
            default -> standardSyllables(subLevel, setId, target);
        };
    }

    /** Legacy pools: STANDARD tier must preserve existing gameplay exactly. */
    private static List<String> standardSyllables(String subLevel, int setId, String target) {
        String vowel = target.substring(target.length() - 1);
        List<String> result = new ArrayList<>();

        if ("pagsama".equals(subLevel)) {
            for (String candidate : SyllableContent.VOWELS) {
                if (result.size() >= OPTION_COUNT) {
                    break;
                }
                if (!candidate.equals(vowel)) {
                    result.add(SyllableContent.shuffledConsonants(setId, subLevel).get(0) + candidate);
                }
            }
        } else if ("pakinggan".equals(subLevel)) {
            List<String> consonants = SyllableContent.shuffledConsonants(setId, subLevel);
            for (int i = 1; i <= OPTION_COUNT; i++) {
                result.add(consonants.get(i) + vowel);
            }
        } else {
            // kilalanin / rhyming: other consonants with the target vowel.
            List<String> consonants = SyllableContent.shuffledConsonants(setId, subLevel);
            for (String consonant : consonants) {
                if (result.size() >= OPTION_COUNT) {
                    break;
                }
                String option = consonant + vowel;
                if (!option.equalsIgnoreCase(target)) {
                    result.add(option);
                }
            }
        }
        return result;
    }

    /** Completely different initial consonants AND vowels — easiest tier. */
    private static List<String> foundationalSyllables(String target) {
        String targetConsonant = target.substring(0, target.length() - 1);
        String targetVowel = target.substring(target.length() - 1);
        int consonantIndex = indexOf(SyllableContent.CONSONANTS, targetConsonant);
        int vowelIndex = indexOf(SyllableContent.VOWELS, targetVowel);

        List<String> result = new ArrayList<>();
        for (int i = 0; i < OPTION_COUNT; i++) {
            String consonant = SyllableContent.CONSONANTS[(consonantIndex + 5 + i * 4) % SyllableContent.CONSONANTS.length];
            String vowel = SyllableContent.VOWELS[(vowelIndex + 2 + i) % SyllableContent.VOWELS.length];
            result.add(consonant + vowel);
        }
        return result;
    }

    /** Same vowel, minimal-pair consonants (or a close word context) — hardest tier. */
    private static List<String> challengeSyllables(String subLevel, String target) {
        String targetConsonant = target.substring(0, target.length() - 1);
        String targetVowel = target.substring(target.length() - 1);
        int consonantIndex = indexOf(SyllableContent.CONSONANTS, targetConsonant);

        List<String> result = new ArrayList<>();
        if (consonantIndex >= 0) {
            for (String consonant : CLOSE_CONSONANTS[consonantIndex].split(",")) {
                if (result.size() >= OPTION_COUNT) {
                    break;
                }
                result.add(consonant + targetVowel);
            }
        }

        // Word-context sublevels also borrow a close syllable from the other
        // context pool, matching the "multi-syllable context" challenge rule.
        if (SyllableContent.isWordContext(subLevel) && result.size() < OPTION_COUNT) {
            for (String candidate : new String[] { "ma", "ba", "ta", "na", "bi", "la", "lo", "nga", "ya" }) {
                if (result.size() >= OPTION_COUNT) {
                    break;
                }
                if (!candidate.equalsIgnoreCase(target) && !result.contains(candidate)) {
                    result.add(candidate);
                }
            }
        }
        return result;
    }

    // ── Vocabulary ──────────────────────────────────────────────────────────

    public static List<String> forVocabulary(String word, List<String> domainWords, AdaptiveTier tier) {
        String target = normalize(word);
        List<String> others = new ArrayList<>();
        for (String candidate : domainWords) {
            String normalized = normalize(candidate);
            if (!normalized.equals(target) && !others.contains(normalized)) {
                others.add(normalized);
            }
        }

        return switch (tier) {
            case FOUNDATIONAL -> differentInitialWords(target, others);
            case CHALLENGE -> similarWords(target, others);
            default -> others.subList(0, Math.min(OPTION_COUNT, others.size()));
        };
    }

    /**
     * Words with a different initial letter and the fewest shared letters are
     * the easiest visual discrimination for a beginner.
     */
    private static List<String> differentInitialWords(String target, List<String> others) {
        char initial = target.charAt(0);
        List<String> distinct = new ArrayList<>();
        List<String> sameInitial = new ArrayList<>();
        for (String word : others) {
            if (word.charAt(0) == initial) {
                sameInitial.add(word);
            } else {
                distinct.add(word);
            }
        }
        distinct.addAll(sameInitial);
        distinct.sort(Comparator
                .comparingInt((String word) -> sharedLetters(target, word))
                .thenComparingInt(word -> -Math.abs(word.length() - target.length())));
        return distinct.subList(0, Math.min(OPTION_COUNT, distinct.size()));
    }

    /** Shared prefixes and letters make the closest-looking words the hardest. */
    private static List<String> similarWords(String target, List<String> others) {
        List<String> ranked = new ArrayList<>(others);
        ranked.sort(Comparator
                .comparingInt((String word) -> -commonPrefix(target, word))
                .thenComparingInt(word -> -sharedLetters(target, word))
                .thenComparingInt(word -> Math.abs(word.length() - target.length())));
        return ranked.subList(0, Math.min(OPTION_COUNT, ranked.size()));
    }

    private static int commonPrefix(String a, String b) {
        int count = 0;
        while (count < a.length() && count < b.length() && a.charAt(count) == b.charAt(count)) {
            count++;
        }
        return count;
    }

    private static int sharedLetters(String a, String b) {
        boolean[] seen = new boolean[26];
        for (int i = 0; i < b.length(); i++) {
            int index = b.charAt(i) - 'a';
            if (index >= 0 && index < seen.length) {
                seen[index] = true;
            }
        }
        int count = 0;
        for (int i = 0; i < a.length(); i++) {
            int index = a.charAt(i) - 'a';
            if (index >= 0 && index < seen.length && seen[index]) {
                count++;
            }
        }
        return count;
    }

    private static String normalize(String value) {
        return value.toLowerCase(Locale.ROOT);
    }

    private static int indexOf(String[] values, String target) {
        for (int i = 0; i < values.length; i++) {
            if (values[i].equals(target)) {
                return i;
            }
        }
        return -1;
    }
}
