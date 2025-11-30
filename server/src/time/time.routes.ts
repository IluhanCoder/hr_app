import { Router } from "express";
import type { AuthRequest } from "../auth/auth.types.js";
import { authMiddleware } from "../auth/auth.middleware.js";
import { TimeEntry, TimeEntryStatus, TimeEntryType } from "./timeEntry.model.js";
import { User } from "../user/user.model.js";
import { UserRole } from "../../../shared/types/user.types.js";

const router = Router();

router.post("/time", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const body = req.body || {};
    const userId = body.userId || req.user?.userId;
    if (!userId) return res.status(400).json({ success: false, message: "userId is required" });

    const startDate = new Date(body.start);
    
    const entry = await TimeEntry.create({
      userId,
      date: startDate,
      start: body.start,
      end: body.end,
      breakMinutes: body.breakMinutes || 0,
      type: body.type || TimeEntryType.REGULAR,
      project: body.project,
      task: body.task,
      status: TimeEntryStatus.PENDING,
    });
    res.json({ success: true, entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/time", authMiddleware, async (req: AuthRequest, res) => {
  try {
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
    
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const q: any = { userId: { $in: userIds } };
    if (from || to) q.date = {};
    if (from) q.date.$gte = from;
    if (to) q.date.$lte = to;
    const entries = await TimeEntry.find(q).populate('userId', 'firstName lastName').sort({ date: -1 }).lean();
    res.json({ success: true, entries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/time/:id/approve", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const entry = await TimeEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: "Not found" });

    if (entry.userId.toString() === req.user?.userId) {
      return res.status(403).json({ success: false, message: "Cannot approve your own time entry" });
    }
    
    entry.status = TimeEntryStatus.APPROVED;
    if (req.user?.userId) {
      entry.approvedBy = req.user.userId as any;
    }
    entry.approvedAt = new Date();
    await entry.save();
    res.json({ success: true, entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/time/summary", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = (req.query.userId as string) || req.user?.userId;
    const period = (req.query.period as string) || "";
    const [y, m] = period.split("-").map((x) => Number(x));
    if (!y || !m) return res.status(400).json({ success: false, message: "period=YYYY-MM required" });
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59, 999);

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

    const toHours = (min: number) => Math.round((min / 60) * 100) / 100;
    res.json({ success: true, summary: {
      period,
      userId,
      regularHours: toHours(regularMinutes),
      overtimeHours: toHours(overtimeMinutes),
      holidayHours: toHours(holidayMinutes),
    }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
