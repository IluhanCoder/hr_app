

import type { Response } from "express";
import { ReviewTemplate } from "./reviewTemplate.model.js";
import { PerformanceReview, ReviewStatus } from "./performanceReview.model.js";
import { User } from "../user/user.model.js";
import type { AuthRequest } from "../auth/auth.types.js";



export const createTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, criteria } = req.body;
    const createdBy = req.user?.userId;

    if (!name || !description || !criteria || criteria.length === 0) {
      res.status(400).json({
        success: false,
        message: "Всі поля обов'язкові",
      });
      return;
    }

    const template = new ReviewTemplate({
      name,
      description,
      criteria,
      createdBy,
    });

    await template.save();

    const populated = await ReviewTemplate.findById(template._id).populate(
      "createdBy",
      "personalInfo email"
    );

    console.log(`✅ Review template created: ${name}`);

    res.status(201).json({
      success: true,
      data: populated,
      message: "Шаблон створено",
    });
  } catch (error) {
    console.error("❌ Error creating template:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при створенні шаблону",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const getTemplates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { isActive } = req.query;

    const query: any = {};
    if (isActive !== undefined) query.isActive = isActive === "true";

    const templates = await ReviewTemplate.find(query)
      .populate("createdBy", "personalInfo email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: templates,
      count: templates.length,
    });
  } catch (error) {
    console.error("❌ Error fetching templates:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при завантаженні шаблонів",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const getTemplateById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const template = await ReviewTemplate.findById(id).populate(
      "createdBy",
      "personalInfo email"
    );

    if (!template) {
      res.status(404).json({
        success: false,
        message: "Шаблон не знайдено",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("❌ Error fetching template:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при завантаженні шаблону",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const updateTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const template = await ReviewTemplate.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "personalInfo email");

    if (!template) {
      res.status(404).json({
        success: false,
        message: "Шаблон не знайдено",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: template,
      message: "Шаблон оновлено",
    });
  } catch (error) {
    console.error("❌ Error updating template:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при оновленні шаблону",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const deleteTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const template = await ReviewTemplate.findByIdAndDelete(id);

    if (!template) {
      res.status(404).json({
        success: false,
        message: "Шаблон не знайдено",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Шаблон видалено",
    });
  } catch (error) {
    console.error("❌ Error deleting template:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при видаленні шаблону",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};



export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeId, templateId, reviewPeriod } = req.body;
    const reviewerId = req.user?.userId;

    if (!employeeId || !templateId || !reviewPeriod) {
      res.status(400).json({
        success: false,
        message: "Всі поля обов'язкові",
      });
      return;
    }

    const employee = await User.findById(employeeId);
    if (!employee) {
      res.status(404).json({
        success: false,
        message: "Співробітник не знайдений",
      });
      return;
    }

    const template = await ReviewTemplate.findById(templateId);
    if (!template) {
      res.status(404).json({
        success: false,
        message: "Шаблон не знайдено",
      });
      return;
    }

    const review = new PerformanceReview({
      employeeId,
      reviewerId,
      templateId,
      reviewPeriod,
      status: ReviewStatus.DRAFT,
    });

    await review.save();

    const populated = await PerformanceReview.findById(review._id)
      .populate("employeeId", "personalInfo email jobInfo")
      .populate("reviewerId", "personalInfo email")
      .populate("templateId");

    console.log(`✅ Review created for employee: ${employee.email}`);

    res.status(201).json({
      success: true,
      data: populated,
      message: "Оцінку створено",
    });
  } catch (error) {
    console.error("❌ Error creating review:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при створенні оцінки",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const getReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { status, employeeId } = req.query;

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
    if (employeeId) query.employeeId = employeeId;

    if (currentUser.role === "line_manager") {
      const departmentEmployees = await User.find({
        "jobInfo.department": currentUser.jobInfo.department,
      }).select("_id");

      query.employeeId = { $in: departmentEmployees.map((e) => e._id) };
    }

    const reviews = await PerformanceReview.find(query)
      .populate("employeeId", "personalInfo email jobInfo")
      .populate("reviewerId", "personalInfo email")
      .populate("templateId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: reviews,
      count: reviews.length,
    });
  } catch (error) {
    console.error("❌ Error fetching reviews:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при завантаженні оцінок",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const getMyReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employeeId = req.user?.userId;

    const reviews = await PerformanceReview.find({ employeeId } as any)
      .populate("reviewerId", "personalInfo email")
      .populate("templateId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: reviews,
      count: reviews.length,
    });
  } catch (error) {
    console.error("❌ Error fetching my reviews:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при завантаженні оцінок",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const getReviewById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const review = await PerformanceReview.findById(id)
      .populate("employeeId", "personalInfo email jobInfo")
      .populate("reviewerId", "personalInfo email")
      .populate("templateId")
      .populate("feedback.from", "personalInfo email");

    if (!review) {
      res.status(404).json({
        success: false,
        message: "Оцінку не знайдено",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error("❌ Error fetching review:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при завантаженні оцінки",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const updateRatings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { ratings } = req.body;

    const review = await PerformanceReview.findById(id);

    if (!review) {
      res.status(404).json({
        success: false,
        message: "Оцінку не знайдено",
      });
      return;
    }

    review.ratings = ratings;
    review.status = ReviewStatus.IN_PROGRESS;
    await review.save();

    const updated = await PerformanceReview.findById(id)
      .populate("employeeId", "personalInfo email jobInfo")
      .populate("reviewerId", "personalInfo email")
      .populate("templateId");

    res.status(200).json({
      success: true,
      data: updated,
      message: "Оцінки оновлено",
    });
  } catch (error) {
    console.error("❌ Error updating ratings:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при оновленні оцінок",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const addFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user?.userId;

    if (!comment) {
      res.status(400).json({
        success: false,
        message: "Коментар обов'язковий",
      });
      return;
    }

    const review = await PerformanceReview.findById(id);

    if (!review) {
      res.status(404).json({
        success: false,
        message: "Оцінку не знайдено",
      });
      return;
    }

    review.feedback.push({
      from: userId as any,
      comment,
      createdAt: new Date(),
    });

    await review.save();

    const updated = await PerformanceReview.findById(id)
      .populate("employeeId", "personalInfo email jobInfo")
      .populate("reviewerId", "personalInfo email")
      .populate("templateId")
      .populate("feedback.from", "personalInfo email");

    res.status(200).json({
      success: true,
      data: updated,
      message: "Зворотний зв'язок додано",
    });
  } catch (error) {
    console.error("❌ Error adding feedback:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при додаванні зворотного зв'язку",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const completeReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { overallComment } = req.body;

    const review = await PerformanceReview.findById(id);

    if (!review) {
      res.status(404).json({
        success: false,
        message: "Оцінку не знайдено",
      });
      return;
    }

    const finalScore = await (review as any).calculateFinalScore();

    review.overallComment = overallComment || "";
    review.finalScore = finalScore || undefined;
    review.status = ReviewStatus.COMPLETED;
    review.completedAt = new Date();

    await review.save();

    const completed = await PerformanceReview.findById(id)
      .populate("employeeId", "personalInfo email jobInfo")
      .populate("reviewerId", "personalInfo email")
      .populate("templateId")
      .populate("feedback.from", "personalInfo email");

    console.log(`✅ Review completed for employee: ${(review.employeeId as any).email}`);

    res.status(200).json({
      success: true,
      data: completed,
      message: "Оцінку завершено",
    });
  } catch (error) {
    console.error("❌ Error completing review:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при завершенні оцінки",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const deleteReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const review = await PerformanceReview.findByIdAndDelete(id);

    if (!review) {
      res.status(404).json({
        success: false,
        message: "Оцінку не знайдено",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Оцінку видалено",
    });
  } catch (error) {
    console.error("❌ Error deleting review:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при видаленні оцінки",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}