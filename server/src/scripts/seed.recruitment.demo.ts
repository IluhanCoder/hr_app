import mongoose from "mongoose";
import { config } from "dotenv";
import { Candidate, RecruitmentStage, CandidateStatus } from "../recruitment/recruitment.model.js";

config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/hr_app";

const jobProfileId = new mongoose.Types.ObjectId("692708fb6d3da177a0da8ef0");
const hrManagerId = new mongoose.Types.ObjectId("69243abe99301a0ec67cea2e");

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB (seed)");

  const now = new Date();

  const candidates = [
    {
      firstName: "Олег",
      lastName: "Коваленко",
      email: "oleg.kovalenko+jr.react@example.com",
      phone: "+380501112233",
      jobProfileId,
      department: "Програмісти",
      skills: [],
      currentStage: RecruitmentStage.TECHNICAL_INTERVIEW,
      status: CandidateStatus.ACTIVE,
      interviews: [
        {
          scheduledAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          interviewers: [hrManagerId],
          notes: "Початковий технічний скринінг",
          status: "completed",
          feedback: [
            {
              from: hrManagerId,
              rating: 4,
              comment:
                "Гарні базові знання React, добре володіє hooks. Потрібно підтягнути тестування та типізацію TypeScript.",
              recommendation: "yes",
              createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
            },
          ],
        },
        {
          scheduledAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
          interviewers: [hrManagerId],
          notes: "HR інтерв'ю",
          status: "completed",
          feedback: [
            {
              from: hrManagerId,
              rating: 5,
              comment:
                "Мотивований, адекватні очікування щодо зарплати, гарна комунікація. Рекомендуємо до фінального інтерв'ю.",
              recommendation: "strong_yes",
              createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
            },
          ],
        },
      ],
      stageHistory: [
        { stage: RecruitmentStage.SCREENING, movedBy: hrManagerId, movedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000) },
        { stage: RecruitmentStage.TECHNICAL_INTERVIEW, movedBy: hrManagerId, movedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
        { stage: RecruitmentStage.HR_INTERVIEW, movedBy: hrManagerId, movedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
      ],
      source: "LinkedIn",
      appliedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      createdBy: hrManagerId,
      assignedTo: hrManagerId,
    },
    {
      firstName: "Марія",
      lastName: "Сидоренко",
      email: "maria.sydorenko+jr.react@example.com",
      phone: "+380671234567",
      jobProfileId,
      department: "Програмісти",
      skills: [],
      currentStage: RecruitmentStage.SCREENING,
      status: CandidateStatus.ACTIVE,
      interviews: [
        {
          scheduledAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          interviewers: [hrManagerId],
          notes: "Первинний скринінг",
          status: "completed",
          feedback: [
            {
              from: hrManagerId,
              rating: 3,
              comment:
                "Базове розуміння React та TypeScript. Є прогалини у знаннях тестування та оптимізації рендерингу.",
              recommendation: "maybe",
              createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
            },
          ],
        },
      ],
      stageHistory: [
        { stage: RecruitmentStage.APPLICATION, movedBy: hrManagerId, movedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000) },
        { stage: RecruitmentStage.SCREENING, movedBy: hrManagerId, movedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
      ],
      source: "Referral",
      appliedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      createdBy: hrManagerId,
      assignedTo: hrManagerId,
    },
    {
      firstName: "Анна",
      lastName: "Мельник",
      email: "anna.melnyk+jr.react@example.com",
      phone: "+380931234567",
      jobProfileId,
      department: "Програмісти",
      skills: [],
      currentStage: RecruitmentStage.SCREENING,
      status: CandidateStatus.ACTIVE,
      interviews: [],
      stageHistory: [
        { stage: RecruitmentStage.APPLICATION, movedBy: hrManagerId, movedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000) },
        { stage: RecruitmentStage.SCREENING, movedBy: hrManagerId, movedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      ],
      source: "Job Board",
      appliedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      createdBy: hrManagerId,
      assignedTo: hrManagerId,
    },
    {
      firstName: "Сергій",
      lastName: "Ткаченко",
      email: "sergiy.tkachenko+jr.react@example.com",
      phone: "+380951112233",
      jobProfileId,
      department: "Програмісти",
      skills: [],
      currentStage: RecruitmentStage.APPLICATION,
      status: CandidateStatus.ACTIVE,
      interviews: [],
      stageHistory: [
        { stage: RecruitmentStage.APPLICATION, movedBy: hrManagerId, movedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
      ],
      source: "LinkedIn",
      appliedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      createdBy: hrManagerId,
      assignedTo: hrManagerId,
    },
    {
      firstName: "Віктор",
      lastName: "Шевченко",
      email: "viktor.shevchenko+jr.react@example.com",
      phone: "+380971234567",
      jobProfileId,
      department: "Програмісти",
      skills: [],
      currentStage: RecruitmentStage.APPLICATION,
      status: CandidateStatus.ACTIVE,
      interviews: [],
      stageHistory: [
        { stage: RecruitmentStage.APPLICATION, movedBy: hrManagerId, movedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000) },
      ],
      source: "Referral",
      appliedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
      createdBy: hrManagerId,
      assignedTo: hrManagerId,
    },
  ];

  for (const c of candidates) {
    const existing = await Candidate.findOne({ email: c.email });
    if (existing) {
      console.log(`➡️  Skip existing candidate: ${c.email}`);
      continue;
    }
    const created = await Candidate.create(c as any);
    console.log(`✅ Created candidate ${created.firstName} ${created.lastName} (${created.email})`);
  }

  await mongoose.disconnect();
  console.log("🏁 Seed finished");
}

run().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
