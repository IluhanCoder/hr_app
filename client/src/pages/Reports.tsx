

import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useStores } from "../stores/RootStore";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/api";

interface ReportFilter {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "gt" | "gte" | "lt" | "lte" | "in";
  value: any;
}

interface ReportAggregation {
  function: "count" | "sum" | "avg" | "min" | "max";
  field: string;
  alias: string;
}

interface SavedReport {
  _id: string;
  name: string;
  description?: string;
  entityType: string;
  fields: string[];
  filters: ReportFilter[];
  lastRun?: string;
  runCount: number;
  createdBy: {
    personalInfo: {
      firstName: string;
      lastName: string;
    };
  };
}

const Reports: React.FC = observer(() => {
  const { authStore } = useStores();
  const navigate = useNavigate();

  const [entityType, setEntityType] = useState<string>("users");
  const [availableFields, setAvailableFields] = useState<Record<string, string>>({});
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [sortField, setSortField] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [aggregations, setAggregations] = useState<ReportAggregation[]>([]);

  const [reportData, setReportData] = useState<any[]>([]);
  const [aggregationResults, setAggregationResults] = useState<any>({});
  const [totalRows, setTotalRows] = useState(0);

  const [saveReportModal, setSaveReportModal] = useState(false);
  const [reportName, setReportName] = useState("");
  const [reportDescription, setReportDescription] = useState("");

  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    loadAvailableFields();
    loadSavedReports();
  }, [entityType]);

  const loadAvailableFields = async () => {
    try {
      const response = await apiClient.get(`/reports/fields/${entityType}`);
      setAvailableFields(response.data.data);
    } catch (err) {
    }
  };

  const loadSavedReports = async () => {
    try {
      const response = await apiClient.get("/reports");
      setSavedReports(response.data.data);
    } catch (err) {
    }
  };

  const generateReport = async (save: boolean = false) => {
    setError("");
    setSuccess("");

    if (selectedFields.length === 0) {
      setError("Виберіть хоча б одне поле");
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        entityType,
        fields: selectedFields,
        filters,
        aggregations,
        saveReport: save,
      };

      if (sortField) {
        payload.sort = { field: sortField, order: sortOrder };
      }

      if (save) {
        payload.reportName = reportName;
        payload.reportDescription = reportDescription;
      }

      const response = await apiClient.post("/reports/generate", payload);

      setReportData(response.data.data.rows);
      setAggregationResults(response.data.data.aggregations);
      setTotalRows(response.data.data.totalRows);

      if (save) {
        setSuccess("Звіт згенеровано та збережено!");
        setSaveReportModal(false);
        loadSavedReports();
      } else {
        setSuccess("Звіт згенеровано!");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Помилка при генерації звіту");
    } finally {
      setLoading(false);
    }
  };

  const runSavedReport = async (reportId: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.post(`/reports/${reportId}/run`);

      setReportData(response.data.data.rows);
      setAggregationResults(response.data.data.aggregations);
      setTotalRows(response.data.data.totalRows);
      setSuccess("Звіт виконано!");
    } catch (err: any) {
      setError(err.response?.data?.message || "Помилка при виконанні звіту");
    } finally {
      setLoading(false);
    }
  };

  const addFilter = () => {
    setFilters([
      ...filters,
      { field: Object.keys(availableFields)[0] || "", operator: "equals", value: "" },
    ]);
  };

  const updateFilter = (index: number, key: keyof ReportFilter, value: any) => {
    const updated = [...filters];
    updated[index] = { ...updated[index], [key]: value };
    setFilters(updated);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const addAggregation = () => {
    setAggregations([
      ...aggregations,
      { function: "count", field: selectedFields[0] || "", alias: "result" },
    ]);
  };

  const updateAggregation = (index: number, key: keyof ReportAggregation, value: any) => {
    const updated = [...aggregations];
    updated[index] = { ...updated[index], [key]: value };
    setAggregations(updated);
  };

  const removeAggregation = (index: number) => {
    setAggregations(aggregations.filter((_, i) => i !== index));
  };

  const exportToCSV = () => {
    if (reportData.length === 0) {
      setError("Немає даних для експорту");
      return;
    }

    const headers = selectedFields.join(",");
    const rows = reportData.map((row) =>
      selectedFields.map((field) => {
        const value = row[field];

        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || "";
      }).join(",")
    );

    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    setSuccess("Звіт експортовано в CSV!");
  };

  const exportToJSON = () => {
    if (reportData.length === 0) {
      setError("Немає даних для експорту");
      return;
    }

    const json = JSON.stringify({
      metadata: {
        entityType,
        fields: selectedFields,
        filters,
        totalRows,
        generatedAt: new Date().toISOString(),
      },
      data: reportData,
      aggregations: aggregationResults,
    }, null, 2);

    const blob = new Blob([json], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${new Date().toISOString().split("T")[0]}.json`;
    a.click();

    setSuccess("Звіт експортовано в JSON!");
  };

  const migrateSalaryInfo = async () => {
    if (!window.confirm("Ви впевнені, що хочете додати salaryInfo всім користувачам без зарплати?")) {
      return;
    }

    setMigrating(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiClient.post("/migrate/salary-info");
      setSuccess(response.data.message);
    } catch (err: any) {
      setError(err.response?.data?.message || "Помилка при міграції");
    } finally {
      setMigrating(false);
    }
  };

  if (authStore.user?.role !== "hr_manager" && authStore.user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Доступ заборонено</h2>
          <p className="text-gray-600">Тільки HR-менеджери мають доступ до звітів</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-5 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">📊 Система Звітності</h1>
              <p className="text-sm opacity-90 mt-1">Конструктор звітів з фільтрацією та агрегацією</p>
            </div>
            <div className="flex gap-3">
              {authStore.user?.role === "admin" && (
                <button
                  onClick={migrateSalaryInfo}
                  disabled={migrating}
                  className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
                >
                  {migrating ? "Міграція..." : "🔧 Міграція Зарплат"}
                </button>
              )}
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-white/20 hover:bg-white/30 px-5 py-2 rounded-lg font-semibold transition-all"
              >
                ← Назад
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 py-10">
        {}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-5">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-6">Конструктор Звіту</h2>

              {}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Тип даних *
                </label>
                <select
                  value={entityType}
                  onChange={(e) => {
                    setEntityType(e.target.value);
                    setSelectedFields([]);
                    setFilters([]);
                    setAggregations([]);
                  }}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                >
                  <option value="users">👥 Співробітники</option>
                  <option value="candidates">🎯 Кандидати</option>
                  <option value="goals">📊 Цілі (Goals)</option>
                  <option value="reviews">⭐ Оцінки (Reviews)</option>
                </select>
              </div>

              {}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Поля для відображення *
                </label>
                <div className="border-2 border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                  {Object.entries(availableFields).map(([field, label]) => (
                    <label key={field} className="flex items-center mb-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFields([...selectedFields, field]);
                          } else {
                            setSelectedFields(selectedFields.filter((f) => f !== field));
                          }
                        }}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Вибрано: {selectedFields.length} полів
                </div>
              </div>

              {}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Фільтри
                  </label>
                  <button
                    onClick={addFilter}
                    className="text-sm px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    + Додати фільтр
                  </button>
                </div>

                {filters.map((filter, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <select
                      value={filter.field}
                      onChange={(e) => updateFilter(index, "field", e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      {Object.entries(availableFields).map(([field, label]) => (
                        <option key={field} value={field}>{label}</option>
                      ))}
                    </select>

                    <select
                      value={filter.operator}
                      onChange={(e) => updateFilter(index, "operator", e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="equals">=</option>
                      <option value="not_equals">≠</option>
                      <option value="contains">містить</option>
                      <option value="gt">&gt;</option>
                      <option value="gte">≥</option>
                      <option value="lt">&lt;</option>
                      <option value="lte">≤</option>
                    </select>

                    <input
                      type="text"
                      value={filter.value}
                      onChange={(e) => updateFilter(index, "value", e.target.value)}
                      placeholder="Значення"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                    />

                    <button
                      onClick={() => removeFilter(index)}
                      className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Сортування
                </label>
                <div className="flex gap-2">
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value)}
                    className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg"
                  >
                    <option value="">Без сортування</option>
                    {Object.entries(availableFields).map(([field, label]) => (
                      <option key={field} value={field}>{label}</option>
                    ))}
                  </select>

                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                    className="px-3 py-2 border-2 border-gray-200 rounded-lg"
                  >
                    <option value="asc">↑ За зростанням</option>
                    <option value="desc">↓ За спаданням</option>
                  </select>
                </div>
              </div>

              {}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Агрегація (SUM, AVG, COUNT)
                  </label>
                  <button
                    onClick={addAggregation}
                    className="text-sm px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    + Додати агрегацію
                  </button>
                </div>

                {aggregations.map((agg, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <select
                      value={agg.function}
                      onChange={(e) => updateAggregation(index, "function", e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="count">COUNT</option>
                      <option value="sum">SUM</option>
                      <option value="avg">AVG</option>
                      <option value="min">MIN</option>
                      <option value="max">MAX</option>
                    </select>

                    <select
                      value={agg.field}
                      onChange={(e) => updateAggregation(index, "field", e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      {selectedFields.map((field) => (
                        <option key={field} value={field}>
                          {availableFields[field] || field}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={agg.alias}
                      onChange={(e) => updateAggregation(index, "alias", e.target.value)}
                      placeholder="Назва результату"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                    />

                    <button
                      onClick={() => removeAggregation(index)}
                      className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {}
              <div className="flex gap-3">
                <button
                  onClick={() => generateReport(false)}
                  disabled={loading || selectedFields.length === 0}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50"
                >
                  {loading ? "Генерація..." : "🚀 Згенерувати звіт"}
                </button>

                <button
                  onClick={() => setSaveReportModal(true)}
                  disabled={loading || selectedFields.length === 0}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold disabled:opacity-50"
                >
                  💾 Зберегти
                </button>
              </div>
            </div>
          </div>

          {}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Збережені Звіти</h2>

              {savedReports.length === 0 ? (
                <p className="text-gray-500 text-sm">Немає збережених звітів</p>
              ) : (
                <div className="space-y-3">
                  {savedReports.map((report) => (
                    <div
                      key={report._id}
                      className="border border-gray-200 rounded-lg p-3 hover:border-purple-300 transition-colors cursor-pointer"
                      onClick={() => runSavedReport(report._id)}
                    >
                      <div className="font-semibold text-sm text-gray-900">
                        {report.name}
                      </div>
                      {report.description && (
                        <div className="text-xs text-gray-600 mt-1">
                          {report.description}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        Виконано: {report.runCount} разів
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {}
        {reportData.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Результати ({totalRows} записів)</h2>
              
              <div className="flex gap-2">
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold"
                >
                  📥 Експорт CSV
                </button>
                <button
                  onClick={exportToJSON}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold"
                >
                  📥 Експорт JSON
                </button>
              </div>
            </div>

            {}
            {Object.keys(aggregationResults).length > 0 && (
              <div className="mb-4 p-4 bg-purple-50 rounded-lg">
                <div className="font-semibold text-sm text-gray-700 mb-2">Агрегація:</div>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(aggregationResults).map(([key, value]: [string, any]) => {

                    let formattedValue = value;
                    
                    if (value === null || value === undefined) {
                      formattedValue = "N/A";
                    } else if (typeof value === "number") {
                      formattedValue = value.toFixed(2);
                    } else if (typeof value === "string" && !isNaN(Date.parse(value))) {

                      formattedValue = new Date(value).toLocaleDateString("uk-UA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      });
                    } else {
                      formattedValue = value;
                    }
                    
                    return (
                      <div key={key} className="text-sm">
                        <span className="text-gray-600">{key}:</span>{" "}
                        <span className="font-bold text-purple-700">
                          {formattedValue}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {selectedFields.map((field) => (
                      <th key={field} className="px-4 py-3 text-left font-semibold text-gray-700">
                        {availableFields[field] || field}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {selectedFields.map((field) => (
                        <td key={field} className="px-4 py-3 text-gray-700">
                          {typeof row[field] === "object"
                            ? JSON.stringify(row[field])
                            : row[field] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {}
      {saveReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Зберегти Звіт</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Назва звіту *
                </label>
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Наприклад: Звіт по співробітниках IT"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Опис (опціонально)
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={3}
                  placeholder="Короткий опис звіту..."
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSaveReportModal(false)}
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Скасувати
              </button>
              <button
                onClick={() => generateReport(true)}
                disabled={!reportName || loading}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? "Збереження..." : "Зберегти"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default Reports;
