# SafTap Technical & Business Documentation

## 1. Executive Summary

**SafTap** is a decentralized "SoftPOS" (Software Point of Sale) and liquidity bridge designed to solve the "Last Mile" friction of international payments in emerging markets. By connecting global digital liquidity (**USDC**) directly to local mobile money networks (**M-PESA**), SafTap enables international tourists to pay local merchants instantly, safely, and with significantly lower fees than traditional banking systems.

The core philosophy of SafTap is the **"Invisible Blockchain"**: providing the security and efficiency of decentralized finance (DeFi) without requiring users or merchants to understand the underlying technology.

---

## 2. The Problem Statement

### 2.1 For the Tourist (The Payer)

- **Predatory Fees:** Tourists typically lose 3–7% on currency conversion at bureaus or through international card "foreign transaction fees."
- **Cash Dependency:** Many local merchants do not have card terminals, forcing tourists to carry large, risky amounts of physical cash.
- **ATM Barriers:** International ATM withdrawals in Kenya often carry high flat fees ($5+) plus a percentage of the withdrawal.

### 2.2 For the Local Merchant (The Payee)

- **Hardware Costs:** Traditional Point-of-Sale (POS) hardware is expensive to buy and maintain.
- **Settlement Lag:** International credit card payments often take 3–5 business days to settle into a merchant's bank account.
- **Financial Exclusion:** Small-scale artisans and tour guides often lack the formal banking status required to acquire traditional POS systems.

---

## 3. The Solution: The SafTap Bridge

SafTap operates as a real-time settlement engine that abstracts away the complexity of cross-border transfers.

### 3.1 The Workflow

1. **Invoice:** The merchant enters a KES amount in the SafTap Mobile App.
2. **QR Trigger:** The app pulls real-time oracle data (Chainlink/Pyth) to calculate the USDC equivalent and generates a dynamic QR code.
3. **Payment:** The tourist scans the QR and authorizes a USDC transfer via a high-speed Layer 2 blockchain (Base, Polygon, or Celo).
4. **Settlement:** The SafTap backend detects the on-chain success and instantly triggers an M-PESA B2C payout to the merchant's phone.

---

## 4. The Economic Model: Why It Works

A critical component of SafTap's viability is the **"Pre-Funded Travel Wallet"** model.

### 4.1 Home vs. Stall Conversion

SafTap is most economical when tourists "Pre-Load" their wallets before their trip.

| Feature          | Home Conversion (ACH/Bank)       | Stall Conversion (Credit Card)     |
| :--------------- | :------------------------------- | :--------------------------------- |
| **Method**       | Bank Transfer to Coinbase/Kraken | Instant On-Ramp (MoonPay/Stripe)   |
| **Fee**          | ~0% (ACH is usually free)        | 3.9% - 5.0% + Minimum Fees         |
| **KYC**          | Done once at home                | Done at the counter (Slow/Awkward) |
| **Economic Fit** | **The SafTap Standard**          | **Emergency Use Only**             |

### 4.2 Cost Comparison ($10 Purchase)

| Payment Method       | Total Money Lost to Middlemen | Settlement Time |
| :------------------- | :---------------------------- | :-------------- |
| **Traditional Card** | ~$0.70 (7%)                   | 3-5 Days        |
| **Cash (Exchange)**  | ~$0.60 (6%)                   | Instant         |
| **SafTap (L2)**      | **$0.10 (1%)**                | **< 5 Seconds** |

---

## 5. Technical Architecture

### 5.1 System Components

- **`frontend` (Merchant App):** Built with React Native (Expo), providing a SoftPOS interface for invoice generation and transaction history.
- **`apps/backend` (Settlement Engine):** A Node.js/TypeScript service that:
  - Monitors the blockchain for incoming USDC events.
  - Manages the "Liquidity Vault."
  - Integrates with Safaricom’s **Daraja API** for M-PESA payouts.
- **`packages/shared`:** Shared TypeScript types and utility functions (e.g., KES/USDC conversion logic).

### 5.2 The "Invisible" Web3 Stack

- **Layer 2 (L2) Networks:** Utilizing Base, Polygon, or Celo to ensure transaction fees are <$0.01 and finality is reached in seconds.
- **Gasless Transactions:** Using **Account Abstraction (ERC-4337)** and **Paymasters**. The user only needs USDC; SafTap's infrastructure handles the native gas fees (ETH/MATIC) in the background.
- **Real-Time Monitoring:** A WebSocket-based event listener that triggers the M-PESA API the moment a block is confirmed.

---

## 6. Target Market

1. **Primary:** Informal and semi-formal tourism vendors (Maasai Markets, curio shops, independent tour guides).
2. **Secondary:** Digital Nomads and long-term expats living in Kenya who hold digital assets.
3. **Strategic Partners:** Boutique hotels and "glamping" sites that want to offer a modern, tech-forward payment experience.

---

## 7. Future Roadmap

- **Phase 1:** Pilot in Kisumu and Nairobi with 50 selected vendors.
- **Phase 2:** Multi-stablecoin support (EURC, PYUSD) and integration with other regional mobile money (Airtel Money, MTN).
- **Phase 3:** "Pay-in-KES" for locals to send money to international vendors (The Reverse Bridge).

---

_Developed for the Zone01 Kisumu On-Chain Hackathon (2026)._
