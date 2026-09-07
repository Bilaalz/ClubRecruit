// Copied from prisma/seed/sample-content.ts so the app does not import from prisma/.
// Keep the two in sync if you change either.


export type TranscriptTurn = {
  speaker: "Interviewer" | "Candidate";
  text: string;
  atSec: number;
};

export type RubricRow = { criterion: string; score: number; note: string };

export const RUBRIC_CRITERIA = [
  "Relevant experience",
  "Technical / skill depth",
  "Communication",
  "Motivation & fit",
  "Collaboration",
] as const;

export const SAMPLE_RESUMES: Record<string, string> = {
  technology: `AISHA RAHMAN
aisha.rahman@mail.utoronto.ca · Toronto, ON · github.com/aisharahman

EDUCATION
University of Toronto — BSc Computer Science, Year 2 (expected 2028)
Relevant courses: CSC209 Software Tools & Systems Programming, CSC263 Data Structures, MAT223 Linear Algebra

EXPERIENCE
Software Developer Intern — Shopify (Summer 2026)
- Built an internal dashboard in TypeScript/React consumed by 40+ support staff
- Wrote a Python service that reconciled 2M daily events; reduced duplicate alerts by 30%

Teaching Assistant — CSC108 Intro to Programming (Fall 2025)
- Ran weekly labs for 60 students; wrote autograder tests in Python

PROJECTS
Five-a-side league site (Next.js, PostgreSQL) — team registration, fixture generator and a live standings table with tiebreakers
Bracket visualiser (TypeScript, Canvas) — knockout draws with step-through what-if editing

SKILLS
TypeScript, JavaScript, React, Next.js, Python, Git, Linux, Docker, PostgreSQL`,

  operations: `DANIEL OKAFOR
daniel.okafor@mail.utoronto.ca · Toronto, ON

EDUCATION
University of Toronto — BKin Kinesiology & Physical Education, Year 3 (expected 2027)
Relevant courses: KPE320 Sport Administration, KPE335 Coaching Theory, KPE260 Sport Psychology

EXPERIENCE
Intramural League Coordinator — UofT Sport & Rec (2025–present)
- Ran a 24-team five-a-side league: fixtures, pitch bookings, results and discipline records
- Cut match start delays from 15 minutes to under 3 by briefing captains and referees the night before

Referee — Ontario Soccer, certified 2024
- 60+ matches at youth and university level; trained 30+ new volunteers

PROJECTS
Summer knockout weekend — organised a 16-team tournament across 2 pitches with 12 volunteers

SKILLS
Fixture scheduling, volunteer coordination, referee certification, first aid, Excel/Sheets, public speaking`,

  media: `MEI-LIN CHEN
meilin.chen@mail.utoronto.ca · Toronto, ON · vimeo.com/meilinchen

EDUCATION
University of Toronto — BA Cinema Studies, Year 2 (expected 2028)
Relevant courses: CIN212 Film Production, CIN270 Documentary Forms

EXPERIENCE
Videographer — The Varsity (2025–present)
- Shot and cut same-night recaps for 30+ Varsity Blues matches, published within 6 hours of full time
- Ran a two-camera match-day setup with one volunteer operator

Production Assistant — Toronto Reel Asian Film Festival (Summer 2026)

PROJECTS
"Ninety Minutes" — 6-minute documentary on a campus five-a-side league, 40k views
Weekly reel series — vertical 60-second match recaps, 12k views on average

SKILLS
Premiere Pro, Final Cut, DaVinci Resolve, Sony A7 III, two-camera shoots, colour, sound, Lightroom`,

  partnerships: `JORDAN PATEL
jordan.patel@mail.utoronto.ca · Toronto, ON

EDUCATION
University of Toronto — BA Communications & Media Studies, Year 3 (expected 2027)

EXPERIENCE
Marketing Coordinator — UofT Engineering Society (2025–present)
- Grew Instagram from 2.1k to 6.8k followers in 8 months through a weekly reel series
- Coordinated 12 sponsor relationships totalling $45k for orientation week

Event Volunteer — Toronto Sports Film Festival (2024, 2025)

PROJECTS
Watch-party series — planned 6 screenings for 200+ students, including a 400-seat final

SKILLS
Canva, Figma, Notion, sponsor outreach, event logistics, public speaking`,

  generic: `TAYLOR NGUYEN
taylor.nguyen@mail.utoronto.ca · Toronto, ON

EDUCATION
University of Toronto — BSc Statistics & Computer Science, Year 1 (expected 2029)

EXPERIENCE
Cashier — Loblaws (2024–2026)

PROJECTS
Personal website (HTML/CSS/JS)
High-school science fair project on pendulum damping (2nd place, regional)

SKILLS
Python (beginner), Excel, HTML/CSS, teamwork, fast learner`,
};

/** Plausible candidate answers keyed by a rough theme; the apply flow picks one per question. */
export const SAMPLE_ANSWERS: Record<string, string[]> = {
  strong: [
    "Sure. The one I'd point to is the five-a-side league I ran last year — twenty-four teams, two pitches, and everyone wanting to play at seven on a Thursday. The hard part wasn't the schedule, it was the corrections: results came in late, teams swapped players, and the table was wrong by Sunday. I rebuilt how we recorded a result so every change had one owner and one place to live, and by the end of the season the standings were right the same night.",
    "I'd start by asking what 'done' looks like for the team, then take one match window end to end rather than half of everything — schedule it, run it, write down what broke. I like agreeing the handoffs with the other subteams first and filling in the details after.",
    "When I disagreed with my lead about how to handle no-shows I wrote up both options with rough numbers in a one-pager. We ended up going with a hybrid. What I learned is that a concrete comparison beats arguing in a meeting.",
    "Honestly the thing that excites me is the fixture list. There is a real date and a real crowd, and I want to be on a team where the thing I worked on is visible at kickoff.",
  ],
  medium: [
    "I've mostly done smaller things — I kept the roster and the ride-shares for my intramural team all season, and I've volunteered at a couple of tournament weekends. I'd like to do it properly rather than ad hoc.",
    "I think I'd try to break the problem down into smaller pieces and look at how other leagues have done it. I'd probably ask a lot of questions in the first couple of weeks.",
    "In a group project one member wasn't contributing. I talked to them one on one and it turned out they were overloaded, so we re-split the work. It ended fine but we lost a week.",
    "I want to join because I've been to the last two finals and it looks like the kind of thing where you learn ten times faster than in class.",
  ],
  weak: [
    "I haven't done much like that yet, but I'm a fast learner and I'm really motivated to figure it out.",
    "Um, I'd probably Google it and watch some tutorials, and then ask someone on the team if I got stuck.",
    "I usually work alone because I find it faster, but I know teams are important so I'm trying to get better at that.",
    "I'm interested because it would look good on my resume and I want to meet people on campus.",
  ],
};

export function buildTranscript(
  questions: string[],
  answers: string[],
): { transcript: TranscriptTurn[]; durationSec: number } {
  const transcript: TranscriptTurn[] = [];
  let t = 4;
  transcript.push({
    speaker: "Interviewer",
    text: "Thanks for applying. I'll ask a few questions; take as long as you need on each. Ready?",
    atSec: 0,
  });
  transcript.push({ speaker: "Candidate", text: "Yes, ready.", atSec: t });
  t += 3;
  questions.forEach((q, i) => {
    transcript.push({ speaker: "Interviewer", text: q, atSec: t });
    t += 6 + Math.round(q.length / 25);
    const a = answers[i % answers.length];
    transcript.push({ speaker: "Candidate", text: a, atSec: t });
    t += 12 + Math.round(a.length / 14);
  });
  transcript.push({
    speaker: "Interviewer",
    text: "That's everything from me. Thanks for your time, we'll be in touch.",
    atSec: t,
  });
  return { transcript, durationSec: t + 5 };
}

export type SampleResumeKey = keyof typeof SAMPLE_RESUMES;
export type SampleAnswerKey = keyof typeof SAMPLE_ANSWERS;

/** Pick a sample resume by the posting's subteam name (Technology → technology, etc.). */
/**
 * The sample resumes carry a fictional name/email on their first two lines.
 * Swap those for the person actually applying so Taylor doesn't see "AISHA RAHMAN".
 */
export function personaliseResume(text: string, user: { name: string; email: string }): string {
  const lines = text.split("\n");
  if (lines.length === 0) return text;
  lines[0] = user.name.toUpperCase();
  if (lines.length > 1) {
    // Second line is "email · City, Province · links…". Keep plain segments (the city),
    // drop anything that is an email, URL or handle belonging to the sample person.
    const rest = lines[1].split(" · ").filter((seg) => !/[@/]/.test(seg));
    lines[1] = [user.email, ...rest].join(" · ");
  }
  return lines.join("\n");
}

export function sampleResumeForSubteam(subteamName: string | null | undefined): string {
  const key = (subteamName ?? "").trim().toLowerCase();
  return SAMPLE_RESUMES[key] ?? SAMPLE_RESUMES.generic;
}

/** Sample answer for question i (cycles through the theme's answers). */
export function sampleAnswerFor(theme: SampleAnswerKey, index: number): string {
  const list = SAMPLE_ANSWERS[theme] ?? SAMPLE_ANSWERS.medium;
  return list[index % list.length];
}
