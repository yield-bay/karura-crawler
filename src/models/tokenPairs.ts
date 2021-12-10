import { Schema, model } from "mongoose";

const schema = new Schema<TokenPairs>(
  {
    symbol: { type: String, required: true, unique: true },
    token1Symbol: { type: String, required: true },
    token2Symbol: { type: String, required: true },
    status: { type: String, required: true },
    token1Liquidity: { type: String },
    token2Liquidity: { type: String },
  },
  { timestamps: true }
);

const TokenPairsModel = model<TokenPairs>("token_pairs", schema);

export default TokenPairsModel;
