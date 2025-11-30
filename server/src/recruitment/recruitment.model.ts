

import mongoose, { Schema, Document } from "mongoose";

export enum RecruitmentStage {
  APPLICATION = "application",
  SCREENING = "screening",
  TECHNICAL_INTERVIEW = "technical",
  HR_INTERVIEW = "hr_interview",
  FINAL_INTERVIEW = "final",
  OFFER = "offer",
  HIRED = "hired",
  REJECTED = "rejected",
}

export enum CandidateStatus {
  ACTIVE = "active",
  ON_HOLD = "on_hold",
  REJECTED = "rejected",
  HIRED = "hired",
  WITHDRAWN = "withdrawn",
}

export interface IInterview {
  scheduledAt: Date;
  interviewers: mongoose.Types.ObjectId[];
  location?: string;
  meetingLink?: string;
  notes?: string;
  feedback?: IInterviewFeedback[];
  status: "scheduled" | "completed" | "cancelled";
}

export interface IInterviewFeedback {
  from: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  recommendation: "strong_yes" | "yes" | "maybe" | "no" | "strong_no";
  createdAt: Date;
}

export interface IStageHistory {
  stage: RecruitmentStage;
  movedBy: mongoose.Types.ObjectId;
  movedAt: Date;
  notes?: string;
}

export interface IOffer {
  position: string;
  salary: number;
  currency: string;
  startDate: Date;
  benefits?: string[];
  generatedBy: mongoose.Types.ObjectId;
  generatedAt: Date;
  sentAt?: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
}

export interface ICandidate extends Document {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  linkedinUrl?: string;

  jobProfileId: mongoose.Types.ObjectId;
  department: string;

  skills?: Array<{
    skillId: mongoose.Types.ObjectId;
    currentLevel: number;
    yearsOfExperience?: number;
  }>;

  currentStage: RecruitmentStage;
  status: CandidateStatus;

  interviews: IInterview[];

  stageHistory: IStageHistory[];

  offer?: IOffer;

  source?: string;
  appliedAt: Date;

  createdBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
}

const interviewFeedbackSchema = new Schema<IInterviewFeedback>({
  from: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  comment: {
    type: String,
    required: true,
  },
  recommendation: {
    type: String,
    enum: ["strong_yes", "yes", "maybe", "no", "strong_no"],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const interviewSchema = new Schema<IInterview>({
  scheduledAt: {
    type: Date,
    required: true,
  },
  interviewers: [{
    type: Schema.Types.ObjectId,
    ref: "User",
  }],
  location: String,
  meetingLink: String,
  notes: String,
  feedback: {
    type: [interviewFeedbackSchema],
    default: [],
  },
  status: {
    type: String,
    enum: ["scheduled", "completed", "cancelled"],
    default: "scheduled",
  },
});

const stageHistorySchema = new Schema<IStageHistory>({
  stage: {
    type: String,
    enum: Object.values(RecruitmentStage),
    required: true,
  },
  movedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  movedAt: {
    type: Date,
    default: Date.now,
  },
  notes: String,
});

const offerSchema = new Schema<IOffer>({
  position: {
    type: String,
    required: true,
  },
  salary: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: "UAH",
  },
  startDate: {
    type: Date,
    required: true,
  },
  benefits: [String],
  generatedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  },
  sentAt: Date,
  acceptedAt: Date,
  rejectedAt: Date,
  rejectionReason: String,
  status: {
    type: String,
    enum: ["draft", "sent", "accepted", "rejected", "expired"],
    default: "draft",
  },
});

const candidateSchema = new Schema<ICandidate>(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    phone: String,
    resumeUrl: String,
    linkedinUrl: String,
    
    jobProfileId: {
      type: Schema.Types.ObjectId,
      ref: "JobProfile",
      required: true,
    },
    department: {
      type: String,
      required: true,
    },

    skills: [{
      skillId: {
        type: Schema.Types.ObjectId,
        ref: "Skill",
      },
      currentLevel: {
        type: Number,
        enum: [0, 1, 2, 3, 4],
        default: 0,
      },
      yearsOfExperience: {
        type: Number,
        default: 0,
      },
    }],
    
    currentStage: {
      type: String,
      enum: Object.values(RecruitmentStage),
      default: RecruitmentStage.APPLICATION,
    },
    status: {
      type: String,
      enum: Object.values(CandidateStatus),
      default: CandidateStatus.ACTIVE,
    },
    
    interviews: {
      type: [interviewSchema],
      default: [],
    },
    
    stageHistory: {
      type: [stageHistorySchema],
      default: [],
    },
    
    offer: offerSchema,
    
    source: String,
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret: any) {
        if (ret._id) {
          ret.id = ret._id.toString();
          delete ret._id;
        }

        if (ret.offer && ret.offer.position) {
          ret.position = ret.offer.position;
        } else if (ret.jobProfileId && typeof ret.jobProfileId === "object" && ret.jobProfileId.jobTitle) {
          ret.position = ret.jobProfileId.jobTitle;
        }
        return ret;
      },
    },
  }
);

candidateSchema.index({ email: 1 });
candidateSchema.index({ currentStage: 1, status: 1 });
candidateSchema.index({ assignedTo: 1 });
candidateSchema.index({ jobProfileId: 1, department: 1 });

export const Candidate = mongoose.model<ICandidate>("Candidate", candidateSchema);
