

import type { Response } from "express";
import type { AuthRequest } from "../auth/auth.types.js";
import { Report, type ReportFilter } from "./reports.model.js";
import { User } from "../user/user.model.js";
import { Candidate } from "../recruitment/recruitment.model.js";
import { Goal } from "../goal/goal.model.js";
import mongoose from "mongoose";


const applyFilters = (filters: ReportFilter[]): any => {
  const query: any = {};

  filters.forEach((filter) => {
    const { field, operator, value } = filter;

    switch (operator) {
      case "equals":
        query[field] = value;
        break;
      case "not_equals":
        query[field] = { $ne: value };
        break;
      case "contains":
        query[field] = { $regex: value, $options: "i" };
        break;
      case "gt":
        query[field] = { $gt: value };
        break;
      case "gte":
        query[field] = { $gte: value };
        break;
      case "lt":
        query[field] = { $lt: value };
        break;
      case "lte":
        query[field] = { $lte: value };
        break;
      case "in":
        query[field] = { $in: Array.isArray(value) ? value : [value] };
        break;
    }
  });

  return query;
};


export const generateReport = async (req: AuthRequest, res: Response) => {
  try {
    const {
      entityType,
      fields,
      filters = [],
      sort,
      aggregations = [],
      saveReport,
      reportName,
      reportDescription,
    } = req.body;

    if (!entityType || !fields || fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "entityType та fields є обов'язковими",
      });
    }

    let Model: any;
    let populateFields: string[] = [];

    switch (entityType) {
      case "users":
        Model = User;
        break;
      case "candidates":
        Model = Candidate;
        populateFields = ["createdBy", "assignedTo", "interviews.interviewers"];
        break;
      case "goals":
        Model = Goal;
        populateFields = ["assignedTo", "createdBy"];
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Невідомий тип сутності",
        });
    }

    const filterQuery = applyFilters(filters);

    let query = Model.find(filterQuery);

    populateFields.forEach((field) => {
      query = query.populate(field, "email personalInfo");
    });

    if (sort) {
      const sortOrder = sort.order === "desc" ? -1 : 1;
      query = query.sort({ [sort.field]: sortOrder });
    }

    const data = await query.lean();

    const projectedData = data.map((item: any) => {
      const projected: any = {};
      fields.forEach((field: string) => {

        const value = field.split(".").reduce((obj: any, key: string) => obj?.[key], item);
        projected[field] = value;
      });
      return projected;
    });

    let aggregationResults: any = {};
    if (aggregations.length > 0) {
      for (const agg of aggregations) {
        const { function: aggFunc, field, alias } = agg;

        let result: any;
        switch (aggFunc) {
          case "count":
            result = data.length;
            break;
          case "sum":
            result = data.reduce((sum: number, item: any) => {
              const value = field.split(".").reduce((obj: any, key: string) => obj?.[key], item);
              return sum + (parseFloat(value) || 0);
            }, 0);
            break;
          case "avg":
            const sum = data.reduce((s: number, item: any) => {
              const value = field.split(".").reduce((obj: any, key: string) => obj?.[key], item);
              return s + (parseFloat(value) || 0);
            }, 0);
            result = data.length > 0 ? sum / data.length : 0;
            break;
          case "min":
            const minValues = data.map((item: any) => {
              const value = field.split(".").reduce((obj: any, key: string) => obj?.[key], item);

              if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
                return new Date(value).getTime();
              }
              return parseFloat(value) || Infinity;
            }).filter((v: number) => v !== Infinity);
            
            if (minValues.length > 0) {
              const minValue = Math.min(...minValues);

              result = minValue > 946684800000 ? new Date(minValue).toISOString() : minValue;
            } else {
              result = null;
            }
            break;
          case "max":
            const maxValues = data.map((item: any) => {
              const value = field.split(".").reduce((obj: any, key: string) => obj?.[key], item);

              if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
                return new Date(value).getTime();
              }
              return parseFloat(value) || -Infinity;
            }).filter((v: number) => v !== -Infinity);
            
            if (maxValues.length > 0) {
              const maxValue = Math.max(...maxValues);

              result = maxValue > 946684800000 ? new Date(maxValue).toISOString() : maxValue;
            } else {
              result = null;
            }
            break;
        }

        aggregationResults[alias] = result;
      }
    }

    let savedReport = null;
    if (saveReport && reportName) {
      savedReport = new Report({
        name: reportName,
        description: reportDescription,
        createdBy: req.user!.userId,
        entityType,
        fields,
        filters,
        sort,
        aggregations,
        isPublic: false,
        lastRun: new Date(),
        runCount: 1,
      });
      await savedReport.save();
    } else if (saveReport) {
      return res.status(400).json({
        success: false,
        message: "Для збереження звіту потрібна назва",
      });
    }

    res.json({
      success: true,
      data: {
        rows: projectedData,
        aggregations: aggregationResults,
        totalRows: projectedData.length,
        reportId: savedReport?._id,
      },
    });
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при генерації звіту",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const getSavedReports = async (req: AuthRequest, res: Response) => {
  try {
    const reports = await Report.find({
      $or: [
        { createdBy: req.user!.userId },
        { isPublic: true },
      ],
    })
      .populate("createdBy", "email personalInfo")
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при отриманні звітів",
    });
  }
};


export const runSavedReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Звіт не знайдено",
      });
    }

    if (
      report.createdBy.toString() !== req.user!.userId &&
      !report.isPublic
    ) {
      return res.status(403).json({
        success: false,
        message: "Доступ заборонено",
      });
    }

    report.lastRun = new Date();
    report.runCount += 1;
    await report.save();

    req.body = {
      entityType: report.entityType,
      fields: report.fields,
      filters: report.filters,
      sort: report.sort,
      aggregations: report.aggregations,
      saveReport: false,
    };

    return generateReport(req, res);
  } catch (error) {
    console.error("Error running report:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при виконанні звіту",
    });
  }
};


export const deleteReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Звіт не знайдено",
      });
    }

    if (report.createdBy.toString() !== req.user!.userId) {
      return res.status(403).json({
        success: false,
        message: "Тільки автор може видалити звіт",
      });
    }

    await Report.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Звіт видалено",
    });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при видаленні звіту",
    });
  }
};


export const getAvailableFields = async (req: AuthRequest, res: Response) => {
  try {
    const { entityType } = req.params;

    let fields: Record<string, string> = {};

    switch (entityType) {
      case "users":
        fields = {
          "email": "Email",
          "role": "Роль",
          "status": "Статус",
          "personalInfo.firstName": "Ім'я",
          "personalInfo.lastName": "Прізвище",
          "personalInfo.phone": "Телефон",
          "jobInfo.jobTitle": "Посада",
          "jobInfo.department": "Відділ",
          "jobInfo.employmentType": "Тип зайнятості",
          "jobInfo.hireDate": "Дата найму",
          "salaryInfo.baseSalary": "Зарплата",
          "salaryInfo.currency": "Валюта",
          "salaryInfo.bonuses": "Бонуси",
          "leaveBalance.totalDays": "Всього днів відпустки",
          "leaveBalance.usedDays": "Використано днів",
          "leaveBalance.remainingDays": "Залишилось днів",
        };
        break;
      case "candidates":
        fields = {
          "firstName": "Ім'я",
          "lastName": "Прізвище",
          "email": "Email",
          "phone": "Телефон",
          "position": "Позиція",
          "department": "Відділ",
          "currentStage": "Поточний етап",
          "status": "Статус",
          "source": "Джерело",
          "offer.salary": "Зарплата в оффері",
          "offer.status": "Статус оффера",
        };
        break;
      case "goals":
        fields = {
          "title": "Назва",
          "type": "Тип",
          "goalCategory": "Категорія",
          "department": "Відділ",
          "status": "Статус",
          "targetValue": "Цільове значення",
          "currentValue": "Поточне значення",
          "unit": "Одиниця виміру",
          "progressPercentage": "Прогрес %",
        };
        break;
      case "reviews":
        fields = {
          "type": "Тип",
          "status": "Статус",
          "startDate": "Дата початку",
          "endDate": "Дата закінчення",
          "overallScore": "Загальна оцінка",
        };
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Невідомий тип сутності",
        });
    }

    res.json({
      success: true,
      data: fields,
    });
  } catch (error) {
    console.error("Error fetching fields:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при отриманні полів",
    });
  }
};
