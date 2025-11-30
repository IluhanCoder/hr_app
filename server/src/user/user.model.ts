import mongoose, { Schema, Model } from "mongoose";
import type { CallbackError } from "mongoose";
import bcrypt from "bcrypt";
import type { IUserDocument, IUserModel, PublicUserProfile } from "./user.types.js";
import {
  UserRole,
  UserStatus,
  Department,
  EmploymentType,
  Gender,
  EducationLevel,
} from "../../../shared/types/user.types.js";

const addressSchema = new Schema(
  {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  { _id: false }
);

const emergencyContactSchema = new Schema(
  {
    name: { type: String, required: true },
    relationship: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { _id: false }
);

const personalInfoSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    middleName: String,
    dateOfBirth: { type: Date, required: true },
    gender: {
      type: String,
      enum: Object.values(Gender),
    },
    phone: { type: String, required: false },
    email: { type: String, required: true },
    address: addressSchema,
    emergencyContact: emergencyContactSchema,

    ethnicity: String,
    educationLevel: {
      type: String,
      enum: Object.values(EducationLevel),
    },

    education: { type: String },
  },
  { _id: false }
);

const jobInfoSchema = new Schema(
  {
    jobTitle: { type: String, required: true },
    department: {
      type: String,
      required: true,
    },
    employmentType: {
      type: String,
      enum: Object.values(EmploymentType),
      required: true,
    },
    hireDate: { type: Date, required: true },
    terminationDate: Date,
    lineManagerId: { type: Schema.Types.ObjectId, ref: "User" },
    location: String,
  },
  { _id: false }
);

const salaryInfoSchema = new Schema(
  {
    baseSalary: { type: Number, required: true },
    currency: { type: String, default: "UAH" },
    bonuses: { type: Number, default: 0 },
    lastSalaryReview: Date,
    nextSalaryReview: Date,
  },
  { _id: false }
);

const leaveBalanceSchema = new Schema(
  {
    annual: { type: Number, required: true, default: 24 },
    sick: { type: Number, required: true, default: 10 },
    personal: { type: Number, required: true, default: 5 },
  },
  { _id: false }
);

const userSkillSchema = new Schema(
  {
    skillId: { type: Schema.Types.ObjectId, ref: "Skill", required: true },
    currentLevel: {
      type: Number,
      enum: [0, 1, 2, 3, 4],
      required: true,
      default: 0,
    },
    yearsOfExperience: { type: Number, default: 0 },
    lastAssessmentDate: { type: Date, default: Date.now },
    assessedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false }
);

const performanceMetricsSchema = new Schema(
  {
    performanceScore: { type: Number, min: 1, max: 5 },
    potentialScore: { type: Number, min: 1, max: 5 },
    lastReviewDate: Date,
    nextReviewDate: Date,
    goals: [String],
  },
  { _id: false }
);

const compensationSchema = new Schema(
  {
    hourlyRate: { type: Number, default: 200 },
    overtimeMultiplier: { type: Number, default: 1.5 },
    holidayMultiplier: { type: Number, default: 2 },
    taxProfile: {
      pitRate: { type: Number, default: 0.18 },
      sscRate: { type: Number, default: 0.221 },
      militaryRate: { type: Number, default: 0.015 },
    },
    bonusPolicy: {
      fixedMonthlyBonus: { type: Number, default: 0 },
      performanceBonusPercent: { type: Number, default: 0 },
    },
    schedule: {
      dailyHours: { type: Number, default: 8 },
    },
  },
  { _id: false }
);

const analyticsDataSchema = new Schema(
  {
    riskScore: { type: Number, min: 0, max: 100 },
    isAtRisk: { type: Boolean, default: false },
    riskHistory: [
      {
        riskScore: { type: Number, min: 0, max: 100, required: true },
        calculatedAt: { type: Date, default: Date.now },
      },
    ],
    lastEngagementScore: { type: Number, min: 0, max: 100 },
    sentimentScore: { type: Number, min: -1, max: 1 },
    lastActivityDate: Date,
  },
  { _id: false }
);

const highPotentialSchema = new Schema(
  {
    isHighPotential: { type: Boolean, default: false },
    markedBy: { type: Schema.Types.ObjectId, ref: "User" },
    markedAt: Date,
    reason: String,
    potentialLevel: {
      type: String,
      enum: ["high", "critical"],
      default: "high",
    },
  },
  { _id: false }
);

const userSchema = new Schema<IUserDocument>(
  {

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        message: "Invalid email format",
      },
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.EMPLOYEE,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      required: true,
      default: UserStatus.ACTIVE,
    },

    personalInfo: {
      type: personalInfoSchema,
      required: true,
    },
    jobInfo: {
      type: jobInfoSchema,
      required: true,
    },
    salaryInfo: salaryInfoSchema,
    leaveBalance: {
      type: leaveBalanceSchema,
      required: true,
    },
    skills: {
      type: [userSkillSchema],
      default: [],
    },
    performanceMetrics: {
      type: performanceMetricsSchema,
      default: {},
    },
    compensation: {
      type: compensationSchema,
      default: {},
    },

    avatarUrl: String,
    analyticsData: analyticsDataSchema,
    highPotential: {
      type: highPotentialSchema,
      default: { isHighPotential: false },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: any) => {
        if (ret._id) {
          ret.id = ret._id.toString();
          delete ret._id;
        }

        if (ret.personalInfo) {
          ret.firstName = ret.personalInfo.firstName || "";
          ret.lastName = ret.personalInfo.lastName || "";
        }
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

userSchema.index({ "jobInfo.department": 1 });
userSchema.index({ "jobInfo.lineManagerId": 1 });
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });
userSchema.index({ "performanceMetrics.performanceScore": 1, "performanceMetrics.potentialScore": 1 });
userSchema.index({ "highPotential.isHighPotential": 1 });

userSchema.pre("save", async function () {
  if (!this.isModified("passwordHash")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
  } catch (error) {
    return false;
  }
};

userSchema.methods.toPublicProfile = function (): PublicUserProfile {
  return {
    id: this._id.toString(),
    firstName: this.personalInfo.firstName,
    lastName: this.personalInfo.lastName,
    email: this.email,
    role: this.role,
    status: this.status,
    jobTitle: this.jobInfo.jobTitle,
    department: this.jobInfo.department,
    avatarUrl: this.avatarUrl,
    skills: this.skills,
  };
};

userSchema.statics.findActive = function () {
  return this.find({ status: UserStatus.ACTIVE });
};

userSchema.statics.findByDepartment = function (department: string) {
  return this.find({ "jobInfo.department": department, status: UserStatus.ACTIVE });
};

userSchema.statics.findByManager = function (managerId: string) {
  return this.find({ "jobInfo.lineManagerId": managerId, status: UserStatus.ACTIVE });
};

export const User: IUserModel = mongoose.model<IUserDocument, IUserModel>("User", userSchema);
