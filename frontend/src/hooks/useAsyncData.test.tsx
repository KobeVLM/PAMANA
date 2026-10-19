import { describe, it, expect, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { useAsyncData } from "./useAsyncData"

describe("useAsyncData", () => {
  it("loads data and clears the loading flag", async () => {
    const loader = vi.fn().mockResolvedValue({ value: 42 })
    const { result } = renderHook(() => useAsyncData(loader))

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual({ value: 42 })
    expect(result.current.error).toBeNull()
  })

  it("surfaces errors instead of silently succeeding", async () => {
    const failure = new Error("network down")
    const loader = vi.fn().mockRejectedValue(failure)
    const { result } = renderHook(() => useAsyncData(loader))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBe(failure)
    expect(result.current.data).toBeNull()
  })

  it("retry re-runs the loader and recovers", async () => {
    const loader = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("ok")
    const { result } = renderHook(() => useAsyncData(loader))

    await waitFor(() => expect(result.current.error).toBeTruthy())
    act(() => {
      result.current.retry()
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toBe("ok")
    expect(result.current.error).toBeNull()
    expect(loader).toHaveBeenCalledTimes(2)
  })
})
