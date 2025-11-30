import React, { useEffect, useState } from "react";
import apiClient from "../services/api";
import { toast } from "react-toastify";

interface WarningItem {
  id?: string;
  name: string;
  email?: string;
  jobTitle: string;
  department: string;
  baseSalary: number;
  avgSalary: number;
  deviationPercent: number;
  triggeredBy: "job" | "department";
  details: { type: "job" | "department"; avgSalary: number; deviationPercent: number }[];
}

const SalaryWarnings: React.FC = () => {
  const [threshold, setThreshold] = useState<number>(20);
  const [scope, setScope] = useState<string>("both");
  const [loading, setLoading] = useState(false);
  const [warnings, setWarnings] = useState<WarningItem[]>([]);
  const [count, setCount] = useState<number>(0);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [sortKey, setSortKey] = useState<string>("deviationPercent");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/analytics/salary-warnings", {
        params: { threshold, scope },
      });
      setWarnings(res.data.warnings || []);
      setCount(res.data.count || 0);
      setLastFetched(new Date());
      toast.success("Попередження оновлено");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Помилка завантаження");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

  }, []);

  const sorted = [...warnings].sort((a, b) => {
    const av = (a as any)[sortKey];
    const bv = (b as any)[sortKey];
    if (av === bv) return 0;
    return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const deviationTone = (p: number) => {
    if (p >= 50) return "bg-red-100 text-red-700";
    if (p >= 30) return "bg-orange-100 text-orange-700";
    if (p >= 20) return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Попередження про аномалії зарплат</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Завантаження..." : "Оновити"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="flex flex-col">
            <label className="text-gray-500 mb-1">Поріг (%)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-gray-500 mb-1">Скоуп</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="both">Посада + Відділ</option>
              <option value="job">Посада</option>
              <option value="department">Відділ</option>
            </select>
          </div>
          <div className="flex flex-col justify-end">
            <button
              onClick={fetchData}
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              Застосувати
            </button>
          </div>
          <div className="flex flex-col text-sm">
            <span className="text-gray-500">Знайдено відхилень</span>
            <span className="font-semibold text-gray-900">{count}</span>
            {lastFetched && (
              <span className="text-xs text-gray-400 mt-1">{lastFetched.toLocaleTimeString()}</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Співробітник</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => toggleSort("jobTitle")}>Посада</th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => toggleSort("department")}>Відділ</th>
                <th className="px-4 py-2 text-right cursor-pointer" onClick={() => toggleSort("baseSalary")}>Оклад</th>
                <th className="px-4 py-2 text-right">Середній</th>
                <th className="px-4 py-2 text-center cursor-pointer" onClick={() => toggleSort("deviationPercent")}>Відхилення % {sortKey === "deviationPercent" && (sortDir === "asc" ? "▲" : "▼")}</th>
                <th className="px-4 py-2 text-center">Тригер</th>
                <th className="px-4 py-2">Деталі</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">Немає попереджень для поточних параметрів.</td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">Завантаження...</td>
                </tr>
              )}
              {sorted.map((w) => (
                <tr key={w.id || `${w.email}-${w.jobTitle}-${w.department}`}
                    className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">{w.name || "—"}</td>
                  <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{w.email || "—"}</td>
                  <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{w.jobTitle}</td>
                  <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{w.department}</td>
                  <td className="px-4 py-2 text-right font-medium">{w.baseSalary.toLocaleString()} UAH</td>
                  <td className="px-4 py-2 text-right text-gray-600">{w.avgSalary.toLocaleString()} UAH</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${deviationTone(w.deviationPercent)}`}>{w.deviationPercent}%</span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-medium uppercase">{w.triggeredBy}</span>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-600 max-w-[240px]">
                    {w.details.map((d, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="uppercase">{d.type}</span>
                        <span>{d.avgSalary.toLocaleString()} · {d.deviationPercent}%</span>
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalaryWarnings;
