import express from "express";
import type { AuthRequest } from "../auth/auth.types.js";
import { User } from "../user/user.model.js";
import { TimeEntry, TimeEntryStatus, TimeEntryType } from "../time/timeEntry.model.js";
import { UserRole } from "../../../shared/types/user.types.js";


export const calculatePayroll = async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = (req.query.userId as string) || req.user?.userId;
    const period = (req.query.period as string) || "";
    const [y, m] = period.split("-").map((x) => Number(x));
    if (!y || !m) return res.status(400).json({ success: false, message: "period=YYYY-MM required" });
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59, 999);

    const user = await User.findById(userId).select("compensation personalInfo jobInfo");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const c = (user as any).compensation || {};
    const hourlyRate = Number(c.hourlyRate || 0);
    const overtimeMultiplier = Number(c.overtimeMultiplier || 1.5);
    const holidayMultiplier = Number(c.holidayMultiplier || 2);
    const pit = Number(c.taxProfile?.pitRate || 0.18);
    const ssc = Number(c.taxProfile?.sscRate || 0.221);
    const mil = Number(c.taxProfile?.militaryRate || 0.015);
    const fixedBonus = Number(c.bonusPolicy?.fixedMonthlyBonus || 0);
    const perfBonusPct = Number(c.bonusPolicy?.performanceBonusPercent || 0);

    const entries = await TimeEntry.find({
      userId: userId!,
      status: TimeEntryStatus.APPROVED,
      date: { $gte: start, $lte: end },
    }).lean();

    let regularMinutes = 0;
    let overtimeMinutes = 0;
    let holidayMinutes = 0;
    for (const e of entries) {
      const startMs = new Date(e.start as any).getTime();
      const endMs = new Date(e.end as any).getTime();
      const worked = Math.max(0, Math.floor((endMs - startMs) / 60000) - (e.breakMinutes || 0));
      if (e.type === TimeEntryType.HOLIDAY) holidayMinutes += worked;
      else if (e.type === TimeEntryType.OVERTIME) overtimeMinutes += worked;
      else regularMinutes += worked;
    }

    const h = (min: number) => Math.round((min / 60) * 100) / 100;
    const regularHours = h(regularMinutes);
    const overtimeHours = h(overtimeMinutes);
    const holidayHours = h(holidayMinutes);

    const regularPay = regularHours * hourlyRate;
    const overtimePay = overtimeHours * hourlyRate * overtimeMultiplier;
    const holidayPay = holidayHours * hourlyRate * holidayMultiplier;
    const perfBonus = regularPay * (perfBonusPct / 100);
    const gross = Math.round((regularPay + overtimePay + holidayPay + fixedBonus + perfBonus) * 100) / 100;

    const taxes = Math.round(gross * (pit + ssc + mil) * 100) / 100;
    const net = Math.round((gross - taxes) * 100) / 100;

    return res.json({ success: true, payroll: {
      period,
      user: {
        id: user._id.toString(),
        name: `${(user as any).personalInfo?.firstName || ""} ${(user as any).personalInfo?.lastName || ""}`.trim(),
        department: (user as any).jobInfo?.department,
        jobTitle: (user as any).jobInfo?.jobTitle,
      },
      hours: { regularHours, overtimeHours, holidayHours },
      rates: { hourlyRate, overtimeMultiplier, holidayMultiplier },
      components: { regularPay, overtimePay, holidayPay, fixedBonus, perfBonus },
      gross, taxes: { pit, ssc, mil, total: taxes }, net,
    }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const calculateTeamPayroll = async (req: AuthRequest, res: express.Response) => {
  try {
    const period = (req.query.period as string) || "";
    const [y, m] = period.split("-").map((x) => Number(x));
    if (!y || !m) return res.status(400).json({ success: false, message: "period=YYYY-MM required" });
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59, 999);

    const currentUser = await User.findById(req.user?.userId);
    if (!currentUser) return res.status(401).json({ success: false, message: "Unauthorized" });

    let userIds: string[] = [];

    if (currentUser.role === UserRole.LINE_MANAGER) {
      const teamMembers = await User.find({ 
        'managementInfo.managerId': currentUser._id 
      }).select('_id');
      userIds = [...teamMembers.map(u => u._id.toString()), currentUser._id.toString()];
    } else if (currentUser.role === UserRole.HR_MANAGER || currentUser.role === UserRole.ADMIN) {
      const allUsers = await User.find({}).select('_id');
      userIds = allUsers.map(u => u._id.toString());
    } else {
      userIds = [currentUser._id.toString()];
    }

    const users = await User.find({ _id: { $in: userIds } }).select("compensation personalInfo jobInfo");
    const payrolls: any[] = [];

    for (const user of users) {
      const c = (user as any).compensation || {};
      const hourlyRate = Number(c.hourlyRate || 0);
      const overtimeMultiplier = Number(c.overtimeMultiplier || 1.5);
      const holidayMultiplier = Number(c.holidayMultiplier || 2);
      const pit = Number(c.taxProfile?.pitRate || 0.18);
      const ssc = Number(c.taxProfile?.sscRate || 0.221);
      const mil = Number(c.taxProfile?.militaryRate || 0.015);
      const fixedBonus = Number(c.bonusPolicy?.fixedMonthlyBonus || 0);
      const perfBonusPct = Number(c.bonusPolicy?.performanceBonusPercent || 0);

      const entries = await TimeEntry.find({
        userId: user._id,
        status: TimeEntryStatus.APPROVED,
        date: { $gte: start, $lte: end },
      }).lean();

      let regularMinutes = 0;
      let overtimeMinutes = 0;
      let holidayMinutes = 0;
      for (const e of entries) {
        const startMs = new Date(e.start as any).getTime();
        const endMs = new Date(e.end as any).getTime();
        const worked = Math.max(0, Math.floor((endMs - startMs) / 60000) - (e.breakMinutes || 0));
        if (e.type === TimeEntryType.HOLIDAY) holidayMinutes += worked;
        else if (e.type === TimeEntryType.OVERTIME) overtimeMinutes += worked;
        else regularMinutes += worked;
      }

      const h = (min: number) => Math.round((min / 60) * 100) / 100;
      const regularHours = h(regularMinutes);
      const overtimeHours = h(overtimeMinutes);
      const holidayHours = h(holidayMinutes);

      const regularPay = regularHours * hourlyRate;
      const overtimePay = overtimeHours * hourlyRate * overtimeMultiplier;
      const holidayPay = holidayHours * hourlyRate * holidayMultiplier;
      const perfBonus = regularPay * (perfBonusPct / 100);
      const gross = Math.round((regularPay + overtimePay + holidayPay + fixedBonus + perfBonus) * 100) / 100;

      const taxes = Math.round(gross * (pit + ssc + mil) * 100) / 100;
      const net = Math.round((gross - taxes) * 100) / 100;

      payrolls.push({
        user: {
          id: user._id.toString(),
          name: `${(user as any).personalInfo?.firstName || ""} ${(user as any).personalInfo?.lastName || ""}`.trim(),
          department: (user as any).jobInfo?.department,
          jobTitle: (user as any).jobInfo?.jobTitle,
        },
        hours: { regularHours, overtimeHours, holidayHours, total: regularHours + overtimeHours + holidayHours },
        gross,
        taxes: taxes,
        net,
      });
    }

    return res.json({ success: true, period, payrolls });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
