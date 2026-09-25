import "dotenv/config";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { tavily } from "@tavily/core";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StateGraph, StateSchema, START, END } from "@langchain/langgraph";
import * as z from "zod";

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

const llm = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
  apiKey: geminiApiKey,
  temperature: 0,
});
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

// Spinner animation frames & status tracking
const spinnerFrames = ["⢿", "⣻", "⣽", "⣾", "⣷", "⣯", "⣟", "⡿"];
let currentStatus = "Processing...";

function setStatus(status) {
  currentStatus = status;
}

function formatTimer(elapsedMs) {
  const mins = Math.floor(elapsedMs / 60000);
  const secs = Math.floor((elapsedMs % 60000) / 1000);
  const ms = Math.floor((elapsedMs % 1000) / 10);
  const formattedSecs = String(secs).padStart(2, "0");
  const formattedMs = String(ms).padStart(2, "0");
  return `${mins}:${formattedSecs}.${formattedMs}`;
}

// Inline markdown rich_text parser for Notion API
function parseRichText(text) {
  if (!text) return [{ type: "text", text: { content: "" } }];

  const tokens = [];
  const regex = /(\*\*(.*?)\*\*|\*(.*?)\*|_(.*?)_|`(.*?)`|\[(.*?)\]\((.*?)\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const plain = text.slice(lastIndex, match.index);
      if (plain) tokens.push({ type: "text", text: { content: plain } });
    }

    const fullMatch = match[1];
    if (fullMatch.startsWith("**")) {
      tokens.push({
        type: "text",
        text: { content: match[2] },
        annotations: { bold: true },
      });
    } else if (fullMatch.startsWith("*")) {
      tokens.push({
        type: "text",
        text: { content: match[3] },
        annotations: { italic: true },
      });
    } else if (fullMatch.startsWith("_")) {
      tokens.push({
        type: "text",
        text: { content: match[4] },
        annotations: { italic: true },
      });
    } else if (fullMatch.startsWith("`")) {
      tokens.push({
        type: "text",
        text: { content: match[5] },
        annotations: { code: true },
      });
    } else if (fullMatch.startsWith("[")) {
      tokens.push({
        type: "text",
        text: {
          content: match[6],
          link: match[7] ? { url: match[7] } : null,
        },
      });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    const plain = text.slice(lastIndex);
    if (plain) tokens.push({ type: "text", text: { content: plain } });
  }

  if (tokens.length === 0) {
    tokens.push({ type: "text", text: { content: text } });
  }

  // Ensure content per token <= 2000 chars (Notion limit)
  const sanitizedTokens = [];
  for (const token of tokens) {
    const content = token.text.content || "";
    if (content.length <= 2000) {
      sanitizedTokens.push(token);
    } else {
      for (let i = 0; i < content.length; i += 2000) {
        sanitizedTokens.push({
          ...token,
          text: {
            ...token.text,
            content: content.slice(i, i + 2000),
          },
        });
      }
    }
  }

  return sanitizedTokens;
}

function mapLanguage(lang) {
  const l = (lang || "").toLowerCase().trim();
  const aliasMap = {
    js: "javascript",
    ts: "typescript",
    py: "python",
    sh: "bash",
    shell: "bash",
    yml: "yaml",
    html: "html",
    css: "css",
    json: "json",
    md: "markdown",
    c: "c",
    cpp: "cpp",
    cs: "csharp",
    java: "java",
    sql: "sql",
  };
  return aliasMap[l] || (l.length > 0 ? l : "plain text");
}

// Converts full Markdown document to native Notion Block structures
function markdownToNotionBlocks(markdown) {
  const blocks = [];
  const lines = markdown.split(/\r?\n/);
  let inCodeBlock = false;
  let codeLanguage = "plain text";
  let codeContent = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        blocks.push({
          object: "block",
          type: "code",
          code: {
            rich_text: parseRichText(codeContent.join("\n")),
            language: mapLanguage(codeLanguage),
          },
        });
        inCodeBlock = false;
        codeContent = [];
      } else {
        inCodeBlock = true;
        codeLanguage = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) continue;

    // Horizontal Rule / Divider
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      blocks.push({
        object: "block",
        type: "divider",
        divider: {},
      });
      continue;
    }

    // Heading 1 (# Heading)
    if (trimmed.startsWith("# ")) {
      blocks.push({
        object: "block",
        type: "heading_1",
        heading_1: {
          rich_text: parseRichText(trimmed.slice(2).trim()),
        },
      });
      continue;
    }

    // Heading 2 (## Heading)
    if (trimmed.startsWith("## ")) {
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: parseRichText(trimmed.slice(3).trim()),
        },
      });
      continue;
    }

    // Heading 3 (### Heading)
    if (trimmed.startsWith("### ")) {
      blocks.push({
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: parseRichText(trimmed.slice(4).trim()),
        },
      });
      continue;
    }

    // Bulleted list item (* item or - item or + item)
    if (/^[\*\-\+]\s+/.test(trimmed)) {
      const content = trimmed.replace(/^[\*\-\+]\s+/, "");
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: parseRichText(content),
        },
      });
      continue;
    }

    // Numbered list item (1. item, 2. item)
    if (/^\d+\.\s+/.test(trimmed)) {
      const content = trimmed.replace(/^\d+\.\s+/, "");
      blocks.push({
        object: "block",
        type: "numbered_list_item",
        numbered_list_item: {
          rich_text: parseRichText(content),
        },
      });
      continue;
    }

    // Quote (> quote)
    if (trimmed.startsWith("> ")) {
      blocks.push({
        object: "block",
        type: "quote",
        quote: {
          rich_text: parseRichText(trimmed.slice(2).trim()),
        },
      });
      continue;
    }

    // Default Paragraph
    blocks.push({
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: parseRichText(trimmed),
      },
    });
  }

  if (inCodeBlock && codeContent.length > 0) {
    blocks.push({
      object: "block",
      type: "code",
      code: {
        rich_text: parseRichText(codeContent.join("\n")),
        language: mapLanguage(codeLanguage),
      },
    });
  }

  return blocks;
}

const State = new StateSchema({
  topic: z.string(),
  notes: z.string().default(""),
  notionUrl: z.string().default(""),
});

async function writeNotes(state) {
  setStatus("Searching web with Tavily...");
  const search = await tvly.search(state.topic, { maxResults: 5 });
  const research = JSON.stringify(search.results ?? []);

  setStatus("Generating study notes with Gemini...");
  const reply = await llm.invoke(
    `Write in-depth study notes on: ${state.topic}\n\nWeb research:\n${research}\n\nUse markdown with headings, bold text, bullet points, quotes, code blocks (if relevant), and dividers.`
  );

  return { notes: reply.content };
}

async function saveToNotion(state) {
  setStatus("Parsing Markdown to Notion structured blocks...");
  const blocks = markdownToNotionBlocks(state.notes);

  setStatus("Saving page to Notion...");
  const initialChildren = blocks.slice(0, 100);

  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parent: { page_id: process.env.NOTION_PAGE_ID },
      properties: {
        title: { title: [{ text: { content: state.topic } }] },
      },
      children: initialChildren,
    }),
  });

  const page = await res.json();
  if (!res.ok || page.object === "error") {
    throw new Error(page.message || `Notion API Error: ${res.statusText}`);
  }

  // Batch append if > 100 blocks
  if (blocks.length > 100) {
    for (let i = 100; i < blocks.length; i += 100) {
      setStatus(`Appending Notion blocks (${i}/${blocks.length})...`);
      const batch = blocks.slice(i, i + 100);
      const appendRes = await fetch(
        `https://api.notion.com/v1/blocks/${page.id}/children`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ children: batch }),
        }
      );
      if (!appendRes.ok) {
        const errJson = await appendRes.json();
        throw new Error(
          errJson.message || `Failed to append blocks to Notion page`
        );
      }
    }
  }

  return { notionUrl: page.url };
}

const graph = new StateGraph(State)
  .addNode("writeNotes", writeNotes)
  .addNode("saveToNotion", saveToNotion)
  .addEdge(START, "writeNotes")
  .addEdge("writeNotes", "saveToNotion")
  .addEdge("saveToNotion", END)
  .compile();

const rl = readline.createInterface({ input: stdin, output: stdout });
console.log("Notion Notes Workflow — LangGraph");
console.log('Enter a topic (or "exit")\n');

while (true) {
  const topic = await rl.question("Topic: ");
  if (topic.trim().toLowerCase() === "exit") break;
  if (!topic.trim()) continue;

  let frameIdx = 0;
  const startTime = Date.now();
  setStatus("Starting workflow...");

  const spinner = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const timerStr = formatTimer(elapsed);
    const frame = spinnerFrames[frameIdx++ % spinnerFrames.length];
    process.stdout.write(`\r${frame} [${timerStr}] ${currentStatus}`);
  }, 50);

  try {
    const result = await graph.invoke({ topic });
    clearInterval(spinner);
    const totalTime = formatTimer(Date.now() - startTime);
    process.stdout.write(`\r\x1b[K✔ Notion page created in ${totalTime}\n`);
    console.log("Notion page:", result.notionUrl, "\n");
  } catch (err) {
    clearInterval(spinner);
    process.stdout.write("\r\x1b[K");
    console.error("\nWorkflow Error:", err.message || err, "\n");
  }
}

rl.close();
