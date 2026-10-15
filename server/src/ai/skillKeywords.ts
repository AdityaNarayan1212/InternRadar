// Deterministic skill matcher. Used as (a) a safety net when Groq fails or returns
// nothing, and (b) a cheap supplement to the AI result. Aliases are deliberately
// conservative - no ambiguous English words like "rest" or "express".

const SKILL_DICT: Record<string, string[]> = {
  JavaScript: ['javascript', 'js', 'es6'],
  TypeScript: ['typescript', 'ts'],
  React: ['react', 'reactjs', 'react.js'],
  'Node.js': ['node', 'nodejs', 'node.js'],
  Express: ['expressjs', 'express.js'],
  Python: ['python'],
  'C++': ['c++', 'cpp'],
  Java: ['java'],
  SQL: ['sql', 'mysql'],
  PostgreSQL: ['postgres', 'postgresql'],
  MongoDB: ['mongodb'],
  Prisma: ['prisma'],
  Supabase: ['supabase'],
  Linux: ['linux', 'ubuntu', 'bash'],
  Git: ['git', 'github'],
  Docker: ['docker'],
  AWS: ['aws', 'amazon web services'],
  'Machine Learning': ['machine learning'],
  'Deep Learning': ['deep learning', 'neural networks'],
  PyTorch: ['pytorch'],
  TensorFlow: ['tensorflow'],
  'Computer Vision': ['computer vision', 'opencv', 'image processing'],
  NLP: ['nlp', 'natural language processing'],
  Networking: ['networking', 'tcp/ip', 'computer networks'],
  Cybersecurity: ['cybersecurity', 'cyber security', 'penetration testing', 'pentesting'],
  Cryptography: ['cryptography'],
  'Embedded Systems': ['embedded systems', 'microcontroller', 'arduino', 'stm32'],
  VLSI: ['vlsi', 'verilog', 'vhdl'],
  MATLAB: ['matlab'],
  'HTML/CSS': ['html', 'css', 'tailwind', 'tailwindcss'],
  'REST APIs': ['rest api', 'rest apis', 'restful'],
  'Data Structures & Algorithms': ['dsa', 'data structures'],
};

const ALIAS_TO_CANON = new Map<string, string>();
for (const [canon, aliases] of Object.entries(SKILL_DICT)) {
  ALIAS_TO_CANON.set(canon.toLowerCase(), canon);
  for (const a of aliases) ALIAS_TO_CANON.set(a, canon);
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Pre-compile once. Alias must not be glued to letters/digits/+/#/. so "ts" does not
// match "tests" and "js" does not match inside "Node.js".
const MATCHERS = [...ALIAS_TO_CANON].map(([alias, canon]) => ({
  canon,
  re: new RegExp(`(?<![a-z0-9+#.])${escapeRe(alias)}(?![a-z0-9+#])`, 'i'),
}));

export function keywordSkills(text: string): string[] {
  const found = new Set<string>();
  for (const { canon, re } of MATCHERS) if (re.test(text)) found.add(canon);
  return [...found];
}

/** Map AI-returned names onto canonical spellings where we know them. */
export function canonicalise(skill: string): string {
  return ALIAS_TO_CANON.get(skill.trim().toLowerCase()) ?? skill.trim();
}
