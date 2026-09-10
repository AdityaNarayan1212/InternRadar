// Calls Groq's OpenAI-compatible chat completions API to score a candidate's
// skill fit against a single internship. Deliberately uses plain fetch
// instead of the groq-sdk package to avoid an extra dependency - Groq's API
// is a drop-in OpenAI-compatible endpoint.
//
// Model: openai/gpt-oss-20b by default. Groq deprecated the older
// llama-3.1-8b-instant / llama-3.3-70b-versatile models in mid-2026; this is
// their recommended fast replacement. Override with GROQ_MODEL if Groq's
// lineup has moved on again by the time this runs - check
// https://console.groq.com/docs/models for the current list.

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-oss-20b';

export interface MatchInput {
  title: string;
  company: string;
  domain: string[];
  skillsReq: string[];
  description?: string | null;
}

export interface MatchResult {
  fitScore: number;
  missingSkills: string[];
  matchReasons: string[];
}

const SYSTEM_PROMPT = `You are an internship-fit scoring engine for a student platform. Given a candidate's skills and an internship's requirements, return STRICT JSON only, no prose, no markdown fences, matching exactly this shape:
{"fitScore": <integer 0-100>, "missingSkills": [<strings, only items copied verbatim from the internship's required skills list that the candidate is missing>], "matchReasons": [<1-3 short phrases, each under 8 words, explaining the score>]}
Score generously for closely adjacent/transferable skills, but not for unrelated ones. Never invent a missing skill that isn't in the provided required-skills list.`;

export async function computeFitScore(
  candidateSkills: string[],
  internship: MatchInput
): Promise<MatchResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_key_here') {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const userPrompt = JSON.stringify({
    candidateSkills,
    internship: {
      title: internship.title,
      company: internship.company,
      domain: internship.domain,
      requiredSkills: internship.skillsReq,
      description: internship.description ? internship.description.slice(0, 800) : undefined,
    },
  });

  const res = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || DEFAULT_MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Groq API error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq API returned no content');

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Groq API returned malformed JSON');
  }

  const result = parsed as Partial<MatchResult>;
  const fitScore = Math.max(0, Math.min(100, Math.round(Number(result.fitScore) || 0)));

  const requiredSet = new Set(internship.skillsReq);
  const missingSkills = Array.isArray(result.missingSkills)
    ? result.missingSkills.filter((s): s is string => typeof s === 'string' && requiredSet.has(s))
    : [];
  const matchReasons = Array.isArray(result.matchReasons)
    ? result.matchReasons.filter((s): s is string => typeof s === 'string').slice(0, 3)
    : [];

  return { fitScore, missingSkills, matchReasons };
}
