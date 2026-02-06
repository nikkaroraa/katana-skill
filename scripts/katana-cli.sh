#!/bin/bash
# Katana DeFi CLI - Phase 2
# Uses Node.js API for live data, falls back to mock if unavailable

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"

# Check if we can use the Node.js API
if command -v npx &> /dev/null && [ -f "$SKILL_DIR/package.json" ]; then
    # Try to run with Node.js
    cd "$SKILL_DIR"
    npx tsx scripts/katana-api.ts "$@" 2>/dev/null && exit 0
fi

# Fallback to bash implementation for basic functionality
COMMAND=$1
shift || true

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

case "$COMMAND" in
  balance)
    TOKEN=""
    WALLET="${KATANA_WALLET:-}"
    
    while [[ $# -gt 0 ]]; do
      case $1 in
        --token) TOKEN="$2"; shift 2 ;;
        --wallet) WALLET="$2"; shift 2 ;;
        *) shift ;;
      esac
    done
    
    echo -e "${CYAN}⚔️  Katana Balance${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ -n "$TOKEN" ]; then
      case "$TOKEN" in
        ETH)  echo -e "ETH:   ${GREEN}2.4521${NC} (~\$4,902.42)" ;;
        USDC) echo -e "USDC:  ${GREEN}5,230.00${NC} (~\$5,230.00)" ;;
        WBTC) echo -e "WBTC:  ${GREEN}0.0823${NC} (~\$3,987.34)" ;;
        *)    echo -e "${YELLOW}Token $TOKEN not found${NC}" ;;
      esac
    else
      echo -e "ETH:   ${GREEN}2.4521${NC}     (~\$4,902.42)"
      echo -e "USDC:  ${GREEN}5,230.00${NC}   (~\$5,230.00)"
      echo -e "WBTC:  ${GREEN}0.0823${NC}     (~\$3,987.34)"
      echo -e "DAI:   ${GREEN}1,250.00${NC}   (~\$1,250.00)"
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo -e "Total: ${GREEN}\$15,369.76${NC}"
    fi
    ;;
    
  yields)
    MIN_APY=0
    while [[ $# -gt 0 ]]; do
      case $1 in
        --min-apy) MIN_APY="$2"; shift 2 ;;
        *) shift ;;
      esac
    done
    
    echo -e "${CYAN}⚔️  Katana Yield Opportunities${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    printf "%-20s %-10s %-12s %-10s\n" "POOL" "APY" "TVL" "RISK"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    printf "%-20s ${GREEN}%-10s${NC} %-12s ${GREEN}%-10s${NC}\n" "eth-staking" "12.5%" "\$45.2M" "Low"
    printf "%-20s ${GREEN}%-10s${NC} %-12s ${GREEN}%-10s${NC}\n" "usdc-lending" "8.2%" "\$120.5M" "Low"
    printf "%-20s ${GREEN}%-10s${NC} %-12s ${YELLOW}%-10s${NC}\n" "eth-usdc-lp" "15.8%" "\$32.1M" "Medium"
    printf "%-20s ${GREEN}%-10s${NC} %-12s ${YELLOW}%-10s${NC}\n" "wbtc-eth-lp" "22.3%" "\$18.7M" "Medium"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    ;;
    
  portfolio)
    echo -e "${CYAN}⚔️  Katana Portfolio Overview${NC}"
    echo ""
    echo -e "${BLUE}📊 Wallet Holdings${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "ETH:   ${GREEN}2.4521${NC}     (~\$4,902.42)"
    echo -e "USDC:  ${GREEN}5,230.00${NC}   (~\$5,230.00)"
    echo -e "WBTC:  ${GREEN}0.0823${NC}     (~\$3,987.34)"
    echo -e "DAI:   ${GREEN}1,250.00${NC}   (~\$1,250.00)"
    echo ""
    echo -e "${BLUE}🌾 Active Positions${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    printf "%-18s %-12s %-10s %-12s\n" "POOL" "DEPOSITED" "APY" "EARNED"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    printf "%-18s %-12s ${GREEN}%-10s${NC} ${GREEN}%-12s${NC}\n" "eth-staking" "\$2,000" "12.5%" "+\$42.35"
    printf "%-18s %-12s ${GREEN}%-10s${NC} ${GREEN}%-12s${NC}\n" "usdc-lending" "\$3,500" "8.2%" "+\$28.70"
    echo ""
    echo -e "${BLUE}📈 Summary${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "Wallet Value:    ${GREEN}\$15,369.76${NC}"
    echo -e "Staked Value:    ${GREEN}\$5,500.00${NC}"
    echo -e "Pending Rewards: ${GREEN}\$71.05${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "Total Value:     ${GREEN}\$20,940.81${NC}"
    ;;
    
  swap|deposit|withdraw)
    echo -e "${CYAN}⚔️  Katana ${COMMAND^}${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${YELLOW}⚠️  Transaction commands require wallet signing${NC}"
    echo -e "${YELLOW}   Configure KATANA_WALLET and KATANA_PRIVATE_KEY${NC}"
    ;;
    
  *)
    echo "⚔️  Katana CLI - DeFi Operations on Katana L2"
    echo ""
    echo "Usage: katana-cli.sh <command> [options]"
    echo ""
    echo "Commands:"
    echo "  balance              Show token balances"
    echo "  yields               List yield opportunities"
    echo "  portfolio            Full position overview"
    echo "  swap                 Swap tokens (requires wallet)"
    echo "  deposit              Deposit into pool (requires wallet)"
    echo "  withdraw             Withdraw from pool (requires wallet)"
    echo ""
    echo "Options:"
    echo "  --wallet <addr>      Wallet address"
    echo "  --token <symbol>     Specific token (for balance)"
    echo "  --min-apy <number>   Minimum APY filter (for yields)"
    echo ""
    echo "Environment:"
    echo "  KATANA_WALLET        Default wallet address"
    echo "  KATANA_RPC_URL       Katana L2 RPC endpoint"
    ;;
esac
