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
import { Lock, Mail, Phone } from "lucide-react-native";

import { useAuth } from "../hooks/useAuth";
import { styles } from "../styles/commonStyles";
import { theme } from "../styles/theme";
import type { ScreenProps } from "../types/navigation";

export const SignupScreen = ({ getFont, navigateTo }: ScreenProps) => {
  const {
    confirmPassword,
    email,
    isProcessing,
    password,
    phone,
    setConfirmPassword,
    setEmail,
    setPassword,
    setPhone,
    signup,
  } = useAuth();

  const handleSignup = async () => {
    const destination = await signup();

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
        <View style={[styles.centered, { marginTop: 40, marginBottom: 30 }]}>
          <Text style={[styles.brandText, { fontFamily: getFont("Syne_700Bold"), fontSize: 28 }]}>
            Create Account
          </Text>
          <Text style={[styles.welcomeText, { fontFamily: getFont("DMSans_400Regular") }]}>
            Join SafTap for seamless payments
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

          <Text style={[styles.label, { fontFamily: getFont("DMSans_400Regular"), marginTop: 20 }]}>
            Phone Number
          </Text>
          <View style={styles.inputBox}>
            <Phone size={20} color={theme.colors.textSecondary} style={{ marginRight: 12 }} />
            <TextInput
              style={[styles.formInput, { fontFamily: getFont("DMSans_400Regular"), flex: 1 }]}
              placeholder="+254..."
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <Text style={[styles.label, { fontFamily: getFont("DMSans_400Regular"), marginTop: 20 }]}>
            Password
          </Text>
          <View style={styles.inputBox}>
            <Lock size={20} color={theme.colors.textSecondary} style={{ marginRight: 12 }} />
            <TextInput
              style={[styles.formInput, { fontFamily: getFont("DMSans_400Regular"), flex: 1 }]}
              placeholder="At least 8 characters"
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <Text style={[styles.label, { fontFamily: getFont("DMSans_400Regular"), marginTop: 20 }]}>
            Confirm Password
          </Text>
          <View style={styles.inputBox}>
            <Lock size={20} color={theme.colors.textSecondary} style={{ marginRight: 12 }} />
            <TextInput
              style={[styles.formInput, { fontFamily: getFont("DMSans_400Regular"), flex: 1 }]}
              placeholder="Repeat password"
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isProcessing && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={[styles.primaryButtonText, { fontFamily: getFont("DMSans_700Bold") }]}>
                Sign Up
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginTop: 24, alignItems: "center" }}
            onPress={() => navigateTo("login")}
          >
            <Text style={[styles.infoSub, { fontFamily: getFont("DMSans_500Medium") }]}>
              Already have an account?{" "}
              <Text style={{ color: theme.colors.primary, fontWeight: "700" }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
