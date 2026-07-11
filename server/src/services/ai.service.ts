import { AppError } from '../lib/AppError';

interface FitAnalysisResult {
  fitScore: number;
  matchReasons: string[];
  missingSkills: string[];
}

interface UserProfile {
  skills: string[];
  branch: string | null;
  year: number | null;
}

interface InternshipProfile {
  title: string;
  company: string;
  domain: string[];
  skillsReq: string[];
  criteria: string | null;
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Fast + cheap model, good enough for a structured scoring task like this.
const GROQ_MODEL = 'llama-3.1-8b-instant';

/**
 * Calls Groq's chat completions endpoint (OpenAI-compatible) and asks for
 * strict JSON back. We don't use a JS SDK here so there's one less
 * dependency to manage — it's a single fetch call.
 */
export async function analyzeFit(
  user: UserProfile,
  internship: InternshipProfile
): Promise<FitAnalysisResult> {
  if (!process.env.GROQ_API_KEY) {
    throw new AppError('GROQ_API_KEY is not configured on the server', 500);
  }

  const prompt = `You are scoring how well a student fits an internship. Respond with ONLY valid JSON, no prose, no markdown fences.

Student profile:
- Skills: ${user.skills.join(', ') || 'none listed'}
- Branch: ${user.branch ?? 'unknown'}
- Year: ${user.year ?? 'unknown'}

Internship:
- Title: ${internship.title}
- Company: ${internship.company}
- Domain: ${internship.domain.join(', ')}
- Required skills: ${internship.skillsReq.join(', ') || 'not specified'}
- Other criteria: ${internship.criteria ?? 'none'}

Return this exact JSON shape:
{
  "fitScore": <number 0-100>,
  "matchReasons": [<2-4 short strings explaining the match>],
  "missingSkills": [<skills the student should learn for this role, empty array if none>]
}`;

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new AppError(`Groq API error (${response.status}): ${body}`, 502);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content;

  if (!raw) {
    throw new AppError('Groq returned no content', 502);
  }

  let parsed: FitAnalysisResult;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new AppError('Groq returned malformed JSON', 502);
  }

  // Clamp/sanitize in case the model drifts outside the expected shape
  return {
    fitScore: Math.max(0, Math.min(100, Number(parsed.fitScore) || 0)),
    matchReasons: Array.isArray(parsed.matchReasons) ? parsed.matchReasons.slice(0, 4) : [],
    missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills.slice(0, 8) : [],
  };
}
