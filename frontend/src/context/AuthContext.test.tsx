import { Alert } from "react-native";
import { act } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderContext } from "../test/renderContext";
import { AuthContext, AuthProvider } from "./AuthContext";

const response = (body: unknown, ok = true) =>
  ({
    json: vi.fn().mockResolvedValue(body),
    ok,
  }) as unknown as Response;

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("registers a valid user and stores the authenticated session", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      response({
        token: "signup-token",
        user: { email: "new@example.com", id: "user-1", phone: "+254700000000" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    const auth = renderContext(AuthContext, AuthProvider);

    act(() => {
      auth.current.setEmail("new@example.com");
      auth.current.setPhone("+254700000000");
      auth.current.setPassword("password123");
      auth.current.setConfirmPassword("password123");
    });

    let destination: Awaited<ReturnType<typeof auth.current.signup>>;
    await act(async () => {
      destination = await auth.current.signup();
    });

    expect(destination!).toBe("home");
    expect(auth.current.authToken).toBe("signup-token");
    expect(auth.current.authUser?.email).toBe("new@example.com");
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/api/auth/register");
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(request.method).toBe("POST");
    expect(JSON.parse(String(request.body))).toEqual({
      email: "new@example.com",
      password: "password123",
      phone: "+254700000000",
    });
    expect(Alert.alert).toHaveBeenCalledWith("Success", "Account created successfully!");
    auth.unmount();
  });

  it("shows the server message and does not authenticate when signup fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response({ message: "Email is already registered" }, false))
    );
    const auth = renderContext(AuthContext, AuthProvider);

    act(() => {
      auth.current.setEmail("used@example.com");
      auth.current.setPhone("+254700000000");
      auth.current.setPassword("password123");
      auth.current.setConfirmPassword("password123");
    });

    await act(async () => {
      expect(await auth.current.signup()).toBeNull();
    });

    expect(auth.current.authToken).toBeNull();
    expect(Alert.alert).toHaveBeenCalledWith("Signup Failed", "Email is already registered");
    auth.unmount();
  });

  it("routes a login requiring two-factor authentication to verification", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response({ requiresTwoFactor: true, userId: "user-2" }))
    );
    const auth = renderContext(AuthContext, AuthProvider);

    act(() => {
      auth.current.setEmail("secure@example.com");
      auth.current.setPassword("password123");
    });

    await act(async () => {
      expect(await auth.current.login()).toBe("verify_2fa");
    });

    expect(auth.current.pendingUserId).toBe("user-2");
    expect(auth.current.authToken).toBeNull();
    auth.unmount();
  });

  it("reports login errors returned by the server", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response({ message: "Invalid credentials" }, false))
    );
    const auth = renderContext(AuthContext, AuthProvider);

    act(() => {
      auth.current.setEmail("user@example.com");
      auth.current.setPassword("wrong-password");
    });

    await act(async () => {
      expect(await auth.current.login()).toBeNull();
    });

    expect(Alert.alert).toHaveBeenCalledWith("Login Failed", "Invalid credentials");
    expect(auth.current.isProcessing).toBe(false);
    auth.unmount();
  });

  it("verifies a valid two-factor code and clears pending authentication", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          token: "verified-token",
          user: { email: "secure@example.com", id: "user-2" },
        })
      )
    );
    const auth = renderContext(AuthContext, AuthProvider);

    act(() => {
      auth.current.setEmail("secure@example.com");
      auth.current.setPassword("password123");
      auth.current.setTotpCode("123456");
    });

    await act(async () => {
      expect(await auth.current.verifyTwoFactor()).toBe("home");
    });

    expect(auth.current.authToken).toBe("verified-token");
    expect(auth.current.pendingUserId).toBeNull();
    auth.unmount();
  });
});
