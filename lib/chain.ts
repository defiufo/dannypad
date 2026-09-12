import { base, baseSepolia } from "wagmi/chains";

export const TARGET_CHAIN =
  process.env.NEXT_PUBLIC_CHAIN === "base" ? base : baseSepolia;

export const FACTORY_ADDRESS = (process.env.NEXT_PUBLIC_FACTORY_ADDRESS ||
  "") as `0x${string}` | "";

export const EXPLORER =
  TARGET_CHAIN.id === base.id
    ? "https://basescan.org"
    : "https://sepolia.basescan.org";

export function shortAddr(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function formatEth(wei: bigint, digits = 4) {
  const n = Number(wei) / 1e18;
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export function parseEth(value: string): bigint {
  const t = value.trim();
  if (!t) return 0n;
  const [w, f = ""] = t.split(".");
  const frac = (f + "000000000000000000").slice(0, 18);
  return BigInt(w || "0") * 10n ** 18n + BigInt(frac || "0");
}
