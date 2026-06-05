import React from "react";
import { Text, View } from "react-native";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react-native";

import { styles } from "../styles/commonStyles";
import { theme } from "../styles/theme";
import type { TransactionType } from "../types/models";

type ActivityItemProps = {
  amount: string;
  category: string;
  sub: string;
  title: string;
  type: TransactionType;
};

export const ActivityItem = ({ amount, category, sub, title, type }: ActivityItemProps) => {
  const isIncoming = type === "in";

  return (
    <View style={styles.listItem}>
      <View
        style={[
          styles.listIconBox,
          { backgroundColor: isIncoming ? "rgba(74, 222, 128, 0.1)" : "rgba(255, 112, 8, 0.1)" },
        ]}
      >
        {isIncoming ? (
          <ArrowDownLeft color={theme.colors.accentGreen} size={20} />
        ) : (
          <ArrowUpRight color={theme.colors.primary} size={20} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.listTitle}>{title}</Text>
        <Text style={styles.listSub}>{sub}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text
          style={[
            styles.listAmount,
            { color: isIncoming ? theme.colors.accentGreen : theme.colors.accentRed },
          ]}
        >
          {amount}
        </Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{category}</Text>
        </View>
      </View>
    </View>
  );
};
