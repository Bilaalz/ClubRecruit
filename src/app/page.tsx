import Link from "next/link";
import { ButtonLink } from "@/components/ui";

export const metadata = {
  title: "ClubRecruit — recruit the right students, then build the thing",
};

const FEATURES = [
  {
    n: "01",
    title: "Recruit",
    body: "Post roles per subteam with real requirements and interview questions. Students at your university see them on their dashboard and apply with a resume and a short recorded interview — no forms in a shared spreadsheet, no cold DMs.",
  },
  {
    n: "02",
    title: "Evaluate",
    body: "Every interview is transcribed and scored against a five-point rubric by Claude, with a summary, strengths and concerns. Your pipeline sorts by score so the strongest candidates surface first, but the decision — accept, reject, assign a subteam — stays with you.",
  },
  {
    n: "03",
    title: "Build",
    body: "Accepted applicants land on the roster with a role and a subteam. The club's project plan lays out phases, workstreams and dependencies as a flow, and a kanban board turns each workstream into tasks the new members can pick up on day one.",
  },
];

const PERSONAS = [
  { name: "Priya", role: "Club owner", email: "priya@utoronto.ca", blurb: "Runs the club. Reviews the pipeline, accepts applicants, edits the plan." },
  { name: "Marcus", role: "Technology lead", email: "marcus@utoronto.ca", blurb: "Leads a subteam. Lives on the board and the project flow." },
  { name: "Aisha", role: "Applicant", email: "aisha@mail.utoronto.ca", blurb: "Has applied and finished her interview. Waiting on a decision." },
  { name: "Taylor", role: "New student", email: "newstudent@mail.utoronto.ca", blurb: "Not in any club yet. Browses open roles and applies from scratch." },
];

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-7xl px-6">
      {/* Hero */}
      <section className="grid gap-10 border-b border-line py-20 sm:py-28 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-4xl">
          <div className="eyebrow mb-6">ClubRecruit · for university clubs</div>
          <h1 className="font-serif text-5xl leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Recruit the right students.
            <br />
            Then <em className="italic">actually</em> build the thing.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink-3">
            Postings, recorded interviews, AI evaluation and a project board — one calm place for a club to hire and then get to work.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <ButtonLink href="/login" size="lg">
              Log in
            </ButtonLink>
            <ButtonLink href="/signup" variant="secondary" size="lg">
              Create account
            </ButtonLink>
          </div>
        </div>
        <div className="hidden select-none lg:block" aria-hidden>
          <div className="font-serif text-[15rem] leading-[0.8] tracking-tighter text-ink" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>
            &amp;
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="grid border-b border-line md:grid-cols-3">
        {FEATURES.map((f, i) => (
          <article key={f.n} className={i > 0 ? "border-t border-line py-10 md:border-l md:border-t-0 md:px-8 md:py-14" : "py-10 md:pr-8 md:py-14"}>
            <div className="font-serif text-6xl leading-none text-ink-4 sm:text-7xl">{f.n}</div>
            <h2 className="mt-6 font-serif text-3xl">{f.title}</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-2 sm:text-base">{f.body}</p>
          </article>
        ))}
      </section>

      {/* Demo accounts */}
      <section className="py-14 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <div className="eyebrow mb-2">See it in action</div>
            <h2 className="font-serif text-3xl sm:text-4xl">Four seats at one club.</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-3 sm:text-base">
              The demo is seeded with UTWC 26, the University of Toronto World Cup Club: its roles, a pipeline of applicants and the
              season-long project plan behind the 2026 tournament. Log in as anyone below — the password is{" "}
              <code className="rounded-sm bg-cream-3 px-1.5 py-0.5 font-mono text-[0.85em] text-ink">clubrecruit</code> for all of them.
            </p>
          </div>
          <ButtonLink href="/login" variant="secondary">
            Go to login
          </ButtonLink>
        </div>

        <ul className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {PERSONAS.map((p) => (
            <li key={p.email} className="bg-cream-2">
              <Link href="/login" className="group flex h-full flex-col justify-between gap-8 bg-cream-2 p-6 transition-colors hover:bg-ink hover:text-cream">
                <div>
                  <div className="eyebrow group-hover:text-cream/70">{p.role}</div>
                  <div className="mt-2 font-serif text-3xl">{p.name}</div>
                  <p className="mt-3 text-sm leading-relaxed text-ink-3 group-hover:text-cream/80">{p.blurb}</p>
                </div>
                <div className="text-xs">
                  <div className="truncate font-mono text-ink-2 group-hover:text-cream">{p.email}</div>
                  <div className="mt-1 text-ink-4 group-hover:text-cream/60">password · clubrecruit</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Footer line */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-8 text-xs text-ink-4">
        <span>ClubRecruit is a demo. Real database, real data flow; uploads and recordings are simulated.</span>
        <span>Next.js · Prisma · PostgreSQL · Claude</span>
      </div>
    </div>
  );
}
