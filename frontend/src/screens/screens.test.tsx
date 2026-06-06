import { Alert } from "react-native";
import { act, create, type ReactTestInstance } from "react-test-renderer";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "../hooks/useAuth";
import { usePayments } from "../hooks/usePayments";
import { useWallet } from "../hooks/useWallet";
import { HomeScreen } from "./HomeScreen";
import { LoginScreen } from "./LoginScreen";
import { MpesaSendScreen } from "./MpesaSendScreen";
import { PaymentScreen } from "./PaymentScreen";
import { SignupScreen } from "./SignupScreen";
import { WalletScreen } from "./WalletScreen";

vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../hooks/usePayments", () => ({
  usePayments: vi.fn(),
}));

vi.mock("../hooks/useWallet", () => ({
  useWallet: vi.fn(),
}));

const getFont = (font: string) => font;

const nodeText = (node: ReactTestInstance | string | number): string => {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  return node.children.map(nodeText).join("");
};

const press = async (root: ReactTestInstance, label: string) => {
  const button = root
    .findAllByType("TouchableOpacity" as unknown as React.ElementType)
    .find((candidate) => nodeText(candidate).includes(label));

  if (!button?.props.onPress) {
    throw new Error(`Could not find enabled button "${label}"`);
  }

  await act(async () => {
    await button.props.onPress();
  });
};

describe("screen interactions", () => {
  const authDefaults = {
    authUser: { email: "user@example.com" },
    confirmPassword: "",
    email: "",
    isProcessing: false,
    login: vi.fn(),
    logout: vi.fn(),
    password: "",
    phone: "",
    setConfirmPassword: vi.fn(),
    setEmail: vi.fn(),
    setPassword: vi.fn(),
    setPhone: vi.fn(),
    signup: vi.fn(),
  };
  const paymentDefaults = {
    amount: "",
    isProcessing: false,
    phoneNumber: "",
    processPayment: vi.fn(),
    setAmount: vi.fn(),
    setPhoneNumber: vi.fn(),
    transactions: [],
  };
  const walletDefaults = {
    fundWallet: vi.fn(),
    marketRate: 100,
    usdcBalance: 20,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue(authDefaults as unknown as ReturnType<typeof useAuth>);
    vi.mocked(usePayments).mockReturnValue(
      paymentDefaults as unknown as ReturnType<typeof usePayments>
    );
    vi.mocked(useWallet).mockReturnValue(walletDefaults as unknown as ReturnType<typeof useWallet>);
  });

  it("navigates to the destination returned by login", async () => {
    const navigateTo = vi.fn();
    const login = vi.fn().mockResolvedValue("verify_2fa");
    vi.mocked(useAuth).mockReturnValue({
      ...authDefaults,
      login,
    } as unknown as ReturnType<typeof useAuth>);
    const screen = create(<LoginScreen getFont={getFont} navigateTo={navigateTo} />);

    await press(screen.root, "Sign In");

    expect(login).toHaveBeenCalledOnce();
    expect(navigateTo).toHaveBeenCalledWith("verify_2fa");
  });

  it("stays on signup when registration fails", async () => {
    const navigateTo = vi.fn();
    const signup = vi.fn().mockResolvedValue(null);
    vi.mocked(useAuth).mockReturnValue({
      ...authDefaults,
      signup,
    } as unknown as ReturnType<typeof useAuth>);
    const screen = create(<SignupScreen getFont={getFont} navigateTo={navigateTo} />);

    await press(screen.root, "Sign Up");

    expect(signup).toHaveBeenCalledOnce();
    expect(navigateTo).not.toHaveBeenCalled();
  });

  it("opens top-up and payment destinations from the home screen", async () => {
    const navigateTo = vi.fn();
    const screen = create(<HomeScreen getFont={getFont} navigateTo={navigateTo} />);

    await press(screen.root, "Top Up");
    await press(screen.root, "Pay Bill");
    await press(screen.root, "See All");

    expect(navigateTo).toHaveBeenNthCalledWith(1, "wallet");
    expect(navigateTo).toHaveBeenNthCalledWith(2, "paybill");
    expect(navigateTo).toHaveBeenNthCalledWith(3, "history");
  });

  it("opens each payment type from the payment screen", async () => {
    const navigateTo = vi.fn();
    const screen = create(<PaymentScreen getFont={getFont} navigateTo={navigateTo} />);

    await press(screen.root, "Send to M-Pesa");
    await press(screen.root, "Pay Bill");
    await press(screen.root, "Buy Goods");
    await press(screen.root, "Request");

    expect(navigateTo.mock.calls).toEqual([
      ["mpesa_send"],
      ["paybill"],
      ["buy_goods"],
      ["request"],
    ]);
  });

  it("passes the home navigation callback into payment processing", async () => {
    const navigateTo = vi.fn();
    const processPayment = vi.fn(async (onComplete: () => void) => onComplete());
    vi.mocked(usePayments).mockReturnValue({
      ...paymentDefaults,
      amount: "500",
      phoneNumber: "0712345678",
      processPayment,
    } as unknown as ReturnType<typeof usePayments>);
    const screen = create(<MpesaSendScreen getFont={getFont} navigateTo={navigateTo} />);

    await press(screen.root, "Make Payment");

    expect(processPayment).toHaveBeenCalledOnce();
    expect(navigateTo).toHaveBeenCalledWith("home");
  });

  it("navigates to success after a wallet top-up", async () => {
    const navigateTo = vi.fn();
    const fundWallet = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useWallet).mockReturnValue({
      ...walletDefaults,
      fundWallet,
    } as unknown as ReturnType<typeof useWallet>);
    const screen = create(<WalletScreen getFont={getFont} navigateTo={navigateTo} />);
    const amountInput = screen.root.findByType("TextInput" as unknown as React.ElementType);

    act(() => {
      amountInput.props.onChangeText("50");
    });
    await press(screen.root, "Confirm Deposit");

    expect(fundWallet).toHaveBeenCalledWith("50");
    expect(navigateTo).toHaveBeenCalledWith("success");
  });

  it("shows a funding error and does not navigate", async () => {
    const navigateTo = vi.fn();
    const fundWallet = vi.fn().mockRejectedValue(new Error("Card was declined"));
    vi.mocked(useWallet).mockReturnValue({
      ...walletDefaults,
      fundWallet,
    } as unknown as ReturnType<typeof useWallet>);
    const screen = create(<WalletScreen getFont={getFont} navigateTo={navigateTo} />);
    const amountInput = screen.root.findByType("TextInput" as unknown as React.ElementType);

    act(() => {
      amountInput.props.onChangeText("50");
    });
    await press(screen.root, "Confirm Deposit");

    expect(Alert.alert).toHaveBeenCalledWith("Funding Failed", "Card was declined");
    expect(navigateTo).not.toHaveBeenCalled();
  });
});
