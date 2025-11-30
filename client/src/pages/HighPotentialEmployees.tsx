

import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useStores } from "../stores/RootStore";
import { toast } from "react-toastify";
import ConfirmDialog from "../components/ConfirmDialog";
import apiClient from "../services/api";

interface IUser {
  id: string;
  personalInfo: {
    firstName: string;
    lastName: string;
  };
  email: string;
  jobInfo: {
    jobTitle: string;
    department: string;
  };
  highPotential?: {
    isHighPotential: boolean;
    markedBy?: {
      personalInfo: {
        firstName: string;
        lastName: string;
      };
    };
    markedAt?: string;
    reason?: string;
    potentialLevel?: "high" | "critical";
  };
}

const HighPotentialEmployees: React.FC = observer(() => {
  const { authStore } = useStores();
  const [highPotentialUsers, setHighPotentialUsers] = useState<IUser[]>([]);
  const [allUsers, setAllUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [newHiPo, setNewHiPo] = useState({
    userId: "",
    reason: "",
    potentialLevel: "high" as "high" | "critical",
  });

  useEffect(() => {
    loadHighPotentialEmployees();
    loadAllUsers();
  }, []);

  const loadHighPotentialEmployees = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/high-potential");
      setHighPotentialUsers(response.data.data || response.data);
    } catch (error: any) {
      console.error("Error loading high potential employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const response = await apiClient.get("/users");
      setAllUsers(response.data.data || response.data);
    } catch (error: any) {
      console.error("Error loading users:", error);
    }
  };

  const handleMarkAsHighPotential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHiPo.userId) {
      toast.warning("Оберіть співробітника!");
      return;
    }

    try {
      await apiClient.post(`/high-potential/${newHiPo.userId}/mark`, {
        reason: newHiPo.reason,
        potentialLevel: newHiPo.potentialLevel,
      });
      toast.success("Співробітника позначено як високопотенційного!");
      setShowAddForm(false);
      setNewHiPo({ userId: "", reason: "", potentialLevel: "high" });
      loadHighPotentialEmployees();
      loadAllUsers();
    } catch (error: any) {
      toast.error("Помилка: " + (error.response?.data?.message || error.message));
    }
  };

  const handleUnmark = (userId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Зняття позначки високого потенціалу",
      message: "Ви впевнені, що хочете зняти позначку високого потенціалу?",
      onConfirm: () => executeUnmark(userId),
    });
  };

  const executeUnmark = async (userId: string) => {
    try {
      await apiClient.delete(`/high-potential/${userId}/unmark`);
      toast.success("Позначку знято!");
      loadHighPotentialEmployees();
      loadAllUsers();
    } catch (error: any) {
      toast.error("Помилка: " + (error.response?.data?.message || error.message));
    }
  };

  const getPotentialLevelLabel = (level?: string) => {
    switch (level) {
      case "high":
        return "Високий";
      case "critical":
        return "Критичний";
      default:
        return "N/A";
    }
  };

  const getPotentialLevelColor = (level?: string) => {
    switch (level) {
      case "high":
        return "bg-blue-100 text-blue-700";
      case "critical":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const availableUsers = allUsers.filter(
    (user) => !user.highPotential?.isHighPotential && user.id !== authStore.user?.id
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Кадровий Резерв (High Potential)
            </h1>
            <p className="text-gray-600 mt-2">
              Управління співробітниками з високим потенціалом
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            {showAddForm ? "Скасувати" : "+ Додати до резерву"}
          </button>
        </div>

        {}
        {showAddForm && (
          <div className="bg-white rounded-xl p-8 shadow-md mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Додати співробітника до кадрового резерву
            </h2>
            <form onSubmit={handleMarkAsHighPotential} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Співробітник:
                </label>
                <select
                  value={newHiPo.userId}
                  onChange={(e) => setNewHiPo({ ...newHiPo, userId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                >
                  <option value="">-- Оберіть співробітника --</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.personalInfo.firstName} {user.personalInfo.lastName} -{" "}
                      {user.jobInfo.jobTitle} ({user.jobInfo.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Рівень потенціалу:
                </label>
                <select
                  value={newHiPo.potentialLevel}
                  onChange={(e) =>
                    setNewHiPo({
                      ...newHiPo,
                      potentialLevel: e.target.value as "high" | "critical",
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                >
                  <option value="high">Високий</option>
                  <option value="critical">Критичний</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Обґрунтування:
                </label>
                <textarea
                  value={newHiPo.reason}
                  onChange={(e) => setNewHiPo({ ...newHiPo, reason: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  rows={4}
                  placeholder="Чому цей співробітник має високий потенціал?"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Додати до резерву
              </button>
            </form>
          </div>
        )}

        {}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-gray-600">Завантаження...</div>
          </div>
        ) : highPotentialUsers.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-md text-center">
            <p className="text-gray-600 text-lg">
              Жодного співробітника ще не додано до кадрового резерву
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {highPotentialUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-gray-800">
                        {user.personalInfo.firstName} {user.personalInfo.lastName}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${getPotentialLevelColor(
                          user.highPotential?.potentialLevel
                        )}`}
                      >
                        ⭐ {getPotentialLevelLabel(user.highPotential?.potentialLevel)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-semibold">Посада:</span>{" "}
                      {user.jobInfo.jobTitle}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-semibold">Департамент:</span>{" "}
                      {user.jobInfo.department}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-semibold">Email:</span> {user.email}
                    </p>

                    {user.highPotential?.reason && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Обґрунтування:</span>{" "}
                          {user.highPotential.reason}
                        </p>
                      </div>
                    )}

                    <div className="mt-3 text-xs text-gray-500">
                      Позначено:{" "}
                      {user.highPotential?.markedBy
                        ? `${user.highPotential.markedBy.personalInfo.firstName} ${user.highPotential.markedBy.personalInfo.lastName}`
                        : "N/A"}{" "}
                      |{" "}
                      {user.highPotential?.markedAt
                        ? new Date(user.highPotential.markedAt).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUnmark(user.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
                    >
                      Видалити з резерву
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant="warning"
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
});

export default HighPotentialEmployees;
