import React from "react";
import { Text, TouchableOpacity } from "react-native";

import { styles } from "../styles/commonStyles";

type QuickAmountProps = {
  current: string;
  onPress: (value: string) => void;
  value: string;
};

export const QuickAmount = ({ current, onPress, value }: QuickAmountProps) => (
  <TouchableOpacity
    style={[styles.quickAmountBtn, current === value && styles.quickAmountBtnActive]}
    onPress={() => onPress(value)}
  >
    <Text style={[styles.quickAmountText, current === value && styles.quickAmountTextActive]}>
      ${value}
    </Text>
  </TouchableOpacity>
);
