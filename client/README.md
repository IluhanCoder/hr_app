# HR Management System - Client# Getting Started with Create React App



React + TypeScript клієнт для HR Management System.This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).



## 🚀 Запуск## Available Scripts



```bashIn the project directory, you can run:

# Встановлення залежностей

npm install### `npm start`



# Запуск development сервераRuns the app in the development mode.\

npm startOpen [http://localhost:3000](http://localhost:3000) to view it in the browser.

```

The page will reload if you make edits.\

Додаток буде доступний за адресою: http://localhost:3000You will also see any lint errors in the console.



## 📁 Структура### `npm test`



```Launches the test runner in the interactive watch mode.\

client/src/See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

├── components/

│   └── ProtectedRoute.tsx      # Захист маршрутів### `npm run build`

├── contexts/

│   └── AuthContext.tsx         # Глобальний стан автентифікаціїBuilds the app for production to the `build` folder.\

├── pages/It correctly bundles React in production mode and optimizes the build for the best performance.

│   ├── Login.tsx               # Сторінка логіну

│   ├── Register.tsx            # Сторінка реєстраціїThe build is minified and the filenames include the hashes.\

│   └── Dashboard.tsx           # Головна сторінкаYour app is ready to be deployed!

├── services/

│   ├── api.ts                  # Axios instanceSee the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

│   ├── auth.service.ts         # API автентифікації

│   └── user.service.ts         # API користувачів### `npm run eject`

└── App.tsx                     # Головний компонент

```**Note: this is a one-way operation. Once you `eject`, you can’t go back!**



## 🔐 АвтентифікаціяIf you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.



```typescriptInstead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

const { user, isAuthenticated, login, register, logout } = useAuth();

```You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.



## 🌐 Environment## Learn More



Створіть `.env` файл:You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

```env

REACT_APP_API_URL=http://localhost:5000/apiTo learn React, check out the [React documentation](https://reactjs.org/).

```

## 🛣️ Маршрути

- `/login` - Логін
- `/register` - Реєстрація
- `/dashboard` - Dashboard (захищений)
