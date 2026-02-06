#!/bin/bash
# Katana DeFi CLI - Interface to katana-intent backend
# Usage: katana.sh <command> [args...]

set -e

# Configuration
KATANA_API="${KATANA_INTENT_URL:-http://localhost:3000}"
WALLET="${KATANA_WALLET_ADDRESS:-}"

# Colors (disabled in non-tty)
if [ -t 1 ]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  CYAN='\033[0;36m'
  NC='\033[0m'
else
  RED='' GREEN='' YELLOW='' CYAN='' NC=''
fi

error() { echo -e "${RED}Error: $1${NC}" >&2; exit 1; }
info() { echo -e "${CYAN}$1${NC}" >&2; }

# Send message to chat API
chat() {
  local message="$1"
  local wallet="${2:-$WALLET}"
  
  [ -z "$wallet" ] && error "No wallet address. Set KATANA_WALLET_ADDRESS."
  
  local response
  response=$(curl -s -X POST "$KATANA_API/api/chat" \
    -H "Content-Type: application/json" \
    -d "{\"message\": \"$message\", \"walletAddress\": \"$wallet\"}")
  
  # Check for curl errors
  [ $? -ne 0 ] && error "Failed to connect to $KATANA_API"
  
  echo "$response"
}

# Format JSON response for display
format_response() {
  local json="$1"
  local response
  
  # Extract response text
  response=$(echo "$json" | jq -r '.response // empty')
  
  if [ -n "$response" ]; then
    echo "$response"
  else
    # Show raw JSON if no formatted response
    echo "$json" | jq '.'
  fi
}

# Commands
cmd_balance() {
  local address="${1:-$WALLET}"
  info "Fetching balances..."
  
  local result
  result=$(chat "show my balances" "$address")
  format_response "$result"
  
  # Also output raw data if available
  local data
  data=$(echo "$result" | jq -r '.data // empty')
  [ -n "$data" ] && [ "$data" != "null" ] && echo -e "\n${CYAN}Raw data:${NC}" && echo "$data" | jq '.'
}

cmd_yields() {
  local token="${1:-}"
  info "Fetching yield opportunities..."
  
  local msg="what are the best yields"
  [ -n "$token" ] && msg="what are the best yields for $token"
  
  local result
  result=$(chat "$msg" "$WALLET")
  format_response "$result"
}

cmd_portfolio() {
  local address="${1:-$WALLET}"
  info "Fetching portfolio..."
  
  local result
  result=$(chat "show my positions" "$address")
  format_response "$result"
}

cmd_status() {
  local intent_id="$1"
  [ -z "$intent_id" ] && error "Usage: katana status <intent-id>"
  
  info "Checking status of intent $intent_id..."
  # Status endpoint would be: /api/intent/$intent_id/status
  # For now, use chat API
  local result
  result=$(chat "what is the status of my last transaction" "$WALLET")
  format_response "$result"
}

cmd_swap() {
  # Parse: swap <amount> <from> to <to>
  local amount="$1"
  local from="$2"
  shift 2 2>/dev/null || error "Usage: katana swap <amount> <from> to <to>"
  
  # Skip "to" keyword if present
  [ "$1" = "to" ] && shift
  local to="$1"
  
  [ -z "$amount" ] || [ -z "$from" ] || [ -z "$to" ] && \
    error "Usage: katana swap <amount> <from> to <to>"
  
  info "Creating swap: $amount $from → $to"
  
  local result
  result=$(chat "swap $amount $from to $to" "$WALLET")
  format_response "$result"
  
  # Show intent details
  echo -e "\n${CYAN}Intent:${NC}"
  echo "$result" | jq '.intent'
}

cmd_deposit() {
  # Parse: deposit <amount> <token> [into <protocol>]
  local amount="$1"
  local token="$2"
  shift 2 2>/dev/null || error "Usage: katana deposit <amount> <token> [into <protocol>]"
  
  local protocol=""
  if [ "$1" = "into" ]; then
    shift
    protocol="$1"
  fi
  
  [ -z "$amount" ] || [ -z "$token" ] && \
    error "Usage: katana deposit <amount> <token> [into <protocol>]"
  
  local msg="deposit $amount $token"
  [ -n "$protocol" ] && msg="$msg into $protocol"
  
  info "Creating deposit: $amount $token ${protocol:+into $protocol}"
  
  local result
  result=$(chat "$msg" "$WALLET")
  format_response "$result"
  
  echo -e "\n${CYAN}Intent:${NC}"
  echo "$result" | jq '.intent'
}

cmd_withdraw() {
  # Parse: withdraw <amount> from <protocol>
  local amount="$1"
  shift 2>/dev/null || error "Usage: katana withdraw <amount> from <protocol>"
  
  # Skip "from" keyword if present
  [ "$1" = "from" ] && shift
  local protocol="$1"
  
  [ -z "$amount" ] || [ -z "$protocol" ] && \
    error "Usage: katana withdraw <amount> from <protocol>"
  
  info "Creating withdraw: $amount from $protocol"
  
  local result
  result=$(chat "withdraw $amount from $protocol" "$WALLET")
  format_response "$result"
  
  echo -e "\n${CYAN}Intent:${NC}"
  echo "$result" | jq '.intent'
}

cmd_risk() {
  info "Checking risk..."
  
  local result
  result=$(chat "am i safe? check my liquidation risk" "$WALLET")
  format_response "$result"
}

cmd_intent() {
  # Free-form intent parsing
  local input="$*"
  [ -z "$input" ] && error "Usage: katana intent <natural language query>"
  
  info "Processing: $input"
  
  local result
  result=$(chat "$input" "$WALLET")
  format_response "$result"
  
  echo -e "\n${CYAN}Intent:${NC}"
  echo "$result" | jq '.intent'
}

cmd_help() {
  cat <<EOF
Katana DeFi CLI

Usage: katana <command> [args...]

Read Commands:
  balance [address]           Show token balances
  yields [token]              List yield opportunities
  portfolio [address]         Show all positions
  risk                        Check liquidation risk
  status <intent-id>          Check intent execution status

Write Commands:
  swap <amt> <from> to <to>   Swap tokens
  deposit <amt> <token> [into <protocol>]  Deposit into yield
  withdraw <amt> from <protocol>  Withdraw from protocol

General:
  intent <natural language>   Parse free-form intent
  help                        Show this help

Environment:
  KATANA_INTENT_URL     Backend API URL (default: http://localhost:3000)
  KATANA_WALLET_ADDRESS Wallet address for queries/signing

Examples:
  katana balance
  katana yields USDC
  katana swap 100 USDC to ETH
  katana deposit 500 USDC into morpho
  katana withdraw all from yearn
  katana intent "what's the best yield for my tokens"
EOF
}

# Main
command="${1:-help}"
shift 2>/dev/null || true

case "$command" in
  balance)    cmd_balance "$@" ;;
  yields)     cmd_yields "$@" ;;
  portfolio)  cmd_portfolio "$@" ;;
  risk)       cmd_risk "$@" ;;
  status)     cmd_status "$@" ;;
  swap)       cmd_swap "$@" ;;
  deposit)    cmd_deposit "$@" ;;
  withdraw)   cmd_withdraw "$@" ;;
  intent)     cmd_intent "$@" ;;
  help|--help|-h) cmd_help ;;
  *) error "Unknown command: $command. Run 'katana help' for usage." ;;
esac
