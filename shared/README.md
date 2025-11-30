# Shared Types

Спільні типи та енуми для використання як на клієнті, так і на сервері.

## Структура

```
shared/
├── types/
│   └── user.types.ts    # Типи користувача
├── package.json         # Конфігурація ES модуля
└── index.ts            # Експорти
```

## Чому окрема папка?

Папка `shared` містить код, який використовується **і клієнтом, і сервером**:
- Уникнення дублювання коду
- Єдине джерело правди для типів
- Синхронізація між frontend та backend
- Type-safe комунікація (API запити/відповіді)

## User Types

### Enums

#### `UserRole` - Ролі в системі
```typescript
enum UserRole {
  EMPLOYEE = "employee",
  LINE_MANAGER = "line_manager",
  HR_MANAGER = "hr_manager",
  HR_ANALYST = "hr_analyst",
  RECRUITER = "recruiter",
  ADMIN = "admin",
}
```

#### `UserStatus` - Статус співробітника
```typescript
enum UserStatus {
  ACTIVE = "active",
  ON_LEAVE = "on_leave",
  TERMINATED = "terminated",
  SUSPENDED = "suspended",
}
```

#### `Department` - Департаменти
```typescript
enum Department {
  IT = "it",
  HR = "hr",
  FINANCE = "finance",
  SALES = "sales",
  MARKETING = "marketing",
  OPERATIONS = "operations",
  SUPPORT = "support",
}
```

#### `EmploymentType` - Тип зайнятості
```typescript
enum EmploymentType {
  FULL_TIME = "full_time",
  PART_TIME = "part_time",
  CONTRACT = "contract",
  INTERN = "intern",
}
```

### Interfaces

#### `UserCredentials` - Креденшали для логіну
```typescript
interface UserCredentials {
  email: string;
  password: string;
}
```

#### `UserBasicInfo` - Базова інформація
Для списків, dropdown меню, тощо.

#### `PersonalInfo` - Особиста інформація
Повна особиста інформація включаючи адресу та екстрений контакт.

#### `JobInfo` - Інформація про роботу
Посада, департамент, дата прийому, тип зайнятості, менеджер.

#### `SalaryInfo` - Зарплата
Базова зарплата, бонуси, валюта, дати перегляду.

#### `LeaveBalance` - Баланс відпусток
Загальна кількість, використано, залишок.

#### `Skill` - Навичка
Назва, рівень, роки досвіду.

#### `PerformanceMetrics` - Метрики ефективності
Оцінки ефективності та потенціалу для 9-Box Grid.

#### `UserProfile` - Повний профіль
Extends `UserBasicInfo` + всі інші дані.

### DTOs (Data Transfer Objects)

#### `CreateUserDTO`
Для створення нового користувача через API.

```typescript
const newUser: CreateUserDTO = {
  firstName: "John",
  lastName: "Doe",

  email: "john@example.com",
  password: "securePassword",
  role: UserRole.EMPLOYEE,
  jobInfo: {  },
  salaryInfo: {  },
};
```

#### `UpdateUserDTO`
Для оновлення користувача (всі поля optional).

```typescript
const updates: UpdateUserDTO = {
  personalInfo: { phone: "+380501234567" },
  status: UserStatus.ON_LEAVE,
};
```

## Принцип наслідування типів

Типи побудовані з використанням TypeScript utility types для уникнення дублювання:

```typescript

interface UserBasicInfo {
  id: string;
  firstName: string;
  lastName: string;

}

interface UserProfile extends UserBasicInfo {
  status: UserStatus;
  personalInfo: PersonalInfo;

}

interface CreateUserDTO extends Omit<PersonalInfo, "email"> {
  email: string;
  password: string;

}

interface UpdateUserDTO {
  personalInfo?: Partial<PersonalInfo>;

}
```

## Використання на клієнті

```typescript
import { UserRole, UserStatus, type UserProfile } from "@/shared";

interface UserCardProps {
  user: UserProfile;
}

const credentials: UserCredentials = {
  email: formData.email,
  password: formData.password,
};
```

## Використання на сервері

```typescript
import { UserRole, Department, type CreateUserDTO } from "../../../shared/index.js";

app.post("/api/users", async (req, res) => {
  const userData: CreateUserDTO = req.body;

});
```

## Майбутні типи

У цій папці також будуть додані типи для інших модулів:
- `leave.types.ts` - Типи для відпусток
- `performance.types.ts` - Типи для оцінки ефективності
- `recruitment.types.ts` - Типи для рекрутингу
- `analytics.types.ts` - Типи для аналітики
- тощо
