import type { Response } from "express";
import { PerformanceReview } from "./performanceReview.model.js";
import { Candidate } from "../recruitment/recruitment.model.js";
import type { AuthRequest } from "../auth/auth.types.js";
import Sentiment from "sentiment";
import { analyzeMixedSentiment } from "../utils/ukrainian-sentiment.js";

const sentiment = new Sentiment();


function analyzeSentiment(text: string): {
  score: number;
  sentiment: "positive" | "negative" | "neutral";
} {
  const result = analyzeMixedSentiment(text, sentiment);
  return {
    score: result.score,
    sentiment: result.sentiment,
  };
}


export const getAllReviewCommentsWithSentiment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const allComments: any[] = [];

    const reviews = await PerformanceReview.find({}, {
      ratings: 1,
      feedback: 1,
      overallComment: 1,
      employeeId: 1,
      reviewerId: 1,
      createdAt: 1,
      updatedAt: 1,
    })
      .populate("employeeId", "personalInfo email jobInfo")
      .populate("reviewerId", "personalInfo email");

    reviews.forEach((review) => {

      if (review.overallComment) {
        const analysis = analyzeSentiment(review.overallComment);

        allComments.push({
          source: "performance_review",
          type: "overallComment",
          comment: review.overallComment,
          from: review.reviewerId,
          createdAt: review.updatedAt,
          reviewId: review._id,
          employeeId: review.employeeId,
          reviewerId: review.reviewerId,
          sentiment: analysis.sentiment,
          sentimentScore: analysis.score,
        });
      }

      if (review.ratings && Array.isArray(review.ratings)) {
        review.ratings.forEach((rating: any) => {
          if (rating.comment) {
            const analysis = analyzeSentiment(rating.comment);

            allComments.push({
              source: "performance_review",
              type: "rating_comment",
              criteriaName: rating.criteriaName,
              comment: rating.comment,
              from: review.reviewerId,
              createdAt: review.updatedAt,
              reviewId: review._id,
              employeeId: review.employeeId,
              reviewerId: review.reviewerId,
              sentiment: analysis.sentiment,
              sentimentScore: analysis.score,
            });
          }
        });
      }

      if (review.feedback && Array.isArray(review.feedback)) {
        review.feedback.forEach((fb: any) => {
          if (fb.comment) {
            const analysis = analyzeSentiment(fb.comment);

            allComments.push({
              source: "performance_review",
              type: "feedback",
              comment: fb.comment,
              from: fb.from,
              createdAt: fb.createdAt,
              reviewId: review._id,
              employeeId: review.employeeId,
              reviewerId: review.reviewerId,
              sentiment: analysis.sentiment,
              sentimentScore: analysis.score,
            });
          }
        });
      }
    });

    const candidates = await Candidate.find({}, {
      firstName: 1,
      lastName: 1,
      email: 1,
      interviews: 1,
      jobProfileId: 1,
      department: 1,
      currentStage: 1,
      createdAt: 1,
    })
      .populate("jobProfileId", "title");

    candidates.forEach((candidate) => {
      if (candidate.interviews && Array.isArray(candidate.interviews)) {
        candidate.interviews.forEach((interview: any) => {
          if (interview.feedback && Array.isArray(interview.feedback)) {
            interview.feedback.forEach((fb: any) => {
              if (fb.comment) {
                const analysis = analyzeSentiment(fb.comment);

                allComments.push({
                  source: "recruitment",
                  type: "interview_feedback",
                  comment: fb.comment,
                  from: fb.from,
                  rating: fb.rating,
                  recommendation: fb.recommendation,
                  createdAt: fb.createdAt,
                  candidateId: candidate._id,
                  candidateName: `${candidate.firstName} ${candidate.lastName}`,
                  candidateEmail: candidate.email,
                  jobProfile: candidate.jobProfileId,
                  department: candidate.department,
                  interviewDate: interview.scheduledAt,
                  sentiment: analysis.sentiment,
                  sentimentScore: analysis.score,
                });
              }
            });
          }
        });
      }
    });

    allComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.status(200).json({
      success: true,
      data: allComments,
      count: allComments.length,
      breakdown: {
        performance_review: allComments.filter(c => c.source === "performance_review").length,
        recruitment: allComments.filter(c => c.source === "recruitment").length,
        positive: allComments.filter(c => c.sentiment === "positive").length,
        negative: allComments.filter(c => c.sentiment === "negative").length,
        neutral: allComments.filter(c => c.sentiment === "neutral").length,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching comments with sentiment:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при отриманні коментарів з аналізом тональності",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
