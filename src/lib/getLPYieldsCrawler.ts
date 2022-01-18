import { ApiPromise } from "@polkadot/api";
import TokenPairsModel from "../models/tokenPairs";
import TokenModel from "../models/tokenInfo";
import { convertArrayToObject, toUnit, wait } from "../utils";
import { updateTokenPairsData } from "./getTokenPairsAndStatusesCrawler";
import { isNil } from "lodash";

interface TokensObj {
  [key: string]: TokenInfo;
}

interface TokensPairsObj {
  [key: string]: TokenPairs;
}

async function getLPIncentives(
  api: ApiPromise,
  poolInfo: TokenPairs,
  token1Info: TokenInfo,
  token2Info: TokenInfo,
  incentiveTokens: TokenInfo[]
) {
  const numberOf5BlocksPerDay = (24 * 60 * 60) / 6 / 5;
  const incentives: { token: string; value: string }[] = [];
  let tvlUSD: number | undefined;
  let dailyIncentiveUSD: number | undefined;
  let dailyAPR: number | undefined;
  for (let i = 0; i < incentiveTokens.length; i++) {
    const incentiveToken = incentiveTokens[i];
    const incentive = await api.query.incentives.incentiveRewardAmounts(
      {
        Dex: {
          DexShare: [
            { TOKEN: token1Info.symbol },
            { TOKEN: token2Info.symbol },
          ],
        },
      },
      { TOKEN: incentiveToken.symbol }
    );
    incentives.push({
      token: incentiveToken.symbol,
      value: incentive.toString(),
    });
  }
  if (incentives.length > 0) {
    if (
      !isNil(poolInfo?.token1Liquidity) &&
      !isNil(poolInfo?.token2Liquidity) &&
      !isNil(token1Info?.priceUSD) &&
      !isNil(token2Info?.priceUSD)
    ) {
      tvlUSD =
        toUnit(poolInfo.token1Liquidity, token1Info.decimals) *
          token1Info.priceUSD +
        toUnit(poolInfo.token2Liquidity, token2Info.decimals) *
          token2Info.priceUSD;
    }
    for (let i = 0, j = 0; i < incentives.length; i++) {
      const price = incentiveTokens[i]?.priceUSD;
      if (price !== undefined) {
        j +=
          toUnit(incentives[i].value, incentiveTokens[i].decimals) *
          price *
          numberOf5BlocksPerDay;

        if (i === incentiveTokens.length - 1) {
          dailyIncentiveUSD = j;
        }
      } else {
        break;
      }
    }
  }

  if (tvlUSD !== undefined && dailyIncentiveUSD !== undefined) {
    dailyAPR = (dailyIncentiveUSD / (tvlUSD + 1000)) * 100;
  }

  updateTokenPairsData(
    { symbol: poolInfo.symbol },
    {
      symbol: poolInfo.symbol,
      token1Symbol: poolInfo.token1Symbol,
      token2Symbol: poolInfo.token2Symbol,
      status: poolInfo.status,
      tvlUSD: tvlUSD,
      dailyAPR: dailyAPR,
      incentives: incentives,
    }
  );
}

async function getLPYields(api: ApiPromise): Promise<void> {
  console.info("calculating LP yields");
  const tokens = await TokenModel.find(
    {},
    { symbol: 1, decimals: 1, priceUSD: 1 }
  );

  const tokensObj: TokensObj = convertArrayToObject(tokens, "symbol");

  tokensObj["KUSD"].priceUSD = 1;

  const tokenPairs = await TokenPairsModel.find(
    {},
    {
      symbol: 1,
      token1Symbol: 1,
      token2Symbol: 1,
      token1Liquidity: 1,
      token2Liquidity: 1,
    }
  );

  const tokenPairsObj: TokensPairsObj = convertArrayToObject(
    tokenPairs,
    "symbol"
  );

  const numberOf5BlocksPerDay = (24 * 60 * 60) / 6 / 5;

  // KAR-KSM incentives every 5 blocks
  await getLPIncentives(
    api,
    tokenPairsObj["KAR-KSM"],
    tokensObj["KAR"],
    tokensObj["KSM"],
    [tokensObj["KAR"]]
  );

  // KUSD-KSM incentives every 5 blocks
  await getLPIncentives(
    api,
    tokenPairsObj["KUSD-KSM"],
    tokensObj["KUSD"],
    tokensObj["KSM"],
    [tokensObj["KAR"], tokensObj["KUSD"]]
  );

  // KUSD-BNC incentives every 5 blocks
  await getLPIncentives(
    api,
    tokenPairsObj["KUSD-BNC"],
    tokensObj["KUSD"],
    tokensObj["BNC"],
    [tokensObj["KAR"], tokensObj["BNC"]]
  );

  // KSM-LKSM incentives 5 blocks
  await getLPIncentives(
    api,
    tokenPairsObj["KSM-LKSM"],
    tokensObj["KSM"],
    tokensObj["LKSM"],
    [tokensObj["KAR"]]
  );

  // KUSD-LKSM incentives every 5 blocks
  await getLPIncentives(
    api,
    tokenPairsObj["KUSD-LKSM"],
    tokensObj["KUSD"],
    tokensObj["LKSM"],
    [tokensObj["KAR"]]
  );

  // KAR-LKSM incentives every 5 blocks
  await getLPIncentives(
    api,
    tokenPairsObj["KAR-LKSM"],
    tokensObj["KAR"],
    tokensObj["LKSM"],
    [tokensObj["KAR"]]
  );
}

export default async function getLPYieldsCrawler(
  api: ApiPromise,
  enabled: Enabled
) {
  while (true) {
    enabled.yieldsCrawler && (await getLPYields(api));
    await wait(20000);
  }
}
