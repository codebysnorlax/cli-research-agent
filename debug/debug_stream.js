import "dotenv/config";
import { createAgent } from "langchain";
import { createLLM } from "../src/config/provider.js";
import { visitPage, webSearch } from "../src/tools/index.js";

async function main() {
  const llm = createLLM("openrouter", "openrouter/free", { streaming: true, temperature: 0 });
  const agent = createAgent({
    model: llm,
    tools: [webSearch, visitPage],
    systemPrompt: "You are a helpful assistant.",
  });
  
  const result = await agent.stream(
    { messages: [{ role: "human", content: "search this web and list all free model name https://openrouter.ai/models?variant=free" }] },
    { streamMode: "messages", recursionLimit: 6 }
  );
  
  for await (const [token] of result) {
    if (token.type === 'ai') {
        process.stdout.write(token.content || "");
    }
  }
}
main().catch(console.error);
