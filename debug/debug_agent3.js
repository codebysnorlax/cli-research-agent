import "dotenv/config";
import { createAgent } from "langchain";
import { createLLM } from "../src/config/provider.js";
import { visitPage, webSearch } from "../src/tools/index.js";

async function main() {
  const llm = createLLM("openrouter", "google/gemma-3-27b-it:free", { streaming: false, temperature: 0 });
  const agent = createAgent({
    model: llm,
    tools: [webSearch, visitPage],
    systemPrompt: "You are a helpful assistant. Use tools if needed.",
  });
  
  const result = await agent.invoke(
    { messages: [{ role: "human", content: "list all free model name https://openrouter.ai/models?variant=free" }] },
    { recursionLimit: 6 }
  );
  console.log(result.messages.map(m => m.name || m.type + ": " + (m.content ? m.content.slice(0, 100) : "empty")));
}
main().catch(console.error);
