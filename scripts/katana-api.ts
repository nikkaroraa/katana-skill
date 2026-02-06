#!/usr/bin/env npx tsx
/**
 * Katana DeFi API - Phase 2
 * Real RPC calls with viem, fallback to mock data
 */

import { createPublicClient, http, formatUnits, type Address } from "viem";
import { base } from "viem/chains";

// Configuration
const KATANA_RPC = process.env.KATANA_RPC_URL || "https://rpc.katana.network";
const WALLET_ADDRESS = process.env.KATANA_WALLET as Address | undefined;

// Fallback to Base mainnet if Katana RPC is down
const FALLBACK_RPC = "https://mainnet.base.org";

// ERC20 ABI
const ERC20_ABI = [
	{
		inputs: [{ name: "account", type: "address" }],
		name: "balanceOf",
		outputs: [{ name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "decimals",
		outputs: [{ name: "", type: "uint8" }],
		stateMutability: "view",
		type: "function",
	},
] as const;

// Token list
const TOKENS: Array<{
	address: Address;
	symbol: string;
	decimals: number;
	priceUsd: number;
}> = [
	{ address: "0x0000000000000000000000000000000000000000", symbol: "ETH", decimals: 18, priceUsd: 2000 },
	{ address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", symbol: "USDC", decimals: 6, priceUsd: 1 },
	{ address: "0x4200000000000000000000000000000000000006", symbol: "WETH", decimals: 18, priceUsd: 2000 },
	{ address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", symbol: "DAI", decimals: 18, priceUsd: 1 },
	{ address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2", symbol: "USDT", decimals: 6, priceUsd: 1 },
];

// Yield pools (static data - would come from Katana API in production)
const YIELD_POOLS = [
	{ id: "eth-staking", token: "ETH", apy: 12.5, tvl: 45_200_000, risk: "Low" },
	{ id: "usdc-lending", token: "USDC", apy: 8.2, tvl: 120_500_000, risk: "Low" },
	{ id: "eth-usdc-lp", token: "ETH-USDC", apy: 15.8, tvl: 32_100_000, risk: "Medium" },
	{ id: "wbtc-eth-lp", token: "WBTC-ETH", apy: 22.3, tvl: 18_700_000, risk: "Medium" },
	{ id: "ausd-yield", token: "AUSD", apy: 18.5, tvl: 8_400_000, risk: "Medium" },
];

// Colors
const GREEN = "\x1b[0;32m";
const YELLOW = "\x1b[1;33m";
const BLUE = "\x1b[0;34m";
const CYAN = "\x1b[0;36m";
const NC = "\x1b[0m";

interface TokenBalance {
	symbol: string;
	balance: string;
	balanceFormatted: string;
	usdValue: number;
}

async function createClient() {
	// Try Katana RPC first, fall back to Base
	for (const rpc of [KATANA_RPC, FALLBACK_RPC]) {
		try {
			const client = createPublicClient({
				chain: base,
				transport: http(rpc, { timeout: 5000 }),
			});
			// Test connection
			await client.getBlockNumber();
			return { client, rpcUrl: rpc };
		} catch {
			continue;
		}
	}
	return null;
}

async function fetchBalances(wallet: Address): Promise<TokenBalance[]> {
	const connection = await createClient();
	if (!connection) {
		console.error("Could not connect to RPC");
		return [];
	}

	const { client } = connection;
	const balances: TokenBalance[] = [];

	// Fetch ETH balance
	try {
		const ethBalance = await client.getBalance({ address: wallet });
		const ethFormatted = formatUnits(ethBalance, 18);
		const ethUsd = parseFloat(ethFormatted) * 2000;

		if (ethBalance > 0n) {
			balances.push({
				symbol: "ETH",
				balance: ethBalance.toString(),
				balanceFormatted: ethFormatted,
				usdValue: ethUsd,
			});
		}
	} catch (e) {
		console.error("Failed to fetch ETH balance");
	}

	// Fetch ERC20 balances
	for (const token of TOKENS.filter((t) => t.symbol !== "ETH")) {
		try {
			const balance = await client.readContract({
				address: token.address,
				abi: ERC20_ABI,
				functionName: "balanceOf",
				args: [wallet],
			});

			if (balance > 0n) {
				const formatted = formatUnits(balance, token.decimals);
				const usdValue = parseFloat(formatted) * token.priceUsd;

				balances.push({
					symbol: token.symbol,
					balance: balance.toString(),
					balanceFormatted: formatted,
					usdValue,
				});
			}
		} catch {
			// Skip tokens that fail
		}
	}

	return balances;
}

function formatUsd(value: number): string {
	return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function formatNumber(value: number): string {
	if (value >= 1_000_000) {
		return `$${(value / 1_000_000).toFixed(1)}M`;
	}
	if (value >= 1_000) {
		return `$${(value / 1_000).toFixed(1)}K`;
	}
	return `$${value.toFixed(2)}`;
}

// Command handlers
async function cmdBalance(args: string[]) {
	let wallet = WALLET_ADDRESS;
	let tokenFilter: string | null = null;

	for (let i = 0; i < args.length; i++) {
		if (args[i] === "--wallet" && args[i + 1]) {
			wallet = args[i + 1] as Address;
		}
		if (args[i] === "--token" && args[i + 1]) {
			tokenFilter = args[i + 1].toUpperCase();
		}
	}

	console.log(`${CYAN}⚔️  Katana Balance${NC}`);
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

	if (!wallet) {
		console.log(`${YELLOW}Set KATANA_WALLET or use --wallet <address>${NC}`);
		// Show mock data
		console.log(`ETH:   ${GREEN}2.4521${NC}     (~$4,902.42)`);
		console.log(`USDC:  ${GREEN}5,230.00${NC}   (~$5,230.00)`);
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log(`Total: ${GREEN}$10,132.42${NC} (mock data)`);
		return;
	}

	const balances = await fetchBalances(wallet);

	if (balances.length === 0) {
		console.log("No token balances found");
		return;
	}

	let total = 0;
	for (const b of balances) {
		if (tokenFilter && b.symbol !== tokenFilter) continue;

		const amount = parseFloat(b.balanceFormatted).toLocaleString("en-US", { maximumFractionDigits: 4 });
		console.log(`${b.symbol}:`.padEnd(7) + `${GREEN}${amount}${NC}`.padEnd(20) + `(~${formatUsd(b.usdValue)})`);
		total += b.usdValue;
	}

	if (!tokenFilter) {
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log(`Total: ${GREEN}${formatUsd(total)}${NC}`);
	}
}

function cmdYields(args: string[]) {
	let minApy = 0;

	for (let i = 0; i < args.length; i++) {
		if (args[i] === "--min-apy" && args[i + 1]) {
			minApy = parseFloat(args[i + 1]);
		}
	}

	console.log(`${CYAN}⚔️  Katana Yield Opportunities${NC}`);
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log("POOL".padEnd(20) + "APY".padEnd(10) + "TVL".padEnd(12) + "RISK");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

	const filteredPools = YIELD_POOLS.filter((p) => p.apy >= minApy);

	for (const pool of filteredPools) {
		const riskColor = pool.risk === "Low" ? GREEN : YELLOW;
		console.log(
			pool.id.padEnd(20) +
			`${GREEN}${pool.apy}%${NC}`.padEnd(18) +
			formatNumber(pool.tvl).padEnd(12) +
			`${riskColor}${pool.risk}${NC}`
		);
	}

	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

async function cmdPortfolio(args: string[]) {
	let wallet = WALLET_ADDRESS;

	for (let i = 0; i < args.length; i++) {
		if (args[i] === "--wallet" && args[i + 1]) {
			wallet = args[i + 1] as Address;
		}
	}

	console.log(`${CYAN}⚔️  Katana Portfolio Overview${NC}`);
	console.log("");
	console.log(`${BLUE}📊 Wallet Holdings${NC}`);
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

	let walletTotal = 0;

	if (wallet) {
		const balances = await fetchBalances(wallet);
		for (const b of balances) {
			const amount = parseFloat(b.balanceFormatted).toLocaleString("en-US", { maximumFractionDigits: 4 });
			console.log(`${b.symbol}:`.padEnd(7) + `${GREEN}${amount}${NC}`.padEnd(18) + `(~${formatUsd(b.usdValue)})`);
			walletTotal += b.usdValue;
		}
	} else {
		// Mock data
		console.log(`ETH:   ${GREEN}2.4521${NC}     (~$4,902.42)`);
		console.log(`USDC:  ${GREEN}5,230.00${NC}   (~$5,230.00)`);
		console.log(`WBTC:  ${GREEN}0.0823${NC}     (~$3,987.34)`);
		console.log(`DAI:   ${GREEN}1,250.00${NC}   (~$1,250.00)`);
		walletTotal = 15369.76;
	}

	console.log("");
	console.log(`${BLUE}🌾 Active Positions${NC}`);
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log("POOL".padEnd(18) + "DEPOSITED".padEnd(12) + "APY".padEnd(10) + "EARNED");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

	// Mock positions (would come from contract reads in production)
	const positions = [
		{ pool: "eth-staking", deposited: 2000, apy: 12.5, earned: 42.35 },
		{ pool: "usdc-lending", deposited: 3500, apy: 8.2, earned: 28.7 },
	];

	let stakedTotal = 0;
	let earningsTotal = 0;

	for (const pos of positions) {
		console.log(
			pos.pool.padEnd(18) +
			`$${pos.deposited}`.padEnd(12) +
			`${GREEN}${pos.apy}%${NC}`.padEnd(18) +
			`${GREEN}+$${pos.earned.toFixed(2)}${NC}`
		);
		stakedTotal += pos.deposited;
		earningsTotal += pos.earned;
	}

	console.log("");
	console.log(`${BLUE}📈 Summary${NC}`);
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log(`Wallet Value:    ${GREEN}${formatUsd(walletTotal)}${NC}`);
	console.log(`Staked Value:    ${GREEN}${formatUsd(stakedTotal)}${NC}`);
	console.log(`Pending Rewards: ${GREEN}${formatUsd(earningsTotal)}${NC}`);
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log(`Total Value:     ${GREEN}${formatUsd(walletTotal + stakedTotal + earningsTotal)}${NC}`);
}

function cmdSwap(args: string[]) {
	console.log(`${CYAN}⚔️  Katana Swap${NC}`);
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log(`${YELLOW}⚠️  Transaction commands require wallet signing${NC}`);
	console.log(`${YELLOW}   Configure KATANA_PRIVATE_KEY to enable${NC}`);
}

function showHelp() {
	console.log("⚔️  Katana CLI - DeFi Operations on Katana L2");
	console.log("");
	console.log("Usage: katana-api.ts <command> [options]");
	console.log("");
	console.log("Commands:");
	console.log("  balance              Show token balances");
	console.log("  yields               List yield opportunities");
	console.log("  portfolio            Full position overview");
	console.log("  swap                 Swap tokens (requires wallet)");
	console.log("  deposit              Deposit into pool (requires wallet)");
	console.log("  withdraw             Withdraw from pool (requires wallet)");
	console.log("");
	console.log("Options:");
	console.log("  --wallet <addr>      Wallet address");
	console.log("  --token <symbol>     Specific token (for balance)");
	console.log("  --min-apy <number>   Minimum APY filter (for yields)");
	console.log("");
	console.log("Environment:");
	console.log("  KATANA_WALLET        Default wallet address");
	console.log("  KATANA_RPC_URL       Katana L2 RPC endpoint");
}

// Main
async function main() {
	const args = process.argv.slice(2);
	const command = args[0];
	const restArgs = args.slice(1);

	switch (command) {
		case "balance":
			await cmdBalance(restArgs);
			break;
		case "yields":
			cmdYields(restArgs);
			break;
		case "portfolio":
			await cmdPortfolio(restArgs);
			break;
		case "swap":
		case "deposit":
		case "withdraw":
			cmdSwap(restArgs);
			break;
		default:
			showHelp();
	}
}

main().catch(console.error);
