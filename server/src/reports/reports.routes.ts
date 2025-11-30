

import { Router } from "express";
import { authMiddleware, requireRole } from "../auth/auth.middleware.js";
import { UserRole } from "../../../shared/types/user.types.js";
import {
  generateReport,
  getSavedReports,
  runSavedReport,
  deleteReport,
  getAvailableFields,
} from "./reports.controller.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/generate",
  requireRole(UserRole.HR_MANAGER, UserRole.ADMIN),
  generateReport
);

router.get(
  "/",
  requireRole(UserRole.HR_MANAGER, UserRole.ADMIN),
  getSavedReports
);

router.post(
  "/:id/run",
  requireRole(UserRole.HR_MANAGER, UserRole.ADMIN),
  runSavedReport
);

router.delete(
  "/:id",
  requireRole(UserRole.HR_MANAGER, UserRole.ADMIN),
  deleteReport
);

router.get(
  "/fields/:entityType",
  requireRole(UserRole.HR_MANAGER, UserRole.ADMIN),
  getAvailableFields
);

export default router;
