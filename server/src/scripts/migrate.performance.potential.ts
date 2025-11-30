import mongoose from "mongoose";
import { config } from "dotenv";
import { User } from "../user/user.model.js";

config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/hr_app";

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  const users = await User.find({ status: "active" }).select("performanceMetrics highPotential");
  let updated = 0;

  for (const u of users) {
    const perf = u.performanceMetrics?.performanceScore;
    const pot = u.performanceMetrics?.potentialScore;

    if (pot == null) {
      const lvl = (u as any).highPotential?.potentialLevel;
      if (lvl === "critical") (u as any).performanceMetrics = { ...(u as any).performanceMetrics, potentialScore: 5 };
      else if (lvl === "high") (u as any).performanceMetrics = { ...(u as any).performanceMetrics, potentialScore: 4 };
    }

    if (perf == null) {
      const rnd = Math.floor(2 + Math.random() * 4);
      (u as any).performanceMetrics = { ...(u as any).performanceMetrics, performanceScore: rnd };
    }

    if (u.isModified("performanceMetrics")) {
      await u.save();
      updated++;
    }
  }

  console.log(`✅ Updated ${updated} users with performance/potential scores`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌ Migration error:", err);
  process.exit(1);
});
