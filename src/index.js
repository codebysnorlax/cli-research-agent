/**
 * Chat Agent — src/index.js
 * ─────────────────────────────────────────────────────────────────────
 * Interactive CLI chat with:
 *   • Terminal-based AI model selector (Gemini / OpenRouter)
 *   • Auto-fallback: Gemini → OpenRouter free models on rate-limit
 *   • Manual provider choice
 */

import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { createAgent } from "langchain";
import { selectModel } from "./config/selector.js";
import { createLLM } from "./config/provider.js";
import { FALLBACK_CHAIN, PROVIDERS } from "./config/models.js";
import { visitPage, webSearch } from "./tools/index.js";

// ── Colours ─────────────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

const spinnerFrames = ["⢿", "⣻", "⣽", "⣾", "⣷", "⣯", "⣟", "⡿"];

function getSystemPrompt() {
  const now = new Date().toLocaleString(undefined, { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short'
  });
  return `You are a helpful assistant. Answer clearly and keep replies short. You also have visit_page for urls, web_search for general search.\n\nCurrent Date and Time: ${now}`;
}
// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Format elapsed milliseconds as m:ss.ms (e.g. 1:05.32)
 */
function formatTimer(elapsedMs) {
  const mins = Math.floor(elapsedMs / 60000);
  const secs = Math.floor((elapsedMs % 60000) / 1000);
  const ms = Math.floor((elapsedMs % 1000) / 10);
  return `${mins}:${String(secs).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
}

/**
 * Returns true if the error looks like a rate-limit / quota exceeded.
 */
function isRateLimitError(err) {
  const msg = (err.message || String(err)).toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("resource exhausted") ||
    msg.includes("too many requests")
  );
}

/**
 * Build an agent for the given provider + model.
 */
function buildAgent(provider, modelId) {
  const llm = createLLM(provider, modelId);
  return createAgent({
    model: llm,
    tools: [webSearch, visitPage],
    systemPrompt: getSystemPrompt(),
  });
}

/**
 * Lookup the human-readable model name from the registry, stripping tags.
 */
function getCleanModelName(providerKey, modelId) {
  const provider = PROVIDERS[providerKey];
  if (!provider) return modelId;
  const model = provider.models.find((m) => m.id === modelId);
  return model ? model.label.replace(/\s*\(Free\)|\s*\(Paid\)/gi, "").trim() : modelId;
}

/**
 * Stream a response from the given agent, writing tokens to stdout.
 * Returns true if output was produced, false otherwise.
 */
async function streamResponse(agent, question, spinner, agentLabel, chatState) {
  let started = false;
  const controller = new AbortController();
  let timeoutId = setTimeout(() => controller.abort(new Error("Timeout: Model took too long to respond.")), 15000);

  try {
    const result = await agent.stream(
      { messages: [{ role: "human", content: question }] },
      { streamMode: "messages", recursionLimit: 6, signal: controller.signal }
    );

    for await (const [token] of result) {
      // Reset timeout on every token
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => controller.abort(new Error("Timeout: Stream stalled.")), 15000);

      if (token.type !== "ai") continue;

      if (token.tool_calls && token.tool_calls.length > 0 && chatState) {
        const tool = token.tool_calls[0].name;
        if (tool === "web_search") chatState.text = "Searching on web";
        if (tool === "visit_page") chatState.text = "Reading webpage";
      }

      const content = typeof token.content === "string" ? token.content : "";
      if (!content) continue;

      if (!started) {
        clearInterval(spinner);
        process.stdout.write(`\r\x1b[K${c.bold}${c.cyan}${agentLabel}:${c.reset} `);
        started = true;
      }
      process.stdout.write(content);
    }
  } finally {
    clearTimeout(timeoutId);
  }

  return started;
}

// ── Main ────────────────────────────────────────────────────────────

const selection = await selectModel();

let primaryAgent;
let activeLabel;

if (selection.mode === "manual") {
  // ── Manual: single agent, no fallback ───────────────────────────
  primaryAgent = buildAgent(selection.provider, selection.modelId);
  activeLabel = selection.label;
} else {
  // ── Auto: primary = first in fallback chain ─────────────────────
  const primary = FALLBACK_CHAIN[0];
  primaryAgent = buildAgent(primary.provider, primary.modelId);
  activeLabel = `${getCleanModelName(primary.provider, primary.modelId)} (auto)`;
}

const rl = readline.createInterface({ input, output });

console.log(
  `${c.green}●${c.reset} ${c.bold}Active model:${c.reset} ${c.cyan}${activeLabel}${c.reset}`
);
console.log(`${c.dim}Type "exit" to quit · "switch" to change model${c.reset}\n`);

while (true) {
  const question = await rl.question(`${c.bold}You:${c.reset} `);

  if (question.trim().toLowerCase() === "exit") break;
  if (!question.trim()) continue;

  // ── Runtime model switch ──────────────────────────────────────
  if (question.trim().toLowerCase() === "switch") {
    rl.close(); // close current rl so selector can open its own
    const newSelection = await selectModel();
    if (newSelection.mode === "manual") {
      primaryAgent = buildAgent(newSelection.provider, newSelection.modelId);
      activeLabel = newSelection.label;
    } else {
      const primary = FALLBACK_CHAIN[0];
      primaryAgent = buildAgent(primary.provider, primary.modelId);
      activeLabel = `${getCleanModelName(primary.provider, primary.modelId)} (auto)`;
    }
    // re-open rl
    const newRl = readline.createInterface({ input, output });
    // replace the outer rl reference (we reassign below after the loop)
    Object.assign(rl, newRl);
    console.log(
      `${c.green}●${c.reset} ${c.bold}Switched to:${c.reset} ${c.cyan}${activeLabel}${c.reset}\n`
    );
    continue;
  }

  // ── Normal chat turn ──────────────────────────────────────────
  let frameIdx = 0;
  let startTime = Date.now();
  let chatState = { text: "Thinking" };
  let spinner = setInterval(() => {
    const elapsed = formatTimer(Date.now() - startTime);
    const frame = spinnerFrames[frameIdx % spinnerFrames.length];
    // Slower dots: change every 5 frames (~400ms)
    const dots = ".".repeat(1 + (Math.floor(frameIdx / 5) % 3));
    process.stdout.write(
      `\r\x1b[K${c.cyan}${frame} [${elapsed}] ${chatState.text}${dots}${c.reset}`
    );
    frameIdx++;
  }, 80);

  let responded = false;

  try {
    responded = await streamResponse(primaryAgent, question, spinner, activeLabel, chatState);
  } catch (err) {
    clearInterval(spinner);
    process.stdout.write("\r\x1b[K");

    // ── Auto-fallback on rate-limit ─────────────────────────────
    if (selection.mode === "auto" && isRateLimitError(err)) {
      console.log(
        `\n${c.yellow}⚠ Rate limit hit on ${activeLabel}${c.reset} — trying fallbacks…`
      );

      for (let i = 1; i < FALLBACK_CHAIN.length; i++) {
        const fb = FALLBACK_CHAIN[i];
        const fallbackLabel = getCleanModelName(fb.provider, fb.modelId);
        console.log(
          `${c.dim}  → Attempting ${fallbackLabel}…${c.reset}`
        );

        try {
          const fallbackAgent = buildAgent(fb.provider, fb.modelId);

          let fbChatState = { text: `Thinking (${fallbackLabel})` };
          frameIdx = 0;
          startTime = Date.now();
          spinner = setInterval(() => {
            const elapsed = formatTimer(Date.now() - startTime);
            const frame = spinnerFrames[frameIdx % spinnerFrames.length];
            // Slower dots: change every 5 frames (~400ms)
            const dots = ".".repeat(1 + (Math.floor(frameIdx / 5) % 3));
            process.stdout.write(
              `\r\x1b[K${c.cyan}${frame} [${elapsed}] ${fbChatState.text}${dots}${c.reset}`
            );
            frameIdx++;
          }, 80);

          responded = await streamResponse(fallbackAgent, question, spinner, fallbackLabel, fbChatState);

          if (responded) {
            // Promote this fallback as the new primary for the session
            primaryAgent = fallbackAgent;
            activeLabel = `${fallbackLabel} (fallback)`;
            console.log(
              `\n${c.green}●${c.reset} ${c.dim}Switched to ${activeLabel} for this session${c.reset}`
            );
            break;
          }
        } catch (fbErr) {
          clearInterval(spinner);
          process.stdout.write("\r\x1b[K");
          const fbMsg = fbErr.message || String(fbErr);
          console.log(
            `${c.red}  ✗ ${fallbackLabel} failed:${c.reset} ${fbMsg.slice(0, 120)}`
          );
        }
      }

      if (!responded) {
        console.log(
          `\n${c.red}✗ All models exhausted.${c.reset} Try again later or run ${c.bold}"switch"${c.reset} to pick a different model.\n`
        );
        continue;
      }
    } else {
      // ── Non-rate-limit error ───────────────────────────────────
      const message = err.message || String(err);
      console.error(`\n${c.red}Error:${c.reset}`, message);
      if (isRateLimitError(err)) {
        console.log(
          `\n${c.yellow}Quota exceeded.${c.reset} Type ${c.bold}"switch"${c.reset} to change model.\n`
        );
      } else {
        console.log(
          `${c.dim}Check your API keys in .env${c.reset}\n`
        );
      }
      continue;
    }
  }

  clearInterval(spinner);
  if (!responded) {
    process.stdout.write("\r\x1b[K");
  }
  console.log("\n");
}

rl.close();
