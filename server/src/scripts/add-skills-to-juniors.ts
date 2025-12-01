import mongoose from "mongoose";
import { config } from "dotenv";
import { User } from "../user/user.model.js";
import { Skill } from "../skills/skills.model.js";

config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "";
if (!MONGO_URI) {
  console.error("Missing MONGO_URI/MONGODB_URI in environment");
  process.exit(1);
}

async function addSkillsToJuniors() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Find or create React skill
    let reactSkill = await Skill.findOne({ name: /^react$/i });
    if (!reactSkill) {
      reactSkill = new Skill({
        name: "React",
        description: "Frontend JavaScript library for building user interfaces",
        category: "technical",
      });
      await reactSkill.save();
      console.log("✅ Created React skill");
    }

    // Find or create JavaScript skill
    let jsSkill = await Skill.findOne({ name: /^javascript$/i });
    if (!jsSkill) {
      jsSkill = new Skill({
        name: "JavaScript",
        description: "Programming language for web development",
        category: "technical",
      });
      await jsSkill.save();
      console.log("✅ Created JavaScript skill");
    }

    // Find or create TypeScript skill
    let tsSkill = await Skill.findOne({ name: /^typescript$/i });
    if (!tsSkill) {
      tsSkill = new Skill({
        name: "TypeScript",
        description: "Typed superset of JavaScript",
        category: "technical",
      });
      await tsSkill.save();
      console.log("✅ Created TypeScript skill");
    }

    // Find Junior React Developers
    const juniors = await User.find({
      status: "active",
      "jobInfo.jobTitle": "Junior React Developer",
    }).select("personalInfo jobInfo skills");

    console.log(`\n📊 Found ${juniors.length} Junior React Developers`);

    for (const junior of juniors) {
      const existingSkillIds = junior.skills.map((s) => s.skillId.toString());
      const updates: any[] = [];

      // Add React skill (level 2 - Intermediate)
      if (!existingSkillIds.includes(reactSkill._id.toString())) {
        updates.push({
          skillId: reactSkill._id,
          currentLevel: 2,
          yearsOfExperience: 1,
          lastAssessmentDate: new Date(),
        });
      }

      // Add JavaScript skill (level 2 - Intermediate)
      if (!existingSkillIds.includes(jsSkill._id.toString())) {
        updates.push({
          skillId: jsSkill._id,
          currentLevel: 2,
          yearsOfExperience: 1.5,
          lastAssessmentDate: new Date(),
        });
      }

      // Add TypeScript skill (level 2 - Intermediate)
      if (!existingSkillIds.includes(tsSkill._id.toString())) {
        updates.push({
          skillId: tsSkill._id,
          currentLevel: 2,
          yearsOfExperience: 1,
          lastAssessmentDate: new Date(),
        });
      }

      if (updates.length > 0) {
        junior.skills.push(...updates);
        await junior.save();
        console.log(
          `✅ Added ${updates.length} skills to ${junior.personalInfo.firstName} ${junior.personalInfo.lastName}`
        );
      } else {
        console.log(
          `ℹ️  ${junior.personalInfo.firstName} ${junior.personalInfo.lastName} already has all skills`
        );
      }
    }

    // Also add skills to Middle and Senior React Developers
    const middleSeniors = await User.find({
      status: "active",
      "jobInfo.jobTitle": { $in: ["Middle React Developer", "Senior React Developer"] },
    }).select("personalInfo jobInfo skills");

    console.log(`\n📊 Found ${middleSeniors.length} Middle/Senior React Developers`);

    for (const dev of middleSeniors) {
      const isSenior = dev.jobInfo.jobTitle === "Senior React Developer";
      const existingSkillIds = dev.skills.map((s) => s.skillId.toString());
      const updates: any[] = [];

      const reactLevel = isSenior ? 4 : 3;
      const jsLevel = isSenior ? 4 : 3;
      const tsLevel = isSenior ? 4 : 3;
      const years = isSenior ? 5 : 3;

      if (!existingSkillIds.includes(reactSkill._id.toString())) {
        updates.push({
          skillId: reactSkill._id,
          currentLevel: reactLevel,
          yearsOfExperience: years,
          lastAssessmentDate: new Date(),
        });
      }

      if (!existingSkillIds.includes(jsSkill._id.toString())) {
        updates.push({
          skillId: jsSkill._id,
          currentLevel: jsLevel,
          yearsOfExperience: years + 1,
          lastAssessmentDate: new Date(),
        });
      }

      if (!existingSkillIds.includes(tsSkill._id.toString())) {
        updates.push({
          skillId: tsSkill._id,
          currentLevel: tsLevel,
          yearsOfExperience: years,
          lastAssessmentDate: new Date(),
        });
      }

      if (updates.length > 0) {
        dev.skills.push(...updates);
        await dev.save();
        console.log(
          `✅ Added ${updates.length} skills to ${dev.personalInfo.firstName} ${dev.personalInfo.lastName} (${dev.jobInfo.jobTitle})`
        );
      }
    }

    console.log("\n🏁 Skills added successfully!");
    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error adding skills:", error);
    process.exit(1);
  }
}

addSkillsToJuniors();
