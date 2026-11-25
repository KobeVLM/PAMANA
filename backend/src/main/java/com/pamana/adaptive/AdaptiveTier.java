package com.pamana.adaptive;

/**
 * Difficulty tier used by the adaptive content dispatcher.
 *
 * <p>The code values match the refactoring plan
 * ({@code FOUNDATIONAL / STANDARD / CHALLENGE}); the labels are the Tagalog
 * names shown to learners and evaluators ({@code Madali / Katamtaman / Mahirap}).
 * There is no manual selection: the backend assigns the tier from recent
 * answer accuracy, so no teacher/Klase-style control is reintroduced.
 */
public enum AdaptiveTier {
    FOUNDATIONAL("Madali"),
    STANDARD("Katamtaman"),
    CHALLENGE("Mahirap");

    private final String label;

    AdaptiveTier(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    /** Value stored in {@code answer_events.difficulty_tier}. */
    public String value() {
        return name();
    }
}
