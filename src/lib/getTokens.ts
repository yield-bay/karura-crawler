import { ApiPromise } from "@polkadot/api";
import TokenModel from "../models/tokens";
import config from "../config";

interface Filter {
  symbol: string;
}

export async function updateTokenData(
  filter: Filter,
  data: Token
): Promise<void> {
  try {
    await TokenModel.findOneAndUpdate(filter, data, { upsert: true });
  } catch (err) {
    console.error(err);
    throw new Error("Error while updating token data");
  }
}

export default async function getTokens(api: ApiPromise) {
  api?.rpc.system.properties((data) => {
    const tokenSymbol = data.tokenSymbol.unwrap().map((a) => a.toString());
    const tokenDecimals = data.tokenDecimals.unwrap().map((a) => a.toNumber());
    console.info(tokenSymbol);
    console.info(tokenDecimals);
    tokenSymbol?.map((token, index) => {
      const info: Token = {
        symbol: token,
        decimals: tokenDecimals[index],
        isNative: config.nativeTokens.includes(token),
        isStable: config.stableTokens.includes(token),
      };
      updateTokenData(
        {
          symbol: token,
        },
        info
      );
    });
  });
}
