

import type { Response } from "express";
import type { AuthRequest } from "../auth/auth.types.js";
import mongoose from "mongoose";
import { Candidate, RecruitmentStage, CandidateStatus } from "./recruitment.model.js";
import { User } from "../user/user.model.js";
import { JobProfile } from "../skills/skills.model.js";


export const getCandidates = async (req: AuthRequest, res: Response) => {
  try {
  const { stage, status, jobProfileId, department, assignedTo } = req.query;

  const filter: any = {};
  if (stage) filter.currentStage = stage;
  if (status) filter.status = status;

  if (jobProfileId) filter.jobProfileId = jobProfileId;
  if (department) filter.department = department;
  if (assignedTo) filter.assignedTo = assignedTo;

    const candidates = await Candidate.find(filter)
      .populate("createdBy", "email personalInfo")
      .populate("assignedTo", "email personalInfo")
      .populate({ path: "jobProfileId", select: "jobTitle department" })
      .populate("interviews.interviewers", "email personalInfo")
      .populate("interviews.feedback.from", "email personalInfo")
      .populate("stageHistory.movedBy", "email personalInfo")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: candidates,
    });
  } catch (error) {
    console.error("Error fetching candidates:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при отриманні кандидатів",
    });
  }
};


export const getCandidateById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const candidate = await Candidate.findById(id)
      .populate("createdBy", "email personalInfo")
      .populate("assignedTo", "email personalInfo")
      .populate({ path: "jobProfileId", select: "jobTitle department requiredSkills" })
      .populate("interviews.interviewers", "email personalInfo")
      .populate("interviews.feedback.from", "email personalInfo")
      .populate("stageHistory.movedBy", "email personalInfo");

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Кандидата не знайдено",
      });
    }

    res.json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    console.error("Error fetching candidate:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при отриманні кандидата",
    });
  }
};


export const createCandidate = async (req: AuthRequest, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      resumeUrl,
      linkedinUrl,
      jobProfileId,
      department,
      source,
      assignedTo,
      skills,
    } = req.body;

    const existingCandidate = await Candidate.findOne({ email });
    if (existingCandidate) {
      return res.status(400).json({
        success: false,
        message: "Кандидат з таким email вже існує",
      });
    }

    let resolvedDepartment = department;
    if (!jobProfileId) {
      return res.status(400).json({ success: false, message: "jobProfileId is required" });
    }

    const jobProfile = await JobProfile.findById(jobProfileId);
    if (!jobProfile) {
      return res.status(400).json({ success: false, message: "Job profile not found" });
    }

    if (!resolvedDepartment || resolvedDepartment.trim() === "") {
      resolvedDepartment = (jobProfile as any).department || "";
    }

    const candidate = await Candidate.create({
      firstName,
      lastName,
      email,
      phone,
      resumeUrl,
      linkedinUrl,
      jobProfileId: new mongoose.Types.ObjectId(jobProfileId),
      department: resolvedDepartment,
      skills: skills ? skills.map((skill: any) => ({
        skillId: new mongoose.Types.ObjectId(skill.skillId),
        currentLevel: skill.currentLevel,
        yearsOfExperience: skill.yearsOfExperience || 0,
      })) : [],
      source,
      assignedTo: assignedTo && assignedTo.trim() !== "" ? assignedTo : undefined,
      createdBy: new mongoose.Types.ObjectId(req.user!.userId),
      currentStage: RecruitmentStage.APPLICATION,
      status: CandidateStatus.ACTIVE,
      stageHistory: [
        {
          stage: RecruitmentStage.APPLICATION,
          movedBy: new mongoose.Types.ObjectId(req.user!.userId),
          movedAt: new Date(),
        },
      ],
    });

    await candidate.populate([
      { path: "createdBy", select: "email personalInfo" },
      { path: "assignedTo", select: "email personalInfo" },
    ]);

    res.status(201).json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    console.error("Error creating candidate:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при створенні кандидата",
    });
  }
};


export const moveCandidateToStage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { stage, notes, interview } = req.body;

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Кандидата не знайдено",
      });
    }

    const stageOrder = [
      RecruitmentStage.APPLICATION,
      RecruitmentStage.SCREENING,
      RecruitmentStage.TECHNICAL_INTERVIEW,
      RecruitmentStage.HR_INTERVIEW,
      RecruitmentStage.FINAL_INTERVIEW,
      RecruitmentStage.OFFER,
      RecruitmentStage.HIRED,
    ];

    const currentStageIndex = stageOrder.indexOf(candidate.currentStage);
    const newStageIndex = stageOrder.indexOf(stage);




    if (stage !== RecruitmentStage.REJECTED) {
      if (newStageIndex === -1) {
        return res.status(400).json({
          success: false,
          message: "Невірна стадія",
        });
      }

      if (newStageIndex > currentStageIndex + 1) {
        return res.status(400).json({
          success: false,
          message: `Не можна перескочити стадії. Спочатку переведіть кандидата на стадію "${stageOrder[currentStageIndex + 1]}"`,
        });
      }

      if (newStageIndex < currentStageIndex) {
        return res.status(400).json({
          success: false,
          message: "Не можна повертатися на попередні етапи. Процес рекрутингу має бути послідовним.",
        });
      }
    }

    const stagesRequiringInterview = [
      RecruitmentStage.TECHNICAL_INTERVIEW,
      RecruitmentStage.HR_INTERVIEW,
      RecruitmentStage.FINAL_INTERVIEW,
    ];

    if (stagesRequiringInterview.includes(stage) && !interview) {
      return res.status(400).json({
        success: false,
        message: "Для цього етапу необхідно запланувати інтерв'ю",
      });
    }

    if (interview) {
      if (!interview.scheduledAt || !interview.interviewers || interview.interviewers.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Необхідно вказати дату та інтерв'юерів",
        });
      }
    }

    candidate.currentStage = stage;

    candidate.stageHistory.push({
      stage,
      movedBy: new mongoose.Types.ObjectId(req.user!.userId),
      movedAt: new Date(),
      notes,
    });

    if (interview) {
      candidate.interviews.push({
        scheduledAt: new Date(interview.scheduledAt),
        interviewers: interview.interviewers,
        location: interview.location,
        meetingLink: interview.meetingLink,
        notes: interview.notes,
        status: "scheduled",
        feedback: [],
      });
    }

    await candidate.save();
    await candidate.populate([
      { path: "createdBy", select: "email personalInfo" },
      { path: "assignedTo", select: "email personalInfo" },
      { path: "interviews.interviewers", select: "email personalInfo" },
      { path: "stageHistory.movedBy", select: "email personalInfo" },
    ]);

    res.json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    console.error("Error moving candidate:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при переміщенні кандидата",
    });
  }
};


export const addInterviewFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const { candidateId, interviewId } = req.params;
    const { rating, comment, recommendation } = req.body;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Кандидата не знайдено",
      });
    }

    const interview = candidate.interviews.find((int: any) => int._id?.toString() === interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Інтерв'ю не знайдено",
      });
    }

    const isInterviewer = interview.interviewers.some(
      (interviewerId: any) => interviewerId.toString() === req.user!.userId
    );

    if (!isInterviewer) {
      return res.status(403).json({
        success: false,
        message: "Ви не є інтерв'юером для цього інтерв'ю",
      });
    }

    const existingFeedback = interview.feedback?.find(
      (f: any) => f.from.toString() === req.user!.userId
    );

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: "Ви вже залишили фідбек для цього інтерв'ю",
      });
    }

    interview.feedback = interview.feedback || [];
    interview.feedback.push({
      from: new mongoose.Types.ObjectId(req.user!.userId),
      rating,
      comment,
      recommendation,
      createdAt: new Date(),
    });

    if (interview.feedback.length === interview.interviewers.length) {
      interview.status = "completed";
    }

    await candidate.save();
    await candidate.populate([
      { path: "interviews.interviewers", select: "email personalInfo" },
      { path: "interviews.feedback.from", select: "email personalInfo" },
    ]);

    res.json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    console.error("Error adding feedback:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при додаванні фідбеку",
    });
  }
};


export const generateOffer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { position, salary, currency, startDate, benefits } = req.body;

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Кандидата не знайдено",
      });
    }

    const jobProfile = candidate.jobProfileId ? await JobProfile.findById(candidate.jobProfileId) : null;

    candidate.offer = {
      position: position || (jobProfile ? (jobProfile as any).jobTitle : ""),
      salary,
      currency: currency || "UAH",
      startDate: new Date(startDate),
      benefits,
      generatedBy: new mongoose.Types.ObjectId(req.user!.userId),
      generatedAt: new Date(),
      status: "draft",
    };

    candidate.currentStage = RecruitmentStage.OFFER;
    candidate.stageHistory.push({
      stage: RecruitmentStage.OFFER,
      movedBy: new mongoose.Types.ObjectId(req.user!.userId),
      movedAt: new Date(),
      notes: "Оффер згенеровано",
    });

    await candidate.save();
    await candidate.populate([
      { path: "createdBy", select: "email personalInfo" },
      { path: "assignedTo", select: "email personalInfo" },
      { path: "offer.generatedBy", select: "email personalInfo" },
    ]);

    res.json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    console.error("Error generating offer:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при генерації оффера",
    });
  }
};


export const sendOffer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Кандидата не знайдено",
      });
    }

    if (!candidate.offer) {
      return res.status(400).json({
        success: false,
        message: "Оффер ще не згенеровано",
      });
    }

    if (candidate.offer.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Оффер вже надіслано",
      });
    }

    candidate.offer.status = "sent";
    candidate.offer.sentAt = new Date();

    await candidate.save();

    res.json({
      success: true,
      data: candidate,
      message: "Оффер надіслано кандидату на email",
    });
  } catch (error) {
    console.error("Error sending offer:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при надсиланні оффера",
    });
  }
};


export const respondToOffer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { accepted } = req.body;

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Кандидата не знайдено",
      });
    }

    if (!candidate.offer || candidate.offer.status !== "sent") {
      return res.status(400).json({
        success: false,
        message: "Оффер не було надіслано",
      });
    }

    if (accepted) {
      candidate.offer.status = "accepted";
      candidate.offer.acceptedAt = new Date();
      candidate.currentStage = RecruitmentStage.HIRED;
      candidate.status = CandidateStatus.HIRED;
      
      candidate.stageHistory.push({
        stage: RecruitmentStage.HIRED,
        movedBy: new mongoose.Types.ObjectId(req.user!.userId),
        movedAt: new Date(),
        notes: "Кандидат прийняв оффер",
      });
    } else {
      candidate.offer.status = "rejected";
      candidate.offer.rejectedAt = new Date();
      candidate.status = CandidateStatus.REJECTED;
      
      candidate.stageHistory.push({
        stage: candidate.currentStage,
        movedBy: new mongoose.Types.ObjectId(req.user!.userId),
        movedAt: new Date(),
        notes: "Кандидат відхилив оффер",
      });
    }

    await candidate.save();

    res.json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    console.error("Error responding to offer:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при обробці відповіді на оффер",
    });
  }
};


export const updateOfferStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Некоректний статус. Дозволено: accepted або rejected",
      });
    }

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Кандидата не знайдено",
      });
    }

    if (!candidate.offer) {
      return res.status(400).json({
        success: false,
        message: "Оффер ще не було згенеровано",
      });
    }

    if (candidate.offer.status === "accepted" || candidate.offer.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: `Оффер вже має статус: ${candidate.offer.status}`,
      });
    }

    if (status === "accepted") {
      candidate.offer.status = "accepted";
      candidate.offer.acceptedAt = new Date();
      candidate.currentStage = RecruitmentStage.HIRED;
      candidate.status = CandidateStatus.HIRED;
      
      candidate.stageHistory.push({
        stage: RecruitmentStage.HIRED,
        movedBy: new mongoose.Types.ObjectId(req.user!.userId),
        movedAt: new Date(),
        notes: "Кандидат прийняв оффер",
      });
    } else {

      candidate.offer.status = "rejected";
      candidate.offer.rejectedAt = new Date();
      if (rejectionReason) {
        candidate.offer.rejectionReason = rejectionReason;
      }
      candidate.currentStage = RecruitmentStage.REJECTED;
      candidate.status = CandidateStatus.REJECTED;
      
      candidate.stageHistory.push({
        stage: RecruitmentStage.REJECTED,
        movedBy: new mongoose.Types.ObjectId(req.user!.userId),
        movedAt: new Date(),
        notes: rejectionReason || "Кандидат відхилив оффер",
      });
    }

    await candidate.save();
    await candidate.populate([
      { path: "createdBy", select: "email personalInfo" },
      { path: "assignedTo", select: "email personalInfo" },
      { path: "offer.generatedBy", select: "email personalInfo" },
      { path: "stageHistory.movedBy", select: "email personalInfo" },
    ]);

    res.json({
      success: true,
      data: candidate,
      message: status === "accepted" 
        ? "Кандидат прийняв оффер і переведений в статус hired" 
        : "Кандидат відхилив оффер",
    });
  } catch (error) {
    console.error("Error updating offer status:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при оновленні статусу оффера",
    });
  }
};


export const rejectCandidate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Кандидата не знайдено",
      });
    }

    candidate.status = CandidateStatus.REJECTED;
    candidate.currentStage = RecruitmentStage.REJECTED;
    
    candidate.stageHistory.push({
      stage: RecruitmentStage.REJECTED,
      movedBy: new mongoose.Types.ObjectId(req.user!.userId),
      movedAt: new Date(),
      notes: reason,
    });

    await candidate.save();

    res.json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    console.error("Error rejecting candidate:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при відхиленні кандидата",
    });
  }
};


export const convertCandidateToEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Кандидата не знайдено",
      });
    }

    if (candidate.status !== CandidateStatus.HIRED) {
      return res.status(400).json({
        success: false,
        message: "Тільки найняті кандидати можуть бути конвертовані в співробітників",
      });
    }

    const existingUser = await User.findOne({ email: candidate.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Для цього кандидата вже існує акаунт співробітника",
        data: { userId: existingUser._id },
      });
    }

    const jobProfile = candidate.jobProfileId ? await JobProfile.findById(candidate.jobProfileId) : null;

    res.json({
      success: true,
      message: "Дані кандидата готові для створення акаунту",
      data: {
        candidateId: candidate._id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone,
        position: candidate.offer?.position || (jobProfile ? (jobProfile as any).jobTitle : ""),
        salary: candidate.offer?.salary,
        currency: candidate.offer?.currency,
        startDate: candidate.offer?.startDate,
        department: candidate.department,
        skills: candidate.skills || [],
      },
    });
  } catch (error) {
    console.error("Error converting candidate:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при конвертації кандидата",
    });
  }
};


export const getRecruitmentStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await Candidate.aggregate([
      {
        $group: {
          _id: "$currentStage",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusStats = await Candidate.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        byStage: stats,
        byStatus: statusStats,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при отриманні статистики",
    });
  }
};
