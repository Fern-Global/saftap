import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { styles } from "../styles/commonStyles";
import { theme } from "../styles/theme";

type MenuItemProps = {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
};

export const MenuItem = ({ icon, label, onPress }: MenuItemProps) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuIconBox}>{icon}</View>
    <Text style={styles.menuLabel}>{label}</Text>
    <ChevronRight size={20} color={theme.colors.textSecondary} />
  </TouchableOpacity>
);
