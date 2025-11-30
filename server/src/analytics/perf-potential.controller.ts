import express from "express";
import type { AuthRequest } from "../auth/auth.types.js";
import { User } from "../user/user.model.js";
import { UserRole } from "../../../shared/types/user.types.js";


export const getPerformancePotentialMatrix = async (req: AuthRequest, res: express.Response) => {
  try {
    if (
      req.user?.role !== UserRole.HR_ANALYST &&
      req.user?.role !== UserRole.HR_MANAGER &&
      req.user?.role !== UserRole.ADMIN &&
      req.user?.role !== UserRole.LINE_MANAGER
    ) {
      return res.status(403).json({ success: false, message: "Доступ заборонено." });
    }

    const department = (req.query.department as string) || undefined;
    const jobTitle = (req.query.jobTitle as string) || undefined;
    const onlyActive = (req.query.onlyActive as string) !== "false";

    const query: any = {};
    if (onlyActive) query.status = "active";
    if (department) query["jobInfo.department"] = department;
    if (jobTitle) query["jobInfo.jobTitle"] = jobTitle;

    const employees = await User.find(query)
      .select("personalInfo jobInfo performanceMetrics highPotential status")
      .lean();

    const normalize = (v: any) => {
      const n = Number(v);
      if (!isFinite(n)) return undefined;
      return Math.min(5, Math.max(1, Math.round(n)));
    };

    const mapped = employees
      .map((e: any) => {
        let perf = normalize(e.performanceMetrics?.performanceScore);
        let pot = normalize(e.performanceMetrics?.potentialScore);

        if (pot == null) {
          const lvl = e.highPotential?.potentialLevel;
          if (lvl === "critical") pot = 5;
          else if (lvl === "high") pot = 4;
        }

        if (perf == null || pot == null) return null;

        return {
          id: e._id?.toString?.() || undefined,
          name: `${e.personalInfo?.firstName || ""} ${e.personalInfo?.lastName || ""}`.trim(),
          email: e.personalInfo?.email,
          department: e.jobInfo?.department,
          jobTitle: e.jobInfo?.jobTitle,
          performance: perf,
          potential: pot,
        };
      })
      .filter(Boolean);

    const grid: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0));
    for (const m of mapped as any[]) {
      if (m.performance && m.potential && m.performance >= 1 && m.performance <= 5 && m.potential >= 1 && m.potential <= 5) {
        grid[m.performance - 1]![m.potential - 1]! += 1;
      }
    }

    return res.json({
      success: true,
      count: mapped.length,
      filters: { department, jobTitle, onlyActive },
      grid,
      points: mapped,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
