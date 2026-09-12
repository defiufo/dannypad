"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { factoryAbi } from "@/lib/abi";
import { EXPLORER, FACTORY_ADDRESS, TARGET_CHAIN, formatEth } from "@/lib/chain";

type LaunchCard = {
  sale: `0x${string}`;
  name: string;
  symbol: string;
  hardCap: bigint;
  tokensForSale: bigint;
  startTime: number;
  endTime: number;
};

export default function HomePage() {
  const client = usePublicClient({ chainId: TARGET_CHAIN.id });
  const [factory, setFactory] = useState<`0x${string}` | "">(FACTORY_ADDRESS);
  const [launches, setLaunches] = useState<LaunchCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("dannypad.factory");
    if (!FACTORY_ADDRESS && saved) setFactory(saved as `0x${string}`);
  }, []);

  useEffect(() => {
    if (!client || !factory) return;
    let dead = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const count = (await client.readContract({
          address: factory,
          abi: factoryAbi,
          functionName: "launchCount",
        })) as bigint;
        if (count === 0n) {
          if (!dead) setLaunches([]);
          return;
        }
        const logs = await client.getContractEvents({
          address: factory,
          abi: factoryAbi,
          eventName: "LaunchCreated",
          fromBlock: 0n,
        });
        const cards: LaunchCard[] = logs.reverse().map((log) => {
          const a = log.args as Record<string, unknown>;
          return {
            sale: a.sale as `0x${string}`,
            name: String(a.name),
            symbol: String(a.symbol),
            hardCap: a.hardCap as bigint,
            tokensForSale: a.tokensForSale as bigint,
            startTime: Number(a.startTime),
            endTime: Number(a.endTime),
          };
        });
        if (!dead) setLaunches(cards);
      } catch (e: unknown) {
        if (!dead) setErr(e instanceof Error ? e.message : "Failed to load launches");
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => {
      dead = true;
    };
  }, [client, factory]);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-line bg-panel p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Base launchpad</p>
        <h1 className="mt-2 max-w-2xl text-4xl font-semibold tracking-tight">
          Launch a fixed-supply token. Raise ETH. No mint button.
        </h1>
        <p className="mt-4 max-w-xl text-zinc-400">
          DannyPad deploys an ERC-20 and a fair-price ETH sale in one transaction.
          Soft cap miss = refunds. Hard cap hit = sale closes. Protocol fee 1%.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/create" className="rounded-full bg-accent px-5 py-2.5 font-medium text-ink">
            Create a launch
          </Link>
          <a href="https://github.com/defiufo/dannypad" className="rounded-full border border-line px-5 py-2.5">
            Source
          </a>
        </div>
      </section>

      {!factory ? (
        <section className="rounded-2xl border border-warn/30 bg-panel p-6">
          <h2 className="text-lg font-medium">Deploy the factory</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Run Foundry on {TARGET_CHAIN.name}, then paste the factory address.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-ink p-3 font-mono text-[11px] text-zinc-300">{
            "cd contracts\nPRIVATE_KEY=0x... FEE_BPS=100 \\\n  forge script script/Deploy.s.sol:Deploy \\\n  --rpc-url https://sepolia.base.org --broadcast"
          }</pre>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const v = (e.currentTarget.elements.namedItem("addr") as HTMLInputElement).value.trim();
              if (v.startsWith("0x") && v.length === 42) {
                setFactory(v as `0x${string}`);
                localStorage.setItem("dannypad.factory", v);
              }
            }}
          >
            <input name="addr" placeholder="0x factory" className="flex-1 rounded-xl border border-line px-3 py-2 font-mono text-xs" />
            <button className="rounded-full bg-warn px-4 py-2 text-sm font-medium text-ink">Save</button>
          </form>
        </section>
      ) : (
        <p className="font-mono text-xs text-zinc-500">
          Factory <a className="text-accent" href={`${EXPLORER}/address/${factory}`}>{factory}</a>
        </p>
      )}

      <section>
        <h2 className="mb-4 text-xl font-medium">Launches {loading ? "…" : ""}</h2>
        {err && <p className="text-sm text-danger">{err}</p>}
        <div className="grid gap-4 md:grid-cols-2">
          {launches.map((l) => (
            <Link key={l.sale} href={`/launch/${l.sale}`} className="rounded-2xl border border-line bg-panel p-5 hover:border-accent/60">
              <div className="text-lg font-medium">{l.name} <span className="font-mono text-xs text-zinc-500">${l.symbol}</span></div>
              <div className="mt-2 text-sm text-zinc-400">Hard cap {formatEth(l.hardCap)} ETH</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
