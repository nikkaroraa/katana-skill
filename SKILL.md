---
name: katana
description: "DeFi operations on Katana L2. Use for token balances, yield opportunities, swaps, deposits, withdrawals, and portfolio management on Katana network."
metadata:
  openclaw:
    emoji: "⚔️"
    requires:
      bins: ["node"]
---

# Katana DeFi Skill

Interact with Katana L2 (Chain ID: 747474) for DeFi operations.

## Network Info

- **Chain ID:** 747474
- **RPC:** https://rpc.katana.network
- **Explorer:** https://katanascan.com
- **Core Protocols:** Sushi (DEX), Morpho (Lending), Yearn (Vaults), Agora (AUSD)

## Setup

```bash
cd ~/.openclaw/skills/katana
pnpm install  # Install viem + tsx
export KATANA_WALLET="0x..."  # Your wallet address
```

## Quick Commands

### Network Status

```bash
./scripts/katana-cli.sh info
```

### Check Token Balances

```bash
./scripts/katana-cli.sh balance
./scripts/katana-cli.sh balance --token ETH
./scripts/katana-cli.sh balance --wallet 0x...
```

### View Yield Opportunities

```bash
./scripts/katana-cli.sh yields
./scripts/katana-cli.sh yields --min-apy 10
```

### Portfolio Overview

```bash
./scripts/katana-cli.sh portfolio
./scripts/katana-cli.sh portfolio --wallet 0x...
```

## Supported Tokens

| Token | Address | Decimals |
|-------|---------|----------|
| ETH | Native | 18 |
| WETH | 0xee7d...ab62 | 18 |
| USDC | 0x203a...0d36 | 6 |
| USDT | 0x2dca...d2f2 | 6 |
| AUSD | 0x0000...012a | 18 |
| WBTC | 0x0913...2cf52 | 8 |
| wstETH | 0x7fb4...5c8c | 18 |
| weETH | 0x9893...c19a7 | 18 |
| KAT | 0x7f1f...dc2d | 18 |
| MORPHO | 0x1e5e...e4e | 18 |

## Core Contracts

| Protocol | Contract | Address |
|----------|----------|---------|
| Sushi V3 Router | DEX | 0x4e1d...376c |
| Sushi RouteProcessor | Aggregator | 0x3ced...4c14c |
| Morpho Blue | Lending | 0xd50f...8abc |
| MetaMorpho Factory | Vaults | 0xd3f3...904b |
| Unified Bridge | Bridge | 0x2a3d...2ede |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `KATANA_WALLET` | Your wallet address | - |
| `KATANA_RPC_URL` | Custom RPC endpoint | `https://rpc.katana.network` |
| `KATANA_PRIVATE_KEY` | For signing (future) | - |

## Architecture

The skill uses:
- **viem** for RPC calls to Katana L2
- **tsx** for TypeScript execution
- Bash fallback for environments without Node.js

Data sources:
- Token balances: Live RPC calls (✅ Phase 3)
- Yield rates: Estimated (TODO: Morpho API)
- Positions: Coming soon (TODO: Contract reads)

## Transaction Commands

> ⚠️ Transaction signing not yet implemented

For swaps, use Sushi directly:
https://www.sushi.com/swap?chainId=747474

## Related Links

- [Katana Docs](https://docs.katana.network)
- [KatanaScan](https://katanascan.com)
- [Sushi on Katana](https://www.sushi.com/swap?chainId=747474)
