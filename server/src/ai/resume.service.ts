// Extracts a clean skills list from raw resume text via Groq, with a deterministic
// keyword fallback so a flaky AI call can never silently produce "0 skills".

import { groqJson } from './groq.client';
import { keywordSkills, canonicalise } from './skillKeywords';

const SYSTEM_PROMPT = `You extract skills from resume text for a student internship-matching platform. Return STRICT JSON only, no prose, no markdown fences, matching exactly:
{"skills": [<strings>]}
Include technical skills, programming languages, frameworks, tools, and platforms actually mentioned in the text, including those inside project descriptions and certifications. Normalize casing and naming (e.g. "react.js" and "ReactJS" both become "React"). Deduplicate. Omit vague non-skill phrases, soft skills, job titles, and company names. Cap at 30 skills, prioritizing the most specific/technical ones if there are more.`;

export interface SkillExtraction {
  skills: string[];
  source: 'ai' | 'ai+keywords' | 'keywords';
  warning?: string; // set when the AI path failed or came back empty
}

/**
 * Old code did resumeText.slice(0, 6000), which cut off the bottom of longer resumes -
 * exactly where a "Skills" section usually sits. Keep head + tail instead.
 */
export function prepareResumeText(raw: string): string {
  const text = raw.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  const LIMIT = 14000;
  if (text.length <= LIMIT) return text;
  return `${text.slice(0, 9000)}\n...\n${text.slice(-5000)}`;
}

function toSkillArray(parsed: unknown): string[] {
  if (!parsed || typeof parsed !== 'object') return [];
  // Tolerate "skills" / "Skills" / "technical_skills" etc.
  const key = Object.keys(parsed).find((k) => /skill/i.test(k));
  const raw = key ? (parsed as Record<string, unknown>)[key] : undefined;
  const arr: unknown[] = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(/[,;\n|]/) : [];
  const out = new Map<string, string>();
  for (const item of arr) {
    const s = typeof item === 'string' ? item : (item as { name?: unknown })?.name;
    if (typeof s !== 'string') continue;
    const t = canonicalise(s.replace(/^[-*•\d.\s]+/, ''));
    if (t && t.length <= 40) out.set(t.toLowerCase(), t);
  }
  return [...out.values()];
}

/** Never throws. Check `warning` to see whether the AI path worked. */
export async function extractSkillsFromResume(resumeText: string): Promise<SkillExtraction> {
  const text = prepareResumeText(resumeText);
  const kw = keywordSkills(text);

  try {
    const parsed = await groqJson({ system: SYSTEM_PROMPT, user: text, tag: 'resume-skills' });
    const ai = toSkillArray(parsed);

    if (ai.length === 0) {
      console.warn(`[resume-skills] AI returned 0 skills; keyword fallback found ${kw.length}`);
      return {
        skills: kw.slice(0, 30),
        source: 'keywords',
        warning: 'AI skill extraction returned nothing; used basic keyword matching instead.',
      };
    }

    const merged = new Map<string, string>();
    for (const s of ai) merged.set(s.toLowerCase(), s);
    let addedByKeywords = false;
    for (const s of kw) {
      if (!merged.has(s.toLowerCase())) {
        merged.set(s.toLowerCase(), s);
        addedByKeywords = true;
      }
    }
    return { skills: [...merged.values()].slice(0, 40), source: addedByKeywords ? 'ai+keywords' : 'ai' };
  } catch (err) {
    console.error('[resume-skills] Groq failed, using keyword fallback:', (err as Error).message);
    return {
      skills: kw.slice(0, 30),
      source: 'keywords',
      warning: 'AI skill extraction is unavailable right now; used basic keyword matching instead.',
    };
  }
}
