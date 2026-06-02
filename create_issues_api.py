import json
import http.client
import sys

# Configuration
REPO = "Fern-Global/saftap"
ISSUES = [
    # UI/UX (Ivy)
    {"title": "[UI/UX] Design System Audit & Accessibility Review", "assignee": "ivyimoh", "labels": ["ui-ux", "enhancement"], "body": "Conduct a full audit of the current prototype. Establish a clear design system, typography hierarchy, and ensure WCAG accessibility standards are met."},
    {"title": "[UI/UX] Map out Offline and Edge-case states", "assignee": "ivyimoh", "labels": ["ui-ux", "design"], "body": "Design mockups for offline states, loading skeletons, payment failures, and network timeouts."},
    
    # Frontend (Michelle & Kimutai)
    {"title": "[Frontend] Refactor App.tsx into Component and Screen Directories", "assignees": ["Michelle8395", "HACKWITHNESBITT"], "labels": ["frontend", "refactor"], "body": "Refactor the large App.tsx into a modular architecture (/screens, /components, /hooks)."},
    {"title": "[Frontend] Implement React Navigation for multi-screen routing", "assignees": ["Michelle8395", "HACKWITHNESBITT"], "labels": ["frontend", "enhancement"], "body": "Migrate to React Navigation for proper routing and transitions."},
    {"title": "[Frontend] Setup robust state management (Zustand/Redux)", "assignee": "Michelle8395", "labels": ["frontend"], "body": "Implement global state to manage wallet and user data efficiently."},
    {"title": "[Frontend] Implement retry mechanisms for Payment QR Generation", "assignee": "HACKWITHNESBITT", "labels": ["frontend", "bug"], "body": "Add exponential backoff and retry UI for network failures."},
    {"title": "[Frontend] Add internationalization (i18n)", "assignee": "HACKWITHNESBITT", "labels": ["frontend", "enhancement"], "body": "Support English and Swahili for local and global users."},
    {"title": "[Frontend] Set up EAS build profiles for production", "assignee": "Michelle8395", "labels": ["frontend", "devops"], "body": "Configure EAS for iOS/Android production releases."},
    {"title": "[Frontend] Implement biometric authentication", "assignee": "Michelle8395", "labels": ["frontend", "security"], "body": "Add FaceID/TouchID support for merchant POS access."},
    {"title": "[Frontend] End-to-end integration tests setup (Detox/Maestro)", "assignee": "HACKWITHNESBITT", "labels": ["frontend", "testing"], "body": "Setup automated UI testing for critical payment flows."},

    # Backend (Andrew & Michelle)
    {"title": "[Backend] Implement structured logging (Pino/Winston)", "assignee": "carsonak", "labels": ["backend", "chore"], "body": "Replace console logs with a structured logger for centralized monitoring."},
    {"title": "[Backend] Set up Redis for rate limiting and token caching", "assignee": "carsonak", "labels": ["backend", "performance"], "body": "Cache Daraja tokens and implement distributed rate limiting."},
    {"title": "[Backend] Secure API with Zod/Joi validation", "assignee": "carsonak", "labels": ["backend", "security"], "body": "Strictly validate all incoming payloads to prevent injection attacks."},
    {"title": "[Backend] Set up CI/CD pipeline for tests and deployment", "assignee": "carsonak", "labels": ["backend", "devops"], "body": "Automate testing and deployments to Railway via GitHub Actions."},
    {"title": "[Backend] Implement database indexing and query optimization", "assignee": "carsonak", "labels": ["backend", "performance"], "body": "Add indexes to Prisma schema for transaction lookups and wallet IDs."},
    {"title": "[Backend] Add health checks and readiness probes", "assignee": "Michelle8395", "labels": ["backend"], "body": "Verify DB and M-PESA API status in the /health endpoint."},
    {"title": "[Backend] Create unified Swagger/OpenAPI documentation", "assignee": "Michelle8395", "labels": ["backend", "documentation"], "body": "Auto-generate interactive API docs for the mobile team."},
    {"title": "[Backend] Setup cron jobs for transaction reconciliation", "assignee": "carsonak", "labels": ["backend"], "body": "Implement a job to retry stuck or pending M-PESA payouts."},
    {"title": "[Backend] Implement API pagination for transaction history", "assignee": "Michelle8395", "labels": ["backend", "enhancement"], "body": "Add cursor-based pagination for transactions."},
    {"title": "[Backend] Harden security headers and strict CORS", "assignee": "carsonak", "labels": ["backend", "security"], "body": "Fine-tune helmet and CORS policies for production production."},

    # Blockchain (Richard)
    {"title": "[Blockchain] Migrate from Base Sepolia to Base Mainnet", "assignee": "ochola-rich", "labels": ["blockchain", "production"], "body": "Update clients and addresses for production mainnet support."},
    {"title": "[Blockchain] Implement Dead Letter Queue for failed txs", "assignee": "ochola-rich", "labels": ["blockchain", "reliability"], "body": "Route failed on-chain events to a DLQ for manual recovery."},
    {"title": "[Blockchain] Integrate KMS security for treasury keys", "assignee": "ochola-rich", "labels": ["blockchain", "security"], "body": "Use a secure vault (AWS KMS) instead of .env for signing keys."},
    {"title": "[Blockchain] Add dynamic gas price optimization", "assignee": "ochola-rich", "labels": ["blockchain", "performance"], "body": "Use gas oracles to dynamically adjust fees and prevent stuck txs."},
    {"title": "[Blockchain] Mitigate smart contract security risks", "assignee": "ochola-rich", "labels": ["blockchain", "security"], "body": "Audit vault contracts for reentrancy and unauthorized access."},
    {"title": "[Blockchain] Create a fail-safe circuit breaker", "assignee": "ochola-rich", "labels": ["blockchain", "security"], "body": "Implement an emergency pause mechanism on the liquidity bridge."},
    {"title": "[Blockchain] Implement real-time USDC price Oracle (Chainlink)", "assignee": "ochola-rich", "labels": ["blockchain"], "body": "Securely calculate KES/USDC exchange rates on-chain."},
    {"title": "[Blockchain] Setup Multi-Sig authorization (Gnosis Safe)", "assignee": "ochola-rich", "labels": ["blockchain", "security"], "body": "Transition treasury control to a Safe Core multi-sig wallet."},
]

def create_issue(token, issue):
    conn = http.client.HTTPSConnection("api.github.com")
    headers = {
        "Authorization": f"token {token}",
        "User-Agent": "Python-App",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
    }
    payload = json.dumps(issue)
    conn.request("POST", f"/repos/{REPO}/issues", payload, headers)
    res = conn.getresponse()
    if res.status == 201:
        print(f"Success: {issue['title']}")
    else:
        print(f"Failed: {issue['title']} (Status: {res.status}) - {res.read().decode()}")
    conn.close()

if __name__ == "__main__":
    token = input("Enter your GitHub Personal Access Token (PAT): ").strip()
    if not token:
        print("Token is required.")
        sys.exit(1)
    
    print(f"Starting to create {len(ISSUES)} issues for {REPO}...")
    for issue in ISSUES:
        create_issue(token, issue)
    print("Done!")
