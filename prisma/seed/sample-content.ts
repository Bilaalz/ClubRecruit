// Sample resumes, interview answers and evaluations used by the seed and by the demo apply flow.

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
  software: `AISHA RAHMAN
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
Path-planning visualiser (TypeScript, Canvas) — A*, RRT and D* Lite side by side with step-through debugging
ROS 2 line follower (C++, Python) — camera pipeline with OpenCV on a Raspberry Pi 4

SKILLS
TypeScript, Python, C++, ROS 2, OpenCV, Git, Linux, Docker, PostgreSQL`,

  mechanical: `DANIEL OKAFOR
daniel.okafor@mail.utoronto.ca · Toronto, ON

EDUCATION
University of Toronto — BASc Mechanical Engineering, Year 3 (expected 2027)
Relevant courses: MIE243 Mechanical Engineering Design, MIE222 Mechanics of Solids, MIE313 Design of Mechanical Components

EXPERIENCE
Design Engineering Intern — Magna International (Summer 2026)
- Designed a fixture for a robotic welding cell in SolidWorks; reduced changeover time by 15 minutes
- Ran FEA on bracket redesign, cut mass 22% while meeting a 3x safety factor

Machine Shop Assistant — UofT Myhal Fabrication Facility (2025–present)
- Certified on manual mill, lathe, and waterjet; trained 30+ students

PROJECTS
6-DOF robotic arm — designed and 3D printed all links, cycloidal gearboxes for joints 1–3
Formula SAE suspension — analysed anti-dive geometry in MATLAB

SKILLS
SolidWorks, Fusion 360, ANSYS, GD&T, FDM/SLA printing, CNC, MATLAB, basic Python`,

  electrical: `MEI-LIN CHEN
meilin.chen@mail.utoronto.ca · Toronto, ON

EDUCATION
University of Toronto — BASc Electrical Engineering, Year 2 (expected 2028)
Relevant courses: ECE212 Circuit Analysis, ECE241 Digital Systems, ECE216 Signals and Systems

EXPERIENCE
Hardware Intern — Ecobee (Summer 2026)
- Laid out a 4-layer sensor board in Altium; brought up firmware on STM32
- Wrote I2C/SPI drivers in C for temperature and humidity sensors

PROJECTS
Custom BLDC motor controller — FOC on STM32G4, 48V/30A, designed power stage and gate drive
Battery management board — 12S LiFePO4, cell balancing, CAN telemetry

SKILLS
Altium, KiCad, STM32, C, CAN, I2C/SPI, oscilloscope/logic analyser, soldering (SMD down to 0402), LTspice`,

  outreach: `JORDAN PATEL
jordan.patel@mail.utoronto.ca · Toronto, ON

EDUCATION
University of Toronto — BA Communications & Media Studies, Year 3 (expected 2027)

EXPERIENCE
Marketing Coordinator — UofT Engineering Society (2025–present)
- Grew Instagram from 2.1k to 6.8k followers in 8 months through a weekly reel series
- Coordinated 12 sponsor relationships totalling $45k for orientation week

Event Volunteer — Toronto Science Festival (2024, 2025)

PROJECTS
"Build Night" outreach series — planned 6 hands-on robotics workshops for 200+ high-school students

SKILLS
Canva, Figma, Adobe Premiere, Notion, sponsor outreach, event logistics, public speaking`,

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
    "Sure. Last summer I owned the internal dashboard end to end. The hard part wasn't the UI, it was that the event stream had duplicates and out-of-order arrivals, so I wrote a small reconciliation service with idempotency keys and a short replay window. It cut duplicate alerts by about thirty percent and the support team stopped paging us.",
    "I'd start by asking what 'done' looks like for the team, then break it into a first vertical slice that touches every layer so we find integration problems early. I like writing the interface first, getting agreement, then filling in the implementation.",
    "When I disagreed with my lead about the caching approach I wrote up both options with rough numbers in a one-pager. We ended up going with a hybrid. What I learned is that a concrete comparison beats arguing in a meeting.",
    "Honestly the thing that excites me is the deadline. Competition teams ship real hardware on a real date, and I want to be on a team where my code runs on something that moves.",
  ],
  medium: [
    "I've mostly worked on course projects, but in CSC209 I built a shell in C with pipes and job control, which taught me a lot about debugging with gdb and valgrind. I'd like to apply that to something with real hardware.",
    "I think I'd try to break the problem down into smaller pieces and look at what other teams have done. I'd probably ask a lot of questions in the first couple of weeks.",
    "In a group project one member wasn't contributing. I talked to them one on one and it turned out they were overloaded, so we re-split the work. It ended fine but we lost a week.",
    "I want to join because I've seen the rover videos and it looks like the kind of project where you learn ten times faster than in class.",
  ],
  weak: [
    "I haven't done much like that yet, but I'm a fast learner and I'm really motivated to figure it out.",
    "Um, I'd probably Google it and watch some tutorials, and then ask someone on the team if I got stuck.",
    "I usually work alone because I find it faster, but I know teams are important so I'm trying to get better at that.",
    "I'm interested because it would look good on my resume and I want to meet people in engineering.",
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
