export const factoryAbi = [
  {
    type: "constructor",
    inputs: [
      { name: "feeRecipient_", type: "address" },
      { name: "feeBps_", type: "uint16" },
      { name: "creationFee_", type: "uint256" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "createLaunch",
    stateMutability: "payable",
    inputs: [
      {
        name: "p",
        type: "tuple",
        components: [
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
          { name: "totalSupply", type: "uint256" },
          { name: "tokensForSale", type: "uint256" },
          { name: "softCap", type: "uint256" },
          { name: "hardCap", type: "uint256" },
          { name: "minBuy", type: "uint256" },
          { name: "maxBuy", type: "uint256" },
          { name: "startTime", type: "uint64" },
          { name: "endTime", type: "uint64" },
        ],
      },
    ],
    outputs: [
      { name: "sale", type: "address" },
      { name: "token", type: "address" },
    ],
  },
  {
    type: "function",
    name: "launchCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "getLaunches",
    stateMutability: "view",
    inputs: [
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" },
    ],
    outputs: [{ type: "address[]" }],
  },
  {
    type: "function",
    name: "creationFee",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "event",
    name: "LaunchCreated",
    inputs: [
      { name: "creator", type: "address", indexed: true },
      { name: "sale", type: "address", indexed: true },
      { name: "token", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "symbol", type: "string", indexed: false },
      { name: "tokensForSale", type: "uint256", indexed: false },
      { name: "hardCap", type: "uint256", indexed: false },
      { name: "startTime", type: "uint64", indexed: false },
      { name: "endTime", type: "uint64", indexed: false },
    ],
  },
] as const;

export const saleAbi = [
  {
    type: "function",
    name: "config",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "creator", type: "address" },
      { name: "token", type: "address" },
      { name: "tokensForSale", type: "uint256" },
      { name: "softCap", type: "uint256" },
      { name: "hardCap", type: "uint256" },
      { name: "minBuy", type: "uint256" },
      { name: "maxBuy", type: "uint256" },
      { name: "startTime", type: "uint64" },
      { name: "endTime", type: "uint64" },
      { name: "feeBps", type: "uint16" },
      { name: "feeRecipient", type: "address" },
    ],
  },
  { type: "function", name: "raised", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "status", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  {
    type: "function",
    name: "contributed",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "tokensOwed",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "claimed",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "bool" }],
  },
  { type: "function", name: "contribute", stateMutability: "payable", inputs: [], outputs: [] },
  { type: "function", name: "finalize", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "claim", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "refund", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "withdrawRaised", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "withdrawUnsoldTokens", stateMutability: "nonpayable", inputs: [], outputs: [] },
] as const;

export const tokenAbi = [
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
] as const;

export { factoryBytecode } from "./factoryBytecode";
