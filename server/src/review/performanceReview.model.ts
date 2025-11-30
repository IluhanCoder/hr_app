

import mongoose, { Schema, Document } from "mongoose";
import { CriteriaType } from "./reviewTemplate.model.js";

export enum ReviewStatus {
  DRAFT = "draft",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export interface ICriteriaRating {
  criteriaName: string;
  criteriaType: CriteriaType;
  rating?: number;
  textResponse?: string;
  yesNoResponse?: boolean;
  comment?: string;
}

export interface IFeedback {
  from: mongoose.Types.ObjectId;
  comment: string;
  createdAt: Date;
}

export interface IPerformanceReview extends Document {
  employeeId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId;
  reviewPeriod: {
    startDate: Date;
    endDate: Date;
  };
  ratings: ICriteriaRating[];
  feedback: IFeedback[];
  overallComment: string;
  finalScore?: number;
  status: ReviewStatus;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const criteriaRatingSchema = new Schema<ICriteriaRating>({
  criteriaName: {
    type: String,
    required: true,
  },
  criteriaType: {
    type: String,
    enum: Object.values(CriteriaType),
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: function (this: ICriteriaRating) {
      return this.criteriaType === CriteriaType.RATING;
    },
  },
  textResponse: {
    type: String,
    required: function (this: ICriteriaRating) {
      return this.criteriaType === CriteriaType.TEXT;
    },
  },
  yesNoResponse: {
    type: Boolean,
    required: function (this: ICriteriaRating) {
      return this.criteriaType === CriteriaType.YES_NO;
    },
  },
  comment: {
    type: String,
  },
});

const feedbackSchema = new Schema<IFeedback>({
  from: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  comment: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const performanceReviewSchema = new Schema<IPerformanceReview>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: "ReviewTemplate",
      required: true,
    },
    reviewPeriod: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },
    ratings: {
      type: [criteriaRatingSchema],
      default: [],
    },
    feedback: {
      type: [feedbackSchema],
      default: [],
    },
    overallComment: {
      type: String,
      default: "",
    },
    finalScore: {
      type: Number,
      min: 0,
      max: 5,
    },
    status: {
      type: String,
      enum: Object.values(ReviewStatus),
      default: ReviewStatus.DRAFT,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

performanceReviewSchema.index({ employeeId: 1, status: 1 });
performanceReviewSchema.index({ reviewerId: 1, status: 1 });
performanceReviewSchema.index({ "reviewPeriod.endDate": 1 });

performanceReviewSchema.methods.calculateFinalScore = async function () {

  const template = await mongoose
    .model("ReviewTemplate")
    .findById(this.templateId);

  if (!template || !template.criteria) {
    return null;
  }

  let totalScore = 0;
  let totalWeight = 0;

  this.ratings.forEach((rating: ICriteriaRating) => {
    const criteria = template.criteria.find(
      (c: any) => c.name === rating.criteriaName
    );

    if (criteria && rating.rating) {

      totalScore += (rating.rating / 5) * criteria.weight;
      totalWeight += criteria.weight;
    }
  });

  if (totalWeight > 0) {
    return (totalScore / totalWeight) * 5;
  }

  return null;
};

performanceReviewSchema.virtual("isCompleted").get(function (this: IPerformanceReview) {
  return this.status === ReviewStatus.COMPLETED;
});

performanceReviewSchema.set("toJSON", { virtuals: true });
performanceReviewSchema.set("toObject", { virtuals: true });

export const PerformanceReview = mongoose.model<IPerformanceReview>(
  "PerformanceReview",
  performanceReviewSchema
);
