

import React, { useState, useEffect } from "react";
const API_URL = process.env.REACT_APP_API_URL;
import apiClient from "../services/api";
import { UkDatePicker } from "../components/UkDatePicker";
import { observer } from "mobx-react-lite";
import { useStores } from "../stores/RootStore";
import { useNavigate } from "react-router-dom";

interface Goal {
  _id: string;
  title: string;
  description: string;
  type: "individual" | "team";
  goalCategory: "KPI" | "OKR";
  assignedTo?: {
    _id: string;
    personalInfo: {
      firstName: string;
      lastName: string;
    };
    email: string;
  };
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
  createdAt: string;
}

interface Employee {
  id: string;
  email: string;
  personalInfo: {
    firstName: string;
    lastName: string;
  };
  jobInfo: {
    department: string;
  };
}

const GoalsManagement: React.FC = observer(() => {
  const { authStore } = useStores();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressValue, setProgressValue] = useState("");
  const [progressComment, setProgressComment] = useState("");
  const [savingProgress, setSavingProgress] = useState(false);

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const [goalForm, setGoalForm] = useState({
    title: "",
    description: "",
    type: "individual" as "individual" | "team",
    goalCategory: "KPI" as "KPI" | "OKR",
    assignedTo: "",
    department: "",
    startDate: "",
    endDate: "",
    targetValue: "",
    unit: "number" as "percentage" | "number" | "currency",
  });

  useEffect(() => {
    loadGoals();
    loadEmployees();
    loadDepartments();
  }, []);

  const loadGoals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/goals`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });

      const data = await response.json();
      if (data.success) {
        setGoals(data.data);
      }
    } catch (err) {
      setError("Не вдалося завантажити цілі");
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });

      const data = await response.json();
      if (data.success) {

        const filteredEmployees = data.data.filter(
          (u: any) => u.role === "employee" || u.role === "line_manager"
        );
        setEmployees(filteredEmployees);
      }
    } catch (err) {
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await fetch(`${API_URL}/departments`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });

      const data = await response.json();
      if (data.success) {
        const deptNames = data.data.map((d: any) => d.name);
        setDepartments(deptNames);
      }
    } catch (err) {
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/goals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(goalForm),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Ціль успішно створена!");
        setShowCreateForm(false);
        setGoalForm({
          title: "",
          description: "",
          type: "individual",
          goalCategory: "KPI",
          assignedTo: "",
          department: "",
          startDate: "",
          endDate: "",
          targetValue: "",
          unit: "number",
        });
        loadGoals();
      } else {
        setError(data.message || "Помилка при створенні цілі");
      }
    } catch (err: any) {
      setError(err.message || "Помилка при створенні цілі");
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!window.confirm("Ви впевнені, що хочете видалити цю ціль?")) return;

    try {
      const response = await fetch(`${API_URL}/goals/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Ціль видалена");
        loadGoals();
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      setError("Помилка при видаленні цілі");
    }
  };

  const filteredGoals = goals.filter((goal) => {
    if (filterStatus !== "all" && goal.status !== filterStatus) return false;
    if (filterType !== "all" && goal.type !== filterType) return false;
    if (filterCategory !== "all" && goal.goalCategory !== filterCategory) return false;
    return true;
  });

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

  if (
    authStore.user?.role !== "line_manager" &&
    authStore.user?.role !== "hr_manager" &&
    authStore.user?.role !== "admin"
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Доступ заборонено</h2>
          <p className="text-gray-600">Тільки менеджери мають доступ до цієї сторінки</p>
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
              <h1 className="text-2xl font-bold">Управління Цілями (KPI/OKR)</h1>
              <p className="text-sm opacity-90 mt-1">Постановка та відстеження командних цілей</p>
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
        <div className="mb-8">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-6 py-3 rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all"
          >
            {showCreateForm ? "Скасувати" : "+ Створити Ціль"}
          </button>
        </div>

        {}
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-5">Нова Ціль</h3>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Назва цілі *
                  </label>
                  <input
                    type="text"
                    required
                    value={goalForm.title}
                    onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 focus:outline-none"
                    placeholder="Збільшити продажі на 20%"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Категорія *
                  </label>
                  <select
                    required
                    value={goalForm.goalCategory}
                    onChange={(e) =>
                      setGoalForm({ ...goalForm, goalCategory: e.target.value as "KPI" | "OKR" })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 focus:outline-none"
                  >
                    <option value="KPI">KPI</option>
                    <option value="OKR">OKR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Опис *</label>
                <textarea
                  required
                  value={goalForm.description}
                  onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 focus:outline-none"
                  placeholder="Детальний опис цілі..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Тип *</label>
                  <select
                    required
                    value={goalForm.type}
                    onChange={(e) =>
                      setGoalForm({
                        ...goalForm,
                        type: e.target.value as "individual" | "team",
                        assignedTo: "",
                        department: "",
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 focus:outline-none"
                  >
                    <option value="individual">Індивідуальна</option>
                    <option value="team">Командна</option>
                  </select>
                </div>

                {goalForm.type === "individual" ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Співробітник *
                    </label>
                    <select
                      required
                      value={goalForm.assignedTo}
                      onChange={(e) => setGoalForm({ ...goalForm, assignedTo: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 focus:outline-none"
                    >
                      <option value="">Оберіть співробітника</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.personalInfo.firstName} {emp.personalInfo.lastName} (
                          {emp.jobInfo.department})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Відділ *
                    </label>
                    <select
                      required
                      value={goalForm.department}
                      onChange={(e) => setGoalForm({ ...goalForm, department: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 focus:outline-none"
                    >
                      <option value="">Оберіть відділ</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Цільове значення *
                  </label>
                  <input
                    type="number"
                    required
                    value={goalForm.targetValue}
                    onChange={(e) => setGoalForm({ ...goalForm, targetValue: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 focus:outline-none"
                    placeholder="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Одиниця виміру *
                  </label>
                  <select
                    required
                    value={goalForm.unit}
                    onChange={(e) =>
                      setGoalForm({
                        ...goalForm,
                        unit: e.target.value as "percentage" | "number" | "currency",
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 focus:outline-none"
                  >
                    <option value="number">Число</option>
                    <option value="percentage">Відсотки</option>
                    <option value="currency">Гривні</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Дата початку *
                  </label>
                  <UkDatePicker
                    required
                    selected={goalForm.startDate ? new Date(goalForm.startDate) : null}
                    onChange={(date: Date | null) => setGoalForm({ ...goalForm, startDate: date ? date.toISOString().slice(0, 10) : "" })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 focus:outline-none"
                    placeholderText="Оберіть дату"
                    isClearable
                    dateFormat="yyyy-MM-dd"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Дата закінчення *
                  </label>
                  <UkDatePicker
                    required
                    selected={goalForm.endDate ? new Date(goalForm.endDate) : null}
                    onChange={(date: Date | null) => setGoalForm({ ...goalForm, endDate: date ? date.toISOString().slice(0, 10) : "" })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 focus:outline-none"
                    placeholderText="Оберіть дату"
                    isClearable
                    dateFormat="yyyy-MM-dd"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-6 py-3 rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all"
                >
                  Створити Ціль
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Скасувати
                </button>
              </div>
            </form>
          </div>
        )}

        {}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Фільтри</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Статус</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
              >
                <option value="all">Всі</option>
                <option value="active">Активні</option>
                <option value="completed">Завершені</option>
                <option value="cancelled">Скасовані</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Тип</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
              >
                <option value="all">Всі</option>
                <option value="individual">Індивідуальні</option>
                <option value="team">Командні</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Категорія</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
              >
                <option value="all">Всі</option>
                <option value="KPI">KPI</option>
                <option value="OKR">OKR</option>
              </select>
            </div>
          </div>
        </div>

        {}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Завантаження...</div>
        ) : filteredGoals.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">Немає цілей</div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {filteredGoals.map((goal) => (
              <div key={goal._id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{goal.title}</h3>
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                          goal.status
                        )}`}
                      >
                        {getStatusLabel(goal.status)}
                      </span>
                      <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        {goal.goalCategory}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{goal.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Тип</p>
                        <p className="text-sm font-semibold">
                          {goal.type === "individual" ? "Індивідуальна" : "Командна"}
                        </p>
                      </div>
                      {goal.type === "individual" && goal.assignedTo && (
                        <div>
                          <p className="text-xs text-gray-500">Співробітник</p>
                          <p className="text-sm font-semibold">
                            {goal.assignedTo.personalInfo.firstName}{" "}
                            {goal.assignedTo.personalInfo.lastName}
                          </p>
                        </div>
                      )}
                      {goal.type === "team" && (
                        <div>
                          <p className="text-xs text-gray-500">Відділ</p>
                          <p className="text-sm font-semibold">{goal.department}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500">Період</p>
                        <p className="text-sm font-semibold">
                          {new Date(goal.startDate).toLocaleDateString("uk-UA")} -{" "}
                          {new Date(goal.endDate).toLocaleDateString("uk-UA")}
                        </p>
                      </div>
                    </div>

                    {}
                    <div className="mb-3">
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
                  </div>

                  {}
                  <div className="ml-6 flex flex-col gap-2">
                    <button
                      onClick={() => setSelectedGoal(goal)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Деталі
                    </button>
                    <button
                      onClick={() => {
                        setSelectedGoal(goal);
                        setProgressValue("");
                        setProgressComment("");
                        setShowProgressModal(true);
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
                    >
                      Оновити прогрес
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                    >
                      Видалити
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {}
      {selectedGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Деталі цілі</h2>
                <button
                  onClick={() => setSelectedGoal(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {selectedGoal.title}
                  </h3>
                  <p className="text-gray-600">{selectedGoal.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Тип:</span>
                    <p className="font-semibold">
                      {selectedGoal.type === "individual" ? "Індивідуальна" : "Командна"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Категорія:</span>
                    <p className="font-semibold">{selectedGoal.goalCategory}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Статус:</span>
                    <p className="font-semibold">
                      {selectedGoal.status === "active"
                        ? "Активна"
                        : selectedGoal.status === "completed"
                        ? "Завершена"
                        : "Скасована"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Прогрес:</span>
                    <p className="font-semibold">{selectedGoal.progressPercentage}%</p>
                  </div>
                </div>

                {selectedGoal.assignedTo && (
                  <div>
                    <span className="text-sm text-gray-500">Призначено:</span>
                    <p className="font-semibold">
                      {selectedGoal.assignedTo.personalInfo.firstName}{" "}
                      {selectedGoal.assignedTo.personalInfo.lastName}
                    </p>
                  </div>
                )}

                {selectedGoal.department && (
                  <div>
                    <span className="text-sm text-gray-500">Відділ:</span>
                    <p className="font-semibold">{selectedGoal.department}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Дата початку:</span>
                    <p className="font-semibold">
                      {new Date(selectedGoal.startDate).toLocaleDateString("uk-UA")}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Дата завершення:</span>
                    <p className="font-semibold">
                      {new Date(selectedGoal.endDate).toLocaleDateString("uk-UA")}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Поточне значення:</span>
                    <p className="font-semibold text-blue-600">
                      {selectedGoal.currentValue}{" "}
                      {selectedGoal.unit === "percentage"
                        ? "%"
                        : selectedGoal.unit === "currency"
                        ? "грн"
                        : ""}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Цільове значення:</span>
                    <p className="font-semibold text-green-600">
                      {selectedGoal.targetValue}{" "}
                      {selectedGoal.unit === "percentage"
                        ? "%"
                        : selectedGoal.unit === "currency"
                        ? "грн"
                        : ""}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-sm text-gray-500">Створено:</span>
                  <p className="font-semibold">
                    {selectedGoal.createdBy.personalInfo.firstName}{" "}
                    {selectedGoal.createdBy.personalInfo.lastName} -{" "}
                    {new Date(selectedGoal.createdAt).toLocaleDateString("uk-UA")}
                  </p>
                </div>

                {}
                <div className="mt-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Прогрес виконання</span>
                    <span className="text-sm font-semibold text-gray-700">
                      {selectedGoal.progressPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all"
                      style={{ width: `${selectedGoal.progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedGoal(null)}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
                >
                  Закрити
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProgressModal && selectedGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800">Оновити прогрес</h3>
                <button
                  onClick={() => setShowProgressModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Нове значення *</label>
                  <input
                    type="number"
                    value={progressValue}
                    onChange={(e) => setProgressValue(e.target.value)}
                    placeholder={`Поточне: ${selectedGoal.currentValue}`}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Коментар (опціонально)</label>
                  <textarea
                    rows={3}
                    value={progressComment}
                    onChange={(e) => setProgressComment(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    placeholder="Опишіть зміну..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setShowProgressModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold"
                >
                  Скасувати
                </button>
                <button
                  disabled={savingProgress}
                  onClick={async () => {
                    if (!progressValue) return;
                    setSavingProgress(true);
                    try {
                      await apiClient.post(`/goals/${selectedGoal._id}/progress`, {
                        newValue: parseFloat(progressValue),
                        comment: progressComment,
                      });
                      setShowProgressModal(false);
                      setProgressValue("");
                      setProgressComment("");
                      await loadGoals();
                    } catch (e) {
                    } finally {
                      setSavingProgress(false);
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold"
                >
                  {savingProgress ? "Збереження..." : "Зберегти"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default GoalsManagement;
