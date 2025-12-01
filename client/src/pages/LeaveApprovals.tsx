

import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useStores } from "../stores/RootStore";

interface LeaveRequest {
  _id: string;
  employeeId: {
    _id: string;
    email: string;
    personalInfo: {
      firstName: string;
      lastName: string;
    };
    jobInfo: {
      jobTitle: string;
      department: string;
    };
  };
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  reviewComment?: string;
  reviewedAt?: string;
  reviewedBy?: {
    personalInfo: {
      firstName: string;
      lastName: string;
    };
  };
  createdAt: string;
}

const LeaveApprovals: React.FC = observer(() => {
  const { authStore } = useStores();
  const [pendingRequests, setpendingRequests] = useState<LeaveRequest[]>([]);
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
  const [reviewingRequest, setReviewingRequest] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState("");

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const [pendingRes, allRes] = await Promise.all([
        fetch("http://localhost:5001/api/leaves/pending", {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        }),
        fetch("http://localhost:5001/api/leaves", {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        }),
      ]);

      const pendingData = await pendingRes.json();
      const allData = await allRes.json();

      if (pendingData.success) setpendingRequests(pendingData.data);
      if (allData.success) setAllRequests(allData.data);
    } catch (err) {
      console.error("Failed to load requests:", err);
      setError("Не вдалося завантажити запити");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (requestId: string) => {
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`http://localhost:5001/api/leaves/${requestId}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ comment: reviewComment }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Запит затверджено!");
        setReviewingRequest(null);
        setReviewComment("");
        loadRequests();
      } else {
        setError(data.message || "Помилка при затвердженні");
      }
    } catch (err: any) {
      setError(err.message || "Помилка при затвердженні");
    }
  };

  const handleReject = async (requestId: string) => {
    if (!reviewComment.trim()) {
      setError("Будь ласка, вкажіть причину відхилення");
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`http://localhost:5001/api/leaves/${requestId}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ comment: reviewComment }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Запит відхилено");
        setReviewingRequest(null);
        setReviewComment("");
        loadRequests();
      } else {
        setError(data.message || "Помилка при відхиленні");
      }
    } catch (err: any) {
      setError(err.message || "Помилка при відхиленні");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case "annual":
        return "Щорічна";
      case "sick":
        return "Лікарняний";
      case "personal":
        return "Особистий";
      case "unpaid":
        return "Без оплати";
      default:
        return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Очікування";
      case "approved":
        return "Затверджено";
      case "rejected":
        return "Відхилено";
      case "cancelled":
        return "Скасовано";
      default:
        return status;
    }
  };

  if (
    authStore.user?.role !== "line_manager" &&
    authStore.user?.role !== "hr_manager" &&
    authStore.user?.role !== "admin"
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Доступ заборонено</h2>
          <p className="text-gray-600">
            Тільки менеджери мають доступ до цієї сторінки
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {}
      <header className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-5 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Затвердження Відпусток</h1>
              <p className="text-sm opacity-90 mt-1">Перегляд та обробка запитів співробітників</p>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-white/20 hover:bg-white/30 border border-white/30 px-5 py-2 rounded-lg font-semibold transition-all"
            >
              ← Назад
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 py-10">
        {}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-5">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5">
            {error}
          </div>
        )}

        {}
        <div className="mb-8 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "pending"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            ⏳ На розгляді ({pendingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "all"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            📋 Всі запити ({allRequests.length})
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Завантаження...</div>
        ) : (
          <div className="space-y-4">
            {}
            {activeTab === "pending" &&
              (pendingRequests.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                  Немає запитів на розгляді
                </div>
              ) : (
                pendingRequests.map((request) => (
                  <div key={request._id} className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex justify-between items-start">
                      {}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center text-2xl">
                            👤
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-800">
                              {request.employeeId.personalInfo.firstName}{" "}
                              {request.employeeId.personalInfo.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {request.employeeId.jobInfo.jobTitle} •{" "}
                              {request.employeeId.jobInfo.department}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Тип відпустки</p>
                            <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                              {getLeaveTypeLabel(request.leaveType)}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Початок</p>
                            <p className="text-sm font-semibold text-gray-800">
                              {formatDate(request.startDate)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Закінчення</p>
                            <p className="text-sm font-semibold text-gray-800">
                              {formatDate(request.endDate)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Кількість днів</p>
                            <p className="text-2xl font-bold text-purple-600">
                              {request.totalDays}
                            </p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-xs text-gray-500 mb-1">Причина</p>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                            {request.reason}
                          </p>
                        </div>

                        {}
                        {reviewingRequest === request._id && (
                          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Коментар (необов'язково для затвердження, обов'язково для відхилення)
                            </label>
                            <textarea
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              rows={3}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 focus:outline-none"
                              placeholder="Вкажіть коментар..."
                            />
                          </div>
                        )}
                      </div>

                      {}
                      <div className="ml-6 flex flex-col gap-3">
                        {reviewingRequest === request._id ? (
                          <>
                            <button
                              onClick={() => handleApprove(request._id)}
                              className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                            >
                              ✓ Затвердити
                            </button>
                            <button
                              onClick={() => handleReject(request._id)}
                              className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                            >
                              ✗ Відхилити
                            </button>
                            <button
                              onClick={() => {
                                setReviewingRequest(null);
                                setReviewComment("");
                              }}
                              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                            >
                              Скасувати
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setReviewingRequest(request._id)}
                            className="px-6 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all"
                          >
                            Розглянути
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ))}

            {}
            {activeTab === "all" && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Співробітник
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Тип
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Дати
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Дні
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Статус
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Коментар
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {allRequests.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            Немає запитів
                          </td>
                        </tr>
                      ) : (
                        allRequests.map((request) => (
                          <tr key={request._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">
                                {request.employeeId.personalInfo.firstName}{" "}
                                {request.employeeId.personalInfo.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.employeeId.jobInfo.jobTitle}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {getLeaveTypeLabel(request.leaveType)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {formatDate(request.startDate)} - {formatDate(request.endDate)}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                              {request.totalDays}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  request.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : request.status === "approved"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {getStatusLabel(request.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {request.reviewComment || "—"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
});

export default LeaveApprovals;
