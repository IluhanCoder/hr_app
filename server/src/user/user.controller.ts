

import type { Response } from "express";
import { User } from "./user.model.js";
import type { AuthRequest } from "../auth/auth.types.js";
import { generateAuthResponse } from "../auth/auth.service.js";
import type { LoginRequest, RegisterRequest } from "../../../shared/types/auth.types.js";
import type { CreateUserDTO, UpdateUserDTO } from "../../../shared/types/user.types.js";
import { UserRole, UserStatus, Department, EmploymentType } from "../../../shared/types/user.types.js";
import { Goal, GoalType, GoalCategory, Unit, GoalStatus } from "../goal/goal.model.js";
import mongoose from "mongoose";


const getOnboardingDescription = (department: string): string => {
  const commonMaterials = [
    "📋 Корпоративна культура та цінності компанії",
    "🔐 Політика безпеки та конфіденційності",
    "💼 Правила внутрішнього розпорядку",
    "🏢 Знайомство з офісом та інфраструктурою",
    "👥 Зустріч з командою та ключовими контактами",
  ];

  const departmentSpecific: Record<string, string[]> = {
    [Department.IT]: [
      "💻 Доступ до систем та інструментів розробки",
      "📚 Технічна документація та стандарти коду",
      "🔧 Налаштування робочого середовища",
    ],
    [Department.HR]: [
      "📊 HR-системи та процеси",
      "📝 Шаблони документів",
      "🎯 KPI та метрики департаменту",
    ],
    [Department.FINANCE]: [
      "💰 Фінансові системи та звітність",
      "📈 Бюджетування та планування",
      "🔍 Комплаєнс та регуляції",
    ],
    [Department.SALES]: [
      "🎯 CRM система та робочі процеси",
      "📞 Скрипти продажів та комунікації",
      "📊 Воронка продажів та метрики",
    ],
    [Department.MARKETING]: [
      "📱 Маркетингові інструменти",
      "🎨 Брендбук та гайдлайни",
      "📈 Аналітика та звітність",
    ],
    [Department.OPERATIONS]: [
      "⚙️ Операційні процеси",
      "📦 Системи управління",
      "📊 Метрики ефективності",
    ],
    [Department.SUPPORT]: [
      "🎧 Система тікетів та CRM",
      "📚 База знань продукту",
      "🗣️ Стандарти комунікації",
    ],
  };

  const allMaterials = [
    ...commonMaterials,
    "",
    `🎯 Спеціалізовані матеріали для ${department.toUpperCase()}:`,
    ...(departmentSpecific[department] || []),
  ];

  return allMaterials.join("\n");
};


export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log("📝 Registration attempt:", req.body.email);
    const { email, password, firstName, lastName, role }: RegisterRequest & { role?: UserRole } = req.body;

    const requestedRole = role || UserRole.EMPLOYEE;
    if (requestedRole === UserRole.EMPLOYEE || requestedRole === UserRole.LINE_MANAGER) {
      res.status(403).json({
        success: false,
        message: "Співробітники не можуть самостійно реєструватися. Зверніться до HR-менеджера.",
      });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "Користувач з такою поштою вже існує",
      });
      return;
    }

    const newUser = new User({
      email,
      passwordHash: password,
      role: requestedRole,
      status: UserStatus.ACTIVE,
      personalInfo: {
        firstName,
        lastName,
        dateOfBirth: new Date("2000-01-01"),
        email,
      },
      jobInfo: {
        jobTitle: "Employee",
        department: "it",
        employmentType: EmploymentType.FULL_TIME,
        hireDate: new Date(),
      },
      leaveBalance: {
        totalDays: 24,
        usedDays: 0,
        remainingDays: 24,
        year: new Date().getFullYear(),
      },
      skills: [],
      performanceMetrics: {},
    });

    await newUser.save();

    const authResponse = generateAuthResponse(newUser);

    res.status(201).json({
      success: true,
      data: authResponse,
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;

    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user) {
      console.warn("🔐 Login failed: user not found", { email });
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      console.warn("🔐 Login failed: invalid password", { email });
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    if (user.status === UserStatus.TERMINATED) {
      res.status(403).json({
        success: false,
        message: "Account has been terminated",
      });
      return;
    }

    if (user.status === UserStatus.SUSPENDED) {
      res.status(403).json({
        success: false,
        message: "Account is suspended",
      });
      return;
    }

    const authResponse = generateAuthResponse(user);

    res.status(200).json({
      success: true,
      data: authResponse,
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const createEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, role, jobTitle, department, salary } = req.body as {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role?: UserRole;
      jobTitle?: string;
      department?: Department;
      salary?: number;
    };

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "Користувач з такою поштою вже існує",
      });
      return;
    }

    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({
        success: false,
        message: "Всі обов'язкові поля мають бути заповнені: email, password, firstName, lastName",
      });
      return;
    }

    const newEmployee = new User({
      email,
      passwordHash: password,
      role: role || UserRole.EMPLOYEE,
      status: UserStatus.ACTIVE,
      personalInfo: {
        firstName,
        lastName,
        dateOfBirth: new Date("2000-01-01"),
        email,
      },
      jobInfo: {
        jobTitle: jobTitle || "Employee",
        department: department || "it",
        employmentType: EmploymentType.FULL_TIME,
        hireDate: new Date(),
      },
      salaryInfo: salary ? {
        baseSalary: salary,
        currency: "UAH",
        bonuses: 0,
      } : undefined,
      leaveBalance: {
        totalDays: 24,
        usedDays: 0,
        remainingDays: 24,
        year: new Date().getFullYear(),
      },
      skills: [],
      performanceMetrics: {},
    });

    await newEmployee.save();

    try {
      const onboardingEndDate = new Date();
      onboardingEndDate.setDate(onboardingEndDate.getDate() + 30);

      const onboardingGoal = new Goal({
        title: "Завершити онбординг",
        description: getOnboardingDescription(department || "it"),
        type: GoalType.INDIVIDUAL,
        goalCategory: GoalCategory.OKR,
        assignedTo: newEmployee._id,
        createdBy: new mongoose.Types.ObjectId(req.user!.userId),
        startDate: new Date(),
        endDate: onboardingEndDate,
        targetValue: 100,
        currentValue: 0,
        unit: Unit.PERCENTAGE,
        status: GoalStatus.ACTIVE,
      });

      await onboardingGoal.save();
      console.log(`🎯 Onboarding goal created for: ${email} (${department || 'IT'})`);
    } catch (goalError) {
      console.error("⚠️ Failed to create onboarding goal:", goalError);

    }

    console.log(`✅ Employee created: ${email} by HR: ${req.user?.email}`);

    res.status(201).json({
      success: true,
      data: newEmployee.toPublicProfile(),
      message: "Співробітника успішно створено. Автоматично призначено онбординг Goal.",
    });
  } catch (error) {
    console.error("❌ Create employee error:", error);
    res.status(500).json({
      success: false,
      message: "Не вдалося створити співробітника",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log("📋 Fetching all users");

    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });

    const publicUsers = users.map(user => ({
      id: user._id,
      email: user.email,
      firstName: user.personalInfo?.firstName || "",
      lastName: user.personalInfo?.lastName || "",
      personalInfo: user.personalInfo,
      role: user.role,
      status: user.status,
      jobInfo: user.jobInfo,
      createdAt: user.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: publicUsers,
      count: publicUsers.length,
    });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Не вдалося завантажити список користувачів",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-passwordHash");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }


    if (
      req.user?.userId !== id &&
      req.user?.role !== UserRole.HR_MANAGER &&
      req.user?.role !== UserRole.ADMIN
    ) {
      res.status(403).json({
        success: false,
        message: "Access denied",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates: UpdateUserDTO = req.body;

    if (
      req.user?.userId !== id &&
      req.user?.role !== UserRole.HR_MANAGER &&
      req.user?.role !== UserRole.ADMIN
    ) {
      res.status(403).json({
        success: false,
        message: "Access denied",
      });
      return;
    }

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    if (updates.personalInfo) {
      user.personalInfo = { ...user.personalInfo, ...updates.personalInfo };
    }

    if (updates.jobInfo && (req.user?.role === UserRole.HR_MANAGER || req.user?.role === UserRole.ADMIN)) {
      user.jobInfo = { ...user.jobInfo, ...updates.jobInfo };
    }

    if (updates.salaryInfo && (req.user?.role === UserRole.HR_MANAGER || req.user?.role === UserRole.ADMIN)) {
      user.salaryInfo = user.salaryInfo 
        ? { ...user.salaryInfo, ...updates.salaryInfo }
        : updates.salaryInfo as any;
    }

    if (updates.skills) {
      user.skills = updates.skills;
    }

    if (updates.status && (req.user?.role === UserRole.HR_MANAGER || req.user?.role === UserRole.ADMIN)) {
      user.status = updates.status;
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: user,
      message: "User updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.user?.userId === id) {
      res.status(403).json({
        success: false,
        message: "Ви не можете деактивувати свій власний обліковий запис",
      });
      return;
    }

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    user.status = UserStatus.TERMINATED;
    user.jobInfo.terminationDate = new Date();

    await user.save();

    console.log(`✅ User deactivated: ${user.email} by HR: ${req.user?.userId}`);

    res.status(200).json({
      success: true,
      message: "Користувача успішно деактивовано",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const getUsersByDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { department } = req.params;

    const users = await User.findByDepartment(department as Department);

    res.status(200).json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users by department",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const getManagerTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { managerId } = req.params;

    if (!managerId) {
      res.status(400).json({
        success: false,
        message: "Manager ID is required",
      });
      return;
    }

    const team = await User.findByManager(managerId);

    res.status(200).json({
      success: true,
      data: team,
      count: team.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch team",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const getDepartments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {

    const departments = await User.distinct("jobInfo.department");

    const validDepartments = departments.filter(dept => dept);
    
    res.status(200).json({
      success: true,
      data: validDepartments,
      count: validDepartments.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch departments",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const transferDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newDepartment, removeAsManager } = req.body;

    if (!newDepartment) {
      res.status(400).json({
        success: false,
        message: "Новий відділ обов'язковий",
      });
      return;
    }

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Користувача не знайдено",
      });
      return;
    }

    const oldDepartment = user.jobInfo?.department;

    const { Department } = await import("../department/department.model.js");

    const managedDepartments = await Department.find({ 
      managerId: new mongoose.Types.ObjectId(id), 
      isActive: true 
    });

    if (managedDepartments.length > 0 && !removeAsManager) {

      res.status(400).json({
        success: false,
        message: "Користувач є менеджером відділу",
        requiresConfirmation: true,
        managedDepartments: managedDepartments.map(dept => ({
          id: dept._id,
          name: dept.name,
          code: dept.code
        }))
      });
      return;
    }

    if (removeAsManager && managedDepartments.length > 0) {
      for (const dept of managedDepartments) {
        dept.managerId = null as any;
        await dept.save();
      }
    }

    if (user.jobInfo) {
      user.jobInfo.department = newDepartment;
    } else {
      user.jobInfo = {
        jobTitle: "",
        department: newDepartment,
        startDate: new Date(),
      } as any;
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: user,
      message: `Співробітника переміщено з ${oldDepartment || "без відділу"} до ${newDepartment}${
        removeAsManager ? ". Знято з посади менеджера" : ""
      }`,
    });
  } catch (error) {
    console.error("❌ Error transferring department:", error);
    res.status(500).json({
      success: false,
      message: "Не вдалося перемістити співробітника",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const updateUserSkills = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { skills } = req.body;

    if (
      req.user?.userId !== id &&
      req.user?.role !== UserRole.HR_MANAGER &&
      req.user?.role !== UserRole.ADMIN
    ) {
      res.status(403).json({
        success: false,
        message: "Ви не маєте прав для оновлення навичок цього користувача",
      });
      return;
    }

    if (!Array.isArray(skills)) {
      res.status(400).json({
        success: false,
        message: "Skills повинен бути масивом",
      });
      return;
    }

    for (const skill of skills) {
      if (!skill.skillId || skill.currentLevel === undefined) {
        res.status(400).json({
          success: false,
          message: "Кожна навичка повинна містити skillId та currentLevel",
        });
        return;
      }

      if (![0, 1, 2, 3, 4].includes(skill.currentLevel)) {
        res.status(400).json({
          success: false,
          message: "currentLevel повинен бути 0, 1, 2, 3 або 4",
        });
        return;
      }
    }

    const updatedSkills = skills.map((skill: any) => ({
      skillId: new mongoose.Types.ObjectId(skill.skillId),
      currentLevel: skill.currentLevel,
      yearsOfExperience: skill.yearsOfExperience || 0,
      lastAssessmentDate: new Date(),
      assessedBy: req.user?.userId,
    }));

    const user = await User.findByIdAndUpdate(
      id,
      { skills: updatedSkills },
      { new: true, runValidators: true }
    ).populate("skills.skillId", "name category");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Користувача не знайдено",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user.skills,
      message: "Навички успішно оновлено",
    });
  } catch (error) {
    console.error("❌ Error updating user skills:", error);
    res.status(500).json({
      success: false,
      message: "Не вдалося оновити навички",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const getUserSkills = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select("skills")
      .populate("skills.skillId", "name description category")
      .populate("skills.assessedBy", "personalInfo.firstName personalInfo.lastName");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Користувача не знайдено",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user.skills,
    });
  } catch (error) {
    console.error("❌ Error getting user skills:", error);
    res.status(500).json({
      success: false,
      message: "Не вдалося отримати навички",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
