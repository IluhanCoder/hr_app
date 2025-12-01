

import { Router } from "express";
import { authMiddleware, requireHRAccess } from "../auth/auth.middleware.js";
import {
  getAllSkills,
  createSkill,
  getAllJobProfiles,
  createJobProfile,
  deleteJobProfile,
  teamGapAnalysis,
  employeeGapAnalysis,
  getSkillCategories,
  getSkillLevels,
  teamStatsDebug,
} from "./skills.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getAllSkills);

router.post("/", requireHRAccess, createSkill);

router.get("/categories", getSkillCategories);

router.get("/levels", getSkillLevels);

router.get("/job-profiles", getAllJobProfiles);

router.post("/job-profiles", requireHRAccess, createJobProfile);

router.delete("/job-profiles/:id", requireHRAccess, deleteJobProfile);

router.post("/gap-analysis/team", requireHRAccess, teamGapAnalysis);

router.post("/gap-analysis/employee", requireHRAccess, employeeGapAnalysis);

// Debug endpoint to verify counts by department and job title
router.get("/debug/team-stats", requireHRAccess, teamStatsDebug);

export default router;
