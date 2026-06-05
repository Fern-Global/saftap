import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import {
  Bell,
  ChevronLeft,
  Copy,
  Headset,
  LogOut,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react-native";

import { MenuItem } from "../components/MenuItem";
import { useAuth } from "../hooks/useAuth";
import { styles } from "../styles/commonStyles";
import { theme } from "../styles/theme";
import type { ScreenProps } from "../types/navigation";
import { maskWalletAddress } from "../utils/wallet";

type ProfileSection = "Personal Information" | "Security & Privacy" | null;

export const ProfileScreen = ({ getFont, navigateTo }: ScreenProps) => {
  const { authUser, logout } = useAuth();
  const [profileSection, setProfileSection] = useState<ProfileSection>(null);

  if (profileSection === "Personal Information") {
    return (
      <ScrollView contentContainerStyle={styles.scrollPadding}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setProfileSection(null)} style={styles.backButton}>
            <ChevronLeft color={theme.colors.primary} size={28} />
          </TouchableOpacity>
          <Text style={[styles.brandText, { fontFamily: getFont("Syne_700Bold") }]}>
            Personal Info
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.menuGroup}>
          <View style={styles.menuItem}>
            <Text style={styles.menuLabel}>Email: {authUser?.email}</Text>
          </View>
          <View style={styles.menuItem}>
            <Text style={styles.menuLabel}>Phone: {authUser?.phone}</Text>
          </View>
          <View style={styles.menuItem}>
            <Text style={styles.menuLabel}>ID: {authUser?.id}</Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  if (profileSection === "Security & Privacy") {
    return (
      <ScrollView contentContainerStyle={styles.scrollPadding}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setProfileSection(null)} style={styles.backButton}>
            <ChevronLeft color={theme.colors.primary} size={28} />
          </TouchableOpacity>
          <Text style={[styles.brandText, { fontFamily: getFont("Syne_700Bold") }]}>Security</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.menuGroup}>
          <View style={styles.menuItem}>
            <Text style={styles.menuLabel}>Two-Factor Auth: Enabled</Text>
          </View>
          <View style={styles.menuItem}>
            <Text style={styles.menuLabel}>Wallet Encryption: AES-256</Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  const handleLogout = () => {
    logout();
    navigateTo("login");
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigateTo("home")} style={styles.backButton}>
          <ChevronLeft color={theme.colors.primary} size={28} />
        </TouchableOpacity>
        <Text style={[styles.brandText, { fontFamily: getFont("Syne_700Bold") }]}>Profile</Text>
        <TouchableOpacity>
          <Settings color={theme.colors.textSecondary} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.profileHeader}>
        <View style={styles.profileAvatarLarge}>
          <Text style={[styles.profileAvatarTextLarge, { fontFamily: getFont("Syne_700Bold") }]}>
            {authUser?.email?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.profileName, { fontFamily: getFont("Syne_700Bold") }]}>
          {authUser?.email?.split("@")[0]}
        </Text>
        <Text style={[styles.profileEmail, { fontFamily: getFont("DMSans_400Regular") }]}>
          {authUser?.email}
        </Text>
        <View style={styles.tierBadge}>
          <ShieldCheck size={14} color={theme.colors.primary} />
          <Text style={[styles.tierText, { fontFamily: getFont("DMSans_700Bold") }]}>
            Verified Member
          </Text>
        </View>
      </View>

      <View style={styles.walletAddressContainer}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.labelCaps, { marginBottom: 4, color: theme.colors.textSecondary }]}>
            WALLET ADDRESS
          </Text>
          <Text style={[styles.addressText, { fontFamily: getFont("JetBrainsMono_500Medium") }]}>
            {maskWalletAddress(authUser?.walletAddress)}
          </Text>
        </View>
        <TouchableOpacity style={styles.copyButton}>
          <Copy size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.menuGroup}>
        <MenuItem
          icon={<User size={22} color={theme.colors.primary} />}
          label="Personal Information"
          onPress={() => setProfileSection("Personal Information")}
        />
        <MenuItem
          icon={<ShieldCheck size={22} color={theme.colors.primary} />}
          label="Security & Privacy"
          onPress={() => setProfileSection("Security & Privacy")}
        />
        <MenuItem icon={<Bell size={22} color={theme.colors.primary} />} label="Notifications" />
        <MenuItem
          icon={<Headset size={22} color={theme.colors.primary} />}
          label="Help & Support"
        />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={22} color={theme.colors.accentRed} />
        <Text style={[styles.logoutText, { fontFamily: getFont("DMSans_700Bold") }]}>Log Out</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>SafTap Beta v0.1.0</Text>
    </ScrollView>
  );
};
