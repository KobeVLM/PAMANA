import React from "react";
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import api from "@/lib/api";
import { TrailMapPage } from "./TrailMapPage";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "learner-123", name: "Juan Learner" },
  }),
}));

vi.mock("@/components/layout/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("TrailMapPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("Test 1: Node displays locked state and triggers lock toast when clicked if isUnlocked: false", async () => {
    const user = userEvent.setup();
    (api.get as unknown as Mock).mockResolvedValueOnce({
      data: [
        { moduleNumber: 1, isUnlocked: true, isComplete: false, accuracy: null },
        { moduleNumber: 2, isUnlocked: false, isComplete: false, accuracy: null },
        { moduleNumber: 3, isUnlocked: false, isComplete: false, accuracy: null },
        { moduleNumber: 4, isUnlocked: false, isComplete: false, accuracy: null },
      ],
    });

    render(<TrailMapPage />);

    // Wait for progress loading to finish
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Module 2" })).toBeInTheDocument();
    });

    const module2Button = screen.getByRole("button", { name: "Module 2" });
    const lockIcon = module2Button.querySelector('img[src="/images/Lock-Module.png"]');
    expect(lockIcon).toBeInTheDocument();
    expect(module2Button).toHaveAttribute("aria-disabled", "true");

    // Click locked Module 2
    await user.click(module2Button);

    // Should display toast notification explaining module is locked
    await waitFor(() => {
      expect(
        screen.getByText("Naka-lock pa ang Module 2. Kumpletuhin muna ang naunang aralin!"),
      ).toBeInTheDocument();
    });

    // Should not navigate
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("Test 2: Node displays completed state (Done-Module.png) only when isComplete: true", async () => {
    (api.get as unknown as Mock).mockResolvedValueOnce({
      data: [
        { moduleNumber: 1, isUnlocked: true, isComplete: true, accuracy: 95 },
        { moduleNumber: 2, isUnlocked: true, isComplete: false, accuracy: null },
        { moduleNumber: 3, isUnlocked: false, isComplete: false, accuracy: null },
        { moduleNumber: 4, isUnlocked: false, isComplete: false, accuracy: null },
      ],
    });

    render(<TrailMapPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Module 1" })).toBeInTheDocument();
    });

    const module1Button = screen.getByRole("button", { name: "Module 1" });
    const module2Button = screen.getByRole("button", { name: "Module 2" });

    // Module 1 isComplete: true -> should have Done-Module.png
    const doneIcon = module1Button.querySelector('img[src="/images/Done-Module.png"]');
    expect(doneIcon).toBeInTheDocument();

    // Module 2 isComplete: false -> should NOT have Done-Module.png
    const module2DoneIcon = module2Button.querySelector('img[src="/images/Done-Module.png"]');
    expect(module2DoneIcon).toBeNull();

    // Total progress should reflect 1 out of 4 (25%)
    expect(screen.getByText("25%")).toBeInTheDocument();
  });

  it("Test 3: If Module 4 is unlocked but Module 3 has isComplete: false, Module 3 is NOT marked as complete", async () => {
    (api.get as unknown as Mock).mockResolvedValueOnce({
      data: [
        { moduleNumber: 1, isUnlocked: true, isComplete: true, accuracy: 90 },
        { moduleNumber: 2, isUnlocked: true, isComplete: true, accuracy: 85 },
        { moduleNumber: 3, isUnlocked: true, isComplete: false, accuracy: null },
        { moduleNumber: 4, isUnlocked: true, isComplete: false, accuracy: null },
      ],
    });

    render(<TrailMapPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Module 3" })).toBeInTheDocument();
    });

    const module3Button = screen.getByRole("button", { name: "Module 3" });
    // Module 3 must NOT have Done-Module.png even though Module 4 is unlocked
    const module3DoneIcon = module3Button.querySelector('img[src="/images/Done-Module.png"]');
    expect(module3DoneIcon).toBeNull();

    // Overall percent should be 50% (modules 1 and 2 complete, modules 3 and 4 incomplete)
    // In the old buggy implementation, Module 3 would have been counted as complete (75%)
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.queryByText("75%")).toBeNull();
  });

  it("navigates to module page when clicking an unlocked and incomplete module", async () => {
    const user = userEvent.setup();
    (api.get as unknown as Mock).mockResolvedValueOnce({
      data: [
        { moduleNumber: 1, isUnlocked: true, isComplete: true, accuracy: 90 },
        { moduleNumber: 2, isUnlocked: true, isComplete: false, accuracy: null },
        { moduleNumber: 3, isUnlocked: false, isComplete: false, accuracy: null },
        { moduleNumber: 4, isUnlocked: false, isComplete: false, accuracy: null },
      ],
    });

    render(<TrailMapPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Module 2" })).toBeInTheDocument();
    });

    const module2Button = screen.getByRole("button", { name: "Module 2" });
    await user.click(module2Button);

    expect(mockNavigate).toHaveBeenCalledWith("/modules/2");
  });
});
