import React from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Bell, Smartphone, Wallet, Zap } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { QuickAmount } from "../components/QuickAmount";
import { useAuth } from "../hooks/useAuth";
import { usePayments } from "../hooks/usePayments";
import { styles } from "../styles/commonStyles";
import { theme } from "../styles/theme";
import type { ScreenProps } from "../types/navigation";

export const WalletScreen = ({ getFont, navigateTo }: ScreenProps) => {
  const { authUser } = useAuth();
  const { amount, setAmount } = usePayments();

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
      <View style={styles.header}>
        <Text style={[styles.brandText, { fontFamily: getFont("Syne_700Bold") }]}>SafTap</Text>
        <TouchableOpacity>
          <Bell color={theme.colors.primary} size={24} />
        </TouchableOpacity>
      </View>

      <LinearGradient colors={[theme.colors.secondary, "#0055AA"]} style={styles.visaCard}>
        <View style={styles.cardTopRow}>
          <Smartphone color="#FFF" size={24} />
          <Text style={[styles.visaText, { fontFamily: getFont("Syne_700Bold") }]}>VISA</Text>
        </View>
        <View style={styles.cardChip} />
        <Text style={[styles.cardNumber, { fontFamily: getFont("JetBrainsMono_500Medium") }]}>
          •••• •••• •••• 4291
        </Text>
        <View style={styles.cardDetailsRow}>
          <View>
            <Text style={styles.cardLabel}>CARD HOLDER</Text>
            <Text style={[styles.cardValue, { fontFamily: getFont("DMSans_700Bold") }]}>
              {authUser?.email?.split("@")[0]?.toUpperCase() || "ALEX RIVERA"}
            </Text>
          </View>
          <View>
            <Text style={styles.cardLabel}>EXPIRY</Text>
            <Text style={[styles.cardValue, { fontFamily: getFont("DMSans_700Bold") }]}>09/27</Text>
          </View>
        </View>
      </LinearGradient>

      <TouchableOpacity style={styles.useDifferentBtn}>
        <Wallet color={theme.colors.primary} size={18} />
        <Text style={[styles.useDifferentText, { fontFamily: getFont("DMSans_700Bold") }]}>
          Use a different card
        </Text>
      </TouchableOpacity>

      <View style={styles.depositSection}>
        <Text style={[styles.labelSmall, { fontFamily: getFont("DMSans_700Bold") }]}>
          ENTER DEPOSIT AMOUNT
        </Text>
        <View style={styles.amountInputBox}>
          <Text style={[styles.currencySymbol, { fontFamily: getFont("Syne_700Bold") }]}>$</Text>
          <TextInput
            style={[styles.mainAmountInput, { fontFamily: getFont("Syne_700Bold") }]}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>

        <View style={styles.quickAmountRow}>
          <QuickAmount value="20" current={amount} onPress={setAmount} />
          <QuickAmount value="50" current={amount} onPress={setAmount} />
          <QuickAmount value="100" current={amount} onPress={setAmount} />
        </View>

        <TouchableOpacity style={styles.confirmDepositBtn} onPress={() => navigateTo("success")}>
          <Text style={[styles.confirmDepositText, { fontFamily: getFont("DMSans_700Bold") }]}>
            Confirm Deposit →
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <View style={[styles.infoIconBox, { backgroundColor: "rgba(74, 222, 128, 0.2)" }]}>
          <Zap color={theme.colors.accentGreen} size={20} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.infoTitle, { fontFamily: getFont("DMSans_700Bold") }]}>
            Instant Availability
          </Text>
          <Text style={[styles.infoSub, { fontFamily: getFont("DMSans_400Regular") }]}>
            Funds added via Visa are credited to your SafTap wallet immediately for local
            transactions.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};
