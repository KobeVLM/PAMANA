import { describe, it, expect, beforeEach } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { useFocusView } from "./useFocusView"

const STORAGE_KEY = "pamana:focus-view"

describe("useFocusView", () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.classList.remove("pamana-focus")
  })

  it("starts off and marks the document root when enabled", () => {
    const { result, unmount } = renderHook(() => useFocusView())
    expect(result.current.focusView).toBe(false)
    expect(document.documentElement).not.toHaveClass("pamana-focus")

    act(() => result.current.toggleFocusView())
    expect(result.current.focusView).toBe(true)
    expect(document.documentElement).toHaveClass("pamana-focus")
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("true")

    unmount()
    expect(document.documentElement).not.toHaveClass("pamana-focus")
  })

  it("restores a saved preference and can turn it off again", () => {
    window.localStorage.setItem(STORAGE_KEY, "true")
    const { result } = renderHook(() => useFocusView())

    expect(result.current.focusView).toBe(true)
    expect(document.documentElement).toHaveClass("pamana-focus")

    act(() => result.current.setFocusView(false))
    expect(result.current.focusView).toBe(false)
    expect(document.documentElement).not.toHaveClass("pamana-focus")
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("false")
  })
})
