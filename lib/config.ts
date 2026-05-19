import { Platform } from "react-native";

/** Production API on VPS (also set in eas.json for EAS builds). */
export const PRODUCTION_API_URL = "https://cash-flow.saffron.waw.pl/api";

export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  if (__DEV__) {
    if (Platform.OS === "android") {
      return "http://10.0.2.2:3001/api";
    }
    return "http://localhost:3001/api";
  }
  return PRODUCTION_API_URL.replace(/\/$/, "");
}
