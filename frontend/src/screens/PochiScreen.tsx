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
import { ChevronLeft } from "lucide-react-native";

import { usePayments } from "../hooks/usePayments";
import { styles } from "../styles/commonStyles";
import { theme } from "../styles/theme";
import type { ScreenProps } from "../types/navigation";

export const PochiScreen = ({ getFont, navigateTo }: ScreenProps) => {
  const { amount, isProcessing, phoneNumber, processPayment, setAmount, setPhoneNumber } =
    usePayments();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.flex}
    >
      <ScrollView contentContainerStyle={styles.scrollPadding}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigateTo("home")} style={styles.backButton}>
            <ChevronLeft color={theme.colors.primary} size={28} />
          </TouchableOpacity>
          <Text style={[styles.brandText, { fontFamily: getFont("Syne_700Bold") }]}>
            Pochi la Biashara
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.formContainer}>
          <Text style={[styles.label, { fontFamily: getFont("DMSans_400Regular") }]}>
            Business Phone Number
          </Text>
          <View style={styles.inputBox}>
            <TextInput
              style={[styles.formInput, { fontFamily: getFont("JetBrainsMono_500Medium") }]}
              placeholder="e.g. 0712345678"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>

          <Text style={[styles.label, { fontFamily: getFont("DMSans_400Regular"), marginTop: 24 }]}>
            Amount (KES)
          </Text>
          <View style={styles.inputBox}>
            <TextInput
              style={[styles.formInput, { fontFamily: getFont("JetBrainsMono_500Medium") }]}
              placeholder="0.00"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, (!phoneNumber || !amount) && styles.buttonDisabled]}
            disabled={!phoneNumber || !amount || isProcessing}
            onPress={() => processPayment(() => navigateTo("home"))}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={[styles.primaryButtonText, { fontFamily: getFont("DMSans_700Bold") }]}>
                Send to Pochi
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
