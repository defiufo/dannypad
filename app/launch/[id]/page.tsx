"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { saleAbi, tokenAbi } from "@/lib/abi";
import { EXPLORER, TARGET_CHAIN, formatEth, parseEth, shortAddr } from "@/lib/chain";

const STATUS = ["Upcoming", "Live", "Ended", "Successful", "Failed"] as const;

export default function LaunchPage() {
  const sale = useParams<{ id: string }>().id as `0x${string}`;
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("0.1");

  const { data: cfg } = useReadContract({ address: sale, abi: saleAbi, functionName: "config", chainId: TARGET_CHAIN.id });
  const { data: raised } = useReadContract({ address: sale, abi: saleAbi, functionName: "raised", chainId: TARGET_CHAIN.id });
  const { data: st } = useReadContract({ address: sale, abi: saleAbi, functionName: "status", chainId: TARGET_CHAIN.id });
  const { data: myContrib } = useReadContract({
    address: sale, abi: saleAbi, functionName: "contributed",
    args: address ? [address] : undefined, chainId: TARGET_CHAIN.id, query: { enabled: Boolean(address) },
  });
  const token = cfg ? (cfg[1] as `0x${string}`) : undefined;
  const { data: tokenName } = useReadContract({ address: token, abi: tokenAbi, functionName: "name", chainId: TARGET_CHAIN.id, query: { enabled: Boolean(token) } });
  const { data: tokenSymbol } = useReadContract({ address: token, abi: tokenAbi, functionName: "symbol", chainId: TARGET_CHAIN.id, query: { enabled: Boolean(token) } });

  const { data: hash, writeContract, isPending, error } = useWriteContract();
  useWaitForTransactionReceipt({ hash });

  const status = Number(st ?? 0);
  const hardCap = cfg ? (cfg[4] as bigint) : 0n;
  const creator = cfg ? (cfg[0] as string) : "";

  function act(fn: "contribute" | "finalize" | "claim" | "refund" | "withdrawRaised" | "withdrawUnsoldTokens") {
    writeContract({
      address: sale,
      abi: saleAbi,
      functionName: fn,
      args: [],
      value: fn === "contribute" ? parseEth(amount) : undefined,
      chainId: TARGET_CHAIN.id,
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-accent">{STATUS[status] ?? "—"}</p>
        <h1 className="mt-1 text-3xl font-semibold">{String(tokenName ?? "Launch")} <span className="font-mono text-lg text-zinc-500">${String(tokenSymbol ?? "")}</span></h1>
        <p className="mt-2 font-mono text-xs text-zinc-500">
          Sale <a className="text-accent" href={`${EXPLORER}/address/${sale}`}>{shortAddr(sale)}</a>
        </p>
      </div>
      <div className="rounded-2xl border border-line bg-panel p-5">
        <div className="flex justify-between text-sm text-zinc-400">
          <span>Raised</span>
          <span className="text-white">{formatEth((raised as bigint) ?? 0n)} / {formatEth(hardCap)} ETH</span>
        </div>
      </div>
      {isConnected && <p className="text-sm text-zinc-400">Your contribution: {formatEth((myContrib as bigint) ?? 0n)} ETH</p>}
      {status === 1 && (
        <div className="rounded-2xl border border-line bg-panel p-5">
          <input value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-xl border border-line px-3 py-2" />
          <button onClick={() => act("contribute")} disabled={!isConnected || isPending} className="mt-3 w-full rounded-full bg-accent py-3 font-medium text-ink">Contribute</button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {status === 2 && <button onClick={() => act("finalize")} className="rounded-full border border-line px-4 py-2 text-sm">Finalize</button>}
        {status === 3 && Number(myContrib ?? 0n) > 0 && <button onClick={() => act("claim")} className="rounded-full bg-accent px-4 py-2 text-sm text-ink">Claim</button>}
        {status === 4 && Number(myContrib ?? 0n) > 0 && <button onClick={() => act("refund")} className="rounded-full bg-warn px-4 py-2 text-sm text-ink">Refund</button>}
        {status === 3 && address && creator && address.toLowerCase() === creator.toLowerCase() && (
          <>
            <button onClick={() => act("withdrawRaised")} className="rounded-full border border-line px-4 py-2 text-sm">Withdraw ETH</button>
            <button onClick={() => act("withdrawUnsoldTokens")} className="rounded-full border border-line px-4 py-2 text-sm">Withdraw unsold</button>
          </>
        )}
      </div>
      {error && <p className="text-sm text-danger">{error.message}</p>}
      {hash && <p className="font-mono text-xs text-zinc-500">tx <a className="text-accent" href={`${EXPLORER}/tx/${hash}`}>{shortAddr(hash)}</a></p>}
    </div>
  );
}
