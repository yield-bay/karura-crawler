import { ApiPromise } from "@polkadot/api";
import TokenPairsModel from "../models/tokenPairs";
import TokenModel from "../models/tokenInfo";
import { convertArrayToObject, wait } from "../utils";
import { updateTokenPairsData } from "./getTokenPairsAndStatusesCrawler";

interface TokensObj {
  [key: string]: TokenInfo;
}

interface TokensPairsObj {
  [key: string]: TokenPairs;
}

async function getLPYields(api: ApiPromise) {
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
  const karKsmIncentives = await api.query.incentives.incentiveRewardAmounts(
    {
      Dex: { DexShare: [{ TOKEN: "KAR" }, { TOKEN: "KSM" }] },
    },
    { TOKEN: "KAR" }
  );
  // console.log(karKsmIncentives.toHuman());

  const karKsmTvlUSD =
    tokenPairsObj["KAR-KSM"].token1Liquidity &&
    tokenPairsObj["KAR-KSM"].token2Liquidity &&
    tokensObj[tokenPairsObj["KAR-KSM"].token1Symbol].priceUSD &&
    tokensObj[tokenPairsObj["KAR-KSM"].token2Symbol].priceUSD
      ? (Number(BigInt(tokenPairsObj["KAR-KSM"].token1Liquidity)) /
          Math.pow(
            10,
            tokensObj[tokenPairsObj["KAR-KSM"].token1Symbol].decimals
          )) *
          tokensObj[tokenPairsObj["KAR-KSM"].token1Symbol].priceUSD +
        (Number(BigInt(tokenPairsObj["KAR-KSM"].token2Liquidity)) /
          Math.pow(
            10,
            tokensObj[tokenPairsObj["KAR-KSM"].token2Symbol].decimals
          )) *
          tokensObj[tokenPairsObj["KAR-KSM"].token2Symbol].priceUSD
      : null;

  // console.log("karKsmTvlUSD");
  // console.log(karKsmTvlUSD);

  const karKsmDailyIncentivesUSD =
    (Number(BigInt(karKsmIncentives)) /
      Math.pow(10, tokensObj["KAR"].decimals)) *
    tokensObj["KAR"].priceUSD *
    numberOf5BlocksPerDay;

  const karKsmdailyYield =
    (karKsmDailyIncentivesUSD / (karKsmTvlUSD + 1000)) * 100;

  // console.log(karKsmDailyIncentivesUSD);
  // console.log("karKsmdailyYield");
  // console.log(karKsmdailyYield);

  updateTokenPairsData(
    { symbol: "KAR-KSM" },
    {
      tvlUSD: karKsmTvlUSD,
      dailyAPR: karKsmdailyYield,
      incentives: [
        { token: "KAR", value: BigInt(karKsmIncentives).toString() },
      ],
    }
  );

  // KUSD-KSM incentives every 5 blocks
  const kusdKsmIncentives1 = await api.query.incentives.incentiveRewardAmounts(
    {
      Dex: { DexShare: [{ TOKEN: "KUSD" }, { TOKEN: "KSM" }] },
    },
    { TOKEN: "KAR" }
  );
  // console.log(kusdKsmIncentives1.toHuman());

  const kusdKsmIncentives2 = await api.query.incentives.incentiveRewardAmounts(
    {
      Dex: { DexShare: [{ TOKEN: "KUSD" }, { TOKEN: "KSM" }] },
    },
    { TOKEN: "KUSD" }
  );
  // console.log(kusdKsmIncentives2.toHuman());

  const kusdKsmTvlUSD =
    tokenPairsObj["KUSD-KSM"].token1Liquidity &&
    tokensObj[tokenPairsObj["KUSD-KSM"].token1Symbol].priceUSD &&
    tokenPairsObj["KUSD-KSM"].token2Liquidity &&
    tokensObj[tokenPairsObj["KUSD-KSM"].token2Symbol].priceUSD
      ? (Number(BigInt(tokenPairsObj["KUSD-KSM"].token1Liquidity)) /
          Math.pow(
            10,
            tokensObj[tokenPairsObj["KUSD-KSM"].token1Symbol].decimals
          )) *
          tokensObj[tokenPairsObj["KUSD-KSM"].token1Symbol].priceUSD +
        (Number(BigInt(tokenPairsObj["KUSD-KSM"].token2Liquidity)) /
          Math.pow(
            10,
            tokensObj[tokenPairsObj["KUSD-KSM"].token2Symbol].decimals
          )) *
          tokensObj[tokenPairsObj["KUSD-KSM"].token2Symbol].priceUSD
      : null;

  // console.log("kusdKsmTvlUSD");
  // console.log(kusdKsmTvlUSD);

  const kusdKsmDailyIncentivesUSD =
    ((Number(BigInt(kusdKsmIncentives1)) /
      Math.pow(10, tokensObj["KAR"].decimals)) *
      tokensObj["KAR"].priceUSD +
      (Number(BigInt(kusdKsmIncentives2)) /
        Math.pow(10, tokensObj["KUSD"].decimals)) *
        tokensObj["KUSD"].priceUSD) *
    numberOf5BlocksPerDay;

  const kusdKsmdailyYield =
    (kusdKsmDailyIncentivesUSD / (kusdKsmTvlUSD + 1000)) * 100;

  // console.log(kusdKsmDailyIncentivesUSD);
  // console.log("kusdKsmdailyYield");
  // console.log(kusdKsmdailyYield);

  updateTokenPairsData(
    { symbol: "KUSD-KSM" },
    {
      tvlUSD: kusdKsmTvlUSD,
      dailyAPR: kusdKsmdailyYield,
      incentives: [
        { token: "KAR", value: BigInt(kusdKsmIncentives1).toString() },
        { token: "KUSD", value: BigInt(kusdKsmIncentives2).toString() },
      ],
    }
  );

  // KUSD-BNC incentives every 5 blocks
  const kusdBncIncentives1 = await api.query.incentives.incentiveRewardAmounts(
    {
      Dex: { DexShare: [{ TOKEN: "KUSD" }, { TOKEN: "BNC" }] },
    },
    { TOKEN: "KAR" }
  );
  // console.log(kusdBncIncentives1.toHuman());

  const kusdBncIncentives2 = await api.query.incentives.incentiveRewardAmounts(
    {
      Dex: { DexShare: [{ TOKEN: "KUSD" }, { TOKEN: "BNC" }] },
    },
    { TOKEN: "BNC" }
  );
  // console.log("bnc_incentives");
  // console.log(kusdBncIncentives2.toHuman());

  const kusdBncTvlUSD =
    tokenPairsObj["KUSD-BNC"].token1Liquidity &&
    tokensObj[tokenPairsObj["KUSD-BNC"].token1Symbol].priceUSD &&
    tokenPairsObj["KUSD-BNC"].token2Liquidity &&
    tokensObj[tokenPairsObj["KUSD-BNC"].token2Symbol].priceUSD
      ? (Number(BigInt(tokenPairsObj["KUSD-BNC"].token1Liquidity)) /
          Math.pow(
            10,
            tokensObj[tokenPairsObj["KUSD-BNC"].token1Symbol].decimals
          )) *
          tokensObj[tokenPairsObj["KUSD-BNC"].token1Symbol].priceUSD +
        (Number(BigInt(tokenPairsObj["KUSD-BNC"].token2Liquidity)) /
          Math.pow(
            10,
            tokensObj[tokenPairsObj["KUSD-BNC"].token2Symbol].decimals
          )) *
          tokensObj[tokenPairsObj["KUSD-BNC"].token2Symbol].priceUSD
      : null;

  // console.log("kusdBncTvlUSD");
  // console.log(kusdBncTvlUSD);

  const kusdBncDailyIncentivesUSD =
    ((Number(BigInt(kusdBncIncentives1)) /
      Math.pow(10, tokensObj["KAR"].decimals)) *
      tokensObj["KAR"].priceUSD +
      (Number(BigInt(kusdBncIncentives2)) /
        Math.pow(10, tokensObj["KUSD"].decimals)) *
        tokensObj["BNC"].priceUSD) *
    numberOf5BlocksPerDay;

  const kusdBncdailyYield =
    (kusdBncDailyIncentivesUSD / (kusdBncTvlUSD + 1000)) * 100;

  // console.log(kusdBncDailyIncentivesUSD);
  // console.log("kusdBncdailyYield");
  // console.log(kusdBncdailyYield);

  updateTokenPairsData(
    { symbol: "KUSD-BNC" },
    {
      tvlUSD: kusdBncTvlUSD,
      dailyAPR: kusdBncdailyYield,
      incentives: [
        { token: "KAR", value: BigInt(kusdBncIncentives1).toString() },
        { token: "BNC", value: BigInt(kusdBncIncentives2).toString() },
      ],
    }
  );

  // KSM-LKSM incentives 5 blocks
  const ksmLksmIncentives = await api.query.incentives.incentiveRewardAmounts(
    {
      Dex: { DexShare: [{ TOKEN: "KSM" }, { TOKEN: "LKSM" }] },
    },
    { TOKEN: "KAR" }
  );
  // console.log(ksmLksmIncentives.toHuman());

  const ksmLksmTvlUSD =
    tokenPairsObj["KSM-LKSM"].token1Liquidity &&
    tokensObj[tokenPairsObj["KSM-LKSM"].token1Symbol].priceUSD &&
    tokenPairsObj["KSM-LKSM"].token2Liquidity &&
    tokensObj[tokenPairsObj["KSM-LKSM"].token2Symbol].priceUSD
      ? (Number(BigInt(tokenPairsObj["KSM-LKSM"].token1Liquidity)) /
          Math.pow(
            10,
            tokensObj[tokenPairsObj["KSM-LKSM"].token1Symbol].decimals
          )) *
          tokensObj[tokenPairsObj["KSM-LKSM"].token1Symbol].priceUSD +
        (Number(BigInt(tokenPairsObj["KSM-LKSM"].token2Liquidity)) /
          Math.pow(
            10,
            tokensObj[tokenPairsObj["KSM-LKSM"].token2Symbol].decimals
          )) *
          tokensObj[tokenPairsObj["KSM-LKSM"].token2Symbol].priceUSD
      : null;

  // console.log("ksmLksmTvlUSD");
  // console.log(ksmLksmTvlUSD);

  const ksmLksmDailyIncentivesUSD =
    (Number(BigInt(ksmLksmIncentives)) /
      Math.pow(10, tokensObj["KAR"].decimals)) *
    tokensObj["KAR"].priceUSD *
    numberOf5BlocksPerDay;

  const ksmLksmdailyYield =
    (ksmLksmDailyIncentivesUSD / (ksmLksmTvlUSD + 1000)) * 100;

  // console.log(ksmLksmDailyIncentivesUSD);
  // console.log("ksmLksmdailyYield");
  // console.log(ksmLksmdailyYield);

  updateTokenPairsData(
    { symbol: "KSM-LKSM" },
    {
      tvlUSD: ksmLksmTvlUSD,
      dailyAPR: ksmLksmdailyYield,
      incentives: [
        { token: "KAR", value: BigInt(ksmLksmIncentives).toString() },
      ],
    }
  );

  // KUSD-LKSM incentives every 5 blocks
  const kusdLksmIncentives = await api.query.incentives.incentiveRewardAmounts(
    {
      Dex: { DexShare: [{ TOKEN: "KUSD" }, { TOKEN: "LKSM" }] },
    },
    { TOKEN: "KAR" }
  );
  // console.log(kusdLksmIncentives.toHuman());

  const kusdLksmTvlUSD =
    tokenPairsObj["KUSD-LKSM"].token1Liquidity &&
    tokenPairsObj["KUSD-LKSM"].token2Liquidity &&
    tokensObj[tokenPairsObj["KUSD-LKSM"].token1Symbol].priceUSD &&
    tokensObj[tokenPairsObj["KUSD-LKSM"].token2Symbol].priceUSD
      ? (Number(BigInt(tokenPairsObj["KUSD-LKSM"].token1Liquidity)) /
          Math.pow(
            10,
            tokensObj[tokenPairsObj["KUSD-LKSM"].token1Symbol].decimals
          )) *
          tokensObj[tokenPairsObj["KUSD-LKSM"].token1Symbol].priceUSD +
        (Number(BigInt(tokenPairsObj["KUSD-LKSM"].token2Liquidity)) /
          Math.pow(
            10,
            tokensObj[tokenPairsObj["KUSD-LKSM"].token2Symbol].decimals
          )) *
          tokensObj[tokenPairsObj["KUSD-LKSM"].token2Symbol].priceUSD
      : null;

  // console.log("kusdLksmTvlUSD");
  // console.log(kusdLksmTvlUSD);

  const kusdLksmDailyIncentivesUSD =
    (Number(BigInt(kusdLksmIncentives)) /
      Math.pow(10, tokensObj["KAR"].decimals)) *
    tokensObj["KAR"].priceUSD *
    numberOf5BlocksPerDay;

  const kusdLksmdailyYield =
    (kusdLksmDailyIncentivesUSD / (kusdLksmTvlUSD + 1000)) * 100;

  // console.log(kusdLksmDailyIncentivesUSD);
  // console.log("kusdLksmdailyYield");
  // console.log(kusdLksmdailyYield);

  updateTokenPairsData(
    { symbol: "KUSD-LKSM" },
    {
      tvlUSD: kusdLksmTvlUSD,
      dailyAPR: kusdLksmdailyYield,
      incentives: [
        { token: "KAR", value: BigInt(kusdLksmIncentives).toString() },
      ],
    }
  );

  // KAR-KSM incentives every 5 blocks
  const karLksmIncentives = await api.query.incentives.incentiveRewardAmounts(
    {
      Dex: { DexShare: [{ TOKEN: "KAR" }, { TOKEN: "LKSM" }] },
    },
    { TOKEN: "KAR" }
  );
  // console.log(karLksmIncentives.toHuman());

  const karLksmTvlUSD =
    tokenPairsObj["KAR-LKSM"].token1Liquidity &&
    tokenPairsObj["KAR-LKSM"].token2Liquidity &&
    tokensObj[tokenPairsObj["KAR-LKSM"].token1Symbol].priceUSD &&
    tokensObj[tokenPairsObj["KAR-LKSM"].token2Symbol].priceUSD
      ? (Number(BigInt(tokenPairsObj["KAR-LKSM"].token1Liquidity)) /
          Math.pow(
            10,
            tokensObj[tokenPairsObj["KAR-LKSM"].token1Symbol].decimals
          )) *
          tokensObj[tokenPairsObj["KAR-LKSM"].token1Symbol].priceUSD +
        (Number(BigInt(tokenPairsObj["KAR-LKSM"].token2Liquidity)) /
          Math.pow(
            10,
            tokensObj[tokenPairsObj["KAR-LKSM"].token2Symbol].decimals
          )) *
          tokensObj[tokenPairsObj["KAR-LKSM"].token2Symbol].priceUSD
      : null;

  // console.log("karLksmTvlUSD");
  // console.log(karLksmTvlUSD);

  const karLksmDailyIncentivesUSD =
    (Number(BigInt(karLksmIncentives)) /
      Math.pow(10, tokensObj["KAR"].decimals)) *
    tokensObj["KAR"].priceUSD *
    numberOf5BlocksPerDay;

  const karLksmdailyYield =
    (karLksmDailyIncentivesUSD / (karLksmTvlUSD + 1000)) * 100;

  // console.log(karLksmDailyIncentivesUSD);
  // console.log("karLksmdailyYield");
  // console.log(karLksmdailyYield);

  updateTokenPairsData(
    { symbol: "KAR-LKSM" },
    {
      tvlUSD: karLksmTvlUSD,
      dailyAPR: karLksmdailyYield,
      incentives: [
        { token: "KAR", value: BigInt(karLksmIncentives).toString() },
      ],
    }
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
