import type { ConfigContext, ExpoConfig } from "@expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? "SafTap",
  slug: config.slug ?? "saftap",
  extra: {
    ...config.extra,
    apiUrl:
      process.env.NODE_ENV === "production"
        ? "https://saftap-backend.up.railway.app"
        : "http://localhost:3000",
  },
  plugins: [...(config.plugins ?? []), "expo-camera", "expo-secure-store", "expo-barcode-scanner"],
});
