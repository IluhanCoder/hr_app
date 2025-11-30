

import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../user/user.model.js";
import { Gender, EducationLevel } from "../../../shared/types/user.types.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/hr_app";

async function migrateDemographics() {
  try {
    console.log("🔄 Підключення до MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Підключено до MongoDB");

    const usersWithoutDemographics = await User.find({
      $or: [
        { "personalInfo.gender": { $exists: false } },
        { "personalInfo.ethnicity": { $exists: false } },
        { "personalInfo.educationLevel": { $exists: false } },
      ],
    });

    console.log(
      `📊 Знайдено ${usersWithoutDemographics.length} користувачів без повних демографічних даних`
    );

    if (usersWithoutDemographics.length === 0) {
      console.log("✅ Всі користувачі вже мають демографічні дані");
      return;
    }


    const genders = Object.values(Gender);
    const educationLevels = Object.values(EducationLevel);
    const ethnicities = ["Українець", "Українка", "Інше"];

    let updated = 0;

    for (const user of usersWithoutDemographics) {

      if (!user.personalInfo.gender) {
        const randomGender = genders[Math.floor(Math.random() * genders.length)];
        (user.personalInfo as any).gender = randomGender;
      }

      if (!user.personalInfo.ethnicity) {
        const randomEthnicity = ethnicities[Math.floor(Math.random() * ethnicities.length)];
        (user.personalInfo as any).ethnicity = randomEthnicity;
      }

      if (!user.personalInfo.educationLevel) {

        const jobTitle = user.jobInfo.jobTitle.toLowerCase();
        let randomEducation: EducationLevel | undefined;
        if (jobTitle.includes("senior") || jobTitle.includes("lead") || jobTitle.includes("manager")) {
          randomEducation = Math.random() > 0.5 ? EducationLevel.MASTER : EducationLevel.BACHELOR;
        } else if (jobTitle.includes("junior") || jobTitle.includes("intern")) {
          randomEducation = EducationLevel.BACHELOR;
        } else {
          randomEducation = educationLevels[Math.floor(Math.random() * educationLevels.length)];
        }
        if (randomEducation) {
          (user.personalInfo as any).educationLevel = randomEducation;
        }
      }

      await user.save();
      updated++;
      console.log(
        `✓ Оновлено ${user.personalInfo.firstName} ${user.personalInfo.lastName} - ${user.personalInfo.gender}, ${user.personalInfo.educationLevel}`
      );
    }

    console.log(`\n✅ Міграція завершена! Оновлено ${updated} користувачів.`);

    console.log("\n📊 Статистика після міграції:");

    const genderStats = await User.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: "$personalInfo.gender",
          count: { $sum: 1 },
          avgSalary: { $avg: "$salaryInfo.baseSalary" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    console.log("\n👥 По статі:");
    genderStats.forEach((stat) => {
      console.log(
        `  ${stat._id || "Не вказано"}: ${stat.count} осіб, середня ЗП: ${stat.avgSalary ? stat.avgSalary.toFixed(0) : "N/A"} UAH`
      );
    });

    const educationStats = await User.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: "$personalInfo.educationLevel",
          count: { $sum: 1 },
          avgSalary: { $avg: "$salaryInfo.baseSalary" },
        },
      },
      { $sort: { avgSalary: -1 } },
    ]);

    console.log("\n🎓 По освіті:");
    educationStats.forEach((stat) => {
      console.log(
        `  ${stat._id || "Не вказано"}: ${stat.count} осіб, середня ЗП: ${stat.avgSalary ? stat.avgSalary.toFixed(0) : "N/A"} UAH`
      );
    });

  } catch (error) {
    console.error("❌ Помилка при міграції:", error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log("\n👋 З'єднання закрито");
  }
}

migrateDemographics()
  .then(() => {
    console.log("✨ Міграція успішно виконана");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Міграція провалилась:", error);
    process.exit(1);
  });
