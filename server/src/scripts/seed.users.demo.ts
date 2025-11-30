import mongoose from "mongoose";
import { config } from "dotenv";
import { User } from "../user/user.model.js";

config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/hr_app";

const hrManagerId = new mongoose.Types.ObjectId("69243abe99301a0ec67cea2e");

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB (seed users)");

  const demoUsers = [
    {
      email: "dev.junior1@example.com",
      passwordHash: "$2b$10$abcdefghijklmnopqrstuv1234567890abcdefghiJkLmNoPq",
      role: "employee",
      status: "active",
      personalInfo: {
        firstName: "Іван",
        lastName: "Петренко",
        dateOfBirth: new Date("1998-05-12"),
        email: "dev.junior1@example.com",
        phone: "+380501111111",
        gender: "male",
        ethnicity: "UA",
      },
      jobInfo: {
        department: "Програмісти",
        jobTitle: "Junior React Developer",
        lineManagerId: hrManagerId,
        employmentType: "full_time",
        hireDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        educationLevel: "bachelor",
      },
      salaryInfo: {
        baseSalary: 30000,
        currency: "UAH",
        lastSalaryReview: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
      },
      leaveBalance: { annual: 24, sick: 10, personal: 5 },
      performanceMetrics: {
        lastReviewDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        performanceScore: 3.2,
      },
    },
    {
      email: "dev.junior2@example.com",
      passwordHash: "$2b$10$abcdefghijklmnopqrstuv1234567890abcdefghiJkLmNoPq",
      role: "employee",
      status: "active",
      personalInfo: {
        firstName: "Олександра",
        lastName: "Бондар",
        dateOfBirth: new Date("1997-11-02"),
        email: "dev.junior2@example.com",
        phone: "+380671234567",
        gender: "female",
        ethnicity: "UA",
      },
      jobInfo: {
        department: "Програмісти",
        jobTitle: "Junior React Developer",
        lineManagerId: hrManagerId,
        employmentType: "full_time",
        hireDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
        educationLevel: "bachelor",
      },
      salaryInfo: { baseSalary: 32000, currency: "UAH", lastSalaryReview: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000) },
      leaveBalance: { annual: 24, sick: 10, personal: 5 },
      performanceMetrics: { lastReviewDate: new Date(Date.now() - 160 * 24 * 60 * 60 * 1000), performanceScore: 2.8 },
    },
    {
      email: "dev.junior3@example.com",
      passwordHash: "$2b$10$abcdefghijklmnopqrstuv1234567890abcdefghiJkLmNoPq",
      role: "employee",
      status: "active",
      personalInfo: {
        firstName: "Анна",
        lastName: "Мельник",
        dateOfBirth: new Date("1997-05-10"),
        email: "dev.junior3@example.com",
        phone: "+380503333333",
        gender: "female",
        ethnicity: "UA",
      },
      jobInfo: {
        department: "Програмісти",
        jobTitle: "Junior React Developer",
        lineManagerId: hrManagerId,
        employmentType: "full_time",
        hireDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        educationLevel: "master",
      },
      salaryInfo: {
        baseSalary: 36000,
        currency: "UAH",
        lastSalaryReview: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000),
      },
      leaveBalance: { annual: 24, sick: 10, personal: 5 },
      performanceMetrics: {
        lastReviewDate: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000),
        performanceScore: 3.8,
      },
    },
    {
      email: "dev.junior4@example.com",
      passwordHash: "$2b$10$abcdefghijklmnopqrstuv1234567890abcdefghiJkLmNoPq",
      role: "employee",
      status: "active",
      personalInfo: {
        firstName: "Сергій",
        lastName: "Ткаченко",
        dateOfBirth: new Date("1996-11-30"),
        email: "dev.junior4@example.com",
        phone: "+380504444444",
        gender: "male",
        ethnicity: "UA",
      },
      jobInfo: {
        department: "Програмісти",
        jobTitle: "Junior React Developer",
        lineManagerId: hrManagerId,
        employmentType: "full_time",
        hireDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        educationLevel: "bachelor",
      },
      salaryInfo: {
        baseSalary: 34000,
        currency: "UAH",
        lastSalaryReview: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
      },
      leaveBalance: { annual: 24, sick: 10, personal: 5 },
      performanceMetrics: {
        lastReviewDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        performanceScore: 3.5,
      },
    },
    {
      email: "dev.junior5@example.com",
      passwordHash: "$2b$10$abcdefghijklmnopqrstuv1234567890abcdefghiJkLmNoPq",
      role: "employee",
      status: "active",
      personalInfo: {
        firstName: "Віктор",
        lastName: "Шевченко",
        dateOfBirth: new Date("1998-08-18"),
        email: "dev.junior5@example.com",
        phone: "+380505555555",
        gender: "male",
        ethnicity: "UA",
      },
      jobInfo: {
        department: "Програмісти",
        jobTitle: "Junior React Developer",
        lineManagerId: hrManagerId,
        employmentType: "full_time",
        hireDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        educationLevel: "master",
      },
      salaryInfo: {
        baseSalary: 37000,
        currency: "UAH",
        lastSalaryReview: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
      leaveBalance: { annual: 24, sick: 10, personal: 5 },
      performanceMetrics: {
        lastReviewDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        performanceScore: 4.0,
      },
    },

    {
      email: "dev.junior6@example.com",
      passwordHash: "$2b$10$abcdefghijklmnopqrstuv1234567890abcdefghiJkLmNoPq",
      role: "employee",
      status: "active",
      personalInfo: {
        firstName: "Марина",
        lastName: "Коваль",
        dateOfBirth: new Date("1999-02-14"),
        email: "dev.junior6@example.com",
        phone: "+380506666666",
        gender: "female",
        ethnicity: "UA",
      },
      jobInfo: {
        department: "Програмісти",
        jobTitle: "Junior React Developer",
        lineManagerId: hrManagerId,
        employmentType: "full_time",
        hireDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        educationLevel: "bachelor",
      },
      salaryInfo: { baseSalary: 38000, currency: "UAH", lastSalaryReview: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
      leaveBalance: { annual: 24, sick: 10, personal: 5 },
      performanceMetrics: { lastReviewDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), performanceScore: 3.9 },
    },
    {
      email: "dev.junior7@example.com",
      passwordHash: "$2b$10$abcdefghijklmnopqrstuv1234567890abcdefghiJkLmNoPq",
      role: "employee",
      status: "active",
      personalInfo: {
        firstName: "Денис",
        lastName: "Левченко",
        dateOfBirth: new Date("1995-12-01"),
        email: "dev.junior7@example.com",
        phone: "+380507777777",
        gender: "male",
        ethnicity: "UA",
      },
      jobInfo: {
        department: "Програмісти",
        jobTitle: "Junior React Developer",
        lineManagerId: hrManagerId,
        employmentType: "full_time",
        hireDate: new Date(Date.now() - 140 * 24 * 60 * 60 * 1000),
        educationLevel: "master",
      },
      salaryInfo: { baseSalary: 40000, currency: "UAH", lastSalaryReview: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
      leaveBalance: { annual: 24, sick: 10, personal: 5 },
      performanceMetrics: { lastReviewDate: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000), performanceScore: 4.1 },
    },
    {
      email: "dev.junior8@example.com",
      passwordHash: "$2b$10$abcdefghijklmnopqrstuv1234567890abcdefghiJkLmNoPq",
      role: "employee",
      status: "active",
      personalInfo: {
        firstName: "Юлія",
        lastName: "Гринь",
        dateOfBirth: new Date("1996-07-07"),
        email: "dev.junior8@example.com",
        phone: "+380508888888",
        gender: "female",
        ethnicity: "UA",
      },
      jobInfo: {
        department: "Програмісти",
        jobTitle: "Junior React Developer",
        lineManagerId: hrManagerId,
        employmentType: "full_time",
        hireDate: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000),
        educationLevel: "master",
      },
      salaryInfo: { baseSalary: 39000, currency: "UAH", lastSalaryReview: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      leaveBalance: { annual: 24, sick: 10, personal: 5 },
      performanceMetrics: { lastReviewDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000), performanceScore: 3.7 },
    },
    {
      email: "dev.junior9@example.com",
      passwordHash: "$2b$10$abcdefghijklmnopqrstuv1234567890abcdefghiJkLmNoPq",
      role: "employee",
      status: "active",
      personalInfo: {
        firstName: "Андрій",
        lastName: "Савченко",
        dateOfBirth: new Date("1997-03-22"),
        email: "dev.junior9@example.com",
        phone: "+380509999999",
        gender: "male",
        ethnicity: "UA",
      },
      jobInfo: {
        department: "Програмісти",
        jobTitle: "Junior React Developer",
        lineManagerId: hrManagerId,
        employmentType: "full_time",
        hireDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
        educationLevel: "bachelor",
      },
      salaryInfo: { baseSalary: 41000, currency: "UAH", lastSalaryReview: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) },
      leaveBalance: { annual: 24, sick: 10, personal: 5 },
      performanceMetrics: { lastReviewDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), performanceScore: 3.6 },
    },
    {
      email: "dev.junior10@example.com",
      passwordHash: "$2b$10$abcdefghijklmnopqrstuv1234567890abcdefghiJkLmNoPq",
      role: "employee",
      status: "active",
      personalInfo: {
        firstName: "Наталія",
        lastName: "Романюк",
        dateOfBirth: new Date("1998-10-05"),
        email: "dev.junior10@example.com",
        phone: "+380501010101",
        gender: "female",
        ethnicity: "UA",
      },
      jobInfo: {
        department: "Програмісти",
        jobTitle: "Junior React Developer",
        lineManagerId: hrManagerId,
        employmentType: "full_time",
        hireDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        educationLevel: "phd",
      },
      salaryInfo: { baseSalary: 43000, currency: "UAH", lastSalaryReview: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      leaveBalance: { annual: 24, sick: 10, personal: 5 },
      performanceMetrics: { lastReviewDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), performanceScore: 4.2 },
    },
  ];

  for (const u of demoUsers) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log(`➡️  Skip existing user: ${u.email}`);
      continue;
    }
    const created = await User.create(u as any);
    console.log(`✅ Created user ${created.personalInfo?.fullName || created.email}`);
  }

  await mongoose.disconnect();
  console.log("🏁 Seed users finished");
}

run().catch((err) => { console.error("❌ Seed users error:", err); process.exit(1); });
