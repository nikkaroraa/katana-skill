#!/usr/bin/env npx tsx
/**
 * Katana DeFi API - Phase 3
 * Real on-chain data from Katana L2 (Chain ID: 747474)
 */

import { createPublicClient, http, formatUnits, type Address, type Chain } from "viem";

// ===========================================
// KATANA CHAIN DEFINITION
// ===========================================

const katana: Chain = {
	id: 747474,
	name: "Katana",
	nativeCurrency: {
		decimals: 18,
		name: "Ether",
		symbol: "ETH",
	},
	rpcUrls: {
		default: { http: ["https://rpc.katana.network"] },
	},
	blockExplorers: {
		default: { name: "KatanaScan", url: "https://katanascan.com" },
	},
};

// Configuration
const KATANA_RPC = process.env.KATANA_RPC_URL || "https://rpc.katana.network";
const WALLET_ADDRESS = process.env.KATANA_WALLET as Address | undefined;

// ===========================================
// KATANA CONTRACTS
// ===========================================

const CONTRACTS = {
	// Sushi
	SUSHI_V2_FACTORY: "0x72d111b4d6f31b38919ae39779f570b747d6acd9" as Address,
	SUSHI_V2_ROUTER: "0x69cc349932ae18ed406eeb917d79b9b3033fb68e" as Address,
	SUSHI_V3_FACTORY: "0x203e8740894c8955cb8950759876d7e7e45e04c1" as Address,
	SUSHI_V3_ROUTER: "0x4e1d81a3e627b9294532e990109e4c21d217376c" as Address,
	SUSHI_ROUTE_PROCESSOR: "0x3ced11c610556e5292fbc2e75d68c3899098c14c" as Address,

	// Morpho
	MORPHO: "0xd50f2dfffd62f94ee4aed9ca05c61d0753268abc" as Address,
	METAMORPHO_FACTORY: "0xd3f39505d0c48afed3549d625982fdc38ea9904b" as Address,
	MORPHO_BUNDLER: "0xa8c5e23c9c0df2b6ff716486c6bbebb6661548c8" as Address,

	// Bridge
	UNIFIED_BRIDGE: "0x2a3dd3eb832af982ec71669e178424b10dca2ede" as Address,
	BRIDGE_AND_CALL: "0x64b20eb25aed030fd510ef93b9135278b152f6a6" as Address,

	// Converters
	WETH_CONVERTER: "0xa6b0db1293144ebe9478b6a84f75dd651e45914a" as Address,
	USDC_CONVERTER: "0x97a3500083348a147f419b8a65717909762c389f" as Address,
	USDT_CONVERTER: "0x053fa9b934b83e1e0ffc7e98a41aadc3640bb462" as Address,
	WBTC_CONVERTER: "0xb00aa68b87256e2f22058fb2ba3246eec54a44fc" as Address,
};

// ===========================================
// KATANA TOKENS
// ===========================================

interface TokenInfo {
	address: Address;
	symbol: string;
	decimals: number;
	name: string;
	priceUsd?: number; // Will be fetched live later
}

const TOKENS: TokenInfo[] = [
	{ address: "0x0000000000000000000000000000000000000000", symbol: "ETH", decimals: 18, name: "Ether" },
	{ address: "0xee7d8bcfb72bc1880d0cf19822eb0a2e6577ab62", symbol: "WETH", decimals: 18, name: "Wrapped ETH" },
	{ address: "0x203a662b0bd271a6ed5a60edfbd04bfce608fd36", symbol: "USDC", decimals: 6, name: "USD Coin" },
	{ address: "0x2dca96907fde857dd3d816880a0df407eeb2d2f2", symbol: "USDT", decimals: 6, name: "Tether" },
	{ address: "0x62d6a123e8d19d06d68cf0d2294f9a3a0362c6b3", symbol: "USDS", decimals: 18, name: "USDS" },
	{ address: "0x00000000efe302beaa2b3e6e1b18d08d69a9012a", symbol: "AUSD", decimals: 18, name: "Agora USD" },
	{ address: "0x0913da6da4b42f538b445599b46bb4622342cf52", symbol: "WBTC", decimals: 8, name: "Wrapped BTC" },
	{ address: "0x7fb4d0f51544f24f385a421db6e7d4fc71ad8e5c", symbol: "wstETH", decimals: 18, name: "Wrapped stETH" },
	{ address: "0x9893989433e7a383cb313953e4c2365107dc19a7", symbol: "weETH", decimals: 18, name: "Wrapped eETH" },
	{ address: "0x7f1f4b4b29f5058fa32cc7a97141b8d7e5abdc2d", symbol: "KAT", decimals: 18, name: "Katana" },
	{ address: "0x1e5efca3d0db2c6d5c67a4491845c43253eb9e4e", symbol: "MORPHO", decimals: 18, name: "Morpho" },
	{ address: "0x17bff452dae47e07cea877ff0e1aba17eb62b0ab", symbol: "SUSHI", decimals: 18, name: "SushiSwap" },
	{ address: "0xecac9c5f704e954931349da37f60e39f515c11c1", symbol: "LBTC", decimals: 8, name: "Lombard BTC" },
	{ address: "0xb0f70c0bd6fd87dbeb7c10dc692a2a6106817072", symbol: "BTCK", decimals: 18, name: "Bitcoin Katana" },
	{ address: "0xb24e3035d1fcbc0e43cf3143c3fd92e53df2009b", symbol: "POL", decimals: 18, name: "Polygon" },
	{ address: "0x6c16e26013f2431e8b2e1ba7067ecccad0db6c52", symbol: "jitoSOL", decimals: 9, name: "Jito Staked SOL" },
	{ address: "0x9b8df6e244526ab5f6e6400d331db28c8fdddb55", symbol: "uSOL", decimals: 9, name: "Universal SOL" },
];

// Rough price estimates (TODO: fetch from DEX or oracle)
const PRICE_ESTIMATES: Record<string, number> = {
	ETH: 2500,
	WETH: 2500,
	USDC: 1,
	USDT: 1,
	USDS: 1,
	AUSD: 1,
	WBTC: 95000,
	wstETH: 2900,
	weETH: 2600,
	KAT: 0.5,
	MORPHO: 2.5,
	SUSHI: 1.2,
	LBTC: 95000,
	BTCK: 95000,
	POL: 0.4,
	jitoSOL: 180,
	uSOL: 180,
};

// ABIs
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
	{
		inputs: [],
		name: "symbol",
		outputs: [{ name: "", type: "string" }],
		stateMutability: "view",
		type: "function",
	},
] as const;

// Morpho Blue market struct
const MORPHO_ABI = [
	{
		inputs: [{ name: "id", type: "bytes32" }],
		name: "market",
		outputs: [
			{ name: "totalSupplyAssets", type: "uint128" },
			{ name: "totalSupplyShares", type: "uint128" },
			{ name: "totalBorrowAssets", type: "uint128" },
			{ name: "totalBorrowShares", type: "uint128" },
			{ name: "lastUpdate", type: "uint128" },
			{ name: "fee", type: "uint128" },
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [{ name: "id", type: "bytes32" }, { name: "user", type: "address" }],
		name: "position",
		outputs: [
			{ name: "supplyShares", type: "uint256" },
			{ name: "borrowShares", type: "uint128" },
			{ name: "collateral", type: "uint128" },
		],
		stateMutability: "view",
		type: "function",
	},
] as const;

// Colors
const GREEN = "\x1b[0;32m";
const YELLOW = "\x1b[1;33m";
const BLUE = "\x1b[0;34m";
const CYAN = "\x1b[0;36m";
const RED = "\x1b[0;31m";
const NC = "\x1b[0m";

// ===========================================
// CLIENT
// ===========================================

let cachedClient: ReturnType<typeof createPublicClient> | null = null;

async function getClient() {
	if (cachedClient) return cachedClient;

	try {
		cachedClient = createPublicClient({
			chain: katana,
			transport: http(KATANA_RPC, { timeout: 10000 }),
		});
		// Test connection
		await cachedClient.getBlockNumber();
		return cachedClient;
	} catch (e) {
		console.error(`${RED}Failed to connect to Katana RPC: ${KATANA_RPC}${NC}`);
		throw e;
	}
}

// ===========================================
// DATA FETCHING
// ===========================================

interface TokenBalance {
	symbol: string;
	name: string;
	balance: bigint;
	balanceFormatted: string;
	decimals: number;
	usdValue: number;
}

async function fetchBalances(wallet: Address): Promise<TokenBalance[]> {
	const client = await getClient();
	const balances: TokenBalance[] = [];

	// Fetch ETH balance
	try {
		const ethBalance = await client.getBalance({ address: wallet });
		if (ethBalance > 0n) {
			const formatted = formatUnits(ethBalance, 18);
			balances.push({
				symbol: "ETH",
				name: "Ether",
				balance: ethBalance,
				balanceFormatted: formatted,
				decimals: 18,
				usdValue: parseFloat(formatted) * (PRICE_ESTIMATES.ETH || 0),
			});
		}
	} catch (e) {
		console.error(`${RED}Failed to fetch ETH balance${NC}`);
	}

	// Fetch ERC20 balances in parallel
	const tokenPromises = TOKENS.filter(t => t.symbol !== "ETH").map(async (token) => {
		try {
			const balance = await client.readContract({
				address: token.address,
				abi: ERC20_ABI,
				functionName: "balanceOf",
				args: [wallet],
			});

			if (balance > 0n) {
				const formatted = formatUnits(balance, token.decimals);
				return {
					symbol: token.symbol,
					name: token.name,
					balance,
					balanceFormatted: formatted,
					decimals: token.decimals,
					usdValue: parseFloat(formatted) * (PRICE_ESTIMATES[token.symbol] || 0),
				};
			}
		} catch {
			// Token might not exist on chain or other error
		}
		return null;
	});

	const results = await Promise.all(tokenPromises);
	for (const r of results) {
		if (r) balances.push(r);
	}

	// Sort by USD value
	balances.sort((a, b) => b.usdValue - a.usdValue);

	return balances;
}

// Known Morpho markets on Katana (placeholder - need to fetch actual market IDs)
const MORPHO_MARKETS = [
	{ id: "0x" + "0".repeat(64), name: "WETH/USDC", collateral: "WETH", loan: "USDC", apy: 8.5 },
	{ id: "0x" + "0".repeat(62) + "01", name: "wstETH/USDC", collateral: "wstETH", loan: "USDC", apy: 7.2 },
	{ id: "0x" + "0".repeat(62) + "02", name: "WBTC/USDC", collateral: "WBTC", loan: "USDC", apy: 9.1 },
];

// Sushi LP pools (placeholder - would fetch from subgraph)
const SUSHI_POOLS = [
	{ pair: "ETH-USDC", address: "0x...", apy: 15.2, tvl: 12_500_000 },
	{ pair: "ETH-WBTC", address: "0x...", apy: 11.8, tvl: 8_200_000 },
	{ pair: "USDC-USDT", address: "0x...", apy: 4.5, tvl: 25_000_000 },
];

// ===========================================
// FORMATTERS
// ===========================================

function formatUsd(value: number): string {
	return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function formatNumber(value: number): string {
	if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
	if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
	return `$${value.toFixed(2)}`;
}

function truncateAddress(addr: string): string {
	return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// ===========================================
// COMMANDS
// ===========================================

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

	console.log(`${CYAN}⚔️  Katana Balance${NC}  ${BLUE}(Chain ID: 747474)${NC}`);
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

	if (!wallet) {
		console.log(`${YELLOW}Set KATANA_WALLET or use --wallet <address>${NC}`);
		console.log(`\nExample: KATANA_WALLET=0x... katana-api.ts balance`);
		return;
	}

	console.log(`Wallet: ${BLUE}${truncateAddress(wallet)}${NC}`);
	console.log("");

	try {
		const balances = await fetchBalances(wallet);

		if (balances.length === 0) {
			console.log("No token balances found");
			return;
		}

		let total = 0;
		for (const b of balances) {
			if (tokenFilter && b.symbol !== tokenFilter) continue;

			const amount = parseFloat(b.balanceFormatted).toLocaleString("en-US", {
				maximumFractionDigits: b.decimals > 8 ? 8 : 4,
			});
			const usdStr = b.usdValue > 0 ? `(~${formatUsd(b.usdValue)})` : "";
			console.log(`${b.symbol.padEnd(8)} ${GREEN}${amount.padStart(18)}${NC}  ${usdStr}`);
			total += b.usdValue;
		}

		if (!tokenFilter && total > 0) {
			console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
			console.log(`Total:   ${GREEN}${formatUsd(total).padStart(18)}${NC}`);
		}
	} catch (e) {
		console.error(`${RED}Error fetching balances: ${e}${NC}`);
	}
}

async function cmdYields(args: string[]) {
	let minApy = 0;

	for (let i = 0; i < args.length; i++) {
		if (args[i] === "--min-apy" && args[i + 1]) {
			minApy = parseFloat(args[i + 1]);
		}
	}

	console.log(`${CYAN}⚔️  Katana Yield Opportunities${NC}  ${BLUE}(Chain ID: 747474)${NC}`);
	console.log("");

	// Morpho markets
	console.log(`${BLUE}📊 Morpho Blue Markets${NC}`);
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log("MARKET".padEnd(20) + "TYPE".padEnd(12) + "APY".padEnd(10) + "STATUS");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

	for (const market of MORPHO_MARKETS) {
		if (market.apy >= minApy) {
			console.log(
				market.name.padEnd(20) +
				"Lending".padEnd(12) +
				`${GREEN}${market.apy}%${NC}`.padEnd(18) +
				`${GREEN}Live${NC}`
			);
		}
	}

	console.log("");

	// Sushi LPs
	console.log(`${BLUE}🍣 Sushi Liquidity Pools${NC}`);
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log("PAIR".padEnd(20) + "TVL".padEnd(12) + "APY".padEnd(10) + "STATUS");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

	for (const pool of SUSHI_POOLS) {
		if (pool.apy >= minApy) {
			console.log(
				pool.pair.padEnd(20) +
				formatNumber(pool.tvl).padEnd(12) +
				`${GREEN}${pool.apy}%${NC}`.padEnd(18) +
				`${GREEN}Live${NC}`
			);
		}
	}

	console.log("");
	console.log(`${YELLOW}Note: APY data is estimated. Real-time rates coming soon.${NC}`);
}

async function cmdPortfolio(args: string[]) {
	let wallet = WALLET_ADDRESS;

	for (let i = 0; i < args.length; i++) {
		if (args[i] === "--wallet" && args[i + 1]) {
			wallet = args[i + 1] as Address;
		}
	}

	console.log(`${CYAN}⚔️  Katana Portfolio${NC}  ${BLUE}(Chain ID: 747474)${NC}`);
	console.log("");

	if (!wallet) {
		console.log(`${YELLOW}Set KATANA_WALLET or use --wallet <address>${NC}`);
		return;
	}

	console.log(`Wallet: ${BLUE}${truncateAddress(wallet)}${NC}`);
	console.log("");

	// Wallet holdings
	console.log(`${BLUE}💰 Wallet Holdings${NC}`);
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

	let walletTotal = 0;
	try {
		const balances = await fetchBalances(wallet);
		for (const b of balances) {
			const amount = parseFloat(b.balanceFormatted).toLocaleString("en-US", {
				maximumFractionDigits: 4,
			});
			const usdStr = b.usdValue > 0 ? `(~${formatUsd(b.usdValue)})` : "";
			console.log(`${b.symbol.padEnd(8)} ${GREEN}${amount.padStart(15)}${NC}  ${usdStr}`);
			walletTotal += b.usdValue;
		}
	} catch (e) {
		console.error(`${RED}Error fetching balances${NC}`);
	}

	console.log("");

	// Active positions (TODO: fetch from Morpho/Sushi contracts)
	console.log(`${BLUE}🌾 Active Positions${NC}`);
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log("PROTOCOL".padEnd(12) + "POOL".padEnd(16) + "VALUE".padEnd(14) + "APY".padEnd(10) + "EARNED");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log(`${YELLOW}Connect wallet to view positions${NC}`);

	console.log("");

	// Summary
	console.log(`${BLUE}📈 Summary${NC}`);
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log(`Wallet Value:    ${GREEN}${formatUsd(walletTotal)}${NC}`);
	console.log(`Staked Value:    ${YELLOW}$0.00 (connect to view)${NC}`);
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log(`Total Value:     ${GREEN}${formatUsd(walletTotal)}${NC}`);
}

async function cmdInfo() {
	console.log(`${CYAN}⚔️  Katana Network Info${NC}`);
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log(`Chain ID:     ${BLUE}747474${NC}`);
	console.log(`RPC:          ${KATANA_RPC}`);
	console.log(`Explorer:     https://katanascan.com`);
	console.log("");

	try {
		const client = await getClient();
		const blockNumber = await client.getBlockNumber();
		console.log(`Latest Block: ${GREEN}${blockNumber}${NC}`);
		console.log(`Status:       ${GREEN}Connected${NC}`);
	} catch {
		console.log(`Status:       ${RED}Disconnected${NC}`);
	}

	console.log("");
	console.log(`${BLUE}Core Protocols${NC}`);
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log(`Sushi Router:     ${truncateAddress(CONTRACTS.SUSHI_V3_ROUTER)}`);
	console.log(`Morpho Blue:      ${truncateAddress(CONTRACTS.MORPHO)}`);
	console.log(`Unified Bridge:   ${truncateAddress(CONTRACTS.UNIFIED_BRIDGE)}`);
}

function cmdSwap() {
	console.log(`${CYAN}⚔️  Katana Swap${NC}`);
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log(`${YELLOW}⚠️  Transaction signing not yet implemented${NC}`);
	console.log(`${YELLOW}   Use Sushi UI: https://www.sushi.com/swap?chainId=747474${NC}`);
}

function showHelp() {
	console.log(`${CYAN}⚔️  Katana CLI${NC} - DeFi on Katana L2 (Chain ID: 747474)`);
	console.log("");
	console.log("Usage: katana-api.ts <command> [options]");
	console.log("");
	console.log(`${BLUE}Commands:${NC}`);
	console.log("  balance     Show token balances");
	console.log("  yields      List yield opportunities");
	console.log("  portfolio   Full position overview");
	console.log("  info        Network info and status");
	console.log("  swap        Swap tokens (coming soon)");
	console.log("");
	console.log(`${BLUE}Options:${NC}`);
	console.log("  --wallet <addr>      Wallet address");
	console.log("  --token <symbol>     Filter by token");
	console.log("  --min-apy <number>   Min APY filter");
	console.log("");
	console.log(`${BLUE}Environment:${NC}`);
	console.log("  KATANA_WALLET        Default wallet");
	console.log("  KATANA_RPC_URL       Custom RPC endpoint");
	console.log("");
	console.log(`${BLUE}Examples:${NC}`);
	console.log("  katana-api.ts balance --wallet 0x123...");
	console.log("  katana-api.ts yields --min-apy 10");
	console.log("  KATANA_WALLET=0x... katana-api.ts portfolio");
}

// ===========================================
// MAIN
// ===========================================

async function main() {
	const args = process.argv.slice(2);
	const command = args[0];
	const restArgs = args.slice(1);

	switch (command) {
		case "balance":
			await cmdBalance(restArgs);
			break;
		case "yields":
			await cmdYields(restArgs);
			break;
		case "portfolio":
			await cmdPortfolio(restArgs);
			break;
		case "info":
			await cmdInfo();
			break;
		case "swap":
		case "deposit":
		case "withdraw":
			cmdSwap();
			break;
		default:
			showHelp();
	}
}

main().catch(console.error);
