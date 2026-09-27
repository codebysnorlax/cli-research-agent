/**
 * Model Registry
 * ─────────────────────────────────────────────────────────────────────
 * Central place to define every AI provider + model the app can use.
 * Add / remove entries here — everything else picks them up automatically.
 */

export const PROVIDERS = {
  gemini: {
    name: "Gemini",
    models: [
      { id: "gemini-3.6-flash", label: "Gemini 3.6 Flash" },
      { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    ],
  },
  openrouter: {
    name: "OpenRouter",
    models: [
      // Free-tier models (":free" suffix = $0 cost)
      { id: "openrouter/free", label: "OpenRouter Auto (Free)" },
      { id: "google/gemma-3-27b-it:free", label: "Google Gemma 3 27B (Free)" },
      { id: "meta-llama/llama-4-maverick:free", label: "Llama 4 Maverick (Free)" },
      { id: "deepseek/deepseek-chat-v3-0324:free", label: "DeepSeek V3 (Free)" },
      { id: "respan/span-01-lite:free", label: "Respan Span-01 Lite (Free)" },
      { id: "inclusionai/ling-3.0-flash-sante:free", label: "InclusionAI Ling 3.0 Flash Sante (Free)" },
      { id: "inclusionai/ling-3.0-flash-fin:free", label: "InclusionAI Ling 3.0 Flash Fin (Free)" },
      { id: "liquid/lfm-2.5-embedding-350m:free", label: "LiquidAI LFM2.5-Embedding-350M (Free)" },
      { id: "qwen/qwen3.8-27b:free", label: "Qwen 3.8 27B (Free)" },
      { id: "dots-studio/dots-3-note-preview:free", label: "Dots Studio Dots3-Note Preview (Free)" },
      { id: "deepgram/flux-tts:free", label: "Deepgram Flux TTS (Free)" },
      { id: "liquid/lfm-2.5-2.6b:free", label: "LiquidAI LFM2.5-2.6B (Free)" },
      { id: "nvidia/nemotron-3.5-lightning:free", label: "NVIDIA Nemotron 3.5 Lightning (Free)" },
      { id: "thinkingmachines/inkling-small:free", label: "Thinking Machines Inkling Small (Free)" },
      { id: "fish-audio/s2.1-pro-free:free", label: "Fish Audio S2.1 Pro (Free)" },
      { id: "poolside/laguna-s-2.1:free", label: "Poolside Laguna S 2.1 (Free)" },
      { id: "thinkingmachines/inkling:free", label: "Thinking Machines Inkling (Free)" },
      // Paid models (need credits on OpenRouter)
      { id: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4 (Paid)" },
      { id: "openai/gpt-4o", label: "GPT-4o (Paid)" },
    ],
  },
};

/**
 * Default fallback chain — tried in order when auto-fallback is active.
 * First entry = primary, rest = fallbacks.
 */
export const FALLBACK_CHAIN = [
  { provider: "gemini", modelId: "gemini-3.6-flash" },
  { provider: "openrouter", modelId: "openrouter/free" },
  { provider: "openrouter", modelId: "google/gemma-3-27b-it:free" },
  { provider: "openrouter", modelId: "meta-llama/llama-4-maverick:free" },
];
