import Constants from "expo-constants";

export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ??
  Constants.manifest?.extra?.apiUrl ??
  "http://localhost:4000/api";
