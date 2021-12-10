import { ApiPromise } from "@polkadot/api";
import TokenPairsModel from "../models/tokenPairs";
import { wait } from "../utils";

interface TradingPair {
  Token: string;
}

interface Filter {
  symbol: string;
}

interface UpdateData {
  token1Liquidity: string;
  token2Liquidity: string;
}

async function updateTokenPairsData(
  filter: Filter,
  data: UpdateData
): Promise<void> {
  try {
    await TokenPairsModel.findOneAndUpdate(filter, data, { upsert: true });
    // console.log("updated token pairs liquidity");
  } catch (err) {
    console.error(err);
    throw new Error("Error while updating token pairs liquidity");
  }
}

async function getTokenPairsLiquidity(api: ApiPromise) {
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
}

export default async function getTokenPairsLiquidityCrawler(api: ApiPromise) {
  while (true) {
    await getTokenPairsLiquidity(api);
    await wait(30000);
  }
}
