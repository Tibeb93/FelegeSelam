import { Test, TestingModule } from '@nestjs/testing';
import { FormsService } from './forms.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { FormsExportService } from './forms-export.service';
import { NotFoundException } from '@nestjs/common';

describe('FormsService', () => {
  let service: FormsService;

  const mockForm = {
    id: 'f1',
    titleAm: 'የአባላት ምዝገባ ቅጽ',
    titleEn: 'Member Registration Form',
    descriptionAm: 'አባላት የሚሞሉት ቅጽ',
    schema: { fields: [] },
    status: 'published',
    deadline: null,
    createdById: 'u1',
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { responses: 5 },
  };

  const mockResponse = {
    id: 'r1',
    formId: 'f1',
    memberId: 'm1',
    answers: { name: 'Abebe' },
    status: 'submitted',
    submittedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    form: mockForm,
    member: { id: 'm1', memberNo: 'AS-0001', firstName: 'Abebe' },
  };

  const mockPrisma = {
    form: {
      create: jest.fn().mockResolvedValue(mockForm),
      findMany: jest.fn().mockResolvedValue([mockForm]),
      count: jest.fn().mockResolvedValue(1),
      findUnique: jest.fn().mockResolvedValue(mockForm),
      update: jest.fn().mockResolvedValue(mockForm),
      delete: jest.fn().mockResolvedValue(mockForm),
    },
    formResponse: {
      create: jest.fn().mockResolvedValue(mockResponse),
      findMany: jest.fn().mockResolvedValue([mockResponse]),
      count: jest.fn().mockResolvedValue(1),
      findUnique: jest.fn().mockResolvedValue(mockResponse),
      update: jest.fn().mockResolvedValue({ ...mockResponse, status: 'approved' }),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
  };

  const mockStorageService = {
    uploadFile: jest.fn().mockResolvedValue('/uploads/forms/doc.pdf'),
    deleteFile: jest.fn().mockResolvedValue(undefined),
  };

  const mockExportService = {
    exportToExcel: jest.fn().mockResolvedValue(Buffer.from('excel')),
    exportToPdf: jest.fn().mockResolvedValue(Buffer.from('pdf')),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
        { provide: FormsExportService, useValue: mockExportService },
      ],
    }).compile();

    service = module.get<FormsService>(FormsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create form', async () => {
    const res = await service.createForm(
      {
        titleAm: 'የአባላት ምዝገባ ቅጽ',
        schema: { fields: [] } as any,
      } as any,
      'u1',
    );
    expect(res).toBeDefined();
    expect(mockPrisma.form.create).toHaveBeenCalled();
  });

  it('should find all forms with pagination', async () => {
    const res = await service.findAllForms({ page: 1, limit: 10 } as any);
    expect(res).toHaveProperty('data');
    expect(res).toHaveProperty('meta');
  });

  it('should find one form by id', async () => {
    const res = await service.findOneForm('f1');
    expect(res).toHaveProperty('id', 'f1');
  });

  it('should throw NotFoundException if form not found', async () => {
    mockPrisma.form.findUnique.mockResolvedValueOnce(null);
    await expect(service.findOneForm('non-existent')).rejects.toThrow(NotFoundException);
  });

  it('should review response', async () => {
    const res = await service.reviewResponse(
      'r1',
      { status: 'approved', reviewNote: 'Good' } as any,
      'admin-1',
    );
    expect(res).toHaveProperty('status', 'approved');
    expect(mockPrisma.formResponse.update).toHaveBeenCalled();
  });
});
