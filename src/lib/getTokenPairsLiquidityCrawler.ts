import { ApiPromise } from "@polkadot/api";
import TokenPairsModel from "../models/tokenPairs";
import { wait } from "../utils";
import { updateTokenPairsData } from "./getTokenPairsAndStatusesCrawler";

interface TradingPair {
  Token: string;
}

interface Filter {
  symbol: string;
}

async function getTokenPairsLiquidity(
  api: ApiPromise,
  enabled: Enabled
): Promise<void> {
  console.log("get token pairs liquidity info");
  const liquidity = await api.query.dex.liquidityPool.entries();

  liquidity.forEach(
    ([
      {
        args: [tokenPair],
      },
      value,
    ]) => {
      const pair = tokenPair.toHuman() as unknown as TradingPair[];
      const lpArr = value.toJSON() as string[];
      const symbol = pair[0].Token + "-" + pair[1].Token;
      const token1Liquidity = BigInt(lpArr[0]).toString();
      const token2Liquidity = BigInt(lpArr[1]).toString();
      updateTokenPairsData(
        { symbol: symbol },
        {
          token1Liquidity: token1Liquidity,
          token2Liquidity: token2Liquidity,
        }
      );
    }
  );
  enabled.pricesCrawler = true;
}

export default async function getTokenPairsLiquidityCrawler(
  api: ApiPromise,
  enabled: Enabled
): Promise<void> {
  while (true) {
    enabled.liquidityCrawler && (await getTokenPairsLiquidity(api, enabled));
    await wait(20000);
  }
}
