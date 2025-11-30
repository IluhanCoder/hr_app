import mongoose from "mongoose";
import { config } from "dotenv";
import bcrypt from "bcrypt";
import { User } from "../user/user.model.js";
import { TimeEntry, TimeEntryStatus, TimeEntryType } from "../time/timeEntry.model.js";

config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "";
if (!MONGO_URI) {
  console.error("Missing MONGO_URI/MONGODB_URI in environment");
  process.exit(1);
}

const departments = [
  { name: "it", jobTitles: ["Junior Developer", "Middle Developer", "Senior Developer", "QA Engineer", "DevOps Engineer"] },
  { name: "sales", jobTitles: ["Sales Representative", "Account Executive", "Sales Analyst", "BD Manager"] },
  { name: "hr", jobTitles: ["HR Specialist", "Recruiter", "HR Analyst", "L&D Specialist"] },
];

const genders = ["male", "female"];
const ethnicities = ["eastern_european", "asian", "latino", "african", "white"];
const educationLevels = ["bachelor", "master", "phd"];

const randomItem = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const randomInRange = (min: number, max: number) => Math.round((Math.random() * (max - min) + min) * 100) / 100;

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  await Promise.all([
    User.deleteMany({}),
    TimeEntry.deleteMany({}),
  ]);
  console.log("Cleared users & time entries");

  const passwordHash = await bcrypt.hash("123456", 10);
  const users: any[] = [];

  let userCounter = 1;

  for (const dept of departments) {

    const managerEmail = `manager.${dept.name}@example.com`;
    const manager = new User({
      email: managerEmail,
      passwordHash,
      personalInfo: {
        firstName: dept.name === "it" ? "Ілля" : dept.name === "sales" ? "Оксана" : "Марія",
        lastName: dept.name === "it" ? "Петрович" : dept.name === "sales" ? "Коваль" : "Шевченко",
        gender: randomItem(genders),
        ethnicity: randomItem(ethnicities),
        educationLevel: randomItem(educationLevels),
        email: managerEmail,
        dateOfBirth: new Date(1985 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      },
      role: "line_manager",
      jobInfo: {
        department: dept.name,
        jobTitle: "Line Manager",
        employmentType: "full_time",
        hireDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      },
      salaryInfo: {
        baseSalary: 42000 + Math.floor(Math.random() * 8000),
        currency: "UAH",
      },
      leaveBalance: {},
      performanceMetrics: {
        performanceScore: randomInRange(3, 5),
        potentialScore: randomInRange(3, 5),
      },
      highPotential: {
        isHighPotential: true,
        potentialLevel: randomItem(["high", "critical"]),
      },
      compensation: {
        hourlyRate: randomInRange(180, 260),
        overtimeMultiplier: 1.5,
        holidayMultiplier: 2,
        taxProfile: { pitRate: 0.18, sscRate: 0.221, militaryRate: 0.015 },
        bonusPolicy: { fixedMonthlyBonus: 0, performanceBonusPercent: randomInRange(0, 10) },
        schedule: { dailyHours: 8 },
      },
      status: "active",
      skills: [],
    });
    users.push(manager);

    for (let i = 0; i < 9; i++) {
      const jobTitle = randomItem(dept.jobTitles);
      const employeeEmail = `${dept.name}.employee${userCounter}@example.com`;
      const hireDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      const u = new User({
        email: employeeEmail,
        passwordHash,
        personalInfo: {
          firstName: dept.name === "it" ? `Dev${userCounter}` : dept.name === "sales" ? `Sales${userCounter}` : `HR${userCounter}`,
          lastName: dept.name === "it" ? "Іваненко" : dept.name === "sales" ? "Сидоренко" : "Гриценко",
          gender: randomItem(genders),
          ethnicity: randomItem(ethnicities),
          educationLevel: randomItem(educationLevels),
          email: employeeEmail,
          dateOfBirth: new Date(1990 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        },
        role: dept.name === "hr" ? randomItem(["hr_manager", "employee", "hr_analyst"]) : "employee",
        jobInfo: {
          department: dept.name,
          jobTitle,
          employmentType: "full_time",
          hireDate,
          lineManagerId: manager._id,
        },
        salaryInfo: {
          baseSalary: 30000 + Math.floor(Math.random() * 15000),
          currency: "UAH",
        },
        leaveBalance: {},
        performanceMetrics: {
          performanceScore: randomInRange(2, 5),
          potentialScore: randomInRange(2, 5),
        },
        highPotential: {
          isHighPotential: Math.random() < 0.2,
          potentialLevel: Math.random() < 0.1 ? "critical" : "high",
        },
        compensation: {
          hourlyRate: randomInRange(150, 240),
          overtimeMultiplier: 1.5,
          holidayMultiplier: 2,
          taxProfile: { pitRate: 0.18, sscRate: 0.221, militaryRate: 0.015 },
          bonusPolicy: { fixedMonthlyBonus: Math.random() < 0.2 ? 2000 : 0, performanceBonusPercent: randomInRange(0, 5) },
          schedule: { dailyHours: 8 },
        },
        status: "active",
        skills: [],
      });
      users.push(u);
      userCounter++;
    }
  }

  await User.insertMany(users);
  console.log(`Inserted users: ${users.length}`);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const timeEntries: any[] = [];
  for (const u of users) {
    for (let d = 1; d <= 10; d++) {
      const date = new Date(year, month, d, 9, 0, 0, 0);
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      const end = new Date(year, month, d, 18, 0, 0, 0);
      timeEntries.push(new TimeEntry({
        userId: u._id,
        date,
        start: date,
        end,
        breakMinutes: 60,
        type: TimeEntryType.REGULAR,
        status: TimeEntryStatus.APPROVED,
        approvedBy: u.managementInfo?.managerId || null,
        approvedAt: new Date(),
      }));

      if (Math.random() < 0.15) {
        const otEnd = new Date(year, month, d, 20, 30, 0, 0);
        timeEntries.push(new TimeEntry({
          userId: u._id,
          date,
          start: new Date(year, month, d, 18, 15, 0, 0),
          end: otEnd,
          breakMinutes: 0,
          type: TimeEntryType.OVERTIME,
          status: TimeEntryStatus.APPROVED,
          approvedBy: u.managementInfo?.managerId || null,
          approvedAt: new Date(),
        }));
      }
    }
  }
  await TimeEntry.insertMany(timeEntries);
  console.log(`Inserted time entries: ${timeEntries.length}`);

  console.log("Full demo seed complete ✔");
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
