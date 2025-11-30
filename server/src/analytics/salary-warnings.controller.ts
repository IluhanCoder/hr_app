import express from "express";
import { User } from "../user/user.model.js";
import type { AuthRequest } from "../auth/auth.types.js";
import { UserRole } from "../../../shared/types/user.types.js";


export const getSalaryWarnings = async (req: AuthRequest, res: express.Response) => {
  try {

    if (
      req.user?.role !== UserRole.HR_ANALYST &&
      req.user?.role !== UserRole.HR_MANAGER &&
      req.user?.role !== UserRole.ADMIN
    ) {
      return res.status(403).json({ success: false, message: "Доступ заборонено." });
    }

    const threshold = Number(req.query.threshold) || 20;
    const scopeRaw = (req.query.scope as string) || "both";
    const scope = ["job", "department", "both"].includes(scopeRaw) ? scopeRaw : "both";

    const employees = await User.find({
      status: "active",
      "salaryInfo.baseSalary": { $exists: true, $gt: 0 },
      "jobInfo.jobTitle": { $exists: true },
      "jobInfo.department": { $exists: true },
    }).select("personalInfo jobInfo salaryInfo").lean();

    const avgByJob = new Map<string, number>();
    const countByJob = new Map<string, number>();
    const avgByDept = new Map<string, number>();
    const countByDept = new Map<string, number>();

    for (const emp of employees) {
      const salary = emp.salaryInfo?.baseSalary || 0;
      const jt = emp.jobInfo?.jobTitle || "";
      const dep = emp.jobInfo?.department || "";
      if (!salary || !jt || !dep) continue;

      avgByJob.set(jt, (avgByJob.get(jt) || 0) + salary);
      countByJob.set(jt, (countByJob.get(jt) || 0) + 1);

      avgByDept.set(dep, (avgByDept.get(dep) || 0) + salary);
      countByDept.set(dep, (countByDept.get(dep) || 0) + 1);
    }

    for (const [k, sum] of avgByJob.entries()) {
      const c = countByJob.get(k) || 1;
      avgByJob.set(k, sum / c);
    }
    for (const [k, sum] of avgByDept.entries()) {
      const c = countByDept.get(k) || 1;
      avgByDept.set(k, sum / c);
    }

    const warnings: any[] = [];
    for (const emp of employees) {
      const salary = emp.salaryInfo?.baseSalary || 0;
      const jt = emp.jobInfo?.jobTitle || "";
      const dep = emp.jobInfo?.department || "";
      if (!salary || !jt || !dep) continue;

      const triggers: { type: "job" | "department"; avg: number; deviationPercent: number }[] = [];

      if (scope !== "department") {
        const avgJob = avgByJob.get(jt) || 0;
        if (avgJob > 0) {
          const devJob = (Math.abs(salary - avgJob) / avgJob) * 100;
          if (devJob >= threshold) {
            triggers.push({ type: "job", avg: avgJob, deviationPercent: Math.round(devJob * 10) / 10 });
          }
        }
      }

      if (scope !== "job") {
        const avgDep = avgByDept.get(dep) || 0;
        if (avgDep > 0) {
          const devDep = (Math.abs(salary - avgDep) / avgDep) * 100;
          if (devDep >= threshold) {
            triggers.push({ type: "department", avg: avgDep, deviationPercent: Math.round(devDep * 10) / 10 });
          }
        }
      }

      if (triggers.length > 0) {

        const primary = triggers.reduce((a, b) => (a.deviationPercent >= b.deviationPercent ? a : b));
        warnings.push({
          id: (emp as any)._id?.toString?.() || undefined,
          name: `${emp.personalInfo?.firstName || ""} ${emp.personalInfo?.lastName || ""}`.trim(),
          email: emp.personalInfo?.email,
          jobTitle: jt,
          department: dep,
          baseSalary: salary,
          avgSalary: Math.round(primary.avg),
          deviationPercent: primary.deviationPercent,
          triggeredBy: primary.type,
          details: triggers.map((t) => ({
            type: t.type,
            avgSalary: Math.round(t.avg),
            deviationPercent: t.deviationPercent,
          })),
        });
      }
    }

    return res.json({ success: true, count: warnings.length, threshold, scope, warnings });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};