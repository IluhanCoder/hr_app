import React, { useState } from "react";
import apiClient from "../services/api";
import { toast } from "react-toastify";

const BarChart: React.FC<{
  data: { label: string; value: number; color?: string; extra?: string }[];
  height?: number;
  valueSuffix?: string;
}> = ({ data, height = 180, valueSuffix = "" }) => {
  const max = Math.max(...data.map((d) => d.value), 0) || 1;
  return (
    <div className="flex items-end gap-4 w-full overflow-x-auto" style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-col items-center justify-end min-w-[60px]">
          <div
            className="w-10 rounded-t-md transition-all"
            style={{
              height: `${(d.value / max) * (height - 40)}px`,
              background: d.color || "linear-gradient(to top,#2563eb,#3b82f6)",
            }}
            title={`${d.label}: ${d.value}${valueSuffix}`}
          />
          <div className="text-xs mt-1 font-medium text-center whitespace-nowrap">
            {d.label}
          </div>
          <div className="text-[10px] text-gray-500">{d.value}{valueSuffix}</div>
          {d.extra && <div className="text-[10px] text-indigo-600 mt-0.5">{d.extra}</div>}
        </div>
      ))}
    </div>
  );
};

const HorizontalBars: React.FC<{
  data: { label: string; value: number; color?: string; count?: number }[];
  valueSuffix?: string;
}> = ({ data, valueSuffix = "" }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex flex-col">
          <div className="flex justify-between text-xs mb-0.5">
            <span className="font-medium">{d.label}</span>
            <span>
              {d.value}{valueSuffix}
              {d.count != null && (
                <span className="text-gray-400"> · {d.count}</span>
              )}
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded">
            <div
              className="h-3 rounded transition-all"
              style={{
                width: `${(d.value / max) * 100}%`,
                background: d.color || "linear-gradient(to right,#10b981,#34d399)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className || ""}`}> 
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
    </div>
    {children}
  </div>
);

const Badge: React.FC<{ label: string; tone?: "gray" | "green" | "yellow" | "red" | "blue" }>= ({ label, tone="gray" }) => {
  const colors: Record<string,string> = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${colors[tone]}`}>{label}</span>;
};

const SalaryBiasAnalysis: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [showRaw, setShowRaw] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    setReport(null);
    try {
      const response = await apiClient.get("/analytics/salary-bias");
      setReport(response.data.data);
      toast.success("Звіт згенеровано!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Помилка при отриманні звіту");
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    if (!report) return toast.warn("Спершу згенеруйте звіт");
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    downloadFile(JSON.stringify(report, null, 2), `salary-bias-${ts}.json`, "application/json");
  };

  const escapeCSV = (v: any) => {
    if (v == null) return "";
    const s = String(v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };

  const exportCSV = () => {
    if (!report) return toast.warn("Спершу згенеруйте звіт");

    const rows: string[] = [];
    const push = (arr: any[]) => rows.push(arr.map(escapeCSV).join(","));

    push(["Section","Metric","Value","Extra"]);

    push(["summary","totalEmployees", report.summary?.totalEmployees, ""]);
    push(["summary","averageSalary", Math.round(report.summary?.averageSalary || 0), "UAH"]);
    push(["summary","salaryStdDev", Math.round(report.summary?.salaryStdDev || 0), ""]);
    push(["summary","analysisDate", report.summary?.analysisDate, ""]);

    const g = report.biasAnalysis?.gender;
    if (g) {
      push(["gender","maleAvgSalary", Math.round(g.maleAvgSalary || 0), `n=${g.maleCount}`]);
      push(["gender","femaleAvgSalary", Math.round(g.femaleAvgSalary || 0), `n=${g.femaleCount}`]);
      push(["gender","difference", g.difference, "UAH"]);
      push(["gender","percentageDiff", g.percentageDiff, "%"]);
      push(["gender","tStatistic", g.tStatistic, ""]);
      push(["gender","pValue", g.pValue, ""]);
      push(["gender","severity", g.severity, ""]);
      push(["gender","isStatisticallySignificant", g.isStatisticallySignificant, ""]);
    }

    const dpts = report.biasAnalysis?.department?.departments || [];
    for (const d of dpts) {
      push(["department","avgSalary", Math.round(d.avgSalary || 0), `name=${d.department};n=${d.count}`]);
    }
    if (report.biasAnalysis?.department?.significantDifferences) {
      push(["department","significantDifferences", true, ""]);
    }

    const edu = report.biasAnalysis?.education?.groups || [];
    for (const e of edu) {
      push(["education","avgSalary", Math.round(e.avgSalary || 0), `level=${e.level};n=${e.count}`]);
    }
    if (report.biasAnalysis?.education?.correlation != null) {
      push(["education","correlation", report.biasAnalysis.education.correlation, ""]);
    }

    const edf = report.biasAnalysis?.educationField?.fields || [];
    for (const f of edf) {
      push(["educationField","avgSalary", Math.round(f.avgSalary || 0), `field=${f.field};n=${f.count}`]);
    }
    if (report.biasAnalysis?.educationField?.diversity != null) {
      push(["educationField","diversity", report.biasAnalysis.educationField.diversity, ""]);
    }
    if (report.biasAnalysis?.educationField?.significantDifferences) {
      push(["educationField","significantDifferences", true, ""]);
    }

    const eth = report.biasAnalysis?.ethnicity?.groups || [];
    for (const e of eth) {
      push(["ethnicity","avgSalary", Math.round(e.avgSalary || 0), `ethnicity=${e.ethnicity};n=${e.count}`]);
    }
    if (report.biasAnalysis?.ethnicity?.diversity != null) {
      push(["ethnicity","diversity", report.biasAnalysis.ethnicity.diversity, ""]);
    }

    const csv = rows.join("\n");
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    downloadFile(csv, `salary-bias-${ts}.csv`, "text/csv;charset=utf-8");
  };

  const genderChartData = report
    ? [
        {
          label: "Чоловіки",
          value: report.biasAnalysis.gender.maleAvgSalary,
          color: "linear-gradient(to top,#4f46e5,#6366f1)",
          extra: `n=${report.biasAnalysis.gender.maleCount}`,
        },
        {
          label: "Жінки",
          value: report.biasAnalysis.gender.femaleAvgSalary,
          color: "linear-gradient(to top,#ec4899,#f472b6)",
          extra: `n=${report.biasAnalysis.gender.femaleCount}`,
        },
      ]
    : [];

  const educationChartData = report
    ? report.biasAnalysis.education.groups.map((g: any) => ({
        label: g.level,
        value: g.avgSalary,
        count: g.count,
        color: "linear-gradient(to right,#0ea5e9,#38bdf8)",
      }))
    : [];

  const educationFieldChartData = report
    ? (report.biasAnalysis.educationField?.fields || []).map((f: any) => ({
        label: f.field,
        value: f.avgSalary,
        count: f.count,
        color: "linear-gradient(to right,#14b8a6,#2dd4bf)",
      }))
    : [];

  const deptChartData = report
    ? report.biasAnalysis.department.departments.map((d: any) => ({
        label: d.department,
        value: d.avgSalary,
        count: d.count,
        color: "linear-gradient(to right,#9333ea,#a855f7)",
      }))
    : [];

  const ethnicityChartData = report
    ? report.biasAnalysis.ethnicity.groups.map((e: any) => ({
        label: e.ethnicity,
        value: e.avgSalary,
        count: e.count,
        color: "linear-gradient(to right,#f59e0b,#fbbf24)",
      }))
    : [];

  const severityTone = (sev?: string) => {
    switch (sev) {
      case "critical":
        return "red";
      case "high":
        return "red";
      case "moderate":
        return "yellow";
      case "low":
        return "green";
      default:
        return "gray";
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Аналіз упереджень у системі оплати праці</h1>
        <div className="flex gap-3">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-sm"
          >
            {loading ? "Аналіз..." : "Запустити аналіз"}
          </button>
          {report && (
            <>
              <button
                onClick={exportCSV}
                className="px-5 py-2.5 rounded-lg font-semibold bg-green-600 hover:bg-green-700 text-white shadow-sm"
              >
                Експорт CSV
              </button>
              <button
                onClick={exportJSON}
                className="px-5 py-2.5 rounded-lg font-semibold bg-gray-800 hover:bg-black text-white shadow-sm"
              >
                Експорт JSON
              </button>
            </>
          )}
          {report && (
            <button
              onClick={() => setShowRaw((v) => !v)}
              className="px-5 py-2.5 rounded-lg font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-sm"
            >
              {showRaw ? "Сховати JSON" : "Показати JSON"}
            </button>
          )}
          <button
            onClick={() => window.location.href = "/dashboard"}
            className="px-5 py-2.5 rounded-lg font-semibold bg-indigo-100 hover:bg-indigo-200 text-indigo-700 shadow-sm"
          >
            ← Назад
          </button>
        </div>
      </div>

      {!report && !loading && (
        <p className="text-gray-500 text-sm">Натисніть кнопку вище щоб згенерувати звіт.</p>
      )}

      {report && (
        <div className="space-y-8">
          <Card title="Загальна статистика">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex flex-col"><span className="text-gray-500">Співробітників</span><span className="font-semibold text-gray-900">{report.summary.totalEmployees}</span></div>
              <div className="flex flex-col"><span className="text-gray-500">Середня ЗП</span><span className="font-semibold text-gray-900">{Math.round(report.summary.averageSalary)} UAH</span></div>
              <div className="flex flex-col"><span className="text-gray-500">Std.Dev</span><span className="font-semibold text-gray-900">{Math.round(report.summary.salaryStdDev)}</span></div>
              <div className="flex flex-col"><span className="text-gray-500">Дата</span><span className="font-semibold text-gray-900">{new Date(report.summary.analysisDate).toLocaleString()}</span></div>
            </div>
          </Card>

          <Card title="Гендерний розрив">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <BarChart data={genderChartData} valueSuffix=" UAH" />
              </div>
              <div className="flex-1 space-y-2 text-sm">
                <div>
                  Середня різниця: <span className="font-semibold">{report.biasAnalysis.gender.difference} UAH</span> ({report.biasAnalysis.gender.percentageDiff}%)
                  {" "}
                  <Badge label={report.biasAnalysis.gender.severity} tone={severityTone(report.biasAnalysis.gender.severity)} />
                </div>
                <div>t-статистика: {report.biasAnalysis.gender.tStatistic} / p-value: {report.biasAnalysis.gender.pValue}</div>
                <div>Статистично значуще: {report.biasAnalysis.gender.isStatisticallySignificant ? <Badge label="так" tone="red" /> : <Badge label="ні" tone="green" />}</div>
                <div className="text-xs text-gray-500">"detected" означає наявність істотного розриву на користь чоловіків.</div>
              </div>
            </div>
          </Card>

          <Card title="Освіта (рівень) і середня зарплата">
            <HorizontalBars data={educationChartData} valueSuffix=" UAH" />
            <div className="mt-3 text-xs text-gray-500">Кореляція освіта ↔ зарплата: {report.biasAnalysis.education.correlation == null ? 'N/A' : `${(report.biasAnalysis.education.correlation * 100).toFixed(1)}%`}</div>
          </Card>

          <Card title="Спеціалізація освіти (education)">
            {educationFieldChartData.length === 0 ? (
              <div className="text-xs text-gray-500">Немає даних по спеціалізаціях.</div>
            ) : (
              <HorizontalBars data={educationFieldChartData} valueSuffix=" UAH" />
            )}
            <div className="mt-3 text-xs text-gray-500">Напрямів: {report.biasAnalysis.educationField?.diversity || 0}</div>
            {report.biasAnalysis.educationField?.significantDifferences && (
              <div className="mt-2 text-xs text-red-600">Є суттєві відмінності між спеціалізаціями.</div>
            )}
          </Card>

            <Card title="Департаменти">
              <HorizontalBars data={deptChartData} valueSuffix=" UAH" />
              {report.biasAnalysis.department.significantDifferences && (
                <div className="mt-2 text-xs text-red-600">Виявлено значні відмінності між департаментами.</div>
              )}
            </Card>

          <Card title="Етнічні групи">
            <HorizontalBars data={ethnicityChartData} valueSuffix=" UAH" />
            <div className="mt-3 text-xs text-gray-500">Груп: {report.biasAnalysis.ethnicity.diversity}</div>
          </Card>

          <Card title="Рекомендації">
            <ul className="space-y-2 text-sm">
              {report.recommendations.map((rec: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-500">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </Card>

          {showRaw && (
            <Card title="Raw JSON" className="text-xs">
              <pre className="max-h-[400px] overflow-auto bg-gray-50 p-3 rounded border border-gray-100">{JSON.stringify(report, null, 2)}</pre>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default SalaryBiasAnalysis;
