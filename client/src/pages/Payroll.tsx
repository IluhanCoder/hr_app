import React, { useState } from "react";
import apiClient from "../services/api";
import { toast } from "react-toastify";

const Payroll: React.FC = () => {
  const [period, setPeriod] = useState<string>("");
  const [data, setData] = useState<any>(null);
  const [teamData, setTeamData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const calc = async () => {
    if (!period) return toast.warn("Вкажіть період YYYY-MM");
    setLoading(true);
    try {
      const res = await apiClient.post("/payroll/calculate", {}, { params: { period } });
      setData(res.data.payroll);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Помилка розрахунку");
    } finally {
      setLoading(false);
    }
  };

  const calcTeam = async () => {
    if (!period) return toast.warn("Вкажіть період YYYY-MM");
    setLoading(true);
    try {
      const res = await apiClient.post("/payroll/calculate-team", {}, { params: { period } });
      setTeamData(res.data.payrolls || []);
      setData(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Помилка розрахунку");
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const content = teamData.length > 0 ? teamData : data;
    if (!content) return;
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    downloadFile(JSON.stringify(content, null, 2), `payroll-${ts}.json`, "application/json");
  };

  const exportCSV = () => {
    if (teamData.length > 0) {
      const rows: string[] = [];
      const e = (v: any) => {
        const s = String(v ?? "");
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      };
      rows.push(["Name", "Department", "Job Title", "Regular Hours", "Overtime Hours", "Holiday Hours", "Total Hours", "Gross", "Taxes", "Net"].map(e).join(","));
      for (const p of teamData) {
        rows.push([p.user?.name, p.user?.department, p.user?.jobTitle, p.hours?.regularHours, p.hours?.overtimeHours, p.hours?.holidayHours, p.hours?.total, p.gross, p.taxes, p.net].map(e).join(","));
      }
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      downloadFile(rows.join("\n"), `payroll-team-${ts}.csv`, "text/csv;charset=utf-8");
      return;
    }
    if (!data) return;
    const rows: string[] = [];
    const e = (v: any) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const push = (arr: any[]) => rows.push(arr.map(e).join(","));
    push(["period", data.period]);
    push(["user", data.user?.name, data.user?.department, data.user?.jobTitle]);
    push(["hours", data.hours?.regularHours, data.hours?.overtimeHours, data.hours?.holidayHours]);
    push(["rates", data.rates?.hourlyRate, data.rates?.overtimeMultiplier, data.rates?.holidayMultiplier]);
    push(["components", data.components?.regularPay, data.components?.overtimePay, data.components?.holidayPay, data.components?.fixedBonus, data.components?.perfBonus]);
    push(["gross", data.gross]);
    push(["taxes", data.taxes?.pit, data.taxes?.ssc, data.taxes?.mil, data.taxes?.total]);
    push(["net", data.net]);
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    downloadFile(rows.join("\n"), `payroll-${ts}.csv`, "text/csv;charset=utf-8");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">Payroll</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="flex flex-col"><label className="text-gray-500 mb-1">Період (YYYY-MM)</label><input value={period} onChange={(e) => setPeriod(e.target.value)} className="border rounded px-3 py-2" placeholder="2025-11" /></div>
          <div className="flex flex-col justify-end"><button onClick={calcTeam} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold">{loading ? "Розрахунок..." : "Розрахувати"}</button></div>
          {(data || teamData.length > 0) && (
            <div className="flex gap-2 items-end">
              <button onClick={exportCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold">Експорт CSV</button>
              <button onClick={exportJSON} className="bg-gray-800 text-white px-4 py-2 rounded-lg font-semibold">Експорт JSON</button>
            </div>
          )}
        </div>
      </div>
      {data && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex flex-col"><span className="text-gray-500">Працівник</span><span className="font-semibold">{data.user?.name}</span><span className="text-xs text-gray-500">{data.user?.department} · {data.user?.jobTitle}</span></div>
            <div className="flex flex-col"><span className="text-gray-500">Період</span><span className="font-semibold">{data.period}</span></div>
            <div className="flex flex-col"><span className="text-gray-500">Години</span><span className="font-semibold">Регулярні: {data.hours?.regularHours} · Овертайм: {data.hours?.overtimeHours} · Свята: {data.hours?.holidayHours}</span></div>
            <div className="flex flex-col"><span className="text-gray-500">Ставки</span><span className="font-semibold">{data.rates?.hourlyRate} UAH · x{data.rates?.overtimeMultiplier} · x{data.rates?.holidayMultiplier}</span></div>
            <div className="flex flex-col"><span className="text-gray-500">Компоненти</span><span className="font-semibold">Регулярна: {Math.round(data.components?.regularPay)} · Овертайм: {Math.round(data.components?.overtimePay)} · Свята: {Math.round(data.components?.holidayPay)} · Бонуси: {Math.round((data.components?.fixedBonus||0)+(data.components?.perfBonus||0))}</span></div>
            <div className="flex flex-col"><span className="text-gray-500">Підсумок</span><span className="font-semibold">Gross: {data.gross} · Taxes: {data.taxes?.total} · Net: {data.net}</span></div>
          </div>
        </div>
      )}
      {teamData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">Працівник</th>
                  <th className="px-4 py-2 text-left">Відділ</th>
                  <th className="px-4 py-2 text-left">Посада</th>
                  <th className="px-4 py-2 text-right">Години</th>
                  <th className="px-4 py-2 text-right">Gross</th>
                  <th className="px-4 py-2 text-right">Taxes</th>
                  <th className="px-4 py-2 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {teamData.map((p, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-4 py-2">{p.user?.name}</td>
                    <td className="px-4 py-2">{p.user?.department}</td>
                    <td className="px-4 py-2">{p.user?.jobTitle}</td>
                    <td className="px-4 py-2 text-right">{p.hours?.total?.toFixed(1)}</td>
                    <td className="px-4 py-2 text-right font-semibold">{p.gross?.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right text-red-600">{p.taxes?.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right font-bold text-green-600">{p.net?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
