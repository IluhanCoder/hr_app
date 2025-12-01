

import type { Response } from "express";
import { LeaveRequest, LeaveStatus, LeaveType } from "./leave.model.js";
import { User } from "../user/user.model.js";
import type { AuthRequest } from "../auth/auth.types.js";


export const createLeaveRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const employeeId = req.user?.userId;

    if (!employeeId) {
      res.status(401).json({
        success: false,
        message: "Користувач не авторизований",
      });
      return;
    }

    if (!leaveType || !startDate || !endDate || !reason) {
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

    const manager = await User.findOne({
      "jobInfo.department": employee.jobInfo.department,
      role: { $in: ["line_manager", "hr_manager"] },
    });

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = calculateBusinessDays(start, end);

    if (leaveType === LeaveType.ANNUAL && employee.leaveBalance.annual < totalDays) {
      res.status(400).json({
        success: false,
        message: `Недостатньо днів щорічної відпустки. Доступно: ${employee.leaveBalance.annual}`,
      });
      return;
    }

    if (leaveType === LeaveType.SICK && employee.leaveBalance.sick < totalDays) {
      res.status(400).json({
        success: false,
        message: `Недостатньо днів лікарняних. Доступно: ${employee.leaveBalance.sick}`,
      });
      return;
    }

    if (leaveType === LeaveType.PERSONAL && employee.leaveBalance.personal < totalDays) {
      res.status(400).json({
        success: false,
        message: `Недостатньо особистих днів. Доступно: ${employee.leaveBalance.personal}`,
      });
      return;
    }

    const leaveRequest = new LeaveRequest({
      employeeId,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
      managerId: manager?._id,
    });

    await leaveRequest.save();

    const populated = await LeaveRequest.findById(leaveRequest._id)
      .populate("employeeId", "personalInfo email jobInfo")
      .populate("managerId", "personalInfo email");

    console.log(`✅ Leave request created: ${employee.email} - ${totalDays} days`);

    res.status(201).json({
      success: true,
      data: populated,
      message: "Запит на відпустку створено успішно",
    });
  } catch (error) {
    console.error("❌ Error creating leave request:", error);
    res.status(500).json({
      success: false,
      message: "Не вдалося створити запит на відпустку",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const getMyLeaveRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employeeId = req.user?.userId;

    const requests = await LeaveRequest.find({ employeeId: employeeId as any })
      .populate("managerId", "personalInfo email")
      .populate("reviewedBy", "personalInfo email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: requests,
      count: requests.length,
    });
  } catch (error) {
    console.error("❌ Error fetching leave requests:", error);
    res.status(500).json({
      success: false,
      message: "Не вдалося завантажити запити",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const getPendingLeaveRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const managerId = req.user?.userId;

    const requests = await LeaveRequest.find({
      managerId: managerId as any,
      status: LeaveStatus.PENDING,
    })
      .populate("employeeId", "personalInfo email jobInfo")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: requests,
      count: requests.length,
    });
  } catch (error) {
    console.error("❌ Error fetching pending requests:", error);
    res.status(500).json({
      success: false,
      message: "Не вдалося завантажити запити",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const getAllLeaveRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, employeeId } = req.query;
    const userId = req.user?.userId;

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


    const requests = await LeaveRequest.find(query)
      .populate("employeeId", "personalInfo email jobInfo")
      .populate("managerId", "personalInfo email")
      .populate("reviewedBy", "personalInfo email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: requests,
      count: requests.length,
    });
  } catch (error) {
    console.error("❌ Error fetching all requests:", error);
    res.status(500).json({
      success: false,
      message: "Не вдалося завантажити запити",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const approveLeaveRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const reviewerId = req.user?.userId;

    const leaveRequest = await LeaveRequest.findById(id).populate("employeeId");

    if (!leaveRequest) {
      res.status(404).json({
        success: false,
        message: "Запит не знайдено",
      });
      return;
    }

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      res.status(400).json({
        success: false,
        message: "Запит вже оброблено",
      });
      return;
    }

    leaveRequest.status = LeaveStatus.APPROVED;
    leaveRequest.reviewedBy = reviewerId as any;
    leaveRequest.reviewedAt = new Date();
    leaveRequest.reviewComment = comment;

    await leaveRequest.save();

    const employee = await User.findById(leaveRequest.employeeId);
    if (employee) {
      switch (leaveRequest.leaveType) {
        case LeaveType.ANNUAL:
          employee.leaveBalance.annual -= leaveRequest.totalDays;
          break;
        case LeaveType.SICK:
          employee.leaveBalance.sick -= leaveRequest.totalDays;
          break;
        case LeaveType.PERSONAL:
          employee.leaveBalance.personal -= leaveRequest.totalDays;
          break;
      }
      await employee.save();

      console.log(
        `✅ Leave approved: ${employee.email} - ${leaveRequest.totalDays} days (${leaveRequest.leaveType})`
      );
    }

    const populated = await LeaveRequest.findById(id)
      .populate("employeeId", "personalInfo email jobInfo")
      .populate("reviewedBy", "personalInfo email");

    res.status(200).json({
      success: true,
      data: populated,
      message: "Запит затверджено",
    });
  } catch (error) {
    console.error("❌ Error approving request:", error);
    res.status(500).json({
      success: false,
      message: "Не вдалося затвердити запит",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const rejectLeaveRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const reviewerId = req.user?.userId;

    const leaveRequest = await LeaveRequest.findById(id);

    if (!leaveRequest) {
      res.status(404).json({
        success: false,
        message: "Запит не знайдено",
      });
      return;
    }

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      res.status(400).json({
        success: false,
        message: "Запит вже оброблено",
      });
      return;
    }

    leaveRequest.status = LeaveStatus.REJECTED;
    leaveRequest.reviewedBy = reviewerId as any;
    leaveRequest.reviewedAt = new Date();
    leaveRequest.reviewComment = comment || "Відхилено";

    await leaveRequest.save();

    const populated = await LeaveRequest.findById(id)
      .populate("employeeId", "personalInfo email jobInfo")
      .populate("reviewedBy", "personalInfo email");

    console.log(`⛔ Leave rejected: Request #${id}`);

    res.status(200).json({
      success: true,
      data: populated,
      message: "Запит відхилено",
    });
  } catch (error) {
    console.error("❌ Error rejecting request:", error);
    res.status(500).json({
      success: false,
      message: "Не вдалося відхилити запит",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const cancelLeaveRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const employeeId = req.user?.userId;

    const leaveRequest = await LeaveRequest.findById(id);

    if (!leaveRequest) {
      res.status(404).json({
        success: false,
        message: "Запит не знайдено",
      });
      return;
    }

    if (leaveRequest.employeeId.toString() !== employeeId) {
      res.status(403).json({
        success: false,
        message: "Ви можете скасовувати тільки свої запити",
      });
      return;
    }

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      res.status(400).json({
        success: false,
        message: "Можна скасувати тільки запити в статусі 'очікування'",
      });
      return;
    }

    leaveRequest.status = LeaveStatus.CANCELLED;
    await leaveRequest.save();

    res.status(200).json({
      success: true,
      message: "Запит скасовано",
    });
  } catch (error) {
    console.error("❌ Error cancelling request:", error);
    res.status(500).json({
      success: false,
      message: "Не вдалося скасувати запит",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

function calculateBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}
