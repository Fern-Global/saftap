import React from "react";
import { View } from "react-native";
import { History, Home, User, Wallet } from "lucide-react-native";

import { styles } from "../styles/commonStyles";
import type { NavigateTo, Tab } from "../types/navigation";
import { TabButton } from "./TabButton";

type BottomNavProps = {
  activeTab: Tab;
  navigateTo: NavigateTo;
};

export const BottomNav = ({ activeTab, navigateTo }: BottomNavProps) => (
  <View style={styles.bottomNav}>
    <TabButton
      icon={<Home size={24} />}
      label="Home"
      active={activeTab === "home"}
      onPress={() => navigateTo("home")}
    />
    <TabButton
      icon={<Wallet size={24} />}
      label="Wallet"
      active={activeTab === "wallet"}
      onPress={() => navigateTo("wallet")}
    />
    <TabButton
      icon={<History size={24} />}
      label="History"
      active={activeTab === "history"}
      onPress={() => navigateTo("history")}
    />
    <TabButton
      icon={<User size={24} />}
      label="Profile"
      active={activeTab === "profile"}
      onPress={() => navigateTo("profile")}
    />
  </View>
);
