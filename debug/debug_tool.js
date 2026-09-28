import "dotenv/config";
import { visitPage } from "../src/tools/index.js";

async function main() {
  const result = await visitPage.invoke({ url: "https://openrouter.ai/models?variant=free" });
  console.log("Length:", result.length);
  console.log("Preview:", result.substring(0, 500));
}
main().catch(console.error);
