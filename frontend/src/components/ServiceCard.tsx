import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { styles } from "../styles/commonStyles";
import { theme } from "../styles/theme";

type ServiceCardProps = {
  active?: boolean;
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  sub: string;
};

export const ServiceCard = ({ active, icon, label, onPress, sub }: ServiceCardProps) => (
  <TouchableOpacity
    style={[styles.serviceCard, active && { backgroundColor: theme.colors.surfaceLight }]}
    onPress={onPress}
  >
    <View style={[styles.serviceIconBox, active && { backgroundColor: theme.colors.primary }]}>
      {icon}
    </View>
    <Text style={styles.serviceLabel}>{label}</Text>
    <Text style={styles.serviceSub}>{sub}</Text>
  </TouchableOpacity>
);
