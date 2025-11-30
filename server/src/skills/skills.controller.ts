

import type { Response } from "express";
import type { AuthRequest } from "../auth/auth.types.js";
import { Skill, JobProfile, SkillLevel, SkillCategory } from "./skills.model.js";
import { User } from "../user/user.model.js";
import mongoose from "mongoose";


export const getAllSkills = async (req: AuthRequest, res: Response) => {
  try {
    const { category, isActive } = req.query;
    
    const filter: any = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const skills = await Skill.find(filter).sort({ name: 1 });

    res.json({
      success: true,
      data: skills,
    });
  } catch (error) {
    console.error("Error fetching skills:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при отриманні навичок",
    });
  }
};


export const createSkill = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, category } = req.body;

    const skill = new Skill({
      name,
      description,
      category,
    });

    await skill.save();

    res.status(201).json({
      success: true,
      data: skill,
      message: "Навичку створено",
    });
  } catch (error: any) {
    console.error("Error creating skill:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Навичка з такою назвою вже існує",
      });
    }
    res.status(500).json({
      success: false,
      message: "Помилка при створенні навички",
    });
  }
};


export const getAllJobProfiles = async (req: AuthRequest, res: Response) => {
  try {
    const profiles = await JobProfile.find({ isActive: true })
      .populate("requiredSkills.skillId")
      .populate("createdBy", "personalInfo email")
      .sort({ jobTitle: 1 });

    res.json({
      success: true,
      data: profiles,
    });
  } catch (error) {
    console.error("Error fetching job profiles:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при отриманні профілів посад",
    });
  }
};


export const createJobProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { jobTitle, department, description, requiredSkills } = req.body;

    console.log("Creating job profile:", { jobTitle, department, description, requiredSkills });
    console.log("User:", req.user);

    if (!requiredSkills || !Array.isArray(requiredSkills) || requiredSkills.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Потрібно додати хоча б одну навичку",
      });
    }

    const profile = new JobProfile({
      jobTitle,
      department,
      description,
      requiredSkills,
      createdBy: req.user?.userId || null,
    });

    await profile.save();
    await profile.populate("requiredSkills.skillId");

    res.status(201).json({
      success: true,
      data: profile,
      message: "Профіль посади створено",
    });
  } catch (error: any) {
    console.error("Error creating job profile:", error);
    console.error("Error details:", error.message);
    if (error.errors) {
      console.error("Validation errors:", error.errors);
    }
    res.status(500).json({
      success: false,
      message: error.message || "Помилка при створенні профілю посади",
    });
  }
};


export const deleteJobProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const profile = await JobProfile.findById(id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Профіль посади не знайдено",
      });
    }

    profile.isActive = false;
    await profile.save();

    res.json({
      success: true,
      message: "Профіль посади видалено",
    });
  } catch (error) {
    console.error("Error deleting job profile:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при видаленні профілю посади",
    });
  }
};


export const teamGapAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const { department, jobProfileId } = req.body;

    if (!department && !jobProfileId) {
      return res.status(400).json({
        success: false,
        message: "Потрібно вказати department або jobProfileId",
      });
    }

    let jobProfile;
    if (jobProfileId) {
      jobProfile = await JobProfile.findById(jobProfileId).populate("requiredSkills.skillId");
    } else {

      jobProfile = await JobProfile.findOne({ department, isActive: true }).populate(
        "requiredSkills.skillId"
      );
    }

    if (!jobProfile) {
      return res.status(404).json({
        success: false,
        message: "Профіль посади не знайдено",
      });
    }

    const departmentToFilter = (jobProfile as any).department || department;

    const filter: any = { status: "active" };
    if (departmentToFilter) {

      filter["jobInfo.department"] = new RegExp(`^${departmentToFilter}$`, 'i');
    }

    const employees = await User.find(filter)
      .select("personalInfo jobInfo skills")
      .populate("skills.skillId", "name");

    console.log(`🔍 Team GAP Analysis Debug:
    - Department from request: ${department}
    - Department from Job Profile: ${(jobProfile as any).department}
    - Department used for filter: ${departmentToFilter}
    - Job Profile: ${jobProfile.jobTitle}
    - Employees found: ${employees.length}
    - Filter used:`, filter);
    
    if (employees.length > 0) {
      console.log(`👥 Sample employees:`, employees.slice(0, 3).map(e => ({
        name: `${e.personalInfo.firstName} ${e.personalInfo.lastName}`,
        department: e.jobInfo.department,
        skillsCount: e.skills.length
      })));
    } else {

      const allActive = await User.find({ status: "active" }).select("personalInfo jobInfo");
      console.log(`⚠️ No employees found with filter. All active employees departments:`, 
        allActive.map(e => ({
          name: `${e.personalInfo.firstName} ${e.personalInfo.lastName}`,
          department: e.jobInfo.department
        }))
      );
    }

    const requiredVector: Map<string, { level: number; weight: number; isMandatory: boolean }> =
      new Map();

    jobProfile.requiredSkills.forEach((req: any) => {
      const skillId = req.skillId._id.toString();
      requiredVector.set(skillId, {
        level: req.requiredLevel,
        weight: req.weight,
        isMandatory: req.isMandatory,
      });
    });

    const currentVector: Map<string, { totalLevel: number; count: number; employees: string[] }> =
      new Map();

    employees.forEach((emp) => {
      emp.skills.forEach((skill: any) => {
        const skillIdStr = skill.skillId?._id?.toString() || skill.skillId?.toString();
        if (!skillIdStr) return;

        if (requiredVector.has(skillIdStr)) {
          const current = currentVector.get(skillIdStr) || {
            totalLevel: 0,
            count: 0,
            employees: [],
          };
          current.totalLevel += skill.currentLevel || 0;
          current.count += 1;
          current.employees.push(
            `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`
          );
          currentVector.set(skillIdStr, current);
        }
      });
    });

    console.log(`📊 Skills matched: ${currentVector.size} out of ${requiredVector.size} required skills`);

    const gaps = [];
    for (const [skillId, required] of requiredVector.entries()) {
      const current = currentVector.get(skillId);
      const reqSkill: any = jobProfile.requiredSkills.find(
        (rs: any) => rs.skillId._id.toString() === skillId
      );

      const currentAvgLevel = current ? current.totalLevel / current.count : 0;
      const gap = required.level - currentAvgLevel;
      const gapPercentage = (gap / required.level) * 100;

      gaps.push({
        skill: reqSkill.skillId,
        requiredLevel: required.level,
        currentAvgLevel: Math.round(currentAvgLevel * 100) / 100,
        gap: Math.round(gap * 100) / 100,
        gapPercentage: Math.round(gapPercentage * 100) / 100,
        weight: required.weight,
        isMandatory: required.isMandatory,
        employeesWithSkill: current ? current.employees : [],
        employeesCount: current ? current.count : 0,
        totalEmployees: employees.length,
      });
    }

    gaps.sort((a, b) => {
      if (a.isMandatory && !b.isMandatory) return -1;
      if (!a.isMandatory && b.isMandatory) return 1;
      return b.gap - a.gap;
    });

    let totalWeightedGap = 0;
    let totalWeight = 0;
    gaps.forEach((g) => {
      totalWeightedGap += Math.abs(g.gap) * g.weight;
      totalWeight += g.weight;
    });
    const overallGapScore = totalWeight > 0 ? (totalWeightedGap / totalWeight) : 0;

    res.json({
      success: true,
      data: {
        jobProfile: {
          id: jobProfile._id,
          jobTitle: jobProfile.jobTitle,
          department: jobProfile.department,
        },
        teamSize: employees.length,
        overallGapScore: Math.round(overallGapScore * 100) / 100,
        gaps,
        recommendations: generateRecommendations(gaps),
      },
    });
  } catch (error) {
    console.error("Error performing gap analysis:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при виконанні GAP-аналізу",
    });
  }
};


export const employeeGapAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId, jobProfileId } = req.body;

    if (!employeeId || !jobProfileId) {
      return res.status(400).json({
        success: false,
        message: "Потрібно вказати employeeId та jobProfileId",
      });
    }

    const employee = await User.findById(employeeId).populate("skills.skillId", "name");
    const jobProfile = await JobProfile.findById(jobProfileId).populate("requiredSkills.skillId");

    if (!employee || !jobProfile) {
      return res.status(404).json({
        success: false,
        message: "Співробітника або профіль посади не знайдено",
      });
    }

    const employeeSkillsMap: Map<string, number> = new Map();
    employee.skills.forEach((skill: any) => {

      const skillIdStr = skill.skillId?._id?.toString() || skill.skillId?.toString();
      if (skillIdStr) {
        employeeSkillsMap.set(skillIdStr, skill.currentLevel || 0);
      }
    });

    const gaps = jobProfile.requiredSkills.map((req: any) => {
      const skillIdStr = req.skillId?._id?.toString() || req.skillId?.toString();
      const currentLevel = employeeSkillsMap.get(skillIdStr) || 0;
      const gap = req.requiredLevel - currentLevel;
      const gapPercentage = req.requiredLevel > 0 ? (gap / req.requiredLevel) * 100 : 0;

      return {
        skill: req.skillId,
        requiredLevel: req.requiredLevel,
        currentLevel,
        gap,
        gapPercentage: Math.round(gapPercentage * 100) / 100,
        weight: req.weight,
        isMandatory: req.isMandatory,
      };
    });

    gaps.sort((a, b) => {
      if (a.isMandatory && !b.isMandatory) return -1;
      if (!a.isMandatory && b.isMandatory) return 1;
      return b.gap - a.gap;
    });

    res.json({
      success: true,
      data: {
        employee: {
          id: employee._id,
          name: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
          position: employee.jobInfo.jobTitle,
        },
        jobProfile: {
          id: jobProfile._id,
          jobTitle: jobProfile.jobTitle,
        },
        gaps,
        recommendations: generateRecommendations(gaps),
      },
    });
  } catch (error) {
    console.error("Error performing employee gap analysis:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при виконанні GAP-аналізу",
    });
  }
};


function generateRecommendations(gaps: any[]): string[] {
  const recommendations: string[] = [];

  const criticalGaps = gaps.filter((g) => g.isMandatory && g.gap > 1);
  if (criticalGaps.length > 0) {
    recommendations.push(
      `🔴 Критично: ${criticalGaps.length} обов'язкових навичок потребують термінового розвитку`
    );
    criticalGaps.slice(0, 3).forEach((g) => {
      recommendations.push(
        `   • ${g.skill.name}: потрібно підвищити рівень з ${g.currentLevel || g.currentAvgLevel || 0} до ${g.requiredLevel}`
      );
    });
  }

  const moderateGaps = gaps.filter((g) => g.gap > 0.5 && g.gap <= 1);
  if (moderateGaps.length > 0) {
    recommendations.push(
      `🟡 Помірний GAP: ${moderateGaps.length} навичок потребують покращення`
    );
  }

  const missingSkills = gaps.filter((g) => (g.currentLevel === 0 || g.currentAvgLevel === 0));
  if (missingSkills.length > 0) {
    recommendations.push(
      `⚠️ Відсутні навички: ${missingSkills.length} навичок повністю відсутні в команді`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("✅ Команда має всі необхідні навички на достатньому рівні");
  }

  return recommendations;
}


export const getSkillCategories = async (req: AuthRequest, res: Response) => {
  try {
    const categories = Object.values(SkillCategory).map((cat) => ({
      value: cat,
      label: cat,
    }));

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при отриманні категорій",
    });
  }
};


export const getSkillLevels = async (req: AuthRequest, res: Response) => {
  try {
    const levels = [
      { value: SkillLevel.NONE, label: "Немає" },
      { value: SkillLevel.BEGINNER, label: "Початківець" },
      { value: SkillLevel.INTERMEDIATE, label: "Середній" },
      { value: SkillLevel.ADVANCED, label: "Досвідчений" },
      { value: SkillLevel.EXPERT, label: "Експерт" },
    ];

    res.json({
      success: true,
      data: levels,
    });
  } catch (error) {
    console.error("Error fetching levels:", error);
    res.status(500).json({
      success: false,
      message: "Помилка при отриманні рівнів",
    });
  }
};
