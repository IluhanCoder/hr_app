

import mongoose, { Schema, Document } from "mongoose";

export enum CriteriaType {
  RATING = "rating",
  TEXT = "text",
  YES_NO = "yes_no",
}

export interface ICriteria {
  name: string;
  description: string;
  type: CriteriaType;
  weight: number;
  required: boolean;
}

export interface IReviewTemplate extends Document {
  name: string;
  description: string;
  criteria: ICriteria[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const criteriaSchema = new Schema<ICriteria>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: Object.values(CriteriaType),
    required: true,
  },
  weight: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  required: {
    type: Boolean,
    default: true,
  },
});

const reviewTemplateSchema = new Schema<IReviewTemplate>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    criteria: {
      type: [criteriaSchema],
      required: true,
      validate: {
        validator: function (criteria: ICriteria[]) {

          const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
          return totalWeight === 100;
        },
        message: "Сума ваг критеріїв повинна дорівнювати 100%",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

reviewTemplateSchema.index({ isActive: 1 });
reviewTemplateSchema.index({ createdBy: 1 });

export const ReviewTemplate = mongoose.model<IReviewTemplate>(
  "ReviewTemplate",
  reviewTemplateSchema
);
