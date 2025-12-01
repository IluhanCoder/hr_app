import mongoose from "mongoose";
import { config } from "dotenv";
import { User } from "../user/user.model.js";

config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "";
if (!MONGO_URI) {
  console.error("Missing MONGO_URI/MONGODB_URI in environment");
  process.exit(1);
}

// Normalize all React/Web Developer variants to a canonical title
const titleMappings: Record<string, string> = {
  // Junior variants
  "junior developer": "Junior React Developer",
  "junior web developer": "Junior React Developer",
  "junior react developer": "Junior React Developer",
  "junior react dev": "Junior React Developer",
  "react junior developer": "Junior React Developer",
  "web developer junior": "Junior React Developer",
  
  // Middle variants
  "middle developer": "Middle React Developer",
  "middle web developer": "Middle React Developer",
  "middle react developer": "Middle React Developer",
  "react middle developer": "Middle React Developer",
  
  // Senior variants
  "senior developer": "Senior React Developer",
  "senior web developer": "Senior React Developer",
  "senior react developer": "Senior React Developer",
  "react senior developer": "Senior React Developer",
  
  // QA and other IT roles
  "qa engineer": "QA Engineer",
  "devops engineer": "DevOps Engineer",
};

async function normalizeJobTitles() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Get all active users
    const users = await User.find({ status: "active" }).select("_id personalInfo jobInfo");
    console.log(`📊 Found ${users.length} active users`);

    // Group by current job title
    const titleCounts: Record<string, number> = {};
    users.forEach((u) => {
      const title = u.jobInfo.jobTitle?.toLowerCase() || "(empty)";
      titleCounts[title] = (titleCounts[title] || 0) + 1;
    });

    console.log("\n📋 Current job titles in database:");
    Object.entries(titleCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([title, count]) => {
        console.log(`  - ${title}: ${count}`);
      });

    let updatedCount = 0;
    const updates: Array<{ oldTitle: string; newTitle: string; count: number }> = [];

    for (const [oldPattern, newTitle] of Object.entries(titleMappings)) {
      const result = await User.updateMany(
        {
          status: "active",
          "jobInfo.jobTitle": new RegExp(`^${oldPattern}$`, "i"),
        },
        {
          $set: { "jobInfo.jobTitle": newTitle },
        }
      );

      if (result.modifiedCount > 0) {
        updatedCount += result.modifiedCount;
        updates.push({ oldTitle: oldPattern, newTitle, count: result.modifiedCount });
        console.log(`✅ Normalized "${oldPattern}" → "${newTitle}" (${result.modifiedCount} users)`);
      }
    }

    console.log(`\n✅ Total users updated: ${updatedCount}`);

    // Show final counts
    const usersAfter = await User.find({ status: "active" }).select("jobInfo");
    const finalCounts: Record<string, number> = {};
    usersAfter.forEach((u) => {
      const title = u.jobInfo.jobTitle || "(empty)";
      finalCounts[title] = (finalCounts[title] || 0) + 1;
    });

    console.log("\n📊 Job titles after normalization:");
    Object.entries(finalCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([title, count]) => {
        console.log(`  - ${title}: ${count}`);
      });

    await mongoose.disconnect();
    console.log("\n🏁 Normalization complete!");
  } catch (error) {
    console.error("❌ Error normalizing job titles:", error);
    process.exit(1);
  }
}

normalizeJobTitles();
