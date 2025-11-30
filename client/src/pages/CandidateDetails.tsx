

import React, { useEffect, useState } from "react";
import { UkDatePicker, UkDateTimePicker } from "../components/UkDatePicker";
import { observer } from "mobx-react-lite";
import { useParams, useNavigate } from "react-router-dom";
import authStore from "../stores/AuthStore";
import apiClient from "../services/api";
import { toast } from "react-toastify";
import ConfirmDialog from "../components/ConfirmDialog";
import PromptDialog from "../components/PromptDialog";
import { RecruitmentStage } from "../types/recruitment.types";
import type {
  Candidate,
  MoveCandidateDTO,
  AddFeedbackDTO,
  GenerateOfferDTO,
} from "../types/recruitment.types";

const stageLabels: Record<string, string> = {
  application: "Заявка",
  screening: "Скринінг",
  technical: "Технічне інтерв'ю",
  hr_interview: "HR інтерв'ю",
  final: "Фінальне інтерв'ю",
  offer: "Оффер",
  hired: "Найнято",
  rejected: "Відхилено",
};

const recommendationLabels: Record<string, string> = {
  strong_yes: "Однозначно так ✅",
  yes: "Так 👍",
  maybe: "Можливо 🤔",
  no: "Ні 👎",
  strong_no: "Однозначно ні ❌",
};

const stageOrder: RecruitmentStage[] = [
  RecruitmentStage.APPLICATION,
  RecruitmentStage.SCREENING,
  RecruitmentStage.TECHNICAL_INTERVIEW,
  RecruitmentStage.HR_INTERVIEW,
  RecruitmentStage.FINAL_INTERVIEW,
  RecruitmentStage.OFFER,
  RecruitmentStage.HIRED,
];

const getAllowedStages = (currentStage: RecruitmentStage): RecruitmentStage[] => {
  const currentIndex = stageOrder.indexOf(currentStage);
  const allowed: RecruitmentStage[] = [];

  if (currentIndex > 0) {
    allowed.push(stageOrder[currentIndex - 1]);
  }

  if (currentIndex < stageOrder.length - 1) {
    allowed.push(stageOrder[currentIndex + 1]);
  }

  allowed.push(RecruitmentStage.REJECTED);
  
  return allowed;
};

const CandidateDetails: React.FC = observer(() => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [jobProfiles, setJobProfiles] = useState<any[]>([]);

  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string>("");

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant?: "danger" | "warning" | "info" | "success";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [promptDialog, setPromptDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    defaultValue?: string;
    required?: boolean;
    multiline?: boolean;
    onConfirm: (value: string) => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [moveForm, setMoveForm] = useState<MoveCandidateDTO>({
    stage: "screening" as RecruitmentStage,
    notes: "",
    interview: undefined,
  });

  const [feedbackForm, setFeedbackForm] = useState<AddFeedbackDTO>({
    rating: 3,
    comment: "",
    recommendation: "maybe",
  });

  const [offerForm, setOfferForm] = useState<GenerateOfferDTO>({
    position: "",
    salary: 0,
    currency: "UAH",
    startDate: "",
    benefits: [],
  });

  const [benefitInput, setBenefitInput] = useState("");

  useEffect(() => {
    if (id) {
      fetchCandidate();
      fetchUsers();
      fetchJobProfiles();
    }
  }, [id]);

  const fetchCandidate = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/recruitment/${id}`);
      setCandidate(response.data.data);

      if (response.data.data) {
        setOfferForm((prev) => ({
          ...prev,
          position: response.data.data.position,
        }));
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get("/users");
      setUsers(response.data.data || []);
    } catch (error) {
    }
  };

  const fetchJobProfiles = async () => {
    try {
      const response = await apiClient.get("/skills/job-profiles");
      if (response.data.success) {
        setJobProfiles(response.data.data || []);
      }
    } catch (error) {
    }
  };

  const handleMoveStage = async () => {
    if (!candidate) return;

    try {

      const stagesRequiringInterview = ["technical", "hr_interview", "final"];
                      <UkDateTimePicker
                        selected={moveForm.interview?.scheduledAt ? new Date(moveForm.interview.scheduledAt) : null}
                        onChange={(date: Date | null) =>
                          setMoveForm({
                            ...moveForm,
                            interview: {
                              ...moveForm.interview,
                              scheduledAt: date ? date.toISOString() : "",
                              interviewers: moveForm.interview?.interviewers ?? [],
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                        placeholderText="Оберіть дату та час"
                        isClearable
                      />

      setMoveForm({
        stage: "screening" as RecruitmentStage,
        notes: "",
        interview: undefined,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Помилка при переміщенні кандидата");
    }
  };

  const handleAddFeedback = async () => {
    if (!candidate || !selectedInterviewId) return;

    try {
      await apiClient.post(
        `/recruitment/${candidate.id}/interviews/${selectedInterviewId}/feedback`,
        feedbackForm
      );
      toast.success("Фідбек успішно додано!");
      setShowFeedbackModal(false);
      fetchCandidate();

      setFeedbackForm({
        rating: 3,
        comment: "",
        recommendation: "maybe",
      });
      setSelectedInterviewId("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Помилка при додаванні фідбеку");
    }
  };

  const handleGenerateOffer = async () => {
    if (!candidate) return;

    try {
      await apiClient.post(`/recruitment/${candidate.id}/offer/generate`, offerForm);
      toast.success("Оффер успішно згенеровано!");
      setShowOfferModal(false);
      fetchCandidate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Помилка при генерації оффера");
    }
  };

  const handleSendOffer = async () => {
    if (!candidate) return;

    try {
      await apiClient.post(`/recruitment/${candidate.id}/offer/send`);
      toast.success("Оффер надіслано кандидату!");
      fetchCandidate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Помилка при надсиланні оффера");
    }
  };

  const handleUpdateOfferStatus = (status: "accepted" | "rejected") => {
    if (!candidate) return;

    if (status === "accepted") {
      setConfirmDialog({
        isOpen: true,
        title: "Підтвердження прийняття оффера",
        message: "Підтвердіть, що кандидат прийняв оффер.\nКандидат буде переведений в статус 'Найнятий'.",
        variant: "success",
        onConfirm: () => executeUpdateOfferStatus(status, null),
      });
    } else {
      setConfirmDialog({
        isOpen: true,
        title: "Підтвердження відхилення оффера",
        message: "Підтвердіть, що кандидат відхилив оффер.",
        variant: "warning",
        onConfirm: () => {
          setConfirmDialog({ ...confirmDialog, isOpen: false });
          setPromptDialog({
            isOpen: true,
            title: "Причина відхилення",
            message: "Вкажіть причину відхилення (необов'язково):",
            required: false,
            multiline: true,
            onConfirm: (reason) => executeUpdateOfferStatus(status, reason),
          });
        },
      });
    }
  };

  const executeUpdateOfferStatus = async (status: "accepted" | "rejected", rejectionReason: string | null) => {
    if (!candidate) return;

    try {
      await apiClient.put(`/recruitment/${candidate.id}/offer-status`, {
        status,
        rejectionReason,
      });
      
      if (status === "accepted") {
        toast.success("Кандидат прийняв оффер! Статус оновлено на 'Найнятий'.");
        setConfirmDialog({
          isOpen: true,
          title: "Створення акаунту",
          message: "Створити акаунт співробітника для цього кандидата?",
          variant: "info",
          onConfirm: () => {
            setConfirmDialog({ ...confirmDialog, isOpen: false });
            navigate(`/employees?candidateId=${candidate.id}`);
          },
        });
      } else {
        toast.info("Кандидат відхилив оффер. Статус оновлено.");
        fetchCandidate();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Помилка при оновленні статусу оффера");
    }
  };

  const handleCreateEmployeeAccount = () => {
    if (!candidate) return;
    
    setConfirmDialog({
      isOpen: true,
      title: "Створення акаунту співробітника",
      message: "Перенаправити на створення акаунту співробітника?",
      variant: "info",
      onConfirm: () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        navigate(`/employees?candidateId=${candidate.id}`);
      },
    });
  };

  const handleReject = () => {
    if (!candidate) return;

    setConfirmDialog({
      isOpen: true,
      title: "Відхилення кандидата",
      message: "Ви впевнені, що хочете відхилити цього кандидата?",
      variant: "danger",
      onConfirm: () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setPromptDialog({
          isOpen: true,
          title: "Причина відхилення",
          message: "Вкажіть причину відхилення:",
          required: true,
          multiline: true,
          onConfirm: executeReject,
        });
      },
    });
  };

  const executeReject = async (reason: string) => {
    if (!candidate) return;

    try {
      await apiClient.post(`/recruitment/${candidate.id}/reject`, { reason });
      toast.success("Кандидата відхилено");
      fetchCandidate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Помилка при відхиленні кандидата");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Завантаження...</div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="text-center py-12">
        <div className="text-xl text-gray-600">Кандидата не знайдено</div>
      </div>
    );
  }

  const canManage =
    authStore.user?.role === "hr_manager" ||
    authStore.user?.role === "admin" ||
    authStore.user?.role === "recruiter";

  const userInterviews = candidate.interviews.filter((interview) =>
    interview.interviewers.some((int) => int.id === authStore.user?.id)
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {}
      <div className="flex justify-between items-start">
        <div>
          <button
            onClick={() => navigate("/recruitment")}
            className="text-blue-600 hover:text-blue-700 mb-2"
          >
            ← Назад до воронки
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {candidate.firstName} {candidate.lastName}
          </h1>
          <p className="text-gray-600 mt-1">{candidate.position}</p>
        </div>

        {canManage && candidate.status === "active" && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowMoveModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Перемістити далі
            </button>
            <button
              onClick={handleReject}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Відхилити
            </button>
          </div>
        )}

        {canManage && candidate.status === "hired" && (
          <div className="flex gap-2">
            <button
              onClick={handleCreateEmployeeAccount}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              👤 Створити акаунт співробітника
            </button>
          </div>
        )}
      </div>

      {}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Контактна інформація</h2>
          <div className="space-y-3">
            <div>
              <span className="text-gray-600">Email:</span>{" "}
              <span className="font-medium">{candidate.email}</span>
            </div>
            {candidate.phone && (
              <div>
                <span className="text-gray-600">Телефон:</span>{" "}
                <span className="font-medium">{candidate.phone}</span>
              </div>
            )}
            {candidate.linkedinUrl && (
              <div>
                <span className="text-gray-600">LinkedIn:</span>{" "}
                <a
                  href={candidate.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Профіль
                </a>
              </div>
            )}
            {candidate.resumeUrl && (
              <div>
                <span className="text-gray-600">Резюме:</span>{" "}
                <a
                  href={candidate.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Завантажити
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Статус</h2>
          <div className="space-y-3">
            <div>
              <span className="text-gray-600">Поточний етап:</span>{" "}
              <span className="font-medium">
                {stageLabels[candidate.currentStage]}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Статус:</span>{" "}
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  candidate.status === "active"
                    ? "bg-green-100 text-green-700"
                    : candidate.status === "hired"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {candidate.status === "active"
                  ? "Активний"
                  : candidate.status === "hired"
                  ? "Найнято"
                  : "Відхилено"}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Департамент:</span>{" "}
              <span className="font-medium">{candidate.department}</span>
            </div>
            {candidate.source && (
              <div>
                <span className="text-gray-600">Джерело:</span>{" "}
                <span className="font-medium">{candidate.source}</span>
              </div>
            )}
            {candidate.assignedTo && (
              <div>
                <span className="text-gray-600">Рекрутер:</span>{" "}
                <span className="font-medium">
                  {candidate.assignedTo.firstName} {candidate.assignedTo.lastName}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Інтерв'ю</h2>
        {candidate.interviews.length === 0 ? (
          <p className="text-gray-500">Інтерв'ю ще не заплановано</p>
        ) : (
          <div className="space-y-4">
            {candidate.interviews.map((interview, index) => (
              <div key={interview._id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold">
                      Інтерв'ю #{index + 1}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(interview.scheduledAt).toLocaleString("uk-UA")}
                    </div>
                    {interview.location && (
                      <div className="text-sm text-gray-600">
                        📍 {interview.location}
                      </div>
                    )}
                    {interview.meetingLink && (
                      <div className="text-sm">
                        <a
                          href={interview.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          🔗 Посилання на зустріч
                        </a>
                      </div>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      interview.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : interview.status === "cancelled"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {interview.status === "completed"
                      ? "Завершено"
                      : interview.status === "cancelled"
                      ? "Скасовано"
                      : "Заплановано"}
                  </span>
                </div>

                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    Інтерв'юери:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {interview.interviewers.map((interviewer) => (
                      <span
                        key={interviewer.id}
                        className="px-2 py-1 bg-gray-100 rounded text-sm"
                      >
                        {interviewer.firstName} {interviewer.lastName}
                      </span>
                    ))}
                  </div>
                </div>

                {interview.notes && (
                  <div className="mb-3 text-sm text-gray-600">
                    <strong>Нотатки:</strong> {interview.notes}
                  </div>
                )}

                {}
                {interview.feedback && interview.feedback.length > 0 && (
                  <div className="mt-3 border-t pt-3">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Фідбек ({interview.feedback.length}/
                      {interview.interviewers.length}):
                    </div>
                    <div className="space-y-3">
                      {interview.feedback.map((feedback, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-sm">
                              {feedback.from.firstName} {feedback.from.lastName}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                {"⭐".repeat(feedback.rating)}
                              </span>
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  feedback.recommendation === "strong_yes"
                                    ? "bg-green-500 text-white"
                                    : feedback.recommendation === "yes"
                                    ? "bg-green-200 text-green-700"
                                    : feedback.recommendation === "maybe"
                                    ? "bg-yellow-200 text-yellow-700"
                                    : feedback.recommendation === "no"
                                    ? "bg-red-200 text-red-700"
                                    : "bg-red-500 text-white"
                                }`}
                              >
                                {recommendationLabels[feedback.recommendation]}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700">
                            {feedback.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {}
                {interview.status === "scheduled" &&
                  interview.interviewers.some(
                    (int) => int.id === authStore.user?.id
                  ) &&
                  !interview.feedback?.some(
                    (f) => f.from.id === authStore.user?.id
                  ) && (
                    <button
                      onClick={() => {
                        setSelectedInterviewId(interview._id);
                        setShowFeedbackModal(true);
                      }}
                      className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      Залишити фідбек
                    </button>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>

      {}
      {candidate.offer && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Оффер</h2>
          <div className="space-y-3">
            <div>
              <span className="text-gray-600">Посада:</span>{" "}
              <span className="font-medium">{candidate.offer.position}</span>
            </div>
            <div>
              <span className="text-gray-600">Зарплата:</span>{" "}
              <span className="font-medium">
                {candidate.offer.salary.toLocaleString()} {candidate.offer.currency}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Дата початку:</span>{" "}
              <span className="font-medium">
                {new Date(candidate.offer.startDate).toLocaleDateString("uk-UA")}
              </span>
            </div>
            {candidate.offer.benefits && candidate.offer.benefits.length > 0 && (
              <div>
                <span className="text-gray-600">Переваги:</span>
                <ul className="list-disc list-inside ml-4">
                  {candidate.offer.benefits.map((benefit, idx) => (
                    <li key={idx}>{benefit}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <span className="text-gray-600">Статус:</span>{" "}
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  candidate.offer.status === "accepted"
                    ? "bg-green-100 text-green-700"
                    : candidate.offer.status === "rejected"
                    ? "bg-red-100 text-red-700"
                    : candidate.offer.status === "sent"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {candidate.offer.status === "draft"
                  ? "Чернетка"
                  : candidate.offer.status === "sent"
                  ? "Надіслано"
                  : candidate.offer.status === "accepted"
                  ? "Прийнято"
                  : "Відхилено"}
              </span>
            </div>
            
            {}
            {candidate.offer.status === "rejected" && candidate.offer.rejectionReason && (
              <div>
                <span className="text-gray-600">Причина відхилення:</span>{" "}
                <span className="text-red-600">{candidate.offer.rejectionReason}</span>
              </div>
            )}
            
            {}
            {canManage && candidate.offer.status === "sent" && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleUpdateOfferStatus("accepted")}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                >
                  ✓ Кандидат прийняв оффер
                </button>
                <button
                  onClick={() => handleUpdateOfferStatus("rejected")}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                >
                  ✗ Кандидат відхилив оффер
                </button>
              </div>
            )}
            
            {canManage && candidate.offer.status === "draft" && (
              <button
                onClick={handleSendOffer}
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Оффер надіслано
              </button>
            )}
          </div>
        </div>
      )}

      {}
      {canManage &&
        !candidate.offer &&
        candidate.currentStage === "offer" && (
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">
              Готові згенерувати оффер?
            </h3>
            <p className="text-blue-700 mb-4">
              {candidate.interviews.some((int) => int.status === "completed")
                ? "Кандидат пройшов інтерв'ю. Ви можете згенерувати оффер."
                : "Кандидат на стадії оффера. Згенеруйте оффер для надсилання."}
            </p>
            <button
              onClick={() => setShowOfferModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Згенерувати оффер
            </button>
          </div>
        )}

      {}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Історія переміщень</h2>
        <div className="space-y-3">
          {candidate.stageHistory.map((history, index) => (
            <div key={index} className="flex items-start gap-4 border-l-2 border-blue-500 pl-4">
              <div className="flex-1">
                <div className="font-medium">{stageLabels[history.stage]}</div>
                <div className="text-sm text-gray-600">
                  {new Date(history.movedAt).toLocaleString("uk-UA")}
                </div>
                <div className="text-sm text-gray-600">
                  Автор: {history.movedBy.firstName} {history.movedBy.lastName}
                </div>
                {history.notes && (
                  <div className="text-sm text-gray-700 mt-1">{history.notes}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Перемістити кандидата</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Новий етап *
                </label>
                <select
                  value={moveForm.stage}
                  onChange={(e) =>
                    setMoveForm({
                      ...moveForm,
                      stage: e.target.value as RecruitmentStage,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">-- Оберіть етап --</option>
                  {getAllowedStages(candidate.currentStage).map((stage) => (
                    <option key={stage} value={stage}>
                      {stageLabels[stage]}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Можна перейти тільки на наступний етап або повернутися на попередній
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Нотатки
                </label>
                <textarea
                  value={moveForm.notes}
                  onChange={(e) =>
                    setMoveForm({ ...moveForm, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {}
              {["technical", "hr_interview", "final"].includes(moveForm.stage) && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3 text-red-600">
                    ⚠️ Для цього етапу необхідно запланувати інтерв'ю
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Дата та час інтерв'ю *
                      </label>
                      <input
                        type="datetime-local"
                        value={moveForm.interview?.scheduledAt || ""}
                        onChange={(e) =>
                          setMoveForm({
                            ...moveForm,
                            interview: {
                              ...moveForm.interview,
                              scheduledAt: e.target.value,
                              interviewers: moveForm.interview?.interviewers || [],
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Інтерв'юери * (оберіть кілька)
                      </label>
                      <select
                        multiple
                        value={moveForm.interview?.interviewers || []}
                        onChange={(e) => {
                          const selected = Array.from(
                            e.target.selectedOptions,
                            (option) => option.value
                          );
                          setMoveForm({
                            ...moveForm,
                            interview: {
                              ...moveForm.interview,
                              scheduledAt: moveForm.interview?.scheduledAt || "",
                              interviewers: selected,
                            },
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        size={5}
                      >
                        {users
                          .filter(
                            (u) =>
                              u.role === "hr_manager" ||
                              u.role === "line_manager" ||
                              u.role === "admin"
                          )
                          .map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.firstName} {user.lastName} ({user.role})
                            </option>
                          ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Тримайте Cmd/Ctrl для вибору кількох
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Локація
                      </label>
                      <input
                        type="text"
                        value={moveForm.interview?.location || ""}
                        onChange={(e) =>
                          setMoveForm({
                            ...moveForm,
                            interview: {
                              ...moveForm.interview!,
                              location: e.target.value,
                            },
                          })
                        }
                        placeholder="Офіс, кімната 101"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Посилання на зустріч
                      </label>
                      <input
                        type="url"
                        value={moveForm.interview?.meetingLink || ""}
                        onChange={(e) =>
                          setMoveForm({
                            ...moveForm,
                            interview: {
                              ...moveForm.interview!,
                              meetingLink: e.target.value,
                            },
                          })
                        }
                        placeholder="https://meet.google.com/..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Нотатки до інтерв'ю
                      </label>
                      <textarea
                        value={moveForm.interview?.notes || ""}
                        onChange={(e) =>
                          setMoveForm({
                            ...moveForm,
                            interview: {
                              ...moveForm.interview!,
                              notes: e.target.value,
                            },
                          })
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowMoveModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Скасувати
              </button>
              <button
                onClick={handleMoveStage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Перемістити
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-4">Залишити фідбек</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Рейтинг (1-5) *
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() =>
                        setFeedbackForm({ ...feedbackForm, rating })
                      }
                      className={`text-3xl ${
                        rating <= feedbackForm.rating
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Рекомендація *
                </label>
                <select
                  value={feedbackForm.recommendation}
                  onChange={(e) =>
                    setFeedbackForm({
                      ...feedbackForm,
                      recommendation: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="strong_yes">Однозначно так ✅</option>
                  <option value="yes">Так 👍</option>
                  <option value="maybe">Можливо 🤔</option>
                  <option value="no">Ні 👎</option>
                  <option value="strong_no">Однозначно ні ❌</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Коментар *
                </label>
                <textarea
                  value={feedbackForm.comment}
                  onChange={(e) =>
                    setFeedbackForm({ ...feedbackForm, comment: e.target.value })
                  }
                  rows={4}
                  placeholder="Опишіть враження від кандидата, сильні та слабкі сторони..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Скасувати
              </button>
              <button
                onClick={handleAddFeedback}
                disabled={!feedbackForm.comment}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Відправити фідбек
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-4">Згенерувати оффер</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Посада *
                </label>
                <select
                  value={offerForm.position}
                  onChange={(e) =>
                    setOfferForm({ ...offerForm, position: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Оберіть посаду</option>
                  {jobProfiles.map((profile) => (
                    <option key={profile.id} value={profile.jobTitle}>
                      {profile.jobTitle} ({profile.department})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Посада з профілів посад в базі даних
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Зарплата *
                  </label>
                  <input
                    type="number"
                    value={offerForm.salary}
                    onChange={(e) =>
                      setOfferForm({
                        ...offerForm,
                        salary: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Валюта
                  </label>
                  <select
                    value={offerForm.currency}
                    onChange={(e) =>
                      setOfferForm({ ...offerForm, currency: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="UAH">UAH</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дата початку роботи *
                </label>
                <UkDatePicker
                  selected={offerForm.startDate ? new Date(offerForm.startDate) : null}
                  onChange={(date: Date | null) =>
                    setOfferForm({ ...offerForm, startDate: date ? date.toISOString().slice(0, 10) : "" })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholderText="Оберіть дату"
                  isClearable
                  dateFormat="yyyy-MM-dd"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Переваги
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={benefitInput}
                    onChange={(e) => setBenefitInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && benefitInput.trim()) {
                        setOfferForm({
                          ...offerForm,
                          benefits: [...(offerForm.benefits || []), benefitInput],
                        });
                        setBenefitInput("");
                      }
                    }}
                    placeholder="Додати перевагу (Enter)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    onClick={() => {
                      if (benefitInput.trim()) {
                        setOfferForm({
                          ...offerForm,
                          benefits: [...(offerForm.benefits || []), benefitInput],
                        });
                        setBenefitInput("");
                      }
                    }}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    +
                  </button>
                </div>
                {offerForm.benefits && offerForm.benefits.length > 0 && (
                  <div className="space-y-1">
                    {offerForm.benefits.map((benefit, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded"
                      >
                        <span className="text-sm">{benefit}</span>
                        <button
                          onClick={() =>
                            setOfferForm({
                              ...offerForm,
                              benefits: offerForm.benefits?.filter(
                                (_, i) => i !== idx
                              ),
                            })
                          }
                          className="text-red-600 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowOfferModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Скасувати
              </button>
              <button
                onClick={handleGenerateOffer}
                disabled={
                  !offerForm.position ||
                  !offerForm.salary ||
                  !offerForm.startDate
                }
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Згенерувати оффер
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
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />

      <PromptDialog
        isOpen={promptDialog.isOpen}
        title={promptDialog.title}
        message={promptDialog.message}
        defaultValue={promptDialog.defaultValue}
        required={promptDialog.required}
        multiline={promptDialog.multiline}
        onConfirm={(value) => {
          promptDialog.onConfirm(value);
          setPromptDialog({ ...promptDialog, isOpen: false });
        }}
        onCancel={() => setPromptDialog({ ...promptDialog, isOpen: false })}
      />
    </div>
  );
});

export default CandidateDetails;
