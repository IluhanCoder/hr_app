

import { Router } from "express";
import {
  createLeaveRequest,
  getMyLeaveRequests,
  getPendingLeaveRequests,
  getAllLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
} from "./leave.controller.js";
import { authMiddleware, requireManagerAccess, requireHRAccess } from "../auth/auth.middleware.js";

const router = Router();


router.post("/leaves", authMiddleware, createLeaveRequest);


router.get("/leaves/my", authMiddleware, getMyLeaveRequests);


router.get("/leaves/pending", authMiddleware, requireManagerAccess, getPendingLeaveRequests);


router.get("/leaves", authMiddleware, requireManagerAccess, getAllLeaveRequests);


router.put("/leaves/:id/approve", authMiddleware, requireManagerAccess, approveLeaveRequest);


router.put("/leaves/:id/reject", authMiddleware, requireManagerAccess, rejectLeaveRequest);


router.delete("/leaves/:id", authMiddleware, cancelLeaveRequest);

export default router;
