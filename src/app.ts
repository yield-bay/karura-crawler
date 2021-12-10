import loaders from "./loaders";
import startSubscriptions from "./lib";

async function main() {
  await loaders();
  await startSubscriptions();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
