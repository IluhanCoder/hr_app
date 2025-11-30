

import type { Response } from "express";
import { Goal, GoalType, GoalStatus } from "./goal.model.js";
import { ProgressUpdate } from "./progress.model.js";
import { User } from "../user/user.model.js";
import type { AuthRequest } from "../auth/auth.types.js";


export const createGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      type,
      goalCategory,
      assignedTo,
      department,
      startDate,
      endDate,
      targetValue,
      unit,
    } = req.body;
    const createdBy = req.user?.userId;

    if (
      !title ||
      !description ||
      !type ||
      !goalCategory ||
      !startDate ||
      !endDate ||
      !targetValue ||
      !unit
    ) {
      res.status(400).json({
        success: false,
        message: "Всі обов'язкові поля повинні бути заповнені",
      });
      return;
    }

    if (type === GoalType.INDIVIDUAL && !assignedTo) {
      res.status(400).json({
        success: false,
        message: "Для індивідуальної цілі потрібно вказати співробітника",
      });
      return;
    }

    if (type === GoalType.TEAM && !department) {
      res.status(400).json({
        success: false,
        message: "Для командної цілі потрібно вказати відділ",
      });
      return;
    }

    const manager = await User.findById(createdBy);
    if (!manager) {
      res.status(404).json({
        success: false,
        message: "Менеджер не знайдений",
      });
      return;
    }

    if (manager.role === "line_manager" && type === GoalType.INDIVIDUAL) {
      const employee = await User.findById(assignedTo);
      if (!employee || employee.jobInfo.department !== manager.jobInfo.department) {
        res.status(403).json({
          success: false,
          message: "Ви можете створювати цілі тільки для співробітників свого відділу",
        });
        return;
      }
    }

    const goal = new Goal({
      title,
      description,
      type,
      goalCategory,
      assignedTo: type === GoalType.INDIVIDUAL ? assignedTo : undefined,
      department: type === GoalType.TEAM ? department : undefined,
      createdBy,
      startDate,
      endDate,
      targetValue,
      currentValue: 0,
      unit,
      status: GoalStatus.ACTIVE,
    });

    await goal.save();

    const populated = await Goal.findById(goal._id)
      .populate("assignedTo", "personalInfo email jobInfo")
      .populate("createdBy", "personalInfo email");

    console.log(`✅ Goal created: ${title} by ${manager.email}`);

    res.status(201).json({
      success: true,
      data: populated,
      message: "Ціль успішно створена",
    });
  } catch (error) {
    console.error("❌ Error creating goal:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при створенні цілі",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const getGoals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { status, type, goalCategory } = req.query;

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      res.status(404).json({
        success: false,
        message: "Користувач не знайдений",
      });
      return;
    }

    const query: any = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (goalCategory) query.goalCategory = goalCategory;

    if (currentUser.role === "line_manager") {

      query.$or = [
        { department: currentUser.jobInfo.department },
        {
          type: GoalType.INDIVIDUAL,
          assignedTo: {
            $in: (
              await User.find({ "jobInfo.department": currentUser.jobInfo.department }).select("_id")
            ).map((u) => u._id),
          },
        },
      ];
    }


    const goals = await Goal.find(query)
      .populate("assignedTo", "personalInfo email jobInfo")
      .populate("createdBy", "personalInfo email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: goals,
      count: goals.length,
    });
  } catch (error) {
    console.error("❌ Error fetching goals:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при завантаженні цілей",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const getMyGoals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { status } = req.query;

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      res.status(404).json({
        success: false,
        message: "Користувач не знайдений",
      });
      return;
    }

    const query: any = {
      $or: [
        { assignedTo: userId },
        { department: currentUser.jobInfo.department, type: GoalType.TEAM },
      ],
    };

    if (status) query.status = status;

    const goals = await Goal.find(query)
      .populate("createdBy", "personalInfo email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: goals,
      count: goals.length,
    });
  } catch (error) {
    console.error("❌ Error fetching my goals:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при завантаженні ваших цілей",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const getGoalById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const goal = await Goal.findById(id)
      .populate("assignedTo", "personalInfo email jobInfo")
      .populate("createdBy", "personalInfo email");

    if (!goal) {
      res.status(404).json({
        success: false,
        message: "Ціль не знайдена",
      });
      return;
    }

    const progressHistory = await ProgressUpdate.find({ goalId: id } as any)
      .populate("updatedBy", "personalInfo email")
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      data: {
        goal,
        progressHistory,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching goal details:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при завантаженні деталей цілі",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const updateGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const goal = await Goal.findById(id);

    if (!goal) {
      res.status(404).json({
        success: false,
        message: "Ціль не знайдена",
      });
      return;
    }

    const allowedUpdates = [
      "title",
      "description",
      "targetValue",
      "endDate",
      "status",
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        (goal as any)[field] = updates[field];
      }
    });

    await goal.save();

    const updated = await Goal.findById(id)
      .populate("assignedTo", "personalInfo email jobInfo")
      .populate("createdBy", "personalInfo email");

    res.status(200).json({
      success: true,
      data: updated,
      message: "Ціль оновлена",
    });
  } catch (error) {
    console.error("❌ Error updating goal:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при оновленні цілі",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const deleteGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const goal = await Goal.findByIdAndDelete(id);

    if (!goal) {
      res.status(404).json({
        success: false,
        message: "Ціль не знайдена",
      });
      return;
    }

    await ProgressUpdate.deleteMany({ goalId: id } as any);

    res.status(200).json({
      success: true,
      message: "Ціль видалена",
    });
  } catch (error) {
    console.error("❌ Error deleting goal:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при видаленні цілі",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const updateProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newValue, comment } = req.body;
    const userId = req.user?.userId;

    if (newValue === undefined) {
      res.status(400).json({
        success: false,
        message: "Нове значення обов'язкове",
      });
      return;
    }

    const goal = await Goal.findById(id);

    if (!goal) {
      res.status(404).json({
        success: false,
        message: "Ціль не знайдена",
      });
      return;
    }

    const progressUpdate = new ProgressUpdate({
      goalId: id,
      updatedBy: userId,
      previousValue: goal.currentValue,
      newValue: parseFloat(newValue),
      comment,
      timestamp: new Date(),
    });

    await progressUpdate.save();

    goal.currentValue = parseFloat(newValue);

    if (goal.currentValue >= goal.targetValue) {
      goal.status = GoalStatus.COMPLETED;
    }

    await goal.save();

    const updated = await Goal.findById(id)
      .populate("assignedTo", "personalInfo email jobInfo")
      .populate("createdBy", "personalInfo email");

    const populatedUpdate = await ProgressUpdate.findById(progressUpdate._id).populate(
      "updatedBy",
      "personalInfo email"
    );

    console.log(`📈 Progress updated for goal ${id}: ${goal.currentValue}/${goal.targetValue}`);

    res.status(200).json({
      success: true,
      data: {
        goal: updated,
        update: populatedUpdate,
      },
      message: "Прогрес оновлено",
    });
  } catch (error) {
    console.error("❌ Error updating progress:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при оновленні прогресу",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
