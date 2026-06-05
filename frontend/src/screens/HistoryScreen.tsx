import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Bell, ShieldCheck } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { ActivityItem } from "../components/ActivityItem";
import { mockTransactions } from "../data/mockTransactions";
import { styles } from "../styles/commonStyles";
import { theme } from "../styles/theme";
import type { ScreenProps } from "../types/navigation";

type HistoryFilter = "all" | "spent" | "received";

export const HistoryScreen = ({ getFont }: ScreenProps) => {
  const [historyTab, setHistoryTab] = useState<HistoryFilter>("all");
  const filteredTransactions = mockTransactions.filter((transaction) => {
    if (historyTab === "all") return true;
    if (historyTab === "spent") return transaction.type === "out";
    if (historyTab === "received") return transaction.type === "in";
    return true;
  });

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
      <View style={styles.header}>
        <Text style={[styles.brandText, { fontFamily: getFont("Syne_700Bold") }]}>SafTap</Text>
        <TouchableOpacity>
          <Bell color={theme.colors.primary} size={24} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.pageTitle, { fontFamily: getFont("Syne_700Bold") }]}>
        Transaction History
      </Text>
      <Text style={[styles.pageSub, { fontFamily: getFont("DMSans_400Regular") }]}>
        Track your global spending and local payments.
      </Text>

      <View style={styles.historyTabs}>
        <TouchableOpacity
          style={[styles.historyTab, historyTab === "all" && styles.historyTabActive]}
          onPress={() => setHistoryTab("all")}
        >
          <Text
            style={[styles.historyTabText, historyTab === "all" && styles.historyTabTextActive]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.historyTab, historyTab === "spent" && styles.historyTabActive]}
          onPress={() => setHistoryTab("spent")}
        >
          <Text
            style={[styles.historyTabText, historyTab === "spent" && styles.historyTabTextActive]}
          >
            Spent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.historyTab, historyTab === "received" && styles.historyTabActive]}
          onPress={() => setHistoryTab("received")}
        >
          <Text
            style={[
              styles.historyTabText,
              historyTab === "received" && styles.historyTabTextActive,
            ]}
          >
            Received
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.dateHeader, { fontFamily: getFont("DMSans_700Bold") }]}>
        RECENT TRANSACTIONS
      </Text>

      {filteredTransactions.map((transaction) => (
        <ActivityItem key={transaction.id} {...transaction} />
      ))}

      <LinearGradient colors={[theme.colors.secondary, "#0055AA"]} style={styles.promoCard}>
        <View style={styles.promoContent}>
          <Text style={[styles.promoTitle, { fontFamily: getFont("Syne_700Bold") }]}>
            Safe Travels, Secure Payments
          </Text>
          <Text style={[styles.promoSub, { fontFamily: getFont("DMSans_400Regular") }]}>
            {"Every transaction is protected by SafTap's military-grade encryption."}
          </Text>
        </View>
        <ShieldCheck color="rgba(255,255,255,0.2)" size={80} style={styles.promoIcon} />
      </LinearGradient>
    </ScrollView>
  );
};
