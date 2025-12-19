

import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useStores } from "../stores/RootStore";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL;

interface Criteria {
  name: string;
  description: string;
  type: "rating" | "text" | "yes_no";
  weight: number;
  required: boolean;
}

interface ReviewTemplate {
  _id: string;
  name: string;
  description: string;
  criteria: Criteria[];
  isActive: boolean;
  createdBy: {
    personalInfo: {
      firstName: string;
      lastName: string;
    };
  };
  createdAt: string;
}

const ReviewTemplates: React.FC = observer(() => {
  const { authStore } = useStores();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ReviewTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    criteria: [] as Criteria[],
  });

  const [newCriteria, setNewCriteria] = useState<Criteria>({
    name: "",
    description: "",
    type: "rating",
    weight: 0,
    required: true,
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/review-templates`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });

      const data = await response.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (err) {
      console.error("Error loading templates:", err);
      setError("Не вдалося завантажити шаблони");
    } finally {
      setIsLoading(false);
    }
  };

  const addCriteria = () => {
    if (!newCriteria.name || !newCriteria.description || newCriteria.weight <= 0) {
      setError("Заповніть всі поля критерію");
      return;
    }

    setTemplateForm({
      ...templateForm,
      criteria: [...templateForm.criteria, newCriteria],
    });

    setNewCriteria({
      name: "",
      description: "",
      type: "rating",
      weight: 0,
      required: true,
    });
    setError("");
  };

  const removeCriteria = (index: number) => {
    setTemplateForm({
      ...templateForm,
      criteria: templateForm.criteria.filter((_, i) => i !== index),
    });
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const totalWeight = templateForm.criteria.reduce((sum, c) => sum + c.weight, 0);
    if (totalWeight !== 100) {
      setError(`Сума ваг критеріїв повинна дорівнювати 100% (зараз: ${totalWeight}%)`);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/review-templates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(templateForm),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Шаблон успішно створено!");
        setShowCreateForm(false);
        setTemplateForm({ name: "", description: "", criteria: [] });
        loadTemplates();
      } else {
        setError(data.message || "Помилка при створенні шаблону");
      }
    } catch (err: any) {
      setError(err.message || "Помилка при створенні шаблону");
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm("Ви впевнені, що хочете видалити цей шаблон?")) return;

    try {
      const response = await fetch(`${API_URL}/review-templates/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Шаблон видалено");
        loadTemplates();
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      setError("Помилка при видаленні шаблону");
    }
  };

  const getCriteriaTypeLabel = (type: string) => {
    switch (type) {
      case "rating":
        return "Оцінка (1-5)";
      case "text":
        return "Текст";
      case "yes_no":
        return "Так/Ні";
      default:
        return type;
    }
  };

  if (authStore.user?.role !== "hr_manager" && authStore.user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Доступ заборонено</h2>
          <p className="text-gray-600">Тільки HR має доступ до цієї сторінки</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-5 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Шаблони Оцінки</h1>
              <p className="text-sm opacity-90 mt-1">
                Створення та управління шаблонами для оцінки ефективності
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

        <div className="mb-8">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-6 py-3 rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all"
          >
            {showCreateForm ? "Скасувати" : "+ Створити Шаблон"}
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-5">Новий Шаблон</h3>
            <form onSubmit={handleCreateTemplate} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Назва шаблону *
                </label>
                <input
                  type="text"
                  required
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 focus:outline-none"
                  placeholder="Річна оцінка ефективності"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Опис *</label>
                <textarea
                  required
                  value={templateForm.description}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 focus:outline-none"
                  placeholder="Опис шаблону..."
                />
              </div>

              <div className="border-t pt-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">
                  Критерії оцінювання (сума ваг = 100%)
                </h4>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h5 className="font-semibold text-gray-700 mb-3">Додати критерій</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <input
                      type="text"
                      value={newCriteria.name}
                      onChange={(e) => setNewCriteria({ ...newCriteria, name: e.target.value })}
                      className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                      placeholder="Назва"
                    />
                    <input
                      type="text"
                      value={newCriteria.description}
                      onChange={(e) =>
                        setNewCriteria({ ...newCriteria, description: e.target.value })
                      }
                      className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                      placeholder="Опис"
                    />
                    <select
                      value={newCriteria.type}
                      onChange={(e) =>
                        setNewCriteria({
                          ...newCriteria,
                          type: e.target.value as "rating" | "text" | "yes_no",
                        })
                      }
                      className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                    >
                      <option value="rating">Оцінка (1-5)</option>
                      <option value="text">Текст</option>
                      <option value="yes_no">Так/Ні</option>
                    </select>
                    <input
                      type="number"
                      value={newCriteria.weight || ""}
                      onChange={(e) =>
                        setNewCriteria({ ...newCriteria, weight: parseFloat(e.target.value) || 0 })
                      }
                      className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                      placeholder="Вага %"
                      min="0"
                      max="100"
                    />
                    <button
                      type="button"
                      onClick={addCriteria}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      + Додати
                    </button>
                  </div>
                </div>

                {templateForm.criteria.length > 0 && (
                  <div className="space-y-2">
                    {templateForm.criteria.map((criteria, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center bg-white border-2 border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-800">{criteria.name}</span>
                            <span className="text-sm text-gray-600">
                              ({getCriteriaTypeLabel(criteria.type)})
                            </span>
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                              {criteria.weight}%
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{criteria.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCriteria(index)}
                          className="ml-4 px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                        >
                          Видалити
                        </button>
                      </div>
                    ))}
                    <div className="text-right font-semibold text-gray-700">
                      Загальна вага:{" "}
                      <span
                        className={
                          templateForm.criteria.reduce((sum, c) => sum + c.weight, 0) === 100
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {templateForm.criteria.reduce((sum, c) => sum + c.weight, 0)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={templateForm.criteria.length === 0}
                  className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-6 py-3 rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Створити Шаблон
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

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Завантаження...</div>
        ) : templates.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">Немає шаблонів</div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {templates.map((template) => (
              <div key={template._id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{template.name}</h3>
                      {template.isActive && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Активний
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-4">{template.description}</p>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-700">
                        Критерії ({template.criteria.length}):
                      </h4>
                      {template.criteria.map((criteria, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 text-sm bg-gray-50 p-3 rounded-lg"
                        >
                          <span className="font-medium text-gray-800">{criteria.name}</span>
                          <span className="text-gray-600">
                            ({getCriteriaTypeLabel(criteria.type)})
                          </span>
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            {criteria.weight}%
                          </span>
                          <span className="text-gray-500 ml-auto">{criteria.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteTemplate(template._id)}
                    className="ml-6 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                  >
                    Видалити
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
});

export default ReviewTemplates;
