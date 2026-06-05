# SafTap

> **Bridging Global Liquidity to Local Commerce.**
> _The frictionless bridge for tourists to pay Kenyan merchants via USDC-to-M-PESA._

[![Project Track](https://img.shields.io/badge/Track-DeFi%20%26%20Finance-blueviolet?style=for-the-badge)](https://zone01kisumu.ke/)
[![Technical Execution](https://img.shields.io/badge/Status-Hackathon%20Prototype-success?style=for-the-badge)]()
[![Built With](https://img.shields.io/badge/Powered%20By-Blockchain%20%26%20M--PESA-00ADEE?style=for-the-badge)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## The Vision

**SafTap** is a real-time payment settlement engine designed for the Kenyan tourism ecosystem. We solve the "Last Mile" friction of international payments by allowing tourists to pay in digital dollars (USDC) while merchants receive instant settlement in Kenyan Shillings (KES) via M-PESA.

**The goal:** Make the blockchain invisible. No wallet setups, no seed phrases, and no crypto knowledge required for the user.

## The Problem

1. **High FX Fees:** Tourists lose 3-7% on foreign exchange bureaus or predatory bank card rates.
2. **Settlement Delays:** Merchants often wait days for international credit card settlements.
3. **Hardware Barriers:** Small-scale merchants (curio shops, local guides) cannot afford expensive POS terminals.
4. **Cash Risks:** Tourists carrying large amounts of cash are targets for theft.

## The Solution

SafTap acts as a **Liquidity Bridge**:

- **Tourist Side:** A "Scan-to-Pay" web interface that handles USDC transfers behind the scenes.
- **Middle Layer:** A blockchain monitor that detects on-chain transactions and triggers instant liquidity release.
- **Merchant Side:** Receives standard M-PESA KES directly to their phone, exactly like a local transaction.

---

## How It Works

1. **Invoice Generation:** The merchant enters the KES amount in the SafTap Mobile App.
2. **QR Trigger:** The app generates a dynamic QR code containing the KES-to-USDC conversion (via real-time Oracles).
3. **Payment:** The tourist scans and authorizes a USDC transfer (Stablecoin).
4. **Settlement:** The SafTap backend detects the on-chain success and instantly triggers an M-PESA B2C/C2B payout to the merchant's till.

---

## Technical Architecture

### Apps & Packages

- `frontend`: **SoftPOS Interface.** A React Native (Expo) app for merchants to manage sales and generate payment QRs.
- `apps/backend`: **The Settlement Engine.** A Node.js/TypeScript service that monitors the blockchain and integrates with the M-PESA Daraja API.
- `packages/shared`: **The Core Logic.** Shared types, constants, and utility functions for cross-platform consistency.

### Blockchain Layer

- **Currency:** USDC (Stable, Liquid, Global).
- **Network:** Ethereum L2 (Polygon/Base/Celo) for sub-cent transaction fees.
- **Monitoring:** Real-time event listeners watching the "Liquidity Vault" for incoming tourist funds.

---

## Tech Stack

| Layer          | Technology                     |
| :------------- | :----------------------------- |
| **Frontend**   | React Native, Expo, TypeScript |
| **Backend**    | Node.js, Express, ethers.js    |
| **Blockchain** | Solidity, USDC, L2 Networks    |
| **Payments**   | Safaricom M-PESA Daraja API    |
| **Monorepo**   | Turborepo, pnpm                |

---

## Installation & Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-repo/saftap.git
   cd saftap
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Configure Environment:**
   Create `.env` files in `apps/backend` and `frontend` based on the provided `.env.example`.

4. **Run the project:**

   ```bash
   # Start all services
   pnpm dev
   ```

---

## Hackathon Context

This project was built for the **Zone01 Kisumu On-Chain Hackathon** (May 2026) at LakeBasin Mall.

- **Track:** DeFi & Finance
- **Focus:** Financial Inclusion & Regional Tourism Impact.

## The Team

- **Team SafTap** - _Full-stack Development & Blockchain Architecture_

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

_Built with pride in Kisumu for the Global Traveler._
