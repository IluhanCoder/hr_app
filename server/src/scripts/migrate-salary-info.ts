

import mongoose from "mongoose";
import { User } from "../user/user.model.js";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/hr_management";

async function migrateSalaryInfo() {
  try {
    console.log("🚀 Підключення до MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Підключено до MongoDB");

    const usersWithoutSalary = await User.find({
      $or: [
        { salaryInfo: { $exists: false } },
        { salaryInfo: null },
      ],
    });

    console.log(`📊 Знайдено ${usersWithoutSalary.length} користувачів без salaryInfo`);

    if (usersWithoutSalary.length === 0) {
      console.log("✅ Всі користувачі вже мають salaryInfo");
      process.exit(0);
    }

    const defaultSalaries: Record<string, number> = {

      "Software Engineer": 45000,
      "Senior Software Engineer": 65000,
      "Tech Lead": 80000,
      "DevOps Engineer": 55000,
      "QA Engineer": 40000,

      "HR Manager": 50000,
      "HR Specialist": 35000,
      "Recruiter": 38000,

      "Financial Analyst": 48000,
      "Accountant": 42000,
      "CFO": 95000,

      "CEO": 120000,
      "CTO": 110000,
      "Department Manager": 70000,
      "Team Lead": 60000,

      "default": 35000,
    };

    let updated = 0;

    for (const user of usersWithoutSalary) {
      const jobTitle = user.jobInfo.jobTitle;
      const baseSalary = defaultSalaries[jobTitle] || defaultSalaries["default"] || 35000;

      user.salaryInfo = {
        baseSalary,
        currency: "UAH",
        bonuses: 0,
      };

      await user.save();
      updated++;

      console.log(
        `✓ Оновлено ${user.personalInfo.firstName} ${user.personalInfo.lastName} - ${jobTitle}: ${baseSalary} UAH`
      );
    }

    console.log(`\n✅ Успішно оновлено ${updated} користувачів`);
    console.log("📊 Статистика:");

    const stats = await User.aggregate([
      {
        $match: {
          "salaryInfo.baseSalary": { $exists: true },
        },
      },
      {
        $group: {
          _id: "$jobInfo.department",
          avgSalary: { $avg: "$salaryInfo.baseSalary" },
          minSalary: { $min: "$salaryInfo.baseSalary" },
          maxSalary: { $max: "$salaryInfo.baseSalary" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { avgSalary: -1 },
      },
    ]);

    console.log("\nСтатистика по відділах:");
    stats.forEach((stat) => {
      console.log(
        `${stat._id}: Середня: ${stat.avgSalary.toFixed(0)} UAH, Мін: ${stat.minSalary}, Макс: ${stat.maxSalary}, Кількість: ${stat.count}`
      );
    });

  } catch (error) {
    console.error("❌ Помилка міграції:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 З'єднання з MongoDB закрито");
    process.exit(0);
  }
}

migrateSalaryInfo();
