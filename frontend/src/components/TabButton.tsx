import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { styles } from "../styles/commonStyles";
import { theme } from "../styles/theme";

type TabButtonProps = {
  active: boolean;
  icon: React.ReactElement<{ color?: string }>;
  label: string;
  onPress: () => void;
};

export const TabButton = ({ active, icon, label, onPress }: TabButtonProps) => (
  <TouchableOpacity style={styles.tabButton} onPress={onPress}>
    <View style={[styles.tabIconContainer, active && styles.tabIconContainerActive]}>
      {React.cloneElement(icon, {
        color: active ? theme.colors.onPrimary : theme.colors.textSecondary,
      })}
    </View>
    <Text style={[styles.tabLabel, active && { color: theme.colors.primary, fontWeight: "700" }]}>
      {label}
    </Text>
  </TouchableOpacity>
);
