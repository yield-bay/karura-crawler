import BN from "bn.js";

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
  const base = new BN(10).pow(new BN(decimals));
  const bnBalance = new BN(balance);
  const dm = bnBalance.divmod(base);
  var zeroStr =
    decimals > dm.mod.toString().length
      ? "0".repeat(decimals - dm.mod.toString().length)
      : "";
  const decimalPart = zeroStr + dm.mod.toString();
  return parseFloat(dm.div.toString() + "." + decimalPart);
}
