

import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
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

interface ICriteriaRating {
  criteriaName: string;
  rating?: number;
  textResponse?: string;
  yesNoResponse?: boolean;
  comment?: string;
}

interface IFeedback {
  from: {
    _id: string;
    firstName?: string;
    lastName?: string;
    personalInfo?: {
      firstName: string;
      lastName: string;
    };
  };
  comment: string;
  createdAt: string;
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
    criteria: ICriteria[];
  };
  reviewPeriod: {
    startDate: string;
    endDate: string;
  };
  ratings: ICriteriaRating[];
  feedback: IFeedback[];
  status: "draft" | "in_progress" | "completed" | "cancelled";
  finalScore?: number;
  finalComment?: string;
  createdAt: string;
  completedAt?: string;
}

const MyReviews: React.FC = observer(() => {
  const [reviews, setReviews] = useState<IPerformanceReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReview, setSelectedReview] = useState<IPerformanceReview | null>(null);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);

  const getUserName = (user: any) => {
    const firstName = user?.personalInfo?.firstName || user?.firstName || '';
    const lastName = user?.personalInfo?.lastName || user?.lastName || '';
    return `${firstName} ${lastName}`.trim();
  };

  useEffect(() => {
    loadMyReviews();
  }, []);

  const loadMyReviews = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/reviews/my");
      setReviews(response.data.data || response.data);
    } catch (error: any) {
      toast.error("Помилка завантаження оцінок: " + error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeedback = async () => {
    if (!selectedReview) return;

    setShowFeedbackDialog(true);
  };

  const submitFeedback = async (feedbackComment: string) => {
    if (!selectedReview || !feedbackComment.trim()) {
      toast.error("Будь ласка, введіть коментар");
      return;
    }

    try {
      await apiClient.post(`/reviews/${selectedReview._id}/feedback`, {
        comment: feedbackComment,
      });
      toast.success("Коментар успішно додано!");
      setShowFeedbackDialog(false);

      const response = await apiClient.get(`/reviews/${selectedReview._id}`);
      setSelectedReview(response.data.data || response.data);
      loadMyReviews();
    } catch (error: any) {
      toast.error("Помилка додавання коментаря: " + error.response?.data?.message);
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

  const getCriteriaTypeLabel = (type: string) => {
    switch (type) {
      case "rating":
        return "Оцінка (1-5)";
      case "text":
        return "Текстова відповідь";
      case "yes_no":
        return "Так/Ні";
      default:
        return type;
    }
  };

  if (selectedReview) {
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
            {selectedReview.status !== "draft" && (
              <button
                onClick={handleAddFeedback}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
              >
                Додати коментар
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl p-8 shadow-md mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Деталі оцінки: {selectedReview.templateId.name}
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-gray-600">Оцінювач:</span>
                <span className="ml-2 font-semibold">
                  {getUserName(selectedReview.reviewerId)}
                </span>
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
              {selectedReview.completedAt && (
                <div>
                  <span className="text-gray-600">Завершено:</span>
                  <span className="ml-2 font-semibold">
                    {new Date(selectedReview.completedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
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
          <div className="space-y-4 mb-6">
            <h3 className="text-xl font-bold text-gray-800">Критерії оцінки</h3>
            {selectedReview.templateId.criteria.map((criteria, index) => {
              const rating = selectedReview.ratings.find(
                (r) => r.criteriaName === criteria.name
              );

              return (
                <div key={index} className="bg-white rounded-xl p-6 shadow-md">
                  <div className="mb-3">
                    <h4 className="text-lg font-bold text-gray-800">{criteria.name}</h4>
                    <p className="text-sm text-gray-600">{criteria.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-500">
                        Тип: {getCriteriaTypeLabel(criteria.type)}
                      </span>
                      <span className="text-xs text-gray-500">Вага: {criteria.weight}%</span>
                    </div>
                  </div>

                  {rating ? (
                    <div className="space-y-2">
                      {criteria.type === "rating" && rating.rating && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <span className="text-gray-700 font-semibold">Оцінка:</span>
                          <span className="ml-2 text-xl font-bold text-blue-700">
                            {rating.rating} / 5
                          </span>
                        </div>
                      )}

                      {criteria.type === "text" && rating.textResponse && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-gray-700 font-semibold mb-1">Відповідь:</p>
                          <p className="text-gray-800">{rating.textResponse}</p>
                        </div>
                      )}

                      {criteria.type === "yes_no" && rating.yesNoResponse !== undefined && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <span className="text-gray-700 font-semibold">Відповідь:</span>
                          <span
                            className={`ml-2 px-3 py-1 rounded-full text-sm font-bold ${
                              rating.yesNoResponse
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {rating.yesNoResponse ? "Так" : "Ні"}
                          </span>
                        </div>
                      )}

                      {rating.comment && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-gray-700 font-semibold mb-1">Коментар оцінювача:</p>
                          <p className="text-gray-800">{rating.comment}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Ще не оцінено</p>
                  )}
                </div>
              );
            })}
          </div>

          {}
          {selectedReview.finalComment && (
            <div className="bg-white rounded-xl p-6 shadow-md mb-6">
              <h4 className="text-lg font-bold text-gray-800 mb-2">Фінальний коментар:</h4>
              <p className="text-gray-700">{selectedReview.finalComment}</p>
            </div>
          )}

          {}
          {selectedReview.feedback && selectedReview.feedback.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h4 className="text-lg font-bold text-gray-800 mb-4">
                Коментарі ({selectedReview.feedback.length})
              </h4>
              <div className="space-y-3">
                {selectedReview.feedback.map((fb, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-800">
                        {getUserName(fb.from)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{fb.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Мої Оцінки</h1>
          <p className="text-gray-600 mt-2">Перегляньте історію ваших оцінок ефективності</p>
        </div>

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
              <div
                key={review._id}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedReview(review)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {review.templateId.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-semibold">Оцінювач:</span>{" "}
                      {getUserName(review.reviewerId)}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-semibold">Період:</span>{" "}
                      {new Date(review.reviewPeriod.startDate).toLocaleDateString()} -{" "}
                      {new Date(review.reviewPeriod.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-semibold">Створено:</span>{" "}
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                          review.status
                        )}`}
                      >
                        {getStatusLabel(review.status)}
                      </span>
                      {review.finalScore && (
                        <span className="text-green-700 font-bold text-lg">
                          Оцінка: {review.finalScore.toFixed(2)} / 5.00
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">
                      Переглянути
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {}
      <PromptDialog
        isOpen={showFeedbackDialog}
        title="Додати коментар"
        message="Будь ласка, введіть ваш коментар до оцінки:"
        placeholder="Ваш коментар..."
        onConfirm={submitFeedback}
        onCancel={() => setShowFeedbackDialog(false)}
        confirmText="Додати коментар"
        cancelText="Скасувати"
        required={true}
        multiline={true}
      />
    </div>
  );
});

export default MyReviews;
