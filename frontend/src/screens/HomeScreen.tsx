import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import {
  Bell,
  FileText,
  Plus,
  Scan,
  Send as SendIcon,
  ShoppingBag,
  Store,
  User,
  Wallet,
  Zap,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { ActivityItem } from "../components/ActivityItem";
import { QuickService } from "../components/QuickService";
import { usePayments } from "../hooks/usePayments";
import { useWallet } from "../hooks/useWallet";
import { styles } from "../styles/commonStyles";
import { theme } from "../styles/theme";
import type { ScreenProps } from "../types/navigation";
import { formatKesFromUsdc } from "../utils/currency";

export const HomeScreen = ({ getFont, navigateTo }: ScreenProps) => {
  const { transactions } = usePayments();
  const { marketRate, usdcBalance } = useWallet();

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <User color={theme.colors.textSecondary} size={24} />
          </View>
          <Text style={[styles.brandText, { fontFamily: getFont("Syne_700Bold") }]}>SafTap</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Bell color={theme.colors.primary} size={24} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.welcomeText, { fontFamily: getFont("DMSans_400Regular") }]}>
        Karibu, your travel funds are ready.
      </Text>

      <LinearGradient colors={[theme.colors.secondary, "#0055AA"]} style={styles.balanceCard}>
        <View style={styles.balanceHeaderRow}>
          <Text
            style={[
              styles.labelCaps,
              { color: "rgba(255,255,255,0.7)", fontFamily: getFont("DMSans_700Bold") },
            ]}
          >
            TOTAL BALANCE
          </Text>
          <Wallet color="#FFF" size={20} />
        </View>

        <View style={styles.balanceContent}>
          <Text style={[styles.balanceValue, { fontFamily: getFont("Syne_700Bold") }]}>
            KES {formatKesFromUsdc(usdcBalance, marketRate)}
          </Text>
          <View style={styles.usdcPill}>
            <Text style={[styles.usdcPillText, { fontFamily: getFont("JetBrainsMono_500Medium") }]}>
              ≈ ${usdcBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
              <Text style={styles.liveText}>Live</Text>
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.homeActionGrid}>
        <TouchableOpacity style={styles.scanBtn} onPress={() => navigateTo("mpesa_send")}>
          <View style={styles.scanIconBox}>
            <Scan color="#FFF" size={32} />
          </View>
          <Text style={[styles.scanBtnText, { fontFamily: getFont("DMSans_700Bold") }]}>
            Scan to Pay
          </Text>
        </TouchableOpacity>

        <View style={styles.rightActionColumn}>
          <TouchableOpacity style={styles.smallActionBtn} onPress={() => navigateTo("wallet")}>
            <Plus color={theme.colors.primary} size={24} />
            <Text style={[styles.smallActionText, { fontFamily: getFont("DMSans_700Bold") }]}>
              Top Up
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallActionBtn} onPress={() => navigateTo("mpesa_send")}>
            <SendIcon color={theme.colors.primary} size={24} />
            <Text style={[styles.smallActionText, { fontFamily: getFont("DMSans_700Bold") }]}>
              Transfer
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.sectionHeader, { marginTop: 8 }]}>
        <Text style={[styles.sectionTitle, { fontFamily: getFont("Syne_600SemiBold") }]}>
          Quick Services
        </Text>
      </View>
      <View style={styles.quickServicesGrid}>
        <QuickService
          label="Send Money"
          icon={<SendIcon color={theme.colors.primary} size={20} />}
          onPress={() => navigateTo("mpesa_send")}
        />
        <QuickService
          label="Pay Bill"
          icon={<FileText color={theme.colors.primary} size={20} />}
          onPress={() => navigateTo("paybill")}
        />
        <QuickService
          label="Buy Goods"
          icon={<ShoppingBag color={theme.colors.primary} size={20} />}
          onPress={() => navigateTo("buy_goods")}
        />
        <QuickService
          label="Pochi"
          icon={<Store color={theme.colors.primary} size={20} />}
          onPress={() => navigateTo("pochi")}
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { fontFamily: getFont("Syne_600SemiBold") }]}>
          Recent Activity
        </Text>
        <TouchableOpacity onPress={() => navigateTo("history")}>
          <Text style={[styles.viewAll, { fontFamily: getFont("DMSans_700Bold") }]}>See All</Text>
        </TouchableOpacity>
      </View>

      {transactions.slice(0, 3).map((transaction) => (
        <ActivityItem key={transaction.id} {...transaction} />
      ))}
      {transactions.length === 0 && (
        <Text style={[styles.pageSub, { textAlign: "center" }]}>No payments yet.</Text>
      )}

      <View style={styles.tipsCard}>
        <View style={styles.tipsIconBox}>
          <Zap color={theme.colors.accentGreen} size={24} />
        </View>
        <View style={styles.tipsContent}>
          <Text style={[styles.tipsTitle, { fontFamily: getFont("DMSans_700Bold") }]}>
            Smart Currency Tips
          </Text>
          <Text style={[styles.tipsSub, { fontFamily: getFont("DMSans_400Regular") }]}>
            Rates are currently favorable for USD to KES exchange.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};
