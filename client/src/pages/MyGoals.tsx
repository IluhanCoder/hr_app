

import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useStores } from "../stores/RootStore";
import { useNavigate } from "react-router-dom";

interface Goal {
  _id: string;
  title: string;
  description: string;
  type: "individual" | "team";
  goalCategory: "KPI" | "OKR";
  department?: string;
  createdBy: {
    personalInfo: {
      firstName: string;
      lastName: string;
    };
  };
  startDate: string;
  endDate: string;
  targetValue: number;
  currentValue: number;
  unit: "percentage" | "number" | "currency";
  status: "active" | "completed" | "cancelled";
  progressPercentage: number;
}

const MyGoals: React.FC = observer(() => {
  const { authStore } = useStores();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingGoal, setUpdatingGoal] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState("");
  const [progressComment, setProgressComment] = useState("");

  useEffect(() => {
    loadMyGoals();
  }, []);

  const loadMyGoals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5001/api/goals/my", {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });

      const data = await response.json();
      if (data.success) {
        setGoals(data.data);
      }
    } catch (err) {
      console.error("Error loading goals:", err);
      setError("Не вдалося завантажити цілі");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProgress = async (goalId: string) => {
    if (!progressValue) {
      setError("Вкажіть нове значення прогресу");
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`http://localhost:5001/api/goals/${goalId}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          newValue: parseFloat(progressValue),
          comment: progressComment,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Прогрес оновлено!");
        setUpdatingGoal(null);
        setProgressValue("");
        setProgressComment("");
        loadMyGoals();
      } else {
        setError(data.message || "Помилка при оновленні прогресу");
      }
    } catch (err: any) {
      setError("Помилка при оновленні прогресу");
    }
  };

  const getUnitLabel = (unit: string) => {
    switch (unit) {
      case "percentage":
        return "%";
      case "number":
        return "";
      case "currency":
        return "₴";
      default:
        return "";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Активна";
      case "completed":
        return "Завершена";
      case "cancelled":
        return "Скасована";
      default:
        return status;
    }
  };

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");

  const onboardingGoal = activeGoals.find((g) => g.title === "Завершити онбординг");

  return (
    <div className="min-h-screen bg-gray-50">
      {}
      <header className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-5 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Мої Цілі</h1>
              <p className="text-sm opacity-90 mt-1">Перегляд та оновлення прогресу</p>
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
        {onboardingGoal && onboardingGoal.progressPercentage < 100 && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 mb-6 shadow-md">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🎯</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Ласкаво просимо до команди! 👋
                </h3>
                <p className="text-gray-700 mb-3">
                  Ми автоматично створили для вас онбординг план. 
                  Завершіть всі навчальні матеріали протягом 30 днів, щоб успішно адаптуватися в компанії.
                </p>
                <div className="bg-white/60 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Прогрес онбордингу:</span>
                    <span className="text-sm font-bold text-blue-600">
                      {onboardingGoal.progressPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${onboardingGoal.progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                🎯
              </div>
              <div>
                <p className="text-sm text-gray-600">Активні цілі</p>
                <p className="text-3xl font-bold text-gray-800">{activeGoals.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                ✅
              </div>
              <div>
                <p className="text-sm text-gray-600">Завершені</p>
                <p className="text-3xl font-bold text-gray-800">{completedGoals.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                📊
              </div>
              <div>
                <p className="text-sm text-gray-600">Загалом</p>
                <p className="text-3xl font-bold text-gray-800">{goals.length}</p>
              </div>
            </div>
          </div>
        </div>

        {}
        {activeGoals.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Активні Цілі</h2>
            <div className="grid grid-cols-1 gap-5">
              {activeGoals.map((goal) => (
                <div key={goal._id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-800">{goal.title}</h3>
                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          {goal.goalCategory}
                        </span>
                        {goal.type === "team" && (
                          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            Командна
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{goal.description}</p>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500">Від менеджера</p>
                          <p className="text-sm font-semibold">
                            {goal.createdBy.personalInfo.firstName}{" "}
                            {goal.createdBy.personalInfo.lastName}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Період</p>
                          <p className="text-sm font-semibold">
                            {new Date(goal.startDate).toLocaleDateString("uk-UA")} -{" "}
                            {new Date(goal.endDate).toLocaleDateString("uk-UA")}
                          </p>
                        </div>
                        {goal.type === "team" && (
                          <div>
                            <p className="text-xs text-gray-500">Відділ</p>
                            <p className="text-sm font-semibold">{goal.department}</p>
                          </div>
                        )}
                      </div>

                      {}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-gray-700">Прогрес</span>
                          <span className="text-sm font-bold text-purple-600">
                            {goal.progressPercentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-[#667eea] to-[#764ba2] h-3 rounded-full transition-all"
                            style={{ width: `${Math.min(goal.progressPercentage, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-500">
                            Поточне: {goal.currentValue}
                            {getUnitLabel(goal.unit)}
                          </span>
                          <span className="text-xs text-gray-500">
                            Ціль: {goal.targetValue}
                            {getUnitLabel(goal.unit)}
                          </span>
                        </div>
                      </div>

                      {}
                      {updatingGoal === goal._id && (
                        <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                          <h4 className="font-semibold text-gray-800 mb-3">Оновити прогрес</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Нове значення *
                              </label>
                              <input
                                type="number"
                                value={progressValue}
                                onChange={(e) => setProgressValue(e.target.value)}
                                placeholder={`Поточне: ${goal.currentValue}`}
                                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Коментар (опціонально)
                              </label>
                              <textarea
                                value={progressComment}
                                onChange={(e) => setProgressComment(e.target.value)}
                                rows={2}
                                placeholder="Опис прогресу..."
                                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateProgress(goal._id)}
                                className="px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all"
                              >
                                Зберегти
                              </button>
                              <button
                                onClick={() => {
                                  setUpdatingGoal(null);
                                  setProgressValue("");
                                  setProgressComment("");
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                              >
                                Скасувати
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {}
                    {updatingGoal !== goal._id && (
                      <button
                        onClick={() => setUpdatingGoal(goal._id)}
                        className="ml-6 px-6 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all"
                      >
                        Оновити прогрес
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {}
        {completedGoals.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Завершені Цілі</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {completedGoals.map((goal) => (
                <div key={goal._id} className="bg-white rounded-xl shadow-md p-6 opacity-75">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-800">{goal.title}</h3>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Завершена
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">
                      Досягнуто: {goal.currentValue}/{goal.targetValue}
                      {getUnitLabel(goal.unit)}
                    </span>
                    <span className="text-green-600 font-bold">✓ {goal.progressPercentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Завантаження...</div>
        ) : goals.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Немає цілей</h3>
            <p className="text-gray-600">
              Ваш менеджер ще не встановив для вас жодних цілей
            </p>
          </div>
        ) : null}
      </main>
    </div>
  );
});

export default MyGoals;
