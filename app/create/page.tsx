"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { factoryAbi } from "@/lib/abi";
import { EXPLORER, FACTORY_ADDRESS, TARGET_CHAIN, parseEth, shortAddr } from "@/lib/chain";

export default function CreatePage() {
  const { isConnected } = useAccount();
  const [factory, setFactory] = useState<`0x${string}` | "">(FACTORY_ADDRESS);
  const [form, setForm] = useState({
    name: "Danny Coin",
    symbol: "DANN",
    totalSupply: "1000000000",
    tokensForSale: "400000000",
    softCap: "5",
    hardCap: "10",
    minBuy: "0.01",
    maxBuy: "2",
    startInMin: "5",
    durationHours: "24",
  });

  useEffect(() => {
    const saved = localStorage.getItem("dannypad.factory");
    if (!FACTORY_ADDRESS && saved) setFactory(saved as `0x${string}`);
  }, []);

  const { data: creationFee } = useReadContract({
    address: factory || undefined,
    abi: factoryAbi,
    functionName: "creationFee",
    chainId: TARGET_CHAIN.id,
    query: { enabled: Boolean(factory) },
  });

  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: waiting, isSuccess } = useWaitForTransactionReceipt({ hash });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!factory) return;
    const now = Math.floor(Date.now() / 1000);
    const start = BigInt(now + Number(form.startInMin) * 60);
    const end = start + BigInt(Number(form.durationHours) * 3600);
    writeContract({
      address: factory,
      abi: factoryAbi,
      functionName: "createLaunch",
      args: [{
        name: form.name,
        symbol: form.symbol.toUpperCase(),
        totalSupply: parseEth(form.totalSupply),
        tokensForSale: parseEth(form.tokensForSale),
        softCap: parseEth(form.softCap),
        hardCap: parseEth(form.hardCap),
        minBuy: parseEth(form.minBuy),
        maxBuy: parseEth(form.maxBuy),
        startTime: start,
        endTime: end,
      }],
      value: (creationFee as bigint | undefined) ?? 0n,
      chainId: TARGET_CHAIN.id,
    });
  }

  if (!factory) {
    return (
      <div className="rounded-2xl border border-line bg-panel p-6">
        <h1 className="text-2xl font-semibold">Factory missing</h1>
        <p className="mt-2 text-zinc-400">Deploy the factory from the home page first.</p>
        <Link href="/" className="mt-4 inline-block text-accent">← Home</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl font-semibold">Create launch</h1>
      <form onSubmit={submit} className="mt-6 space-y-3 rounded-2xl border border-line bg-panel p-5">
        {Object.entries(form).map(([k, v]) => (
          <label key={k} className="block text-sm text-zinc-400">
            {k}
            <input
              className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-white"
              value={v}
              onChange={(e) => setForm((s) => ({ ...s, [k]: e.target.value }))}
            />
          </label>
        ))}
        <button disabled={!isConnected || isPending || waiting} className="w-full rounded-full bg-accent py-3 font-medium text-ink disabled:opacity-50">
          {!isConnected ? "Connect wallet" : isPending || waiting ? "Creating…" : "Launch on Base"}
        </button>
        {error && <p className="text-sm text-danger">{error.message}</p>}
        {hash && (
          <p className="font-mono text-xs text-zinc-500">
            tx <a className="text-accent" href={`${EXPLORER}/tx/${hash}`}>{shortAddr(hash)}</a>
            {isSuccess ? " — created" : ""}
          </p>
        )}
      </form>
    </div>
  );
}
