import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import {
  Banknote,
  ChevronLeft,
  FileText,
  Send as SendIcon,
  ShoppingBag,
  User,
} from "lucide-react-native";

import { ServiceCard } from "../components/ServiceCard";
import { useWallet } from "../hooks/useWallet";
import { styles } from "../styles/commonStyles";
import { theme } from "../styles/theme";
import type { ScreenProps } from "../types/navigation";
import { formatWholeKesFromUsdc } from "../utils/currency";

export const PaymentScreen = ({ getFont, navigateTo }: ScreenProps) => {
  const { usdcBalance } = useWallet();

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigateTo("home")} style={styles.backButton}>
          <ChevronLeft color={theme.colors.primary} size={28} />
        </TouchableOpacity>
        <Text style={[styles.brandText, { fontFamily: getFont("Syne_700Bold") }]}>SafTap</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.sendBalanceSection}>
        <Text
          style={[
            styles.labelCaps,
            {
              textAlign: "center",
              marginBottom: 8,
              letterSpacing: 1.5,
              color: theme.colors.textSecondary,
            },
          ]}
        >
          AVAILABLE BALANCE
        </Text>
        <View style={styles.kesBalanceRow}>
          <Text style={[styles.kesPrefix, { fontFamily: getFont("Syne_700Bold") }]}>KES </Text>
          <Text style={[styles.kesAmount, { fontFamily: getFont("Syne_700Bold") }]}>
            {formatWholeKesFromUsdc(usdcBalance)}.00
          </Text>
        </View>
        <View style={styles.percentBadge}>
          <Text style={[styles.percentText, { fontFamily: getFont("JetBrainsMono_500Medium") }]}>
            ↗ +2.4%
          </Text>
        </View>
      </View>

      <View style={styles.serviceGrid}>
        <ServiceCard
          label="Send to M-Pesa"
          sub="Instant transfer"
          icon={<SendIcon color="#FFF" size={22} />}
          active
          onPress={() => navigateTo("mpesa_send")}
        />
        <ServiceCard
          label="Pay Bill"
          sub="Utilities & services"
          icon={<FileText color={theme.colors.primary} size={22} />}
          onPress={() => navigateTo("paybill")}
        />
        <ServiceCard
          label="Buy Goods"
          sub="Till payments"
          icon={<ShoppingBag color={theme.colors.primary} size={22} />}
          onPress={() => navigateTo("buy_goods")}
        />
        <ServiceCard
          label="Request"
          sub="Get paid fast"
          icon={<Banknote color={theme.colors.primary} size={22} />}
          onPress={() => navigateTo("request")}
        />
      </View>

      <View style={[styles.sectionHeader, { marginTop: 32 }]}>
        <Text
          style={[
            styles.sectionTitle,
            { fontFamily: getFont("Syne_600SemiBold"), color: theme.colors.textMain },
          ]}
        >
          Recent Payees
        </Text>
        <TouchableOpacity>
          <Text style={[styles.viewAll, { fontFamily: getFont("DMSans_700Bold") }]}>VIEW ALL</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.payeeRow}>
        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={styles.payeeAvatarContainer}>
            <View style={styles.payeeAvatar}>
              <User color={theme.colors.primary} size={28} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};
