

import React, { useState, useEffect } from "react";
import { UkDatePicker } from "../components/UkDatePicker";
import { observer } from "mobx-react-lite";
import { useStores } from "../stores/RootStore";
import { toast } from "react-toastify";
import apiClient from "../services/api";
import PromptDialog from "../components/PromptDialog";

interface ICriteria {
  name: string;
  description: string;
  type: "rating" | "text" | "yes_no";
  weight: number;
  required: boolean;
}

interface IReviewTemplate {
  _id: string;
  name: string;
  description: string;
  criteria: ICriteria[];
  isActive: boolean;
}

interface IEmployee {
  id?: string;
  _id?: string;
  personalInfo?: {
    firstName: string;
    lastName: string;
  };
  firstName?: string;
  lastName?: string;
  email: string;
  position?: string;
  jobInfo?: {
    jobTitle: string;
    position?: string;
    department: string;
  };
  department?: string;
}

interface ICriteriaRating {
  criteriaName: string;
  criteriaType: "rating" | "text" | "yes_no";
  rating?: number;
  textResponse?: string;
  yesNoResponse?: boolean;
  comment?: string;
}

interface IPerformanceReview {
  _id: string;
  employeeId: {
    _id: string;
    firstName?: string;
    lastName?: string;
    personalInfo?: {
      firstName: string;
      lastName: string;
    };
    position?: string;
    jobInfo?: {
      jobTitle: string;
      position?: string;
    };
  };
  reviewerId: {
    _id: string;
    firstName?: string;
    lastName?: string;
    personalInfo?: {
      firstName: string;
      lastName: string;
    };
  };
  templateId: {
    _id: string;
    name: string;
  };
  reviewPeriod: {
    startDate: string;
    endDate: string;
  };
  ratings: ICriteriaRating[];
  status: "draft" | "in_progress" | "completed" | "cancelled";
  finalScore?: number;
  finalComment?: string;
  createdAt: string;
}

const PerformanceReviews: React.FC = observer(() => {
  const { authStore } = useStores();
  const [reviews, setReviews] = useState<IPerformanceReview[]>([]);
  const [templates, setTemplates] = useState<IReviewTemplate[]>([]);
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedReview, setSelectedReview] = useState<IPerformanceReview | null>(null);
  const [showCommentDialog, setShowCommentDialog] = useState(false);

  const [newReview, setNewReview] = useState({
    employeeId: "",
    templateId: "",
    startDate: "",
    endDate: "",
  });

  const getUserName = (user: any) => {
    const firstName = user?.personalInfo?.firstName || user?.firstName || '';
    const lastName = user?.personalInfo?.lastName || user?.lastName || '';
    return `${firstName} ${lastName}`.trim();
  };

  const getUserPosition = (user: any) => {
    return user?.jobInfo?.jobTitle || user?.jobInfo?.position || user?.position || 'N/A';
  };

  useEffect(() => {
    loadReviews();
    loadTemplates();
    loadEmployees();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/reviews");
      setReviews(response.data.data || response.data);
    } catch (error: any) {
      toast.error("Помилка завантаження оцінок: " + error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await apiClient.get("/review-templates");
      const templates = response.data.data || response.data;
      setTemplates(templates.filter((t: IReviewTemplate) => t.isActive));
    } catch (error: any) {

    }
  };

  const loadEmployees = async () => {
    try {
      const response = await apiClient.get("/users");
      const employeesData = response.data.data || response.data;
      setEmployees(employeesData);
    } catch (error: any) {

    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.employeeId || !newReview.templateId || !newReview.startDate || !newReview.endDate) {
      toast.warning("Заповніть всі поля!");
      return;
    }

    try {
      const response = await apiClient.post("/reviews", {
        employeeId: newReview.employeeId,
        templateId: newReview.templateId,
        reviewPeriod: {
          startDate: newReview.startDate,
          endDate: newReview.endDate,
        },
      });

      toast.success("Оцінку успішно створено!");
      setShowCreateForm(false);
      setNewReview({ employeeId: "", templateId: "", startDate: "", endDate: "" });
      loadReviews();
    } catch (error: any) {

      toast.error("Помилка створення оцінки: " + (error.response?.data?.message || error.message));
    }
  };

  const handleOpenReview = (review: IPerformanceReview) => {
    setSelectedReview(review);
  };

  const handleEditRating = (criteriaName: string, updates: Partial<ICriteriaRating>) => {
    if (!selectedReview) return;

    const existingRating = selectedReview.ratings.find((r) => r.criteriaName === criteriaName);
    const currentEditing = editingRatings[criteriaName];

    const baseRating = currentEditing || existingRating || { criteriaName };

    setEditingRatings({
      ...editingRatings,
      [criteriaName]: {
        criteriaName: baseRating.criteriaName,
        criteriaType: baseRating.criteriaType,
        rating: updates.rating !== undefined ? updates.rating : baseRating.rating,
        textResponse: updates.textResponse !== undefined ? updates.textResponse : baseRating.textResponse,
        yesNoResponse: updates.yesNoResponse !== undefined ? updates.yesNoResponse : baseRating.yesNoResponse,
        comment: updates.comment !== undefined ? updates.comment : baseRating.comment,
      } as ICriteriaRating,
    });
  };

  const handleSaveAllRatings = async () => {
    if (!selectedReview) return;

    if (Object.keys(editingRatings).length === 0) {
      toast.info("Немає змін для збереження");
      return;
    }

    const template = templates.find((t) => t._id === selectedReview.templateId._id);
    if (!template) {
      toast.error("Шаблон не знайдено");
      return;
    }

    let updatedRatings = [...selectedReview.ratings];

    Object.entries(editingRatings).forEach(([criteriaName, editedRating]) => {
      const criteria = template.criteria.find((c) => c.name === criteriaName);
      if (!criteria) return;

      const existingRatingIndex = updatedRatings.findIndex(
        (r) => r.criteriaName === criteriaName
      );

      const ratingToSave = {
        ...editedRating,
        criteriaType: criteria.type,
      };

      if (existingRatingIndex >= 0) {
        updatedRatings[existingRatingIndex] = ratingToSave;
      } else {
        updatedRatings.push(ratingToSave);
      }
    });

    try {
      const response = await apiClient.put(
        `/reviews/${selectedReview._id}/ratings`,
        { ratings: updatedRatings }
      );
      setSelectedReview(response.data.data || response.data);

      setEditingRatings({});
      
      toast.success("Всі зміни збережено!");
      loadReviews();
    } catch (error: any) {
      toast.error("Помилка збереження: " + error.response?.data?.message);
    }
  };

  const getCurrentRating = (criteriaName: string): ICriteriaRating | undefined => {
    return editingRatings[criteriaName] || selectedReview?.ratings.find((r) => r.criteriaName === criteriaName);
  };

  const hasAnyUnsavedChanges = (): boolean => {
    return Object.keys(editingRatings).length > 0;
  };

  const handleCompleteReview = async () => {
    if (!selectedReview) return;


    setShowCommentDialog(true);
  };

  const submitCompleteReview = async (finalComment: string) => {
    if (!selectedReview || !finalComment.trim()) {
      toast.error("Будь ласка, введіть фінальний коментар");
      return;
    }

    try {
      await apiClient.post(
        `/reviews/${selectedReview._id}/complete`,
        { finalComment }
      );
      toast.success("Оцінку завершено!");
      setSelectedReview(null);
      setShowCommentDialog(false);
      loadReviews();
    } catch (error: any) {
      toast.error("Помилка завершення оцінки: " + error.response?.data?.message);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("Ви впевнені, що хочете видалити цю оцінку?")) return;

    try {
      await apiClient.delete(`/reviews/${reviewId}`);
      toast.success("Оцінку видалено!");
      loadReviews();
    } catch (error: any) {
      toast.error("Помилка видалення: " + error.response?.data?.message);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return "Чернетка";
      case "in_progress":
        return "В процесі";
      case "completed":
        return "Завершено";
      case "cancelled":
        return "Скасовано";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-700";
      case "in_progress":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const [editingRatings, setEditingRatings] = useState<{ [key: string]: ICriteriaRating }>({});

  if (selectedReview) {
    const template = templates.find((t) => t._id === selectedReview.templateId?._id);

    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => setSelectedReview(null)}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              ← Назад до списку
            </button>
            {selectedReview.status !== "completed" && selectedReview.status !== "cancelled" && (
              <button
                onClick={handleCompleteReview}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
              >
                Завершити оцінку
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl p-8 shadow-md mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Оцінка: {getUserName(selectedReview.employeeId)}
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-gray-600">Посада:</span>
                <span className="ml-2 font-semibold">{getUserPosition(selectedReview.employeeId)}</span>
              </div>
              <div>
                <span className="text-gray-600">Шаблон:</span>
                <span className="ml-2 font-semibold">{selectedReview.templateId?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Період:</span>
                <span className="ml-2 font-semibold">
                  {new Date(selectedReview.reviewPeriod.startDate).toLocaleDateString()} -{" "}
                  {new Date(selectedReview.reviewPeriod.endDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Статус:</span>
                <span
                  className={`ml-2 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                    selectedReview.status
                  )}`}
                >
                  {getStatusLabel(selectedReview.status)}
                </span>
              </div>
            </div>
            {selectedReview.finalScore && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <span className="text-gray-700 font-semibold">Фінальна оцінка:</span>
                <span className="ml-2 text-2xl font-bold text-green-700">
                  {selectedReview.finalScore.toFixed(2)} / 5.00
                </span>
              </div>
            )}
          </div>

          {}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">Критерії оцінки</h3>
            {template?.criteria.map((criteria, index) => {
              const currentRating = getCurrentRating(criteria.name);
              const isReadOnly = selectedReview.status === "completed" || selectedReview.status === "cancelled";

              return (
                <div key={`${criteria.name}-${index}`} className="bg-white rounded-xl p-6 shadow-md">
                  <div className="mb-3">
                    <h4 className="text-lg font-bold text-gray-800">{criteria.name}</h4>
                    <p className="text-sm text-gray-600">{criteria.description}</p>
                    <span className="text-xs text-gray-500">Вага: {criteria.weight}%</span>
                  </div>

                  {criteria.type === "rating" && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Оцінка (1-5):
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={currentRating?.rating || ""}
                        onChange={(e) =>
                          handleEditRating(criteria.name, {
                            rating: parseInt(e.target.value),
                          })
                        }
                        disabled={isReadOnly}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-2"
                      />
                    </div>
                  )}

                  {criteria.type === "text" && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Текстова відповідь:
                      </label>
                      <textarea
                        value={currentRating?.textResponse || ""}
                        onChange={(e) =>
                          handleEditRating(criteria.name, {
                            textResponse: e.target.value,
                          })
                        }
                        disabled={isReadOnly}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-2"
                        rows={3}
                      />
                    </div>
                  )}

                  {criteria.type === "yes_no" && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Так/Ні:
                      </label>
                      <select
                        value={
                          currentRating?.yesNoResponse === undefined
                            ? ""
                            : currentRating.yesNoResponse
                            ? "yes"
                            : "no"
                        }
                        onChange={(e) =>
                          handleEditRating(criteria.name, {
                            yesNoResponse: e.target.value === "yes",
                          })
                        }
                        disabled={isReadOnly}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-2"
                      >
                        <option value="">-- Оберіть --</option>
                        <option value="yes">Так</option>
                        <option value="no">Ні</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Коментар:
                    </label>
                    <textarea
                      value={currentRating?.comment || ""}
                      onChange={(e) =>
                        handleEditRating(criteria.name, {
                          comment: e.target.value,
                        })
                      }
                      disabled={isReadOnly}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-3"
                      rows={2}
                      placeholder="Додатковий коментар..."
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {}
          {selectedReview.status !== "completed" && selectedReview.status !== "cancelled" && (
            <div className="mt-6 flex gap-4">
              <button
                onClick={handleSaveAllRatings}
                disabled={!hasAnyUnsavedChanges()}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                  hasAnyUnsavedChanges()
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                {hasAnyUnsavedChanges() ? "💾 Зберегти всі зміни" : "✓ Все збережено"}
              </button>
            </div>
          )}

          {selectedReview.finalComment && (
            <div className="mt-6 bg-white rounded-xl p-6 shadow-md">
              <h4 className="text-lg font-bold text-gray-800 mb-2">Фінальний коментар:</h4>
              <p className="text-gray-700">{selectedReview.finalComment}</p>
            </div>
          )}
        </div>

        {}
        <PromptDialog
          isOpen={showCommentDialog}
          title="Фінальний коментар"
          message="Будь ласка, введіть фінальний коментар до оцінки:"
          placeholder="Наприклад: Відмінна робота протягом року, всі цілі досягнуто..."
          onConfirm={submitCompleteReview}
          onCancel={() => setShowCommentDialog(false)}
          confirmText="Завершити оцінку"
          cancelText="Скасувати"
          required={true}
          multiline={true}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Оцінки Ефективності</h1>
            <p className="text-gray-600 mt-2">Проводьте оцінки співробітників</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            {showCreateForm ? "Скасувати" : "+ Створити оцінку"}
          </button>
        </div>

        {}
        {showCreateForm && (
          <div className="bg-white rounded-xl p-8 shadow-md mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Створити нову оцінку</h2>
            <form onSubmit={handleCreateReview} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Співробітник:
                </label>
                <select
                  value={newReview.employeeId}
                  onChange={(e) => setNewReview({ ...newReview, employeeId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                >
                  <option value="">-- Оберіть співробітника --</option>
                  {employees
                    .filter((emp) => {

                      const empId = emp.id || emp._id || '';
                      return empId !== authStore.user?.id;
                    })
                    .map((emp) => {
                      const empId = emp.id || emp._id || '';
                      const firstName = emp.personalInfo?.firstName || emp.firstName || '';
                      const lastName = emp.personalInfo?.lastName || emp.lastName || '';
                      const position = emp.jobInfo?.jobTitle || emp.jobInfo?.position || emp.position || 'N/A';
                      const department = emp.jobInfo?.department || emp.department || 'N/A';
                      
                      return (
                        <option key={empId} value={empId}>
                          {firstName} {lastName} - {position} ({department})
                        </option>
                      );
                    })
                  }
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Шаблон оцінки:
                </label>
                <select
                  value={newReview.templateId}
                  onChange={(e) => setNewReview({ ...newReview, templateId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                >
                  <option value="">-- Оберіть шаблон --</option>
                  {templates.map((template) => (
                    <option key={template._id} value={template._id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Початок періоду:
                  </label>
                  <UkDatePicker
                    selected={newReview.startDate ? new Date(newReview.startDate) : null}
                    onChange={(date: Date | null) => setNewReview({ ...newReview, startDate: date ? date.toISOString().slice(0, 10) : "" })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    required
                    placeholderText="Оберіть дату"
                    isClearable
                    dateFormat="yyyy-MM-dd"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Кінець періоду:
                  </label>
                  <UkDatePicker
                    selected={newReview.endDate ? new Date(newReview.endDate) : null}
                    onChange={(date: Date | null) => setNewReview({ ...newReview, endDate: date ? date.toISOString().slice(0, 10) : "" })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    required
                    placeholderText="Оберіть дату"
                    isClearable
                    dateFormat="yyyy-MM-dd"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Створити оцінку
              </button>
            </form>
          </div>
        )}

        {}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-gray-600">Завантаження...</div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-md text-center">
            <p className="text-gray-600 text-lg">Оцінок ще немає</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {reviews.map((review) => (
              <div key={review._id} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {getUserName(review.employeeId)}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-semibold">Посада:</span> {getUserPosition(review.employeeId)}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-semibold">Шаблон:</span> {review.templateId?.name || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-semibold">Період:</span>{" "}
                      {new Date(review.reviewPeriod.startDate).toLocaleDateString()} -{" "}
                      {new Date(review.reviewPeriod.endDate).toLocaleDateString()}
                    </p>
                    <div className="mt-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                          review.status
                        )}`}
                      >
                        {getStatusLabel(review.status)}
                      </span>
                      {review.finalScore && (
                        <span className="ml-3 text-green-700 font-bold">
                          Оцінка: {review.finalScore.toFixed(2)} / 5.00
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenReview(review)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
                    >
                      {review.status === "completed" ? "Переглянути" : "Провести"}
                    </button>
                    {review.status !== "completed" && (
                      <button
                        onClick={() => handleDeleteReview(review._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
                      >
                        Видалити
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {}
      <PromptDialog
        isOpen={showCommentDialog}
        title="Фінальний коментар"
        message="Будь ласка, введіть фінальний коментар до оцінки:"
        placeholder="Наприклад: Відмінна робота протягом року, всі цілі досягнуто..."
        onConfirm={submitCompleteReview}
        onCancel={() => setShowCommentDialog(false)}
        confirmText="Завершити оцінку"
        cancelText="Скасувати"
        required={true}
        multiline={true}
      />
    </div>
  );
});

export default PerformanceReviews;
