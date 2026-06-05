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
import { Lock, Mail } from "lucide-react-native";

import { useAuth } from "../hooks/useAuth";
import { styles } from "../styles/commonStyles";
import { theme } from "../styles/theme";
import type { ScreenProps } from "../types/navigation";

export const LoginScreen = ({ getFont, navigateTo }: ScreenProps) => {
  const { email, isProcessing, login, password, setEmail, setPassword } = useAuth();

  const handleLogin = async () => {
    const destination = await login();

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
            <Lock size={40} color="#FFF" />
          </View>
          <Text
            style={[
              styles.brandText,
              { fontFamily: getFont("Syne_700Bold"), fontSize: 32, marginTop: 16 },
            ]}
          >
            SafTap
          </Text>
          <Text style={[styles.welcomeText, { fontFamily: getFont("DMSans_400Regular") }]}>
            Secure your travel funds
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={[styles.label, { fontFamily: getFont("DMSans_400Regular") }]}>
            Email Address
          </Text>
          <View style={styles.inputBox}>
            <Mail size={20} color={theme.colors.textSecondary} style={{ marginRight: 12 }} />
            <TextInput
              style={[styles.formInput, { fontFamily: getFont("DMSans_400Regular"), flex: 1 }]}
              placeholder="name@example.com"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Text style={[styles.label, { fontFamily: getFont("DMSans_400Regular"), marginTop: 24 }]}>
            Password
          </Text>
          <View style={styles.inputBox}>
            <Lock size={20} color={theme.colors.textSecondary} style={{ marginRight: 12 }} />
            <TextInput
              style={[styles.formInput, { fontFamily: getFont("DMSans_400Regular"), flex: 1 }]}
              placeholder="Your password"
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isProcessing && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={[styles.primaryButtonText, { fontFamily: getFont("DMSans_700Bold") }]}>
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginTop: 24, alignItems: "center" }}
            onPress={() => navigateTo("signup")}
          >
            <Text style={[styles.infoSub, { fontFamily: getFont("DMSans_500Medium") }]}>
              {"Don't have an account? "}
              <Text style={{ color: theme.colors.primary, fontWeight: "700" }}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
