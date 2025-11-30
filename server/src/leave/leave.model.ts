

import mongoose, { Schema, Document } from "mongoose";

export enum LeaveType {
  ANNUAL = "annual",
  SICK = "sick",
  PERSONAL = "personal",
  UNPAID = "unpaid",
}

export enum LeaveStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
}

export interface ILeaveRequest extends Document {
  employeeId: mongoose.Types.ObjectId;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  managerId?: mongoose.Types.ObjectId;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const leaveRequestSchema = new Schema<ILeaveRequest>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    leaveType: {
      type: String,
      enum: Object.values(LeaveType),
      required: [true, "Тип відпустки обов'язковий"],
    },
    startDate: {
      type: Date,
      required: [true, "Дата початку обов'язкова"],
    },
    endDate: {
      type: Date,
      required: [true, "Дата закінчення обов'язкова"],
    },
    totalDays: {
      type: Number,
      required: true,
      min: 1,
    },
    reason: {
      type: String,
      required: [true, "Причина обов'язкова"],
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(LeaveStatus),
      default: LeaveStatus.PENDING,
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    reviewComment: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

leaveRequestSchema.index({ employeeId: 1, status: 1 });
leaveRequestSchema.index({ managerId: 1, status: 1 });
leaveRequestSchema.index({ startDate: 1, endDate: 1 });

leaveRequestSchema.pre("save", function () {
  if (this.startDate > this.endDate) {
    throw new Error("Дата початку не може бути пізніше дати закінчення");
  }

  if (this.isNew || this.isModified("startDate") || this.isModified("endDate")) {
    this.totalDays = calculateBusinessDays(this.startDate, this.endDate);
  }
});

function calculateBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();

    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

leaveRequestSchema.statics.findByManager = function (managerId: string, status?: LeaveStatus) {
  const query: any = { managerId };
  if (status) {
    query.status = status;
  }
  return this.find(query)
    .populate("employeeId", "personalInfo email jobInfo")
    .sort({ createdAt: -1 });
};

export const LeaveRequest = mongoose.model<ILeaveRequest>("LeaveRequest", leaveRequestSchema);
