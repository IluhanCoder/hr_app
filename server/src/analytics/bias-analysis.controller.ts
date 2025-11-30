

import express from "express";
import regression from "regression";
import { mean, standardDeviation, sampleCorrelation } from "simple-statistics";
import { User } from "../user/user.model.js";
import type { AuthRequest } from "../types/express.d.js";
import { UserRole, Gender, EducationLevel } from "../../../shared/types/user.types.js";


export const analyzeSalaryBias = async (req: AuthRequest, res: express.Response) => {
  try {

    if (
      req.user?.role !== UserRole.HR_ANALYST &&
      req.user?.role !== UserRole.HR_MANAGER &&
      req.user?.role !== UserRole.ADMIN
    ) {
      return res.status(403).json({
        success: false,
        message: "Доступ заборонено. Тільки HR-аналітики можуть переглядати цей звіт.",
      });
    }

    console.log("🔍 Початок аналізу упереджень у системі оплати праці...");

    const employees = await User.find({
      status: "active",
      "salaryInfo.baseSalary": { $exists: true, $gt: 0 },
      "personalInfo.gender": { $exists: true },
    }).select("personalInfo jobInfo salaryInfo");

    if (employees.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Недостатньо даних для аналізу (потрібно мінімум 10 співробітників)",
      });
    }

    console.log(`📊 Знайдено ${employees.length} співробітників для аналізу`);

    const educationFieldSet = new Set<string>();
    employees.forEach((emp) => {
      const field = (emp.personalInfo as any).education;
      if (field && typeof field === "string" && field.trim()) {
        educationFieldSet.add(field.trim());
      }
    });
    const educationFieldIndex: Record<string, number> = {};
    Array.from(educationFieldSet).forEach((f, i) => {
      educationFieldIndex[f] = i + 1;
    });

    const data = employees.map((emp) => {

      const hireDate = new Date(emp.jobInfo.hireDate);
      const yearsOfExperience = (Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

      const isMale = emp.personalInfo.gender === Gender.MALE ? 1 : 0;
      const isFemale = emp.personalInfo.gender === Gender.FEMALE ? 1 : 0;

      const educationScore = getEducationScore(emp.personalInfo.educationLevel);
      const educationField: string = (emp.personalInfo as any).education || "Не вказано";
      const educationFieldScore = getEducationFieldScore(educationFieldIndex, educationField);

      const seniorityScore = getSeniorityScore(emp.jobInfo.jobTitle);

      return {
        salary: emp.salaryInfo?.baseSalary || 0,
        yearsOfExperience,
        isMale,
        isFemale,
        educationScore,
        seniorityScore,
        gender: emp.personalInfo.gender,
        jobTitle: emp.jobInfo.jobTitle,
        department: emp.jobInfo.department,
        ethnicity: emp.personalInfo.ethnicity || "Не вказано",
        educationLevel: emp.personalInfo.educationLevel || "Не вказано",
        educationField,
        educationFieldScore,
      };
    });

    console.log("🧮 Запуск регресійного аналізу...");

    const baselineModel = runMultipleRegression(data, false);

    const fullModel = runMultipleRegression(data, true);

    const genderBias = analyzeGenderBias(data);
    const educationBias = analyzeEducationBias(data);
    const educationFieldBias = analyzeEducationFieldBias(data);
    const departmentBias = analyzeDepartmentBias(data);
    const ethnicityBias = analyzeEthnicityBias(data);

    const report = {
      summary: {
        totalEmployees: employees.length,
        analysisDate: new Date().toISOString(),
        averageSalary: mean(data.map((d) => d.salary)),
        salaryStdDev: standardDeviation(data.map((d) => d.salary)),
      },
      models: {
        baseline: baselineModel,
        full: fullModel,
      },
      biasAnalysis: {
        gender: genderBias,
        education: educationBias,
        educationField: educationFieldBias,
        department: departmentBias,
        ethnicity: ethnicityBias,
      },
      recommendations: generateRecommendations(genderBias, educationBias, educationFieldBias, departmentBias, ethnicityBias),
      rawData: data,
    };

    console.log("✅ Аналіз завершено");

    res.json({
      success: true,
      data: report,
      message: "Аналіз упереджень виконано успішно",
    });
  } catch (error) {
    console.error("❌ Помилка при аналізі упереджень:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при виконанні аналізу",
    });
  }
};


function runMultipleRegression(data: any[], includeGender: boolean) {


  const regressionData = data.map((d) => {
    const features = [
      d.yearsOfExperience,
      d.educationScore,
      d.seniorityScore,
    ];

    if (includeGender) {
      features.push(d.isMale);
    }

    return [d.salary, ...features];
  });

  const salaries = data.map((d) => d.salary);
  const experience = data.map((d) => d.yearsOfExperience);
  const education = data.map((d) => d.educationScore);
  const seniority = data.map((d) => d.seniorityScore);

  const correlations = {
    experienceSalary: sampleCorrelation(experience, salaries),
    educationSalary: sampleCorrelation(education, salaries),
    senioritySalary: sampleCorrelation(seniority, salaries),
  };

  const meanSalary = mean(salaries);
  const predictions = data.map((d) => {
    return (
      meanSalary +
      correlations.experienceSalary * (d.yearsOfExperience - mean(experience)) +
      correlations.educationSalary * (d.educationScore - mean(education)) +
      correlations.senioritySalary * (d.seniorityScore - mean(seniority))
    );
  });

  const ssRes = data.reduce((sum, d, i) => sum + Math.pow(d.salary - (predictions[i] || 0), 2), 0);
  const ssTot = data.reduce((sum, d) => sum + Math.pow(d.salary - meanSalary, 2), 0);
  const rSquared = 1 - ssRes / ssTot;

  return {
    coefficients: correlations,
    rSquared,
    sampleSize: data.length,
  };
}


function analyzeGenderBias(data: any[]) {
  const maleSalaries = data.filter((d) => d.isMale === 1).map((d) => d.salary);
  const femaleSalaries = data.filter((d) => d.isFemale === 1).map((d) => d.salary);

  if (maleSalaries.length === 0 || femaleSalaries.length === 0) {
    return {
      detected: false,
      message: "Недостатньо даних для аналізу гендерних упереджень",
    };
  }

  const maleAvg = mean(maleSalaries);
  const femaleAvg = mean(femaleSalaries);
  const difference = maleAvg - femaleAvg;
  const percentageDiff = (difference / femaleAvg) * 100;

  const maleStd = standardDeviation(maleSalaries);
  const femaleStd = standardDeviation(femaleSalaries);
  const pooledStd = Math.sqrt(
    (Math.pow(maleStd, 2) + Math.pow(femaleStd, 2)) / 2
  );
  const tStatistic = difference / (pooledStd * Math.sqrt(2 / maleSalaries.length));

  const isStatisticallySignificant = Math.abs(tStatistic) > 2;

  return {
    detected: isStatisticallySignificant && difference > 0,
    maleCount: maleSalaries.length,
    femaleCount: femaleSalaries.length,
    maleAvgSalary: Math.round(maleAvg),
    femaleAvgSalary: Math.round(femaleAvg),
    difference: Math.round(difference),
    percentageDiff: Math.round(percentageDiff * 100) / 100,
    tStatistic: Math.round(tStatistic * 100) / 100,
    isStatisticallySignificant,
    pValue: isStatisticallySignificant ? "< 0.05" : "> 0.05",
    severity: getSeverity(percentageDiff),
  };
}


function analyzeEducationBias(data: any[]) {
  const educationGroups = data.reduce((acc, d) => {
    const level = d.educationLevel;
    if (!acc[level]) acc[level] = [];
    acc[level].push(d.salary);
    return acc;
  }, {} as Record<string, number[]>);

  const stats = Object.entries(educationGroups).map(([level, salaries]) => ({
    level,
    count: (salaries as number[]).length,
    avgSalary: Math.round(mean(salaries as number[])),
    minSalary: Math.min(...(salaries as number[])),
    maxSalary: Math.max(...(salaries as number[])),
  }));

  stats.sort((a, b) => b.avgSalary - a.avgSalary);

  const eduScores = data.map((d) => d.educationScore);
  const salaries = data.map((d) => d.salary);
  const eduStd = standardDeviation(eduScores);
  const salStd = standardDeviation(salaries);
  const correlation = eduStd === 0 || salStd === 0 ? null : sampleCorrelation(eduScores, salaries);

  return {
    groups: stats,
    correlation,
  };
}

function analyzeEducationFieldBias(data: any[]) {
  const fieldGroups = data.reduce((acc, d) => {
    const field = d.educationField || "Не вказано";
    if (!acc[field]) acc[field] = [];
    acc[field].push(d.salary);
    return acc;
  }, {} as Record<string, number[]>);

  const stats = Object.entries(fieldGroups).map(([field, salaries]) => ({
    field,
    count: (salaries as number[]).length,
    avgSalary: Math.round(mean(salaries as number[])),
    minSalary: Math.min(...(salaries as number[])),
    maxSalary: Math.max(...(salaries as number[])),
    spread: Math.round(Math.max(...(salaries as number[])) - Math.min(...(salaries as number[]))),
  }));

  stats.sort((a, b) => b.avgSalary - a.avgSalary);
  const globalAvg = mean(data.map((d) => d.salary));
  const outliers = stats.filter((s) => Math.abs(s.avgSalary - globalAvg) / globalAvg > 0.15);

  return {
    fields: stats,
    diversity: Object.keys(fieldGroups).length,
    outliers,
    significantDifferences: outliers.length > 0,
  };
}


function analyzeDepartmentBias(data: any[]) {
  const deptGroups = data.reduce((acc, d) => {
    const dept = d.department;
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(d.salary);
    return acc;
  }, {} as Record<string, number[]>);

  const stats = Object.entries(deptGroups).map(([dept, salaries]) => ({
    department: dept,
    count: (salaries as number[]).length,
    avgSalary: Math.round(mean(salaries as number[])),
    minSalary: Math.min(...(salaries as number[])),
    maxSalary: Math.max(...(salaries as number[])),
  }));

  stats.sort((a, b) => b.avgSalary - a.avgSalary);

  const avgSalary = mean(data.map((d) => d.salary));
  const significant = stats.filter(
    (s) => Math.abs(s.avgSalary - avgSalary) / avgSalary > 0.15
  );

  return {
    departments: stats,
    significantDifferences: significant.length > 0,
    outliers: significant,
  };
}


function analyzeEthnicityBias(data: any[]) {
  const ethnicGroups = data.reduce((acc, d) => {
    const eth = d.ethnicity;
    if (!acc[eth]) acc[eth] = [];
    acc[eth].push(d.salary);
    return acc;
  }, {} as Record<string, number[]>);

  const stats = Object.entries(ethnicGroups).map(([ethnicity, salaries]) => ({
    ethnicity,
    count: (salaries as number[]).length,
    avgSalary: Math.round(mean(salaries as number[])),
  }));

  stats.sort((a, b) => b.avgSalary - a.avgSalary);

  return {
    groups: stats,
    diversity: Object.keys(ethnicGroups).length,
  };
}


function getEducationScore(level?: string): number {
  switch (level) {
    case EducationLevel.HIGH_SCHOOL:
      return 1;
    case EducationLevel.BACHELOR:
      return 2;
    case EducationLevel.MASTER:
      return 3;
    case EducationLevel.PHD:
      return 4;
    default:
      return 1;
  }
}

function getEducationFieldScore(indexMap: Record<string, number>, field: string): number {
  if (!field || field === "Не вказано") return 0;
  return indexMap[field] || 0;
}


function getSeniorityScore(jobTitle: string): number {
  const title = jobTitle.toLowerCase();
  if (title.includes("intern")) return 1;
  if (title.includes("junior")) return 2;
  if (title.includes("middle") || title.includes("mid")) return 3;
  if (title.includes("senior")) return 4;
  if (title.includes("lead") || title.includes("principal")) return 5;
  if (title.includes("manager") || title.includes("head")) return 6;
  if (title.includes("director") || title.includes("vp")) return 7;
  return 3;
}


function getSeverity(percentageDiff: number): string {
  const abs = Math.abs(percentageDiff);
  if (abs < 5) return "low";
  if (abs < 10) return "moderate";
  if (abs < 20) return "high";
  return "critical";
}


function generateRecommendations(
  genderBias: any,
  educationBias: any,
  educationFieldBias: any,
  departmentBias: any,
  ethnicityBias: any
): string[] {
  const recommendations: string[] = [];

  if (genderBias.detected) {
    recommendations.push(
      `🚨 КРИТИЧНО: Виявлено статистично значущий гендерний розрив у зарплатах (${genderBias.percentageDiff}%). Чоловіки отримують в середньому на ${genderBias.difference} UAH більше.`
    );
    recommendations.push(
      "📋 Рекомендація: Провести аудит зарплат та встановити прозорі критерії компенсації."
    );
    recommendations.push(
      "⚖️ Рекомендація: Впровадити політику рівної оплати праці та регулярний моніторинг."
    );
  } else if (genderBias.maleCount > 0 && genderBias.femaleCount > 0) {
    recommendations.push(
      `✅ Гендерний розрив у зарплатах не є статистично значущим (${genderBias.percentageDiff}%).`
    );
  }

  if (departmentBias.significantDifferences) {
    recommendations.push(
      `⚠️ Виявлено значні відмінності в оплаті між департаментами. Перевірте чи це відповідає ринковим умовам.`
    );
  }

  if (educationBias.correlation < 0.3) {
    recommendations.push(
      `📚 Кореляція між рівнем освіти та зарплатою низька (${(educationBias.correlation * 100).toFixed(0)}%). Розгляньте можливість перегляду критеріїв оцінки.`
    );
  }

  if (educationFieldBias.significantDifferences) {
    recommendations.push(
      `🎓 Виявлено суттєві різниці між спеціалізаціями освіти (поле education). Перевірте об'єктивність компенсації для різних напрямів.`
    );
  } else if (educationFieldBias.diversity > 1) {
    recommendations.push(
      `🎓 Різких перекосів між спеціалізаціями освіти не виявлено. (${educationFieldBias.diversity} напрями)`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "✅ Критичних упереджень не виявлено. Система оплати виглядає справедливою."
    );
    recommendations.push(
      "💡 Рекомендація: Продовжуйте регулярний моніторинг для підтримання справедливості."
    );
  }

  return recommendations;
}
