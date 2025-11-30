

import mongoose, { Schema, Model } from "mongoose";

export enum SkillLevel {
  NONE = 0,
  BEGINNER = 1,
  INTERMEDIATE = 2,
  ADVANCED = 3,
  EXPERT = 4,
}

export enum SkillCategory {
  TECHNICAL = "technical",
  SOFT_SKILLS = "soft_skills",
  MANAGEMENT = "management",
  LANGUAGE = "language",
  DOMAIN = "domain",
  TOOLS = "tools",
}

export interface ISkill {
  _id: string;
  name: string;
  description: string;
  category: SkillCategory;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const skillSchema = new Schema<ISkill>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: Object.values(SkillCategory),
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: any) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

skillSchema.index({ name: 1 });
skillSchema.index({ category: 1 });
skillSchema.index({ isActive: 1 });

export const Skill = mongoose.model<ISkill>("Skill", skillSchema);

export interface IJobProfile {
  _id: string;
  jobTitle: string;
  department?: string;
  description: string;
  requiredSkills: Array<{
    skillId: mongoose.Types.ObjectId;
    requiredLevel: SkillLevel;
    weight: number;
    isMandatory: boolean;
  }>;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const jobProfileSchema = new Schema<IJobProfile>(
  {
    jobTitle: {
      type: String,
      required: true,
    },
    department: {
      type: String,
    },
    description: {
      type: String,
      required: false,
    },
    requiredSkills: [
      {
        skillId: {
          type: Schema.Types.ObjectId,
          ref: "Skill",
          required: true,
        },
        requiredLevel: {
          type: Number,
          enum: [0, 1, 2, 3, 4],
          required: true,
        },
        weight: {
          type: Number,
          min: 0,
          max: 100,
          default: 50,
        },
        isMandatory: {
          type: Boolean,
          default: true,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: any) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

jobProfileSchema.index({ jobTitle: 1 });
jobProfileSchema.index({ department: 1 });
jobProfileSchema.index({ isActive: 1 });

export const JobProfile = mongoose.model<IJobProfile>("JobProfile", jobProfileSchema);
