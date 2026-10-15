// Rare / underrated government + research internships (researched Oct 2026).
//
// - Separate from src/seed.ts on purpose: seed.ts wipes the internship table, this
//   one only ADDS missing rows (matched on title + company), so it is safe to re-run.
// - verified:false everywhere: dates/URLs come from secondary pages. Confirm on the
//   official site, then flip it in the admin panel.
// - Closed seasonal windows are marked REOPENING. The NITI Aayog entry follows its
//   monthly 1st-10th application window and refreshes when this seed is re-run.
// - skillsReq values are estimates of what these programmes typically want (so fit
//   scoring has something to work with), not copied from official postings.
//
// Run: npm run seed:rare

import 'dotenv/config';
import { prisma } from '../lib/prisma';

// Plain shape mirroring the Prisma Internship model (kept local so this file
// compiles even before `prisma generate` has run).
interface InternshipSeed {
  title: string;
  company: string;
  source: string;
  type: 'GOVERNMENT' | 'STARTUP' | 'CORPORATE' | 'RESEARCH';
  domain: string[];
  location?: string;
  isRemote: boolean;
  stipendMin?: number;
  stipendMax?: number;
  duration?: string;
  deadline?: Date;
  applyUrl: string;
  status: 'OPEN' | 'CLOSED' | 'REOPENING';
  verified: boolean;
  skillsReq: string[];
  criteria?: string;
  reopenDate?: Date;
  description?: string;
}

function getNitiApplicationWindow(now = new Date()): {
  status: 'OPEN' | 'REOPENING';
  deadline: Date;
  reopenDate: Date;
} {
  const year = now.getFullYear();
  const month = now.getMonth();
  const currentDeadline = new Date(year, month, 10, 23, 59, 59, 999);
  const nextReopenDate = new Date(year, month + 1, 1);

  if (now.getDate() <= 10) {
    return { status: 'OPEN', deadline: currentDeadline, reopenDate: nextReopenDate };
  }

  return {
    status: 'REOPENING',
    deadline: new Date(year, month + 1, 10, 23, 59, 59, 999),
    reopenDate: nextReopenDate,
  };
}

export const rareInternships: InternshipSeed[] = [
  {
    title: 'Digital India Internship (Summer/Winter)',
    company: 'NIC (MeitY)',
    source: 'dii.nic.in',
    type: 'GOVERNMENT',
    domain: ['Software', 'E-Governance'],
    location: 'New Delhi / NIC State Centres',
    isRemote: false,
    duration: 'Summer & winter sessions',
    applyUrl: 'https://dii.nic.in',
    status: 'REOPENING',
    verified: false,
    skillsReq: ['Python', 'Java', 'SQL', 'HTML/CSS'],
    criteria:
      'B.E/B.Tech, M.E/M.Tech, MCA or M.Sc with 60%+; needs an institute recommendation letter on letterhead. Only ~20 students selected per session; report + presentation required, remuneration paid after completion.',
    description:
      'Merit-based internship at NIC building ICT applications for public administration. Summer 2026 registration closed 27 Apr 2026.',
  },
  {
    title: 'MeitY Work Based Learning Programme',
    company: 'C-DAC / CERT-In / ERNET / NIELIT / SAMEER / STQC',
    source: 'internship.aicte-india.org',
    type: 'GOVERNMENT',
    domain: ['AI/ML', 'Cybersecurity', 'IoT', 'Cloud'],
    location: 'Pan India',
    isRemote: false,
    stipendMin: 10000,
    stipendMax: 10000,
    duration: '6 months',
    applyUrl: 'https://internship.aicte-india.org',
    status: 'REOPENING',
    verified: false,
    skillsReq: ['Python', 'Machine Learning', 'Linux', 'Cybersecurity'],
    criteria:
      '7th/8th semester engineering students, or B.Tech/BE/MCA/M.Sc passed out in the last 2 years; relevant disciplines.',
    description:
      'Paid 6-month work-based learning across MeitY organisations on niche tech (AI/ML, cybersecurity, IoT, cloud). Stipend and batch details are from a Jan 2024 brochure - confirm current terms.',
  },
  {
    title: 'NCCS Internship Scheme',
    company: 'National Centre for Communication Security (DoT)',
    source: 'publicservicesmap.in',
    type: 'GOVERNMENT',
    domain: ['Cybersecurity', 'Telecom'],
    location: 'All India',
    isRemote: false,
    // TODO: replace with the official NCCS page once confirmed
    applyUrl:
      'https://www.publicservicesmap.in/schemes/national-centre-for-communication-security-nccs-internship-scheme--nccsis',
    status: 'REOPENING',
    verified: false,
    skillsReq: ['Networking', 'Cybersecurity', 'Linux'],
    criteria:
      '3rd/4th year B.Tech in Electronics/Communications/IT/Computers/Electrical (with electronics/comm/computer majors) with 60%+; also open to recent graduates and PG students. Limited slots, monthly remuneration.',
    description:
      'Cybersecurity and telecom-security internship under the Department of Telecommunications. Very low visibility, so competition is thin.',
  },
  {
    title: 'Research Projects & Summer Internship (LIGO-India)',
    company: 'IUCAA',
    source: 'gw.iucaa.in',
    type: 'RESEARCH',
    domain: ['Physics', 'Instrumentation', 'Data Analysis'],
    location: 'Pune',
    isRemote: false,
    duration: 'Summer projects run May-July',
    applyUrl: 'https://www.gw.iucaa.in/research_opportunities-3/',
    status: 'REOPENING',
    verified: false,
    skillsReq: ['Python', 'MATLAB', 'Embedded Systems'],
    criteria:
      "Currently enrolled in Bachelor's (incl. B.Tech), Master's or integrated programmes. Experimental/engineering backgrounds encouraged. Form accepted year-round via a single portal.",
    description:
      'Research opportunities with LIGO-India across IUCAA, RRCAT and IPR. Summer-project and semester-thesis tracks have separate deadlines (a 30 Sep summer deadline was listed).',
  },
  {
    title: 'ISRO Centre Internships & Project Work (ISAC / SAC / NRSC)',
    company: 'ISRO',
    source: 'isro.gov.in',
    type: 'GOVERNMENT',
    domain: ['Image Processing', 'Remote Sensing', 'Electronics'],
    location: 'Bengaluru / Ahmedabad / Hyderabad',
    isRemote: false,
    duration: 'Summer, winter and long-term options',
    applyUrl: 'https://www.isro.gov.in/Internship.html',
    status: 'REOPENING',
    verified: false,
    skillsReq: ['Python', 'Computer Vision', 'MATLAB'],
    criteria:
      'UG (B.E/B.Tech) and PG students; each centre runs its own intake. Check isac.gov.in/hrd/students.jsp, sac.gov.in/Vyom/Internship.jsp and nrsc.gov.in/student_projects.',
    description:
      'Centre-level internships and curriculum project work; image processing and remote sensing/GIS are listed focus areas.',
  },
  {
    title: 'NITI Aayog Internship Scheme',
    company: 'NITI Aayog',
    source: 'niti.gov.in',
    type: 'GOVERNMENT',
    domain: ['Public Policy', 'Economics', 'Data Analysis'],
    location: 'New Delhi',
    isRemote: false,
    duration: '6 weeks to 6 months',
    ...getNitiApplicationWindow(),
    applyUrl: 'https://www.niti.gov.in/internship',
    verified: false,
    skillsReq: ['Research', 'Data Analysis', 'Economics', 'Writing'],
    criteria:
      'Undergraduate, postgraduate and research students in eligible disciplines; confirm the current discipline and document requirements on the official portal.',
    description:
      'Policy research internship with NITI Aayog. Applications are accepted from the 1st through the 10th of each month; this record uses the current or next monthly closing date.',
  },
];

/** Idempotent: skips anything whose title + company already exists. */
export async function seedRareInternships(): Promise<{ added: number; skipped: number }> {
  let added = 0;
  let skipped = 0;
  for (const data of rareInternships) {
    const exists = await prisma.internship.findFirst({
      where: { title: data.title, company: data.company },
      select: { id: true },
    });
    if (exists) {
      if (data.title === 'NITI Aayog Internship Scheme') {
        await prisma.internship.update({
          where: { id: exists.id },
          data: { deadline: data.deadline, reopenDate: data.reopenDate, status: data.status },
        });
      }
      skipped++;
      continue;
    }
    await prisma.internship.create({ data });
    added++;
  }
  return { added, skipped };
}

if (require.main === module) {
  seedRareInternships()
    .then(({ added, skipped }) => console.log(`Rare internships: ${added} added, ${skipped} already present`))
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
