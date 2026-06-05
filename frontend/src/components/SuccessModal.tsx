import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { CheckCircle2 } from "lucide-react-native";

import { styles } from "../styles/commonStyles";

type SuccessModalProps = {
  getFont: (fontFamily: string) => string;
  onClose: () => void;
  visible: boolean;
};

export const SuccessModal = ({ getFont, onClose, visible }: SuccessModalProps) => (
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
          Your on-chain transfer has been settled.
        </Text>
        <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
          <Text style={[styles.modalCloseText, { fontFamily: getFont("DMSans_700Bold") }]}>
            Done
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);
