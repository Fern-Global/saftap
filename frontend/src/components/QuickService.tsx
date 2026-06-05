import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { styles } from "../styles/commonStyles";

type QuickServiceProps = {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
};

export const QuickService = ({ icon, label, onPress }: QuickServiceProps) => (
  <TouchableOpacity style={styles.quickServiceItem} onPress={onPress}>
    <View style={styles.quickServiceIconBox}>{icon}</View>
    <Text style={[styles.quickServiceLabel, { fontFamily: "DMSans_500Medium" }]}>{label}</Text>
  </TouchableOpacity>
);
