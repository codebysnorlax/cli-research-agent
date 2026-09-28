import "dotenv/config";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { createLLM } from "../src/config/provider.js";
import { visitPage, webSearch } from "../src/tools/index.js";

async function main() {
  const llm = createLLM("openrouter", "google/gemma-3-27b-it:free", { streaming: false, temperature: 0 });
  const agent = createReactAgent({
    llm: llm,
    tools: [webSearch, visitPage],
    messageModifier: "You are a helpful assistant.",
  });
  
  const result = await agent.invoke(
    { messages: [{ role: "human", content: "hi" }] },
    { recursionLimit: 6 }
  );
  console.log(result.messages.map(m => m.name || m.type + ": " + (m.content ? m.content.slice(0, 100) : "empty")));
}
main().catch(console.error);
