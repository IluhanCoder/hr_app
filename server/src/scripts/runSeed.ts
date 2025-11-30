import mongoose from "mongoose";
import dotenv from "dotenv";
import { seedSkillsData } from "./seedSkills.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/hr_app";

async function runSeed() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    await seedSkillsData();

    console.log("✅ Seed completed successfully!");
  } catch (error) {
    console.error("❌ Error running seed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
    process.exit(0);
  }
}

runSeed();
