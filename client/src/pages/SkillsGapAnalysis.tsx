

import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useStores } from "../stores/RootStore";
import { toast } from "react-toastify";
import apiClient from "../services/api";

interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface GapItem {
  skill: Skill;
  requiredLevel: number;
  currentAvgLevel?: number;
  currentLevel?: number;
  gap: number;
  gapPercentage: number;
  weight: number;
  isMandatory: boolean;
  employeesWithSkill?: string[];
  employeesCount?: number;
  totalEmployees?: number;
}

interface JobProfile {
  id: string;
  jobTitle: string;
  department?: string;
}

const SkillsGapAnalysis: React.FC = observer(() => {
  const { authStore } = useStores();
  const [analysisType, setAnalysisType] = useState<"team" | "employee">("team");
  const [departments, setDepartments] = useState<string[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [jobProfiles, setJobProfiles] = useState<JobProfile[]>([]);
  
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedJobProfile, setSelectedJobProfile] = useState("");
  
  const [gapResults, setGapResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDepartments();
    loadEmployees();
    loadJobProfiles();
  }, []);

  const loadDepartments = async () => {
    try {
      const response = await apiClient.get("/departments");
      setDepartments(response.data.data.map((d: any) => d.name));
    } catch (error) {
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await apiClient.get("/users");
      setEmployees(response.data.data || []);
    } catch (error) {
    }
  };

  const loadJobProfiles = async () => {
    try {
      const response = await apiClient.get("/skills/job-profiles");
      setJobProfiles(response.data.data || []);
    } catch (error) {
    }
  };

  const runAnalysis = async () => {
    setLoading(true);
    setGapResults(null);

    try {
      if (analysisType === "team") {
        const response = await apiClient.post("/skills/gap-analysis/team", {
          department: selectedDepartment,
          jobProfileId: selectedJobProfile || undefined,
        });
        setGapResults(response.data.data);
        toast.success("Аналіз виконано!");
      } else {
        const response = await apiClient.post("/skills/gap-analysis/employee", {
          employeeId: selectedEmployee,
          jobProfileId: selectedJobProfile,
        });
        setGapResults(response.data.data);
        toast.success("Аналіз виконано!");
      }
    } catch (error: any) {
      toast.error("Помилка: " + (error.response?.data?.message || "Невідома помилка"));
    } finally {
      setLoading(false);
    }
  };

  const getLevelLabel = (level: number) => {
    switch (level) {
      case 0: return "Немає";
      case 1: return "Початківець";
      case 2: return "Середній";
      case 3: return "Досвідчений";
      case 4: return "Експерт";
      default: return level.toString();
    }
  };

  const getGapColor = (gap: number) => {
    if (gap <= 0) return "text-green-600";
    if (gap <= 0.5) return "text-yellow-600";
    if (gap <= 1) return "text-orange-600";
    return "text-red-600";
  };

  if (authStore.user?.role !== "hr_manager" && authStore.user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Доступ заборонено</h2>
          <p className="text-gray-600">Тільки HR-менеджери мають доступ до GAP-аналізу</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📊 GAP-аналіз навичок</h1>
          <p className="text-gray-600">
            Визначення різниці між поточними та необхідними навичками
          </p>
        </div>

        {}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="space-y-4">
            {}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Тип аналізу
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => setAnalysisType("team")}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    analysisType === "team"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Команда/Відділ
                </button>
                <button
                  onClick={() => setAnalysisType("employee")}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    analysisType === "employee"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Окремий співробітник
                </button>
              </div>
            </div>

            {}
            {analysisType === "team" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Відділ (опціонально)
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Використати з профілю посади --</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Залиште порожнім щоб використати департамент з обраного профілю посади
                </p>
              </div>
            )}

            {}
            {analysisType === "employee" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Співробітник *
                </label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="">-- Оберіть співробітника --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.personalInfo?.firstName} {emp.personalInfo?.lastName} -{" "}
                      {emp.jobInfo?.jobTitle}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Профіль посади *
              </label>
              <select
                value={selectedJobProfile}
                onChange={(e) => setSelectedJobProfile(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                required
              >
                <option value="">-- Оберіть профіль --</option>
                {jobProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.jobTitle} {profile.department ? `(${profile.department})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {}
            <button
              onClick={runAnalysis}
              disabled={loading || !selectedJobProfile || (analysisType === "employee" && !selectedEmployee)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 transition-all"
            >
              {loading ? "Аналіз..." : "🚀 Запустити GAP-аналіз"}
            </button>
          </div>
        </div>

        {}
        {gapResults && (
          <div className="space-y-6">
            {}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Результати аналізу</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-600 font-semibold">Профіль посади</div>
                  <div className="text-lg font-bold text-blue-800">
                    {gapResults.jobProfile?.jobTitle}
                  </div>
                </div>
                
                {gapResults.teamSize !== undefined && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-green-600 font-semibold">Розмір команди</div>
                    <div className="text-lg font-bold text-green-800">
                      {gapResults.teamSize} осіб
                    </div>
                  </div>
                )}
                
                {gapResults.overallGapScore !== undefined && (
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="text-sm text-orange-600 font-semibold">Загальний GAP Score</div>
                    <div className="text-lg font-bold text-orange-800">
                      {gapResults.overallGapScore.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              {}
              {gapResults.recommendations && gapResults.recommendations.length > 0 && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-800 mb-2">📝 Рекомендації:</h3>
                  <ul className="space-y-1">
                    {gapResults.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="text-sm text-purple-700">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Навичка
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        Категорія
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        Поточний рівень
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        Необхідний рівень
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        GAP
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                        Важливість
                      </th>
                      {analysisType === "team" && (
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                          Покриття
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {gapResults.gaps.map((gap: GapItem, idx: number) => (
                      <tr key={idx} className={gap.isMandatory ? "bg-red-50" : ""}>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-gray-900">{gap.skill.name}</div>
                            <div className="text-xs text-gray-500">{gap.skill.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{gap.skill.category}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-semibold text-blue-600">
                            {getLevelLabel(Math.round(gap.currentAvgLevel || gap.currentLevel || 0))}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-semibold text-green-600">
                            {getLevelLabel(gap.requiredLevel)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-lg font-bold ${getGapColor(gap.gap)}`}>
                            {gap.gap > 0 ? "+" : ""}{gap.gap.toFixed(2)}
                          </span>
                          <div className="text-xs text-gray-500">({gap.gapPercentage.toFixed(0)}%)</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-sm font-semibold">{gap.weight}</span>
                            {gap.isMandatory && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                                Обов'язково
                              </span>
                            )}
                          </div>
                        </td>
                        {analysisType === "team" && gap.totalEmployees !== undefined && (
                          <td className="px-6 py-4 text-center">
                            <div className="text-sm font-semibold text-gray-900">
                              {gap.employeesCount} / {gap.totalEmployees}
                            </div>
                            <div className="text-xs text-gray-500">
                              {((gap.employeesCount! / gap.totalEmployees!) * 100).toFixed(0)}%
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default SkillsGapAnalysis;
