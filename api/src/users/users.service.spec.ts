import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('hashed_pwd'),
  verify: jest.fn().mockResolvedValue(true),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockUser = {
    id: 'u1',
    email: 'user@example.com',
    phone: '+251911223344',
    status: 'active',
    roleId: 1,
    role: { id: 1, name: 'admin', permissions: ['*'] },
    member: { id: 'm1', firstName: 'John', fatherName: 'Doe' },
  };

  const mockPrisma = {
    user: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([mockUser]),
      findUnique: jest.fn().mockResolvedValue(mockUser),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockResolvedValue(mockUser),
    },
    role: {
      findMany: jest.fn().mockResolvedValue([{ id: 1, name: 'admin' }]),
      findUnique: jest.fn().mockResolvedValue({ id: 1, name: 'admin' }),
    },
    member: {
      findUnique: jest.fn().mockResolvedValue({ id: 'm1' }),
      update: jest.fn().mockResolvedValue({ id: 'm1' }),
    },
    refreshToken: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should findAll users with pagination', async () => {
    const res = await service.findAll({ page: 1, limit: 10, search: 'user' });
    expect(res).toHaveProperty('data');
    expect(res.data.length).toBe(1);
    expect(res.meta.total).toBe(1);
  });

  it('should findOne user by ID', async () => {
    const res = await service.findOne('u1');
    expect(res).toHaveProperty('id', 'u1');
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'u1' } }));
  });

  it('should throw NotFoundException if user not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
  });

  it('should create user', async () => {
    const res = await service.create({
      email: 'new@example.com',
      password: 'Password123!',
      roleId: 1,
    });
    expect(res).toBeDefined();
    expect(mockPrisma.user.create).toHaveBeenCalled();
  });

  it('should throw ConflictException if email exists', async () => {
    mockPrisma.user.findFirst.mockResolvedValueOnce(mockUser);
    await expect(
      service.create({ email: 'user@example.com', password: 'Password123!', roleId: 1 }),
    ).rejects.toThrow(ConflictException);
  });

  it('should suspend user', async () => {
    const res = await service.suspend('u1');
    expect(res).toBeDefined();
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1' }, data: { status: 'suspended' } }),
    );
  });

  it('should assign role to user', async () => {
    const res = await service.assignRole('u1', { roleId: 1 });
    expect(res).toBeDefined();
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1' }, data: { roleId: 1 } }),
    );
  });

  it('should get all roles', async () => {
    const res = await service.getRoles();
    expect(Array.isArray(res)).toBe(true);
    expect(mockPrisma.role.findMany).toHaveBeenCalled();
  });
});
