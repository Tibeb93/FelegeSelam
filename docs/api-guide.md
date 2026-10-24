# REST API Developer & Integration Guide

> **API Base URL**: `http://localhost:3000/api/v1` (Production: `https://aemade.org/api/v1`)  
> **OpenAPI Specification**: Available in [`docs/swagger.json`](file:///c:/Users/user/Desktop/PersonalProjects/FelegeSelam/docs/swagger.json)  
> **Interactive Swagger UI**: `http://localhost:3000/api/docs`

---

## 1. General Principles

### 1.1 Request Headers
Every authenticated request must include the JWT bearer token:
```http
Authorization: Bearer <your_access_token>
Content-Type: application/json
Accept: application/json
```

### 1.2 Unified Error Response Format
All errors return a consistent JSON payload adhering to the global `HttpExceptionFilter`:
```json
{
  "statusCode": 400,
  "timestamp": "2026-10-24T07:25:00.000Z",
  "path": "/api/v1/members",
  "method": "POST",
  "message": ["phone must be a valid Ethiopian phone number"],
  "error": "Bad Request"
}
```

---

## 2. Authentication & Session Management

### 2.1 Register
```http
POST /api/v1/auth/register
```
**Request Body**:
```json
{
  "firstName": "ዮናስ",
  "fatherName": "ተስፋዬ",
  "email": "yonas@example.com",
  "phone": "+251911223344",
  "password": "Password123456!",
  "confirmPassword": "Password123456!",
  "sex": "male"
}
```
**Response (201 Created)**:
```json
{
  "message": "Registration successful. Your account is pending administrator review.",
  "userId": "usr_94bca128",
  "status": "pending"
}
```

### 2.2 Login
```http
POST /api/v1/auth/login
```
**Request Body**:
```json
{
  "identifier": "admin@aemade.org",
  "password": "Admin@123456!"
}
```
**Response (200 OK)**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5c...",
  "refreshToken": "ref_8820f18aa...",
  "expiresIn": 900,
  "user": {
    "id": "usr_superadmin",
    "email": "admin@aemade.org",
    "role": "super_admin"
  }
}
```

### 2.3 Rotate Refresh Token (OWASP RFC 6819)
```http
POST /api/v1/auth/refresh
```
Exchanges the single-use refresh token for a newly rotated access token and refresh token pair.

---

## 3. Core API Endpoints Reference

### 3.1 Members Module
| Method | Endpoint | Required Role | Description |
|---|---|---|---|
| `GET` | `/api/v1/members` | `admin`, `teacher` | Paginated search, filter by department and status |
| `POST` | `/api/v1/members` | `admin` | Create new member record with auto `memberNo` |
| `GET` | `/api/v1/members/:id` | `admin`, `teacher` | Get member full profile and audit trail |
| `PUT` | `/api/v1/members/:id` | `admin` | Update member demographic and contact info |
| `PATCH` | `/api/v1/members/:id/approve` | `admin` | Approve pending registration into active member |
| `GET` | `/api/v1/members/export` | `admin`, `teacher` | Export member roster to Excel, PDF, or Word |
| `GET` | `/api/v1/members/:id/id-card` | `admin`, `member` | Download printable ID Card PDF with QR code |
| `GET` | `/api/v1/members/me/data-export` | `member` | Download complete personal data JSON (GDPR) |
| `DELETE` | `/api/v1/members/me/account` | `member` | Deactivate account and soft-delete personal data |

### 3.2 Courses, Lessons & Academic
| Method | Endpoint | Required Role | Description |
|---|---|---|---|
| `GET` | `/api/v1/courses/public` | `Public` | Catalog of published courses open for registration |
| `GET` | `/api/v1/courses` | `teacher`, `admin` | Course list (teachers see only their assigned courses) |
| `POST` | `/api/v1/courses` | `admin` | Create course with title, capacity, schedule |
| `POST` | `/api/v1/courses/:id/lessons` | `teacher`, `admin` | Add lesson with PDF, audio, and video upload |
| `POST` | `/api/v1/courses/:id/enrollments` | `admin`, `teacher` | Enroll a member into a course |
| `POST` | `/api/v1/courses/:id/enrollments/bulk-department` | `admin` | Bulk enroll entire department into course |
| `POST` | `/api/v1/attendance/scan` | `teacher`, `admin` | Record attendance via camera QR scan |
| `POST` | `/api/v1/enrollments/:id/grades` | `teacher`, `admin` | Record assessment score and calculate GPA |
| `POST` | `/api/v1/certificates` | `admin` | Issue course completion certificate |
| `GET` | `/api/v1/certificates/verify/:code` | `Public` | Verify certificate authenticity by unique code |

### 3.3 Spiritual Content & Mezmurs
| Method | Endpoint | Required Role | Description |
|---|---|---|---|
| `GET` | `/api/v1/posts/today` | `Public` | Today's Sinksar and urgent announcement banner |
| `GET` | `/api/v1/posts` | `Public` | Paginated spiritual teachings and news |
| `POST` | `/api/v1/posts` | `content_manager` | Publish scheduled or urgent rich text post |
| `GET` | `/api/v1/mezmurs/public` | `Public` | Search mezmurs by title, category, and lyrics |
| `POST` | `/api/v1/mezmurs` | `content_manager` | Add mezmur with lyrics, audio, and video |
| `POST` | `/api/v1/mezmurs/:id/favorite` | `member` | Add mezmur to personal favorites |

### 3.4 Form Builder & Submissions
| Method | Endpoint | Required Role | Description |
|---|---|---|---|
| `POST` | `/api/v1/forms` | `admin` | Create dynamic form with JSON schema fields |
| `GET` | `/api/v1/forms` | `Public` / `Member` | List active forms available for submission |
| `POST` | `/api/v1/forms/:id/submit` | `member` | Submit form responses with input validation |
| `GET` | `/api/v1/forms/:id/responses` | `admin` | Review submissions table with status filters |
| `PATCH` | `/api/v1/forms/responses/:id/review` | `admin` | Approve or reject submission with review note |
| `GET` | `/api/v1/forms/:id/export` | `admin` | Export form responses to Excel or PDF |

### 3.5 System & Monitoring
| Method | Endpoint | Required Role | Description |
|---|---|---|---|
| `GET` | `/api/v1/health` | `Public` | Live health probe reporting database status |
| `GET` | `/api/v1/settings/public` | `Public` | School name, logo, parish, motto, contacts |
| `GET` | `/api/v1/settings/calendar` | `Public` | Fasting seasons, movable feasts, monthly saints |
| `POST` | `/api/v1/admin/backups` | `super_admin` | Generate instant database backup |
| `GET` | `/api/v1/admin/audit-logs` | `super_admin` | Retrieve security audit trail with redacting |
