// Extracts a clean skills list from raw resume text via Groq, same
// fetch-based call pattern as ai/matching.service.ts (no SDK dependency).

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-oss-20b';

const SYSTEM_PROMPT = `You extract skills from resume text for a student internship-matching platform. Return STRICT JSON only, no prose, no markdown fences, matching exactly:
{"skills": [<strings>]}
Include technical skills, programming languages, frameworks, tools, and platforms actually mentioned in the text. Normalize casing and naming (e.g. "react.js" and "ReactJS" both become "React"). Deduplicate. Omit vague non-skill phrases, job titles, and company names. Cap at 30 skills, prioritizing the most specific/technical ones if there are more.`;

export async function extractSkillsFromResume(resumeText: string): Promise<string[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_key_here') {
    throw new Error('GROQ_API_KEY is not configured');
  }

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
        // Resumes can be long - trim to keep prompt size sane and cost low.
        { role: 'user', content: resumeText.slice(0, 6000) },
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

  const skills = (parsed as { skills?: unknown }).skills;
  return Array.isArray(skills)
    ? skills.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).slice(0, 30)
    : [];
}
