interface TokenPairs {
  symbol?: string;
  token1Symbol?: string;
  token2Symbol?: string;
  status?: string;
  token1Liquidity?: string;
  token2Liquidity?: string;
  tvlUSD?: number;
  incentives?: [{ token: string; value: string }];
  dailyAPR?: number;
}
