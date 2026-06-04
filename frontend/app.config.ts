import "dotenv/config";
import type { ConfigContext, ExpoConfig } from "@expo/config";

const apiUrl =
  process.env.API_BASE_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://saftap-backend.up.railway.app"
    : "http://localhost:4000/api");

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? "SafTap",
  slug: config.slug ?? "saftap",
  extra: {
    ...config.extra,
    apiUrl,
  },
  plugins: [...(config.plugins ?? []), "expo-camera", "expo-secure-store", "expo-barcode-scanner"],
});
