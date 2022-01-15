import TokenPairsModel from "../models/tokenPairs";
import TokenModel from "../models/tokenInfo";
import { convertArrayToObject, wait } from "../utils";
import { updateTokenData } from "./getTokens";
import { SwapPromise } from "@acala-network/sdk-swap";
import { FixedPointNumber, Token } from "@acala-network/sdk-core";
import { SwapParameters } from "@acala-network/sdk-swap/swap-parameters";
import { WalletPromise } from "@acala-network/sdk-wallet";
import { ApiPromise } from "@polkadot/api";
import tokenInfo from "../models/tokenInfo";

interface TokensObj {
  [key: string]: TokenInfo;
}

async function getSwapParameters(
  path: [Token, Token],
  supplyAmount: FixedPointNumber,
  swapPromise: SwapPromise
) {
  const parameters: SwapParameters | undefined = await swapPromise.swap(
    path,
    supplyAmount,
    "EXACT_INPUT"
  );
  return { ...parameters };
}

async function getTokenPrices(
  api: ApiPromise,
  enabled: Enabled
): Promise<void> {
  console.log("get tokens prices info");
  const tokens = await TokenModel.find(
    {},
    { symbol: 1, isStable: 1, decimals: 1 }
  );

  const tokensObj: TokensObj = convertArrayToObject(tokens, "symbol");

  tokensObj["KUSD"].priceUSD = 1;

  const swapPromise = new SwapPromise(api);
  const walletPromise = new WalletPromise(api);

  const swapToken2 = walletPromise.getToken("KUSD");

  const tokensWithoutKUSD = tokens.filter((data) => data.symbol !== "KUSD");

  for (let index = 0; index < tokensWithoutKUSD.length; index++) {
    const tokenInfo = tokensWithoutKUSD[index];
    const swapToken1 = walletPromise.getToken(tokenInfo.symbol);
    const supplyAmount = new FixedPointNumber(1, swapToken1.decimal);
    const swapPath = [swapToken1, swapToken2] as [Token, Token];
    try {
      const parameters = await getSwapParameters(
        swapPath,
        supplyAmount,
        swapPromise
      );
      console.info(tokenInfo.symbol);
      console.info(parameters.midPrice?.toNumber());
      tokensObj[tokenInfo.symbol].priceUSD = parameters.midPrice?.toNumber();
    } catch (error) {
      console.info(tokenInfo.symbol);
      console.error("Error", error?.name);
      tokensObj[tokenInfo.symbol].priceUSD = undefined;
    }
  }

  Object.values(tokensObj).map((data) => {
    if (data?.priceUSD && data?.symbol) {
      updateTokenData(
        { symbol: data.symbol },
        { symbol: data.symbol, priceUSD: data.priceUSD }
      );
    }
  });
  enabled.yieldsCrawler = true;
}

export default async function getTokenPricesCrawler(
  api: ApiPromise,
  enabled: Enabled
): Promise<void> {
  while (true) {
    enabled.pricesCrawler && (await getTokenPrices(api, enabled));
    await wait(20000);
  }
}
