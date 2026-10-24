import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from './courses.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CertificatesPdfService } from './certificates-pdf.service';
import { NotFoundException } from '@nestjs/common';

describe('CoursesService', () => {
  let service: CoursesService;

  const mockCourse = {
    id: 'c1',
    titleAm: 'ነገረ መለኮት',
    titleEn: 'Theology',
    descriptionAm: 'የነገረ መለኮት ትምህርት',
    teacherId: 'u1',
    capacity: 50,
    status: 'published',
    createdAt: new Date(),
    updatedAt: new Date(),
    teacher: { id: 'u1', email: 'teacher@aemade.org', member: { firstName: 'Teacher', fatherName: 'One' } },
    lessons: [],
    enrollments: [],
  };

  const mockEnrollment = {
    id: 'e1',
    courseId: 'c1',
    memberId: 'm1',
    status: 'enrolled',
    member: { id: 'm1', memberNo: 'AS-0001', firstName: 'Student' },
    course: mockCourse,
    grades: [],
  };

  const mockCertificate = {
    id: 'cert1',
    certificateNo: 'CERT-2026-0001',
    enrollmentId: 'e1',
    issueDate: new Date(),
    enrollment: mockEnrollment,
    member: { id: 'm1', memberNo: 'AS-0001', firstName: 'Student', fatherName: 'One', grandfatherName: 'Two' },
    course: mockCourse,
  };

  const mockPrisma = {
    course: {
      create: jest.fn().mockResolvedValue(mockCourse),
      findMany: jest.fn().mockResolvedValue([mockCourse]),
      count: jest.fn().mockResolvedValue(1),
      findUnique: jest.fn().mockResolvedValue(mockCourse),
      update: jest.fn().mockResolvedValue(mockCourse),
      delete: jest.fn().mockResolvedValue(mockCourse),
    },
    lesson: {
      create: jest.fn().mockResolvedValue({ id: 'l1', courseId: 'c1', titleAm: 'ትምህርት ፩' }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    enrollment: {
      create: jest.fn().mockResolvedValue(mockEnrollment),
      findUnique: jest.fn().mockResolvedValue(mockEnrollment),
      findFirst: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([mockEnrollment]),
      update: jest.fn().mockResolvedValue(mockEnrollment),
    },
    member: {
      findUnique: jest.fn().mockResolvedValue({ id: 'm1', memberNo: 'AS-0001', firstName: 'Student', status: 'active' }),
      findFirst: jest.fn().mockResolvedValue({ id: 'm1', memberNo: 'AS-0001', firstName: 'Student', status: 'active' }),
    },
    grade: {
      create: jest.fn().mockResolvedValue({ id: 'g1', score: 95, assessmentName: 'Quiz' }),
      findMany: jest.fn().mockResolvedValue([{ id: 'g1', score: 95 }]),
    },
    attendance: {
      create: jest.fn().mockResolvedValue({ id: 'a1', status: 'present' }),
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
    },
    certificate: {
      findUnique: jest.fn().mockResolvedValue(mockCertificate),
      findFirst: jest.fn().mockResolvedValue(mockCertificate),
      create: jest.fn().mockResolvedValue(mockCertificate),
    },
  };

  const mockStorageService = {
    uploadFile: jest.fn().mockResolvedValue('/uploads/lessons/doc.pdf'),
    deleteFile: jest.fn().mockResolvedValue(undefined),
  };

  const mockCertPdfService = {
    generateCertificatePdf: jest.fn().mockResolvedValue(Buffer.from('pdf')),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
        { provide: CertificatesPdfService, useValue: mockCertPdfService },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create course', async () => {
    const res = await service.createCourse({
      titleAm: 'ነገረ መለኮት',
      capacity: 50,
    } as any);
    expect(res).toBeDefined();
    expect(mockPrisma.course.create).toHaveBeenCalled();
  });

  it('should find all courses with pagination', async () => {
    const res = await service.findAllCourses({ page: 1, limit: 10 } as any, { role: 'admin' });
    expect(res).toHaveProperty('data');
    expect(res).toHaveProperty('meta');
  });

  it('should find one course', async () => {
    const res = await service.findOneCourse('c1', { role: 'admin' });
    expect(res).toHaveProperty('id', 'c1');
  });

  it('should enroll member into course', async () => {
    const res = await service.enrollMember('c1', { memberId: 'm1' } as any, { role: 'admin' });
    expect(res).toHaveProperty('id', 'e1');
    expect(mockPrisma.enrollment.create).toHaveBeenCalled();
  });

  it('should add grade to enrollment', async () => {
    const res = await service.addGrade('e1', { assessmentName: 'Quiz', score: 95 } as any, { role: 'admin' });
    expect(res).toBeDefined();
    expect(mockPrisma.grade.create).toHaveBeenCalled();
  });

  it('should verify certificate by code', async () => {
    const res = await service.verifyCertificateByCode('CERT-2026-0001');
    expect(res).toBeDefined();
    expect(res).toHaveProperty('valid', true);
  });
});
