export const NETWORKS = {
  97: {
    chainId: 97,
    chainIdHex: "0x61",
    name: "BNB Smart Chain Testnet",
    shortName: "BSC Testnet",
    nativeSymbol: "tBNB",
    blockExplorer: "https://testnet.bscscan.com",

    usdtPresets: [
      {
        label: "USDT",
        address:
          "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
      },
    ],
  },
};

export const DEFAULT_NETWORK = NETWORKS[97];