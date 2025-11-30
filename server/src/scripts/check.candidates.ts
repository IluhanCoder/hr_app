import mongoose from "mongoose";
import { config } from "dotenv";
import { Candidate } from "../recruitment/recruitment.model.js";

config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/hr_app";

async function run() {
  await mongoose.connect(MONGODB_URI);
  const count = await Candidate.countDocuments({ department: "Програмісти" });
  const latest = await Candidate.find({ department: "Програмісти" })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();
  console.log("Candidates count (Програмісти):", count);
  console.log(latest.map(c => ({ email: c.email, name: c.firstName + " " + c.lastName, stage: c.currentStage })));
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
