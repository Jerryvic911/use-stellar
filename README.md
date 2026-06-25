# use-stellar

React hooks for the Stellar network. The simplest way to build dApps on Stellar.

```bash
pnpm install use-stellar
```

---

## The problem

Building a React app on Stellar means writing the same boilerplate every time — wallet connection, balance fetching, transaction submission, account loading. Every developer solves this from scratch.

`use-stellar` is the shared solution. One package. Clean hooks. Works with any React or Next.js app.

---

## Quick start

Wrap your app in `StellarProvider`, then use any hook:

```tsx
import { StellarProvider, useWallet, useBalance } from "use-stellar";

function App() {
  return (
    <StellarProvider network="testnet">
      <Wallet />
    </StellarProvider>
  );
}

function Wallet() {
  const { connect, address, connected } = useWallet();
  const { balance }                     = useBalance({ asset: "XLM" });

  if (!connected) {
    return <button onClick={() => connect()}>Connect Freighter</button>;
  }

  return <p>{address} — {balance} XLM</p>;
}
```

---

## Hooks

| Hook | Description |
|---|---|
| `useWallet` | Connect / disconnect Freighter, expose address and network |
| `useBalance` | Fetch XLM or any asset balance for an address |
| `useAccount` | Full account info — balances, sequence, signers, thresholds |
| `useSendPayment` | Send XLM or USDC, handles signing and submission |
| `useTransaction` | Fetch and watch a transaction by hash |
| `useNetwork` | Current network, Horizon and Soroban RPC URLs |
| `useAsset` | Asset metadata — supply, issuer, home domain, flags |
| `useSorobanContract` | Call a read function on any deployed Soroban contract |

---

## Examples

### Check a balance

```tsx
import { useBalance } from "use-stellar";

function Balance() {
  const { balance, loading, error } = useBalance({
    address: "G...",   // or omit to use connected wallet address
    asset:   "XLM",
    watch:   true,     // auto-refresh every 10s
  });

  if (loading) return <p>Loading...</p>;
  if (error)   return <p>Error: {error}</p>;
  return <p>{balance} XLM</p>;
}
```

### Send a payment

```tsx
import { useSendPayment } from "use-stellar";

function SendButton() {
  const { send, loading, error, result } = useSendPayment();

  async function handleSend() {
    await send({
      to:     "GDEST...",
      asset:  "XLM",
      amount: "10",
      memo:   "thanks",
    });
  }

  if (result)  return <p>Sent! tx: {result.hash}</p>;
  if (loading) return <p>Sending...</p>;
  return <button onClick={handleSend}>Send 10 XLM</button>;
}
```

### Watch a transaction

```tsx
import { useTransaction } from "use-stellar";

function TxStatus({ hash }: { hash: string }) {
  const { transaction } = useTransaction({ hash, watch: true });

  return <p>Status: {transaction?.status ?? "pending"}</p>;
}
```

### Load account info

```tsx
import { useAccount } from "use-stellar";

function Account() {
  const { account, loading } = useAccount();

  if (loading || !account) return null;

  return (
    <div>
      <p>Sequence: {account.sequence}</p>
      <p>Subentries: {account.subentryCount}</p>
      <p>Balances: {account.balances.length}</p>
    </div>
  );
}
```

---

## StellarProvider

Wrap your app once at the root:

```tsx
import { StellarProvider } from "use-stellar";

<StellarProvider network="testnet">
  <App />
</StellarProvider>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `network` | `"testnet" \| "mainnet"` | `"testnet"` | Stellar network to connect to |

---

## Next.js App Router (SSR)

`use-stellar` is safe to import in server components — it never touches `window` or wallet extension APIs at module load time. However, wallet connection and transaction signing are browser-only, so any component that calls `useWallet`, `useSendPayment`, or other interactive hooks must be a client component.

### Pattern

Create a thin client wrapper for the provider and your interactive components:

```tsx
// app/providers.tsx
"use client";
import { StellarProvider } from "use-stellar";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StellarProvider network="testnet">
      {children}
    </StellarProvider>
  );
}
```

```tsx
// app/layout.tsx
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

```tsx
// app/wallet-button.tsx
"use client";
import { useWallet } from "use-stellar";

export function WalletButton() {
  const { connect, disconnect, connected, address } = useWallet();

  return connected
    ? <button onClick={disconnect}>{address}</button>
    : <button onClick={() => connect()}>Connect Freighter</button>;
}
```

### Server-side behaviour

| Hook | Server-side behaviour |
|---|---|
| `StellarProvider` | Renders normally, no browser APIs used |
| `useWallet` | Returns disconnected state; `connect()` sets a clear error |
| `useBalance`, `useAccount`, `useTransaction`, `useAsset` | Fetch via Horizon — works server-side if an address is supplied |
| `useSendPayment` | `send()` throws a clear error if called before hydration |
| `useNetwork` | Pure context read — always safe |
| `isBrowser()` | Utility exported for your own SSR guards |

---

## Supported wallets

| Wallet | Status |
|---|---|
| Freighter | ✅ Supported |
| Albedo | Open issue — contributions welcome |
| Rabet | Open issue — contributions welcome |
| xBull | Open issue — contributions welcome |

---

## Project structure

```
use-stellar/
├── packages/
│   ├── core/       ← the hooks library (published to npm as use-stellar)
│   │   └── src/
│   │       ├── hooks/        ← one file per hook
│   │       ├── context/      ← StellarProvider
│   │       ├── types/        ← all TypeScript types
│   │       └── utils/        ← shared helpers
│   └── demo/       ← Next.js demo app (live at use-stellar.dev)
└── .github/        ← CI, issue templates
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). All contributions welcome — new hooks, new wallets, tests, docs. TypeScript only — no Rust or blockchain expertise needed.

---

## Roadmap

- [x] `useWallet` — Freighter connect / disconnect
- [x] `useBalance` — XLM and issued asset balances
- [x] `useAccount` — full account info
- [x] `useSendPayment` — sign and submit payments
- [x] `useTransaction` — fetch and watch by hash
- [x] `useNetwork` — network config
- [x] `useAsset` — asset metadata
- [x] `useSorobanContract` — read contract state
- [ ] Albedo wallet support
- [ ] Rabet wallet support
- [ ] `useOrderBook` — DEX order book data
- [ ] `usePaymentHistory` — paginated payment history
- [ ] `useTrustline` — add / remove trustlines
- [ ] React Native support

---

## License

MIT
