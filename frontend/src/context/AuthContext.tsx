import React, { createContext, useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";

import { API_BASE_URL } from "../config/api";
import type { AuthDestination, AuthUser } from "../types/models";
import {
  validateEmail,
  validatePassword,
  validatePhone,
  validateTotpCode,
} from "../utils/validation";

type AuthContextValue = {
  authToken: string | null;
  authUser: AuthUser | null;
  confirmPassword: string;
  email: string;
  isProcessing: boolean;
  password: string;
  pendingUserId: string | null;
  phone: string;
  totpCode: string;
  login: () => Promise<AuthDestination | null>;
  logout: () => void;
  setConfirmPassword: React.Dispatch<React.SetStateAction<string>>;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  setPhone: React.Dispatch<React.SetStateAction<string>>;
  setTotpCode: React.Dispatch<React.SetStateAction<string>>;
  signup: () => Promise<AuthDestination | null>;
  verifyTwoFactor: () => Promise<AuthDestination | null>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: React.ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const signup = useCallback(async () => {
    if (!validateEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return null;
    }

    if (!validatePassword(password)) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return null;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return null;
    }

    if (!validatePhone(phone)) {
      Alert.alert("Error", "Please enter a valid phone number");
      return null;
    }

    setIsProcessing(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      setAuthToken(data.token);
      setAuthUser(data.user);
      Alert.alert("Success", "Account created successfully!");
      return "home";
    } catch (error) {
      Alert.alert("Signup Failed", error instanceof Error ? error.message : "Signup failed");
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [confirmPassword, email, password, phone]);

  const login = useCallback(async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return null;
    }

    setIsProcessing(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, totpCode: totpCode || undefined }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (data.requiresTwoFactor) {
        setPendingUserId(data.userId);
        return "verify_2fa";
      }

      setAuthToken(data.token);
      setAuthUser(data.user);
      return "home";
    } catch (error) {
      Alert.alert("Login Failed", error instanceof Error ? error.message : "Login failed");
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [email, password, totpCode]);

  const verifyTwoFactor = useCallback(async () => {
    if (!validateTotpCode(totpCode)) {
      Alert.alert("Error", "Please enter a 6-digit code");
      return null;
    }

    setIsProcessing(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, totpCode }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Verification failed");
      }

      setAuthToken(data.token);
      setAuthUser(data.user);
      setPendingUserId(null);
      return "home";
    } catch (error) {
      Alert.alert(
        "Verification Failed",
        error instanceof Error ? error.message : "Verification failed"
      );
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [email, password, totpCode]);

  const logout = useCallback(() => {
    setAuthToken(null);
    setAuthUser(null);
    setPendingUserId(null);
    setTotpCode("");
  }, []);

  const value = useMemo(
    () => ({
      authToken,
      authUser,
      confirmPassword,
      email,
      isProcessing,
      password,
      pendingUserId,
      phone,
      totpCode,
      login,
      logout,
      setConfirmPassword,
      setEmail,
      setPassword,
      setPhone,
      setTotpCode,
      signup,
      verifyTwoFactor,
    }),
    [
      authToken,
      authUser,
      confirmPassword,
      email,
      isProcessing,
      login,
      logout,
      password,
      pendingUserId,
      phone,
      signup,
      totpCode,
      verifyTwoFactor,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
