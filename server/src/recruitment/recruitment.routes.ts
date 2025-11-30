

import { Router } from "express";
import { authMiddleware } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/auth.middleware.js";
import { UserRole } from "../../../shared/types/user.types.js";
import {
  getCandidates,
  getCandidateById,
  createCandidate,
  moveCandidateToStage,
  addInterviewFeedback,
  generateOffer,
  sendOffer,
  respondToOffer,
  updateOfferStatus,
  rejectCandidate,
  convertCandidateToEmployee,
  getRecruitmentStats,
} from "./recruitment.controller.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/stats",
  requireRole(UserRole.HR_MANAGER, UserRole.ADMIN, UserRole.RECRUITER),
  getRecruitmentStats
);

router.get(
  "/",
  requireRole(UserRole.HR_MANAGER, UserRole.ADMIN, UserRole.LINE_MANAGER, UserRole.RECRUITER),
  getCandidates
);

router.get(
  "/:id",
  requireRole(UserRole.HR_MANAGER, UserRole.ADMIN, UserRole.LINE_MANAGER, UserRole.RECRUITER),
  getCandidateById
);

router.post(
  "/",
  requireRole(UserRole.HR_MANAGER, UserRole.ADMIN, UserRole.RECRUITER),
  createCandidate
);

router.post(
  "/:id/move",
  requireRole(UserRole.HR_MANAGER, UserRole.ADMIN, UserRole.LINE_MANAGER, UserRole.RECRUITER),
  moveCandidateToStage
);

router.post(
  "/:candidateId/interviews/:interviewId/feedback",
  addInterviewFeedback
);

router.post(
  "/:id/offer/generate",
  requireRole(UserRole.HR_MANAGER, UserRole.ADMIN, UserRole.RECRUITER),
  generateOffer
);

router.post(
  "/:id/offer/send",
  requireRole(UserRole.HR_MANAGER, UserRole.ADMIN, UserRole.RECRUITER),
  sendOffer
);

router.post(
  "/:id/offer/respond",
  requireRole(UserRole.HR_MANAGER, UserRole.ADMIN, UserRole.RECRUITER),
  respondToOffer
);

router.put(
  "/:id/offer-status",
  requireRole(UserRole.HR_MANAGER, UserRole.ADMIN, UserRole.RECRUITER),
  updateOfferStatus
);

router.post(
  "/:id/reject",
  requireRole(UserRole.HR_MANAGER, UserRole.ADMIN, UserRole.LINE_MANAGER, UserRole.RECRUITER),
  rejectCandidate
);

router.get(
  "/:id/convert-to-employee",
  requireRole(UserRole.HR_MANAGER, UserRole.ADMIN),
  convertCandidateToEmployee
);

export default router;
