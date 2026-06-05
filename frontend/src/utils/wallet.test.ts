import { describe, expect, it } from "vitest";

import { maskWalletAddress } from "./wallet";

describe("wallet helpers", () => {
  it("masks long wallet addresses", () => {
    expect(maskWalletAddress("0x1234567890abcdef")).toBe("0x1234...cdef");
  });

  it("falls back when no wallet is connected", () => {
    expect(maskWalletAddress()).toBe("Not connected");
    expect(maskWalletAddress("0x123")).toBe("Not connected");
  });
});
