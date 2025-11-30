import mongoose from "mongoose";
import { config } from "dotenv";
import { User } from "../user/user.model.js";

config();

const MONGODB_URI = process.env.MONGODB_URI!;

const assignments: { email: string; education: string }[] = [
  { email: "dev.junior1@example.com", education: "Computer Science" },
  { email: "dev.junior2@example.com", education: "Computer Science" },
  { email: "dev.junior3@example.com", education: "Applied Mathematics" },
  { email: "dev.junior4@example.com", education: "Software Engineering" },
  { email: "dev.junior5@example.com", education: "Software Engineering" },
  { email: "dev.junior6@example.com", education: "Information Systems" },
  { email: "dev.junior7@example.com", education: "Cybersecurity" },
  { email: "dev.junior8@example.com", education: "Data Science" },
  { email: "dev.junior9@example.com", education: "Computer Engineering" },
  { email: "dev.junior10@example.com", education: "Artificial Intelligence" },
];

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected (update education)");

  for (const a of assignments) {
    const res = await User.updateOne(
      { email: a.email },
      { $set: { "personalInfo.education": a.education } }
    );
    console.log(`📘 ${a.email} -> ${a.education} (matched=${res.matchedCount} modified=${res.modifiedCount})`);
  }

  const after = await User.find({ email: { $in: assignments.map(a => a.email) } }).select("personalInfo.firstName personalInfo.lastName personalInfo.email personalInfo.education");
  console.table(after.map(u => ({
    email: (u as any).personalInfo.email,
    name: `${(u as any).personalInfo.firstName} ${(u as any).personalInfo.lastName}`,
    education: (u as any).personalInfo.education || "-"
  })));

  await mongoose.disconnect();
  console.log("🏁 Education update finished");
}

run().catch(err => { console.error("❌ Error updating education", err); process.exit(1); });
