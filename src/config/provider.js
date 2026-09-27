/**
 * Provider Factory
 * ─────────────────────────────────────────────────────────────────────
 * Creates LangChain-compatible LLM instances for any provider/model combo.
 */

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";

/**
 * Build an LLM instance for the given provider + model.
 *
 * @param {"gemini"|"openrouter"} provider
 * @param {string} modelId  — e.g. "gemini-3.6-flash" or "openrouter/free"
 * @param {{ streaming?: boolean, temperature?: number }} opts
 * @returns {import("@langchain/core/language_models/chat_models").BaseChatModel}
 */
export function createLLM(provider, modelId, opts = {}) {
  const { streaming = true, temperature } = opts;

  if (provider === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY in .env");

    return new ChatGoogleGenerativeAI({
      model: modelId,
      apiKey,
      streaming,
      ...(temperature !== undefined && { temperature }),
    });
  }

  if (provider === "openrouter") {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("Missing OPENROUTER_API_KEY in .env");

    return new ChatOpenAI({
      modelName: modelId,
      streaming,
      ...(temperature !== undefined && { temperature }),
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "https://github.com/langchain_langgraph",
          "X-Title": "LangChain LangGraph POC",
        },
      },
      apiKey,
    });
  }

  throw new Error(`Unknown provider: ${provider}`);
}
