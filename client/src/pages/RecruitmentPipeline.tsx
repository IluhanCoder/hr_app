

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import authStore from "../stores/AuthStore";
import apiClient from "../services/api";
import type {
  Candidate,
  RecruitmentStage,
  CandidateStatus,
  RecruitmentStats,
} from "../types/recruitment.types";

const stageLabels: Record<string, string> = {
  application: "Заявка",
  screening: "Скринінг",
  technical: "Технічне інтерв'ю",
  hr_interview: "HR інтерв'ю",
  final: "Фінальне інтерв'ю",
  offer: "Оффер",
  hired: "Найнято",
  rejected: "Відхилено",
};

const stageColors: Record<string, string> = {
  application: "bg-gray-200 text-gray-700",
  screening: "bg-blue-200 text-blue-700",
  technical: "bg-purple-200 text-purple-700",
  hr_interview: "bg-indigo-200 text-indigo-700",
  final: "bg-yellow-200 text-yellow-700",
  offer: "bg-green-200 text-green-700",
  hired: "bg-green-500 text-white",
  rejected: "bg-red-500 text-white",
};

const RecruitmentPipeline: React.FC = observer(() => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stats, setStats] = useState<RecruitmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStage, setFilterStage] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("active");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCandidates();
    fetchStats();
  }, [filterStage, filterStatus]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterStage !== "all") params.stage = filterStage;
      if (filterStatus !== "all") params.status = filterStatus;

      const response = await apiClient.get("/recruitment", { params });
      setCandidates(response.data.data || []);
    } catch (error) {
      console.error("Error fetching candidates:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get("/recruitment/stats");
      setStats(response.data.data || null);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const filteredCandidates = candidates.filter((candidate) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      candidate.firstName.toLowerCase().includes(searchLower) ||
      candidate.lastName.toLowerCase().includes(searchLower) ||
      candidate.email.toLowerCase().includes(searchLower) ||
      candidate.position.toLowerCase().includes(searchLower)
    );
  });

  const candidatesByStage = filteredCandidates.reduce((acc, candidate) => {
    if (!acc[candidate.currentStage]) {
      acc[candidate.currentStage] = [];
    }
    acc[candidate.currentStage].push(candidate);
    return acc;
  }, {} as Record<string, Candidate[]>);

  const stages: RecruitmentStage[] = [
    "application" as RecruitmentStage,
    "screening" as RecruitmentStage,
    "technical" as RecruitmentStage,
    "hr_interview" as RecruitmentStage,
    "final" as RecruitmentStage,
    "offer" as RecruitmentStage,
    "hired" as RecruitmentStage,
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Завантаження...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Воронка найму</h1>
          <p className="text-gray-600 mt-2">
            Керування процесом рекрутингу та переміщення кандидатів по етапах
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/recruitment/offers")}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            📄 Переглянути оффери
          </button>
          {(authStore.user?.role === "hr_manager" ||
            authStore.user?.role === "admin" ||
            authStore.user?.role === "recruiter") && (
            <button
              onClick={() => navigate("/recruitment/new")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Додати кандидата
            </button>
          )}
        </div>
      </div>

      {}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Всього кандидатів</div>
            <div className="text-2xl font-bold text-gray-900">
              {candidates.length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Активних</div>
            <div className="text-2xl font-bold text-blue-600">
              {
                stats.byStatus.find((s) => s._id === "active")?.count || 0
              }
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Найнято</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.byStatus.find((s) => s._id === "hired")?.count || 0}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Відхилено</div>
            <div className="text-2xl font-bold text-red-600">
              {
                stats.byStatus.find((s) => s._id === "rejected")?.count || 0
              }
            </div>
          </div>
        </div>
      )}

      {}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Етап
            </label>
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Всі етапи</option>
              {stages.map((stage) => (
                <option key={stage} value={stage}>
                  {stageLabels[stage]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Статус
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Всі статуси</option>
              <option value="active">Активні</option>
              <option value="on_hold">Відкладено</option>
              <option value="rejected">Відхилено</option>
              <option value="hired">Найнято</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Пошук
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ім'я, email, посада..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {}
      <div className="overflow-x-auto">
        <div className="inline-flex space-x-4 pb-4 min-w-full">
          {stages.map((stage) => {
            const stageCandidates = candidatesByStage[stage] || [];
            const stageCount =
              stats?.byStage.find((s) => s._id === stage)?.count || 0;

            return (
              <div
                key={stage}
                className="flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">
                    {stageLabels[stage]}
                  </h3>
                  <span className="px-2 py-1 bg-gray-200 text-gray-700 text-sm rounded-full">
                    {stageCount}
                  </span>
                </div>

                <div className="space-y-3">
                  {stageCandidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      onClick={() => navigate(`/recruitment/${candidate.id}`)}
                      className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="font-semibold text-gray-900">
                        {candidate.firstName} {candidate.lastName}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {candidate.position}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {candidate.email}
                      </div>
                      
                      {candidate.interviews.length > 0 && (
                        <div className="mt-2 text-xs text-blue-600">
                          📅 {candidate.interviews.length} інтерв'ю
                        </div>
                      )}
                      
                      {candidate.assignedTo && (
                        <div className="mt-2 text-xs text-gray-500">
                          👤 {candidate.assignedTo.firstName}{" "}
                          {candidate.assignedTo.lastName}
                        </div>
                      )}
                      
                      <div className="mt-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            stageColors[candidate.currentStage]
                          }`}
                        >
                          {stageLabels[candidate.currentStage]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {filteredCandidates.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Кандидатів не знайдено
        </div>
      )}
    </div>
  );
});

export default RecruitmentPipeline;
