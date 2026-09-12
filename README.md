# DannyPad

Permissionless token launchpad on **Base**.

One transaction deploys:

1. A fixed-supply ERC-20 (no mint, no pause, no blacklist, no tax)
2. A fixed-price ETH sale pool

Soft cap missed → buyers get a full refund.
Hard cap hit → sale auto-finalizes.
Successful raise → buyers claim tokens pro-rata at `tokensForSale / hardCap`.
Protocol fee defaults to **1%** of ETH raised, paid to the factory fee recipient.

Contracts are **unaudited**. Use at your own risk.

## Contracts

```bash
cd contracts
forge test
PRIVATE_KEY=0x... FEE_BPS=100 FEE_RECIPIENT=0xYourAddress \
  forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://sepolia.base.org --broadcast --verify
```

Or deploy the factory from the UI (Connect → Deploy factory) on Base Sepolia.

Default UI chain is **Base Sepolia**. For mainnet set `NEXT_PUBLIC_CHAIN=base` and `NEXT_PUBLIC_FACTORY_ADDRESS`.
