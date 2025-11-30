import React, { useState, useEffect } from "react";
import apiClient from "../services/api";
import "../styles/SkillsManagement.css";

interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  createdAt: string;
}

const SkillsManagement: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "technical",
  });

  const categories = [
    { value: "technical", label: "Технічні навички" },
    { value: "soft_skills", label: "М'які навички" },
    { value: "management", label: "Управлінські" },
    { value: "language", label: "Мови" },
    { value: "domain", label: "Галузеві" },
    { value: "tools", label: "Інструменти" },
  ];

  useEffect(() => {
    fetchSkills();
  }, [selectedCategory]);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const categoryParam = selectedCategory !== "all" ? `?category=${selectedCategory}` : "";
      const response = await apiClient.get(`/skills${categoryParam}`);

      if (response.data.success) {
        setSkills(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching skills:", error);
      alert("Помилка завантаження навичок");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSkill) {

        alert("Редагування поки не реалізоване");
      } else {

        const response = await apiClient.post("/skills", formData);

        if (response.data.success) {
          alert("Навичку успішно створено!");
          setShowAddModal(false);
          setFormData({ name: "", description: "", category: "technical" });
          fetchSkills();
        }
      }
    } catch (error: any) {
      console.error("Error saving skill:", error);
      alert(error.response?.data?.message || "Помилка збереження навички");
    }
  };

  const handleToggleActive = async (skillId: string, currentStatus: boolean) => {

    alert("Функція деактивації поки не реалізована");
  };

  const getCategoryLabel = (category: string) => {
    return categories.find((cat) => cat.value === category)?.label || category;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      technical: "💻",
      soft_skills: "🤝",
      management: "👔",
      language: "🌐",
      domain: "📚",
      tools: "🔧",
    };
    return icons[category] || "📌";
  };

  if (loading) {
    return <div className="loading">Завантаження...</div>;
  }

  return (
    <div className="skills-management">
      <div className="skills-header">
        <h1>📚 Управління навичками</h1>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          + Додати навичку
        </button>
      </div>

      <div className="skills-filters">
        <label>Категорія:</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">Всі категорії</option>
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div className="skills-stats">
        <div className="stat-card">
          <div className="stat-value">{skills.length}</div>
          <div className="stat-label">Всього навичок</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{skills.filter((s) => s.isActive).length}</div>
          <div className="stat-label">Активних</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{new Set(skills.map((s) => s.category)).size}</div>
          <div className="stat-label">Категорій</div>
        </div>
      </div>

      <div className="skills-list">
        {skills.length === 0 ? (
          <div className="empty-state">
            <p>Навичок не знайдено</p>
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              Додати першу навичку
            </button>
          </div>
        ) : (
          <table className="skills-table">
            <thead>
              <tr>
                <th>Назва</th>
                <th>Категорія</th>
                <th>Опис</th>
                <th>Статус</th>
                <th>Створено</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill) => (
                <tr key={skill.id} className={!skill.isActive ? "inactive" : ""}>
                  <td>
                    <strong>{skill.name}</strong>
                  </td>
                  <td>
                    <span className="category-badge">
                      {getCategoryIcon(skill.category)} {getCategoryLabel(skill.category)}
                    </span>
                  </td>
                  <td className="description">{skill.description || "—"}</td>
                  <td>
                    <span className={`status-badge ${skill.isActive ? "active" : "inactive"}`}>
                      {skill.isActive ? "Активна" : "Неактивна"}
                    </span>
                  </td>
                  <td>{new Date(skill.createdAt).toLocaleDateString("uk-UA")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSkill ? "Редагувати навичку" : "Додати навичку"}</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Назва навички *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Наприклад: JavaScript, Лідерство, Англійська"
                  required
                />
              </div>

              <div className="form-group">
                <label>Категорія *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {getCategoryIcon(cat.value)} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Опис</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Детальний опис навички..."
                  rows={3}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Скасувати
                </button>
                <button type="submit" className="btn-primary">
                  {editingSkill ? "Зберегти" : "Створити"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillsManagement;
