

import type { Response } from "express";
import type { AuthRequest } from "../auth/auth.types.js";
import { User } from "../user/user.model.js";
import { seedSkillsData } from "./seedSkills.js";


export const migrateSalaryInfo = async (req: AuthRequest, res: Response) => {
  try {

    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Тільки адміністратори можуть запускати міграції",
      });
    }

    const usersWithoutSalary = await User.find({
      $or: [
        { salaryInfo: { $exists: false } },
        { salaryInfo: null },
      ],
    });

    console.log(`📊 Знайдено ${usersWithoutSalary.length} користувачів без salaryInfo`);

    if (usersWithoutSalary.length === 0) {
      return res.json({
        success: true,
        message: "Всі користувачі вже мають salaryInfo",
        data: { updated: 0 },
      });
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
    const updatedUsers: any[] = [];

    for (const user of usersWithoutSalary) {
      const jobTitle = user.jobInfo.jobTitle;
      const baseSalary = defaultSalaries[jobTitle] || defaultSalaries["default"];

      user.salaryInfo = {
        baseSalary: baseSalary!,
        currency: "UAH",
        bonuses: 0,
      };

      await user.save();
      updated++;

      updatedUsers.push({
        name: `${user.personalInfo.firstName} ${user.personalInfo.lastName}`,
        jobTitle,
        salary: baseSalary,
      });

      console.log(
        `✓ Оновлено ${user.personalInfo.firstName} ${user.personalInfo.lastName} - ${jobTitle}: ${baseSalary} UAH`
      );
    }

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

    res.json({
      success: true,
      message: `Успішно оновлено ${updated} користувачів`,
      data: {
        updated,
        updatedUsers,
        stats,
      },
    });
  } catch (error) {
    console.error("❌ Помилка міграції:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при міграції",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const seedSkills = async (req: AuthRequest, res: Response) => {
  try {

    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Тільки адміністратори можуть запускати seed",
      });
    }

    await seedSkillsData();

    res.status(200).json({
      success: true,
      message: "Початкові дані для Skills успішно створено",
    });
  } catch (error) {
    console.error("❌ Помилка seed:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при створенні початкових даних",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
