
export declare enum UserRole {
    EMPLOYEE = "employee",
    LINE_MANAGER = "line_manager",
    HR_MANAGER = "hr_manager",
    HR_ANALYST = "hr_analyst",
    RECRUITER = "recruiter",
    ADMIN = "admin"
}
export declare enum UserStatus {
    ACTIVE = "active",
    ON_LEAVE = "on_leave",
    TERMINATED = "terminated",
    SUSPENDED = "suspended"
}
export declare enum Department {
    IT = "it",
    HR = "hr",
    FINANCE = "finance",
    SALES = "sales",
    MARKETING = "marketing",
    OPERATIONS = "operations",
    SUPPORT = "support"
}
export declare enum EmploymentType {
    FULL_TIME = "full_time",
    PART_TIME = "part_time",
    CONTRACT = "contract",
    INTERN = "intern"
}
export interface UserCredentials {
    email: string;
    password: string;
}
export interface UserBasicInfo {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    avatarUrl?: string;
}
export interface PersonalInfo {
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: Date;
    phone: string;
    email: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    };
    emergencyContact?: {
        name: string;
        relationship: string;
        phone: string;
    };
}
export interface JobInfo {
    jobTitle: string;
    department: Department;
    employmentType: EmploymentType;
    hireDate: Date;
    terminationDate?: Date;
    lineManagerId?: string;
    location?: string;
}
export interface SalaryInfo {
    baseSalary: number;
    currency: string;
    bonuses?: number;
    lastSalaryReview?: Date;
    nextSalaryReview?: Date;
}
export interface LeaveBalance {
    totalDays: number;
    usedDays: number;
    remainingDays: number;
    year: number;
}
export interface Skill {
    name: string;
    level: "beginner" | "intermediate" | "advanced" | "expert";
    yearsOfExperience?: number;
}
export interface PerformanceMetrics {
    performanceScore?: number;
    potentialScore?: number;
    lastReviewDate?: Date;
    nextReviewDate?: Date;
    goals?: string[];
}
export interface UserProfile extends UserBasicInfo {
    status: UserStatus;
    personalInfo: PersonalInfo;
    jobInfo: JobInfo;
    salaryInfo?: SalaryInfo;
    leaveBalance: LeaveBalance;
    skills: Skill[];
    performanceMetrics: PerformanceMetrics;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateUserDTO extends Omit<PersonalInfo, "email"> {
    email: string;
    password: string;
    role: UserRole;
    jobInfo: JobInfo;
    salaryInfo?: SalaryInfo;
}
export interface UpdateUserDTO {
    personalInfo?: Partial<PersonalInfo>;
    jobInfo?: Partial<JobInfo>;
    salaryInfo?: Partial<SalaryInfo>;
    skills?: Skill[];
    status?: UserStatus;
}
