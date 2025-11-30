

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/api";
import { toast } from "react-toastify";
import type { CreateCandidateDTO } from "../types/recruitment.types";

const NewCandidate: React.FC = observer(() => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [jobProfiles, setJobProfiles] = useState<any[]>([]);
  const [allSkills, setAllSkills] = useState<any[]>([]);

  const [form, setForm] = useState<CreateCandidateDTO>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    resumeUrl: "",
    linkedinUrl: "",
    jobProfileId: "",
    department: "",
    source: "",
    assignedTo: "",
    skills: [],
  });

  const [newSkill, setNewSkill] = useState({
    skillId: "",
    currentLevel: 2,
    yearsOfExperience: 0,
  });

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
    fetchJobProfiles();
    fetchSkills();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get("/users");
      setUsers(response.data.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await apiClient.get("/users/departments");
      setDepartments(response.data.data || []);
    } catch (error) {
      console.error("Error fetching departments:", error);

      setDepartments(["IT", "HR", "Finance", "Sales", "Marketing", "Operations", "Support"]);
    }
  };

  const fetchJobProfiles = async () => {
    try {
      const response = await apiClient.get("/skills/job-profiles");
      if (response.data.success) {
        setJobProfiles(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching job profiles:", error);
      toast.error("Не вдалося завантажити профілі посад");
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await apiClient.get("/skills");
      if (response.data.success) {
        setAllSkills(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching skills:", error);
    }
  };

  const handleJobProfileChange = (profileId: string) => {
    setForm({ ...form, jobProfileId: profileId });

    const selectedProfile = jobProfiles.find(p => p.id === profileId);
    if (selectedProfile && selectedProfile.department) {
      setForm(prev => ({ ...prev, jobProfileId: profileId, department: selectedProfile.department }));
    }
  };

  const handleAddSkill = () => {
    if (!newSkill.skillId) {
      toast.warning("Оберіть навичку");
      return;
    }

    if (form.skills?.some(s => s.skillId === newSkill.skillId)) {
      toast.warning("Ця навичка вже додана");
      return;
    }

    setForm({
      ...form,
      skills: [...(form.skills || []), { ...newSkill }],
    });

    setNewSkill({
      skillId: "",
      currentLevel: 2,
      yearsOfExperience: 0,
    });
  };

  const handleRemoveSkill = (skillId: string) => {
    setForm({
      ...form,
      skills: form.skills?.filter(s => s.skillId !== skillId) || [],
    });
  };

  const getSkillName = (skillId: string) => {
    return allSkills.find(s => s.id === skillId)?.name || "Unknown";
  };

  const levelLabels = ["None", "Beginner", "Intermediate", "Advanced", "Expert"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.firstName || !form.lastName || !form.email || !form.jobProfileId || !form.department) {
      toast.warning("Будь ласка, заповніть всі обов'язкові поля");
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post("/recruitment", form);
      toast.success("Кандидата успішно додано!");
      navigate(`/recruitment/${response.data.data.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Помилка при додаванні кандидата");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate("/recruitment")}
          className="text-blue-600 hover:text-blue-700 mb-2"
        >
          ← Назад до воронки
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Додати нового кандидата</h1>
        <p className="text-gray-600 mt-2">
          Заповніть інформацію про кандидата для початку процесу рекрутингу
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Особиста інформація
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ім'я *
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Прізвище *
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Телефон
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+380..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Посилання</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              LinkedIn профіль
            </label>
            <input
              type="url"
              value={form.linkedinUrl}
              onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
              placeholder="https://linkedin.com/in/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Посилання на резюме
            </label>
            <input
              type="url"
              value={form.resumeUrl}
              onChange={(e) => setForm({ ...form, resumeUrl: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Можна завантажити на Google Drive, Dropbox тощо і вставити посилання
            </p>
          </div>
        </div>

        {}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Вакансія</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Профіль посади *
            </label>
            <select
              value={form.jobProfileId}
              onChange={(e) => handleJobProfileChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Оберіть посаду</option>
              {jobProfiles.length === 0 ? (
                <option disabled>Завантаження...</option>
              ) : (
                jobProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.jobTitle} ({profile.department})
                  </option>
                ))
              )}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Оберіть із створених профілів посад
            </p>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Департамент *
            </label>
            <input
              type="text"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
              placeholder="Автоматично з профілю посади"
              required
              readOnly
            />
            <p className="text-xs text-gray-500 mt-1">
              Заповнюється автоматично при виборі профілю посади
            </p>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Джерело
            </label>
            <select
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Оберіть джерело</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Referral">Referral (Рекомендація)</option>
              <option value="Job Board">Job Board (Сайт вакансій)</option>
              <option value="Company Website">Company Website</option>
              <option value="Recruitment Agency">Recruitment Agency</option>
              <option value="Direct Application">Direct Application</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Навички кандидата
          </h2>

          {}
          {form.skills && form.skills.length > 0 && (
            <div className="mb-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border px-4 py-2 text-left">Навичка</th>
                    <th className="border px-4 py-2 text-left">Рівень</th>
                    <th className="border px-4 py-2 text-left">Досвід (роки)</th>
                    <th className="border px-4 py-2 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {form.skills.map((skill, index) => (
                    <tr key={index}>
                      <td className="border px-4 py-2">{getSkillName(skill.skillId)}</td>
                      <td className="border px-4 py-2">{levelLabels[skill.currentLevel]}</td>
                      <td className="border px-4 py-2">{skill.yearsOfExperience || 0}</td>
                      <td className="border px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill.skillId)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {}
          <div className="grid grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Навичка
              </label>
              <select
                value={newSkill.skillId}
                onChange={(e) => setNewSkill({ ...newSkill, skillId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Оберіть навичку</option>
                {allSkills.map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name} ({skill.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Рівень
              </label>
              <select
                value={newSkill.currentLevel}
                onChange={(e) => setNewSkill({ ...newSkill, currentLevel: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {levelLabels.map((label, index) => (
                  <option key={index} value={index}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Досвід (роки)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={newSkill.yearsOfExperience}
                onChange={(e) => setNewSkill({ ...newSkill, yearsOfExperience: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={handleAddSkill}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Додати
              </button>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            Додайте навички кандидата, які буде перевірено під час співбесіди
          </p>
        </div>

        {}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Призначення
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Рекрутер / HR менеджер
            </label>
            <select
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Не призначено</option>
              {users
                .filter(
                  (u) =>
                    u.role === "hr_manager" ||
                    u.role === "recruiter" ||
                    u.role === "admin"
                )
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.role})
                  </option>
                ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Оберіть відповідального за ведення кандидата
            </p>
          </div>
        </div>

        {}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate("/recruitment")}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Скасувати
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Додавання..." : "Додати кандидата"}
          </button>
        </div>
      </form>
    </div>
  );
});

export default NewCandidate;
