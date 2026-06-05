export type Tab =
  | "home"
  | "wallet"
  | "history"
  | "profile"
  | "mpesa_send"
  | "paybill"
  | "buy_goods"
  | "success"
  | "request"
  | "payment"
  | "pochi"
  | "login"
  | "signup"
  | "verify_2fa";

export type NavigateTo = (tab: Tab) => void;

export type ScreenProps = {
  getFont: (fontFamily: string) => string;
  navigateTo: NavigateTo;
};

export const BOTTOM_NAV_HIDDEN_TABS: Tab[] = [
  "mpesa_send",
  "paybill",
  "buy_goods",
  "request",
  "success",
  "payment",
  "pochi",
  "login",
  "signup",
  "verify_2fa",
];

export const shouldShowBottomNav = (tab: Tab) => !BOTTOM_NAV_HIDDEN_TABS.includes(tab);
