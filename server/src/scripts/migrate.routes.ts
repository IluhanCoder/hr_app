

import { Router } from "express";
import { authMiddleware, requireRole } from "../auth/auth.middleware.js";
import { UserRole } from "../../../shared/types/user.types.js";
import { migrateSalaryInfo, seedSkills } from "./migrate.controller.js";

const router = Router();

router.use(authMiddleware);
router.use(requireRole(UserRole.ADMIN));

router.post("/salary-info", migrateSalaryInfo);

router.post("/seed-skills", seedSkills);

export default router;
