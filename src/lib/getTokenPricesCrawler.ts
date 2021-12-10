import TokenPairsModel from "../models/tokenPairs";
import TokenModel from "../models/tokens";
import { convertArrayToObject, wait } from "../utils";
import { updateTokenData } from "./getTokens";

interface TokensObj {
  [key: string]: Token;
}

async function getTokenPrices() {
  const tokens = await TokenModel.find(
    {},
    { symbol: 1, isStable: 1, decimals: 1 }
  );

  const tokensObj: TokensObj = convertArrayToObject(tokens, "symbol");

  tokensObj["KUSD"].priceUSD = 1;

  const tokenPairs = await TokenPairsModel.find(
    {},
    { createdAt: 0, updatedAt: 0 }
  );

  const tokensPairsWithKUSD = tokenPairs.filter(
    (data) => data.token1Symbol === "KUSD" || data.token2Symbol === "KUSD"
  );

  tokensPairsWithKUSD.map((data) => {
    const token1Liquidity = data?.token1Liquidity
      ? Number(BigInt(data.token1Liquidity)) /
        Math.pow(10, tokensObj[data?.token1Symbol].decimals)
      : null;
    const token2Liquidity = data?.token2Liquidity
      ? Number(BigInt(data.token2Liquidity)) /
        Math.pow(10, tokensObj[data?.token1Symbol].decimals)
      : null;

    if (token1Liquidity && token2Liquidity) {
      if (data.token1Symbol === "KUSD") {
        const price =
          token1Liquidity && token2Liquidity
            ? token1Liquidity / token2Liquidity
            : null;

        if (price) {
          tokensObj[data.token2Symbol].priceUSD = price;
        }
      } else {
        const price =
          token1Liquidity && token2Liquidity
            ? token2Liquidity / token1Liquidity
            : null;
        if (price) {
          tokensObj[data.token1Symbol].priceUSD = price;
        }
      }
    }
  });
  const tokensPairsWithoutKUSD = tokenPairs.filter(
    (data) => !(data.token1Symbol === "KUSD" || data.token2Symbol === "KUSD")
  );

  tokensPairsWithoutKUSD.map((data) => {
    const token1Liquidity = data?.token1Liquidity
      ? Number(BigInt(data.token1Liquidity)) /
        Math.pow(10, tokensObj[data?.token1Symbol].decimals)
      : null;
    const token2Liquidity = data?.token2Liquidity
      ? Number(BigInt(data.token2Liquidity)) /
        Math.pow(10, tokensObj[data?.token1Symbol].decimals)
      : null;
    if (token1Liquidity && token2Liquidity) {
      if (!tokensObj[data.token1Symbol]?.priceUSD) {
        if (tokensObj[data.token2Symbol]?.priceUSD) {
          const exchangeRate1to2 = token2Liquidity / token1Liquidity;
          tokensObj[data.token1Symbol].priceUSD =
            tokensObj[data.token2Symbol].priceUSD * exchangeRate1to2;
        }
      } else if (!tokensObj[data.token2Symbol]?.priceUSD) {
        if (tokensObj[data.token1Symbol]?.priceUSD) {
          const exchangeRate1to2 = token2Liquidity / token1Liquidity;
          tokensObj[data.token2Symbol].priceUSD =
            tokensObj[data.token1Symbol].priceUSD / exchangeRate1to2;
        }
      }
    }
  });
  Object.values(tokensObj).map((data) => {
    if (data?.priceUSD) {
      updateTokenData({ symbol: data.symbol }, { priceUSD: data.priceUSD });
    }
  });
}

export default async function getTokenPricesCrawler() {
  while (true) {
    await getTokenPrices();
    await wait(60000);
  }
}
