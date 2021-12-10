import mongooseConnect from "./mongoose";

export default async function loaders(): Promise<void> {
  // connect to database
  await mongooseConnect();
  console.info("connected to db");
}
