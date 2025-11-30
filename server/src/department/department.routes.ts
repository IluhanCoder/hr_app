

import { Router } from "express";
import {
  getAllDepartments,
  getDepartmentHierarchy,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "./department.controller.js";
import { authMiddleware, requireHRAccess } from "../auth/auth.middleware.js";

const router = Router();


router.get("/departments", authMiddleware, getAllDepartments);


router.get("/departments/hierarchy", authMiddleware, getDepartmentHierarchy);


router.get("/departments/:id", authMiddleware, getDepartmentById);


router.post("/departments", authMiddleware, requireHRAccess, createDepartment);


router.put("/departments/:id", authMiddleware, requireHRAccess, updateDepartment);


router.delete("/departments/:id", authMiddleware, requireHRAccess, deleteDepartment);

export default router;
