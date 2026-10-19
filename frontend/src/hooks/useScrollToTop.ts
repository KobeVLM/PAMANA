import { useEffect } from 'react'

/**
 * Scrolls the app's main scroll container back to the top whenever `key`
 * changes (next question, next set, next step).
 */
export function useScrollToTop(key: unknown) {
  useEffect(() => {
    document.getElementById('main-content')?.scrollTo({ top: 0 })
  }, [key])
}
