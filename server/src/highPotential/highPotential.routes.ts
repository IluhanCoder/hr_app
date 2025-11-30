

import express from "express";
import {
  markAsHighPotential,
  unmarkAsHighPotential,
  getHighPotentialEmployees,
  updateHighPotentialInfo,
} from "./highPotential.controller.js";
import { authMiddleware, requireHRAccess } from "../auth/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(requireHRAccess);


router.get("/", getHighPotentialEmployees);


router.post("/:userId/mark", markAsHighPotential);


router.delete("/:userId/unmark", unmarkAsHighPotential);


router.put("/:userId", updateHighPotentialInfo);

export default router;
