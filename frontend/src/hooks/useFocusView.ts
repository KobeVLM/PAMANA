import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "pamana:focus-view"

export interface UseFocusViewResult {
  focusView: boolean
  toggleFocusView: () => void
  setFocusView: (enabled: boolean) => void
}

function readStoredPreference(): boolean {
  if (typeof window === "undefined") return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true"
  } catch {
    return false
  }
}

/**
 * Distraction-free gameplay mode.
 *
 * Adds `pamana-focus` to the document root; CSS then hides only elements
 * explicitly marked `data-decorative`. The progress HUD, feedback and answer
 * controls are never marked, so focus mode cannot hide progress or guidance.
 */
export function useFocusView(): UseFocusViewResult {
  const [focusView, setFocusViewState] = useState(readStoredPreference)

  useEffect(() => {
    if (typeof document === "undefined") return
    const root = document.documentElement
    root.classList.toggle("pamana-focus", focusView)
    return () => {
      root.classList.remove("pamana-focus")
    }
  }, [focusView])

  const setFocusView = useCallback((enabled: boolean) => {
    setFocusViewState(enabled)
    try {
      window.localStorage.setItem(STORAGE_KEY, String(enabled))
    } catch {
      // Private browsing can deny storage; the mode still works this session.
    }
  }, [])

  const toggleFocusView = useCallback(() => {
    setFocusView(!focusView)
  }, [focusView, setFocusView])

  return { focusView, toggleFocusView, setFocusView }
}
