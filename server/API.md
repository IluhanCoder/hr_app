# User API Documentation

API для управління користувачами в HR системі.

## Base URL
```
http://localhost:5000/api
```

## Authentication

Більшість endpoints потребують JWT токен в header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 🔓 Публічні маршрути (без автентифікації)

#### 1. Реєстрація користувача
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "employee"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### 2. Логін
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "employee",
      "avatarUrl": "https://..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `401` - Invalid credentials
- `403` - Account terminated or suspended

---

### 🔒 Захищені маршрути (потрібна автентифікація)

#### 3. Отримати поточного користувача
```http
GET /api/users/me
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john.doe@example.com",
    "role": "employee",
    "status": "active",
    "personalInfo": {
      "firstName": "John",
      "lastName": "Doe",
      "dateOfBirth": "1990-01-15",
      "phone": "+380501234567",
      "email": "john.doe@example.com"
    },
    "jobInfo": {
      "jobTitle": "Software Engineer",
      "department": "it",
      "employmentType": "full_time",
      "hireDate": "2023-01-15"
    },
    "leaveBalance": {
      "totalDays": 24,
      "usedDays": 5,
      "remainingDays": 19,
      "year": 2025
    },
    "skills": [
      {
        "name": "TypeScript",
        "level": "advanced",
        "yearsOfExperience": 3
      }
    ]
  }
}
```

---

#### 4. Отримати всіх користувачів
```http
GET /api/users
```

**Access:** HR Manager, Admin

**Response (200):**
```json
{
  "success": true,
  "data": [...],
  "count": 45
}
```

---

#### 5. Отримати користувача за ID
```http
GET /api/users/:id
```

**Access:** Власний профіль або HR Manager/Admin

**Response (200):**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Responses:**
- `403` - Access denied
- `404` - User not found

---

#### 6. Оновити користувача
```http
PUT /api/users/:id
```

**Access:** Власний профіль або HR Manager/Admin

**Request Body:**
```json
{
  "personalInfo": {
    "phone": "+380501234567"
  },
  "skills": [
    {
      "name": "React",
      "level": "expert",
      "yearsOfExperience": 5
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { ... },
  "message": "User updated successfully"
}
```

**Note:** 
- Звичайні користувачі можуть оновлювати тільки `personalInfo` та `skills`
- HR Manager/Admin можуть оновлювати `jobInfo`, `salaryInfo`, `status`

---

#### 7. Видалити (деактивувати) користувача
```http
DELETE /api/users/:id
```

**Access:** HR Manager, Admin

**Response (200):**
```json
{
  "success": true,
  "message": "User terminated successfully"
}
```

**Note:** Користувач не видаляється з бази, а деактивується (status = "terminated")

---

#### 8. Отримати користувачів по департаменту
```http
GET /api/users/department/:department
```

**Access:** Line Manager, HR Manager, Admin

**Example:**
```http
GET /api/users/department/it
```

**Response (200):**
```json
{
  "success": true,
  "data": [...],
  "count": 12
}
```

**Available departments:**
- `it`
- `hr`
- `finance`
- `sales`
- `marketing`
- `operations`
- `support`

---

#### 9. Отримати команду менеджера
```http
GET /api/users/manager/:managerId/team
```

**Access:** Line Manager, HR Manager, Admin

**Example:**
```http
GET /api/users/manager/507f1f77bcf86cd799439011/team
```

**Response (200):**
```json
{
  "success": true,
  "data": [...],
  "count": 8
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authorization token is required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions",
  "required": ["hr_manager", "admin"],
  "current": "employee"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (only in development)"
}
```

---

## User Roles

| Role | Description |
|------|-------------|
| `employee` | Звичайний співробітник |
| `line_manager` | Лінійний менеджер |
| `hr_manager` | HR менеджер |
| `hr_analyst` | HR аналітик |
| `recruiter` | Рекрутер |
| `admin` | Адміністратор |

---

## User Statuses

| Status | Description |
|--------|-------------|
| `active` | Активний співробітник |
| `on_leave` | У відпустці |
| `terminated` | Звільнений |
| `suspended` | Призупинений |

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get current user
```bash
curl -X GET http://localhost:5000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Testing with Postman

1. Import collection або створіть нові запити
2. Для захищених маршрутів:
   - Go to **Authorization** tab
   - Type: **Bearer Token**
   - Token: Вставте JWT токен з відповіді login/register

---

## Environment Variables

Створіть `.env` файл у папці `server/`:

```env
PORT=5000
DB_URL=mongodb+srv://...
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```
