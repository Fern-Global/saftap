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

export const PayBillScreen = ({ getFont, navigateTo }: ScreenProps) => {
  const {
    accountNumber,
    amount,
    bizNumber,
    isProcessing,
    processPayment,
    setAccountNumber,
    setAmount,
    setBizNumber,
  } = usePayments();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.flex}
    >
      <ScrollView contentContainerStyle={styles.scrollPadding}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigateTo("payment")} style={styles.backButton}>
            <ChevronLeft color={theme.colors.primary} size={28} />
          </TouchableOpacity>
          <Text style={[styles.brandText, { fontFamily: getFont("Syne_700Bold") }]}>Pay Bill</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.formContainer}>
          <Text style={[styles.label, { fontFamily: getFont("DMSans_400Regular") }]}>
            Business Number
          </Text>
          <View style={styles.inputBox}>
            <TextInput
              style={[styles.formInput, { fontFamily: getFont("JetBrainsMono_500Medium") }]}
              placeholder="e.g. 888888"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              value={bizNumber}
              onChangeText={setBizNumber}
            />
          </View>

          <Text style={[styles.label, { fontFamily: getFont("DMSans_400Regular"), marginTop: 24 }]}>
            Account Number
          </Text>
          <View style={styles.inputBox}>
            <TextInput
              style={[styles.formInput, { fontFamily: getFont("JetBrainsMono_500Medium") }]}
              placeholder="e.g. ACC-123"
              placeholderTextColor={theme.colors.textSecondary}
              value={accountNumber}
              onChangeText={setAccountNumber}
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
            style={[
              styles.primaryButton,
              (!bizNumber || !accountNumber || !amount) && styles.buttonDisabled,
            ]}
            disabled={!bizNumber || !accountNumber || !amount || isProcessing}
            onPress={() => processPayment(() => navigateTo("home"))}
          >
            {isProcessing ? (
              <ActivityIndicator color={theme.colors.onPrimary} />
            ) : (
              <Text style={[styles.primaryButtonText, { fontFamily: getFont("DMSans_700Bold") }]}>
                Make Payment
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
