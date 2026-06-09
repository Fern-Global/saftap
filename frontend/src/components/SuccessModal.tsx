import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { CheckCircle2 } from "lucide-react-native";

import { styles } from "../styles/commonStyles";
import type { Transaction } from "../types/models";

type SuccessModalProps = {
  getFont: (fontFamily: string) => string;
  onClose: () => void;
  transaction: Transaction | null;
  visible: boolean;
};

export const SuccessModal = ({ getFont, onClose, transaction, visible }: SuccessModalProps) => (
  <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalIconBg}>
          <CheckCircle2 size={50} color="#FFF" />
        </View>
        <Text style={[styles.modalTitle, { fontFamily: getFont("Syne_700Bold") }]}>
          Transaction Successful!
        </Text>
        <Text style={[styles.modalSub, { fontFamily: getFont("DMSans_400Regular") }]}>
          {transaction?.receiverName ?? transaction?.title ?? "Your M-Pesa payment"} received KES{" "}
          {(transaction?.amountKes ?? 0).toLocaleString("en-US", {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
          })}
          .
        </Text>
        {transaction?.darajaReceiptId ? (
          <Text style={[styles.modalSub, { fontFamily: getFont("JetBrainsMono_500Medium") }]}>
            M-Pesa receipt: {transaction.darajaReceiptId}
          </Text>
        ) : null}
        <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
          <Text style={[styles.modalCloseText, { fontFamily: getFont("DMSans_700Bold") }]}>
            Done
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);
