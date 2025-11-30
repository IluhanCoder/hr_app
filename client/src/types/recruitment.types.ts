
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

export interface Interviewer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface InterviewFeedback {
  from: Interviewer;
  rating: number;
  comment: string;
  recommendation: "strong_yes" | "yes" | "maybe" | "no" | "strong_no";
  createdAt: string;
}

export interface Interview {
  _id: string;
  scheduledAt: string;
  interviewers: Interviewer[];
  location?: string;
  meetingLink?: string;
  notes?: string;
  feedback?: InterviewFeedback[];
  status: "scheduled" | "completed" | "cancelled";
}

export interface StageHistory {
  stage: RecruitmentStage;
  movedBy: {
    firstName: string;
    lastName: string;
  };
  movedAt: string;
  notes?: string;
}

export interface Offer {
  position: string;
  salary: number;
  currency: string;
  startDate: string;
  benefits?: string[];
  generatedBy: {
    firstName: string;
    lastName: string;
  };
  generatedAt: string;
  sentAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
}

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  
  position: string;
  department: string;
  
  currentStage: RecruitmentStage;
  status: CandidateStatus;
  
  interviews: Interview[];
  stageHistory: StageHistory[];
  
  offer?: Offer;
  
  source?: string;
  appliedAt: string;
  
  createdBy: {
    firstName: string;
    lastName: string;
  };
  assignedTo?: {
    firstName: string;
    lastName: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateCandidateDTO {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  jobProfileId: string;
  department: string;
  source?: string;
  assignedTo?: string;
  skills?: Array<{
    skillId: string;
    currentLevel: number;
    yearsOfExperience?: number;
  }>;
}

export interface MoveCandidateDTO {
  stage: RecruitmentStage;
  notes?: string;
  interview?: {
    scheduledAt: string;
    interviewers: string[];
    location?: string;
    meetingLink?: string;
    notes?: string;
  };
}

export interface AddFeedbackDTO {
  rating: number;
  comment: string;
  recommendation: "strong_yes" | "yes" | "maybe" | "no" | "strong_no";
}

export interface GenerateOfferDTO {
  position: string;
  salary: number;
  currency?: string;
  startDate: string;
  benefits?: string[];
}

export interface UpdateOfferStatusDTO {
  status: "accepted" | "rejected";
  rejectionReason?: string;
}

export interface RecruitmentStats {
  byStage: { _id: string; count: number }[];
  byStatus: { _id: string; count: number }[];
}
