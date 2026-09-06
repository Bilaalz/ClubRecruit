/* eslint-disable no-console */
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

  const priya = await mk("priya@utoronto.ca", "Priya Sharma", "Engineering Science", 4, "President, UofT Robotics Association.");
  const marcus = await mk("marcus@utoronto.ca", "Marcus Lee", "Computer Science", 3, "Software lead. ROS 2, perception, too much coffee.");
  const hana = await mk("hana@utoronto.ca", "Hana Kim", "Mechanical Engineering", 4, "Mechanical lead.");
  const ravi = await mk("ravi@utoronto.ca", "Ravi Iyer", "Electrical Engineering", 3);
  const noor = await mk("noor@utoronto.ca", "Noor Ali", "Industrial Engineering", 2, "Outreach lead.");
  const chloe = await mk("chloe@mail.utoronto.ca", "Chloe Martin", "Computer Science", 2);
  const eli = await mk("eli@utoronto.ca", "Eli Brooks", "Political Science", 4, "President, UofT Debate Society.");

  // Applicants
  const aisha = await mk("aisha@mail.utoronto.ca", "Aisha Rahman", "Computer Science", 2);
  const daniel = await mk("daniel@mail.utoronto.ca", "Daniel Okafor", "Mechanical Engineering", 3);
  const meilin = await mk("meilin@mail.utoronto.ca", "Mei-Lin Chen", "Electrical Engineering", 2);
  const jordan = await mk("jordan@mail.utoronto.ca", "Jordan Patel", "Communications & Media", 3);
  const sam = await mk("sam@mail.utoronto.ca", "Sam Osei", "Statistics", 1);
  const leila = await mk("leila@mail.utoronto.ca", "Leila Haddad", "Computer Engineering", 2);
  const omar = await mk("omar@mail.utoronto.ca", "Omar Farouk", "Mechanical Engineering", 2);
  await mk("newstudent@mail.utoronto.ca", "Taylor Nguyen", "Statistics & Computer Science", 1);

  // ── Club: Robotics ─────────────────────────────────────────
  const robotics = await db.club.create({
    data: {
      slug: "utra",
      name: "UofT Robotics Association",
      tagline: "We build rovers, arms and autonomous things — and compete with them.",
      description:
        "UTRA is the University of Toronto's largest student robotics team. Each year we design, build and compete with a Mars rover at the University Rover Challenge, and run a robotics outreach program for Toronto high schools. Members work in subteams that own a real slice of the machine, from cycloidal gearboxes to the perception stack.",
      universityId: uoft.id,
    },
  });

  const [software, mechanical, electrical, outreach] = await Promise.all([
    db.subteam.create({ data: { clubId: robotics.id, name: "Software", description: "Autonomy, perception, teleop, telemetry.", color: "#3B5B7C", order: 0 } }),
    db.subteam.create({ data: { clubId: robotics.id, name: "Mechanical", description: "Chassis, drivetrain, robotic arm, fabrication.", color: "#7C5A3B", order: 1 } }),
    db.subteam.create({ data: { clubId: robotics.id, name: "Electrical", description: "Power, harness, motor control, sensors.", color: "#5F7C3B", order: 2 } }),
    db.subteam.create({ data: { clubId: robotics.id, name: "Outreach", description: "Sponsorship, events, communications.", color: "#7C3B5F", order: 3 } }),
  ]);

  const member = (userId: string, role: "OWNER" | "ADMIN" | "LEAD" | "MEMBER", subteamId?: string, title?: string, joined = 300) =>
    db.membership.create({ data: { userId, clubId: robotics.id, role, subteamId, title, joinedAt: daysAgo(joined) } });

  const mPriya = await member(priya.id, "OWNER", undefined, "President", 700);
  const mMarcus = await member(marcus.id, "LEAD", software.id, "Software Lead", 400);
  const mHana = await member(hana.id, "ADMIN", mechanical.id, "Mechanical Lead", 650);
  const mRavi = await member(ravi.id, "MEMBER", electrical.id, "Power Systems", 200);
  const mNoor = await member(noor.id, "LEAD", outreach.id, "Outreach Lead", 380);
  const mChloe = await member(chloe.id, "MEMBER", software.id, "Perception Developer", 30);

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

  // ── Postings (Robotics) ────────────────────────────────────
  const pSoftware = await db.posting.create({
    data: {
      clubId: robotics.id,
      subteamId: software.id,
      title: "Software Developer — Autonomy",
      description:
        "Join the autonomy team building the perception and navigation stack for our 2027 Mars rover. You'll work in ROS 2 on a Jetson Orin, fusing stereo camera and IMU data to navigate GPS-denied terrain and locate targets. Expect real hardware, real deadlines and a lot of field testing.",
      requirements: [
        "Comfortable in Python or C++",
        "Some exposure to ROS or robotics concepts (course, project or internship)",
        "Able to commit ~8 hours/week including one weekend test session a month",
      ],
      responsibilities: [
        "Own one module of the autonomy stack (e.g. path planning, visual odometry, target detection)",
        "Write tests and simulate in Gazebo before touching the rover",
        "Participate in code review and weekly software syncs",
      ],
      interviewQuestions: [
        "Tell us about a technical project you're proud of. What was hard about it?",
        "How would you approach getting a rover to navigate to a GPS coordinate when GPS drops out halfway?",
        "Describe a time you disagreed with a teammate about a technical decision. What happened?",
        "Why UTRA, and why this role?",
      ],
      openings: 3,
      status: "OPEN",
      closesAt: daysFromNow(14),
      createdAt: daysAgo(20),
    },
  });

  const pMech = await db.posting.create({
    data: {
      clubId: robotics.id,
      subteamId: mechanical.id,
      title: "Mechanical Design Engineer — Drivetrain",
      description:
        "Design and fabricate the rover's six-wheel drivetrain: rocker-bogie suspension, wheel hubs, and motor mounts. You'll take parts from CAD through FEA to the machine shop.",
      requirements: ["SolidWorks or Fusion 360", "Basic statics and mechanics of materials", "Willingness to get machine-shop certified"],
      responsibilities: ["Own a subassembly from concept to fabrication", "Maintain the master assembly and BOM", "Run FEA on load-bearing parts"],
      interviewQuestions: [
        "Walk us through something you've designed and built. What would you change?",
        "A wheel hub keeps cracking at the bolt holes during testing. How do you investigate?",
        "How do you like to work with electrical and software teammates on an integrated part?",
      ],
      openings: 2,
      status: "OPEN",
      closesAt: daysFromNow(10),
      createdAt: daysAgo(18),
    },
  });

  const pElec = await db.posting.create({
    data: {
      clubId: robotics.id,
      subteamId: electrical.id,
      title: "Electrical Engineer — Power Systems",
      description: "Design the rover's 48V power distribution: battery management, DC-DC stages, e-stop, and telemetry.",
      requirements: ["Circuit analysis", "Altium or KiCad", "Soldering"],
      responsibilities: ["Design and layout the PDB", "Bring up boards and write bring-up docs", "Own the harness with Mechanical"],
      interviewQuestions: [
        "Tell us about a board you've designed.",
        "How would you protect the rest of the rover if one motor controller shorts?",
        "Why this role?",
      ],
      openings: 1,
      status: "CLOSED",
      closesAt: daysAgo(5),
      createdAt: daysAgo(40),
    },
  });

  const pOutreach = await db.posting.create({
    data: {
      clubId: robotics.id,
      subteamId: outreach.id,
      title: "Outreach & Sponsorship Coordinator",
      description: "Run sponsor relationships and our high-school Build Night series. You'll keep the team funded and the community excited.",
      requirements: ["Strong written communication", "Comfortable emailing and calling companies", "Organised"],
      responsibilities: ["Maintain the sponsor pipeline", "Plan 4 Build Nights per term", "Run our Instagram and newsletter"],
      interviewQuestions: [
        "Tell us about something you've organised from scratch.",
        "A sponsor goes quiet two weeks before a payment is due. What do you do?",
        "Why UTRA?",
      ],
      openings: 1,
      status: "OPEN",
      closesAt: daysFromNow(30),
      createdAt: daysAgo(12),
    },
  });

  await db.posting.create({
    data: {
      clubId: robotics.id,
      subteamId: electrical.id,
      title: "Firmware Developer — Motor Control",
      description: "Draft: STM32 firmware for the drive and arm motor controllers (FOC, CAN, safety).",
      requirements: ["C", "Microcontrollers"],
      responsibilities: ["Own motor controller firmware"],
      interviewQuestions: ["Tell us about embedded work you've done."],
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
    posting: pSoftware,
    applicant: aisha,
    resumeKey: "software",
    answers: "strong",
    stage: "UNDER_REVIEW",
    ageDays: 6,
    coverNote: "I've followed UTRA's URC runs for two years and want to work on navigation that has to survive real dust and real sun.",
    evaluation: {
      score: 88,
      rec: "STRONG_YES",
      summary:
        "Aisha shows directly relevant experience (ROS 2 line follower, path-planning visualiser) and an unusually mature approach to engineering process: interface-first, vertical slices, written trade-offs. Communication is crisp and concrete. Strong fit for an autonomy module owner.",
      strengths: [
        "Hands-on ROS 2 and OpenCV work on real hardware",
        "Explains technical decisions with concrete numbers and outcomes",
        "Handles disagreement constructively (written comparison of options)",
      ],
      concerns: ["Second-year course load may limit weekend field-test availability", "No direct experience with sensor fusion / state estimation"],
      rubric: [
        { criterion: "Relevant experience", score: 5, note: "ROS 2 + OpenCV on Raspberry Pi, path planning project." },
        { criterion: "Technical / skill depth", score: 4, note: "Solid fundamentals; fusion/estimation is new territory." },
        { criterion: "Communication", score: 5, note: "Structured, specific answers with measurable results." },
        { criterion: "Motivation & fit", score: 4, note: "Clear reasons for wanting hardware deadlines." },
        { criterion: "Collaboration", score: 4, note: "Good conflict example; TA experience." },
      ],
    },
  });

  await apply({
    posting: pMech,
    applicant: daniel,
    resumeKey: "mechanical",
    answers: "strong",
    stage: "UNDER_REVIEW",
    ageDays: 5,
    evaluation: {
      score: 84,
      rec: "STRONG_YES",
      summary:
        "Daniel has already designed and fabricated a 6-DOF arm with custom gearboxes and has professional fixture design experience. Machine-shop certified and used to training others. A natural drivetrain owner.",
      strengths: ["Shop certified on mill, lathe, waterjet", "Real FEA-driven redesign with quantified results", "Trained 30+ students"],
      concerns: ["Answers lean on individual work; wants to see more integration with EE/software"],
      rubric: [
        { criterion: "Relevant experience", score: 5, note: "Arm build, FSAE suspension, Magna fixture." },
        { criterion: "Technical / skill depth", score: 5, note: "CAD + FEA + fabrication." },
        { criterion: "Communication", score: 4, note: "Clear, a little terse." },
        { criterion: "Motivation & fit", score: 4, note: "Wants to own a subassembly." },
        { criterion: "Collaboration", score: 3, note: "Limited cross-discipline examples." },
      ],
    },
  });

  await apply({
    posting: pElec,
    applicant: meilin,
    resumeKey: "electrical",
    answers: "medium",
    stage: "UNDER_REVIEW",
    ageDays: 9,
    evaluation: {
      score: 71,
      rec: "YES",
      summary:
        "Mei-Lin's resume is excellent for the role (FOC motor controller, BMS board, Altium layout) but interview answers were shorter and more generic than the resume suggests. Likely nerves. Worth a follow-up conversation with the electrical lead.",
      strengths: ["Designed a 48V FOC controller and a 12S BMS — exactly the rover's power domain", "Professional board layout and bring-up experience"],
      concerns: ["Interview answers were high-level and did not reference her own projects", "Fit answer was vague"],
      rubric: [
        { criterion: "Relevant experience", score: 5, note: "Power electronics on resume matches the PDB scope." },
        { criterion: "Technical / skill depth", score: 4, note: "Strong on paper; not probed in interview." },
        { criterion: "Communication", score: 3, note: "Short, generic answers." },
        { criterion: "Motivation & fit", score: 3, note: "Generic." },
        { criterion: "Collaboration", score: 3, note: "One reasonable group example." },
      ],
    },
  });

  await apply({
    posting: pOutreach,
    applicant: jordan,
    resumeKey: "outreach",
    answers: "strong",
    stage: "UNDER_REVIEW",
    ageDays: 3,
    evaluation: {
      score: 79,
      rec: "YES",
      summary:
        "Jordan has run sponsor outreach at scale ($45k) and organised a six-workshop outreach series, which maps directly onto the role. Communication is energetic and organised.",
      strengths: ["Grew EngSoc Instagram 3x", "Managed 12 sponsor relationships", "Planned a workshop series for 200+ students"],
      concerns: ["No robotics background; will need onboarding to speak credibly about the rover to sponsors"],
      rubric: [
        { criterion: "Relevant experience", score: 5, note: "Sponsorship + events + social." },
        { criterion: "Technical / skill depth", score: 3, note: "Not a technical role; domain knowledge is thin." },
        { criterion: "Communication", score: 5, note: "Polished." },
        { criterion: "Motivation & fit", score: 4, note: "Genuinely likes outreach." },
        { criterion: "Collaboration", score: 4, note: "Coordinated multi-stakeholder events." },
      ],
    },
  });

  await apply({
    posting: pSoftware,
    applicant: sam,
    resumeKey: "generic",
    answers: "weak",
    stage: "REJECTED",
    ageDays: 12,
    decisionNote: "Encouraged Sam to join Build Nights this term and re-apply in January.",
    evaluation: {
      score: 38,
      rec: "NO",
      summary:
        "Sam is enthusiastic but does not yet have the programming or robotics exposure the posting asks for, and answers were vague. Motivation reads as resume-driven. Recommend redirecting to the outreach workshops and re-applying later.",
      strengths: ["Enthusiastic", "Honest about gaps"],
      concerns: ["No programming beyond beginner Python", "Prefers working alone", "Motivation is external (resume, networking)"],
      rubric: [
        { criterion: "Relevant experience", score: 1, note: "None in robotics or software." },
        { criterion: "Technical / skill depth", score: 1, note: "Beginner." },
        { criterion: "Communication", score: 3, note: "Friendly but unspecific." },
        { criterion: "Motivation & fit", score: 2, note: "Extrinsic." },
        { criterion: "Collaboration", score: 2, note: "Self-described solo worker." },
      ],
    },
  });

  await apply({ posting: pSoftware, applicant: leila, resumeKey: "software", stage: "SUBMITTED", ageDays: 1, coverNote: "Second-year CE, have done the ROS 2 tutorials and a Gazebo sim project." });
  await apply({ posting: pMech, applicant: omar, resumeKey: "mechanical", answers: "medium", stage: "INTERVIEW_COMPLETE", ageDays: 2 });

  // Chloe was accepted last month → she is already a member (created above)
  await apply({
    posting: pSoftware,
    applicant: chloe,
    resumeKey: "software",
    answers: "strong",
    stage: "ACCEPTED",
    ageDays: 34,
    decisionNote: "Accepted as Perception Developer on Software.",
    evaluation: {
      score: 82,
      rec: "STRONG_YES",
      summary: "Strong project portfolio and clear communication. Recommended for perception.",
      strengths: ["OpenCV experience", "Clear communicator"],
      concerns: ["Limited C++"],
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
      clubId: robotics.id,
      name: "Mars Rover 2027",
      summary:
        "Design, build and compete with a six-wheel rover with a 5-DOF arm and GPS-denied autonomy at the University Rover Challenge, June 2027.",
      goals: [
        "Place top 10 at URC 2027",
        "Fully autonomous navigation leg with no manual interventions",
        "Rover mass under 50 kg",
        "Ship a documented, reusable electrical and software platform for 2028",
      ],
      targetDate: new Date("2027-06-03"),
    },
  });

  const [phConcept, phDesign, phBuild, phTest] = await Promise.all([
    db.phase.create({ data: { projectId: project.id, name: "Concept & Requirements", description: "Mission analysis, system requirements, architecture.", order: 0, startDate: new Date("2026-09-08"), endDate: new Date("2026-10-31") } }),
    db.phase.create({ data: { projectId: project.id, name: "Detailed Design", description: "CAD, schematics, software architecture, design reviews.", order: 1, startDate: new Date("2026-11-01"), endDate: new Date("2027-01-31") } }),
    db.phase.create({ data: { projectId: project.id, name: "Build & Integrate", description: "Fabrication, board bring-up, integration.", order: 2, startDate: new Date("2027-02-01"), endDate: new Date("2027-04-30") } }),
    db.phase.create({ data: { projectId: project.id, name: "Test & Compete", description: "Field testing, fixes, competition.", order: 3, startDate: new Date("2027-05-01"), endDate: new Date("2027-06-03") } }),
  ]);

  const ws = async (name: string, phaseId: string, subteamId: string | null, status: "PLANNED" | "ACTIVE" | "BLOCKED" | "DONE", order: number, description: string, dependsOn: string[] = []) =>
    db.workstream.create({ data: { projectId: project.id, phaseId, subteamId, name, status, order, description, dependsOn } });

  const wReq = await ws("Mission analysis & requirements", phConcept.id, mechanical.id, "DONE", 0, "Break down URC 2027 rules into system requirements and a mass/power budget.");
  const wArch = await ws("System architecture", phConcept.id, software.id, "DONE", 1, "Compute, comms, and power architecture; interface control document between subteams.", [wReq.id]);
  const wSponsor = await ws("Sponsorship & funding", phConcept.id, outreach.id, "ACTIVE", 2, "Raise $60k in cash and in-kind sponsorship; maintain sponsor pipeline.");

  const wChassis = await ws("Chassis & suspension design", phDesign.id, mechanical.id, "ACTIVE", 0, "Rocker-bogie suspension, frame, mounting for arm and electronics bay.", [wReq.id, wArch.id]);
  const wArm = await ws("Robotic arm design", phDesign.id, mechanical.id, "ACTIVE", 1, "5-DOF arm with cycloidal joints and quick-change end effectors.", [wReq.id]);
  const wPdb = await ws("Power distribution board", phDesign.id, electrical.id, "ACTIVE", 2, "48V bus, e-stop, per-channel current sensing, CAN telemetry.", [wArch.id]);
  const wAutonomy = await ws("Autonomy: perception & navigation", phDesign.id, software.id, "ACTIVE", 3, "Stereo VO + IMU fusion, costmap, planner, ArUco target detection.", [wArch.id]);

  const wDrive = await ws("Drivetrain fabrication", phBuild.id, mechanical.id, "PLANNED", 0, "Machine hubs and links, assemble suspension, motor mounts.", [wChassis.id]);
  const wHarness = await ws("Harness & electrical integration", phBuild.id, electrical.id, "BLOCKED", 1, "Wire the rover; blocked on final electronics bay dimensions from chassis.", [wPdb.id, wChassis.id]);
  const wTeleop = await ws("Teleop & telemetry dashboard", phBuild.id, software.id, "PLANNED", 2, "Operator station: video, telemetry, arm control, 900 MHz link.", [wAutonomy.id, wPdb.id]);

  const wField = await ws("Field testing campaign", phTest.id, software.id, "PLANNED", 0, "Six weekend test days at the gravel pit; regression checklist per system.", [wDrive.id, wHarness.id, wTeleop.id]);
  const wCompete = await ws("URC 2027 competition", phTest.id, outreach.id, "PLANNED", 1, "Travel logistics, shipping crate, competition run, media.", [wField.id, wSponsor.id]);

  // ── Tasks ──────────────────────────────────────────────────
  type TS = "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
  type TP = "LOW" | "MEDIUM" | "HIGH";
  const orders: Record<TS, number> = { BACKLOG: 0, TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };
  const task = (title: string, status: TS, wsId: string | null, assigneeId: string | null, priority: TP = "MEDIUM", due?: number, description?: string) =>
    db.task.create({
      data: {
        clubId: robotics.id,
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

  await task("Finalise mass budget spreadsheet", "DONE", wReq.id, mHana.id, "HIGH", -20);
  await task("Write ICD v1 between subteams", "DONE", wArch.id, mMarcus.id, "HIGH", -14);
  await task("Choose compute: Jetson Orin NX vs AGX", "DONE", wArch.id, mMarcus.id, "MEDIUM", -10);
  await task("Send Q4 sponsor deck to 30 companies", "DONE", wSponsor.id, mNoor.id, "HIGH", -7);
  await task("Follow up with Magna on in-kind machining", "IN_PROGRESS", wSponsor.id, mNoor.id, "HIGH", 3);
  await task("Rocker-bogie geometry study in MATLAB", "IN_REVIEW", wChassis.id, mHana.id, "HIGH", 2, "Compare 3 pivot positions for obstacle climb vs. stability.");
  await task("Electronics bay envelope drawing", "IN_PROGRESS", wChassis.id, mHana.id, "HIGH", 5, "Electrical is blocked on this — ship even if approximate.");
  await task("Frame FEA with 2x dynamic load", "TODO", wChassis.id, null, "MEDIUM", 12);
  await task("Cycloidal gearbox v3 print & test", "IN_PROGRESS", wArm.id, mHana.id, "MEDIUM", 8);
  await task("End effector quick-change interface", "BACKLOG", wArm.id, null, "LOW");
  await task("PDB schematic review", "IN_REVIEW", wPdb.id, mRavi.id, "HIGH", 1);
  await task("Select current sense amps and shunts", "DONE", wPdb.id, mRavi.id, "MEDIUM", -3);
  await task("PDB layout — 4 layer", "TODO", wPdb.id, mRavi.id, "HIGH", 14);
  await task("Stereo VO evaluation: ORB-SLAM3 vs OpenVINS", "IN_PROGRESS", wAutonomy.id, mChloe.id, "HIGH", 6);
  await task("ArUco detection node with pose output", "IN_PROGRESS", wAutonomy.id, mChloe.id, "MEDIUM", 9);
  await task("Costmap + Nav2 config in simulation", "TODO", wAutonomy.id, mMarcus.id, "HIGH", 16);
  await task("IMU driver and time sync", "TODO", wAutonomy.id, null, "MEDIUM", 18);
  await task("Gazebo world: gravel pit replica", "BACKLOG", wAutonomy.id, null, "LOW");
  await task("Order 6061 stock for hubs", "BACKLOG", wDrive.id, null, "MEDIUM");
  await task("Harness routing plan", "BACKLOG", wHarness.id, mRavi.id, "MEDIUM");
  await task("Telemetry schema (protobuf)", "BACKLOG", wTeleop.id, mMarcus.id, "LOW");
  await task("Book gravel pit test dates", "TODO", wField.id, mPriya.id, "MEDIUM", 25);
  await task("Onboard new software recruits", "TODO", null, mMarcus.id, "MEDIUM", 7, "Set up Jetson dev images and the ROS 2 workspace for the incoming cohort.");

  console.log("Seeded ✓");
  console.log("");
  console.log(`Demo accounts (password for all: "${DEMO_PASSWORD}")`);
  console.log("  priya@utoronto.ca            club owner (UofT Robotics Association)");
  console.log("  marcus@utoronto.ca           software lead");
  console.log("  aisha@mail.utoronto.ca       applicant");
  console.log("  newstudent@mail.utoronto.ca  new student, no clubs");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
