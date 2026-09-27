/**
 * Model Selector — Interactive Arrow-Key Terminal UI
 * ─────────────────────────────────────────────────────────────────────
 * Two-step selection:
 *   Step 1 → Pick provider: Auto / Gemini / OpenRouter
 *   Step 2 → Pick a model from the chosen provider
 *
 * Navigate with ↑↓ arrow keys, confirm with Enter.
 */

import { stdin, stdout } from "node:process";
import { PROVIDERS, FALLBACK_CHAIN } from "./models.js";

// ── ANSI helpers ────────────────────────────────────────────────────
const ESC = "\x1b";
const c = {
  reset: `${ESC}[0m`,
  bold: `${ESC}[1m`,
  dim: `${ESC}[2m`,
  cyan: `${ESC}[36m`,
  green: `${ESC}[32m`,
  yellow: `${ESC}[33m`,
  magenta: `${ESC}[35m`,
  white: `${ESC}[37m`,
  red: `${ESC}[31m`,
  bgCyan: `${ESC}[46m${ESC}[30m`,
  hideCursor: `${ESC}[?25l`,
  showCursor: `${ESC}[?25h`,
  clearScreen: `${ESC}[2J${ESC}[H`,
};

/**
 * Generic arrow-key list selector.
 * Clears and redraws cleanly on each keystroke.
 *
 * @param {string} title
 * @param {{ label: string, hint?: string, tag?: string, tagColor?: string }[]} items
 * @returns {Promise<number>} selected index
 */
function arrowSelect(title, items) {
  return new Promise((resolve) => {
    let cursor = 0;
    let renderedLineCount = 0;

    function render() {
      // Erase previous render by moving up and clearing each line
      if (renderedLineCount > 0) {
        stdout.write(`${ESC}[${renderedLineCount}A`); // move up
        for (let i = 0; i < renderedLineCount; i++) {
          stdout.write(`${ESC}[2K${ESC}[1B`); // clear line, move down
        }
        stdout.write(`${ESC}[${renderedLineCount}A`); // move back up
      }

      const lines = [];

      // Title + divider
      lines.push(`  ${c.bold}${c.cyan}${title}${c.reset}`);
      lines.push(`  ${c.dim}${"─".repeat(46)}${c.reset}`);

      // Items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const active = i === cursor;

        const pointer = active ? `${c.cyan}>${c.reset}` : " ";
        const label = active
          ? `${c.bold}${c.white}${item.label}${c.reset}`
          : `  ${c.dim}${item.label}${c.reset}`;

        let parts = `  ${pointer} ${label}`;

        if (item.hint) {
          parts += `  ${c.dim}${item.hint}${c.reset}`;
        }
        if (item.tag) {
          const color = item.tagColor || c.dim;
          parts += `  ${color}${item.tag}${c.reset}`;
        }

        lines.push(parts);
      }

      // Footer
      lines.push("");
      lines.push(`  ${c.dim}Use arrow keys to move, enter to select${c.reset}`);

      renderedLineCount = lines.length;
      stdout.write(lines.join("\n") + "\n");
    }

    stdout.write(c.hideCursor);
    render();

    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    function onKey(key) {
      // Ctrl+C
      if (key === "\x03") {
        cleanup();
        stdout.write(c.showCursor + "\n");
        process.exit(0);
      }

      // Up arrow or k
      if (key === `${ESC}[A` || key === "k") {
        cursor = cursor > 0 ? cursor - 1 : items.length - 1;
        render();
        return;
      }

      // Down arrow or j
      if (key === `${ESC}[B` || key === "j") {
        cursor = cursor < items.length - 1 ? cursor + 1 : 0;
        render();
        return;
      }

      // Enter
      if (key === "\r" || key === "\n") {
        cleanup();
        resolve(cursor);
        return;
      }
    }

    function cleanup() {
      stdin.removeListener("data", onKey);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write(c.showCursor);
    }

    stdin.on("data", onKey);
  });
}

/**
 * Show the two-step selector and return the user's choice.
 *
 * @returns {Promise<{ mode: "auto" } | { mode: "manual", provider: string, modelId: string, label: string }>}
 */
export async function selectModel() {
  console.log(`\n${c.bgCyan}${c.bold} AI Model Selector ${c.reset}\n`);

  // ── Step 1: Pick provider ────────────────────────────────────────
  const providerItems = [
    {
      label: "Auto",
      hint: "Gemini + OpenRouter fallback",
      tag: "RECOMMENDED",
      tagColor: c.green,
    },
    {
      label: "Gemini",
      hint: `${PROVIDERS.gemini.models.length} models`,
    },
    {
      label: "OpenRouter",
      hint: `${PROVIDERS.openrouter.models.length} models`,
    },
  ];

  const providerIdx = await arrowSelect("Select Provider", providerItems);

  // ── Auto mode ─────────────────────────────────────────────────────
  if (providerIdx === 0) {
    const chain = FALLBACK_CHAIN.map((f) => f.modelId).join(" → ");
    console.log(
      `\n  ${c.green}✔${c.reset} ${c.bold}Auto mode${c.reset} ${c.dim}— ${chain}${c.reset}\n`
    );
    return { mode: "auto" };
  }

  // ── Step 2: Pick model ────────────────────────────────────────────
  const providerKey = providerIdx === 1 ? "gemini" : "openrouter";
  const provider = PROVIDERS[providerKey];

  const modelItems = provider.models.map((m) => {
    const isFree = m.label.toLowerCase().includes("free");
    const cleanLabel = m.label.replace(/\s*\(Free\)|\s*\(Paid\)/gi, "").trim();
    return {
      label: cleanLabel,
      hint: m.id,
      tag: isFree ? "FREE" : "PAID",
      tagColor: isFree ? c.green : c.yellow,
    };
  });

  // Back option
  modelItems.unshift({
    label: "Back",
    hint: "return to providers",
  });

  console.log();
  const modelIdx = await arrowSelect(
    `Select ${provider.name} Model`,
    modelItems
  );

  // ── Back → restart ────────────────────────────────────────────────
  if (modelIdx === 0) {
    console.log();
    return selectModel();
  }

  const chosen = provider.models[modelIdx - 1];
  const cleanLabel = chosen.label.replace(/\s*\(Free\)|\s*\(Paid\)/gi, "").trim();
  console.log(
    `\n  ${c.green}✔${c.reset} Using ${c.bold}${cleanLabel}${c.reset} ${c.dim}(${chosen.id})${c.reset}\n`
  );

  return {
    mode: "manual",
    provider: providerKey,
    modelId: chosen.id,
    label: chosen.label,
  };
}
