import mongoose, { Schema } from "mongoose";

export const TimeEntryStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export const TimeEntryType = {
  REGULAR: "regular",
  OVERTIME: "overtime",
  HOLIDAY: "holiday",
} as const;

const timeEntrySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: Date, required: true, index: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    breakMinutes: { type: Number, default: 0 },
    type: { type: String, enum: Object.values(TimeEntryType), default: TimeEntryType.REGULAR },
    project: { type: String },
    task: { type: String },
    status: { type: String, enum: Object.values(TimeEntryStatus), default: TimeEntryStatus.PENDING, index: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

timeEntrySchema.index({ userId: 1, date: 1 });

export const TimeEntry = mongoose.model("TimeEntry", timeEntrySchema);
