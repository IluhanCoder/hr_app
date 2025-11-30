

import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useStores } from "../stores/RootStore";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ConfirmDialog from "../components/ConfirmDialog";
import PromptDialog from "../components/PromptDialog";

interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
}

interface Employee {
  id: string;
  email: string;
  personalInfo: {
    firstName: string;
    lastName: string;
  };
  role: string;
  status: string;
  jobInfo: {
    jobTitle: string;
    department: string;
  };
}

interface CreateEmployeeForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  jobTitle: string;
  department: string;
  salary?: number;
}

const EmployeeManagement: React.FC = observer(() => {
  const { authStore } = useStores();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const candidateId = searchParams.get("candidateId");
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobProfiles, setJobProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferEmployee, setTransferEmployee] = useState<Employee | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState("");

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    variant: "warning" as "danger" | "warning" | "info" | "success",
    onConfirm: () => {},
  });

  const [formData, setFormData] = useState<CreateEmployeeForm>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "employee",
    jobTitle: "",
    department: "",
    salary: undefined,
  });

  const [candidateSkills, setCandidateSkills] = useState<any[]>([]);

  const loadCandidateData = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5001/api/recruitment/${id}/convert-to-employee`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setFormData({
          firstName: data.data.firstName || "",
          lastName: data.data.lastName || "",
          email: data.data.email || "",
          password: "",
          role: "employee",
          jobTitle: data.data.position || "",
          department: data.data.department?.toLowerCase() || "it",
          salary: data.data.salary || undefined,
        });

        setCandidateSkills(data.data.skills || []);
        setShowCreateForm(true);
        setSuccess(`Дані кандидата завантажено${data.data.skills?.length ? ` (включно з ${data.data.skills.length} навичками)` : ""}. Будь ласка, введіть пароль для створення акаунту.`);
      } else {
        setError(data.message || "Не вдалося завантажити дані кандидата");
      }
    } catch (err) {
      console.error("Failed to load candidate data:", err);
      setError("Помилка при завантаженні даних кандидата");
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/departments", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setDepartments(data.data || []);
      } else {
        setDepartments([]);
      }
    } catch (err) {
      console.error("Failed to load departments:", err);
      setDepartments([]);
    }
  };

  const fetchJobProfiles = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/skills/job-profiles", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setJobProfiles(data.data || []);
      } else {
        setJobProfiles([]);
      }
    } catch (err) {
      console.error("Failed to load job profiles:", err);
      setJobProfiles([]);
    }
  };

  const loadEmployees = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5001/api/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setEmployees(data.data);
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
    fetchDepartments();
    fetchJobProfiles();

    if (candidateId) {
      loadCandidateData(candidateId);
    }
  }, [candidateId]);

  const handleToggleForm = () => {
    if (!showCreateForm) {

      navigate("/employees", { replace: true });

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "employee",
        jobTitle: "",
        department: "",
        salary: undefined,
      });
    }
    setShowCreateForm(!showCreateForm);
    setError("");
    setSuccess("");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError("Всі обов'язкові поля мають бути заповнені");
      return;
    }

    if (formData.password.length < 6) {
      setError("Пароль повинен містити принаймні 6 символів");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5001/api/users/create-employee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {

        if (candidateSkills.length > 0 && data.data?.id) {
          try {
            await fetch(`http://localhost:5001/api/users/${data.data.id}/skills`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              },
              body: JSON.stringify({ skills: candidateSkills }),
            });
            console.log(`✅ Перенесено ${candidateSkills.length} навичок від кандидата до співробітника`);
          } catch (skillError) {
            console.error("Помилка при перенесенні навичок:", skillError);

          }
        }

        setSuccess(data.message || `Співробітника успішно створено!${candidateSkills.length > 0 ? ` Перенесено ${candidateSkills.length} навичок.` : ""} 🎯 Автоматично створено онбординг Goal.`);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          role: "employee",
          jobTitle: "",
          department: "",
          salary: undefined,
        });
        setCandidateSkills([]);
        setShowCreateForm(false);

        navigate("/employees", { replace: true });
        loadEmployees();
      } else {
        setError(data.message || "Не вдалося створити співробітника");
      }
    } catch (err: any) {
      setError(err.message || "Помилка при створенні співробітника");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async (employeeId: string) => {
    if (!window.confirm("Ви впевнені, що хочете деактивувати цього співробітника?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/users/${employeeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Співробітника деактивовано");
        loadEmployees();
      } else {
        toast.error(data.message || "Не вдалося деактивувати співробітника");
      }
    } catch (err: any) {
      toast.error(err.message || "Помилка при деактивації");
    }
  };

  const handleOpenTransfer = (employee: Employee) => {
    setTransferEmployee(employee);
    setSelectedDepartment(employee.jobInfo.department);
    setShowTransferDialog(true);
  };

  const handleTransferDepartment = async (removeAsManager: boolean = false) => {
    if (!transferEmployee || !selectedDepartment) {
      toast.warning("Оберіть відділ для переміщення");
      return;
    }

    if (selectedDepartment === transferEmployee.jobInfo.department) {
      toast.warning("Співробітник вже в цьому відділі");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `http://localhost:5001/api/users/${transferEmployee.id}/transfer-department`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({
            newDepartment: selectedDepartment,
            removeAsManager,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setShowTransferDialog(false);
        setTransferEmployee(null);
        loadEmployees();
      } else if (data.requiresConfirmation) {

        const deptNames = data.managedDepartments.map((d: any) => d.name).join(", ");
        setConfirmDialog({
          isOpen: true,
          title: "⚠️ Користувач є менеджером",
          message: `${transferEmployee.personalInfo.firstName} ${transferEmployee.personalInfo.lastName} є менеджером відділу: ${deptNames}.\n\nПри переміщенні користувач буде знятий з посади менеджера. Продовжити?`,
          variant: "warning",
          onConfirm: () => handleTransferDepartment(true),
        });
      } else {
        toast.error(data.message || "Не вдалося перемістити співробітника");
      }
    } catch (err: any) {
      toast.error(err.message || "Помилка при переміщенні");
    } finally {
      setIsLoading(false);
    }
  };

  if (authStore.user?.role !== "hr_manager" && authStore.user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Доступ заборонено</h2>
          <p className="text-gray-600">Тільки HR-менеджери мають доступ до цієї сторінки</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {}
      <header className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-5 py-5">
          <h1 className="text-2xl font-bold">Управління Співробітниками</h1>
          <p className="text-sm opacity-90 mt-1">UC-101: Керувати профілем</p>
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
        <div className="mb-8 flex gap-4">
          <button
            onClick={handleToggleForm}
            className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-6 py-3 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            {showCreateForm ? "Скасувати" : "➕ Створити співробітника"}
          </button>
          
          <button
            onClick={loadEmployees}
            disabled={isLoading}
            className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-all hover:bg-gray-50 disabled:opacity-50"
          >
            🔄 Оновити
          </button>
        </div>

        {}
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {candidateId ? "Створення акаунту для кандидата" : "Створення нового співробітника"}
            </h2>
            
            {candidateId && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-5">
                ℹ️ Дані завантажено з профілю кандидата. Будь ласка, введіть пароль для завершення створення акаунту.
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ім'я *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                    placeholder="Іван"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Прізвище *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                    placeholder="Петренко"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                    placeholder="ivan.petrenko@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Пароль * {candidateId && <span className="text-red-500">← Введіть пароль</span>}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    autoFocus={!!candidateId}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-4 focus:outline-none ${
                      candidateId 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-yellow-50' 
                        : 'border-gray-200 focus:border-primary focus:ring-primary/10'
                    }`}
                    placeholder="Мінімум 6 символів"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Посада *
                  </label>
                  <select
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                    required
                  >
                    <option value="">Оберіть посаду</option>
                    {jobProfiles.length === 0 ? (
                      <option disabled>Завантаження...</option>
                    ) : (
                      jobProfiles.map((profile) => (
                        <option key={profile.id} value={profile.jobTitle}>
                          {profile.jobTitle} ({profile.department})
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Посада з профілів посад в базі даних
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Відділ
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                  >
                    <option value="">Оберіть департамент</option>
                    {departments.length === 0 ? (
                      <option disabled>Завантаження...</option>
                    ) : (
                      departments
                        .filter((dept) => dept.code)
                        .map((dept) => (
                          <option key={dept.id} value={dept.code.toLowerCase()}>
                            {dept.name} ({dept.code})
                          </option>
                        ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Роль
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                  >
                    <option value="employee">Співробітник</option>
                    <option value="line_manager">Лінійний менеджер</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Зарплата {candidateId && formData.salary && <span className="text-green-600">✓ З оффера</span>}
                  </label>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                    placeholder="40000"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-8 py-3 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
                >
                  {isLoading ? "Створення..." : "Створити співробітника"}
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
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
            <h2 className="text-xl font-bold text-gray-800">
              Список співробітників ({employees.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Завантаження...</div>
          ) : employees.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Немає співробітників. Створіть першого!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Ім'я
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Посада
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Відділ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Роль
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Дії
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {employee.personalInfo.firstName} {employee.personalInfo.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {employee.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {employee.jobInfo.jobTitle}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {employee.jobInfo.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {employee.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            employee.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {employee.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {employee.id !== authStore.user?.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenTransfer(employee)}
                              className="text-blue-600 hover:text-blue-800 font-semibold"
                            >
                              🔄 Перемістити
                            </button>
                            <button
                              onClick={() => handleDeactivate(employee.id)}
                              className="text-red-600 hover:text-red-800 font-semibold"
                            >
                              Деактивувати
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Ваш профіль</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {}
        {showTransferDialog && transferEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 animate-fade-in">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                🔄 Переміщення співробітника
              </h3>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  <strong>Співробітник:</strong> {transferEmployee.personalInfo.firstName}{" "}
                  {transferEmployee.personalInfo.lastName}
                </p>
                <p className="text-gray-700 mb-4">
                  <strong>Поточний відділ:</strong> {transferEmployee.jobInfo.department}
                </p>

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Новий відділ
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                >
                  <option value="">Оберіть відділ</option>
                  {departments.length === 0 ? (
                    <option disabled>Завантаження...</option>
                  ) : (
                    departments
                      .filter((dept) => dept.code)
                      .map((dept) => (
                        <option key={dept.id} value={dept.code.toLowerCase()}>
                          {dept.name} ({dept.code})
                        </option>
                      ))
                  )}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleTransferDepartment(false)}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-6 py-3 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
                >
                  {isLoading ? "Переміщення..." : "Перемістити"}
                </button>
                <button
                  onClick={() => {
                    setShowTransferDialog(false);
                    setTransferEmployee(null);
                  }}
                  disabled={isLoading}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-all hover:bg-gray-300 disabled:opacity-50"
                >
                  Скасувати
                </button>
              </div>
            </div>
          </div>
        )}

        {}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          variant={confirmDialog.variant}
          confirmText="Так, перемістити"
          cancelText="Скасувати"
          onConfirm={() => {
            confirmDialog.onConfirm();
            setConfirmDialog({ ...confirmDialog, isOpen: false });
          }}
          onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        />
      </main>
    </div>
  );
});

export default EmployeeManagement;
