import { Test, TestingModule } from '@nestjs/testing';
import { MembersService } from './members.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { MembersExportService } from './members-export.service';
import { NotFoundException } from '@nestjs/common';

describe('MembersService', () => {
  let service: MembersService;

  const mockMember = {
    id: 'm1',
    memberNo: 'AS-2026-0001',
    firstName: 'አበበ',
    fatherName: 'በቀለ',
    grandFatherName: 'ተሰማ',
    phone: '+251911223344',
    status: 'active',
    departmentId: 1,
    deletedAt: null,
  };

  const mockPrisma = {
    member: {
      findFirst: jest.fn().mockImplementation(async ({ where }: any) => {
        if (where?.phone) return null;
        return mockMember;
      }),
      create: jest.fn().mockResolvedValue(mockMember),
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([mockMember]),
      findUnique: jest.fn().mockResolvedValue(mockMember),
      update: jest.fn().mockResolvedValue(mockMember),
    },
    department: {
      findMany: jest.fn().mockResolvedValue([{ id: 1, nameAm: 'ትምህርት' }]),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: 'u1', memberId: 'm1' }),
      update: jest.fn().mockResolvedValue({ id: 'u1', status: 'suspended' }),
    },
    refreshToken: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    enrollment: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    attendance: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    contribution: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    formResponse: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  const mockStorageService = {
    uploadFile: jest.fn().mockResolvedValue('/uploads/img.webp'),
    deleteFile: jest.fn().mockResolvedValue(undefined),
  };

  const mockExportService = {
    generateExcel: jest.fn().mockResolvedValue(Buffer.from('excel')),
    generatePdf: jest.fn().mockResolvedValue(Buffer.from('pdf')),
    generateWord: jest.fn().mockResolvedValue(Buffer.from('word')),
    generateIdCardPdf: jest.fn().mockResolvedValue(Buffer.from('id-card')),
    generateOfficialLetterPdf: jest.fn().mockResolvedValue(Buffer.from('letter')),
    generateExcelTemplate: jest.fn().mockResolvedValue(Buffer.from('template')),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
        { provide: MembersExportService, useValue: mockExportService },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate member number sequentially', async () => {
    const no = await service.generateMemberNumber();
    expect(no).toMatch(/^AS-\d{4}-\d{4}$/);
  });

  it('should create member with auto-generated number', async () => {
    const res = await service.create({
      firstName: 'አበበ',
      fatherName: 'በቀለ',
      phone: '+251911223344',
      sex: 'male',
      dob: '2000-01-01',
      educationLevel: 'degree',
      occupation: 'Engineer',
      residenceArea: 'Addis Ababa',
    } as any);

    expect(res).toBeDefined();
    expect(res.memberNo).toBe('AS-2026-0001');
    expect(mockPrisma.member.create).toHaveBeenCalled();
  });

  it('should find all members with pagination', async () => {
    const res = await service.findAll({ page: 1, limit: 10 } as any);
    expect(res).toHaveProperty('data');
    expect(res).toHaveProperty('meta');
  });

  it('should find one member by id', async () => {
    const res = await service.findOne('m1');
    expect(res).toHaveProperty('id', 'm1');
  });

  it('should throw NotFoundException if member not found', async () => {
    mockPrisma.member.findFirst.mockResolvedValueOnce(null);
    await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
  });

  it('should approve member', async () => {
    mockPrisma.member.findFirst.mockResolvedValueOnce({ ...mockMember, status: 'pending' });
    const res = await service.approveMember('m1');
    expect(res).toBeDefined();
    expect(mockPrisma.member.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'm1' },
        data: expect.objectContaining({ status: 'active' }),
      }),
    );
  });

  it('should soft delete member', async () => {
    const res = await service.softDelete('m1');
    expect(res).toBeDefined();
    expect(mockPrisma.member.update).toHaveBeenCalled();
  });

  it('should export member personal data for GDPR compliance', async () => {
    const res = await service.exportMyData({ id: 'u1' });
    expect(res).toHaveProperty('member');
    expect(res).toHaveProperty('exportedAt');
  });

  it('should deactivate member account for GDPR compliance', async () => {
    const res = await service.deleteMyAccount({ id: 'u1' });
    expect(res).toEqual({ message: 'Account successfully deactivated and member data removed.' });
  });
});
