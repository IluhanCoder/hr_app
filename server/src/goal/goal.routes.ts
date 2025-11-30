

import { Router } from "express";
import {
  createGoal,
  getGoals,
  getMyGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
  updateProgress,
} from "./goal.controller.js";
import { authMiddleware, requireManagerAccess } from "../auth/auth.middleware.js";

const router = Router();


router.post("/goals", authMiddleware, requireManagerAccess, createGoal);


router.get("/goals", authMiddleware, requireManagerAccess, getGoals);


router.get("/goals/my", authMiddleware, getMyGoals);


router.get("/goals/:id", authMiddleware, getGoalById);


router.put("/goals/:id", authMiddleware, requireManagerAccess, updateGoal);


router.delete("/goals/:id", authMiddleware, requireManagerAccess, deleteGoal);


router.post("/goals/:id/progress", authMiddleware, updateProgress);

export default router;
