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
  schedule?: string | null;
  capacity?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  status: 'draft' | 'open' | 'closed' | 'archived';
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
}

export interface Contribution {
  id: string;
  memberId: string;
  amount: number | string;
  type: string;
  period?: string | null;
  receiptNo?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
  paidAt: string;
  recordedBy?: string | null;
  member?: {
    id: string;
    memberNo: string;
    firstName: string;
    fatherName: string;
    phone?: string | null;
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
