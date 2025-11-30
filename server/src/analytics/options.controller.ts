import express from "express";
import type { AuthRequest } from "../auth/auth.types.js";
import { User } from "../user/user.model.js";
import { UserRole } from "../../../shared/types/user.types.js";


export const getAnalyticsOptions = async (req: AuthRequest, res: express.Response) => {
  try {
    if (
      req.user?.role !== UserRole.HR_ANALYST &&
      req.user?.role !== UserRole.HR_MANAGER &&
      req.user?.role !== UserRole.ADMIN &&
      req.user?.role !== UserRole.LINE_MANAGER
    ) {
      return res.status(403).json({ success: false, message: "Доступ заборонено." });
    }

    const fieldsParam = (req.query.fields as string) || "department,jobTitle";
    const fields = fieldsParam.split(",").map((f) => f.trim()).filter(Boolean);
    const onlyActive = (req.query.onlyActive as string) !== "false";

    const match: any = {};
    if (onlyActive) match.status = "active";

    const result: Record<string, string[]> = {};

    if (fields.includes("department")) {
      const deps = await User.distinct("jobInfo.department", match);
      result.department = (deps as string[]).filter(Boolean).sort((a, b) => a.localeCompare(b));
    }
    if (fields.includes("jobTitle")) {
      const jobs = await User.distinct("jobInfo.jobTitle", match);
      result.jobTitle = (jobs as string[]).filter(Boolean).sort((a, b) => a.localeCompare(b));
    }

    return res.json({ success: true, options: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
