import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { useFonts, Syne_700Bold, Syne_600SemiBold } from "@expo-google-fonts/syne";
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from "@expo-google-fonts/dm-sans";
import { JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono";

export const useAppFonts = () => {
  const [fontsLoaded, fontError] = useFonts({
    Syne_700Bold,
    Syne_600SemiBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    JetBrainsMono_500Medium,
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 1500);

    if (fontsLoaded || fontError) {
      setIsReady(true);
      clearTimeout(timer);
    }

    return () => clearTimeout(timer);
  }, [fontsLoaded, fontError]);

  const getFont = (base: string) =>
    fontsLoaded ? base : Platform.OS === "ios" ? "System" : "sans-serif";

  return { getFont, isReady };
};
