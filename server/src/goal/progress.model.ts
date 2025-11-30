

import mongoose, { Schema, Document } from "mongoose";

export interface IProgressUpdate extends Document {
  goalId: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  previousValue: number;
  newValue: number;
  comment?: string;
  timestamp: Date;
  createdAt: Date;
}

const progressUpdateSchema = new Schema<IProgressUpdate>(
  {
    goalId: {
      type: Schema.Types.ObjectId,
      ref: "Goal",
      required: true,
      index: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    previousValue: {
      type: Number,
      required: true,
    },
    newValue: {
      type: Number,
      required: true,
    },
    comment: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

progressUpdateSchema.index({ goalId: 1, timestamp: -1 });
progressUpdateSchema.index({ updatedBy: 1 });

progressUpdateSchema.virtual("change").get(function (this: IProgressUpdate) {
  return this.newValue - this.previousValue;
});

progressUpdateSchema.virtual("changePercentage").get(function (this: IProgressUpdate) {
  if (this.previousValue === 0) return 0;
  return Math.round(((this.newValue - this.previousValue) / this.previousValue) * 100);
});

progressUpdateSchema.set("toJSON", { virtuals: true });
progressUpdateSchema.set("toObject", { virtuals: true });

export const ProgressUpdate = mongoose.model<IProgressUpdate>(
  "ProgressUpdate",
  progressUpdateSchema
);
