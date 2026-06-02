#!/bin/bash

# Ensure gh CLI is installed
if ! command -v gh &> /dev/null
then
    echo "gh CLI could not be found. Please install it, run 'gh auth login', and then try again."
    exit 1
fi

echo "Creating UI/UX Issues..."
gh issue create --title "[UI/UX] Design System Audit & Accessibility Review" --body "Conduct a full audit of the current prototype. Establish a clear design system, typography hierarchy, and ensure WCAG accessibility standards are met for color contrast and screen readers." --assignee "ivyimoh" --label "enhancement,ui-ux"
gh issue create --title "[UI/UX] Map out Offline and Edge-case states" --body "Design comprehensive mockups for offline states, loading skeletons, payment failures, and network timeouts. Crucial for a robust real-world experience." --assignee "ivyimoh" --label "ui-ux,design"

echo "Creating Frontend Issues..."
gh issue create --title "[Frontend] Refactor App.tsx into Component and Screen Directories" --body "The current App.tsx is too large (~60KB). Refactor it into a modular architecture using /screens, /components, /hooks, and /utils." --assignee "Michelle8395,HACKWITHNESBITT" --label "refactor,frontend"
gh issue create --title "[Frontend] Implement React Navigation for multi-screen routing" --body "Migrate from manual conditional rendering to React Navigation for proper routing, deep linking, and screen transitions." --assignee "Michelle8395,HACKWITHNESBITT" --label "enhancement,frontend"
gh issue create --title "[Frontend] Setup robust state management for Wallet and User Data" --body "Implement Zustand or Redux to handle global state. Eliminate prop drilling and manage wallet authentication state cleanly." --assignee "Michelle8395" --label "frontend"
gh issue create --title "[Frontend] Implement retry mechanisms for Payment QR Generation" --body "Add exponential backoff and retry UI if the QR generation or price conversion oracle fails due to network issues." --assignee "HACKWITHNESBITT" --label "bug,frontend"
gh issue create --title "[Frontend] Add internationalization (i18n)" --body "Set up i18n to support at minimum English and Swahili to cater to local merchants and international tourists." --assignee "HACKWITHNESBITT" --label "enhancement,frontend"
gh issue create --title "[Frontend] Set up EAS build profiles for production" --body "Configure expo-application-services (EAS) for seamless CI/CD builds for iOS and Android production releases." --assignee "Michelle8395" --label "devops,frontend"
gh issue create --title "[Frontend] Implement biometric authentication" --body "Add support for FaceID and TouchID (via expo-local-authentication) for merchants opening the POS dashboard." --assignee "Michelle8395" --label "security,frontend"
gh issue create --title "[Frontend] End-to-end integration tests setup" --body "Setup a testing framework like Detox or Maestro to run automated UI workflows simulating the merchant payment process." --assignee "HACKWITHNESBITT" --label "testing,frontend"

echo "Creating Backend Issues..."
gh issue create --title "[Backend] Implement structured logging" --body "Replace all console.log/error statements with a structured logger like Pino or Winston. Stream logs to a centralized service." --assignee "carsonak" --label "backend,chore"
gh issue create --title "[Backend] Set up Redis for rate limiting and token caching" --body "Integrate a Redis cache layer for the Daraja API token to avoid limits, and manage distributed rate limiting across backend instances." --assignee "carsonak" --label "performance,backend"
gh issue create --title "[Backend] Secure API with comprehensive input validation" --body "Use Zod or Joi to validate all incoming API payloads strictly to prevent injection attacks and ensure type safety." --assignee "carsonak" --label "security,backend"
gh issue create --title "[Backend] Set up CI/CD pipeline for linting, testing, and deployment" --body "Create GitHub Actions workflows that run the test suite, lint code, and handle automated deployments to Railway." --assignee "carsonak" --label "devops,backend"
gh issue create --title "[Backend] Implement database indexing and query optimization" --body "Analyze Prisma queries and add the necessary indexes to the PostgreSQL schema (especially on transaction lookups and wallet IDs)." --assignee "carsonak" --label "performance,backend"
gh issue create --title "[Backend] Add health checks and readiness probes" --body "Enhance the /health endpoint to verify DB connectivity and M-PESA API status before reporting 'Healthy'." --assignee "Michelle8395" --label "backend,good first issue"
gh issue create --title "[Backend] Create unified Swagger/OpenAPI documentation" --body "Add Swagger UI to auto-generate and host interactive API documentation for frontend and mobile teams." --assignee "Michelle8395" --label "documentation,backend"
gh issue create --title "[Backend] Setup cron jobs for transaction reconciliation" --body "Implement a CRON job to reconcile stuck or pending M-PESA payouts and retry them if they timed out." --assignee "carsonak" --label "backend"
gh issue create --title "[Backend] Implement API pagination for transaction history" --body "Add cursor-based or offset-based pagination to the transactions and wallet history endpoints." --assignee "Michelle8395" --label "backend,enhancement"
gh issue create --title "[Backend] Harden security headers and strict CORS" --body "Fine-tune helmet and CORS policies. Ensure only trusted domains (and the mobile app's origin) can access the API in production." --assignee "carsonak" --label "security,backend"

echo "Creating Blockchain Issues..."
gh issue create --title "[Blockchain] Migrate from Base Sepolia to Base Mainnet" --body "Update the viem clients, RPC URLs, and Smart Contract addresses to support production Base Mainnet." --assignee "ochola-rich" --label "blockchain,production"
gh issue create --title "[Blockchain] Implement Dead Letter Queue for failed txs" --body "If an on-chain transaction or the corresponding M-PESA payout fails, route it to a DLQ for manual or automated recovery." --assignee "ochola-rich" --label "blockchain,reliability"
gh issue create --title "[Blockchain] Integrate KMS security for treasury keys" --body "Remove raw private keys from .env. Integrate AWS KMS or a similar secure vault to sign viem transactions." --assignee "ochola-rich" --label "blockchain,security"
gh issue create --title "[Blockchain] Add dynamic gas price optimization" --body "Implement gas oracles to dynamically adjust gas fees, preventing stuck transactions during network congestion." --assignee "ochola-rich" --label "blockchain,performance"
gh issue create --title "[Blockchain] Mitigate smart contract security risks" --body "Ensure the liquidity vault contracts are audited and immune to reentrancy, flash loan attacks, and unauthorized withdrawals." --assignee "ochola-rich" --label "blockchain,security"
gh issue create --title "[Blockchain] Create a fail-safe circuit breaker" --body "Implement an emergency pause mechanism on the Liquidity Bridge that halts all outflows if an anomaly is detected." --assignee "ochola-rich" --label "blockchain,security"
gh issue create --title "[Blockchain] Implement real-time USDC price Oracle" --body "Integrate Chainlink price feeds to securely and accurately calculate the KES/USDC exchange rate dynamically." --assignee "ochola-rich" --label "blockchain"
gh issue create --title "[Blockchain] Implement on-chain analytics monitoring" --body "Create scripts to index and monitor transaction volume, treasury reserves, and gas usage for the dashboard." --assignee "ochola-rich" --label "blockchain"
gh issue create --title "[Blockchain] Setup Multi-Sig authorization" --body "Transition the treasury control to a Gnosis Safe (Safe Core) multi-sig wallet to prevent single-point-of-failure key compromises." --assignee "ochola-rich" --label "blockchain,security"
gh issue create --title "[Blockchain] Cross-chain compatibility architecture" --body "Abstract the viem configuration to support multiple L2 networks (e.g., Celo, Polygon) seamlessly in the future." --assignee "ochola-rich" --label "blockchain,architecture"

echo "All issues have been scheduled to create on GitHub!"
