import { describe, expect, it } from "vitest";

import {
  KES_PER_USDC,
  calculateUsdcDeduction,
  formatKesFromUsdc,
  formatWholeKesFromUsdc,
} from "./currency";

describe("currency helpers", () => {
  it("converts KES amounts into USDC deductions", () => {
    expect(calculateUsdcDeduction("128.84")).toBe(1);
    expect(calculateUsdcDeduction("257.68", KES_PER_USDC)).toBe(2);
  });

  it("does not deduct for invalid or non-positive amounts", () => {
    expect(calculateUsdcDeduction("not-a-number")).toBe(0);
    expect(calculateUsdcDeduction("-1")).toBe(0);
  });

  it("formats wallet balances for display", () => {
    expect(formatKesFromUsdc(2)).toBe("257.68");
    expect(formatWholeKesFromUsdc(2.9, 100)).toBe("290");
  });
});
