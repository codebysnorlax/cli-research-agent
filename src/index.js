import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { createAgent } from "langchain";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { visitPage, webSearch } from "./tools/index.js";

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

const spinnerFrames = ["⢿", "⣻", "⣽", "⣾", "⣷", "⣯", "⣟", "⡿"];

const agent = createAgent({
  model: new ChatGoogleGenerativeAI({
    model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
    apiKey: geminiApiKey,
    streaming: true,
  }),
  tools: [webSearch, visitPage],
  systemPrompt:
    "You are a helpful assistant. Answer clearly and keep replies short. You also have visit_page for urls, web_search for general search.",
});

const rl = readline.createInterface({ input, output });

console.log("Chat agent. type 'exit' to quit.\n");

while (true) {
  const question = await rl.question("You: ");

  if (question.trim().toLowerCase() === "exit") break;
  if (!question.trim()) continue;

  let frameIdx = 0;
  const spinner = setInterval(() => {
    process.stdout.write(
      `\r${spinnerFrames[frameIdx++ % spinnerFrames.length]} Thinking...`,
    );
  }, 80);

  let started = false;

  try {
    const result = await agent.stream(
      { messages: [{ role: "human", content: question }] },
      { streamMode: "messages", recursionLimit: 6 },
    );

    for await (const [token] of result) {
      if (token.type !== "ai") continue;
      const content = typeof token.content === "string" ? token.content : "";
      if (!content) continue;

      if (!started) {
        clearInterval(spinner);
        process.stdout.write("\r\x1b[KAgent: ");
        started = true;
      }
      process.stdout.write(content);
    }
    clearInterval(spinner);
    if (!started) {
      process.stdout.write("\r\x1b[K");
    }
    console.log("\n");
  } catch (err) {
    clearInterval(spinner);
    process.stdout.write("\r\x1b[K");
    const message = err.message || String(err);
    console.error("\nError calling Gemini API:", message);
    if (message.includes("429") || message.toLowerCase().includes("quota")) {
      console.log(
        "\nGemini quota exceeded. Wait for the quota reset or use another project/API key.\n",
      );
    } else {
      console.log("\nCheck your Gemini API key in .env (GEMINI_API_KEY).\n");
    }
  }
}

rl.close();
