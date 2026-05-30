const BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000";

function timestamp(): string {
  return new Date().toISOString();
}

function log(message: string): void {
  console.log(`[${timestamp()}] ${message}`);
}

type FetchResponse = {
  ok: boolean;
  status: number;
  statusText: string;
  text(): Promise<string>;
};

async function safeJson(response: FetchResponse): Promise<unknown> {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

async function apiRequest<T>(path: string, options: any = {}): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const response = (await fetch(url, options)) as FetchResponse;
  const body = await safeJson(response);

  if (!response.ok) {
    const message = typeof body === "object" && body !== null ? JSON.stringify(body) : String(body);
    throw new Error(`API request failed ${response.status} ${response.statusText}: ${message}`);
  }

  return body as T;
}

async function main(): Promise<void> {
  log("Starting Saftap E2E demo...");

  log("Step A: Registering tourist user...");
  const registerResponse = await apiRequest<{
    user: { id: string; email: string; phone: string; walletAddress: string };
    token: string;
  }>("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: `tourist+${Date.now()}@example.com`,
      phone: "+254700000001",
      password: "TestPassword123!",
    }),
  });

  log(`Registered tourist wallet: ${registerResponse.user.walletAddress}`);
  log(`Received JWT token: ${registerResponse.token}`);

  const authHeaders = {
    Authorization: `Bearer ${registerResponse.token}`,
    "Content-Type": "application/json",
  };

  log("Step B: Funding wallet with 10 USDC...");
  const fundResponse = await apiRequest<{ txHash: string }>("/api/wallet/fund", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ amountUsdc: 10 }),
  });

  log(`Fund transaction hash: ${fundResponse.txHash}`);
  log(`Sepolia BaseScan: https://sepolia.basescan.org/tx/${fundResponse.txHash}`);

  log("Step C: Fetching wallet balance...");
  const balanceResponse = await apiRequest<{ balanceUsdc: string }>("/api/wallet/balance", {
    method: "GET",
    headers: authHeaders,
  });

  log(`Tourist balance: ${Number(balanceResponse.balanceUsdc).toFixed(2)} USDC`);

  log("Step D: Fetching current USD/KES exchange rate...");
  const rateResponse = await apiRequest<{ rate: number }>("/api/payment/rate", {
    method: "GET",
    headers: authHeaders,
  });

  log(`Live USD/KES exchange rate: ${rateResponse.rate}`);

  log("Step E: Initiating 5 USDC M-Pesa payment...");
  const paymentResponse = await apiRequest<{ id: string }>("/api/payment/initiate", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      destinationPhone: "+254712345678",
      amountUsdc: 5,
    }),
  });

  log(`Payment transaction created: ${paymentResponse.id}`);

  log("Step F: Polling transaction status until COMPLETED...");
  const transactionId = paymentResponse.id;
  const deadline = Date.now() + 60_000;
  let transactionStatus = "PENDING";
  let transactionRecord: { status: string; amountKes?: number; darajaReceiptId?: string } | null =
    null;

  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      transactionRecord = await apiRequest<{
        status: string;
        amountKes?: number;
        darajaReceiptId?: string;
      }>(`/api/payment/${transactionId}`, {
        method: "GET",
        headers: authHeaders,
      });

      transactionStatus = transactionRecord.status;
      log(`Transaction ${transactionId} status: ${transactionStatus}`);

      if (transactionStatus === "COMPLETED") {
        break;
      }
    } catch (error) {
      log(`Polling error: ${(error as Error).message}`);
      break;
    }
  }

  if (transactionStatus !== "COMPLETED") {
    throw new Error("Transaction did not complete within 60 seconds");
  }

  log(
    `Payment complete! Recipient received KES ${transactionRecord?.amountKes ?? "unknown"}. M-Pesa receipt: ${
      transactionRecord?.darajaReceiptId ?? "unknown"
    }`
  );
}

main().catch((error) => {
  console.error(`[${timestamp()}] Demo failed:`, error instanceof Error ? error.message : error);
  process.exit(1);
});
