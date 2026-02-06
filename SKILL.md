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

Interact with Katana L2 for DeFi operations.

## Setup

```bash
cd /path/to/katana-skill
pnpm install  # Install viem + tsx
export KATANA_WALLET="0x..."
export KATANA_RPC_URL="https://rpc.katana.network"  # Optional
```

## Quick Commands

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

## Transaction Commands

> ⚠️ Require wallet signing (not yet implemented)

```bash
./scripts/katana-cli.sh swap 100 USDC to ETH
./scripts/katana-cli.sh deposit 1000 USDC into usdc-lending
./scripts/katana-cli.sh withdraw 500 from usdc-lending
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `KATANA_WALLET` | Your wallet address | - |
| `KATANA_RPC_URL` | Katana L2 RPC endpoint | `https://rpc.katana.network` |
| `KATANA_PRIVATE_KEY` | For signing transactions | - |

## Supported Tokens

- ETH (native)
- WETH
- USDC
- USDT
- DAI

## Yield Pools

| Pool | Token | Risk |
|------|-------|------|
| eth-staking | ETH | Low |
| usdc-lending | USDC | Low |
| eth-usdc-lp | ETH-USDC | Medium |
| wbtc-eth-lp | WBTC-ETH | Medium |

## Architecture

The skill uses:
- **viem** for Ethereum/L2 RPC calls
- **tsx** for TypeScript execution
- Bash fallback for environments without Node.js

Data sources:
- Token balances: Direct RPC calls
- Yield rates: Katana API (with fallback to cached data)
- Positions: Contract reads (when wallet configured)
