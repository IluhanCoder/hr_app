import mongoose from "mongoose";
import { config } from "dotenv";
import { Candidate, RecruitmentStage, CandidateStatus } from "../recruitment/recruitment.model.js";

config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/hr_app";

const hrManagerId = new mongoose.Types.ObjectId("69243abe99301a0ec67cea2e");

async function upsertCandidateProgress(email: string) {
  const c = await Candidate.findOne({ email });
  if (!c) {
    console.log(`⚠️  Candidate not found: ${email}`);
    return;
  }

  const now = new Date();
  const days = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

  const targetStages = [
    RecruitmentStage.APPLICATION,
    RecruitmentStage.SCREENING,
    RecruitmentStage.TECHNICAL_INTERVIEW,
    RecruitmentStage.HR_INTERVIEW,
    RecruitmentStage.FINAL_INTERVIEW,
    RecruitmentStage.OFFER,
    RecruitmentStage.HIRED,
  ];

  const existingStages = new Set(c.stageHistory?.map(s => s.stage) || []);
  const addHistory = targetStages
    .filter(s => !existingStages.has(s))
    .map((stage, idx) => ({ stage, movedBy: hrManagerId, movedAt: days(10 - idx), notes: `Auto stage ${stage}` }));

  const interviews = c.interviews || [];
  const pushInterviews: any[] = [];

  const ensureInterview = (notes: string, rating: number, recommendation: any, comment: string, when: Date) => ({
    scheduledAt: when,
    interviewers: [hrManagerId],
    notes,
    status: "completed",
    feedback: [
      {
        from: hrManagerId,
        rating,
        comment,
        recommendation,
        createdAt: when,
      },
    ],
  });

  const hasNote = (n: string) => (interviews as any[]).some(iv => (iv.notes || "").includes(n));
  if (!hasNote("Технічне інтерв'ю")) {
    pushInterviews.push(
      ensureInterview(
        "Технічне інтерв'ю з live-coding",
        4,
        "yes",
        "Добре володіє React hooks, базові знання TypeScript. Потрібно покращити тестування.",
        days(7)
      )
    );
  }
  if (!hasNote("HR інтерв'ю")) {
    pushInterviews.push(
      ensureInterview(
        "HR інтерв'ю",
        5,
        "strong_yes",
        "Висока мотивація, культурний фіт, чіткі очікування.",
        days(5)
      )
    );
  }
  if (!hasNote("Фінальне інтерв'ю")) {
    pushInterviews.push(
      ensureInterview(
        "Фінальне інтерв'ю з менеджером",
        5,
        "strong_yes",
        "Сильні комунікації, впевнене розуміння основ React та життєвого циклу.",
        days(3)
      )
    );
  }

  const offer = {
    position: "Junior React Developer",
    salary: 35000,
    currency: "UAH",
    startDate: days(-3),
    benefits: ["Медстрахування", "Гнучкий графік"],
    generatedBy: hrManagerId,
    generatedAt: days(2),
    sentAt: days(2),
    acceptedAt: days(1),
    status: "accepted" as const,
  };

  c.stageHistory = [...(c.stageHistory || []), ...addHistory].sort(
    (a: any, b: any) => a.movedAt.getTime() - b.movedAt.getTime()
  );
  c.interviews = [...interviews, ...pushInterviews];
  c.offer = offer as any;
  c.currentStage = RecruitmentStage.HIRED;
  c.status = CandidateStatus.HIRED;

  await c.save();
  console.log(`✅ Enriched candidate ${email} → HIRED`);
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB (enrich)");

  const emails = [
    "oleg.kovalenko+jr.react@example.com",
    "maria.sydorenko+jr.react@example.com",
    "anna.melnyk+jr.react@example.com",
    "sergiy.tkachenko+jr.react@example.com",
    "viktor.shevchenko+jr.react@example.com",
  ];

  for (const email of emails) {
    await upsertCandidateProgress(email);
  }

  await mongoose.disconnect();
  console.log("🏁 Enrich finished");
}

run().catch((err) => { console.error("❌ Enrich error:", err); process.exit(1); });
