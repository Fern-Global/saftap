import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { CheckCircle2 } from "lucide-react-native";

import { usePayments } from "../hooks/usePayments";
import { styles } from "../styles/commonStyles";
import { theme } from "../styles/theme";
import type { ScreenProps } from "../types/navigation";

export const SuccessScreen = ({ getFont, navigateTo }: ScreenProps) => {
  const { resetPaymentForm } = usePayments();

  const handleBackHome = () => {
    resetPaymentForm();
    navigateTo("home");
  };

  return (
    <View style={[styles.flex, styles.centered, { padding: 40 }]}>
      <CheckCircle2 size={80} color={theme.colors.primary} style={{ marginBottom: 24 }} />
      <Text style={[styles.successTitle, { fontFamily: getFont("Syne_700Bold") }]}>
        Payment Successful
      </Text>
      <Text style={[styles.successSub, { fontFamily: getFont("DMSans_400Regular") }]}>
        Your SafTap payment has been processed and settled instantly.
      </Text>
      <TouchableOpacity
        style={[styles.primaryButton, { width: "100%", marginTop: 40 }]}
        onPress={handleBackHome}
      >
        <Text style={[styles.primaryButtonText, { fontFamily: getFont("DMSans_700Bold") }]}>
          Back to Home
        </Text>
      </TouchableOpacity>
    </View>
  );
};
