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

Interact with Katana L2 for DeFi operations. All commands use the `katana` CLI wrapper.

## Quick Commands

### Check Token Balances

```bash
./scripts/katana-cli.sh balance
./scripts/katana-cli.sh balance --token ETH
./scripts/katana-cli.sh balance --token USDC
```

### View Yield Opportunities

```bash
./scripts/katana-cli.sh yields
./scripts/katana-cli.sh yields --min-apy 5
```

### Portfolio Overview

```bash
./scripts/katana-cli.sh portfolio
```

## Transaction Commands

### Swap Tokens

```bash
./scripts/katana-cli.sh swap 100 USDC to ETH
./scripts/katana-cli.sh swap 0.5 ETH to USDC
```

### Deposit into Yield Pool

```bash
./scripts/katana-cli.sh deposit 1000 USDC into usdc-lending
./scripts/katana-cli.sh deposit 0.1 ETH into eth-staking
```

### Withdraw from Pool

```bash
./scripts/katana-cli.sh withdraw 500 from usdc-lending
./scripts/katana-cli.sh withdraw all from eth-staking
```

## Configuration

Set wallet address via environment:
```bash
export KATANA_WALLET="0x..."
```

Or pass directly:
```bash
./scripts/katana-cli.sh balance --wallet 0x...
```

## Notes

- Read-only operations (balance, yields, portfolio) work without wallet signing
- Transaction operations (swap, deposit, withdraw) require wallet integration
- All amounts are in human-readable format (not wei)
- APY values are annualized percentages
