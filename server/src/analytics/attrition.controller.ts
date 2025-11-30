
import type { Request, Response } from "express";
import { User } from "../user/user.model.js";
import type { IUserDocument } from "../user/user.types.js";
import { AttritionConfig } from "./attrition.config.js";

export const ATTRITION_RISK_THRESHOLD = AttritionConfig.THRESHOLD;

interface RiskBreakdown {
  performance: number;
  potential: number;
  reviewStaleness: number;
  tenure: number;
  sentiment: number;
  leavePressure: number;
  salaryStaleness: number;
  adjustments: number;
}


function monthsDiff(from?: Date, to: Date = new Date()): number {
  if (!from) return 0;
  const years = to.getFullYear() - from.getFullYear();
  const months = to.getMonth() - from.getMonth();
  const total = years * 12 + months - (to.getDate() < from.getDate() ? 1 : 0);
  return total < 0 ? 0 : total;
}


export function computeAttritionRisk(user: IUserDocument): { riskScore: number; breakdown: RiskBreakdown } {
  const breakdown: RiskBreakdown = {
    performance: 0,
    potential: 0,
    reviewStaleness: 0,
    tenure: 0,
    sentiment: 0,
    leavePressure: 0,
    salaryStaleness: 0,
    adjustments: 0,
  };

  let risk = 0;

  const W = AttritionConfig.WEIGHTS;

  const performanceScore = user.performanceMetrics?.performanceScore;
  if (performanceScore != null) {
    breakdown.performance = (5 - performanceScore) * W.PERFORMANCE;
    risk += breakdown.performance;
  }

  const potentialScore = user.performanceMetrics?.potentialScore;
  if (potentialScore != null) {
    breakdown.potential = (5 - potentialScore) * W.POTENTIAL;
    risk += breakdown.potential;
  }

  const lastReviewDate = user.performanceMetrics?.lastReviewDate;
  const reviewMonths = monthsDiff(lastReviewDate);
  breakdown.reviewStaleness = Math.min(reviewMonths, AttritionConfig.LIMITS.REVIEW_STALENESS_CAP) * W.REVIEW_STALENESS;
  risk += breakdown.reviewStaleness;

  const hireDate = user.jobInfo?.hireDate;
  const tenureMonths = monthsDiff(hireDate);
  if (tenureMonths >= 6 && tenureMonths <= 18) {
    breakdown.tenure = W.TENURE_FIRST_YEAR;
    risk += breakdown.tenure;
  } else if (tenureMonths < 6) {
    breakdown.tenure = W.TENURE_EARLY;
    risk += breakdown.tenure;
  } else if (tenureMonths > 36) {
    breakdown.adjustments = W.TENURE_LONG_NEG;
    risk += breakdown.adjustments;
  }

  const sentimentScore = user.analyticsData?.sentimentScore;
  if (typeof sentimentScore === "number") {
    breakdown.sentiment = (1 - sentimentScore) * W.SENTIMENT;
    risk += breakdown.sentiment;
  }

  const annualLeft = user.leaveBalance?.annual;
  const sickLeft = user.leaveBalance?.sick;
  if (typeof annualLeft === "number" && annualLeft < 5) {
    breakdown.leavePressure += W.LEAVE_ANNUAL_LOW;
  }
  if (typeof sickLeft === "number" && sickLeft < 2) {
    breakdown.leavePressure += W.LEAVE_SICK_LOW;
  }
  risk += breakdown.leavePressure;

  const lastSalaryReview = user.salaryInfo?.lastSalaryReview;
  const salaryMonths = monthsDiff(lastSalaryReview);
  if (salaryMonths > 24) {
    breakdown.salaryStaleness = W.SALARY_24M;
  } else if (salaryMonths > 12) {
    breakdown.salaryStaleness = W.SALARY_12M;
  }
  risk += breakdown.salaryStaleness;

  const riskScore = Math.max(0, Math.min(100, Math.round(risk)));
  return { riskScore, breakdown };
}


export async function recalculateAttritionRisk(req: Request, res: Response) {
  try {
    const users = await User.findActive();
    let highRiskCount = 0;
    const results: Array<{
      userId: string;
      riskScore: number;
      highRisk: boolean;
      breakdown: RiskBreakdown;
    }> = [];

    for (const user of users) {
      const { riskScore, breakdown } = computeAttritionRisk(user);



      (user as any).analyticsData = (user.analyticsData || {});
      (user.analyticsData as any).riskScore = riskScore;
      (user.analyticsData as any).isAtRisk = riskScore >= ATTRITION_RISK_THRESHOLD;

      const history = (user.analyticsData as any).riskHistory || [];
      history.push({ riskScore, calculatedAt: new Date() });
      if (history.length > AttritionConfig.LIMITS.RISK_HISTORY_MAX) {
        history.splice(0, history.length - AttritionConfig.LIMITS.RISK_HISTORY_MAX);
      }
      (user.analyticsData as any).riskHistory = history;
      await user.save();
      const highRisk = riskScore >= ATTRITION_RISK_THRESHOLD;
      if (highRisk) highRiskCount++;
  results.push({ userId: user._id.toString(), riskScore, highRisk, breakdown });
    }

    res.json({
      success: true,
      processed: users.length,
      highRiskCount,
      threshold: ATTRITION_RISK_THRESHOLD,
      results,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to recalculate attrition risk" });
  }
}


export async function getTopAttritionRisk(req: Request, res: Response) {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 100);

    const users = await User.find({ status: "active" })
      .sort({ "analyticsData.riskScore": -1, updatedAt: -1 })
      .limit(limit)
      .select(
        "personalInfo.firstName personalInfo.lastName jobInfo.department jobInfo.jobTitle analyticsData.riskScore analyticsData.isAtRisk analyticsData.riskHistory role status"
      )
      .exec();

    const mapped = users.map((u: any) => ({
      id: u._id.toString(),
      firstName: u.personalInfo.firstName,
      lastName: u.personalInfo.lastName,
      department: u.jobInfo.department,
      jobTitle: u.jobInfo.jobTitle,
      role: u.role,
      status: u.status,
      riskScore: u.analyticsData?.riskScore ?? null,
      isAtRisk: u.analyticsData?.isAtRisk ?? false,
      lastHistory: u.analyticsData?.riskHistory?.slice(-1)[0] || null,
      riskHistory: (u.analyticsData?.riskHistory || []).map((h: any) => ({
        riskScore: h.riskScore,
        calculatedAt: h.calculatedAt,
      })),
    }));

  res.json({ success: true, count: mapped.length, data: mapped });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch top attrition risk" });
  }
}


export async function getAllAttritionUsers(req: Request, res: Response) {
  try {
    const users = await User.find({ status: "active" })
      .select(
        "personalInfo.firstName personalInfo.lastName jobInfo.department jobInfo.jobTitle analyticsData.riskScore analyticsData.isAtRisk analyticsData.riskHistory role status"
      )
      .exec();

    const mapped = users.map((u: any) => ({
      id: u._id.toString(),
      firstName: u.personalInfo.firstName,
      lastName: u.personalInfo.lastName,
      department: u.jobInfo.department,
      jobTitle: u.jobInfo.jobTitle,
      role: u.role,
      status: u.status,
      riskScore: u.analyticsData?.riskScore ?? null,
      isAtRisk: u.analyticsData?.isAtRisk ?? false,
      lastHistory: u.analyticsData?.riskHistory?.slice(-1)[0] || null,
      riskHistory: (u.analyticsData?.riskHistory || []).map((h: any) => ({
        riskScore: h.riskScore,
        calculatedAt: h.calculatedAt,
      })),
    }));

    res.json({ success: true, count: mapped.length, data: mapped });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch all attrition users" });
  }
}
