// Single place that talks to Groq. Both resume skill extraction and fit scoring
// go through here so they get the same retry / parsing / reasoning-model handling.
//
// Why this exists: the default model (openai/gpt-oss-20b) is a *reasoning* model.
// On Groq that means (a) hidden reasoning tokens can eat the completion budget and
// leave `content` empty, (b) json_object mode can reject the generation with a 400
// `json_validate_failed`, and (c) free-tier 429s are common. The old code treated
// every one of those as a hard failure, and the resume controller swallowed the
// error, so the user saw "0 skills extracted" with no explanation.

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-oss-20b';
const MAX_ATTEMPTS = 4;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class GroqError extends Error {
  constructor(message: string, public readonly retryable: boolean) {
    super(message);
  }
}

export interface GroqJsonOptions {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  tag?: string; // for log lines, e.g. "resume-skills"
}

/** Strip ``` fences and pull the first {...} block out of a model reply. */
export function parseLooseJson(content: string): unknown | null {
  const cleaned = content.replace(/```(?:json)?/gi, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    /* fall through */
  }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      /* fall through */
    }
  }
  return null;
}

export async function groqJson(opts: GroqJsonOptions): Promise<unknown> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_key_here') {
    throw new GroqError('GROQ_API_KEY is not configured', false);
  }

  const tag = opts.tag ?? 'groq';
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;
  const isReasoning = /gpt-oss|qwen3|deepseek-r1/i.test(model);
  let useJsonMode = true;
  let lastErr: GroqError = new GroqError('Groq request failed', true);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const body: Record<string, unknown> = {
        model,
        temperature: opts.temperature ?? 0,
        // Generous budget: for reasoning models this also covers hidden reasoning.
        max_completion_tokens: opts.maxTokens ?? 2000,
        messages: [
          { role: 'system', content: opts.system },
          { role: 'user', content: opts.user },
        ],
      };
      if (useJsonMode) body.response_format = { type: 'json_object' };
      if (isReasoning && /gpt-oss/i.test(model)) {
        body.reasoning_effort = 'low'; // extraction/scoring doesn't need deep thinking
        body.include_reasoning = false;
      }

      const res = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');

        // JSON mode rejected the generation: retry once without forcing JSON mode,
        // and rely on parseLooseJson instead.
        if (res.status === 400 && /json_validate_failed/i.test(errText) && useJsonMode) {
          console.warn(`[${tag}] json_validate_failed, retrying without json mode`);
          useJsonMode = false;
          throw new GroqError('json_validate_failed', true);
        }

        const retryable = res.status === 429 || res.status === 408 || res.status >= 500;
        const err = new GroqError(`Groq API error ${res.status}: ${errText.slice(0, 300)}`, retryable);
        (err as GroqError & { retryAfterMs?: number }).retryAfterMs =
          (Number(res.headers.get('retry-after')) || 0) * 1000;
        throw err;
      }

      const json = (await res.json()) as {
        choices?: { message?: { content?: string | null }; finish_reason?: string }[];
      };
      const choice = json.choices?.[0];
      const content = choice?.message?.content?.trim();

      if (!content) {
        // Typically finish_reason === 'length': reasoning used the whole budget.
        throw new GroqError(`Groq returned empty content (finish_reason=${choice?.finish_reason})`, true);
      }

      const parsed = parseLooseJson(content);
      if (parsed === null) {
        throw new GroqError(`Groq returned unparseable output: ${content.slice(0, 120)}`, true);
      }
      return parsed;
    } catch (err) {
      lastErr = err instanceof GroqError ? err : new GroqError((err as Error).message, true); // network errors
      console.warn(`[${tag}] attempt ${attempt}/${MAX_ATTEMPTS} failed: ${lastErr.message}`);
      if (!lastErr.retryable || attempt === MAX_ATTEMPTS) break;
      const hinted = (lastErr as GroqError & { retryAfterMs?: number }).retryAfterMs ?? 0;
      await sleep(Math.max(hinted, 600 * 2 ** (attempt - 1)));
    }
  }
  throw lastErr;
}
