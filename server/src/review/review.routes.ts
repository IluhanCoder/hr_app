

import { Router } from "express";
import {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  createReview,
  getReviews,
  getMyReviews,
  getReviewById,
  updateRatings,
  addFeedback,
  completeReview,
  deleteReview,
} from "./review.controller.js";


import { getAllReviewComments } from "./review.comments.controller.js";
import { getAllReviewCommentsWithSentiment } from "./review.comments.sentiment.controller.js";
import { authMiddleware, requireHRAccess, requireManagerAccess } from "../auth/auth.middleware.js";

const router = Router();


router.get("/reviews/comments/sentiment", authMiddleware, getAllReviewCommentsWithSentiment);



router.post("/review-templates", authMiddleware, requireHRAccess, createTemplate);


router.get("/review-templates", authMiddleware, getTemplates);


router.get("/review-templates/:id", authMiddleware, getTemplateById);


router.put("/review-templates/:id", authMiddleware, requireHRAccess, updateTemplate);


router.delete("/review-templates/:id", authMiddleware, requireHRAccess, deleteTemplate);


router.get("/reviews/comments", authMiddleware, getAllReviewComments);


router.post("/reviews", authMiddleware, requireManagerAccess, createReview);


router.get("/reviews", authMiddleware, requireManagerAccess, getReviews);


router.get("/reviews/my", authMiddleware, getMyReviews);


router.get("/reviews/:id", authMiddleware, getReviewById);


router.put("/reviews/:id/ratings", authMiddleware, requireManagerAccess, updateRatings);


router.post("/reviews/:id/feedback", authMiddleware, addFeedback);


router.post("/reviews/:id/complete", authMiddleware, requireManagerAccess, completeReview);


router.delete("/reviews/:id", authMiddleware, requireManagerAccess, deleteReview);

export default router;
