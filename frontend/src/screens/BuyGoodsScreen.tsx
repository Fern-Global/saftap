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

export const BuyGoodsScreen = ({ getFont, navigateTo }: ScreenProps) => {
  const { amount, isProcessing, processPayment, setAmount, setTillNumber, tillNumber } =
    usePayments();

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
          <Text style={[styles.brandText, { fontFamily: getFont("Syne_700Bold") }]}>Buy Goods</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.formContainer}>
          <Text style={[styles.label, { fontFamily: getFont("DMSans_400Regular") }]}>
            Till Number
          </Text>
          <View style={styles.inputBox}>
            <TextInput
              style={[styles.formInput, { fontFamily: getFont("JetBrainsMono_500Medium") }]}
              placeholder="e.g. 123456"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              value={tillNumber}
              onChangeText={setTillNumber}
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
            style={[styles.primaryButton, (!tillNumber || !amount) && styles.buttonDisabled]}
            disabled={!tillNumber || !amount || isProcessing}
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
