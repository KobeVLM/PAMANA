package com.pamana.adaptive;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Random;

/**
 * Shared source of truth for syllable targets.
 *
 * <p>The old generator kept these arrays inside {@code SyllableService}. The
 * Content Bank seeder and the runtime dispatcher both need the same target for
 * a given {@code (subLevel, setId)}, so the derivation lives here once.
 */
public final class SyllableContent {

    public static final String[] CONSONANTS = {
            "b", "d", "g", "h", "k", "l", "m", "n", "ng", "p", "r", "s", "t", "w", "y"
    };
    public static final String[] VOWELS = { "a", "e", "i", "o", "u" };

    private static final String[] KILALANIN_WORDS = { "mata", "bahay", "tatay", "nanay", "bibig" };
    private static final String[] KILALANIN_SYLLABLES = { "ma", "ba", "ta", "na", "bi" };
    private static final String[] RHYMING_WORDS = { "mata", "lola", "lolo", "tenga", "kuya" };
    private static final String[] RHYMING_SYLLABLES = { "ta", "la", "lo", "nga", "ya" };

    private SyllableContent() {
    }

    public static String vowel(int setId) {
        return VOWELS[(setId - 1) % VOWELS.length];
    }

    /** Consonants in the exact order the legacy generator shuffled them. */
    public static List<String> shuffledConsonants(int setId, String subLevel) {
        List<String> consonants = new ArrayList<>(Arrays.asList(CONSONANTS));
        Collections.shuffle(consonants, new Random(setId + subLevel.hashCode()));
        return consonants;
    }

    public static boolean isWordContext(String subLevel) {
        return "kilalanin".equals(subLevel) || "rhyming".equals(subLevel);
    }

    public static String contextWord(String subLevel, int setId) {
        int index = (setId - 1) % KILALANIN_WORDS.length;
        return "rhyming".equals(subLevel) ? RHYMING_WORDS[index] : KILALANIN_WORDS[index];
    }

    public static String wordTargetSyllable(String subLevel, int setId) {
        int index = (setId - 1) % KILALANIN_SYLLABLES.length;
        return "rhyming".equals(subLevel)
                ? RHYMING_SYLLABLES[index]
                : KILALANIN_SYLLABLES[index];
    }

    /** Target syllable for any sublevel, matching the legacy generator. */
    public static String targetSyllable(String subLevel, int setId) {
        if (isWordContext(subLevel)) {
            return wordTargetSyllable(subLevel, setId);
        }
        return shuffledConsonants(setId, subLevel).get(0) + vowel(setId);
    }
}
