import { vi } from "vitest";

vi.mock("react-native", () => ({
  ActivityIndicator: "ActivityIndicator",
  Alert: {
    alert: vi.fn(),
  },
  Dimensions: {
    get: () => ({ height: 844, width: 390 }),
  },
  KeyboardAvoidingView: "KeyboardAvoidingView",
  Modal: "Modal",
  Platform: {
    OS: "ios",
    select: <T>(values: { default?: T; ios?: T }) => values.ios ?? values.default,
  },
  SafeAreaView: "SafeAreaView",
  ScrollView: "ScrollView",
  StyleSheet: {
    create: <T>(styles: T) => styles,
    flatten: <T>(style: T) => style,
  },
  Text: "Text",
  TextInput: "TextInput",
  TouchableOpacity: "TouchableOpacity",
  View: "View",
}));

vi.mock("lucide-react-native", () => {
  const icon = "Icon";

  return {
    ArrowDownLeft: icon,
    ArrowUpRight: icon,
    Banknote: icon,
    Bell: icon,
    CheckCircle2: icon,
    ChevronLeft: icon,
    ChevronRight: icon,
    Copy: icon,
    FileText: icon,
    Globe: icon,
    Headset: icon,
    History: icon,
    Home: icon,
    Lock: icon,
    LogOut: icon,
    Mail: icon,
    Phone: icon,
    Plus: icon,
    Scan: icon,
    Send: icon,
    Settings: icon,
    ShieldCheck: icon,
    ShoppingBag: icon,
    Smartphone: icon,
    Store: icon,
    User: icon,
    Wallet: icon,
    Zap: icon,
  };
});

vi.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
}));

vi.mock("expo-constants", () => ({
  default: {
    expoConfig: {
      extra: {
        apiUrl: "http://localhost:4000/api",
      },
    },
  },
}));
