
import apiClient from "./api";
import type { UserProfile } from "../../../shared/types/user.types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
}

export const getCurrentUser = async (): Promise<UserProfile> => {
  const response = await apiClient.get<ApiResponse<UserProfile>>("/users/me");
  return response.data.data;
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  const response = await apiClient.get<ApiResponse<UserProfile[]>>("/users");
  return response.data.data;
};

export const getUserById = async (id: string): Promise<UserProfile> => {
  const response = await apiClient.get<ApiResponse<UserProfile>>(`/users/${id}`);
  return response.data.data;
};

export const updateUser = async (
  id: string,
  data: Partial<UserProfile>
): Promise<UserProfile> => {
  const response = await apiClient.put<ApiResponse<UserProfile>>(`/users/${id}`, data);
  return response.data.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/users/${id}`);
};

export const getUsersByDepartment = async (department: string): Promise<UserProfile[]> => {
  const response = await apiClient.get<ApiResponse<UserProfile[]>>(
    `/users/department/${department}`
  );
  return response.data.data;
};

export const getManagerTeam = async (managerId: string): Promise<UserProfile[]> => {
  const response = await apiClient.get<ApiResponse<UserProfile[]>>(
    `/users/manager/${managerId}/team`
  );
  return response.data.data;
};

const userService = {
  getCurrentUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUsersByDepartment,
  getManagerTeam,
};

export default userService;
