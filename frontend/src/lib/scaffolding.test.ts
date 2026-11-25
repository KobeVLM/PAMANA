import { describe, it, expect } from "vitest"
import {
  fadedDistractorId,
  needsClickToConfirm,
  scaffoldGuidance,
  scaffoldStage,
} from "./scaffolding"

describe("scaffoldStage", () => {
  it("maps wrong attempts onto the three documented stages", () => {
    expect(scaffoldStage(0)).toBe(0)
    expect(scaffoldStage(-3)).toBe(0)
    expect(scaffoldStage(1)).toBe(1)
    expect(scaffoldStage(2)).toBe(2)
    expect(scaffoldStage(3)).toBe(3)
    expect(scaffoldStage(12)).toBe(3)
  })

  it("handles a malformed attempt count safely", () => {
    expect(scaffoldStage(Number.NaN)).toBe(0)
  })
})

describe("scaffoldGuidance", () => {
  it("asks for a replay on the first mistake", () => {
    const guidance = scaffoldGuidance(1)
    expect(guidance.replay).toBe(true)
    expect(guidance.message.fil).toMatch(/Pakinggan/)
  })

  it("explains the removed choice on the second mistake", () => {
    const guidance = scaffoldGuidance(2)
    expect(guidance.fadeDistractor).toBe(true)
    expect(guidance.message.en).toMatch(/removed one wrong choice/i)
  })

  it("names the target and asks for confirmation on the third mistake", () => {
    const guidance = scaffoldGuidance(3, "BA")
    expect(guidance.compare).toBe(true)
    expect(guidance.message.fil).toContain("BA")
    expect(needsClickToConfirm(3)).toBe(true)
    expect(needsClickToConfirm(2)).toBe(false)
  })
})

describe("fadedDistractorId", () => {
  const options = [
    { id: "ba" },
    { id: "be" },
    { id: "bi" },
    { id: "bo" },
  ]

  it("fades one wrong option from stage 2 onward", () => {
    expect(fadedDistractorId(1, options, "ba")).toBeNull()
    expect(fadedDistractorId(2, options, "ba")).toBe("be")
    expect(fadedDistractorId(3, options, "ba")).toBe("be")
  })

  it("never fades the correct option or returns one when there is no answer", () => {
    expect(fadedDistractorId(2, options, null)).toBeNull()
    expect(fadedDistractorId(2, [{ id: "ba" }], "ba")).toBeNull()
  })
})
