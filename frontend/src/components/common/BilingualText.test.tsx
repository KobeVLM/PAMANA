import { describe, it, expect, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { BilingualText } from "./BilingualText"
import { LanguageProvider } from "@/contexts/LanguageContext"

describe("BilingualText", () => {
  beforeEach(() => localStorage.clear())

  it("renders the Filipino line with English underneath", () => {
    render(<BilingualText fil="Pakinggan" en="Listen" />)

    expect(screen.getByText("Pakinggan")).toBeInTheDocument()
    const english = screen.getByText("Listen")
    expect(english).toBeInTheDocument()
    expect(english).toHaveAttribute("lang", "en")
  })

  it("hides the English line when disabled in settings", () => {
    localStorage.setItem("pamana_show_english", "false")
    render(
      <LanguageProvider>
        <BilingualText fil="Pakinggan" en="Listen" />
      </LanguageProvider>
    )

    expect(screen.getByText("Pakinggan")).toBeInTheDocument()
    expect(screen.queryByText("Listen")).not.toBeInTheDocument()
  })

  it("omits the English line when there is nothing to translate", () => {
    render(<BilingualText fil="Pantig" en="" />)

    expect(screen.getByText("Pantig")).toBeInTheDocument()
  })
})
