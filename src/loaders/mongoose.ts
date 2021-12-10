import mongoose from "mongoose";
import config from "../config";

export default async function mongooseConnect() {
  try {
    await mongoose.connect(config.databaseURL);
  } catch (err) {
    console.error(err);
    throw new Error("database failed to connect");
  }
}
