import React, { useState, useEffect } from "react";
import apiClient from "../services/api";
import "../styles/UserSkillsEditor.css";

interface Skill {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface UserSkill {
  skillId: {
    id: string;
    name: string;
    category: string;
  };
  currentLevel: number;
  yearsOfExperience: number;
  lastAssessmentDate: string;
}

interface Props {
  userId: string;
  canEdit: boolean;
}

const UserSkillsEditor: React.FC<Props> = ({ userId, canEdit }) => {
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [skillLevel, setSkillLevel] = useState(2);
  const [yearsExp, setYearsExp] = useState(0);

  const levelLabels = ["Немає", "Початковий", "Середній", "Просунутий", "Експертний"];
  const levelColors = ["#e0e0e0", "#fff59d", "#a5d6a7", "#64b5f6", "#5c6bc0"];

  useEffect(() => {
    fetchUserSkills();
    fetchAllSkills();
  }, [userId]);

  const fetchUserSkills = async () => {
    try {
      const response = await apiClient.get(`/users/${userId}/skills`);

      if (response.data.success) {
        setUserSkills(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching user skills:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSkills = async () => {
    try {
      const response = await apiClient.get("/skills");

      if (response.data.success) {
        setAllSkills(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching all skills:", error);
    }
  };

  const handleAddSkill = async () => {
    if (!selectedSkill) {
      alert("Оберіть навичку");
      return;
    }

    try {

      const updatedSkills = [
        ...userSkills.map((us) => ({
          skillId: us.skillId.id,
          currentLevel: us.currentLevel,
          yearsOfExperience: us.yearsOfExperience,
        })),
        {
          skillId: selectedSkill,
          currentLevel: skillLevel,
          yearsOfExperience: yearsExp,
        },
      ];

      const response = await apiClient.put(`/users/${userId}/skills`, { skills: updatedSkills });

      if (response.data.success) {
        alert("Навичку успішно додано!");
        setShowAddModal(false);
        setSelectedSkill("");
        setSkillLevel(2);
        setYearsExp(0);
        fetchUserSkills();
      }
    } catch (error: any) {
      console.error("Error adding skill:", error);
      alert(error.response?.data?.message || "Помилка додавання навички");
    }
  };

  const handleUpdateSkillLevel = async (skillId: string, newLevel: number) => {
    try {
      const updatedSkills = userSkills.map((us) => ({
        skillId: us.skillId.id,
        currentLevel: us.skillId.id === skillId ? newLevel : us.currentLevel,
        yearsOfExperience: us.yearsOfExperience,
      }));

      await apiClient.put(`/users/${userId}/skills`, { skills: updatedSkills });

      fetchUserSkills();
    } catch (error) {
      console.error("Error updating skill:", error);
      alert("Помилка оновлення навички");
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    if (!window.confirm("Видалити цю навичку?")) return;

    try {
      const updatedSkills = userSkills
        .filter((us) => us.skillId.id !== skillId)
        .map((us) => ({
          skillId: us.skillId.id,
          currentLevel: us.currentLevel,
          yearsOfExperience: us.yearsOfExperience,
        }));

      await apiClient.put(`/users/${userId}/skills`, { skills: updatedSkills });

      fetchUserSkills();
    } catch (error) {
      console.error("Error removing skill:", error);
      alert("Помилка видалення навички");
    }
  };

  const getAvailableSkills = () => {
    const userSkillIds = userSkills.map((us) => us.skillId.id);
    return allSkills.filter((skill) => !userSkillIds.includes(skill.id));
  };

  if (loading) {
    return <div className="skills-loading">Завантаження навичок...</div>;
  }

  return (
    <div className="user-skills-editor">
      <div className="skills-section-header">
        <h3>🎯 Навички</h3>
        {canEdit && (
          <button className="btn-add-skill" onClick={() => setShowAddModal(true)}>
            + Додати навичку
          </button>
        )}
      </div>

      {userSkills.length === 0 ? (
        <div className="empty-skills">
          <p>Навички не вказано</p>
          {canEdit && (
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              Додати навички
            </button>
          )}
        </div>
      ) : (
        <div className="skills-grid">
          {userSkills.map((userSkill) => (
            <div key={userSkill.skillId.id} className="skill-card">
              <div className="skill-header">
                <div>
                  <strong>{userSkill.skillId.name}</strong>
                  <span className="skill-category">{userSkill.skillId.category}</span>
                </div>
                {canEdit && (
                  <button
                    className="btn-remove-skill"
                    onClick={() => handleRemoveSkill(userSkill.skillId.id)}
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="skill-level">
                <div className="level-bar-container">
                  <div
                    className="level-bar"
                    style={{
                      width: `${(userSkill.currentLevel / 4) * 100}%`,
                      backgroundColor: levelColors[userSkill.currentLevel],
                    }}
                  />
                </div>
                <div className="level-info">
                  {canEdit ? (
                    <select
                      value={userSkill.currentLevel}
                      onChange={(e) =>
                        handleUpdateSkillLevel(
                          userSkill.skillId.id,
                          parseInt(e.target.value)
                        )
                      }
                      className="level-select"
                    >
                      {levelLabels.map((label, index) => (
                        <option key={index} value={index}>
                          {label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="level-label">
                      {levelLabels[userSkill.currentLevel]}
                    </span>
                  )}
                  {userSkill.yearsOfExperience > 0 && (
                    <span className="years-exp">{userSkill.yearsOfExperience} років</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Додати навичку</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Навичка *</label>
                <select
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  required
                >
                  <option value="">Оберіть навичку</option>
                  {getAvailableSkills().map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name} ({skill.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Рівень володіння *</label>
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(parseInt(e.target.value))}
                >
                  {levelLabels.map((label, index) => (
                    <option key={index} value={index}>
                      {index}: {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Років досвіду</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={yearsExp}
                  onChange={(e) => setYearsExp(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowAddModal(false)}
              >
                Скасувати
              </button>
              <button type="button" className="btn-primary" onClick={handleAddSkill}>
                Додати
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSkillsEditor;
