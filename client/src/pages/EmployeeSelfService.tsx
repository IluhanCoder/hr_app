

import React, { useState, useEffect } from "react";
import { UkDatePicker } from "../components/UkDatePicker";
import { observer } from "mobx-react-lite";
import { useStores } from "../stores/RootStore";
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";

interface UserProfile {
  id: string;
  email: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    phone?: string;
    address?: string;
  };
  jobInfo: {
    jobTitle: string;
    department: string;
    startDate: string;
    employmentType: string;
    salary?: number;
  };
  leaveBalance: {
    annual: number;
    sick: number;
    personal: number;
  };
  role: string;
  status: string;
}

interface PaySlip {
  id: string;
  month: string;
  year: number;
  grossSalary: number;
  deductions: number;
  netSalary: number;
  fileUrl?: string;
}

interface LeaveRequest {
  _id: string;
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

const EmployeeSelfService: React.FC = observer(() => {
  const { authStore } = useStores();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [paySlips, setPaySlips] = useState<PaySlip[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"profile" | "leave" | "payslips">(
    (searchParams.get("tab") as "profile" | "leave" | "payslips") || "profile"
  );
  const [showLeaveForm, setShowLeaveForm] = useState(false);

  const [leaveForm, setLeaveForm] = useState({
    leaveType: "annual",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5001/api/users/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setProfile(data.data);
      } else {
        setError("Не вдалося завантажити профіль");
      }
    } catch (err) {
      setError("Помилка завантаження даних");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPaySlips = async () => {

    const now = new Date();
    const slips: PaySlip[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      try {
        const resp = await fetch(`http://localhost:5001/api/payroll/calculate?period=${period}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        });
        const data = await resp.json();
        if (data.success && data.payroll) {
          slips.push({
            id: period,
            month: d.toLocaleString("uk-UA", { month: "long" }),
            year: d.getFullYear(),
            grossSalary: data.payroll.gross,
            deductions: data.payroll.taxes.total,
            netSalary: data.payroll.net,
          });
        }
      } catch (e) {

      }
    }
    setPaySlips(slips);
  };


  const loadLeaveRequests = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/leaves/my", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setLeaveRequests(data.data);
      }
    } catch (err) {
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      setError("Всі поля обов'язкові");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5001/api/leaves", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(leaveForm),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Запит на відпустку подано успішно!");
        setLeaveForm({ leaveType: "annual", startDate: "", endDate: "", reason: "" });
        setShowLeaveForm(false);
        loadLeaveRequests();
        loadProfile();
      } else {
        setError(data.message || "Помилка при створенні запиту");
      }
    } catch (err: any) {
      setError(err.message || "Помилка при створенні запиту");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!window.confirm("Ви впевнені, що хочете скасувати цей запит?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/leaves/${requestId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Запит скасовано");
        loadLeaveRequests();
      } else {
        setError(data.message || "Помилка при скасуванні");
      }
    } catch (err: any) {
      setError(err.message || "Помилка при скасуванні");
    }
  };

  useEffect(() => {
    loadProfile();
    loadPaySlips();
    loadLeaveRequests();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("uk-UA");
  };

  const downloadPaySlip = (paySlip: PaySlip) => {

    toast.info(`Завантаження платіжки за ${paySlip.month} ${paySlip.year}`);
  };

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-2xl">⏳</div>
          <p className="mt-2 text-gray-600">Завантаження...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {}
      <header className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-5 py-5">
          <h1 className="text-2xl font-bold">Мій Профіль</h1>
          <p className="text-sm opacity-90 mt-1">
            Employee Self-Service - особистий кабінет
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 py-10">
        {}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5">
            {error}
          </div>
        )}

        {}
        <div className="mb-8 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "profile"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            👤 Моя Інформація
          </button>
          <button
            onClick={() => setActiveTab("leave")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "leave"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            🏖️ Відпустки
          </button>
          <button
            onClick={() => setActiveTab("payslips")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "payslips"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            💰 Платіжні Листки
          </button>
        </div>

        {}
        {activeTab === "profile" && profile && (
          <div className="space-y-6">
            {}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span>👤</span> Особиста Інформація
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Ім'я
                  </label>
                  <p className="text-lg text-gray-800">{profile.personalInfo.firstName}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Прізвище
                  </label>
                  <p className="text-lg text-gray-800">{profile.personalInfo.lastName}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Email
                  </label>
                  <p className="text-lg text-gray-800">{profile.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Телефон
                  </label>
                  <p className="text-lg text-gray-800">
                    {profile.personalInfo.phone || "Не вказано"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Дата народження
                  </label>
                  <p className="text-lg text-gray-800">
                    {formatDate(profile.personalInfo.dateOfBirth)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Адреса
                  </label>
                  <p className="text-lg text-gray-800">
                    {profile.personalInfo.address || "Не вказано"}
                  </p>
                </div>
              </div>
            </div>

            {}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span>💼</span> Інформація про Роботу
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Посада
                  </label>
                  <p className="text-lg text-gray-800">{profile.jobInfo.jobTitle}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Відділ
                  </label>
                  <p className="text-lg text-gray-800">{profile.jobInfo.department}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Дата початку роботи
                  </label>
                  <p className="text-lg text-gray-800">
                    {formatDate(profile.jobInfo.startDate)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Тип зайнятості
                  </label>
                  <p className="text-lg text-gray-800 capitalize">
                    {profile.jobInfo.employmentType}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Роль в системі
                  </label>
                  <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                    {profile.role}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Статус
                  </label>
                  <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800 capitalize">
                    {profile.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {}
        {activeTab === "leave" && profile && (
          <div className="space-y-6">
            {}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span>🏖️</span> Залишок Днів Відпустки
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">🌴</span>
                    <span className="text-xs font-semibold text-blue-600 uppercase">
                      Щорічна
                    </span>
                  </div>
                  <div className="text-4xl font-bold text-blue-700 mb-2">
                    {profile.leaveBalance.annual}
                  </div>
                  <p className="text-sm text-blue-600">днів доступно</p>
                </div>

                {}
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border-2 border-red-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">🏥</span>
                    <span className="text-xs font-semibold text-red-600 uppercase">
                      Лікарняні
                    </span>
                  </div>
                  <div className="text-4xl font-bold text-red-700 mb-2">
                    {profile.leaveBalance.sick}
                  </div>
                  <p className="text-sm text-red-600">днів доступно</p>
                </div>

                {}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">🎯</span>
                    <span className="text-xs font-semibold text-purple-600 uppercase">
                      Особисті
                    </span>
                  </div>
                  <div className="text-4xl font-bold text-purple-700 mb-2">
                    {profile.leaveBalance.personal}
                  </div>
                  <p className="text-sm text-purple-600">днів доступно</p>
                </div>
              </div>
            </div>

            {}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Мої Запити на Відпустку</h2>
              <button
                onClick={() => setShowLeaveForm(!showLeaveForm)}
                className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-6 py-3 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                {showLeaveForm ? "❌ Скасувати" : "➕ Подати запит"}
              </button>
            </div>

            {}
            {showLeaveForm && (
              <div className="bg-white rounded-xl shadow-md p-8">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Новий запит на відпустку</h3>

                <form onSubmit={handleLeaveSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Тип відпустки *
                      </label>
                      <select
                        value={leaveForm.leaveType}
                        onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                      >
                        <option value="annual">Щорічна відпустка</option>
                        <option value="sick">Лікарняний</option>
                        <option value="personal">Особистий день</option>
                        <option value="unpaid">Без збереження зарплати</option>
                      </select>
                    </div>

                    <div className="md:col-span-2 grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Дата початку *
                        </label>
                        <UkDatePicker
                          selected={leaveForm.startDate ? new Date(leaveForm.startDate) : null}
                          onChange={(date: Date | null) => setLeaveForm({ ...leaveForm, startDate: date ? date.toISOString().slice(0, 10) : "" })}
                          required
                          minDate={new Date()}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
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
                          selected={leaveForm.endDate ? new Date(leaveForm.endDate) : null}
                          onChange={(date: Date | null) => setLeaveForm({ ...leaveForm, endDate: date ? date.toISOString().slice(0, 10) : "" })}
                          required
                          minDate={leaveForm.startDate ? new Date(leaveForm.startDate) : new Date()}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                          placeholderText="Оберіть дату"
                          isClearable
                          dateFormat="yyyy-MM-dd"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Причина *
                      </label>
                      <textarea
                        value={leaveForm.reason}
                        onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                        required
                        rows={3}
                        placeholder="Вкажіть причину запиту на відпустку..."
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-8 py-3 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
                    >
                      {isLoading ? "Відправка..." : "Подати запит"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLeaveForm(false)}
                      className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold transition-all hover:bg-gray-300"
                    >
                      Скасувати
                    </button>
                  </div>
                </form>
              </div>
            )}

            {}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800">Історія запитів</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
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
                        Дії
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {leaveRequests.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          Немає запитів на відпустку
                        </td>
                      </tr>
                    ) : (
                      leaveRequests.map((request) => (
                        <tr key={request._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                              {request.leaveType === "annual"
                                ? "Щорічна"
                                : request.leaveType === "sick"
                                ? "Лікарняний"
                                : request.leaveType === "personal"
                                ? "Особистий"
                                : "Без оплати"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(request.startDate).toLocaleDateString("uk-UA")} -{" "}
                            {new Date(request.endDate).toLocaleDateString("uk-UA")}
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
                              {request.status === "pending"
                                ? "Очікування"
                                : request.status === "approved"
                                ? "Затверджено"
                                : request.status === "rejected"
                                ? "Відхилено"
                                : "Скасовано"}
                            </span>
                            {request.reviewComment && (
                              <p className="text-xs text-gray-500 mt-1">{request.reviewComment}</p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {request.status === "pending" && (
                              <button
                                onClick={() => handleCancelRequest(request._id)}
                                className="text-red-600 hover:text-red-800 font-semibold text-sm"
                              >
                                Скасувати
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <p className="text-sm text-yellow-800">
                <strong>ℹ️ Інформація:</strong> Залишок днів оновлюється автоматично після
                затвердження запитів на відпустку вашим менеджером.
              </p>
            </div>
          </div>
        )}

        {}
        {activeTab === "payslips" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <span>💰</span> Платіжні Листки
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Завантажте свої платіжні листки за попередні місяці
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Період
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Зарплата (брутто)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Утримання
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        До виплати (нетто)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Дії
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paySlips.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          Платіжні листки відсутні
                        </td>
                      </tr>
                    ) : (
                      paySlips.map((slip) => (
                        <tr key={slip.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                              {slip.month} {slip.year}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {slip.grossSalary.toLocaleString("uk-UA")} ₴
                          </td>
                          <td className="px-6 py-4 text-red-600">
                            -{slip.deductions.toLocaleString("uk-UA")} ₴
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-green-600">
                              {slip.netSalary.toLocaleString("uk-UA")} ₴
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => downloadPaySlip(slip)}
                              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold text-sm"
                            >
                              <span>📥</span> Завантажити
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>📋</span> Інформація про виплати
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  • Платіжні листки формуються автоматично кожного місяця після нарахування
                  заробітної плати
                </p>
                <p>
                  • Ви можете завантажити листки за останні 12 місяців у форматі PDF
                </p>
                <p>
                  • При виникненні питань щодо виплат звертайтесь до відділу кадрів або
                  фінансового відділу
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
});

export default EmployeeSelfService;
