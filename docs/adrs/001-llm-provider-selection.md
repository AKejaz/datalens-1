# ADR 001 — LLM Provider Selection

**Date:** 2026-05-15  
**Status:** Accepted

---

## Context

DataLens requires an LLM API for two features: the tool-calling chat interface and the executive summary generator. The LLM must support function/tool-calling, be accessible without a paid subscription at the team's tier, and have a generous enough context window to hold dataset statistics summaries.

## Options Considered

| Provider | Tool-Calling | Context Window | Cost | Latency |
|----------|-------------|----------------|------|---------|
| **Groq (LLaMA 3.3 70B)** | ✅ Yes | 128k tokens | Free tier available | Very fast (~500 tok/s) |
| OpenAI GPT-4o | ✅ Yes | 128k tokens | Pay-per-token | Moderate |
| Anthropic Claude 3.5 | ✅ Yes | 200k tokens | Pay-per-token | Moderate |
| Google Gemini 1.5 Flash | ✅ Yes | 1M tokens | Free tier limited | Fast |

## Decision

**Groq with `llama-3.3-70b-versatile`.**

## Trade-offs

**What we gain:**
- Extremely fast inference (critical for a responsive chat interface)
- Free tier sufficient for development and demo
- Full tool/function-calling support via standard OpenAI-compatible API
- Large context window (128k tokens) — enough to pass column statistics

**What we give up:**
- Groq is an inference provider, not a model creator — if LLaMA 3.3 is deprecated on their platform, we need to update the model string
- Less fine-tuned for business writing than GPT-4o (mitigated by careful prompting in `generate_executive_summary`)
- No streaming support in our current implementation (could be added later)

## Consequences

- `GROQ_API_KEY` is the only required environment variable for LLM features
- The `llm.py` module imports from the `groq` Python SDK
- If the team switches providers later, only `llm.py` needs to change
