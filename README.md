# LangGraph Terminal Agent

A command-line AI research agent built with LangChain, LangGraph, and Node.js. It features a streaming terminal chat interface with auto-fallback capabilities and a fully automated Notion research workflow.

## Features

- **Interactive Chat Agent** (`npm start`)
  - Streaming responses with dynamic loading indicators
  - Arrow-key TUI for model selection
  - Automatic model fallback on rate limits (Gemini -> OpenRouter)
  - Web search and page extraction tools via Tavily

- **Automated Notion Researcher** (`npm run notion`)
  - LangGraph state machine workflow
  - Takes a topic, researches via web search, and synthesizes study notes
  - Parses AI markdown directly into native Notion blocks (tables, quotes, checkboxes)
  - Automatically creates and formats a Notion page with the results

## Prerequisites

- Node.js 20+
- Environment variables configured in `.env`

## Environment Variables

Create a `.env` file in the root directory:

```env
# AI Providers
GEMINI_API_KEY=your_gemini_key
OPENROUTER_API_KEY=your_openrouter_key

# Web Search
TAVILY_API_KEY=your_tavily_key

# Notion Integration
NOTION_API_KEY=your_notion_integration_secret
NOTION_PAGE_ID=your_target_parent_page_id
```

## Usage

**Start Interactive Chat**
```bash
npm start
```

**Run Notion Research Workflow**
```bash
npm run notion
```

## Architecture

- `src/index.js`: Main entry point for the interactive chat loop.
- `src/config/`: Model registry, TUI selector, and provider initialization.
- `src/tools/`: Tavily-powered web search and page reading tools.
- `workflow/index.js`: LangGraph execution node and Notion API integration.
