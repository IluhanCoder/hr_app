import mongoose from "mongoose";
import { config } from "dotenv";
import { User } from "../user/user.model.js";

config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/hr_app";

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  const updates = [
    { email: "dev.junior1@example.com", gender: "male", educationLevel: "bachelor" },
    { email: "dev.junior2@example.com", gender: "female", educationLevel: "bachelor" },
    { email: "dev.junior3@example.com", gender: "female", educationLevel: "master" },
    { email: "dev.junior4@example.com", gender: "male", educationLevel: "bachelor" },
    { email: "dev.junior5@example.com", gender: "male", educationLevel: "master" },
  ];

  for (const update of updates) {
    const result = await User.updateOne(
      { email: update.email },
      {
        $set: {
          "personalInfo.gender": update.gender,
          "jobInfo.educationLevel": update.educationLevel,
        },
      }
    );
    console.log(`✅ Updated ${update.email}: matched=${result.matchedCount} modified=${result.modifiedCount}`);
  }

  await mongoose.disconnect();
  console.log("🏁 Update finished");
}

run().catch((err) => {
  console.error("❌ Update error:", err);
  process.exit(1);
});
