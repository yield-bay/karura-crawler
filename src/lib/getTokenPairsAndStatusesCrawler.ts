import { ApiPromise } from "@polkadot/api";
import TokenPairsModel from "../models/tokenPairs";
import { wait } from "../utils";

interface TradingPairs {
  Token: string;
}

interface Filter {
  symbol: string;
}

export async function updateTokenPairsData(
  filter: Filter,
  data: TokenPairs
): Promise<void> {
  try {
    await TokenPairsModel.findOneAndUpdate(filter, data, { upsert: true });
  } catch (err) {
    console.error(err);
    throw new Error("Error while updating token pairs data");
  }
}

async function getTokenPairsAndStatuses(
  api: ApiPromise,
  enabled: Enabled
): Promise<void> {
  console.log("get token pairs and status info");
  const tradingPairStatuses =
    await api?.query.dex.tradingPairStatuses.entries();

  tradingPairStatuses.map((data) => {
    const tradingPair = data[0].toHuman() as unknown as TradingPairs[][];
    const pairSymbol = `${tradingPair[0][0]?.Token}-${tradingPair[0][1]?.Token}`;
    const token1Symbol = tradingPair[0][0]?.Token?.toString();
    const token2Symbol = tradingPair[0][1]?.Token?.toString();
    const status = data[1].toString();
    updateTokenPairsData(
      { symbol: pairSymbol },
      {
        symbol: pairSymbol,
        token1Symbol: token1Symbol,
        token2Symbol: token2Symbol,
        status: status,
      }
    );
  });
  enabled.liquidityCrawler = true;
}

export default async function getTokenPairsAndStatusesCrawler(
  api: ApiPromise,
  enabled: Enabled
): Promise<void> {
  while (true) {
    enabled.statusCrawler && (await getTokenPairsAndStatuses(api, enabled));
    await wait(20000);
  }
}
