import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ShieldCheck } from "lucide-react-native";

import { useAuth } from "../hooks/useAuth";
import { styles } from "../styles/commonStyles";
import { theme } from "../styles/theme";
import type { ScreenProps } from "../types/navigation";

export const VerifyTwoFactorScreen = ({ getFont, navigateTo }: ScreenProps) => {
  const { isProcessing, setTotpCode, totpCode, verifyTwoFactor } = useAuth();

  const handleVerify = async () => {
    const destination = await verifyTwoFactor();

    if (destination) {
      navigateTo(destination);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.flex}
    >
      <ScrollView contentContainerStyle={styles.scrollPadding}>
        <View style={[styles.centered, { marginTop: 60, marginBottom: 40 }]}>
          <View style={[styles.modalIconBg, { backgroundColor: theme.colors.primary }]}>
            <ShieldCheck size={40} color="#FFF" />
          </View>
          <Text
            style={[
              styles.brandText,
              { fontFamily: getFont("Syne_700Bold"), fontSize: 28, marginTop: 16 },
            ]}
          >
            2FA Verification
          </Text>
          <Text
            style={[
              styles.welcomeText,
              { fontFamily: getFont("DMSans_400Regular"), textAlign: "center" },
            ]}
          >
            Enter the 6-digit code from your authenticator app.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={[styles.label, { fontFamily: getFont("DMSans_400Regular") }]}>
            Verification Code
          </Text>
          <View style={styles.inputBox}>
            <TextInput
              style={[
                styles.formInput,
                {
                  fontFamily: getFont("JetBrainsMono_500Medium"),
                  fontSize: 24,
                  textAlign: "center",
                  letterSpacing: 8,
                },
              ]}
              placeholder="000000"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="number-pad"
              maxLength={6}
              value={totpCode}
              onChangeText={setTotpCode}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isProcessing && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={[styles.primaryButtonText, { fontFamily: getFont("DMSans_700Bold") }]}>
                Verify & Login
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginTop: 24, alignItems: "center" }}
            onPress={() => navigateTo("login")}
          >
            <Text
              style={[
                styles.infoSub,
                { fontFamily: getFont("DMSans_500Medium"), color: theme.colors.primary },
              ]}
            >
              Back to Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
