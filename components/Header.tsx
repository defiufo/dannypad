"use client";

import Link from "next/link";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { TARGET_CHAIN, shortAddr } from "@/lib/chain";

export default function Header() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const injected = connectors.find((c) => c.id === "injected") ?? connectors[0];
  const wrong = isConnected && chainId !== TARGET_CHAIN.id;

  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-ink/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-ink font-black">
            D
          </span>
          <div className="leading-tight">
            <div className="font-semibold tracking-tight">DannyPad</div>
            <div className="text-[11px] text-zinc-500">Fair launches on Base</div>
          </div>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/" className="text-zinc-400 hover:text-white">
            Explore
          </Link>
          <Link
            href="/create"
            className="rounded-full bg-accent px-3 py-1.5 font-medium text-ink hover:brightness-110"
          >
            Create
          </Link>
          {!isConnected ? (
            <button
              onClick={() => injected && connect({ connector: injected })}
              disabled={isPending}
              className="rounded-full border border-line px-3 py-1.5 text-zinc-200 hover:border-accent"
            >
              {isPending ? "Connecting…" : "Connect"}
            </button>
          ) : wrong ? (
            <button
              onClick={() => switchChain({ chainId: TARGET_CHAIN.id })}
              className="rounded-full bg-warn px-3 py-1.5 font-medium text-ink"
            >
              Switch to {TARGET_CHAIN.name}
            </button>
          ) : (
            <button
              onClick={() => disconnect()}
              className="rounded-full border border-line px-3 py-1.5 font-mono text-xs text-zinc-300"
              title="Disconnect"
            >
              {shortAddr(address)}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
