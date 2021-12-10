import { Schema, model } from "mongoose";

const schema = new Schema<Token>(
  {
    symbol: { type: String, required: true, unique: true },
    decimals: { type: Number, required: true },
    isNative: { type: Boolean, required: true },
    isStable: { type: Boolean, required: true },
    priceUSD: { type: Number },
  },
  { timestamps: true }
);

const TokenModel = model<Token>("Token", schema);

export default TokenModel;
