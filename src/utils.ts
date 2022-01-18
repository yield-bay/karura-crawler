import BN from "bn.js";
import BigNumber from "bignumber.js";

export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function convertArrayToObject(array: any[], key: string | number) {
  const initialValue = {};
  return array.reduce((obj, item) => {
    return {
      ...obj,
      [item[key]]: item,
    };
  }, initialValue);
}

export function toUnit(balance: string, decimals: number): number {
  const base = new BigNumber(10).pow(new BigNumber(decimals));
  const bnBalance = new BigNumber(balance);
  const dm = bnBalance.div(base);
  return dm.toNumber();
}
