export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  errors?: any;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data?: T[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
}

export type UserRoleName =
  | 'super_admin'
  | 'admin'
  | 'teacher'
  | 'content_manager'
  | 'member';

export interface Role {
  id: string;
  name: UserRoleName;
  permissions: string[] | Record<string, any>;
  description?: string | null;
}

export interface User {
  id: string;
  email?: string | null;
  phone?: string | null;
  roleId: string;
  role?: Role;
  status: 'pending' | 'active' | 'suspended';
  twoFactorEnabled?: boolean;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: number;
  nameAm: string;
  nameEn?: string | null;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    members?: number;
  };
}

export type MemberStatus =
  | 'pending'
  | 'active'
  | 'inactive'
  | 'graduated'
  | 'transferred';

export type Sex = 'male' | 'female';

export interface Member {
  id: string;
  memberNo: string;
  userId?: string | null;
  firstName: string;
  fatherName: string;
  grandfatherName?: string | null;
  baptismalName?: string | null;
  sex: Sex;
  dateOfBirth?: string | null;
  phone?: string | null;
  email?: string | null;
  region?: string | null;
  zone?: string | null;
  woreda?: string | null;
  kebele?: string | null;
  addressDetail?: string | null;
  parish?: string | null;
  confessionFather?: string | null;
  educationLevel?: string | null;
  occupation?: string | null;
  emergencyName?: string | null;
  emergencyPhone?: string | null;
  departmentId?: number | null;
  department?: Department | null;
  photoUrl?: string | null;
  status: MemberStatus;
  joinedAt: string;
  notes?: string | null;
  createdBy?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email?: string | null;
    phone?: string | null;
    status: string;
    roleId?: string;
  } | null;
  enrollments?: Array<{
    id: string;
    courseId: string;
    status: string;
    course?: {
      id: string;
      titleAm: string;
      titleEn?: string | null;
      level?: string | null;
    };
    grades?: Array<{
      id: string;
      assessmentName: string;
      score: number;
      maxScore: number;
    }>;
  }>;
  attendances?: Array<{
    id: string;
    sessionDate: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    notes?: string | null;
    course?: {
      id: string;
      titleAm: string;
    };
  }>;
  contributions?: Array<{
    id: string;
    amount: number | string;
    type: string;
    period?: string | null;
    receiptNo?: string | null;
    paymentMethod?: string | null;
    paidAt: string;
  }>;
  certificates?: Array<{
    id: string;
    certificateNo: string;
    issuedDate: string;
    course?: {
      id: string;
      titleAm: string;
    };
  }>;
  statusHistory?: Array<{
    id: string;
    action: string;
    entity: string;
    oldData?: any;
    newData?: any;
    ipAddress?: string | null;
    createdAt: string;
  }>;
}

export interface Course {
  id: string;
  titleAm: string;
  titleEn?: string | null;
  description?: string | null;
  level?: string | null;
  teacherId?: string | null;
  teacher?: {
    id: string;
    firstName?: string;
    fatherName?: string;
    email?: string | null;
    phone?: string | null;
    user?: { email?: string | null; phone?: string | null };
  } | null;
  schedule?: string | null;
  capacity?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  status: 'draft' | 'open' | 'closed' | 'archived';
  lessons?: Lesson[];
  enrollments?: CourseEnrollment[];
  _count?: {
    enrollments?: number;
    lessons?: number;
  };
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content?: string | null;
  mediaType: 'text' | 'pdf' | 'audio' | 'video' | 'link';
  fileUrl?: string | null;
  orderNo: number;
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Grade {
  id: string;
  enrollmentId: string;
  assessment: string;
  score: number;
  maxScore: number;
  remark?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface GradeSummary {
  assessmentsCount: number;
  totalScore: number;
  totalMaxScore: number;
  averagePercentage: number;
  passed: boolean;
  result: 'PASS' | 'FAIL' | 'INCOMPLETE';
}

export interface CourseEnrollment {
  id: string;
  courseId: string;
  memberId: string;
  status: 'active' | 'completed' | 'dropped';
  enrolledAt: string;
  member: {
    id: string;
    memberNo: string;
    firstName: string;
    fatherName: string;
    grandfatherName?: string | null;
    fullName?: string;
    sex?: 'male' | 'female';
    phone?: string | null;
    departmentId?: number | null;
    department?: { id: number; nameAm: string; nameEn?: string | null } | null;
  };
  grades?: Grade[];
}

export interface CourseAttendanceRecord {
  id: string;
  courseId: string;
  memberId: string;
  sessionDate: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string | null;
  member?: {
    id: string;
    memberNo: string;
    firstName: string;
    fatherName: string;
  };
}

export interface CourseReportStudent {
  enrollmentId: string;
  enrollmentStatus: 'active' | 'completed' | 'dropped';
  member: {
    id: string;
    memberNo: string;
    firstName: string;
    fatherName: string;
    grandfatherName?: string | null;
    fullName: string;
    sex?: string;
    phone?: string | null;
  };
  attendance: {
    totalSessions: number;
    presentCount: number;
    lateCount: number;
    excusedCount: number;
    absentCount: number;
    attendancePercentage: number;
  };
  grades: GradeSummary;
  certificate: {
    issued: boolean;
    code: string | null;
    issuedAt: string | null;
  };
}

export interface CourseReport {
  course: Course;
  summary: {
    totalEnrolled: number;
    activeCount: number;
    completedCount: number;
    droppedCount: number;
    totalSessionsHeld: number;
    courseAverageAttendancePercentage: number;
    courseAverageGradePercentage: number;
    passCount: number;
    failCount: number;
    certificatesIssuedCount: number;
  };
  students: CourseReportStudent[];
}

export interface CertificateVerification {
  valid: boolean;
  certificate: {
    id: string;
    code: string;
    issuedAt: string;
    member: {
      id: string;
      memberNo: string;
      firstName: string;
      fatherName: string;
      grandfatherName?: string | null;
      fullName: string;
    };
    course: {
      id: string;
      titleAm: string;
      titleEn?: string | null;
      level?: string | null;
    };
    gradeSummary: GradeSummary;
  };
}

export interface Contribution {
  id: string;
  receiptNo: string;
  memberId: string;
  type: string;
  amount: number | string;
  paymentMethod: string;
  referenceNumber?: string | null;
  period?: string | null;
  note?: string | null;
  notes?: string | null;
  paidAt: string;
  recordedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  member?: {
    id: string;
    memberNo: string;
    firstName: string;
    fatherName: string;
    grandfatherName?: string | null;
    phone?: string | null;
    department?: {
      nameAm: string;
      nameEn?: string | null;
    } | null;
  };
}

export interface Setting {
  settingKey: string;
  settingValue: Record<string, any>;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  oldValue?: Record<string, any> | null;
  newValue?: Record<string, any> | null;
  ip?: string | null;
  createdAt: string;
  user?: {
    id: string;
    email?: string | null;
    role?: {
      name: string;
    };
  } | null;
}

export interface DashboardReport {
  overview: {
    totalMembers: number;
    newMembersLast30Days: number;
    activePosts: number;
    openForms: number;
    upcomingEvents: number;
  };
  memberGrowthLast12Months: Array<{
    month: string;
    count: number;
  }>;
  membersByDepartment: Array<{
    departmentId: string | null;
    departmentName: string;
    count: number;
  }>;
  membersByAgeGroup: {
    under18: number;
    age18to25: number;
    age26to35: number;
    age36to50: number;
    above50: number;
  };
  courseAttendanceRates: Array<{
    courseId: string;
    courseTitle: string;
    attendanceRate: number;
  }>;
}

export interface AuthSession {
  userId: string;
  email?: string | null;
  phone?: string | null;
  role: UserRoleName;
  status: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
  requires2FA?: boolean;
  tempToken?: string;
}

// -------------------------------------------------------------
// MEZMUR & CATEGORIES
// -------------------------------------------------------------

export interface MezmurCategory {
  id: number;
  nameAm: string;
  nameEn?: string | null;
  _count?: {
    mezmurs?: number;
  };
}

export interface Mezmur {
  id: string;
  title: string;
  lyrics?: string | null;
  categoryId?: number | null;
  category?: MezmurCategory | null;
  singer?: string | null;
  audioUrl?: string | null;
  videoUrl?: string | null;
  isPublic: boolean;
  createdBy?: string | null;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// POSTS (DAILY SPIRITUAL CONTENT)
// -------------------------------------------------------------

export type PostType =
  | 'sinksar'
  | 'bible_reading'
  | 'saint_of_day'
  | 'urgent'
  | 'event'
  | 'news'
  | 'teaching';

export interface Post {
  id: string;
  type: PostType;
  title: string;
  body: string;
  imageUrl?: string | null;
  isUrgent: boolean;
  publishAt: string;
  expiresAt?: string | null;
  authorId?: string | null;
  lifecycleStatus?: 'scheduled' | 'published' | 'expired';
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// EVENTS & RSVPS
// -------------------------------------------------------------

export type EventRsvpStatus = 'going' | 'maybe' | 'not_going';

export interface EventRsvp {
  eventId: string;
  memberId: string;
  status: EventRsvpStatus;
  createdAt: string;
  updatedAt: string;
  member?: {
    id: string;
    memberNo: string;
    firstName: string;
    fatherName: string;
    grandfatherName?: string | null;
    sex?: string;
    phone?: string | null;
    department?: {
      id: number;
      nameAm: string;
      nameEn?: string | null;
    } | null;
  };
}

export interface EventItem {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startAt: string;
  endAt?: string | null;
  capacity?: number | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  rsvpSummary?: {
    goingCount: number;
    maybeCount: number;
    notGoingCount: number;
    remainingCapacity: number | null;
  };
  myRsvp?: EventRsvpStatus | null;
}

// -------------------------------------------------------------
// NOTIFICATIONS
// -------------------------------------------------------------

export type NotificationTarget = 'all' | 'department' | 'user';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body?: string | null;
  data?: Record<string, any> | null;
  sentAt: string;
  readAt?: string | null;
  user?: {
    id: string;
    email?: string | null;
    phone?: string | null;
    member?: {
      firstName: string;
      fatherName: string;
      memberNo: string;
    } | null;
  } | null;
}

// -------------------------------------------------------------
// FORMS & RESPONSES
// -------------------------------------------------------------

export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'file';

export interface FormFieldOption {
  value: string;
  labelAm: string;
  labelEn?: string;
}

export interface FormFieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  minDate?: string;
  maxDate?: string;
  minSelected?: number;
  maxSelected?: number;
  allowedMimeTypes?: string[];
  maxSizeBytes?: number;
}

export interface FormFieldSchema {
  id?: string;
  name: string;
  type: FormFieldType;
  labelAm: string;
  labelEn?: string;
  placeholderAm?: string;
  placeholderEn?: string;
  descriptionAm?: string;
  descriptionEn?: string;
  required: boolean;
  options?: FormFieldOption[];
  validation?: FormFieldValidation;
  defaultValue?: any;
}

export interface FormSchemaDefinition {
  titleAm?: string;
  titleEn?: string;
  descriptionAm?: string;
  descriptionEn?: string;
  fields: FormFieldSchema[];
  settings?: {
    allowOneResponsePerMember?: boolean;
    requireLogin?: boolean;
    confirmationMessageAm?: string;
    confirmationMessageEn?: string;
    notifyOnSubmission?: boolean;
  };
}

export type FormStatus = 'draft' | 'open' | 'closed';

export interface FormItem {
  id: string;
  title: string;
  description?: string | null;
  formSchema: FormSchemaDefinition;
  status: FormStatus;
  openUntil?: string | null;
  allowOneResponsePerMember: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    responses?: number;
  };
}

export type FormResponseStatus = 'submitted' | 'approved' | 'rejected';

export interface FormResponseItem {
  id: string;
  formId: string;
  memberId?: string | null;
  answers: Record<string, any>;
  status: FormResponseStatus;
  reviewNote?: string | null;
  reviewedBy?: string | null;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  member?: {
    id: string;
    memberNo: string;
    firstName: string;
    fatherName: string;
    phone?: string | null;
    email?: string | null;
    department?: {
      nameAm: string;
      nameEn?: string | null;
    } | null;
  } | null;
  form?: {
    id: string;
    title: string;
    formSchema: FormSchemaDefinition;
  };
}

export interface FormTemplateItem {
  key: string;
  title: string;
  description: string;
  status: FormStatus;
  allowOneResponsePerMember: boolean;
  formSchema: FormSchemaDefinition;
}

// -------------------------------------------------------------
// PHASE 12: DASHBOARD & REPORTS METRICS
// -------------------------------------------------------------

export interface DashboardReportResult {
  summary: {
    totalMembers: number;
    newMembers: number;
    activePosts: number;
    openForms: number;
    upcomingEventsCount: number;
  };
  membersPerMonth: Array<{
    month: string;
    labelAm: string;
    labelEn: string;
    count: number;
  }>;
  membersByDepartment: Array<{
    departmentId: number | null;
    nameAm: string;
    nameEn: string | null;
    count: number;
  }>;
  membersByAgeGroup: {
    under18: number;
    age18To25: number;
    age26To35: number;
    age36To50: number;
    above50: number;
    unknown: number;
  };
  attendanceRatePerCourse: Array<{
    courseId: string;
    courseTitle: string;
    totalRecords: number;
    presentCount: number;
    attendanceRate: number;
  }>;
  upcomingEvents: Array<{
    id: string;
    title: string;
    location: string | null;
    startAt: string;
    capacity: number | null;
  }>;
}

// -------------------------------------------------------------
// CONTRIBUTIONS & FINANCE
// -------------------------------------------------------------

export type ContributionType =
  | 'monthly_fee'
  | 'special_offering'
  | 'building_fund'
  | 'event_donation'
  | 'book_store'
  | 'other';

export type PaymentMethod =
  | 'cash'
  | 'cbe_birr'
  | 'telebirr'
  | 'bank_transfer'
  | 'other';


export interface ContributionSummary {
  totalAmount: number;
  totalTransactions: number;
  byType: Array<{
    type: ContributionType;
    totalAmount: number;
    count: number;
  }>;
  byMonth?: Array<{
    month: string;
    totalAmount: number;
    count: number;
  }>;
}

export interface MemberContributionStatement {
  member: {
    id: string;
    memberNo: string;
    firstName: string;
    fatherName: string;
    grandfatherName?: string | null;
    phone?: string | null;
  };
  totalContributed: number;
  contributionsCount: number;
  recentContributions: Contribution[];
  monthlyBreakdown: Array<{
    month: string;
    totalAmount: number;
    count: number;
  }>;
}

// -------------------------------------------------------------
// USERS & ROLES
// -------------------------------------------------------------

export interface RoleItem {
  id: number;
  name: UserRoleName;
  description?: string | null;
  permissions?: string[];
}

export interface UserItem {
  id: string;
  email: string | null;
  phone: string | null;
  status: 'active' | 'suspended';
  failedLogins: number;
  lockedUntil: string | null;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  role: RoleItem;
  member?: {
    id: string;
    memberNo: string;
    firstName: string;
    fatherName: string;
    grandfatherName?: string | null;
    photoUrl?: string | null;
  } | null;
}

// -------------------------------------------------------------
// SETTINGS
// -------------------------------------------------------------

export interface SchoolProfileSettings {
  nameAm: string;
  nameEn: string;
  logoUrl: string;
  parish: string;
  mottoAm: string;
  mottoEn: string;
}

export interface ContactDetailsSettings {
  phone: string;
  alternatePhone?: string;
  email: string;
  address: string;
  poBox?: string;
}

export interface LocalizationSettings {
  defaultLanguage: 'am' | 'en';
  supportedLanguages: string[];
  timezone: string;
  calendar: 'ethiopian' | 'gregorian';
}

export interface SystemConfigSettings {
  allowSelfRegistration: boolean;
  requireAdminApproval: boolean;
  maintenanceMode: boolean;
}

export interface SettingItem {
  settingKey: string;
  settingValue: any;
}

export interface PublicSettingsResponse {
  schoolProfile: SchoolProfileSettings;
  contactDetails: ContactDetailsSettings;
  localization: LocalizationSettings;
}

// -------------------------------------------------------------
// AUDIT LOGS
// -------------------------------------------------------------

export interface AuditLogItem {
  id: string;
  userId: string | null;
  entity: string;
  entityId: string;
  action: string;
  oldValue: Record<string, any> | null;
  newValue: Record<string, any> | null;
  ipAddress: string | null;
  createdAt: string;
  user?: {
    id: string;
    email: string | null;
    phone: string | null;
    role?: {
      name: string;
    } | null;
  } | null;
}

// -------------------------------------------------------------
// DATABASE BACKUPS
// -------------------------------------------------------------

export interface BackupFileInfo {
  filename: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: string;
}


