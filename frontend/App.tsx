import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Switch,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Modal,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts, Syne_700Bold, Syne_600SemiBold } from "@expo-google-fonts/syne";
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from "@expo-google-fonts/dm-sans";
import { JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono";
import { 
  Home, 
  CreditCard, 
  Send as SendIcon, 
  User, 
  History, 
  MoreVertical, 
  ChevronLeft,
  ArrowUpRight,
  ArrowDownLeft,
  ShoppingBag,
  HandCoins,
  Globe,
  Snowflake,
  Eye,
  Smartphone,
  FileText,
  Banknote,
  ArrowLeftRight,
  Wallet,
  ShieldCheck,
  Settings,
  Bell,
  Headset,
  LogOut,
  Copy,
  ChevronRight,
  CheckCircle2,
  Scan,
  Plus,
  Zap,
  Store,
  LayoutGrid,
} from "lucide-react-native";
import { theme } from "./theme";

const { width } = Dimensions.get("window");

type Tab = "home" | "wallet" | "history" | "profile" | "mpesa_send" | "paybill" | "buy_goods" | "success" | "request" | "payment" | "pochi";

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Syne_700Bold,
    Syne_600SemiBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    JetBrainsMono_500Medium,
  });

  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [historyTab, setHistoryTab] = useState<"all" | "spent" | "received">("all");
  const [profileSection, setProfileSection] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Mock Transactions Data
  const allTransactions = [
    { id: '1', title: 'Java House, CBD', sub: 'Today · 12:45 PM', amount: '- KES 2,450', type: 'out', category: 'Dining' },
    { id: '2', title: 'Bolt Ride', sub: 'Today · 09:12 AM', amount: '- KES 850', type: 'out', category: 'Transport' },
    { id: '3', title: 'Transfer from USD Card', sub: 'Yesterday · 04:30 PM', amount: '+ KES 50,000', type: 'in', category: 'Top Up' },
    { id: '4', title: 'Carrefour, Mall', sub: 'Yesterday · 02:15 PM', amount: '- KES 12,300', type: 'out', category: 'Groceries' },
    { id: '5', title: 'Received from Alex', sub: 'Yesterday · 10:00 AM', amount: '+ KES 5,000', type: 'in', category: 'Transfer' },
    { id: '6', title: 'Netflix Subscription', sub: 'Oct 22 · 11:30 PM', amount: '- KES 1,100', type: 'out', category: 'Entertainment' },
    { id: '7', title: 'Top-up from Bank', sub: 'Oct 22 · 05:15 PM', amount: '+ $500.00', type: 'in', category: 'Top Up' },
    { id: '8', title: 'Aisha M.', sub: 'Oct 21 · 02:00 PM', amount: '- $50.00', type: 'out', category: 'Transfer' },
  ];
  const [intlPayments, setIntlPayments] = useState(true);
  const [onlinePurchases, setOnlinePurchases] = useState(true);

  // Form States
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [bizNumber, setBizNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [tillNumber, setTillNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Demo Mock Data
  const [usdcBalance, setUsdcBalance] = useState(2480.50);
  const [marketRate, setMarketRate] = useState(128.84);
  const [showRateConfirm, setShowRateConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setMarketRate(prev => prev + (Math.random() * 0.1 - 0.05));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 1500);
    if (fontsLoaded || fontError) {
      setIsReady(true);
      clearTimeout(timer);
    }
    return () => clearTimeout(timer);
  }, [fontsLoaded, fontError]);

  if (!isReady) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  const navigateTo = (tab: Tab) => {
    setActiveTab(tab);
  };

  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const deductUsdc = parseFloat(amount) / 128.84;
      if (!isNaN(deductUsdc) && deductUsdc > 0) {
        setUsdcBalance(prev => prev - deductUsdc);
      }
      setIsProcessing(false);
      setShowSuccessModal(true);
      // Auto close and go home
      setTimeout(() => {
        setShowSuccessModal(false);
        navigateTo("home");
        setAmount(""); setPhoneNumber(""); setBizNumber(""); setAccountNumber(""); setTillNumber("");
      }, 2500);
    }, 2500);
  };

  const getFont = (base: string) => fontsLoaded ? base : Platform.OS === 'ios' ? 'System' : 'sans-serif';

  // --- SCREEN RENDERS ---

  const renderPochi = () => (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scrollPadding}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigateTo("home")} style={styles.backButton}>
            <ChevronLeft color={theme.colors.primary} size={28} />
          </TouchableOpacity>
          <Text style={[styles.brandText, { fontFamily: getFont("Syne_700Bold") }]}>Pochi la Biashara</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.formContainer}>
          <Text style={[styles.label, { fontFamily: getFont("DMSans_400Regular") }]}>Business Phone Number</Text>
          <View style={styles.inputBox}>
            <TextInput 
              style={[styles.formInput, { fontFamily: getFont("JetBrainsMono_500Medium") }]} 
              placeholder="e.g. 0712345678" 
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>

          <Text style={[styles.label, { fontFamily: getFont("DMSans_400Regular"), marginTop: 24 }]}>Amount (KES)</Text>
          <View style={styles.inputBox}>
            <TextInput 
              style={[styles.formInput, { fontFamily: getFont("JetBrainsMono_500Medium") }]} 
              placeholder="0.00" 
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          <TouchableOpacity 
            style={[styles.primaryButton, (!phoneNumber || !amount) && styles.buttonDisabled]} 
            disabled={!phoneNumber || !amount || isProcessing}
            onPress={handlePayment}
          >
            {isProcessing ? <ActivityIndicator color="#FFF" /> : <Text style={[styles.primaryButtonText, { fontFamily: getFont("DMSans_700Bold") }]}>Send to Pochi</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderHome = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <User color={theme.colors.textSecondary} size={24} />
          </View>
          <Text style={[styles.brandText, { fontFamily: getFont("Syne_700Bold") }]}>SafTap</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Bell color={theme.colors.primary} size={24} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.welcomeText, { fontFamily: getFont("DMSans_400Regular") }]}>
        Karibu, your travel funds are ready.
      </Text>

      <LinearGradient colors={[theme.colors.secondary, '#0055AA']} style={styles.balanceCard}>
        <View style={styles.balanceHeaderRow}>
          <Text style={[styles.labelCaps, { color: 'rgba(255,255,255,0.7)', fontFamily: getFont("DMSans_700Bold") }]}>TOTAL BALANCE</Text>
          <Wallet color="#FFF" size={20} />
        </View>
        
        <View style={styles.balanceContent}>
          <Text style={[styles.balanceValue, { fontFamily: getFont("Syne_700Bold") }]}>
            KES {(usdcBalance * 128.84).toLocaleString('en-US', {minimumFractionDigits: 2})}
          </Text>
          <View style={styles.usdcPill}>
             <Text style={[styles.usdcPillText, { fontFamily: getFont("JetBrainsMono_500Medium") }]}>
               ≈ ${usdcBalance.toLocaleString('en-US', {minimumFractionDigits: 2})} <Text style={styles.liveText}>Live</Text>
             </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.homeActionGrid}>
        <TouchableOpacity style={styles.scanBtn} onPress={() => navigateTo("mpesa_send")}>
          <View style={styles.scanIconBox}>
            <Scan color="#FFF" size={32} />
          </View>
          <Text style={[styles.scanBtnText, { fontFamily: getFont("DMSans_700Bold") }]}>Scan to Pay</Text>
        </TouchableOpacity>
        
        <View style={styles.rightActionColumn}>
          <TouchableOpacity style={styles.smallActionBtn} onPress={() => navigateTo("wallet")}>
            <Plus color={theme.colors.primary} size={24} />
            <Text style={[styles.smallActionText, { fontFamily: getFont("DMSans_700Bold") }]}>Top Up</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallActionBtn} onPress={() => navigateTo("mpesa_send")}>
            <SendIcon color={theme.colors.primary} size={24} />
            <Text style={[styles.smallActionText, { fontFamily: getFont("DMSans_700Bold") }]}>Transfer</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.sectionHeader, { marginTop: 8 }]}>
        <Text style={[styles.sectionTitle, { fontFamily: getFont("Syne_600SemiBold") }]}>Quick Services</Text>
      </View>
      <View style={styles.quickServicesGrid}>
        <QuickService label="Send Money" icon={<SendIcon color={theme.colors.primary} size={20} />} onPress={() => navigateTo("mpesa_send")} />
        <QuickService label="Pay Bill" icon={<FileText color={theme.colors.primary} size={20} />} onPress={() => navigateTo("paybill")} />
        <QuickService label="Buy Goods" icon={<ShoppingBag color={theme.colors.primary} size={20} />} onPress={() => navigateTo("buy_goods")} />
        <QuickService label="Pochi" icon={<Store color={theme.colors.primary} size={20} />} onPress={() => navigateTo("pochi")} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { fontFamily: getFont("Syne_600SemiBold") }]}>Recent Activity</Text>
        <TouchableOpacity onPress={() => navigateTo("history")}><Text style={[styles.viewAll, { fontFamily: getFont("DMSans_700Bold") }]}>See All</Text></TouchableOpacity>
      </View>

      {allTransactions.slice(0, 3).map(tx => (
        <ActivityItem 
          key={tx.id} 
          title={tx.title} 
          sub={tx.sub} 
          amount={tx.amount} 
          type={tx.type} 
          category={tx.category} 
        />
      ))}

      <View style={styles.tipsCard}>
        <View style={styles.tipsIconBox}>
          <Zap color={theme.colors.accentGreen} size={24} />
        </View>
        <View style={styles.tipsContent}>
          <Text style={[styles.tipsTitle, { fontFamily: getFont("DMSans_700Bold") }]}>Smart Currency Tips</Text>
          <Text style={[styles.tipsSub, { fontFamily: getFont("DMSans_400Regular") }]}>Rates are currently favorable for USD to KES exchange.</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderWallet = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
      <View style={styles.header}>
        <Text style={[styles.brandText, { fontFamily: getFont("Syne_700Bold") }]}>SafTap</Text>
        <TouchableOpacity><Bell color={theme.colors.primary} size={24} /></TouchableOpacity>
      </View>

      <LinearGradient colors={[theme.colors.secondary, '#0055AA']} style={styles.visaCard}>
        <View style={styles.cardTopRow}>
          <Smartphone color="#FFF" size={24} />
          <Text style={[styles.visaText, { fontFamily: getFont("Syne_700Bold") }]}>VISA</Text>
        </View>
        <View style={styles.cardChip} />
        <Text style={[styles.cardNumber, { fontFamily: getFont("JetBrainsMono_500Medium") }]}>••••  ••••  ••••  4291</Text>
        <View style={styles.cardDetailsRow}>
          <View>
            <Text style={styles.cardLabel}>CARD HOLDER</Text>
            <Text style={[styles.cardValue, { fontFamily: getFont("DMSans_700Bold") }]}>ALEX RIVERA</Text>
          </View>
          <View>
            <Text style={styles.cardLabel}>EXPIRY</Text>
            <Text style={[styles.cardValue, { fontFamily: getFont("DMSans_700Bold") }]}>09/27</Text>
          </View>
        </View>
      </LinearGradient>

      <TouchableOpacity style={styles.useDifferentBtn}>
        <Wallet color={theme.colors.primary} size={18} />
        <Text style={[styles.useDifferentText, { fontFamily: getFont("DMSans_700Bold") }]}>Use a different card</Text>
      </TouchableOpacity>

      <View style={styles.depositSection}>
        <Text style={[styles.labelSmall, { fontFamily: getFont("DMSans_700Bold") }]}>ENTER DEPOSIT AMOUNT</Text>
        <View style={styles.amountInputBox}>
          <Text style={[styles.currencySymbol, { fontFamily: getFont("Syne_700Bold") }]}>$</Text>
          <TextInput 
            style={[styles.mainAmountInput, { fontFamily: getFont("Syne_700Bold") }]} 
            value={amount} 
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>

        <View style={styles.quickAmountRow}>
          <QuickAmount value="20" current={amount} onPress={setAmount} />
          <QuickAmount value="50" current={amount} onPress={setAmount} />
          <QuickAmount value="100" current={amount} onPress={setAmount} />
        </View>

        <TouchableOpacity style={styles.confirmDepositBtn} onPress={() => navigateTo("success")}>
          <Text style={[styles.confirmDepositText, { fontFamily: getFont("DMSans_700Bold") }]}>Confirm Deposit  →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <View style={[styles.infoIconBox, { backgroundColor: 'rgba(74, 222, 128, 0.2)' }]}>
           <Zap color={theme.colors.accentGreen} size={20} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.infoTitle, { fontFamily: getFont("DMSans_700Bold") }]}>Instant Availability</Text>
          <Text style={[styles.infoSub, { fontFamily: getFont("DMSans_400Regular") }]}>Funds added via Visa are credited to your SafTap wallet immediately for local transactions.</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderHistory = () => {
    const filteredTransactions = allTransactions.filter(tx => {
      if (historyTab === "all") return true;
      if (historyTab === "spent") return tx.type === "out";
      if (historyTab === "received") return tx.type === "in";
      return true;
    });

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        <View style={styles.header}>
          <Text style={[styles.brandText, { fontFamily: getFont("Syne_700Bold") }]}>SafTap</Text>
          <TouchableOpacity><Bell color={theme.colors.primary} size={24} /></TouchableOpacity>
        </View>

        <Text style={[styles.pageTitle, { fontFamily: getFont("Syne_700Bold") }]}>Transaction History</Text>
        <Text style={[styles.pageSub, { fontFamily: getFont("DMSans_400Regular") }]}>Track your global spending and local payments.</Text>

        <View style={styles.historyTabs}>
          <TouchableOpacity 
            style={[styles.historyTab, historyTab === "all" && styles.historyTabActive]} 
            onPress={() => setHistoryTab("all")}
          >
            <Text style={[styles.historyTabText, historyTab === "all" && styles.historyTabTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.historyTab, historyTab === "spent" && styles.historyTabActive]} 
            onPress={() => setHistoryTab("spent")}
          >
            <Text style={[styles.historyTabText, historyTab === "spent" && styles.historyTabTextActive]}>Spent</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.historyTab, historyTab === "received" && styles.historyTabActive]} 
            onPress={() => setHistoryTab("received")}
          >
            <Text style={[styles.historyTabText, historyTab === "received" && styles.historyTabTextActive]}>Received</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.dateHeader, { fontFamily: getFont("DMSans_700Bold") }]}>RECENT TRANSACTIONS</Text>

        {filteredTransactions.map(tx => (
          <ActivityItem 
            key={tx.id} 
            title={tx.title} 
            sub={tx.sub} 
            amount={tx.amount} 
            type={tx.type} 
            category={tx.category} 
          />
        ))}

        <LinearGradient colors={[theme.colors.secondary, '#0055AA']} style={styles.promoCard}>
          <View style={styles.promoContent}>
            <Text style={[styles.promoTitle, { fontFamily: getFont("Syne_700Bold") }]}>Safe Travels, Secure Payments</Text>
            <Text style={[styles.promoSub, { fontFamily: getFont("DMSans_400Regular") }]}>Every transaction is protected by SafTap's military-grade encryption.</Text>
          </View>
          <ShieldCheck color="rgba(255,255,255,0.2)" size={80} style={styles.promoIcon} />
        </LinearGradient>
      </ScrollView>
    );
  };

  const renderPayment = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigateTo("home")} style={styles.backButton}>
          <ChevronLeft color={theme.colors.primary} size={28} />
        </TouchableOpacity>
        <Text style={[styles.brandText, { fontFamily: getFont("Syne_700Bold") }]}>SafTap</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.sendBalanceSection}>
        <Text style={[styles.labelCaps, { textAlign: 'center', marginBottom: 8, letterSpacing: 1.5, color: theme.colors.textSecondary }]}>AVAILABLE BALANCE</Text>
        <View style={styles.kesBalanceRow}>
          <Text style={[styles.kesPrefix, { fontFamily: getFont("Syne_700Bold") }]}>KES </Text>
          <Text style={[styles.kesAmount, { fontFamily: getFont("Syne_700Bold") }]}>{Math.floor(usdcBalance * 128.84).toLocaleString('en-US')}.00</Text>
        </View>
        <View style={styles.percentBadge}><Text style={[styles.percentText, { fontFamily: getFont("JetBrainsMono_500Medium") }]}>↗ +2.4%</Text></View>
      </View>

      <View style={styles.serviceGrid}>
        <ServiceCard label="Send to M-Pesa" sub="Instant transfer" icon={<SendIcon color="#FFF" size={22} />} active onPress={() => navigateTo("mpesa_send")} />
        <ServiceCard label="Pay Bill" sub="Utilities & services" icon={<FileText color={theme.colors.primary} size={22} />} onPress={() => navigateTo("paybill")} />
        <ServiceCard label="Buy Goods" sub="Till payments" icon={<ShoppingBag color={theme.colors.primary} size={22} />} onPress={() => navigateTo("buy_goods")} />
        <ServiceCard label="Request" sub="Get paid fast" icon={<Banknote color={theme.colors.primary} size={22} />} onPress={() => navigateTo("request")} />
      </View>

      <View style={[styles.sectionHeader, { marginTop: 32 }]}>
        <Text style={[styles.sectionTitle, { fontFamily: getFont("Syne_600SemiBold"), color: theme.colors.textMain }]}>Recent Payees</Text>
        <TouchableOpacity><Text style={[styles.viewAll, { fontFamily: getFont("DMSans_700Bold") }]}>VIEW ALL</Text></TouchableOpacity>
      </View>

      <View style={styles.payeeRow}>
         {[1,2,3,4].map(i => (
           <View key={i} style={styles.payeeAvatarContainer}><View style={styles.payeeAvatar}><User color={theme.colors.primary} size={28} /></View></View>
         ))}
      </View>
    </ScrollView>
  );

  const renderProfile = () => {
    if (profileSection === "Personal Information") {
      return (
        <ScrollView contentContainerStyle={styles.scrollPadding}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setProfileSection(null)} style={styles.backButton}>
              <ChevronLeft color={theme.colors.primary} size={28} />
            </TouchableOpacity>
            <Text style={[styles.brandText, { fontFamily: getFont("Syne_700Bold") }]}>Personal Info</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.menuGroup}>
            <View style={styles.menuItem}><Text style={styles.menuLabel}>Full Name: James Oduya</Text></View>
            <View style={styles.menuItem}><Text style={styles.menuLabel}>Email: james.oduya@gmail.com</Text></View>
            <View style={styles.menuItem}><Text style={styles.menuLabel}>Phone: +254 712 345 678</Text></View>
            <View style={styles.menuItem}><Text style={styles.menuLabel}>Address: Kisumu, Kenya</Text></View>
          </View>
        </ScrollView>
      );
    }

    if (profileSection === "Security & Privacy") {
      return (
        <ScrollView contentContainerStyle={styles.scrollPadding}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setProfileSection(null)} style={styles.backButton}>
              <ChevronLeft color={theme.colors.primary} size={28} />
            </TouchableOpacity>
            <Text style={[styles.brandText, { fontFamily: getFont("Syne_700Bold") }]}>Security</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.menuGroup}>
            <View style={styles.menuItem}><Text style={styles.menuLabel}>Two-Factor Auth: Enabled</Text></View>
            <View style={styles.menuItem}><Text style={styles.menuLabel}>Biometric Lock: Active</Text></View>
            <View style={styles.menuItem}><Text style={styles.menuLabel}>Wallet Encryption: AES-256</Text></View>
          </View>
        </ScrollView>
      );
    }

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigateTo("home")} style={styles.backButton}>
            <ChevronLeft color={theme.colors.primary} size={28} />
          </TouchableOpacity>
          <Text style={[styles.brandText, { fontFamily: getFont("Syne_700Bold") }]}>Profile</Text>
          <TouchableOpacity><Settings color={theme.colors.textSecondary} size={24} /></TouchableOpacity>
        </View>

        <View style={styles.profileHeader}>
          <View style={styles.profileAvatarLarge}>
            <Text style={[styles.profileAvatarTextLarge, { fontFamily: getFont("Syne_700Bold") }]}>JO</Text>
          </View>
          <Text style={[styles.profileName, { fontFamily: getFont("Syne_700Bold") }]}>James Oduya</Text>
          <Text style={[styles.profileEmail, { fontFamily: getFont("DMSans_400Regular") }]}>james.oduya@gmail.com</Text>
          <View style={styles.tierBadge}>
            <ShieldCheck size={14} color={theme.colors.primary} />
            <Text style={[styles.tierText, { fontFamily: getFont("DMSans_700Bold") }]}>Verified Member</Text>
          </View>
        </View>

        <View style={styles.walletAddressContainer}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.labelCaps, { marginBottom: 4, color: theme.colors.textSecondary }]}>WALLET ADDRESS</Text>
            <Text style={[styles.addressText, { fontFamily: getFont("JetBrainsMono_500Medium") }]}>0x7a2...4b9e</Text>
          </View>
          <TouchableOpacity style={styles.copyButton}>
            <Copy size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.menuGroup}>
          <MenuItem icon={<User size={22} color={theme.colors.primary} />} label="Personal Information" onPress={() => setProfileSection("Personal Information")} />
          <MenuItem icon={<ShieldCheck size={22} color={theme.colors.primary} />} label="Security & Privacy" onPress={() => setProfileSection("Security & Privacy")} />
          <MenuItem icon={<Bell size={22} color={theme.colors.primary} />} label="Notifications" />
          <MenuItem icon={<Headset size={22} color={theme.colors.primary} />} label="Help & Support" />
        </View>

        <TouchableOpacity style={styles.logoutButton}>
          <LogOut size={22} color={theme.colors.accentRed} />
          <Text style={[styles.logoutText, { fontFamily: getFont("DMSans_700Bold") }]}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>SafTap Beta v0.1.0</Text>
      </ScrollView>
    );
  };

  const renderMpesaSend = () => (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scrollPadding}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigateTo("payment")} style={styles.backButton}>
            <ChevronLeft color={theme.colors.primary} size={28} />
          </TouchableOpacity>
          <Text style={[styles.brandText, { fontFamily: getFont("Syne_700Bold") }]}>Send to M-Pesa</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.formContainer}>
          <Text style={[styles.label, { fontFamily: getFont("DMSans_400Regular") }]}>Recipient Phone Number</Text>
          <View style={styles.inputBox}>
            <TextInput 
              style={[styles.formInput, { fontFamily: getFont("JetBrainsMono_500Medium") }]} 
              placeholder="e.g. 0712345678" 
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>

          <Text style={[styles.label, { fontFamily: getFont("DMSans_400Regular"), marginTop: 24 }]}>Amount (KES)</Text>
          <View style={styles.inputBox}>
            <TextInput 
              style={[styles.formInput, { fontFamily: getFont("JetBrainsMono_500Medium") }]} 
              placeholder="0.00" 
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          <TouchableOpacity 
            style={[styles.primaryButton, (!phoneNumber || !amount) && styles.buttonDisabled]} 
            disabled={!phoneNumber || !amount || isProcessing}
            onPress={handlePayment}
          >
            {isProcessing ? <ActivityIndicator color={theme.colors.onPrimary} /> : <Text style={[styles.primaryButtonText, { fontFamily: getFont("DMSans_700Bold") }]}>Make Payment</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderPayBill = () => (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scrollPadding}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigateTo("payment")} style={styles.backButton}>
            <ChevronLeft color={theme.colors.primary} size={28} />
          </TouchableOpacity>
          <Text style={[styles.brandText, { fontFamily: getFont("Syne_700Bold") }]}>Pay Bill</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.formContainer}>
          <Text style={[styles.label, { fontFamily: getFont("DMSans_400Regular") }]}>Business Number</Text>
          <View style={styles.inputBox}>
            <TextInput 
              style={[styles.formInput, { fontFamily: getFont("JetBrainsMono_500Medium") }]} 
              placeholder="e.g. 888888" 
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              value={bizNumber}
              onChangeText={setBizNumber}
            />
          </View>

          <Text style={[styles.label, { fontFamily: getFont("DMSans_400Regular"), marginTop: 24 }]}>Account Number</Text>
          <View style={styles.inputBox}>
            <TextInput 
              style={[styles.formInput, { fontFamily: getFont("JetBrainsMono_500Medium") }]} 
              placeholder="e.g. ACC-123" 
              placeholderTextColor={theme.colors.textSecondary}
              value={accountNumber}
              onChangeText={setAccountNumber}
            />
          </View>

          <Text style={[styles.label, { fontFamily: getFont("DMSans_400Regular"), marginTop: 24 }]}>Amount (KES)</Text>
          <View style={styles.inputBox}>
            <TextInput 
              style={[styles.formInput, { fontFamily: getFont("JetBrainsMono_500Medium") }]} 
              placeholder="0.00" 
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          <TouchableOpacity 
            style={[styles.primaryButton, (!bizNumber || !accountNumber || !amount) && styles.buttonDisabled]} 
            disabled={!bizNumber || !accountNumber || !amount || isProcessing}
            onPress={handlePayment}
          >
            {isProcessing ? <ActivityIndicator color={theme.colors.onPrimary} /> : <Text style={[styles.primaryButtonText, { fontFamily: getFont("DMSans_700Bold") }]}>Make Payment</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderBuyGoods = () => (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scrollPadding}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigateTo("payment")} style={styles.backButton}>
            <ChevronLeft color={theme.colors.primary} size={28} />
          </TouchableOpacity>
          <Text style={[styles.brandText, { fontFamily: getFont("Syne_700Bold") }]}>Buy Goods</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.formContainer}>
          <Text style={[styles.label, { fontFamily: getFont("DMSans_400Regular") }]}>Till Number</Text>
          <View style={styles.inputBox}>
            <TextInput 
              style={[styles.formInput, { fontFamily: getFont("JetBrainsMono_500Medium") }]} 
              placeholder="e.g. 123456" 
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              value={tillNumber}
              onChangeText={setTillNumber}
            />
          </View>

          <Text style={[styles.label, { fontFamily: getFont("DMSans_400Regular"), marginTop: 24 }]}>Amount (KES)</Text>
          <View style={styles.inputBox}>
            <TextInput 
              style={[styles.formInput, { fontFamily: getFont("JetBrainsMono_500Medium") }]} 
              placeholder="0.00" 
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          <TouchableOpacity 
            style={[styles.primaryButton, (!tillNumber || !amount) && styles.buttonDisabled]} 
            disabled={!tillNumber || !amount || isProcessing}
            onPress={handlePayment}
          >
            {isProcessing ? <ActivityIndicator color={theme.colors.onPrimary} /> : <Text style={[styles.primaryButtonText, { fontFamily: getFont("DMSans_700Bold") }]}>Make Payment</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderRequest = () => (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scrollPadding}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigateTo("payment")} style={styles.backButton}>
            <ChevronLeft color={theme.colors.primary} size={28} />
          </TouchableOpacity>
          <Text style={[styles.brandText, { fontFamily: getFont("Syne_700Bold") }]}>Request Money</Text>
          <View style={{ width: 40 }} />
        </View>

        {!showRateConfirm ? (
          <View style={styles.formContainer}>
            <Text style={[styles.label, { fontFamily: getFont("DMSans_400Regular") }]}>Request From (Phone/Wallet)</Text>
            <View style={styles.inputBox}>
              <TextInput 
                style={[styles.formInput, { fontFamily: getFont("JetBrainsMono_500Medium") }]} 
                placeholder="0x... or 07..." 
                placeholderTextColor={theme.colors.textSecondary}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>

            <Text style={[styles.label, { fontFamily: getFont("DMSans_400Regular"), marginTop: 24 }]}>Amount (KES)</Text>
            <View style={styles.inputBox}>
              <TextInput 
                style={[styles.formInput, { fontFamily: getFont("JetBrainsMono_500Medium") }]} 
                placeholder="0.00" 
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            <View style={styles.conversionBox}>
              <View style={styles.conversionHeader}>
                <Globe size={16} color={theme.colors.primary} />
                <Text style={[styles.conversionHeaderText, { fontFamily: getFont("DMSans_700Bold") }]}>LIVE MARKET ORACLE</Text>
              </View>
              <Text style={[styles.conversionRateText, { fontFamily: getFont("JetBrainsMono_500Medium") }]}>
                1 USDC = {marketRate.toFixed(2)} KES
              </Text>
              <Text style={styles.conversionSub}>Rates are updated every 5s from Chainlink</Text>
            </View>

            <TouchableOpacity 
              style={[styles.primaryButton, (!phoneNumber || !amount) && styles.buttonDisabled]} 
              disabled={!phoneNumber || !amount}
              onPress={() => setShowRateConfirm(true)}
            >
              <Text style={[styles.primaryButtonText, { fontFamily: getFont("DMSans_700Bold") }]}>Review Request</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>YOU WILL RECEIVE APPROX.</Text>
              <Text style={[styles.summaryValue, { fontFamily: getFont("Syne_700Bold") }]}>
                ${(parseFloat(amount) / marketRate).toLocaleString('en-US', {maximumFractionDigits: 2})} <Text style={{fontSize: 16}}>USDC</Text>
              </Text>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Requesting</Text>
                <Text style={styles.summaryRowValue}>{amount} KES</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Oracle Rate</Text>
                <Text style={[styles.summaryRowValue, { color: theme.colors.primary }]}>{marketRate.toFixed(2)} KES</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>Slippage Tol.</Text>
                <Text style={styles.summaryRowValue}>0.5%</Text>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.secondaryButton, { flex: 1 }]} 
                onPress={() => setShowRateConfirm(false)}
              >
                <Text style={[styles.secondaryButtonText, { fontFamily: getFont("DMSans_700Bold") }]}>Reject Rate</Text>
              </TouchableOpacity>
              <View style={{ width: 16 }} />
              <TouchableOpacity 
                style={[styles.primaryButton, { flex: 2, marginTop: 0 }]} 
                onPress={() => {
                  setIsProcessing(true);
                  setTimeout(() => {
                    setIsProcessing(false);
                    setShowRateConfirm(false);
                    navigateTo("success");
                  }, 2000);
                }}
              >
                {isProcessing ? <ActivityIndicator color={theme.colors.onPrimary} /> : <Text style={[styles.primaryButtonText, { fontFamily: getFont("DMSans_700Bold") }]}>Confirm & Send</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderSuccess = () => (
    <View style={[styles.flex, styles.centered, { padding: 40 }]}>
      <CheckCircle2 size={80} color={theme.colors.primary} style={{ marginBottom: 24 }} />
      <Text style={[styles.successTitle, { fontFamily: getFont("Syne_700Bold") }]}>Payment Successful</Text>
      <Text style={[styles.successSub, { fontFamily: getFont("DMSans_400Regular") }]}>Your SafTap payment has been processed and settled instantly.</Text>
      <TouchableOpacity 
        style={[styles.primaryButton, { width: '100%', marginTop: 40 }]} 
        onPress={() => {
          setAmount(""); setPhoneNumber(""); setBizNumber(""); setAccountNumber(""); setTillNumber("");
          navigateTo("home");
        }}
      >
        <Text style={[styles.primaryButtonText, { fontFamily: getFont("DMSans_700Bold") }]}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }}>
        {activeTab === "home" && renderHome()}
        {activeTab === "wallet" && renderWallet()}
        {activeTab === "history" && renderHistory()}
        {activeTab === "profile" && renderProfile()}
        {activeTab === "payment" && renderPayment()}
        {activeTab === "mpesa_send" && renderMpesaSend()}
        {activeTab === "paybill" && renderPayBill()}
        {activeTab === "buy_goods" && renderBuyGoods()}
        {activeTab === "request" && renderRequest()}
        {activeTab === "pochi" && renderPochi()}
        {activeTab === "success" && renderSuccess()}
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBg}>
              <CheckCircle2 size={50} color="#FFF" />
            </View>
            <Text style={[styles.modalTitle, { fontFamily: getFont("Syne_700Bold") }]}>Transaction Successful!</Text>
            <Text style={[styles.modalSub, { fontFamily: getFont("DMSans_400Regular") }]}>Your on-chain transfer has been settled.</Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowSuccessModal(false)}>
              <Text style={[styles.modalCloseText, { fontFamily: getFont("DMSans_700Bold") }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Nav */}
      {!["mpesa_send", "paybill", "buy_goods", "request", "success", "payment", "pochi"].includes(activeTab) && (
        <View style={styles.bottomNav}>
          <TabButton icon={<Home size={24} />} label="Home" active={activeTab === "home"} onPress={() => navigateTo("home")} />
          <TabButton icon={<Wallet size={24} />} label="Wallet" active={activeTab === "wallet"} onPress={() => navigateTo("wallet")} />
          <TabButton icon={<History size={24} />} label="History" active={activeTab === "history"} onPress={() => navigateTo("history")} />
          <TabButton icon={<User size={24} />} label="Profile" active={activeTab === "profile"} onPress={() => navigateTo("profile")} />
        </View>
      )}
    </SafeAreaView>
  );
}

// --- SUB-COMPONENTS ---

const MenuItem = ({ icon, label, onPress }: any) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuIconBox}>{icon}</View>
    <Text style={styles.menuLabel}>{label}</Text>
    <ChevronRight size={20} color={theme.colors.textSecondary} />
  </TouchableOpacity>
);

const ActivityItem = ({ title, sub, amount, type, category }: any) => (
  <View style={styles.listItem}>
    <View style={[styles.listIconBox, { backgroundColor: type === 'in' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 112, 8, 0.1)' }]}>
      {type === 'in' ? <ArrowDownLeft color={theme.colors.accentGreen} size={20} /> : <ArrowUpRight color={theme.colors.primary} size={20} />}
    </View>
    <View style={{ flex: 1 }}><Text style={styles.listTitle}>{title}</Text><Text style={styles.listSub}>{sub}</Text></View>
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={[styles.listAmount, { color: type === 'in' ? theme.colors.accentGreen : theme.colors.accentRed }]}>{amount}</Text>
      <View style={styles.categoryBadge}><Text style={styles.categoryText}>{category}</Text></View>
    </View>
  </View>
);

const QuickAmount = ({ value, current, onPress }: any) => (
  <TouchableOpacity 
    style={[styles.quickAmountBtn, current === value && styles.quickAmountBtnActive]} 
    onPress={() => onPress(value)}
  >
    <Text style={[styles.quickAmountText, current === value && styles.quickAmountTextActive]}>${value}</Text>
  </TouchableOpacity>
);

const ServiceCard = ({ label, sub, icon, active, onPress }: any) => (
  <TouchableOpacity style={[styles.serviceCard, active && { backgroundColor: theme.colors.surfaceLight }]} onPress={onPress}>
    <View style={[styles.serviceIconBox, active && { backgroundColor: theme.colors.primary }]}>{icon}</View>
    <Text style={styles.serviceLabel}>{label}</Text><Text style={styles.serviceSub}>{sub}</Text>
  </TouchableOpacity>
);

const QuickService = ({ label, icon, onPress }: any) => (
  <TouchableOpacity style={styles.quickServiceItem} onPress={onPress}>
    <View style={styles.quickServiceIconBox}>{icon}</View>
    <Text style={[styles.quickServiceLabel, { fontFamily: 'DMSans_500Medium' }]}>{label}</Text>
  </TouchableOpacity>
);

const TabButton = ({ icon, label, active, onPress }: any) => (
  <TouchableOpacity style={styles.tabButton} onPress={onPress}>
    <View style={[styles.tabIconContainer, active && styles.tabIconContainerActive]}>
      {React.cloneElement(icon, { color: active ? theme.colors.onPrimary : theme.colors.textSecondary })}
    </View>
    <Text style={[styles.tabLabel, active && { color: theme.colors.primary, fontWeight: '700' }]}>{label}</Text>
  </TouchableOpacity>
);

// --- STYLES ---

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  centered: { justifyContent: "center", alignItems: "center" },
  scrollPadding: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 120 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, marginTop: 10 },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
  brandText: { fontSize: 22, color: theme.colors.textMain },
  notificationBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
  notificationDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.accentRed, borderWidth: 2, borderColor: theme.colors.surface },
  
  welcomeText: { fontSize: 16, color: theme.colors.textSecondary, marginBottom: 24 },

  // Balance Card
  balanceCard: { borderRadius: 24, padding: 24, marginBottom: 24, shadowColor: theme.colors.secondary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8 },
  balanceHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  labelCaps: { fontSize: 10, letterSpacing: 1.5 },
  balanceContent: { },
  balanceValue: { fontSize: 32, color: '#FFF', marginBottom: 12 },
  usdcPill: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' },
  usdcPillText: { color: '#FFF', fontSize: 14 },
  liveText: { color: theme.colors.accentGreen, fontSize: 10 },

  // Home Actions
  homeActionGrid: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  scanBtn: { flex: 1.5, backgroundColor: theme.colors.primary, borderRadius: 24, padding: 24, alignItems: 'center', justifyContent: 'center' },
  scanIconBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  scanBtnText: { color: '#FFF', fontSize: 18 },
  rightActionColumn: { flex: 1, gap: 16 },
  smallActionBtn: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
  smallActionText: { color: theme.colors.textMain, fontSize: 14, marginTop: 8 },

  // Tips Card
  tipsCard: { flexDirection: 'row', backgroundColor: theme.colors.surface, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', gap: 16 },
  tipsIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(74, 222, 128, 0.1)', alignItems: 'center', justifyContent: 'center' },
  tipsContent: { flex: 1 },
  tipsTitle: { fontSize: 16, color: theme.colors.textMain, marginBottom: 4 },
  tipsSub: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 18 },

  // Visa Card (Wallet)
  visaCard: { height: 210, borderRadius: 24, padding: 24, justifyContent: 'space-between', marginBottom: 20 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  visaText: { color: '#FFF', fontSize: 20, fontStyle: 'italic' },
  cardChip: { width: 45, height: 35, backgroundColor: '#FFD700', borderRadius: 8, opacity: 0.8 },
  cardNumber: { color: '#FFF', fontSize: 22, letterSpacing: 2 },
  cardDetailsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cardLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 8, marginBottom: 4 },
  cardValue: { color: '#FFF', fontSize: 14 },
  useDifferentBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255, 112, 8, 0.05)', padding: 16, borderRadius: 16, marginBottom: 32 },
  useDifferentText: { color: theme.colors.primary, fontSize: 14 },

  depositSection: { backgroundColor: theme.colors.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: theme.colors.border },
  labelSmall: { fontSize: 10, color: theme.colors.textSecondary, letterSpacing: 1, marginBottom: 16 },
  amountInputBox: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingBottom: 16, marginBottom: 24 },
  currencySymbol: { fontSize: 32, color: theme.colors.primary, marginRight: 8 },
  mainAmountInput: { fontSize: 48, color: theme.colors.textMain, flex: 1 },
  quickAmountRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  quickAmountBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
  quickAmountBtnActive: { backgroundColor: 'rgba(255, 112, 8, 0.1)', borderColor: theme.colors.primary },
  quickAmountText: { fontSize: 16, color: theme.colors.textMain, fontWeight: '700' },
  quickAmountTextActive: { color: theme.colors.primary },
  confirmDepositBtn: { backgroundColor: theme.colors.primary, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  confirmDepositText: { color: '#FFF', fontSize: 16 },

  infoBox: { flexDirection: 'row', gap: 16, marginTop: 24, padding: 16 },
  infoIconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  infoTitle: { fontSize: 14, color: theme.colors.textMain, marginBottom: 4 },
  infoSub: { fontSize: 12, color: theme.colors.textSecondary, lineHeight: 18 },

  // History
  pageTitle: { fontSize: 28, color: theme.colors.textMain, marginBottom: 8 },
  pageSub: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 24 },
  historyTabs: { flexDirection: 'row', backgroundColor: theme.colors.surface, padding: 4, borderRadius: 12, marginBottom: 32, borderWidth: 1, borderColor: theme.colors.border },
  historyTab: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  historyTabActive: { backgroundColor: theme.colors.background, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  historyTabText: { fontSize: 14, color: theme.colors.textSecondary },
  historyTabTextActive: { color: theme.colors.textMain, fontWeight: '700' },
  dateHeader: { fontSize: 10, color: theme.colors.textSecondary, letterSpacing: 1, marginBottom: 16 },
  promoCard: { borderRadius: 24, padding: 24, marginTop: 32, overflow: 'hidden' },
  promoContent: { flex: 1, zIndex: 1 },
  promoTitle: { fontSize: 20, color: '#FFF', marginBottom: 12 },
  promoSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 20 },
  promoIcon: { position: 'absolute', right: -10, bottom: -10, opacity: 0.2 },

  // Payment Screen Styles
  sendBalanceSection: { alignItems: 'center', marginVertical: 32 },
  kesBalanceRow: { flexDirection: 'row', alignItems: 'baseline' },
  kesPrefix: { fontSize: 24, color: theme.colors.primary },
  kesAmount: { fontSize: 36, color: theme.colors.textMain },
  percentBadge: { backgroundColor: 'rgba(74, 222, 128, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 12 },
  percentText: { color: theme.colors.accentGreen, fontSize: 12 },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' },
  serviceCard: { width: (width - 56) / 2, backgroundColor: theme.colors.surface, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: theme.colors.border },
  serviceIconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: theme.colors.surfaceLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  serviceLabel: { color: theme.colors.textMain, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  serviceSub: { color: theme.colors.textSecondary, fontSize: 11 },
  payeeRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  payeeAvatarContainer: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: theme.colors.primary, padding: 2 },
  payeeAvatar: { flex: 1, backgroundColor: theme.colors.surfaceLight, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },

  // Quick Actions
  actionGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 32 },
  actionItem: { alignItems: 'center', flex: 1 },
  actionIconBox: { width: 60, height: 60, borderRadius: 18, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 1, borderColor: theme.colors.border },
  actionLabel: { fontSize: 12, color: theme.colors.textMain },

  // List
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, marginBottom: 16 },
  sectionTitle: { fontSize: 18, color: theme.colors.textMain },
  viewAll: { fontSize: 12, color: theme.colors.primary, textTransform: 'uppercase' },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
  listIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  listTitle: { fontSize: 16, color: theme.colors.textMain, marginBottom: 4 },
  listSub: { fontSize: 12, color: theme.colors.textSecondary },
  listAmount: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: theme.colors.background },
  categoryText: { fontSize: 10, color: theme.colors.textSecondary },

  // Profile Styles
  profileHeader: { alignItems: 'center', marginVertical: 32 },
  profileAvatarLarge: { width: 100, height: 100, borderRadius: 50, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 4, borderColor: theme.colors.primary },
  profileAvatarTextLarge: { fontSize: 36, color: theme.colors.primary },
  profileName: { fontSize: 24, color: theme.colors.textMain, marginBottom: 4 },
  profileEmail: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 16 },
  tierBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 112, 8, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  tierText: { color: theme.colors.primary, fontSize: 12 },
  walletAddressContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, padding: 20, borderRadius: 24, marginBottom: 24, borderWidth: 1, borderColor: theme.colors.border },
  addressText: { color: theme.colors.textMain, fontSize: 16 },
  copyButton: { padding: 8, backgroundColor: theme.colors.background, borderRadius: 12 },
  menuGroup: { gap: 12, marginBottom: 32 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, padding: 18, borderRadius: 20, gap: 16, borderWidth: 1, borderColor: theme.colors.border },
  menuIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, color: theme.colors.textMain, fontSize: 15 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(248, 113, 113, 0.2)', backgroundColor: theme.colors.surface },
  logoutText: { color: theme.colors.accentRed, fontSize: 16 },
  versionText: { textAlign: 'center', color: theme.colors.textSecondary, fontSize: 12, marginTop: 24 },

  // Form Styles
  formContainer: { marginTop: 20 },
  label: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 12 },
  inputBox: { backgroundColor: theme.colors.surface, borderRadius: 16, paddingHorizontal: 16, height: 60, justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
  formInput: { fontSize: 18, color: theme.colors.textMain },
  primaryButton: { backgroundColor: theme.colors.primary, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  buttonDisabled: { opacity: 0.5 },
  successTitle: { fontSize: 24, color: theme.colors.textMain, marginBottom: 8 },
  successSub: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  // Request Screen Styles
  conversionBox: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 20, marginTop: 24, borderWidth: 1, borderColor: theme.colors.border },
  conversionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  conversionHeaderText: { color: theme.colors.primary, fontSize: 10, letterSpacing: 1 },
  conversionRateText: { color: theme.colors.textMain, fontSize: 20, marginBottom: 4 },
  conversionSub: { color: theme.colors.textSecondary, fontSize: 11 },
  summaryCard: { backgroundColor: theme.colors.surface, borderRadius: 24, padding: 24, marginBottom: 32, borderWidth: 1, borderColor: theme.colors.border },
  summaryLabel: { color: theme.colors.textSecondary, fontSize: 10, letterSpacing: 1, marginBottom: 12 },
  summaryValue: { color: theme.colors.textMain, fontSize: 32, marginBottom: 20 },
  divider: { height: 1, backgroundColor: theme.colors.border, marginBottom: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryRowLabel: { color: theme.colors.textSecondary, fontSize: 14 },
  summaryRowValue: { color: theme.colors.textMain, fontSize: 14, fontWeight: '700' },
  buttonRow: { flexDirection: 'row', alignItems: 'center' },
  secondaryButton: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  secondaryButtonText: { color: theme.colors.textMain, fontSize: 14 },

  bottomNav: { position: 'absolute', bottom: 20, left: 20, right: 20, height: 80, backgroundColor: theme.colors.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, borderRadius: 30, borderWidth: 1, borderColor: theme.colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabIconContainer: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  tabIconContainerActive: { backgroundColor: theme.colors.primary },
  tabLabel: { fontSize: 10, color: theme.colors.textSecondary },

  // Quick Services Grid
  quickServicesGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  quickServiceItem: { alignItems: 'center', width: (width - 40) / 4 },
  quickServiceIconBox: { width: 50, height: 50, borderRadius: 15, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 1, borderColor: theme.colors.border },
  quickServiceLabel: { fontSize: 11, color: theme.colors.textMain },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: theme.colors.surface, borderRadius: 32, padding: 32, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  modalIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.accentGreen, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, color: theme.colors.textMain, marginBottom: 12, textAlign: 'center' },
  modalSub: { fontSize: 15, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 32 },
  modalCloseBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 16, width: '100%', alignItems: 'center' },
  modalCloseText: { color: '#FFF', fontSize: 16 },
});
