import { ApiPromise, WsProvider } from "@polkadot/api";
import { options } from "@acala-network/api";
import config from "../config";
import getTokens from "./getTokens";
import getTokenPairsAndStatusesCrawler from "./getTokenPairsAndStatusesCrawler";
import getTokenPairsLiquidityCrawler from "./getTokenPairsLiquidityCrawler";
import getTokenPricesCrawler from "./getTokenPricesCrawler";

async function getApiProvider(): Promise<ApiPromise> {
  const wsProviderUrl = config.wsProviderUrl;
  //   let isError = false;
  const provider = new WsProvider(wsProviderUrl, false);
  await provider.connect();
  provider.on("error", async (err) => {
    console.error("Error: Unable to connect to the provider, exiting...");
    throw new Error(err);
  });
  const api = await ApiPromise.create(options({ provider }));
  api.on("error", async (err) => {
    console.error("Error: API crashed");
    await api.disconnect();
    throw new Error(err);
  });
  api.on("disconnected", async () => {
    throw new Error("API has been disconnected from the endpoint");
  });
  try {
    await api.isReady;
    console.info("API is ready!");
  } catch (error) {
    console.error("Error", error);
  }
  return api;
}

export default async function startSubscriptions() {
  const api = await getApiProvider();

  await getTokens(api);
  getTokenPairsAndStatusesCrawler(api);
  getTokenPairsLiquidityCrawler(api);
  getTokenPricesCrawler();
}
