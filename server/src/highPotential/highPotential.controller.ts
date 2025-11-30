

import type { Response } from "express";
import type { AuthRequest } from "../auth/auth.types.js";
import { User } from "../user/user.model.js";
import mongoose from "mongoose";


export const markAsHighPotential = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason, potentialLevel } = req.body;

    if (userId === req.user!.userId) {
      return res.status(400).json({
        success: false,
        message: "Ви не можете позначити самого себе як високопотенційного",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Користувача не знайдено",
      });
    }

    user.highPotential = {
      isHighPotential: true,
      markedBy: new mongoose.Types.ObjectId(req.user!.userId),
      markedAt: new Date(),
      reason: reason || "",
      potentialLevel: potentialLevel || "high",
    };

    await user.save();

    console.log(`✅ User ${user.personalInfo.firstName} ${user.personalInfo.lastName} marked as high potential`);

    return res.status(200).json({
      success: true,
      message: "Співробітника позначено як високопотенційного",
      data: user,
    });
  } catch (error: any) {
    console.error("❌ Error marking user as high potential:", error);
    return res.status(500).json({
      success: false,
      message: "Помилка при позначенні співробітника",
      error: error.message,
    });
  }
};


export const unmarkAsHighPotential = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Користувача не знайдено",
      });
    }

    user.highPotential = {
      isHighPotential: false,
    };

    await user.save();

    console.log(`✅ High potential status removed from ${user.personalInfo.firstName} ${user.personalInfo.lastName}`);

    return res.status(200).json({
      success: true,
      message: "Позначку високого потенціалу знято",
      data: user,
    });
  } catch (error: any) {
    console.error("❌ Error removing high potential status:", error);
    return res.status(500).json({
      success: false,
      message: "Помилка при зняті позначки",
      error: error.message,
    });
  }
};


export const getHighPotentialEmployees = async (req: AuthRequest, res: Response) => {
  try {
    const { potentialLevel } = req.query;

    const filter: any = {
      "highPotential.isHighPotential": true,
    };

    if (potentialLevel) {
      filter["highPotential.potentialLevel"] = potentialLevel;
    }

    const highPotentialUsers = await User.find(filter)
      .populate("highPotential.markedBy", "personalInfo.firstName personalInfo.lastName email")
      .sort({ "highPotential.markedAt": -1 });

    console.log(`✅ Found ${highPotentialUsers.length} high potential employees`);

    return res.status(200).json({
      success: true,
      data: highPotentialUsers,
      count: highPotentialUsers.length,
    });
  } catch (error: any) {
    console.error("❌ Error fetching high potential employees:", error);
    return res.status(500).json({
      success: false,
      message: "Помилка при отриманні списку",
      error: error.message,
    });
  }
};


export const updateHighPotentialInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason, potentialLevel } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Користувача не знайдено",
      });
    }

    if (!user.highPotential?.isHighPotential) {
      return res.status(400).json({
        success: false,
        message: "Користувач не позначений як високопотенційний",
      });
    }

    if (reason !== undefined) {
      user.highPotential.reason = reason;
    }
    if (potentialLevel !== undefined) {
      user.highPotential.potentialLevel = potentialLevel;
    }

    await user.save();

    console.log(`✅ Updated high potential info for ${user.personalInfo.firstName} ${user.personalInfo.lastName}`);

    return res.status(200).json({
      success: true,
      message: "Інформацію оновлено",
      data: user,
    });
  } catch (error: any) {
    console.error("❌ Error updating high potential info:", error);
    return res.status(500).json({
      success: false,
      message: "Помилка при оновленні інформації",
      error: error.message,
    });
  }
};
