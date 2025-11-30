import React, { useState, useEffect } from "react";
import apiClient from "../services/api";
import { toast } from "react-toastify";
import "../styles/JobProfilesManagement.css";

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface RequiredSkill {
  skillId: string;
  skillName?: string;
  requiredLevel: number;
  weight: number;
  isMandatory: boolean;
}

interface JobProfile {
  id: string;
  jobTitle: string;
  department: string;
  requiredSkills: RequiredSkill[];
  createdAt: string;
}

const JobProfilesManagement: React.FC = () => {
  const [jobProfiles, setJobProfiles] = useState<JobProfile[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<JobProfile | null>(null);

  const [formData, setFormData] = useState({
    jobTitle: "",
    department: "",
    requiredSkills: [] as RequiredSkill[],
  });

  const [newSkill, setNewSkill] = useState<RequiredSkill>({
    skillId: "",
    requiredLevel: 2,
    weight: 50,
    isMandatory: false,
  });

  const levelLabels = ["None", "Beginner", "Intermediate", "Advanced", "Expert"];

  useEffect(() => {
    fetchJobProfiles();
    fetchSkills();
    fetchDepartments();
  }, []);

  const fetchJobProfiles = async () => {
    try {
      const response = await apiClient.get("/skills/job-profiles");

      if (response.data.success) {
        setJobProfiles(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching job profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await apiClient.get("/skills");

      if (response.data.success) {
        console.log("Fetched skills:", response.data.data);
        console.log("First skill:", response.data.data[0]);
        setSkills(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching skills:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await apiClient.get("/departments");
      if (response.data.success) {
        setDepartments(response.data.data.map((d: any) => d.name));
      }
    } catch (error) {
      console.error("Error fetching departments:", error);

      setDepartments(["IT", "HR", "Finance", "Sales", "Marketing", "Operations", "Customer Support"]);
    }
  };

  const handleAddSkillToProfile = () => {
    if (!newSkill.skillId) {
      toast.warning("Оберіть навичку");
      return;
    }

    console.log("newSkill.skillId:", newSkill.skillId);
    console.log("newSkill:", newSkill);
    
    const skillName = skills.find((s) => s.id === newSkill.skillId)?.name;
    console.log("Found skill name:", skillName);

    setFormData({
      ...formData,
      requiredSkills: [
        ...formData.requiredSkills,
        { ...newSkill, skillName },
      ],
    });

    setNewSkill({
      skillId: "",
      requiredLevel: 2,
      weight: 50,
      isMandatory: false,
    });
  };

  const handleRemoveSkill = (index: number) => {
    setFormData({
      ...formData,
      requiredSkills: formData.requiredSkills.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.requiredSkills.length === 0) {
      toast.warning("Додайте хоча б одну навичку до профілю");
      return;
    }

    try {

      const dataToSend = {
        jobTitle: formData.jobTitle,
        department: formData.department,
        requiredSkills: formData.requiredSkills.map(({ skillId, requiredLevel, weight, isMandatory }) => ({
          skillId,
          requiredLevel,
          weight,
          isMandatory,
        })),
      };

      console.log("Sending data:", JSON.stringify(dataToSend, null, 2));
      console.log("FormData requiredSkills:", formData.requiredSkills);

      const response = await apiClient.post("/skills/job-profiles", dataToSend);

      if (response.data.success) {
        toast.success("Профіль посади успішно створено!");
        setShowAddModal(false);
        setFormData({
          jobTitle: "",
          department: "",
          requiredSkills: [],
        });
        fetchJobProfiles();
      }
    } catch (error: any) {
      console.error("Error creating job profile:", error);
      toast.error(error.response?.data?.message || "Помилка створення профілю");
    }
  };

  const getSkillName = (skillId: string) => {
    return skills.find((s) => s.id === skillId)?.name || "Unknown";
  };

  const handleDeleteProfile = async (profileId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!window.confirm("Ви впевнені, що хочете видалити цей профіль посади?")) {
      return;
    }

    try {
      await apiClient.delete(`/skills/job-profiles/${profileId}`);
      toast.success("Профіль посади успішно видалено");
      fetchJobProfiles();
    } catch (error) {
      console.error("Error deleting profile:", error);
      toast.error("Помилка при видаленні профілю посади");
    }
  };

  if (loading) {
    return <div className="loading">Завантаження...</div>;
  }

  return (
    <div className="job-profiles-management">
      <div className="profiles-header">
        <h1>👔 Профілі посад</h1>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          + Створити профіль
        </button>
      </div>

      <div className="profiles-stats">
        <div className="stat-card">
          <div className="stat-value">{jobProfiles.length}</div>
          <div className="stat-label">Всього профілів</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {new Set(jobProfiles.map((p) => p.department)).size}
          </div>
          <div className="stat-label">Департаментів</div>
        </div>
      </div>

      <div className="profiles-list">
        {jobProfiles.length === 0 ? (
          <div className="empty-state">
            <p>Профілів посад не знайдено</p>
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              Створити перший профіль
            </button>
          </div>
        ) : (
          <div className="profiles-grid">
            {jobProfiles.map((profile) => (
              <div
                key={profile.id}
                className="profile-card"
                onClick={() => setSelectedProfile(profile)}
              >
                <div className="profile-header">
                  <h3>{profile.jobTitle}</h3>
                  <div className="profile-actions">
                    <span className="department-badge">{profile.department}</span>
                    <button
                      className="btn-delete"
                      onClick={(e) => handleDeleteProfile(profile.id, e)}
                      title="Видалити профіль"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="profile-stats">
                  <div className="stat">
                    <span className="stat-label">Навичок:</span>
                    <span className="stat-value">{profile.requiredSkills.length}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Обов'язкових:</span>
                    <span className="stat-value">
                      {profile.requiredSkills.filter((s) => s.isMandatory).length}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Створити профіль посади</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h3>Основна інформація</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Назва посади *</label>
                    <input
                      type="text"
                      value={formData.jobTitle}
                      onChange={(e) =>
                        setFormData({ ...formData, jobTitle: e.target.value })
                      }
                      placeholder="Наприклад: Senior Software Engineer"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Департамент *</label>
                    <select
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      required
                    >
                      <option value="">Оберіть департамент</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Вимоги до навичок</h3>

                {}
                {formData.requiredSkills.length > 0 && (
                  <div className="skills-list-form">
                    <table>
                      <thead>
                        <tr>
                          <th>Навичка</th>
                          <th>Рівень</th>
                          <th>Вага</th>
                          <th>Обов'язкова</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.requiredSkills.map((skill, index) => (
                          <tr key={index}>
                            <td>{skill.skillName}</td>
                            <td>
                              <span className={`level-badge level-${skill.requiredLevel}`}>
                                {levelLabels[skill.requiredLevel]}
                              </span>
                            </td>
                            <td>{skill.weight}</td>
                            <td>{skill.isMandatory ? "✅" : "—"}</td>
                            <td>
                              <button
                                type="button"
                                className="btn-remove"
                                onClick={() => handleRemoveSkill(index)}
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {}
                <div className="add-skill-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Навичка</label>
                      <select
                        value={newSkill.skillId}
                        onChange={(e) =>
                          setNewSkill({ ...newSkill, skillId: e.target.value })
                        }
                      >
                        <option value="">Оберіть навичку</option>
                        {skills
                          .filter(
                            (s) =>
                              !formData.requiredSkills.find((rs) => rs.skillId === s.id)
                          )
                          .map((skill) => (
                            <option key={skill.id} value={skill.id}>
                              {skill.name} ({skill.category})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Рівень (0-4)</label>
                      <select
                        value={newSkill.requiredLevel}
                        onChange={(e) =>
                          setNewSkill({
                            ...newSkill,
                            requiredLevel: parseInt(e.target.value),
                          })
                        }
                      >
                        {levelLabels.map((label, index) => (
                          <option key={index} value={index}>
                            {index}: {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Вага (0-100)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={newSkill.weight}
                        onChange={(e) =>
                          setNewSkill({
                            ...newSkill,
                            weight: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={newSkill.isMandatory}
                          onChange={(e) =>
                            setNewSkill({ ...newSkill, isMandatory: e.target.checked })
                          }
                        />
                        Обов'язкова
                      </label>
                    </div>

                    <button
                      type="button"
                      className="btn-add"
                      onClick={handleAddSkillToProfile}
                    >
                      + Додати
                    </button>
                  </div>
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
                <button type="submit" className="btn-primary">
                  Створити профіль
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {selectedProfile && (
        <div className="modal-overlay" onClick={() => setSelectedProfile(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedProfile.jobTitle}</h2>
              <button className="close-btn" onClick={() => setSelectedProfile(null)}>
                ×
              </button>
            </div>
            <div className="profile-details">
              <div className="detail-row">
                <strong>Департамент:</strong> {selectedProfile.department}
              </div>
              <div className="detail-row">
                <strong>Створено:</strong>{" "}
                {new Date(selectedProfile.createdAt).toLocaleDateString("uk-UA")}
              </div>

              <h3>Вимоги до навичок:</h3>
              <table className="skills-table">
                <thead>
                  <tr>
                    <th>Навичка</th>
                    <th>Рівень</th>
                    <th>Вага</th>
                    <th>Обов'язкова</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProfile.requiredSkills.map((skill, index) => (
                    <tr key={index}>
                      <td>{getSkillName(skill.skillId)}</td>
                      <td>
                        <span className={`level-badge level-${skill.requiredLevel}`}>
                          {levelLabels[skill.requiredLevel]}
                        </span>
                      </td>
                      <td>{skill.weight}</td>
                      <td>{skill.isMandatory ? "✅ Так" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobProfilesManagement;
