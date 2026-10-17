import { useCallback, useEffect, useState } from "react"

export interface UseAsyncDataResult<T> {
  data: T | null
  error: unknown
  isLoading: boolean
  /** Re-run the loader (wired to the ErrorState retry button). */
  retry: () => void
  /** Optimistically replace the current data. */
  setData: React.Dispatch<React.SetStateAction<T | null>>
}

/**
 * Minimal async data loader with real error surfacing.
 *
 * The loader must be memoized with useCallback by the caller:
 *
 *   const loadSet = useCallback(() => api.get(...).then(r => r.data), [subLevel, setId])
 *   const { data, error, isLoading, retry } = useAsyncData(loadSet)
 *
 * Unlike the old per-page try/catch fallbacks, failures remain visible so the
 * UI can show an ErrorState with retry instead of silently using mock data.
 */
export function useAsyncData<T>(loader: () => Promise<T>): UseAsyncDataResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    loader()
      .then((result) => {
        if (cancelled) return
        setData(result)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setData(null)
        setError(err)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [loader, reloadKey])

  const retry = useCallback(() => {
    setReloadKey((key) => key + 1)
  }, [])

  return { data, error, isLoading, retry, setData }
}
