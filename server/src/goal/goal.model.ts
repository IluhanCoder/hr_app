

import mongoose, { Schema, Document } from "mongoose";

export enum GoalType {
  INDIVIDUAL = "individual",
  TEAM = "team",
}

export enum GoalCategory {
  KPI = "KPI",
  OKR = "OKR",
}

export enum GoalStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum Unit {
  PERCENTAGE = "percentage",
  NUMBER = "number",
  CURRENCY = "currency",
}

export interface IGoal extends Document {
  title: string;
  description: string;
  type: GoalType;
  goalCategory: GoalCategory;
  assignedTo?: mongoose.Types.ObjectId;
  department?: string;
  createdBy: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  targetValue: number;
  currentValue: number;
  unit: Unit;
  status: GoalStatus;
  createdAt: Date;
  updatedAt: Date;
}

const goalSchema = new Schema<IGoal>(
  {
    title: {
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
      enum: Object.values(GoalType),
      required: true,
    },
    goalCategory: {
      type: String,
      enum: Object.values(GoalCategory),
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: function (this: IGoal) {
        return this.type === GoalType.INDIVIDUAL;
      },
    },
    department: {
      type: String,
      required: function (this: IGoal) {
        return this.type === GoalType.TEAM;
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    targetValue: {
      type: Number,
      required: true,
    },
    currentValue: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      enum: Object.values(Unit),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(GoalStatus),
      default: GoalStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

goalSchema.index({ assignedTo: 1, status: 1 });
goalSchema.index({ department: 1, status: 1 });
goalSchema.index({ createdBy: 1 });
goalSchema.index({ endDate: 1 });

goalSchema.pre("save", function () {
  if (this.startDate >= this.endDate) {
    throw new Error("Дата початку повинна бути раніше дати закінчення");
  }
});

goalSchema.virtual("progressPercentage").get(function (this: IGoal) {
  if (this.targetValue === 0) return 0;
  return Math.round((this.currentValue / this.targetValue) * 100);
});

goalSchema.set("toJSON", { virtuals: true });
goalSchema.set("toObject", { virtuals: true });

export const Goal = mongoose.model<IGoal>("Goal", goalSchema);
