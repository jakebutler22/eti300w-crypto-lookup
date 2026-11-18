// Artificial sample fixtures, not current or historical quotes.
// Keep this timestamp fixed: refreshing samples does not make them live.
const SIMULATED_AS_OF = "2026-11-08T14:00:00Z";

// The requested website directory. This is a local catalog, not a database response.
export const TEAM_ASSETS = Object.freeze([
  { symbol: "BTC", name: "Bitcoin", category: "Digital currency" },
  { symbol: "ETH", name: "Ethereum", category: "Smart contract platform" },
  { symbol: "XRP", name: "Ripple", category: "Payments" },
  { symbol: "LTC", name: "Litecoin", category: "Digital currency" },
  { symbol: "ADA", name: "Cardano", category: "Smart contract platform" },
  { symbol: "DOGE", name: "Dogecoin", category: "Meme cryptocurrency" },
  { symbol: "SOL", name: "Solana", category: "Smart contract platform" },
  { symbol: "BCH", name: "Bitcoin Cash", category: "Digital currency" },
  { symbol: "LINK", name: "Chainlink", category: "Oracle network" },
  { symbol: "AVAX", name: "Avalanche", category: "Smart contract platform" },
  { symbol: "DOT", name: "Polkadot", category: "Interoperability" },
  { symbol: "XLM", name: "Stellar", category: "Payments" },
  { symbol: "UNI", name: "Uniswap", category: "Decentralized exchange" },
  { symbol: "ATOM", name: "Cosmos", category: "Interoperability" },
  { symbol: "SHIB", name: "Shiba Inu", category: "Meme cryptocurrency" },
  { symbol: "POL", name: "Polygon", category: "Layer 2 scaling" },
  { symbol: "ETC", name: "Ethereum Classic", category: "Smart contract platform" },
  { symbol: "HBAR", name: "Hedera", category: "Smart contract platform" },
  { symbol: "NEAR", name: "NEAR Protocol", category: "Smart contract platform" },
  { symbol: "AAVE", name: "Aave", category: "Lending protocol" },
  { symbol: "ICP", name: "Internet Computer", category: "Smart contract platform" },
  { symbol: "APT", name: "Aptos", category: "Smart contract platform" },
  { symbol: "ARB", name: "Arbitrum", category: "Layer 2 scaling" },
  { symbol: "OP", name: "Optimism", category: "Layer 2 scaling" },
  { symbol: "SUI", name: "Sui", category: "Smart contract platform" },
  { symbol: "ALGO", name: "Algorand", category: "Smart contract platform" },
  { symbol: "FIL", name: "Filecoin", category: "Decentralized storage" },
].map((asset) => Object.freeze(asset)));

// USD prices and USD volume totals below are explicitly invented examples.
// Retain the original fixture values for the seven existing requested assets.
const sampleMarket = Object.freeze({
  BTC: [68250.14, 28450000000],
  ETH: [3248.76, 14280000000],
  XRP: [0.5231, 1140000000],
  LTC: [72.48, 412000000],
  ADA: [0.3874, 368000000],
  DOGE: [0.1248, 978000000],
  SOL: [148.92, 2980000000],
  BCH: [358.17, 249000000],
  LINK: [14.27, 286000000],
  AVAX: [27.63, 429000000],
  DOT: [4.82, 178000000],
  XLM: [0.0981, 64000000],
  UNI: [7.64, 112000000],
  ATOM: [4.57, 129000000],
  SHIB: [0.0000189, 285000000],
  POL: [0.3412, 83000000],
  ETC: [24.67, 157000000],
  HBAR: [0.0527, 46000000],
  NEAR: [4.36, 234000000],
  AAVE: [153.82, 197000000],
  ICP: [8.13, 78000000],
  APT: [8.92, 186000000],
  ARB: [0.5634, 143000000],
  OP: [1.72, 129000000],
  SUI: [2.14, 542000000],
  ALGO: [0.1284, 34000000],
  FIL: [3.68, 95000000],
});

const descriptions = {
  BTC: "Bitcoin is a peer-to-peer digital currency secured by a proof-of-work network. Its public ledger records transactions without a central operator, and its protocol limits the total supply to 21 million coins.",
  ETH: "Ethereum is a programmable blockchain that supports smart contracts and decentralized applications. Ether is its native asset, used to pay network transaction fees and help secure the network through proof-of-stake validation.",
  LTC: "Litecoin is a peer-to-peer digital currency derived from Bitcoin's open-source design. It uses proof-of-work consensus with the Scrypt algorithm and targets shorter block intervals than Bitcoin.",
  ADA: "Cardano is a proof-of-stake blockchain developed with a research-oriented approach. ADA is its native asset and is used for network fees, staking, and participation in its governance ecosystem.",
  SOL: "Solana is a blockchain designed to support applications with high transaction throughput. SOL is its native asset for transaction fees and staking, while the network combines proof-of-stake consensus with a mechanism called proof of history.",
  LINK: "Chainlink is a decentralized oracle network that connects smart contracts with external data and services. LINK is the token used within its ecosystem to compensate service providers and support staking mechanisms.",
  AVAX: "Avalanche is a blockchain platform for smart contracts and customizable blockchain networks. AVAX is its native asset, used to pay transaction fees and participate in securing the network through staking.",
};

const categoryDescriptions = {
  "Digital currency": "Digital currencies support transfers of value through a blockchain network.",
  "Smart contract platform": "Smart contract platforms support programmable applications on a blockchain.",
  Payments: "Payment networks focus on transferring value between participants.",
  "Meme cryptocurrency": "Meme cryptocurrencies have identities shaped by online communities and culture.",
  "Oracle network": "Oracle networks connect blockchain applications with external information.",
  Interoperability: "Interoperability projects focus on communication between blockchain networks.",
  "Decentralized exchange": "Decentralized exchanges support trading through blockchain applications.",
  "Layer 2 scaling": "Layer 2 networks aim to expand capacity for an underlying blockchain.",
  "Lending protocol": "Lending protocols support borrowing and lending through blockchain applications.",
  "Decentralized storage": "Decentralized storage networks distribute storage across network participants.",
};

export const DEMO_ASSETS = Object.freeze(
  TEAM_ASSETS.map((profile) => {
    const [priceUsd, volume24hUsd] = sampleMarket[profile.symbol];
    return Object.freeze({
      ...profile,
      description: descriptions[profile.symbol] || `${profile.name} is listed in the ${profile.category.toLowerCase()} category. ${categoryDescriptions[profile.category]}`,
      market: Object.freeze({ priceUsd, volume24hUsd, asOf: SIMULATED_AS_OF }),
      sources: Object.freeze({
        profile: "Local demonstration profile",
        market: "Simulated market fixture — not a live quote",
      }),
      simulated: true,
    });
  }),
);
