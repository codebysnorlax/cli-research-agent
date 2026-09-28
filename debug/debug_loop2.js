import "dotenv/config";
import { createAgent } from "langchain";
import { createLLM } from "../src/config/provider.js";
import { visitPage, webSearch } from "../src/tools/index.js";

async function main() {
  const llm = createLLM("openrouter", "openrouter/free", { streaming: false, temperature: 0 });
  const agent = createAgent({
    model: llm,
    tools: [webSearch, visitPage],
    systemPrompt: "You are a helpful assistant.",
  });
  
  try {
    const result = await agent.stream(
      { messages: [{ role: "human", content: "search this web and list all free model name https://openrouter.ai/models?variant=free" }] },
      { streamMode: "values", recursionLimit: 6 }
    );
    for await (const val of result) {
      const msgs = val.messages;
      const last = msgs[msgs.length - 1];
      console.log(`[${last._getType()}]`, last.content ? String(last.content).slice(0, 50) : "", last.tool_calls || last.name);
    }
  } catch (err) {
    console.log("ERROR:", err.message);
  }
}
main().catch(console.error);
