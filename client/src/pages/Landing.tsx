import { Link } from 'react-router-dom';
import { Radar, UploadCloud, Sparkles, Compass, ArrowRight } from 'lucide-react';
import RadarRings from '../components/RadarRings';

const STEPS = [
  {
    icon: UploadCloud,
    title: 'Add your skills',
    text: 'Tell us what you actually know - no guessing which internships you qualify for.',
  },
  {
    icon: Sparkles,
    title: 'Get matched',
    text: 'Every listing gets a personal Fit Score, with exactly which skills you have and which you\u2019re missing.',
  },
  {
    icon: Compass,
    title: 'Discover underrated roles',
    text: 'We surface government, defence, and research internships that mainstream boards bury or skip.',
  },
];

const ORGS = ['DRDO', 'ISRO', 'CERT-In', 'NASSCOM'];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <header className="border-b border-[#E4E7EC] bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="font-bold text-primary-700 tracking-tight flex items-center gap-1.5">
            <Radar className="w-4 h-4" strokeWidth={2.5} />
            InternRadar
          </span>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-[#5B6270] hover:text-[#111317]"
            >
              Log in
            </Link>
            <Link
              to="/login?mode=register"
              className="text-sm font-medium rounded-lg bg-primary-600 text-white px-4 py-2 hover:bg-primary-700"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <RadarRings className="right-[-120px] top-[-80px] w-[500px] h-[500px]" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center relative">
          <h1 className="text-4xl sm:text-5xl font-bold text-[#111317] leading-tight">
            Discover the internships everyone else is missing.
          </h1>
          <p className="text-lg text-[#5B6270] mt-5 max-w-xl mx-auto">
            InternRadar surfaces underrated government, defence, and research internships,
            and tells you - with a single percentage - how good a fit you are for each one.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
            <Link
              to="/login?mode=register"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 text-white px-5 py-2.5 text-sm font-medium hover:bg-primary-700"
            >
              Get your fit score
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/internships"
              className="inline-flex items-center gap-1.5 rounded-lg ring-1 ring-[#E4E7EC] bg-white px-5 py-2.5 text-sm font-medium text-[#111317] hover:bg-[#FAFBFC]"
            >
              Browse internships
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        <div className="rounded-xl ring-1 ring-underrated/30 bg-underrated/5 px-6 py-4 flex items-center justify-center gap-2 flex-wrap text-sm text-[#5B6270]">
          <span className="font-semibold text-underrated">Underrated, not unknown</span>
          <span>\u2014 listings most students never see, including roles at</span>
          {ORGS.map((org) => (
            <span key={org} className="font-medium text-[#111317]">
              {org}
            </span>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {STEPS.map((step) => (
            <div key={step.title} className="rounded-xl ring-1 ring-[#E4E7EC] bg-white p-6">
              <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
                <step.icon className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h3 className="font-semibold text-[#111317]">{step.title}</h3>
              <p className="text-sm text-[#5B6270] mt-1.5">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#E4E7EC] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between text-sm text-[#5B6270] flex-wrap gap-2">
          <span>InternRadar</span>
          <Link to="/internships" className="hover:text-[#111317]">
            Browse internships
          </Link>
        </div>
      </footer>
    </div>
  );
}
