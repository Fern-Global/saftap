import { act } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "../hooks/useAuth";
import { renderContext } from "../test/renderContext";
import { WalletContext, WalletProvider } from "./WalletContext";

vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

const response = (body: unknown, ok = true) =>
  ({
    json: vi.fn().mockResolvedValue(body),
    ok,
  }) as unknown as Response;

describe("WalletProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ authToken: "wallet-token" } as ReturnType<typeof useAuth>);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("funds the wallet and updates the balance returned by the server", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ balanceUsdc: 75 }));
    vi.stubGlobal("fetch", fetchMock);
    const wallet = renderContext(WalletContext, WalletProvider);

    await act(async () => {
      await wallet.current.fundWallet("25");
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/api/wallet/fund");
    expect(fetchMock.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        body: JSON.stringify({ amountUsdc: 25 }),
        method: "POST",
      })
    );
    expect(wallet.current.usdcBalance).toBe(75);
    wallet.unmount();
  });

  it("surfaces wallet funding errors from the server", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response({ error: "Card was declined" }, false))
    );
    const wallet = renderContext(WalletContext, WalletProvider);

    await expect(wallet.current.fundWallet("25")).rejects.toThrow("Card was declined");
    expect(wallet.current.usdcBalance).toBe(0);
    wallet.unmount();
  });

  it("rejects invalid funding amounts before contacting the server", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const wallet = renderContext(WalletContext, WalletProvider);

    await expect(wallet.current.fundWallet("0")).rejects.toThrow(
      "Please enter a valid funding amount."
    );
    expect(fetchMock).not.toHaveBeenCalled();
    wallet.unmount();
  });
});
