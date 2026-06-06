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
import { ChevronLeft, Globe } from "lucide-react-native";

import { usePayments } from "../hooks/usePayments";
import { useWallet } from "../hooks/useWallet";
import { styles } from "../styles/commonStyles";
import { theme } from "../styles/theme";
import type { ScreenProps } from "../types/navigation";

export const RequestScreen = ({ getFont, navigateTo }: ScreenProps) => {
  const {
    amount,
    confirmRequest,
    isProcessing,
    phoneNumber,
    setAmount,
    setPhoneNumber,
    setShowRateConfirm,
    showRateConfirm,
  } = usePayments();
  const { marketRate } = useWallet();

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
          <Text style={[styles.brandText, { fontFamily: getFont("Syne_700Bold") }]}>
            Request Money
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {!showRateConfirm ? (
          <View style={styles.formContainer}>
            <Text style={[styles.label, { fontFamily: getFont("DMSans_400Regular") }]}>
              Request From (Phone/Wallet)
            </Text>
            <View style={styles.inputBox}>
              <TextInput
                style={[styles.formInput, { fontFamily: getFont("JetBrainsMono_500Medium") }]}
                placeholder="0x... or 07..."
                placeholderTextColor={theme.colors.textSecondary}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>

            <Text
              style={[styles.label, { fontFamily: getFont("DMSans_400Regular"), marginTop: 24 }]}
            >
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

            <View style={styles.conversionBox}>
              <View style={styles.conversionHeader}>
                <Globe size={16} color={theme.colors.primary} />
                <Text
                  style={[styles.conversionHeaderText, { fontFamily: getFont("DMSans_700Bold") }]}
                >
                  LIVE MARKET ORACLE
                </Text>
              </View>
              <Text
                style={[
                  styles.conversionRateText,
                  { fontFamily: getFont("JetBrainsMono_500Medium") },
                ]}
              >
                1 USDC = {marketRate.toFixed(2)} KES
              </Text>
              <Text style={styles.conversionSub}>Rates are refreshed every 30 seconds</Text>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, (!phoneNumber || !amount) && styles.buttonDisabled]}
              disabled={!phoneNumber || !amount}
              onPress={() => setShowRateConfirm(true)}
            >
              <Text style={[styles.primaryButtonText, { fontFamily: getFont("DMSans_700Bold") }]}>
                Review Request
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>YOU WILL RECEIVE APPROX.</Text>
              <Text style={[styles.summaryValue, { fontFamily: getFont("Syne_700Bold") }]}>
                $
                {(Number.parseFloat(amount) / marketRate).toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}{" "}
                <Text style={{ fontSize: 16 }}>USDC</Text>
              </Text>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Requesting</Text>
                <Text style={styles.summaryRowValue}>{amount} KES</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Oracle Rate</Text>
                <Text style={[styles.summaryRowValue, { color: theme.colors.primary }]}>
                  {marketRate.toFixed(2)} KES
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Slippage Tol.</Text>
                <Text style={styles.summaryRowValue}>0.5%</Text>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { flex: 1 }]}
                onPress={() => setShowRateConfirm(false)}
              >
                <Text
                  style={[styles.secondaryButtonText, { fontFamily: getFont("DMSans_700Bold") }]}
                >
                  Reject Rate
                </Text>
              </TouchableOpacity>
              <View style={{ width: 16 }} />
              <TouchableOpacity
                style={[styles.primaryButton, { flex: 2, marginTop: 0 }]}
                onPress={() => confirmRequest(() => navigateTo("success"))}
              >
                {isProcessing ? (
                  <ActivityIndicator color={theme.colors.onPrimary} />
                ) : (
                  <Text
                    style={[styles.primaryButtonText, { fontFamily: getFont("DMSans_700Bold") }]}
                  >
                    Confirm & Send
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
