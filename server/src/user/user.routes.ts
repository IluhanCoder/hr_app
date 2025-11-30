

import { Router } from "express";
import {
  register,
  login,
  getCurrentUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUsersByDepartment,
  getManagerTeam,
  createEmployee,
  getDepartments,
  transferDepartment,
  updateUserSkills,
  getUserSkills,
} from "./user.controller.js";
import {
  authMiddleware,
  requireHRAccess,
  requireManagerAccess,
} from "../auth/auth.middleware.js";

const router = Router();





router.post("/auth/register", register);


router.post("/auth/login", login);





router.get("/users/me", authMiddleware, getCurrentUser);


router.post("/users/create-employee", authMiddleware, requireHRAccess, createEmployee);


router.get("/users", authMiddleware, requireHRAccess, getAllUsers);


router.get("/users/departments", authMiddleware, getDepartments);


router.get("/users/:id", authMiddleware, getUserById);


router.put("/users/:id", authMiddleware, updateUser);


router.put("/users/:id/skills", authMiddleware, updateUserSkills);


router.get("/users/:id/skills", authMiddleware, getUserSkills);


router.post("/users/:id/transfer-department", authMiddleware, requireHRAccess, transferDepartment);


router.delete("/users/:id", authMiddleware, requireHRAccess, deleteUser);


router.get("/users/department/:department", authMiddleware, requireManagerAccess, getUsersByDepartment);


router.get("/users/manager/:managerId/team", authMiddleware, requireManagerAccess, getManagerTeam);

export default router;
