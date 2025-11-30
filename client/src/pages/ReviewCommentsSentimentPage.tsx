import React, { useEffect, useState } from "react";
import { apiClient } from "../services/api";

interface CommentWithSentiment {
  source: "performance_review" | "recruitment";
  type: string;
  comment: string;
  from: any;
  createdAt: string;
  sentiment: "positive" | "negative" | "neutral";
  sentimentScore: number;

  reviewId?: string;
  employeeId?: any;
  reviewerId?: any;
  criteriaName?: string;

  candidateId?: string;
  candidateName?: string;
  candidateEmail?: string;
  jobProfile?: any;
  department?: string;
  rating?: number;
  recommendation?: string;
  interviewDate?: string;
}

interface ApiResponse {
  success: boolean;
  data: CommentWithSentiment[];
  count: number;
  breakdown?: {
    performance_review: number;
    recruitment: number;
    positive: number;
    negative: number;
    neutral: number;
  };
}

const sentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case "positive":
      return "#d4edda";
    case "negative":
      return "#f8d7da";
    case "neutral":
    default:
      return "#fefefe";
  }
};

const sourceLabel = (source: string) => {
  switch (source) {
    case "performance_review":
      return "📊 Оцінка";
    case "recruitment":
      return "👤 Рекрутмент";
    default:
      return source;
  }
};

const typeLabel = (type: string, criteriaName?: string) => {
  switch (type) {
    case "overallComment":
      return "Загальний коментар";
    case "rating_comment":
      return `Оцінка: ${criteriaName || ""}`;
    case "feedback":
      return "Зворотній зв'язок";
    case "interview_feedback":
      return "Фідбек з інтерв'ю";
    default:
      return type;
  }
};

export default function ReviewCommentsSentimentPage() {
  const [comments, setComments] = useState<CommentWithSentiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("");
  const [sentimentFilter, setSentimentFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [breakdown, setBreakdown] = useState<any>(null);

  useEffect(() => {
    apiClient
      .get<ApiResponse>("/reviews/comments/sentiment")
      .then((res) => {
        setComments(res.data.data);
        setBreakdown(res.data.breakdown);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Помилка завантаження");
        setLoading(false);
      });
  }, []);

  const filtered = comments.filter((c) =>
    (filter === "" || c.comment.toLowerCase().includes(filter.toLowerCase())) &&
    (sentimentFilter === "" || c.sentiment === sentimentFilter) &&
    (sourceFilter === "" || c.source === sourceFilter)
  );

  return (
    <div style={{ padding: 24 }}>
      <h2>🎯 Аналіз тональності коментарів (NLP)</h2>
      <p style={{ color: "#666", marginBottom: 20 }}>
        Коментарі з performance reviews та фідбеків при рекрутменті з автоматичною класифікацією емоційного тону
      </p>

      {breakdown && (
        <div style={{ 
          display: "flex", 
          gap: 16, 
          marginBottom: 20, 
          padding: 16, 
          background: "#f5f5f5", 
          borderRadius: 8 
        }}>
          <div>
            <strong>Всього:</strong> {breakdown.performance_review + breakdown.recruitment}
          </div>
          <div style={{ color: "#28a745" }}>
            <strong>✅ Позитивні:</strong> {breakdown.positive}
          </div>
          <div style={{ color: "#ffc107" }}>
            <strong>➖ Нейтральні:</strong> {breakdown.neutral}
          </div>
          <div style={{ color: "#dc3545" }}>
            <strong>❌ Негативні:</strong> {breakdown.negative}
          </div>
          <div style={{ marginLeft: "auto", color: "#007bff" }}>
            <strong>📊 Оцінок:</strong> {breakdown.performance_review}
          </div>
          <div style={{ color: "#6f42c1" }}>
            <strong>👤 Рекрутмент:</strong> {breakdown.recruitment}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="🔍 Пошук по тексту коментаря"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: 8, minWidth: 250, borderRadius: 4, border: "1px solid #ccc" }}
        />
        <select
          value={sentimentFilter}
          onChange={(e) => setSentimentFilter(e.target.value)}
          style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
        >
          <option value="">Всі тональності</option>
          <option value="positive">✅ Позитивні</option>
          <option value="neutral">➖ Нейтральні</option>
          <option value="negative">❌ Негативні</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
        >
          <option value="">Всі джерела</option>
          <option value="performance_review">📊 Performance Reviews</option>
          <option value="recruitment">👤 Рекрутмент</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>⏳ Завантаження...</div>
      ) : error ? (
        <div style={{ color: "red", padding: 20, background: "#fee", borderRadius: 8 }}>❌ {error}</div>
      ) : (
        <>
          <div style={{ marginBottom: 10, color: "#666" }}>
            Знайдено коментарів: <strong>{filtered.length}</strong>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f8f9fa" }}>
                  <th style={{ padding: 10, border: "1px solid #dee2e6", textAlign: "left" }}>Джерело</th>
                  <th style={{ padding: 10, border: "1px solid #dee2e6", textAlign: "left" }}>Тип</th>
                  <th style={{ padding: 10, border: "1px solid #dee2e6", textAlign: "left", minWidth: 300 }}>Коментар</th>
                  <th style={{ padding: 10, border: "1px solid #dee2e6", textAlign: "left" }}>Тональність</th>
                  <th style={{ padding: 10, border: "1px solid #dee2e6", textAlign: "left" }}>Бал</th>
                  <th style={{ padding: 10, border: "1px solid #dee2e6", textAlign: "left" }}>Контекст</th>
                  <th style={{ padding: 10, border: "1px solid #dee2e6", textAlign: "left" }}>Дата</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={i} style={{ background: sentimentColor(c.sentiment) }}>
                    <td style={{ padding: 10, border: "1px solid #dee2e6" }}>
                      {sourceLabel(c.source)}
                    </td>
                    <td style={{ padding: 10, border: "1px solid #dee2e6", fontSize: 12 }}>
                      {typeLabel(c.type, c.criteriaName)}
                    </td>
                    <td style={{ padding: 10, border: "1px solid #dee2e6" }}>
                      {c.comment}
                    </td>
                    <td style={{ 
                      padding: 10, 
                      border: "1px solid #dee2e6", 
                      textTransform: "capitalize",
                      fontWeight: "bold"
                    }}>
                      {c.sentiment === "positive" && "✅ Позитивний"}
                      {c.sentiment === "neutral" && "➖ Нейтральний"}
                      {c.sentiment === "negative" && "❌ Негативний"}
                    </td>
                    <td style={{ padding: 10, border: "1px solid #dee2e6", textAlign: "center" }}>
                      {c.sentimentScore > 0 ? `+${c.sentimentScore}` : c.sentimentScore}
                    </td>
                    <td style={{ padding: 10, border: "1px solid #dee2e6", fontSize: 12 }}>
                      {c.source === "recruitment" ? (
                        <>
                          <div><strong>{c.candidateName}</strong></div>
                          <div style={{ color: "#666" }}>{c.department}</div>
                          {c.rating && <div>⭐ {c.rating}/5</div>}
                          {c.recommendation && (
                            <div style={{ fontSize: 11, color: "#666" }}>
                              {c.recommendation.replace(/_/g, " ")}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {c.employeeId?.personalInfo?.fullName && (
                            <div>{c.employeeId.personalInfo.fullName}</div>
                          )}
                          {c.employeeId?.jobInfo?.department && (
                            <div style={{ color: "#666", fontSize: 11 }}>
                              {c.employeeId.jobInfo.department}
                            </div>
                          )}
                        </>
                      )}
                    </td>
                    <td style={{ padding: 10, border: "1px solid #dee2e6", fontSize: 12, whiteSpace: "nowrap" }}>
                      {new Date(c.createdAt).toLocaleDateString("uk-UA")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
