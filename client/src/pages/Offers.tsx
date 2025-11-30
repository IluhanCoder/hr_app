

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Link } from "react-router-dom";
import apiClient from "../services/api";
import type { Candidate } from "../types/recruitment.types";

const Offers: React.FC = observer(() => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "draft" | "sent" | "accepted" | "rejected">("all");

  useEffect(() => {
    fetchCandidatesWithOffers();
  }, []);

  const fetchCandidatesWithOffers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/recruitment");

      const withOffers = response.data.data.filter(
        (c: Candidate) => c.offer || c.currentStage === "offer"
      );
      setCandidates(withOffers);
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCandidates = candidates.filter((candidate) => {
    if (filter === "all") return true;
    return candidate.offer?.status === filter;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: "bg-gray-100 text-gray-700",
      sent: "bg-blue-100 text-blue-700",
      accepted: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      expired: "bg-orange-100 text-orange-700",
    };
    const labels = {
      draft: "Чернетка",
      sent: "Надіслано",
      accepted: "Прийнято",
      rejected: "Відхилено",
      expired: "Минув термін",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const stats = {
    total: candidates.length,
    notGenerated: candidates.filter((c) => !c.offer).length,
    draft: candidates.filter((c) => c.offer?.status === "draft").length,
    sent: candidates.filter((c) => c.offer?.status === "sent").length,
    accepted: candidates.filter((c) => c.offer?.status === "accepted").length,
    rejected: candidates.filter((c) => c.offer?.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Завантаження...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Оффери</h1>
          <p className="text-gray-600 mt-1">Перегляд всіх згенерованих офферів</p>
        </div>
        <Link
          to="/recruitment"
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          ← Назад до рекрутингу
        </Link>
      </div>

      {}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-gray-400">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Всього</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-400">
          <div className="text-2xl font-bold text-yellow-700">{stats.notGenerated}</div>
          <div className="text-sm text-gray-600">Не згенеровано</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-gray-400">
          <div className="text-2xl font-bold text-gray-700">{stats.draft}</div>
          <div className="text-sm text-gray-600">Чернетки</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-400">
          <div className="text-2xl font-bold text-blue-700">{stats.sent}</div>
          <div className="text-sm text-gray-600">Надіслано</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-400">
          <div className="text-2xl font-bold text-green-700">{stats.accepted}</div>
          <div className="text-sm text-gray-600">Прийнято</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-400">
          <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
          <div className="text-sm text-gray-600">Відхилено</div>
        </div>
      </div>

      {}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg ${
              filter === "all" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Всі ({stats.total})
          </button>
          <button
            onClick={() => setFilter("sent")}
            className={`px-4 py-2 rounded-lg ${
              filter === "sent" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Надіслано ({stats.sent})
          </button>
          <button
            onClick={() => setFilter("accepted")}
            className={`px-4 py-2 rounded-lg ${
              filter === "accepted" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Прийнято ({stats.accepted})
          </button>
          <button
            onClick={() => setFilter("rejected")}
            className={`px-4 py-2 rounded-lg ${
              filter === "rejected" ? "bg-red-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Відхилено ({stats.rejected})
          </button>
        </div>
      </div>

      {}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredCandidates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {filter === "all" ? "Немає жодного оффера" : `Немає офферів зі статусом "${filter}"`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Кандидат
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Посада
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Зарплата
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата початку
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Згенеровано
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дії
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {candidate.firstName} {candidate.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{candidate.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {candidate.offer?.position || candidate.position}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {candidate.offer ? (
                        <div className="text-sm font-medium text-gray-900">
                          {candidate.offer.salary.toLocaleString()} {candidate.offer.currency}
                        </div>
                      ) : (
                        <span className="text-sm text-yellow-600 font-medium">Очікує генерації</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {candidate.offer?.startDate
                          ? new Date(candidate.offer.startDate).toLocaleDateString("uk-UA")
                          : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {candidate.offer?.status ? (
                        getStatusBadge(candidate.offer.status)
                      ) : (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
                          Не згенеровано
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {candidate.offer ? (
                        <>
                          <div>
                            {new Date(candidate.offer.generatedAt).toLocaleDateString("uk-UA")}
                          </div>
                          <div className="text-xs text-gray-400">
                            {candidate.offer.generatedBy.firstName} {candidate.offer.generatedBy.lastName}
                          </div>
                        </>
                      ) : (
                        <span className="text-yellow-600">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/recruitment/${candidate.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {candidate.offer ? "Переглянути →" : "Згенерувати →"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
});

export default Offers;
