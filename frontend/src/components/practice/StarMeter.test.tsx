import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { StarMeter } from "./StarMeter"

describe("StarMeter", () => {
  it("shows no stars when accuracy is null", () => {
    const { container } = render(<StarMeter accuracy={null} />)
    expect(container.querySelectorAll("svg.fill-current")).toHaveLength(0)
    expect(container.firstElementChild).toHaveAttribute(
      "aria-label",
      "Wala pang iskor (No score yet)"
    )
  })

  it("shows no stars for a zero score (bronze tier)", () => {
    const { container } = render(<StarMeter accuracy={0} />)
    expect(container.querySelectorAll("svg.fill-current")).toHaveLength(0)
    expect(container.firstElementChild).toHaveAttribute(
      "aria-label",
      "0% — Tanso (Bronze)"
    )
  })

  it("shows one bronze star for 50%", () => {
    const { container } = render(<StarMeter accuracy={50} />)
    expect(container.querySelectorAll("svg.fill-current")).toHaveLength(1)
    expect(container.firstElementChild).toHaveAttribute(
      "aria-label",
      "50% — Tanso (Bronze)"
    )
  })

  it("shows two silver stars at the 85% threshold", () => {
    const { container } = render(<StarMeter accuracy={85} />)
    expect(container.querySelectorAll("svg.fill-current")).toHaveLength(2)
    expect(container.firstElementChild).toHaveAttribute(
      "aria-label",
      "85% — Pilak (Silver)"
    )
  })

  it("shows three gold stars at the 95% threshold", () => {
    const { container } = render(<StarMeter accuracy={95} />)
    expect(container.querySelectorAll("svg.fill-current")).toHaveLength(3)
    expect(container.firstElementChild).toHaveAttribute(
      "aria-label",
      "95% — Ginto (Gold)"
    )
  })

  it("rounds fractional accuracy in the label", () => {
    const { container } = render(<StarMeter accuracy={84.6} />)
    expect(container.querySelectorAll("svg.fill-current")).toHaveLength(1)
    expect(container.firstElementChild).toHaveAttribute(
      "aria-label",
      "85% — Tanso (Bronze)"
    )
  })
})
