

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStores } from "../stores/RootStore";

const API_URL = process.env.REACT_APP_API_URL;

interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  manager?: {
    id: string;
    email: string;
    personalInfo: {
      firstName: string;
      lastName: string;
    };
  };
  parentDepartment?: {
    id: string;
    name: string;
    code: string;
  };
  children?: Department[];
}

interface DepartmentForm {
  name: string;
  code: string;
  description: string;
  parentDepartment: string;
  managerId: string;
}

const OrganizationStructure: React.FC = observer(() => {
  const { authStore } = useStores();
  const navigate = useNavigate();
  const [hierarchy, setHierarchy] = useState<Department[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [viewMode, setViewMode] = useState<"tree" | "list">("tree");

  const [formData, setFormData] = useState<DepartmentForm>({
    name: "",
    code: "",
    description: "",
    parentDepartment: "",
    managerId: "",
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [hierarchyRes, deptsRes, employeesRes] = await Promise.all([
        fetch(`${API_URL}/departments/hierarchy`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        }),
        fetch(`${API_URL}/departments`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        }),
        fetch(`${API_URL}/users`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        }),
      ]);

      const hierarchyData = await hierarchyRes.json();
      const deptsData = await deptsRes.json();
      const employeesData = await employeesRes.json();

      console.log("📊 Loaded departments:", deptsData);
      console.log("📊 Departments array:", deptsData.data);

      if (hierarchyData.success) setHierarchy(hierarchyData.data);
      if (deptsData.success) setDepartments(deptsData.data);
      if (employeesData.success) setEmployees(employeesData.data);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Не вдалося завантажити дані");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name || !formData.code) {
      setError("Назва та код відділу обов'язкові");
      return;
    }

    setIsLoading(true);

    try {
      const url = editingDept
        ? `${API_URL}/departments/${editingDept.id}`
        : `${API_URL}/departments`;

      const response = await fetch(url, {
        method: editingDept ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          ...formData,
          parentDepartment: formData.parentDepartment || null,
          managerId: formData.managerId || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(editingDept ? "Відділ оновлено!" : "Відділ створено!");
        setFormData({ name: "", code: "", description: "", parentDepartment: "", managerId: "" });
        setShowCreateForm(false);
        setEditingDept(null);
        loadData();
      } else {
        setError(data.message || "Помилка");
      }
    } catch (err: any) {
      setError(err.message || "Помилка при збереженні");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || "",
      parentDepartment: dept.parentDepartment?.id || "",
      managerId: dept.manager?.id || "",
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (deptId: string) => {
    if (!window.confirm("Ви впевнені, що хочете деактивувати цей відділ?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/departments/${deptId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Відділ деактивовано");
        loadData();
      } else {
        setError(data.message || "Не вдалося деактивувати");
      }
    } catch (err: any) {
      setError(err.message || "Помилка при деактивації");
    }
  };

  const cancelEdit = () => {
    setEditingDept(null);
    setShowCreateForm(false);
    setFormData({ name: "", code: "", description: "", parentDepartment: "", managerId: "" });
  };

  const renderTree = (nodes: Department[], level: number = 0) => {
    return nodes.map((node) => (
      <div key={node.id} className={`mb-2 ${level > 0 ? "ml-8" : ""}`}>
        <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="text-xl">{level === 0 ? "🏢" : "📁"}</span>
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{node.name}</h3>
                  <p className="text-sm text-gray-600">Код: {node.code}</p>
                  {node.description && (
                    <p className="text-sm text-gray-500 mt-1">{node.description}</p>
                  )}
                  {node.manager && (
                    <p className="text-sm text-blue-600 mt-1">
                      👤 Менеджер: {node.manager.personalInfo.firstName}{" "}
                      {node.manager.personalInfo.lastName}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {(authStore.user?.role === "hr_manager" || authStore.user?.role === "admin") && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(node)}
                  className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                >
                  ✏️ Редагувати
                </button>
                <button
                  onClick={() => handleDelete(node.id)}
                  className="text-red-600 hover:text-red-800 font-semibold text-sm"
                >
                  🗑️ Видалити
                </button>
              </div>
            )}
          </div>
        </div>
        
        {node.children && node.children.length > 0 && (
          <div className="mt-2">
            {renderTree(node.children, level + 1)}
          </div>
        )}
      </div>
    ));
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Організаційна Структура</h1>
              <p className="text-sm opacity-90 mt-1">
                Візуалізація та управління ієрархією компанії
              </p>
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
        <div className="mb-8 flex gap-4 flex-wrap">
          <button
            onClick={() => {
              if (showCreateForm) {

                cancelEdit();
              } else {

                setShowCreateForm(true);
              }
            }}
            className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-6 py-3 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            {showCreateForm ? "❌ Скасувати" : "➕ Створити відділ"}
          </button>

          <button
            onClick={() => setViewMode(viewMode === "tree" ? "list" : "tree")}
            className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-all hover:bg-gray-50"
          >
            {viewMode === "tree" ? "📋 Список" : "🌳 Дерево"}
          </button>

          <button
            onClick={loadData}
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
              {editingDept ? "Редагування відділу" : "Створення нового відділу"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Назва відділу *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                    placeholder="IT Відділ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Код відділу *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none uppercase"
                    placeholder="IT"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Опис
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                    placeholder="Опис відділу..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Батьківський відділ {departments.length > 0 && `(${departments.length} доступно)`}
                  </label>
                  <select
                    name="parentDepartment"
                    value={formData.parentDepartment}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                  >
                    <option value="">Немає (кореневий)</option>
                    {isLoading ? (
                      <option disabled>Завантаження...</option>
                    ) : departments.length === 0 ? (
                      <option disabled>Немає доступних відділів</option>
                    ) : (
                      departments
                        .filter((d) => d.id !== editingDept?.id)
                        .map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name} ({dept.code})
                          </option>
                        ))
                    )}
                  </select>
                  {departments.length === 0 && !isLoading && (
                    <p className="text-sm text-gray-500 mt-1">
                      💡 Це буде перший відділ у структурі
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Менеджер відділу
                  </label>
                  <select
                    name="managerId"
                    value={formData.managerId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                  >
                    <option value="">Не призначено</option>
                    {employees
                      .filter((e) => e.role === "line_manager" || e.role === "hr_manager")
                      .map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.personalInfo.firstName} {emp.personalInfo.lastName} ({emp.email})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-8 py-3 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
                >
                  {isLoading ? "Збереження..." : editingDept ? "Оновити" : "Створити"}
                </button>

                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold transition-all hover:bg-gray-300"
                >
                  Скасувати
                </button>
              </div>
            </form>
          </div>
        )}

        {}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Завантаження...</div>
        ) : viewMode === "tree" ? (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-5">Ієрархічна структура</h2>
            {hierarchy.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                Немає відділів. Створіть перший!
              </div>
            ) : (
              <div>{renderTree(hierarchy)}</div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                Список відділів ({departments.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Назва
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Код
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Батьківський
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Менеджер
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Дії
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {departments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{dept.name}</div>
                        {dept.description && (
                          <div className="text-sm text-gray-500">{dept.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {dept.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {dept.parentDepartment?.name || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {dept.manager
                          ? `${dept.manager.personalInfo.firstName} ${dept.manager.personalInfo.lastName}`
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm space-x-3">
                        <button
                          onClick={() => handleEdit(dept)}
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          Редагувати
                        </button>
                        <button
                          onClick={() => handleDelete(dept.id)}
                          className="text-red-600 hover:text-red-800 font-semibold"
                        >
                          Видалити
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
});

export default OrganizationStructure;
