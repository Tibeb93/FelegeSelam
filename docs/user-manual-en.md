# Aemade Selam Sunday School System User Manual (English Edition)

A complete step-by-step user manual for Administrators, Teachers, and Members operating the **Aemade Selam Sunday School Management Platform**.

---

## 1. System Overview & Core Capabilities

**Aemade Selam** is an enterprise-grade digital platform designed specifically for Ethiopian Orthodox Tewahedo Sunday Schools. It bridges spiritual education with modern administrative tools.

### Key Capabilities:
- **Comprehensive Member Registry**: Demographic records, baptismal names, confession fathers, education, occupations, and departments.
- **Academic & Curriculum Engine**: Multilingual courses, structured syllabus lessons (text, PDF, audio, video), student enrollments, and QR-verifiable certificates.
- **Attendance & Grading**: Rapid QR code roll-call scanning, automated attendance statistics, and grade transcripts.
- **Hymnology (Mezmur) Library**: Categorized spiritual hymns, Ge'ez / Amharic lyrics, and embedded audio player.
- **Liturgical Feeds & Sinksar**: Daily saint synaxarium entries, scheduled announcements, and Ethiopian calendar feast tracking.
- **Dynamic Form Builder**: Drag-and-drop form creation with multilingual field labels, deadline controls, and submission review workflows.
- **Financial Accounting**: Member contribution records, tithes, building fund donations, and instant printable PDF receipts.
- **Security & Data Privacy**: Role-Based Access Control (RBAC), Two-Factor Authentication (2FA), audit logs, and GDPR-compliant self-service data export.

---

## 2. User Roles & Permission Hierarchy

The system enforces five role tiers:

| Role Name | Access Scope |
|:---|:---|
| **Super Admin** | Full root authority, role management, user lockout resets, database backups, audit log inspection, and system settings. |
| **Admin** | Member approvals and registry, curriculum management, financial contributions, dynamic forms, and reporting. |
| **Teacher** | Assigned course management, lesson publishing, QR attendance scanning, and student grade submission. |
| **Content Manager** | Mezmur hymn uploads, news articles, daily Sinksar postings, and liturgical events. |
| **Member** | Personal profile, digital QR member ID card, enrolled lessons, attendance & grade transcripts, mezmur favorites, and payment receipts. |

---

## 3. Getting Started & Account Authentication

### 3.1 Initial Login
1. Navigate to `https://aemade.org/en/login` (or `/am/login`).
2. Enter your registered email address or phone number.
3. Enter your password and click **Sign In**.
4. If Two-Factor Authentication (2FA) is activated, enter the 6-digit verification code from your authenticator app (e.g., Google Authenticator).

### 3.2 Security Settings & 2FA Activation
- Open your profile menu at `/portal/profile` and select **Security**.
- Set a strong password containing at least 8 characters with a mix of letters, numbers, and symbols.
- Scan the displayed QR code with your authenticator application to enable Two-Factor Authentication.

---

## 4. Administrator Guide

### 4.1 Executive Dashboard
- **KPI Metrics Cards**: Total Active Members, New Registrations This Month, System-wide Attendance Percentage, and Active Form Responses.
- **Interactive Charts**: Member growth trends over time, distribution across departments, and demographic age groups.
- **Recent Activity Feed**: Real-time log of newly enrolled members and recorded contributions. The dashboard automatically refreshes every 60 seconds.

### 4.2 Member Management
- **Manual Registration**: Navigate to **Members -> New Member** (`/admin/members/new`) to fill in name, baptismal name, gender, birth date, phone, confession father, and upload a portrait photograph.
- **Reviewing Applications**: Navigate to **Pending Members** (`/admin/members/pending`) to inspect prospective members who registered online. Click **Approve** to generate an official Member ID (`M-XXXX`) or **Reject** with feedback.
- **Bulk Import/Export**: Use **Import Members** to upload Excel (.xlsx) spreadsheets or download filtered member lists in Excel or PDF formats.

### 4.3 Academic Courses & Lesson Authoring
1. Navigate to **Courses -> New Course** (`/admin/courses/new`).
2. Provide the Course Title (Amharic & English), description, curriculum level (Beginner / Intermediate / Advanced), assigned Teacher, and classroom schedule.
3. Open the course and click **Add Lesson** to embed teaching notes, PDF books, or audio recordings.
4. Set the course status to **Open** to allow students to enroll.

### 4.4 Mezmur Hymnology Management
- Organize hymns into liturgical categories (Fast of the Prophets, Holy Week, Saint Mary, Feasts).
- Add lyrics in Ge'ez / Amharic script along with uploaded MP3 audio or YouTube video URLs.
- Mark entries as **Public** to appear on the public website or restrict them to enrolled members.

### 4.5 Publishing News, Sinksar & Announcements
- Use the **Rich-Text Editor (Tiptap)** to draft announcements with embedded images and structured formatting.
- **Urgent Toggle**: Flagging an announcement as *Urgent* displays a persistent banner across the top of the public website.
- **Scheduled Publishing**: Set future publication dates and automated expiration dates.

### 4.6 Drag-and-Drop Dynamic Form Builder
1. Navigate to **Forms -> New Form** (`/admin/forms/builder`).
2. Drag fields from the palette (Text, Textarea, Number, Date, Dropdown, Radio, Checkbox, File Upload) into the canvas.
3. Configure bilingual field titles and validation rules.
4. Set deadline controls and enable *One Response Per Member* if applicable.
5. Review completed responses under **Form Responses**, approve or reject submissions, and export data to Excel.

### 4.7 Financial Contributions & Receipts
- Record incoming membership dues, building donations, or tithes under **Contributions** (`/admin/contributions`).
- Select payment method (Cash, CBE, Telebirr) and specify the accounting period.
- Click **Print Receipt** to generate an official formatted PDF receipt.
- Generate monthly financial summaries and individual member contribution statements.

### 4.8 Disaster Recovery & Audit Logs
- **Database Backups**: Navigate to **Backups** (`/admin/backups`) to trigger an immediate snapshot. Download the compressed `.sql.gz` archive for off-site archiving.
- **Audit Trails**: Inspect the **Audit Logs** (`/admin/audit-logs`) to review who changed what, when, and from what IP address, complete with JSON diff comparisons.

---

## 5. Teacher Guide

### 5.1 QR Code Roll-Call Attendance
1. Open **Teacher Portal -> My Courses** and select the active course session.
2. Launch the **QR Attendance Scanner**: Point your camera at students' digital or printed ID cards. The system immediately logs them as `Present`.
3. Alternatively, use the manual roster list to toggle statuses: `Present`, `Absent`, `Late`, or `Excused`.

### 5.2 Assessment & Grade Recording
- Enter assessment scores (Midterm, Assignments, Final Exam) for enrolled students.
- When all curriculum requirements are satisfied, the system unlocks automated generation of QR-verifiable certificates.

---

## 6. Member Portal Guide

### 6.1 Digital Member ID Card
- Upon logging in at `/portal`, members can view their official digital ID card containing their photograph, membership number, department, and QR code.
- Click **Download PDF** to save or print the card.

### 6.2 My Courses & Lessons
- Access syllabus materials, read lecture PDFs, and play recorded audio teachings directly within the browser.
- Track course completion progress and upcoming classroom schedules.

### 6.3 Attendance & Grade Transcripts
- Inspect semester attendance percentages and detailed course grades with teacher remarks.

### 6.4 Mezmur Audio Player & Favorites
- Stream hymns directly in the portal audio player. Click the heart icon to save favorite hymns to your personal library.

### 6.5 Privacy & Data Portability (GDPR)
- Under **Portal -> Privacy Settings**, members can download a complete archive of their personal data (profile, academic transcripts, and contributions) in JSON format or submit an account deletion request.

---

## 7. Troubleshooting & FAQ

**Q: I forgot my account password. How can I regain access?**  
*A*: Click "Forgot Password" on the login screen. You will receive a password reset link via your registered email address. Alternatively, an administrator can trigger a temporary reset password.

**Q: Can I use my digital ID card directly from my mobile phone?**  
*A*: Yes. Open the member portal on your smartphone and display the QR code at the entrance or classroom scanner.

**Q: How do I verify the authenticity of a Sunday School Certificate?**  
*A*: Scan the QR code printed on the certificate or visit `https://aemade.org/verify/<CERTIFICATE_CODE>` to view live tamper-proof verification details.
