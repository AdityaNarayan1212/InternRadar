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

import { groqJson } from './groq.client';

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

  const parsed = await groqJson({ system: SYSTEM_PROMPT, user: userPrompt, tag: 'fit-score' });
  const result = parsed as Partial<MatchResult>;
  const fitScore = Math.max(0, Math.min(100, Math.round(Number(result.fitScore) || 0)));

  // Case-insensitive match back to the internship's own spelling, so "react" from
  // the model still maps onto "React" in skillsReq instead of being dropped.
  const requiredByLower = new Map(internship.skillsReq.map((s) => [s.toLowerCase(), s]));
  const missingSkills = Array.isArray(result.missingSkills)
    ? [
        ...new Set(
          result.missingSkills
            .filter((s): s is string => typeof s === 'string')
            .map((s) => requiredByLower.get(s.trim().toLowerCase()))
            .filter((s): s is string => !!s)
        ),
      ]
    : [];
  const matchReasons = Array.isArray(result.matchReasons)
    ? result.matchReasons.filter((s): s is string => typeof s === 'string').slice(0, 3)
    : [];

  return { fitScore, missingSkills, matchReasons };
}
