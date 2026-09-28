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
    const result = await agent.invoke(
      { messages: [{ role: "human", content: "search this web and list all free model name https://openrouter.ai/models?variant=free" }] },
      { recursionLimit: 6 }
    );
    console.log("SUCCESS:");
    for (const m of result.messages) {
      console.log(`[${m._getType()}]`, m.content, m.tool_calls || m.name);
    }
  } catch (err) {
    console.log("ERROR:", err.message);
  }
}
main().catch(console.error);
