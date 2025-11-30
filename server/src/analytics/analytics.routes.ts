

import { Router } from "express";
import { authMiddleware } from "../auth/auth.middleware.js";
import { analyzeSalaryBias } from "./bias-analysis.controller.js";
import { recalculateAttritionRisk, getTopAttritionRisk, getAllAttritionUsers } from "./attrition.controller.js";
import { getSalaryWarnings } from "./salary-warnings.controller.js";
import { getPerformancePotentialMatrix } from "./perf-potential.controller.js";
import { getAnalyticsOptions } from "./options.controller.js";

const router = Router();

router.post("/salary-bias", authMiddleware, analyzeSalaryBias);
router.get("/salary-bias", authMiddleware, (req, res) => analyzeSalaryBias(req, res));


router.post("/attrition/recalculate", authMiddleware, recalculateAttritionRisk);
router.get("/attrition/top", authMiddleware, getTopAttritionRisk);
router.get("/attrition/all", authMiddleware, getAllAttritionUsers);

export default router;

router.get("/salary-warnings", authMiddleware, getSalaryWarnings);

router.get("/performance-potential", authMiddleware, getPerformancePotentialMatrix);
router.get("/options", authMiddleware, getAnalyticsOptions);
