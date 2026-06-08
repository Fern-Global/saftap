import { app } from "./app.js";
import { isMockCryptoWalletEnabled } from "./config/crypto-wallet.js";
import { env } from "./config/env.js";

const port = env.PORT;

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
  console.log(`Crypto wallet mode: ${isMockCryptoWalletEnabled() ? "mock" : "real"}`);
});
