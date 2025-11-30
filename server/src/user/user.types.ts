

import type { Document, Model } from "mongoose";
import type {
  UserRole,
  UserStatus,
  PersonalInfo,
  JobInfo,
  SalaryInfo,
  LeaveBalance,
  Skill,
  PerformanceMetrics,
  Department,
} from "../../../shared/types/user.types.js";

export interface IUserDocument extends Document {

  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;

  personalInfo: PersonalInfo;

  jobInfo: JobInfo;

  salaryInfo?: SalaryInfo;

  leaveBalance: LeaveBalance;

  skills: Skill[];

  performanceMetrics: PerformanceMetrics;
  compensation?: {
    hourlyRate?: number;
    overtimeMultiplier?: number;
    holidayMultiplier?: number;
    taxProfile?: { pitRate?: number; sscRate?: number; militaryRate?: number };
    bonusPolicy?: { fixedMonthlyBonus?: number; performanceBonusPercent?: number };
    schedule?: { dailyHours?: number };
  };

  avatarUrl?: string;

  analyticsData?: {
    riskScore?: number;
    isAtRisk?: boolean;
    riskHistory?: Array<{ riskScore: number; calculatedAt: Date }>;
    lastEngagementScore?: number;
    sentimentScore?: number;
    lastActivityDate?: Date;
  };

  highPotential?: {
    isHighPotential: boolean;
    markedBy?: any;
    markedAt?: Date;
    reason?: string;
    potentialLevel?: "high" | "critical";
  };

  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
  toPublicProfile(): PublicUserProfile;
}

export interface PublicUserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  jobTitle: string;
  department: string;
  avatarUrl?: string;
  skills: Skill[];
}

export interface FullUserProfile extends PublicUserProfile {
  personalInfo: PersonalInfo;
  jobInfo: JobInfo;
  leaveBalance: LeaveBalance;
  performanceMetrics: PerformanceMetrics;
   compensation?: IUserDocument["compensation"];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfileWithSalary extends FullUserProfile {
  salaryInfo: SalaryInfo;
  analyticsData?: IUserDocument["analyticsData"];
}

export interface IUserModel extends Model<IUserDocument> {
  findActive(): Promise<IUserDocument[]>;
  findByDepartment(department: Department): Promise<IUserDocument[]>;
  findByManager(managerId: string): Promise<IUserDocument[]>;
}
