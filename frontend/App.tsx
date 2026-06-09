import React, { useState } from "react";
import { ActivityIndicator, SafeAreaView, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { BottomNav } from "./src/components/BottomNav";
import { SuccessModal } from "./src/components/SuccessModal";
import { AuthProvider } from "./src/context/AuthContext";
import { PaymentProvider } from "./src/context/PaymentContext";
import { WalletProvider } from "./src/context/WalletContext";
import { useAppFonts } from "./src/hooks/useAppFonts";
import { usePayments } from "./src/hooks/usePayments";
import { BuyGoodsScreen } from "./src/screens/BuyGoodsScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { MpesaSendScreen } from "./src/screens/MpesaSendScreen";
import { PayBillScreen } from "./src/screens/PayBillScreen";
import { PaymentScreen } from "./src/screens/PaymentScreen";
import { PochiScreen } from "./src/screens/PochiScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { RequestScreen } from "./src/screens/RequestScreen";
import { SignupScreen } from "./src/screens/SignupScreen";
import { SuccessScreen } from "./src/screens/SuccessScreen";
import { VerifyTwoFactorScreen } from "./src/screens/VerifyTwoFactorScreen";
import { WalletScreen } from "./src/screens/WalletScreen";
import { styles } from "./src/styles/commonStyles";
import { theme } from "./src/styles/theme";
import type { NavigateTo, Tab } from "./src/types/navigation";
import { shouldShowBottomNav } from "./src/types/navigation";

const AppContent = () => {
  const [activeTab, setActiveTab] = useState<Tab>("login");
  const { getFont, isReady } = useAppFonts();
  const { completedTransaction, hideSuccessModal, showSuccessModal } = usePayments();

  if (!isReady) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  const navigateTo: NavigateTo = (tab) => {
    setActiveTab(tab);
  };

  const screenProps = { getFont, navigateTo };

  const renderScreen = () => {
    switch (activeTab) {
      case "login":
        return <LoginScreen {...screenProps} />;
      case "signup":
        return <SignupScreen {...screenProps} />;
      case "verify_2fa":
        return <VerifyTwoFactorScreen {...screenProps} />;
      case "home":
        return <HomeScreen {...screenProps} />;
      case "wallet":
        return <WalletScreen {...screenProps} />;
      case "history":
        return <HistoryScreen {...screenProps} />;
      case "profile":
        return <ProfileScreen {...screenProps} />;
      case "payment":
        return <PaymentScreen {...screenProps} />;
      case "mpesa_send":
        return <MpesaSendScreen {...screenProps} />;
      case "paybill":
        return <PayBillScreen {...screenProps} />;
      case "buy_goods":
        return <BuyGoodsScreen {...screenProps} />;
      case "request":
        return <RequestScreen {...screenProps} />;
      case "pochi":
        return <PochiScreen {...screenProps} />;
      case "success":
        return <SuccessScreen {...screenProps} />;
      default:
        return <LoginScreen {...screenProps} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }}>{renderScreen()}</View>
      <SuccessModal
        getFont={getFont}
        visible={showSuccessModal}
        onClose={hideSuccessModal}
        transaction={completedTransaction}
      />
      {shouldShowBottomNav(activeTab) && (
        <BottomNav activeTab={activeTab} navigateTo={navigateTo} />
      )}
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <PaymentProvider>
          <AppContent />
        </PaymentProvider>
      </WalletProvider>
    </AuthProvider>
  );
}
