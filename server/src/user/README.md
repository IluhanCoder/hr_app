# User Module

Модуль управління користувачами для HR системи.

## Структура

```
src/user/
├── user.model.ts      # Mongoose модель користувача
├── user.types.ts      # Серверні типи (розширення спільних типів)
└── index.ts           # Експорти модуля
```

## Mongoose Model: User

### Основні поля

#### Автентифікація
- `email` - Email користувача (unique, validated)
- `passwordHash` - Хеш пароля (bcrypt, не включається в запити)
- `role` - Роль в системі (UserRole enum)
- `status` - Статус співробітника (UserStatus enum)

#### Особиста інформація (personalInfo)
- `firstName`, `lastName`, `middleName`
- `dateOfBirth`, `phone`, `email`
- `address` - Повна адреса
- `emergencyContact` - Контакт на екстрений випадок

#### Інформація про роботу (jobInfo)
- `jobTitle` - Посада
- `department` - Департамент
- `employmentType` - Тип зайнятості
- `hireDate`, `terminationDate`
- `lineManagerId` - Посилання на безпосереднього керівника
- `location` - Локація

#### Зарплата (salaryInfo) - конфіденційно
- `baseSalary` - Базова зарплата
- `currency` - Валюта
- `bonuses` - Бонуси
- `lastSalaryReview`, `nextSalaryReview`

#### Баланс відпусток (leaveBalance)
- `totalDays` - Загальна кількість днів відпустки
- `usedDays` - Використано днів
- `remainingDays` - Залишок (обчислюється автоматично)
- `year` - Рік

#### Навички (skills[])
- `name` - Назва навички
- `level` - Рівень (beginner/intermediate/advanced/expert)
- `yearsOfExperience` - Роки досвіду

#### Метрики ефективності (performanceMetrics)
- `performanceScore` - Оцінка ефективності (1-5)
- `potentialScore` - Оцінка потенціалу (1-5)
- `lastReviewDate`, `nextReviewDate`
- `goals[]` - Цілі

#### Аналітичні дані (analyticsData)
Для ML моделей:
- `riskScore` - Ризик звільнення (0-100)
- `lastEngagementScore` - Показник залученості
- `sentimentScore` - Аналіз настроїв (-1 до 1)
- `lastActivityDate`

### Методи інстансу

#### `comparePassword(candidatePassword: string): Promise<boolean>`
Порівняння пароля з хешем.

```typescript
const isValid = await user.comparePassword("password123");
```

#### `toPublicProfile(): PublicUserProfile`
Отримання публічного профілю (без конфіденційних даних).

```typescript
const publicProfile = user.toPublicProfile();
```

### Статичні методи

#### `findActive()`
Пошук всіх активних співробітників.

```typescript
const activeUsers = await User.findActive();
```

#### `findByDepartment(department: Department)`
Пошук активних співробітників по департаменту.

```typescript
const itTeam = await User.findByDepartment(Department.IT);
```

#### `findByManager(managerId: string)`
Пошук підлеглих менеджера.

```typescript
const team = await User.findByManager(managerId);
```

### Middleware

#### Pre-save: Хешування пароля
Автоматично хешує `passwordHash` перед збереженням (якщо поле змінено).

#### Pre-save: Розрахунок балансу відпусток
Автоматично обчислює `remainingDays` = `totalDays` - `usedDays`.

### Індекси

Оптимізовані індекси для швидкого пошуку:
- `email` (unique)
- `jobInfo.department`
- `jobInfo.lineManagerId`
- `status`
- `role`
- `performanceMetrics.performanceScore` + `performanceMetrics.potentialScore` (для 9-Box Grid)

## Використання

```typescript
import { User } from "./user/index.js";
import { UserRole, Department, EmploymentType, UserStatus } from "../../../shared/index.js";

const newUser = new User({
  email: "john.doe@example.com",
  passwordHash: "plainPassword123",
  role: UserRole.EMPLOYEE,
  status: UserStatus.ACTIVE,
  personalInfo: {
    firstName: "John",
    lastName: "Doe",
    dateOfBirth: new Date("1990-01-15"),
    phone: "+380501234567",
    email: "john.doe@example.com",
  },
  jobInfo: {
    jobTitle: "Software Engineer",
    department: Department.IT,
    employmentType: EmploymentType.FULL_TIME,
    hireDate: new Date(),
  },
  leaveBalance: {
    totalDays: 24,
    usedDays: 0,
    remainingDays: 24,
    year: 2025,
  },
  skills: [
    { name: "TypeScript", level: "advanced", yearsOfExperience: 3 },
    { name: "React", level: "expert", yearsOfExperience: 4 },
  ],
  performanceMetrics: {},
});

await newUser.save();

const user = await User.findOne({ email: "john.doe@example.com" }).select("+passwordHash");
if (user && await user.comparePassword("plainPassword123")) {
  console.log("Authenticated!");
}

const publicProfile = user.toPublicProfile();
```

## Типи

### Спільні типи (shared/types/user.types.ts)
Використовуються як на клієнті, так і на сервері:
- `UserRole`, `UserStatus`, `Department`, `EmploymentType` (enums)
- `UserCredentials`, `UserBasicInfo`, `UserProfile`
- `PersonalInfo`, `JobInfo`, `SalaryInfo`, `LeaveBalance`, `Skill`, `PerformanceMetrics`
- `CreateUserDTO`, `UpdateUserDTO`

### Серверні типи (user.types.ts)
Розширення спільних типів для сервера:
- `IUserDocument` - Mongoose документ з методами
- `PublicUserProfile` - Без конфіденційних даних
- `FullUserProfile` - Повний профіль
- `UserProfileWithSalary` - З інформацією про зарплату (тільки для HR)
