

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStores } from "../stores/RootStore";

const Register: React.FC = observer(() => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "hr_manager",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { authStore } = useStores();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Паролі не співпадають");
      return;
    }

    if (formData.password.length < 6) {
      setError("Пароль повинен містити принаймні 6 символів");
      return;
    }

    setIsLoading(true);

    try {
      await authStore.register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.role
      );
      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] p-5">
      <div className="bg-white rounded-xl shadow-2xl p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary mb-2">
            Система Управління Персоналом
          </h1>
          <h2 className="text-3xl font-bold text-gray-800">Реєстрація</h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-semibold text-gray-600 mb-2"
              >
                Ім'я
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Іван"
                required
                disabled={isLoading}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-semibold text-gray-600 mb-2"
              >
                Прізвище
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Петренко"
                required
                disabled={isLoading}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-600 mb-2"
            >
              Електронна пошта
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="ваша.пошта@приклад.com"
              required
              disabled={isLoading}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-600 mb-2"
            >
              Пароль
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Мінімум 6 символів"
              required
              disabled={isLoading}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-semibold text-gray-600 mb-2"
            >
              Підтвердження паролю
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Повторіть пароль"
              required
              disabled={isLoading}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label
              htmlFor="role"
              className="block text-sm font-semibold text-gray-600 mb-2"
            >
              Роль
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="hr_manager">HR Менеджер</option>
              <option value="admin">Адміністратор</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Співробітники створюються через HR панель
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-3.5 rounded-lg text-base font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-4"
          >
            {isLoading ? "Створення акаунту..." : "Зареєструватися"}
          </button>
        </form>

        <div className="text-center mt-6 pt-5 border-t border-gray-200">
          <p className="text-gray-600 text-sm">
            Вже маєте акаунт?{" "}
            <Link
              to="/login"
              className="text-primary font-semibold hover:underline"
            >
              Увійти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
});

export default Register;
