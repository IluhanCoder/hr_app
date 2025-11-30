import React, { useEffect, useMemo, useState } from "react";
import apiClient from "../services/api";
import { toast } from "react-toastify";

interface Point {
  id?: string;
  name: string;
  email?: string;
  department?: string;
  jobTitle?: string;
  performance: number;
  potential: number;
}

const cellLabel = (p: number, t: number) => `E${p}/P${t}`;

const PerformancePotentialMatrix: React.FC = () => {
  const [points, setPoints] = useState<Point[]>([]);
  const [department, setDepartment] = useState<string>("");
  const [jobTitle, setJobTitle] = useState<string>("");
  const [onlyActive, setOnlyActive] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [jobTitles, setJobTitles] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/analytics/performance-potential", {
        params: {
          department: department || undefined,
          jobTitle: jobTitle || undefined,
          onlyActive,
        },
      });
      setPoints(res.data.points || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Помилка завантаження");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await apiClient.get("/analytics/options", { params: { fields: "department,jobTitle" } });
        setDepartments(res.data.options?.department || []);
        setJobTitles(res.data.options?.jobTitle || []);
      } catch (err: any) {

        console.warn("Failed to load options", err?.message);
      }
    };
    fetchOptions();
    fetchData();

  }, []);

  const grid = useMemo(() => {
    const map: Record<string, Point[]> = {};
    for (let e = 1; e <= 5; e++) {
      for (let p = 1; p <= 5; p++) {
        map[cellLabel(e, p)] = [];
      }
    }
    for (const pt of points) {
      map[cellLabel(pt.performance, pt.potential)].push(pt);
    }
    return map;
  }, [points]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Матриця Ефективність vs Потенціал</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Оновлення..." : "Оновити"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="flex flex-col">
            <label className="text-gray-500 mb-1">Департамент</label>
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className="border rounded px-3 py-2 text-sm">
              <option value="">Всі</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-gray-500 mb-1">Посада</label>
            <select value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="border rounded px-3 py-2 text-sm">
              <option value="">Всі</option>
              {jobTitles.map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input id="onlyActive" type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
            <label htmlFor="onlyActive" className="text-gray-700">Лише активні</label>
          </div>
          <div className="flex flex-col justify-end">
            <button onClick={fetchData} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700">Застосувати</button>
          </div>
        </div>
      </div>

      {}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, rowIdx) => (
            <React.Fragment key={rowIdx}>
              {Array.from({ length: 5 }).map((__, colIdx) => {
                const perf = rowIdx + 1;
                const pot = colIdx + 1;
                const key = cellLabel(perf, pot);
                const items = grid[key] || [];
                return (
                  <div key={key} className="border rounded-lg p-2 h-32 overflow-auto hover:shadow-sm">
                    <div className="flex justify-between items-center mb-2 text-xs text-gray-600">
                      <span className="font-semibold">E{perf} / P{pot}</span>
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">{items.length}</span>
                    </div>
                    <div className="space-y-1">
                      {items.map((it) => (
                        <div key={it.id || `${it.email}-${it.performance}-${it.potential}`} className="text-xs">
                          <span className="font-medium text-gray-800">{it.name || "—"}</span>
                          <span className="text-gray-500"> · {it.jobTitle}</span>
                          <div className="text-[10px] text-gray-400">{it.department}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PerformancePotentialMatrix;
