import { describe, expect, it } from "vitest";

import { shouldShowBottomNav } from "./navigation";

describe("bottom navigation visibility", () => {
  it("shows the nav on primary app tabs", () => {
    expect(shouldShowBottomNav("home")).toBe(true);
    expect(shouldShowBottomNav("wallet")).toBe(true);
    expect(shouldShowBottomNav("history")).toBe(true);
    expect(shouldShowBottomNav("profile")).toBe(true);
  });

  it("hides the nav during auth and focused payment flows", () => {
    expect(shouldShowBottomNav("login")).toBe(false);
    expect(shouldShowBottomNav("signup")).toBe(false);
    expect(shouldShowBottomNav("payment")).toBe(false);
    expect(shouldShowBottomNav("mpesa_send")).toBe(false);
    expect(shouldShowBottomNav("success")).toBe(false);
  });
});
