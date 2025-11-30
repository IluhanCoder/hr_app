
import React from "react";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStores } from "../stores/RootStore";

const Dashboard: React.FC = observer(() => {
  const { authStore } = useStores();
  const navigate = useNavigate();
  const { user } = authStore;

  React.useEffect(() => {
  }, [user]);

  const handleLogout = () => {
    authStore.logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      <header className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-5 py-5">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Система Управління Персоналом</h1>
            
            <div className="flex items-center gap-5">
              <div className="text-right">
                <div className="font-semibold text-base">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs opacity-90 capitalize">{user?.role}</div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 border border-white/30 px-5 py-2 rounded-lg font-semibold transition-all"
              >
                Вийти
              </button>
            </div>
          </div>
        </div>
      </header>

      
      <main className="max-w-7xl mx-auto px-5 py-10">
        
        <div className="mb-10">
          <h2 className="text-4xl font-bold text-gray-800 mb-2">
            Вітаємо, {user?.firstName}! 👋
          </h2>
          <p className="text-gray-600 text-base">
            Ось що відбувається у вашій HR панелі сьогодні.
          </p>
        </div>

        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          
          {(user?.role === "hr_manager" || user?.role === "admin") && (
            <div className="bg-white rounded-xl p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Аналіз Коментарів</h3>
              <p className="text-gray-600 text-sm mb-5">
                Тональність коментарів з performance reviews
              </p>
              <button
                onClick={() => navigate("/review-comments-sentiment")}
                className="w-full bg-gradient-to-r from-[#43cea2] to-[#185a9d] text-white py-2.5 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40"
              >
                Переглянути
              </button>
            </div>
          )}
          
          {(user?.role === "hr_manager" || user?.role === "admin") && (
            <div className="bg-white rounded-xl p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="text-5xl mb-4">🔥</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Ризик Звільнення</h3>
              <p className="text-gray-600 text-sm mb-5">
                Rule-based скоринг attrition з історією тренду
              </p>
              <button
                onClick={() => navigate("/analytics/attrition")}
                className="w-full bg-gradient-to-r from-[#ff512f] to-[#dd2476] text-white py-2.5 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40"
              >
                Відкрити
              </button>
            </div>
          )}
          
          {(user?.role === "hr_manager" || user?.role === "admin") && (
            <div className="bg-white rounded-xl p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="text-5xl mb-4">⚖️</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Аналіз Упереджень</h3>
              <p className="text-gray-600 text-sm mb-5">
                Регресійний аналіз bias у системі оплати праці
              </p>
              <button
                onClick={() => navigate("/salary-bias-analysis")}
                className="w-full bg-gradient-to-r from-[#f093fb] to-[#f5576c] text-white py-2.5 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40"
              >
                Запустити
              </button>
            </div>
          )}
          {(user?.role === "hr_manager" || user?.role === "admin" || user?.role === "line_manager") && (
            <div className="bg-white rounded-xl p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="text-5xl mb-4">🟰</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Ефективність vs Потенціал</h3>
              <p className="text-gray-600 text-sm mb-5">
                Матриця 5×5 з автопозиціонуванням
              </p>
              <button
                onClick={() => navigate("/analytics/performance-potential")}
                className="w-full bg-gradient-to-r from-[#10b981] to-[#34d399] text-white py-2.5 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40"
              >
                Переглянути
              </button>
            </div>
          )}
          {(user?.role === "hr_manager" || user?.role === "admin") && (
            <div className="bg-white rounded-xl p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="text-5xl mb-4">📈</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Аномалії Зарплат</h3>
              <p className="text-gray-600 text-sm mb-5">
                Відхилення окладів від середнього (поріг %)
              </p>
              <button
                onClick={() => navigate("/salary-warnings")}
                className="w-full bg-gradient-to-r from-[#4facfe] to-[#00f2fe] text-white py-2.5 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40"
              >
                Переглянути
              </button>
            </div>
          )}
          
          {(user?.role === "hr_manager" || user?.role === "admin") && (
            <div className="bg-white rounded-xl p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Управління</h3>
              <p className="text-gray-600 text-sm mb-5">
                Керування співробітниками
              </p>
              <button
                onClick={() => navigate("/employees")}
                className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-2.5 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40"
              >
                Відкрити
              </button>
            </div>
          )}

          
          {(user?.role === "hr_manager" || user?.role === "admin") && (
            <div className="bg-white rounded-xl p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="text-5xl mb-4">🏢</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Структура</h3>
              <p className="text-gray-600 text-sm mb-5">
                Організаційна структура
              </p>
              <button
                onClick={() => navigate("/organization")}
                className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-2.5 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40"
              >
                Відкрити
              </button>
            </div>
          )}

          
          {(user?.role === "line_manager" || user?.role === "hr_manager" || user?.role === "admin") && (
            <div className="bg-white rounded-xl p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Відпустки</h3>
              <p className="text-gray-600 text-sm mb-5">
                Затвердження запитів
              </p>
              <button
                onClick={() => navigate("/leave-approvals")}
                className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-2.5 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40"
              >
                Відкрити
              </button>
            </div>
          )}

          {}
          {(user?.role === "hr_manager" || user?.role === "admin") && (
            <div className="bg-white rounded-xl p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Шаблони Оцінки</h3>
              <p className="text-gray-600 text-sm mb-5">
                Управління шаблонами
              </p>
              <button
                onClick={() => navigate("/review-templates")}
                className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-2.5 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40"
              >
                Відкрити
              </button>
            </div>
          )}

          {}
          {(user?.role === "line_manager" || user?.role === "hr_manager" || user?.role === "admin") && (
            <div className="bg-white rounded-xl p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="text-5xl mb-4">⭐</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Провести Оцінку</h3>
              <p className="text-gray-600 text-sm mb-5">
                Оцінки співробітників
              </p>
              <button
                onClick={() => navigate("/performance-reviews")}
                className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-2.5 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40"
              >
                Відкрити
              </button>
            </div>
          )}
          {}
          {(user?.role === "employee" || user?.role === "line_manager" || user?.role === "hr_manager" || user?.role === "admin") && (
            <div className="bg-white rounded-xl p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="text-5xl mb-4">⏱️</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Облік часу</h3>
              <p className="text-gray-600 text-sm mb-5">Логування та затвердження робочого часу</p>
              <button onClick={() => navigate("/time-tracking")} className="w-full bg-gradient-to-r from-[#43cea2] to-[#185a9d] text-white py-2.5 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg">Перейти</button>
            </div>
          )}

          {}
          {(user?.role === "hr_manager" || user?.role === "admin") && (
            <div className="bg-white rounded-xl p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="text-5xl mb-4">💵</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Payroll</h3>
              <p className="text-gray-600 text-sm mb-5">Розрахунок зарплати за період</p>
              <button onClick={() => navigate("/payroll")} className="w-full bg-gradient-to-r from-[#4facfe] to-[#00f2fe] text-white py-2.5 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg">Відкрити</button>
            </div>
          )}

          {}
          {(authStore.user?.role === "hr_manager" || authStore.user?.role === "admin") && (
            <div className="bg-white rounded-xl p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="text-5xl mb-4">⭐</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Кадровий Резерв</h3>
              <p className="text-gray-600 text-sm mb-5">
                Управління високопотенційними співробітниками
              </p>
              <button
                onClick={() => navigate("/high-potential")}
                className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-2.5 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40"
              >
                Відкрити
              </button>
            </div>
          )}

          {}
          <div className="bg-white rounded-xl p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
            <div className="text-5xl mb-4">👤</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Мій Профіль</h3>
            <p className="text-gray-600 text-sm mb-5">
              Особиста інформація та відпустки
            </p>
            <button
              onClick={() => navigate("/my-profile")}
              className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-2.5 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40"
            >
              Переглянути
            </button>
          </div>

          {}
          <div className="bg-white rounded-xl p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Моя Команда</h3>
            <p className="text-gray-600 text-sm mb-5">
              Переглядайте членів команди
            </p>
            <button className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-2.5 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40">
              Переглянути
            </button>
          </div>

          {}
          <div className="bg-white rounded-xl p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {user?.role === "line_manager" || user?.role === "hr_manager" || user?.role === "admin"
                ? "Управління Цілями"
                : "Мої Цілі"}
            </h3>
            <p className="text-gray-600 text-sm mb-5">
              {user?.role === "line_manager" || user?.role === "hr_manager" || user?.role === "admin"
                ? "KPI/OKR команди"
                : "Відстеження прогресу"}
            </p>
            <button
              onClick={() =>
                navigate(
                  user?.role === "line_manager" ||
                    user?.role === "hr_manager" ||
                    user?.role === "admin"
                    ? "/goals"
                    : "/my-goals"
                )
              }
              className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-2.5 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40"
            >
              {user?.role === "line_manager" || user?.role === "hr_manager" || user?.role === "admin"
                ? "Управління"
                : "Переглянути"}
            </button>
          </div>

          {}
          <div className="bg-white rounded-xl p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
            <div className="text-5xl mb-4">⭐</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Мої Оцінки</h3>
            <p className="text-gray-600 text-sm mb-5">
              Історія оцінок ефективності
            </p>
            <button
              onClick={() => navigate("/my-reviews")}
              className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-2.5 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40"
            >
              Переглянути
            </button>
          </div>

          {}
          {(user?.role === "hr_manager" ||
            user?.role === "admin" ||
            user?.role === "recruiter" ||
            user?.role === "line_manager") && (
            <div className="bg-white rounded-xl p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Рекрутинг</h3>
              <p className="text-gray-600 text-sm mb-5">
                Воронка найму кандидатів
              </p>
              <button
                onClick={() => navigate("/recruitment")}
                className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-2.5 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40"
              >
                Відкрити
              </button>
            </div>
          )}

          {}
          <div className="bg-white rounded-xl p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
            <div className="text-5xl mb-4">🏖️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Відпустки</h3>
            <p className="text-gray-600 text-sm mb-5">
              Запити на відпустку
            </p>
            <button
              onClick={() => navigate("/my-profile?tab=leave")}
              className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-2.5 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40"
            >
              Подати запит
            </button>
          </div>

          {}
          {(authStore.user?.role === "hr_manager" || authStore.user?.role === "admin") && (
            <div className="bg-white rounded-xl p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Звіти</h3>
              <p className="text-gray-600 text-sm mb-5">
                Аналітика та експорт даних
              </p>
              <button
                onClick={() => navigate("/reports")}
                className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-2.5 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40"
              >
                Відкрити
              </button>
            </div>
          )}

          {}
          {(authStore.user?.role === "hr_manager" || authStore.user?.role === "admin") && (
            <div className="bg-white rounded-xl p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Навички</h3>
              <p className="text-gray-600 text-sm mb-5">
                Управління навичками та GAP аналіз
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => navigate("/skills-management")}
                  className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-2 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Навички
                </button>
                <button
                  onClick={() => navigate("/job-profiles")}
                  className="w-full bg-gradient-to-r from-[#f093fb] to-[#f5576c] text-white py-2 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Профілі посад
                </button>
                <button
                  onClick={() => navigate("/skills-gap-analysis")}
                  className="w-full bg-gradient-to-r from-[#4facfe] to-[#00f2fe] text-white py-2 rounded-lg font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  GAP Аналіз
                </button>
              </div>
            </div>
          )}

          {}
        </div>

        {}
        <div className="bg-white rounded-xl p-8 shadow-md">
          <h3 className="text-xl font-bold text-gray-800 mb-5">
            Інформація вашого профілю
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="font-semibold text-gray-600">Пошта:</span>
              <span className="text-gray-800">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="font-semibold text-gray-600">Роль:</span>
              <span className="inline-block bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-3 py-1 rounded-full text-xs font-semibold uppercase">
                {user?.role}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="font-semibold text-gray-600">ID Користувача:</span>
              <span className="text-gray-800 font-mono text-sm">{user?.id}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
});

export default Dashboard;
