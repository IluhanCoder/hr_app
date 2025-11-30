import React, { useEffect, useState } from "react";
import { UkDatePicker, UkDateTimePicker } from "../components/UkDatePicker";
import apiClient from "../services/api";
import { toast } from "react-toastify";

interface TimeEntry {
  id?: string;
  _id?: string;
  userId: string;
  date: string;
  start: string;
  end: string;
  breakMinutes: number;
  type: "regular" | "overtime" | "holiday";
  status: "pending" | "approved" | "rejected";
}

const TimeTracking: React.FC = () => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [form, setForm] = useState({
    start: "",
    end: "",
    breakMinutes: 60,
    type: "regular",
  } as any);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const fetchCurrentUser = async () => {
    try {
      const res = await apiClient.get("/users/me");
      const userId = res.data.data?._id || res.data.data?.id || "";
      setCurrentUserId(userId);
      console.log("Current user ID:", userId);
    } catch (err) {
      console.error("Failed to fetch current user");
    }
  };

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/time", { params: { from, to } });
      const entriesList = res.data.entries || [];
      console.log("Entries:", entriesList.map((e: TimeEntry) => ({ userId: e.userId, id: e._id })));
      setEntries(entriesList);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Помилка завантаження");
    } finally {
      setLoading(false);
    }
  };

  const canApprove = entries.some(e => e.userId !== currentUserId && e.status !== 'approved');

  useEffect(() => {
    fetchCurrentUser();
    fetchEntries();

  }, []);

  const submit = async () => {
    try {
      const payload = {
        start: new Date(form.start).toISOString(),
        end: new Date(form.end).toISOString(),
        breakMinutes: Number(form.breakMinutes || 0),
        type: form.type,
      };
      await apiClient.post("/time", payload);
      toast.success("Запис створено");
      setForm({ start: "", end: "", breakMinutes: 60, type: "regular" });
      fetchEntries();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Помилка створення запису");
    }
  };

  const approve = async (id: string) => {
    try {
      await apiClient.post(`/time/${id}/approve`);
      toast.success("Затверджено");
      fetchEntries();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Помилка затвердження");
    }
  };

  const typeLabelUk = (t: TimeEntry["type"]) => {
    switch (t) {
      case "regular":
        return "Звичайний";
      case "overtime":
        return "Понаднормовий";
      case "holiday":
        return "Святковий";
      default:
        return t;
    }
  };

  const statusLabelUk = (s: TimeEntry["status"]) => {
    switch (s) {
      case "approved":
        return "Затверджено";
      case "pending":
        return "Очікує";
      case "rejected":
        return "Відхилено";
      default:
        return s;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">Облік часу</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="flex flex-col"><label className="text-gray-500 mb-1">Початок</label><UkDateTimePicker
            selected={form.start ? new Date(form.start) : null}
            onChange={(date: Date | null) => setForm({ ...form, start: date ? date.toISOString() : "" })}
            className="border rounded px-3 py-2 w-full"
            placeholderText="Оберіть дату та час"
            isClearable
          /></div>
          <div className="flex flex-col"><label className="text-gray-500 mb-1">Кінець</label><UkDateTimePicker
            selected={form.end ? new Date(form.end) : null}
            onChange={(date: Date | null) => setForm({ ...form, end: date ? date.toISOString() : "" })}
            className="border rounded px-3 py-2 w-full"
            placeholderText="Оберіть дату та час"
            isClearable
          /></div>
          <div className="flex flex-col"><label className="text-gray-500 mb-1">Перерва (хв)</label><input type="number" value={form.breakMinutes} onChange={(e) => setForm({ ...form, breakMinutes: e.target.value })} className="border rounded px-3 py-2" /></div>
          <div className="flex flex-col"><label className="text-gray-500 mb-1">Тип</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="border rounded px-3 py-2"><option value="regular">Звичайний</option><option value="overtime">Понаднормовий</option><option value="holiday">Святковий</option></select></div>
        </div>
        <div className="mt-4"><button onClick={submit} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold">Зберегти</button></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="flex flex-col"><label className="text-gray-500 mb-1">Від</label><UkDatePicker
            selected={from ? new Date(from) : null}
            onChange={(date: Date | null) => setFrom(date ? date.toISOString().slice(0, 10) : "")}
            className="border rounded px-3 py-2 w-full"
            placeholderText="Оберіть дату"
            isClearable
            dateFormat="yyyy-MM-dd"
          /></div>
          <div className="flex flex-col"><label className="text-gray-500 mb-1">До</label><UkDatePicker
            selected={to ? new Date(to) : null}
            onChange={(date: Date | null) => setTo(date ? date.toISOString().slice(0, 10) : "")}
            className="border rounded px-3 py-2 w-full"
            placeholderText="Оберіть дату"
            isClearable
            dateFormat="yyyy-MM-dd"
          /></div>
          <div className="flex flex-col justify-end"><button onClick={fetchEntries} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold">Застосувати</button></div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Дата</th>
                <th className="px-4 py-2 text-left">Період</th>
                <th className="px-4 py-2 text-right">Перерва</th>
                <th className="px-4 py-2 text-center">Тип</th>
                <th className="px-4 py-2 text-center">Статус</th>
                {canApprove && <th className="px-4 py-2 text-center">Дії</th>}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={canApprove ? 6 : 5} className="px-4 py-8 text-center text-gray-500">Завантаження...</td></tr>
              )}
              {!loading && entries.length === 0 && (
                <tr><td colSpan={canApprove ? 6 : 5} className="px-4 py-8 text-center text-gray-500">Немає записів</td></tr>
              )}
              {entries.map((e) => (
                <tr key={e._id || e.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{new Intl.DateTimeFormat('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(e.date))}</td>
                  <td className="px-4 py-2">{new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(e.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-4 py-2 text-right">{e.breakMinutes} хв</td>
                  <td className="px-4 py-2 text-center"><span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">{typeLabelUk(e.type)}</span></td>
                  <td className="px-4 py-2 text-center"><span className={`px-2 py-1 rounded text-xs ${e.status === 'approved' ? 'bg-green-100 text-green-700' : e.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{statusLabelUk(e.status)}</span></td>
                  {canApprove && (
                    <td className="px-4 py-2 text-center">
                      {e.status !== 'approved' && e.userId !== currentUserId && (
                        <button onClick={() => approve(e._id || e.id!)} className="px-3 py-1 rounded bg-green-600 text-white text-xs">Затвердити</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TimeTracking;
