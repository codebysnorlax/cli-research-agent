import "dotenv/config";
import { createAgent } from "langchain";
import { createLLM } from "../src/config/provider.js";
import { visitPage, webSearch } from "../src/tools/index.js";

async function main() {
  const llm = createLLM("openrouter", "google/gemini-2.5-pro", { streaming: false, temperature: 0 });
  const agent = createAgent({
    model: llm,
    tools: [webSearch, visitPage],
    systemPrompt: "You are a helpful assistant.",
  });
  
  const result = await agent.invoke(
    { messages: [{ role: "human", content: "search this web and list all free model name https://openrouter.ai/models?variant=free" }] },
    { recursionLimit: 6 }
  );
  console.log(result.messages.map(m => m.name || m.type + ": " + m.content));
}
main().catch(console.error);
