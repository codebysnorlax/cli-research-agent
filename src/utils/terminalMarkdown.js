/**
 * terminalMarkdown.js
 * ─────────────────────────────────────────────────────────────────────
 * Converts Markdown text into beautifully formatted terminal output
 * using ANSI escape codes via chalk.
 *
 * Supports: headings, bold, italic, inline code, code blocks,
 *           ordered/unordered lists (nested), blockquotes, links, and HR.
 *
 * Responsive: adapts code blocks, horizontal rules, and text wrapping
 *             to the current terminal width.
 */

import chalk from "chalk";

// ── Terminal width helper ──────────────────────────────────────────

/**
 * Get the usable content width (terminal width minus padding).
 * Falls back to 80 if terminal width cannot be determined.
 */
function getContentWidth() {
  const cols = process.stdout.columns || 80;
  // Reserve 4 chars for left padding (2 spaces + border + space)
  return Math.max(cols - 6, 20);
}

// ── Word wrapping ──────────────────────────────────────────────────

/**
 * Strip ANSI escape codes to get visible character length.
 */
function stripAnsi(str) {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

/**
 * Wrap text to fit within maxWidth visible characters.
 * Preserves ANSI codes across wrapped lines.
 * @param {string} text - Text (may include ANSI codes)
 * @param {number} maxWidth - Max visible characters per line
 * @param {string} prefix - Prefix for continuation lines (e.g. indent)
 * @returns {string} - Wrapped text
 */
function wordWrap(text, maxWidth, prefix = "  ") {
  if (!text) return text;
  const visibleLen = stripAnsi(text).length;
  if (visibleLen <= maxWidth) return text;

  // Split by words but preserve ANSI codes attached to words
  const words = text.split(/( +)/);
  const lines = [];
  let currentLine = "";
  let currentVisible = 0;

  for (const word of words) {
    const wordVisible = stripAnsi(word).length;
    if (currentVisible + wordVisible > maxWidth && currentLine.trim()) {
      lines.push(currentLine);
      currentLine = prefix;
      currentVisible = stripAnsi(prefix).length;
    }
    currentLine += word;
    currentVisible += wordVisible;
  }
  if (currentLine.trim()) lines.push(currentLine);

  return lines.join("\n");
}

// ── Inline formatting ──────────────────────────────────────────────

/**
 * Process inline markdown formatting (bold, italic, code, links, strikethrough).
 * Handles nested formatting correctly by processing from most specific to least.
 */
function processInline(text) {
  // Inline code (must be first to prevent bold/italic inside code)
  text = text.replace(/`([^`]+)`/g, (_, code) => {
    return chalk.bgGray.white(` ${code} `);
  });

  // Bold + Italic (***text*** or ___text___)
  text = text.replace(/\*{3}(.+?)\*{3}/g, (_, t) => chalk.bold.italic(t));
  text = text.replace(/_{3}(.+?)_{3}/g, (_, t) => chalk.bold.italic(t));

  // Bold (**text** or __text__)
  text = text.replace(/\*{2}(.+?)\*{2}/g, (_, t) => chalk.bold(t));
  text = text.replace(/_{2}(.+?)_{2}/g, (_, t) => chalk.bold(t));

  // Italic (*text* or _text_) — avoid matching list bullets
  text = text.replace(/(?<!\w)\*(?!\s)(.+?)(?<!\s)\*(?!\w)/g, (_, t) => chalk.italic(t));
  text = text.replace(/(?<!\w)_(?!\s)(.+?)(?<!\s)_(?!\w)/g, (_, t) => chalk.italic(t));

  // Strikethrough (~~text~~)
  text = text.replace(/~~(.+?)~~/g, (_, t) => chalk.strikethrough(t));

  // Links [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    return `${chalk.cyan.underline(label)} ${chalk.dim(`(${url})`)}`;
  });

  // Images ![alt](url) — just show as link
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
    return `${chalk.dim("[image]")} ${chalk.cyan.underline(alt || url)}`;
  });

  return text;
}

// ── Block-level parsing ────────────────────────────────────────────

/**
 * Parse markdown text into beautifully formatted terminal output.
 * Adapts to terminal width dynamically.
 * @param {string} markdown - Raw markdown string
 * @returns {string} - ANSI formatted string for terminal display
 */
export function renderMarkdown(markdown) {
  if (!markdown || !markdown.trim()) return "";

  const contentWidth = getContentWidth();
  const borderWidth = Math.min(contentWidth, 70);

  const lines = markdown.split("\n");
  const output = [];
  let i = 0;
  let inCodeBlock = false;
  let codeBlockLang = "";
  let codeBlockLines = [];

  while (i < lines.length) {
    const line = lines[i];

    // ── Code blocks (```) ─────────────────────────────────────────
    if (line.trim().startsWith("```")) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
        codeBlockLines = [];
        i++;
        continue;
      } else {
        // End of code block — render it
        inCodeBlock = false;
        const langLabel = codeBlockLang
          ? chalk.dim.italic(` ${codeBlockLang} `)
          : "";
        output.push("");
        if (langLabel) output.push(`  ${langLabel}`);
        output.push(chalk.dim("  ┌" + "─".repeat(borderWidth)));
        for (const cl of codeBlockLines) {
          output.push(`  ${chalk.dim("│")} ${chalk.green(cl)}`);
        }
        output.push(chalk.dim("  └" + "─".repeat(borderWidth)));
        output.push("");
        codeBlockLang = "";
        codeBlockLines = [];
        i++;
        continue;
      }
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      i++;
      continue;
    }

    const trimmed = line.trim();

    // ── Empty lines ───────────────────────────────────────────────
    if (!trimmed) {
      output.push("");
      i++;
      continue;
    }

    // ── Headings ──────────────────────────────────────────────────
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = processInline(headingMatch[2]);
      switch (level) {
        case 1:
          output.push("");
          output.push(chalk.bold.cyan(`  ═══ ${text} ═══`));
          output.push("");
          break;
        case 2:
          output.push("");
          output.push(chalk.bold.cyan(`  ── ${text} ──`));
          output.push("");
          break;
        case 3:
          output.push(chalk.bold.white(`  ${text}`));
          break;
        default:
          output.push(chalk.bold.dim(`  ${text}`));
      }
      i++;
      continue;
    }

    // ── Horizontal rule ───────────────────────────────────────────
    if (/^[-*_]{3,}\s*$/.test(trimmed)) {
      output.push(chalk.dim("  " + "─".repeat(Math.min(borderWidth, 60))));
      i++;
      continue;
    }

    // ── Blockquote ────────────────────────────────────────────────
    if (trimmed.startsWith(">")) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      const quoteText = processInline(quoteLines.join(" "));
      const wrapped = wordWrap(
        `  ${chalk.dim("│")} ${chalk.italic.yellow(quoteText)}`,
        contentWidth,
        `  ${chalk.dim("│")}   `
      );
      output.push("");
      output.push(wrapped);
      output.push("");
      continue;
    }

    // ── Unordered list ────────────────────────────────────────────
    const ulMatch = trimmed.match(/^([*\-+])\s+(.+)$/);
    if (ulMatch) {
      const indent = line.search(/\S/);
      const indentStr = " ".repeat(2 + Math.floor(indent / 2) * 2);
      const bullet = chalk.cyan("•");
      const itemText = `${indentStr}${bullet} ${processInline(ulMatch[2])}`;
      const wrapPrefix = indentStr + "  ";
      output.push(wordWrap(itemText, contentWidth, wrapPrefix));
      i++;
      continue;
    }

    // ── Ordered list ──────────────────────────────────────────────
    const olMatch = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
    if (olMatch) {
      const indent = line.search(/\S/);
      const indentStr = " ".repeat(2 + Math.floor(indent / 2) * 2);
      const num = chalk.cyan(`${olMatch[1]}.`);
      const itemText = `${indentStr}${num} ${processInline(olMatch[2])}`;
      const wrapPrefix = indentStr + "   ";
      output.push(wordWrap(itemText, contentWidth, wrapPrefix));
      i++;
      continue;
    }

    // ── Regular paragraph ─────────────────────────────────────────
    const paraText = `  ${processInline(trimmed)}`;
    output.push(wordWrap(paraText, contentWidth, "  "));
    i++;
  }

  // Handle unclosed code block
  if (inCodeBlock && codeBlockLines.length > 0) {
    output.push(chalk.dim("  ┌" + "─".repeat(borderWidth)));
    for (const cl of codeBlockLines) {
      output.push(`  ${chalk.dim("│")} ${chalk.green(cl)}`);
    }
    output.push(chalk.dim("  └" + "─".repeat(borderWidth)));
  }

  return output.join("\n").replace(/\n{4,}/g, "\n\n\n");
}
