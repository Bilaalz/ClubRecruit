import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  SAMPLE_RESUMES,
  SAMPLE_ANSWERS,
  buildTranscript,
  type RubricRow,
} from "./seed/sample-content";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

/** Shared password for every seeded account. Shown on the login page. */
const DEMO_PASSWORD = "clubrecruit";

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000);

async function reset() {
  // Order matters for FKs even with cascades; simplest is to wipe roots.
  await db.task.deleteMany();
  await db.application.deleteMany();
  await db.posting.deleteMany();
  await db.project.deleteMany();
  await db.membership.deleteMany();
  await db.subteam.deleteMany();
  await db.club.deleteMany();
  await db.session.deleteMany();
  await db.user.deleteMany();
  await db.university.deleteMany();
}

async function main() {
  console.log("Resetting…");
  await reset();

  // ── University ─────────────────────────────────────────────
  const uoft = await db.university.create({
    data: { name: "University of Toronto", domain: "utoronto.ca", altDomains: ["mail.utoronto.ca"] },
  });

  // ── Users ──────────────────────────────────────────────────
  // Hash once and reuse: bcrypt is deliberately slow, and every demo account shares the password.
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const mk = (email: string, name: string, program: string, year: number, bio?: string) =>
    db.user.create({ data: { email, name, program, year, bio, passwordHash, universityId: uoft.id } });

  const priya = await mk("priya@utoronto.ca", "Priya Sharma", "Engineering Science", 4, "President, UofT World Cup Club.");
  const marcus = await mk("marcus@utoronto.ca", "Marcus Lee", "Computer Science", 3, "Technology lead. Fixtures, standings, too much coffee.");
  const hana = await mk("hana@utoronto.ca", "Hana Kim", "Kinesiology & Physical Education", 4, "Operations lead.");
  const ravi = await mk("ravi@utoronto.ca", "Ravi Iyer", "Cinema Studies", 3);
  const noor = await mk("noor@utoronto.ca", "Noor Ali", "Rotman Commerce", 2, "Partnerships lead.");
  const chloe = await mk("chloe@mail.utoronto.ca", "Chloe Martin", "Computer Science", 2);
  const eli = await mk("eli@utoronto.ca", "Eli Brooks", "Political Science", 4, "President, UofT Debate Society.");

  // Applicants
  const aisha = await mk("aisha@mail.utoronto.ca", "Aisha Rahman", "Computer Science", 2);
  const daniel = await mk("daniel@mail.utoronto.ca", "Daniel Okafor", "Kinesiology & Physical Education", 3);
  const meilin = await mk("meilin@mail.utoronto.ca", "Mei-Lin Chen", "Cinema Studies", 2);
  const jordan = await mk("jordan@mail.utoronto.ca", "Jordan Patel", "Communications & Media", 3);
  const sam = await mk("sam@mail.utoronto.ca", "Sam Osei", "Statistics", 1);
  const leila = await mk("leila@mail.utoronto.ca", "Leila Haddad", "Computer Science", 2);
  const omar = await mk("omar@mail.utoronto.ca", "Omar Farouk", "Kinesiology & Physical Education", 2);
  await mk("newstudent@mail.utoronto.ca", "Taylor Nguyen", "Statistics & Computer Science", 1);

  // ── Club: World Cup ────────────────────────────────────────
  const worldCup = await db.club.create({
    data: {
      slug: "worldcup",
      name: "UofT World Cup Club",
      tagline: "Thirty-two teams, one campus, one trophy.",
      description:
        "The UofT World Cup Club runs the university's annual World Cup: a 32-team tournament where student communities field national sides across six weekends of group and knockout football, with watch parties, a media desk covering every match, and five-a-side leagues in between. Members work in subteams that own a real slice of the tournament, from the fixture schedule to the standings site.",
      universityId: uoft.id,
    },
  });

  const [operations, media, partnerships, technology] = await Promise.all([
    db.subteam.create({ data: { clubId: worldCup.id, name: "Operations", description: "Fixtures, pitches, referees, match-day logistics.", color: "#3B5B7C", order: 0 } }),
    db.subteam.create({ data: { clubId: worldCup.id, name: "Media", description: "Recaps, photography, social, brand.", color: "#7C5A3B", order: 1 } }),
    db.subteam.create({ data: { clubId: worldCup.id, name: "Partnerships", description: "Sponsorship, funding, watch parties.", color: "#5F7C3B", order: 2 } }),
    db.subteam.create({ data: { clubId: worldCup.id, name: "Technology", description: "Registration, fixtures and standings, ticketing.", color: "#7C3B5F", order: 3 } }),
  ]);

  const member = (userId: string, role: "OWNER" | "ADMIN" | "LEAD" | "MEMBER", subteamId?: string, title?: string, joined = 300) =>
    db.membership.create({ data: { userId, clubId: worldCup.id, role, subteamId, title, joinedAt: daysAgo(joined) } });

  const mPriya = await member(priya.id, "OWNER", undefined, "President", 700);
  const mMarcus = await member(marcus.id, "LEAD", technology.id, "Technology Lead", 400);
  const mHana = await member(hana.id, "ADMIN", operations.id, "Operations Lead", 650);
  const mRavi = await member(ravi.id, "MEMBER", media.id, "Video & Recaps", 200);
  const mNoor = await member(noor.id, "LEAD", partnerships.id, "Partnerships Lead", 380);
  const mChloe = await member(chloe.id, "MEMBER", technology.id, "Frontend Developer", 30);

  // ── Club: Debate ───────────────────────────────────────────
  const debate = await db.club.create({
    data: {
      slug: "debate",
      name: "UofT Debate Society",
      tagline: "Canada's oldest university debating society.",
      description: "Weekly practice rounds, novice training, and travel to tournaments across North America.",
      universityId: uoft.id,
    },
  });
  const dTraining = await db.subteam.create({ data: { clubId: debate.id, name: "Training", color: "#3B5B7C", order: 0 } });
  await db.subteam.create({ data: { clubId: debate.id, name: "Tournaments", color: "#7C5A3B", order: 1 } });
  await db.membership.create({ data: { userId: eli.id, clubId: debate.id, role: "OWNER", title: "President", joinedAt: daysAgo(500) } });
  await db.membership.create({ data: { userId: marcus.id, clubId: debate.id, role: "MEMBER", subteamId: dTraining.id, joinedAt: daysAgo(120) } });
  await db.posting.create({
    data: {
      clubId: debate.id,
      subteamId: dTraining.id,
      title: "Novice Coach",
      description: "Run the Tuesday novice session and give structured feedback on practice rounds.",
      requirements: ["1+ year of competitive debate", "Available Tuesdays 6–8pm"],
      responsibilities: ["Plan weekly novice curriculum", "Judge practice rounds", "Mentor 3–4 novices"],
      interviewQuestions: ["Tell us about your debate background.", "How would you give feedback to a nervous novice after a rough round?"],
      openings: 2,
      status: "OPEN",
      closesAt: daysFromNow(21),
    },
  });

  // ── Postings (World Cup) ───────────────────────────────────
  const pTech = await db.posting.create({
    data: {
      clubId: worldCup.id,
      subteamId: technology.id,
      title: "Web Developer — Fixtures & Standings",
      description:
        "Join the technology subteam building the site that runs the tournament: team registration, the fixture list, the live standings table and ticketing for the final. Next.js and PostgreSQL, used by 500+ players and a few thousand spectators over the month of the tournament. Expect real deadlines — the table has to be right before anyone leaves the pitch.",
      requirements: [
        "Comfortable in JavaScript or TypeScript",
        "Some exposure to React or another web framework (course, project or internship)",
        "Able to commit ~8 hours/week including match-day support one weekend a month",
      ],
      responsibilities: [
        "Own one part of the platform (registration, fixtures and standings, or ticketing)",
        "Write tests and replay last season's results before a change goes live on match day",
        "Participate in code review and weekly technology syncs",
      ],
      interviewQuestions: [
        "Tell us about a technical project you're proud of. What was hard about it?",
        "How would you keep the standings table correct when a result is corrected hours after full time?",
        "Describe a time you disagreed with a teammate about a technical decision. What happened?",
        "Why the World Cup Club, and why this role?",
      ],
      openings: 3,
      status: "OPEN",
      closesAt: daysFromNow(14),
      createdAt: daysAgo(20),
    },
  });

  const pOps = await db.posting.create({
    data: {
      clubId: worldCup.id,
      subteamId: operations.id,
      title: "Operations Coordinator — Match Day",
      description:
        "Run match day: fixtures, pitches, kit, referees and the run of play across twelve matches a weekend. You'll take the schedule from a spreadsheet to a tournament that actually kicks off on time.",
      requirements: ["Organised and calm under time pressure", "Available Saturdays through the tournament", "Comfortable directing volunteers and captains"],
      responsibilities: ["Own the fixture schedule and pitch bookings", "Brief referees and volunteers before each match window", "Keep the results and discipline records with Technology"],
      interviewQuestions: [
        "Walk us through something you've organised and run. What would you change?",
        "Two teams turn up for the same pitch and the referee has not arrived. What do you do?",
        "How do you like to work with the media and technology subteams on match day?",
      ],
      openings: 2,
      status: "OPEN",
      closesAt: daysFromNow(10),
      createdAt: daysAgo(18),
    },
  });

  const pMedia = await db.posting.create({
    data: {
      clubId: worldCup.id,
      subteamId: media.id,
      title: "Media Producer — Match Recaps",
      description: "Shoot and cut the recap for every match window: 60-second reels, a weekly highlights package and the after-film for the final.",
      requirements: ["Premiere or Final Cut", "Own camera, or comfortable with ours", "Fast turnaround — recaps go up the same night"],
      responsibilities: ["Shoot two match windows a week", "Cut and publish recaps within 24 hours", "Own the shot list with Operations"],
      interviewQuestions: [
        "Tell us about something you've shot and cut.",
        "How would you cover six matches in one afternoon on your own?",
        "Why this role?",
      ],
      openings: 1,
      status: "CLOSED",
      closesAt: daysAgo(5),
      createdAt: daysAgo(40),
    },
  });

  const pPartners = await db.posting.create({
    data: {
      clubId: worldCup.id,
      subteamId: partnerships.id,
      title: "Partnerships & Sponsorship Coordinator",
      description: "Run sponsor relationships and our watch-party series. You'll keep the tournament funded and the touchline busy.",
      requirements: ["Strong written communication", "Comfortable emailing and calling companies", "Organised"],
      responsibilities: ["Maintain the sponsor pipeline", "Plan 4 watch parties per term", "Run the sponsor newsletter and match-day activations"],
      interviewQuestions: [
        "Tell us about something you've organised from scratch.",
        "A sponsor goes quiet two weeks before a payment is due. What do you do?",
        "Why the World Cup Club?",
      ],
      openings: 1,
      status: "OPEN",
      closesAt: daysFromNow(30),
      createdAt: daysAgo(12),
    },
  });

  await db.posting.create({
    data: {
      clubId: worldCup.id,
      subteamId: media.id,
      title: "Match Photographer",
      description: "Draft: stills for every match window — team sheets, action, podium.",
      requirements: ["DSLR or mirrorless", "Lightroom"],
      responsibilities: ["Own the match photo archive"],
      interviewQuestions: ["Tell us about photography work you've done."],
      openings: 1,
      status: "DRAFT",
      createdAt: daysAgo(2),
    },
  });

  // ── Applications ───────────────────────────────────────────
  type Stage = "SUBMITTED" | "INTERVIEW_COMPLETE" | "UNDER_REVIEW" | "ACCEPTED" | "REJECTED";
  async function apply(opts: {
    posting: { id: string; interviewQuestions: string[] };
    applicant: { id: string; name: string };
    resumeKey: keyof typeof SAMPLE_RESUMES;
    answers?: keyof typeof SAMPLE_ANSWERS;
    stage: Stage;
    coverNote?: string;
    evaluation?: { score: number; rec: "STRONG_YES" | "YES" | "MAYBE" | "NO"; summary: string; strengths: string[]; concerns: string[]; rubric: RubricRow[] };
    decisionNote?: string;
    ageDays: number;
  }) {
    const slug = opts.applicant.name.toLowerCase().replace(/[^a-z]+/g, "-");
    const app = await db.application.create({
      data: {
        postingId: opts.posting.id,
        applicantId: opts.applicant.id,
        status: opts.stage,
        coverNote: opts.coverNote,
        createdAt: daysAgo(opts.ageDays),
        decisionNote: opts.decisionNote,
        decidedAt: opts.stage === "ACCEPTED" || opts.stage === "REJECTED" ? daysAgo(Math.max(0, opts.ageDays - 3)) : null,
        resume: {
          create: {
            fileName: `${slug}-resume.pdf`,
            fileUrl: `/demo/resumes/${slug}-resume.pdf`,
            sizeBytes: 140_000 + Math.floor(Math.random() * 90_000),
            extractedText: SAMPLE_RESUMES[opts.resumeKey],
          },
        },
      },
    });
    if (opts.stage !== "SUBMITTED" && opts.answers) {
      const { transcript, durationSec } = buildTranscript(opts.posting.interviewQuestions, SAMPLE_ANSWERS[opts.answers]);
      await db.interview.create({
        data: {
          applicationId: app.id,
          recordingUrl: `/demo/recordings/${slug}.webm`,
          durationSec,
          transcript,
          completedAt: daysAgo(Math.max(0, opts.ageDays - 1)),
        },
      });
    }
    if (opts.evaluation) {
      await db.evaluation.create({
        data: {
          applicationId: app.id,
          overallScore: opts.evaluation.score,
          recommendation: opts.evaluation.rec,
          summary: opts.evaluation.summary,
          strengths: opts.evaluation.strengths,
          concerns: opts.evaluation.concerns,
          rubric: opts.evaluation.rubric,
          model: "mock-v1",
          createdAt: daysAgo(Math.max(0, opts.ageDays - 1)),
        },
      });
    }
    return app;
  }

  await apply({
    posting: pTech,
    applicant: aisha,
    resumeKey: "technology",
    answers: "strong",
    stage: "UNDER_REVIEW",
    ageDays: 6,
    coverNote: "I've been at the last two finals and want to work on the standings page that everyone refreshes at full time.",
    evaluation: {
      score: 88,
      rec: "STRONG_YES",
      summary:
        "Aisha shows directly relevant experience (a five-a-side league site with a fixture generator and live standings) and an unusually mature approach to engineering process: interface-first, vertical slices, written trade-offs. Communication is crisp and concrete. Strong fit for owning a part of the platform.",
      strengths: [
        "Hands-on TypeScript and React work on a real league site",
        "Explains technical decisions with concrete numbers and outcomes",
        "Handles disagreement constructively (written comparison of options)",
      ],
      concerns: ["Second-year course load may limit match-day weekend availability", "No direct experience with payments or ticketing"],
      rubric: [
        { criterion: "Relevant experience", score: 5, note: "Next.js + PostgreSQL league site, fixture generator, standings table." },
        { criterion: "Technical / skill depth", score: 4, note: "Solid fundamentals; payments and ticketing are new territory." },
        { criterion: "Communication", score: 5, note: "Structured, specific answers with measurable results." },
        { criterion: "Motivation & fit", score: 4, note: "Clear reasons for wanting a fixed date and a real crowd." },
        { criterion: "Collaboration", score: 4, note: "Good conflict example; TA experience." },
      ],
    },
  });

  await apply({
    posting: pOps,
    applicant: daniel,
    resumeKey: "operations",
    answers: "strong",
    stage: "UNDER_REVIEW",
    ageDays: 5,
    evaluation: {
      score: 84,
      rec: "STRONG_YES",
      summary:
        "Daniel has already run a 24-team league season — fixtures, pitch bookings, results and discipline — and is a certified referee, so he can cover a match window himself. Used to briefing volunteers. A natural match-day owner.",
      strengths: ["Ran a 24-team five-a-side league for a full season", "Cut match start delays from 15 minutes to under 3", "Certified referee; trained 30+ volunteers"],
      concerns: ["Answers lean on individual work; wants to see more coordination with media and technology"],
      rubric: [
        { criterion: "Relevant experience", score: 5, note: "League coordination, referee certification, 16-team knockout weekend." },
        { criterion: "Technical / skill depth", score: 5, note: "Fixture scheduling, discipline records, volunteer briefings." },
        { criterion: "Communication", score: 4, note: "Clear, a little terse." },
        { criterion: "Motivation & fit", score: 4, note: "Wants to own match day end to end." },
        { criterion: "Collaboration", score: 3, note: "Limited cross-subteam examples." },
      ],
    },
  });

  await apply({
    posting: pMedia,
    applicant: meilin,
    resumeKey: "media",
    answers: "medium",
    stage: "UNDER_REVIEW",
    ageDays: 9,
    evaluation: {
      score: 71,
      rec: "YES",
      summary:
        "Mei-Lin's reel is excellent for the role (same-night recaps for 30+ Varsity Blues matches, a documentary on a campus league) but interview answers were shorter and more generic than the reel suggests. Likely nerves. Worth a follow-up conversation with the media lead.",
      strengths: ["Shoots and cuts on a same-night turnaround — exactly the recap cadence", "Has run a two-camera match-day setup with a volunteer operator"],
      concerns: ["Interview answers were high-level and did not reference her own work", "Fit answer was vague"],
      rubric: [
        { criterion: "Relevant experience", score: 5, note: "Match recaps on the resume match the recap scope." },
        { criterion: "Technical / skill depth", score: 4, note: "Strong on paper; not probed in interview." },
        { criterion: "Communication", score: 3, note: "Short, generic answers." },
        { criterion: "Motivation & fit", score: 3, note: "Generic." },
        { criterion: "Collaboration", score: 3, note: "One reasonable group example." },
      ],
    },
  });

  await apply({
    posting: pPartners,
    applicant: jordan,
    resumeKey: "partnerships",
    answers: "strong",
    stage: "UNDER_REVIEW",
    ageDays: 3,
    evaluation: {
      score: 79,
      rec: "YES",
      summary:
        "Jordan has run sponsor outreach at scale ($45k) and organised a six-screening watch-party series, which maps directly onto the role. Communication is energetic and organised.",
      strengths: ["Grew EngSoc Instagram 3x", "Managed 12 sponsor relationships", "Planned a watch-party series for 200+ students"],
      concerns: ["No football background; will need onboarding to speak credibly about the tournament to sponsors"],
      rubric: [
        { criterion: "Relevant experience", score: 5, note: "Sponsorship + events + social." },
        { criterion: "Technical / skill depth", score: 3, note: "Not a technical role; domain knowledge is thin." },
        { criterion: "Communication", score: 5, note: "Polished." },
        { criterion: "Motivation & fit", score: 4, note: "Genuinely likes running events." },
        { criterion: "Collaboration", score: 4, note: "Coordinated multi-stakeholder events." },
      ],
    },
  });

  await apply({
    posting: pTech,
    applicant: sam,
    resumeKey: "generic",
    answers: "weak",
    stage: "REJECTED",
    ageDays: 12,
    decisionNote: "Encouraged Sam to volunteer on a match window this term and re-apply in January.",
    evaluation: {
      score: 38,
      rec: "NO",
      summary:
        "Sam is enthusiastic but does not yet have the programming exposure the posting asks for, and answers were vague. Motivation reads as resume-driven. Recommend volunteering on match day and re-applying later.",
      strengths: ["Enthusiastic", "Honest about gaps"],
      concerns: ["No programming beyond beginner Python", "Prefers working alone", "Motivation is external (resume, networking)"],
      rubric: [
        { criterion: "Relevant experience", score: 1, note: "None in web development." },
        { criterion: "Technical / skill depth", score: 1, note: "Beginner." },
        { criterion: "Communication", score: 3, note: "Friendly but unspecific." },
        { criterion: "Motivation & fit", score: 2, note: "Extrinsic." },
        { criterion: "Collaboration", score: 2, note: "Self-described solo worker." },
      ],
    },
  });

  await apply({ posting: pTech, applicant: leila, resumeKey: "technology", stage: "SUBMITTED", ageDays: 1, coverNote: "Second-year CS, have built a couple of Next.js side projects and would love to work on the standings page." });
  await apply({ posting: pOps, applicant: omar, resumeKey: "operations", answers: "medium", stage: "INTERVIEW_COMPLETE", ageDays: 2 });

  // Chloe was accepted last month → she is already a member (created above)
  await apply({
    posting: pTech,
    applicant: chloe,
    resumeKey: "technology",
    answers: "strong",
    stage: "ACCEPTED",
    ageDays: 34,
    decisionNote: "Accepted as Frontend Developer on Technology.",
    evaluation: {
      score: 82,
      rec: "STRONG_YES",
      summary: "Strong project portfolio and clear communication. Recommended for the registration and standings work.",
      strengths: ["React experience", "Clear communicator"],
      concerns: ["Limited backend work"],
      rubric: [
        { criterion: "Relevant experience", score: 4, note: "" },
        { criterion: "Technical / skill depth", score: 4, note: "" },
        { criterion: "Communication", score: 5, note: "" },
        { criterion: "Motivation & fit", score: 4, note: "" },
        { criterion: "Collaboration", score: 4, note: "" },
      ],
    },
  });

  // ── Project plan ───────────────────────────────────────────
  const project = await db.project.create({
    data: {
      clubId: worldCup.id,
      name: "World Cup 2027",
      summary:
        "Plan and run the 2027 campus World Cup: 32 teams, six weekends of group and knockout football, watch parties, and a full stand for the final on 12 June.",
      goals: [
        "32 teams and 500+ registered players",
        "Every match window kicks off on time",
        "Raise $60k in cash and in-kind sponsorship",
        "Ship a documented, reusable registration and standings platform for 2028",
      ],
      targetDate: new Date("2027-06-12"),
    },
  });

  const [phFormat, phTeams, phBuildUp, phTournament] = await Promise.all([
    db.phase.create({ data: { projectId: project.id, name: "Format & Requirements", description: "Tournament format, rules, budget, platform architecture.", order: 0, startDate: new Date("2026-09-08"), endDate: new Date("2026-10-31") } }),
    db.phase.create({ data: { projectId: project.id, name: "Teams & Partners", description: "Registration, sponsorship, venues, content plan.", order: 1, startDate: new Date("2026-11-01"), endDate: new Date("2027-01-31") } }),
    db.phase.create({ data: { projectId: project.id, name: "Build-up", description: "Platform build, referee training, kit, promotion.", order: 2, startDate: new Date("2027-02-01"), endDate: new Date("2027-04-30") } }),
    db.phase.create({ data: { projectId: project.id, name: "Tournament", description: "Dry run, group stage, knockouts, the final.", order: 3, startDate: new Date("2027-05-01"), endDate: new Date("2027-06-12") } }),
  ]);

  const ws = async (name: string, phaseId: string, subteamId: string | null, status: "PLANNED" | "ACTIVE" | "BLOCKED" | "DONE", order: number, description: string, dependsOn: string[] = []) =>
    db.workstream.create({ data: { projectId: project.id, phaseId, subteamId, name, status, order, description, dependsOn } });

  const wRules = await ws("Format, rules & budget", phFormat.id, operations.id, "DONE", 0, "Group and knockout structure, eligibility, discipline policy, and the tournament budget.");
  const wArch = await ws("Platform architecture", phFormat.id, technology.id, "DONE", 1, "Registration, fixtures, standings and ticketing; the data each subteam owns and hands over.", [wRules.id]);
  const wSponsor = await ws("Sponsorship & funding", phFormat.id, partnerships.id, "ACTIVE", 2, "Raise $60k in cash and in-kind sponsorship; maintain sponsor pipeline.");

  const wVenues = await ws("Venues & fixture schedule", phTeams.id, operations.id, "ACTIVE", 0, "Book pitches for six weekends and schedule 48 group matches around them.", [wRules.id, wArch.id]);
  const wReferees = await ws("Referee recruitment & training", phTeams.id, operations.id, "ACTIVE", 1, "Recruit 16 referees, run certification and the pre-tournament briefing.", [wRules.id]);
  const wContent = await ws("Brand, kit & content plan", phTeams.id, media.id, "ACTIVE", 2, "Team crests, kit, the shot list per match window, and the recap format.", [wArch.id]);
  const wPlatform = await ws("Registration & standings platform", phTeams.id, technology.id, "ACTIVE", 3, "Team registration, payments, the fixture list and a live standings table with tiebreakers.", [wArch.id]);

  const wMatchOps = await ws("Match-day operations plan", phBuildUp.id, operations.id, "PLANNED", 0, "Volunteer rota, kit and equipment per pitch, run of play per window.", [wVenues.id]);
  const wRecaps = await ws("Recap pipeline & match-day crew", phBuildUp.id, media.id, "BLOCKED", 1, "Camera crew per pitch and the same-night edit; blocked on the final fixture schedule.", [wContent.id, wVenues.id]);
  const wTicketing = await ws("Ticketing & live scores", phBuildUp.id, technology.id, "PLANNED", 2, "Ticket sales for the final, live score entry from the pitch, public standings page.", [wPlatform.id, wContent.id]);

  const wDryRun = await ws("Pre-season dry run", phTournament.id, operations.id, "PLANNED", 0, "Two rehearsal match windows; checklist per system from kickoff to published recap.", [wMatchOps.id, wRecaps.id, wTicketing.id]);
  await ws("World Cup 2027 tournament", phTournament.id, partnerships.id, "PLANNED", 1, "Group stage, knockouts and the final: logistics, watch parties, sponsor activations, media.", [wDryRun.id, wSponsor.id]);

  // ── Tasks ──────────────────────────────────────────────────
  type TS = "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
  type TP = "LOW" | "MEDIUM" | "HIGH";
  const orders: Record<TS, number> = { BACKLOG: 0, TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };
  const task = (title: string, status: TS, wsId: string | null, assigneeId: string | null, priority: TP = "MEDIUM", due?: number, description?: string) =>
    db.task.create({
      data: {
        clubId: worldCup.id,
        workstreamId: wsId,
        assigneeId,
        title,
        description,
        status,
        priority,
        order: orders[status]++,
        dueDate: due === undefined ? null : daysFromNow(due),
      },
    });

  await task("Finalise tournament budget spreadsheet", "DONE", wRules.id, mHana.id, "HIGH", -20);
  await task("Write the discipline and appeals policy", "DONE", wRules.id, mHana.id, "HIGH", -16);
  await task("Agree the fixtures and results data model", "DONE", wArch.id, mMarcus.id, "HIGH", -14);
  await task("Choose hosting: managed Postgres vs a college VM", "DONE", wArch.id, mMarcus.id, "MEDIUM", -10);
  await task("Send Q4 sponsor deck to 30 companies", "DONE", wSponsor.id, mNoor.id, "HIGH", -7);
  await task("Follow up with Adidas Canada on in-kind kit", "IN_PROGRESS", wSponsor.id, mNoor.id, "HIGH", 3);
  await task("Pitch availability study across six weekends", "IN_REVIEW", wVenues.id, mHana.id, "HIGH", 2, "Compare 3 venue combinations for travel time vs. cost.");
  await task("Confirm group-stage pitch bookings", "IN_PROGRESS", wVenues.id, mHana.id, "HIGH", 5, "Media is blocked on this — send the draft schedule even if dates shift.");
  await task("Fixture draw with no team playing twice in a window", "TODO", wVenues.id, null, "MEDIUM", 12);
  await task("Referee certification session 2", "IN_PROGRESS", wReferees.id, mHana.id, "MEDIUM", 8);
  await task("Pre-tournament referee briefing pack", "BACKLOG", wReferees.id, null, "LOW");
  await task("Recap format review — 60s vertical cut", "IN_REVIEW", wContent.id, mRavi.id, "HIGH", 1);
  await task("Pick the kit supplier and crest template", "DONE", wContent.id, mRavi.id, "MEDIUM", -3);
  await task("Shot list per match window", "TODO", wContent.id, mRavi.id, "HIGH", 14);
  await task("Registration flow with payment stub", "IN_PROGRESS", wPlatform.id, mChloe.id, "HIGH", 6);
  await task("Standings table with head-to-head tiebreakers", "IN_PROGRESS", wPlatform.id, mChloe.id, "MEDIUM", 9);
  await task("Fixture list page and calendar export", "TODO", wPlatform.id, mMarcus.id, "HIGH", 16);
  await task("Import last season's team rosters", "TODO", wPlatform.id, null, "MEDIUM", 18);
  await task("Seed data for a 32-team dry run", "BACKLOG", wPlatform.id, null, "LOW");
  await task("Order corner flags, bibs and match balls", "BACKLOG", wMatchOps.id, null, "MEDIUM");
  await task("Camera crew rota per pitch", "BACKLOG", wRecaps.id, mRavi.id, "MEDIUM");
  await task("Live score entry from a phone", "BACKLOG", wTicketing.id, mMarcus.id, "LOW");
  await task("Book the stadium for the final", "TODO", wDryRun.id, mPriya.id, "MEDIUM", 25);
  await task("Onboard new technology recruits", "TODO", null, mMarcus.id, "MEDIUM", 7, "Set up the repo, local Postgres and seed data for the incoming cohort.");

  console.log("Seeded ✓");
  console.log("");
  console.log(`Demo accounts (password for all: "${DEMO_PASSWORD}")`);
  console.log("  priya@utoronto.ca            club owner (UofT World Cup Club)");
  console.log("  marcus@utoronto.ca           technology lead");
  console.log("  aisha@mail.utoronto.ca       applicant");
  console.log("  newstudent@mail.utoronto.ca  new student, no clubs");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
