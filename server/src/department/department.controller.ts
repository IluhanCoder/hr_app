

import type { Response } from "express";
import { Department } from "./department.model.js";
import type { AuthRequest } from "../auth/auth.types.js";
import { User } from "../user/user.model.js";


export const getAllDepartments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate("managerId", "personalInfo email")
      .populate("parentDepartment", "name code")
      .sort({ code: 1 });

    const transformedDepartments = departments.map((dept: any) => ({
      id: dept._id.toString(),
      name: dept.name,
      code: dept.code,
      description: dept.description,
      manager: dept.managerId ? {
        id: dept.managerId._id?.toString(),
        email: dept.managerId.email,
        personalInfo: dept.managerId.personalInfo
      } : undefined,
      parentDepartment: dept.parentDepartment ? {
        id: dept.parentDepartment._id?.toString(),
        name: dept.parentDepartment.name,
        code: dept.parentDepartment.code
      } : undefined,
      isActive: dept.isActive,
      createdAt: dept.createdAt,
      updatedAt: dept.updatedAt
    }));

    res.status(200).json({
      success: true,
      data: transformedDepartments,
      count: transformedDepartments.length,
    });
  } catch (error) {
    console.error("❌ Error fetching departments:", error);
    res.status(500).json({
      success: false,
      message: "Не вдалося завантажити відділи",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const getDepartmentHierarchy = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hierarchy = await Department.getHierarchy();

    res.status(200).json({
      success: true,
      data: hierarchy,
    });
  } catch (error) {
    console.error("❌ Error fetching hierarchy:", error);
    res.status(500).json({
      success: false,
      message: "Не вдалося завантажити ієрархію",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const getDepartmentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const department = await Department.findById(id)
      .populate("managerId", "personalInfo email role")
      .populate("parentDepartment", "name code");

    if (!department) {
      res.status(404).json({
        success: false,
        message: "Відділ не знайдено",
      });
      return;
    }

    const employees = await User.find({
      "jobInfo.department": department.name,
      status: "active",
    }).select("personalInfo email role jobInfo");

    const subDepartments = await department.getSubDepartments();

    res.status(200).json({
      success: true,
      data: {
        ...department.toObject(),
        employees,
        subDepartments,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching department:", error);
    res.status(500).json({
      success: false,
      message: "Не вдалося завантажити відділ",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const createDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, parentDepartment, managerId, code } = req.body;

    if (!name || !code) {
      res.status(400).json({
        success: false,
        message: "Назва та код відділу обов'язкові",
      });
      return;
    }

    const existingDept = await Department.findOne({ code: code.toUpperCase() });
    if (existingDept) {
      res.status(400).json({
        success: false,
        message: "Відділ з таким кодом вже існує",
      });
      return;
    }

    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager) {
        res.status(404).json({
          success: false,
          message: "Менеджер не знайдений",
        });
        return;
      }
    }

    if (parentDepartment) {
      const parent = await Department.findById(parentDepartment);
      if (!parent) {
        res.status(404).json({
          success: false,
          message: "Батьківський відділ не знайдений",
        });
        return;
      }
    }

    const department = new Department({
      name,
      description,
      parentDepartment: parentDepartment || null,
      managerId: managerId || null,
      code: code.toUpperCase(),
    });

    await department.save();

    const populatedDept = await Department.findById(department._id)
      .populate("managerId", "personalInfo email")
      .populate("parentDepartment", "name code");

    console.log(`✅ Department created: ${department.name} (${department.code})`);

    res.status(201).json({
      success: true,
      data: populatedDept,
      message: "Відділ успішно створено",
    });
  } catch (error) {
    console.error("❌ Error creating department:", error);
    res.status(500).json({
      success: false,
      message: "Не вдалося створити відділ",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const updateDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, parentDepartment, managerId, code } = req.body;

    const department = await Department.findById(id);

    if (!department) {
      res.status(404).json({
        success: false,
        message: "Відділ не знайдено",
      });
      return;
    }

    if (parentDepartment && parentDepartment === id) {
      res.status(400).json({
        success: false,
        message: "Відділ не може бути батьківським для самого себе",
      });
      return;
    }

    if (code && code.toUpperCase() !== department.code) {
      const existingDept = await Department.findOne({ code: code.toUpperCase() });
      if (existingDept) {
        res.status(400).json({
          success: false,
          message: "Відділ з таким кодом вже існує",
        });
        return;
      }
    }

    if (name) department.name = name;
    if (description !== undefined) department.description = description;
    if (parentDepartment !== undefined) department.parentDepartment = parentDepartment || undefined;
    if (managerId !== undefined) department.managerId = managerId || undefined;
    if (code) department.code = code.toUpperCase();

    await department.save();

    const updatedDept = await Department.findById(id)
      .populate("managerId", "personalInfo email")
      .populate("parentDepartment", "name code");

    console.log(`✅ Department updated: ${department.name}`);

    res.status(200).json({
      success: true,
      data: updatedDept,
      message: "Відділ успішно оновлено",
    });
  } catch (error) {
    console.error("❌ Error updating department:", error);
    res.status(500).json({
      success: false,
      message: "Не вдалося оновити відділ",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};


export const deleteDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const department = await Department.findById(id);

    if (!department) {
      res.status(404).json({
        success: false,
        message: "Відділ не знайдено",
      });
      return;
    }

    const subDepartments = await Department.find({ 
      parentDepartment: id as any, 
      isActive: true 
    });
    if (subDepartments.length > 0) {
      res.status(400).json({
        success: false,
        message: "Не можна деактивувати відділ, який має активні підвідділи",
      });
      return;
    }

    const employees = await User.find({
      "jobInfo.department": department.name,
      status: "active",
    });

    if (employees.length > 0) {
      res.status(400).json({
        success: false,
        message: `Не можна деактивувати відділ, який має ${employees.length} активних співробітників`,
      });
      return;
    }

    department.isActive = false;
    await department.save();

    console.log(`✅ Department deactivated: ${department.name}`);

    res.status(200).json({
      success: true,
      message: "Відділ успішно деактивовано",
    });
  } catch (error) {
    console.error("❌ Error deleting department:", error);
    res.status(500).json({
      success: false,
      message: "Не вдалося деактивувати відділ",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
