import { describe, it, expect, beforeEach, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"
import { LanguageProvider, useLanguage } from "./LanguageContext"

const Probe = () => {
  const { showEnglish, setShowEnglish } = useLanguage()
  return (
    <button onClick={() => setShowEnglish(!showEnglish)}>
      {showEnglish ? "on" : "off"}
    </button>
  )
}

describe("LanguageContext", () => {
  beforeEach(() => localStorage.clear())

  it("defaults to showing English", () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>
    )

    expect(screen.getByRole("button")).toHaveTextContent("on")
  })

  it("persists the toggle and notifies listeners", () => {
    const listener = vi.fn()
    window.addEventListener("pamana_settings_changed", listener)

    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>
    )

    act(() => {
      screen.getByRole("button").click()
    })

    expect(screen.getByRole("button")).toHaveTextContent("off")
    expect(localStorage.getItem("pamana_show_english")).toBe("false")
    expect(listener).toHaveBeenCalled()

    window.removeEventListener("pamana_settings_changed", listener)
  })

  it("restores the stored preference", () => {
    localStorage.setItem("pamana_show_english", "false")

    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>
    )

    expect(screen.getByRole("button")).toHaveTextContent("off")
  })
})
