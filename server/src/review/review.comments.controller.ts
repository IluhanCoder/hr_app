import type { Response } from "express";
import { PerformanceReview } from "./performanceReview.model.js";
import type { AuthRequest } from "../auth/auth.types.js";


export const getAllReviewComments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {

    const reviews = await PerformanceReview.find({}, {
      feedback: 1,
      overallComment: 1,
      employeeId: 1,
      reviewerId: 1,
      createdAt: 1,
      updatedAt: 1,
    })
      .populate("employeeId", "personalInfo email jobInfo")
      .populate("reviewerId", "personalInfo email");

    const comments = reviews.flatMap((review) => {
      const feedbackComments = (review.feedback || []).map((fb) => ({
        type: "feedback",
        comment: fb.comment,
        from: fb.from,
        createdAt: fb.createdAt,
        reviewId: review._id,
        employeeId: review.employeeId,
        reviewerId: review.reviewerId,
      }));
      const overall = review.overallComment
        ? [{
            type: "overallComment",
            comment: review.overallComment,
            from: review.reviewerId,
            createdAt: review.updatedAt,
            reviewId: review._id,
            employeeId: review.employeeId,
            reviewerId: review.reviewerId,
          }]
        : [];
      return [...feedbackComments, ...overall];
    });

    res.status(200).json({
      success: true,
      data: comments,
      count: comments.length,
    });
  } catch (error) {
    console.error("❌ Error fetching review comments:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при отриманні коментарів",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
