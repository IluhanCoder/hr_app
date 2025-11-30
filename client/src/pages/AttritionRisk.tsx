import React, { useEffect, useState, useMemo } from "react";
import { apiClient } from "../services/api";

interface RiskHistoryPoint {
  riskScore: number;
  calculatedAt: string;
}

interface AttritionUser {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  jobTitle: string;
  role: string;
  status: string;
  riskScore: number | null;
  isAtRisk: boolean;
  riskHistory: RiskHistoryPoint[];
}

interface TopResponse {
  success: boolean;
  count: number;
  data: AttritionUser[];
}

const Sparkline: React.FC<{ history: RiskHistoryPoint[]; width?: number; height?: number }> = ({ history, width = 110, height = 32 }) => {
  if (!history || history.length === 0) {
    return <span style={{ color: "#999", fontSize: 12 }}>немає даних</span>;
  }
  if (history.length === 1) {
    return <span style={{ color: "#666", fontSize: 12 }}>{history[0].riskScore}</span>;
  }
  const scores = history.map(h => h.riskScore);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;
  const points = history.map((h, i) => {
    const x = (i / (history.length - 1)) * (width - 2) + 1;
    const y = height - 4 - ((h.riskScore - min) / range) * (height - 8);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const path = `M${points[0]} L${points.slice(1).join(" ")}`;
  const last = history[history.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      <polyline points={points.join(" ")} fill="none" stroke="#007bff" strokeWidth={1.6} strokeLinecap="round" />
      <path d={path} fill="none" stroke="#007bff" strokeWidth={1.6} />
      <circle cx={points[0].split(",")[0]} cy={points[0].split(",")[1]} r={2} fill="#007bff" />
      <circle cx={points[points.length - 1].split(",")[0]} cy={points[points.length - 1].split(",")[1]} r={2.8} fill={last.riskScore >= 70 ? "#dc3545" : "#28a745"} />
    </svg>
  );
};

const riskColor = (score: number | null, isAtRisk: boolean) => {
  if (score == null) return "#e9ecef";
  if (isAtRisk) return "#dc3545";
  if (score >= 50) return "#ffc107";
  return "#28a745";
};

export default function AttritionRisk() {
  const [data, setData] = useState<AttritionUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(15);
  const [onlyAtRisk, setOnlyAtRisk] = useState(false);
  const [search, setSearch] = useState("");
  const [recalcLoading, setRecalcLoading] = useState(false);

  const load = () => {
    setLoading(true);
    apiClient
      .get<TopResponse>(`/analytics/attrition/top?limit=${limit}`)
      .then(res => {
        setData(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.message || "Помилка завантаження");
        setLoading(false);
      });
  };

  useEffect(() => {
    load();

  }, [limit]);

  const handleRecalculate = () => {
    setRecalcLoading(true);
    apiClient
      .post(`/analytics/attrition/recalculate`)
      .then(() => {
        load();
      })
      .finally(() => setRecalcLoading(false));
  };

  const filtered = useMemo(() => {
    return data.filter(u => {
      if (onlyAtRisk && !u.isAtRisk) return false;
      if (search) {
        const s = search.toLowerCase();
        const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
        if (!fullName.includes(s) && !u.department.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [data, onlyAtRisk, search]);

  return (
    <div style={{ padding: 24 }}>
      <h2>🔥 Ризик звільнення (Attrition Risk)</h2>
      <p style={{ color: "#666", marginBottom: 16 }}>
        Rule-based скоринг з історією зміни ризику. Натисни "Перерахувати" щоб оновити дані.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <button
          onClick={handleRecalculate}
          disabled={recalcLoading}
          style={{
            background: "#007bff",
            color: "#fff",
            padding: "8px 14px",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {recalcLoading ? "⏳ Перерахунок..." : "🔄 Перерахувати"}
        </button>
        <select
          value={limit}
          onChange={e => setLimit(Number(e.target.value))}
          style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
        >
          {[10,15,20,30,50].map(n => (
            <option key={n} value={n}>Топ {n}</option>
          ))}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={onlyAtRisk} onChange={e => setOnlyAtRisk(e.target.checked)} /> Тільки високий ризик
        </label>
        <input
          type="text"
          placeholder="🔍 Пошук (ім'я або департамент)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: 8, minWidth: 240, borderRadius: 4, border: "1px solid #ccc" }}
        />
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center" }}>⏳ Завантаження...</div>
      ) : error ? (
        <div style={{ color: "red", padding: 20, background: "#fee", borderRadius: 8 }}>❌ {error}</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f8f9fa" }}>
                <th style={th}>Співробітник</th>
                <th style={th}>Департамент</th>
                <th style={th}>Посада</th>
                <th style={th}>Ризик</th>
                <th style={th}>Тренд</th>
                <th style={th}>Останній</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} style={{ background: "#fff" }}>
                  <td style={td}>
                    <strong>{u.firstName} {u.lastName}</strong>
                    <div style={{ fontSize: 11, color: "#666" }}>{u.role}</div>
                  </td>
                  <td style={td}>{u.department}</td>
                  <td style={td}>{u.jobTitle}</td>
                  <td style={{ ...td, fontWeight: "bold", color: "#fff", background: riskColor(u.riskScore, u.isAtRisk) }}>
                    {u.riskScore ?? "-"}
                    {u.isAtRisk && <span style={{ marginLeft: 6, fontSize: 11 }}>⚠️</span>}
                  </td>
                  <td style={{ ...td }}>
                    <Sparkline history={u.riskHistory} />
                  </td>
                  <td style={td}>
                    {u.riskHistory.length > 0 && (
                      <div style={{ fontSize: 11, color: "#555" }}>
                        {new Date(u.riskHistory[u.riskHistory.length - 1].calculatedAt).toLocaleDateString("uk-UA")}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: "#666" }}>Немає співробітників за вибраними фільтрами.</div>
          )}
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = { padding: 10, border: "1px solid #dee2e6", textAlign: "left", fontWeight: 600 };
const td: React.CSSProperties = { padding: 10, border: "1px solid #dee2e6", verticalAlign: "top" };
