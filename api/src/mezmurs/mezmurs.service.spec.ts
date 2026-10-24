import { Test, TestingModule } from '@nestjs/testing';
import { MezmursService } from './mezmurs.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { NotFoundException } from '@nestjs/common';

describe('MezmursService', () => {
  let service: MezmursService;

  const mockCategory = {
    id: 1,
    nameAm: 'የበዓላት መዝሙራት',
    nameEn: 'Feast Hymns',
    description: 'የበዓላት መዝሙራት ስብስብ',
  };

  const mockMezmur = {
    id: 'm1',
    titleAm: 'ክርስቶስ ተንስአ',
    titleEn: 'Christ is Risen',
    lyricsAm: 'ክርስቶስ ተንስአ እሙታን...',
    lyricsEn: 'Christ is risen from the dead...',
    categoryId: 1,
    isPublic: true,
    audioUrl: '/uploads/mezmurs/audio.mp3',
    videoUrl: null,
    author: 'ቅዱስ ያሬድ',
    createdAt: new Date(),
    updatedAt: new Date(),
    category: mockCategory,
    favorites: [],
  };

  const mockPrisma = {
    mezmurCategory: {
      findUnique: jest.fn().mockImplementation(async ({ where }: any) => {
        if (where?.id) return mockCategory;
        return null;
      }),
      create: jest.fn().mockResolvedValue(mockCategory),
      findMany: jest.fn().mockResolvedValue([mockCategory]),
      count: jest.fn().mockResolvedValue(1),
      update: jest.fn().mockResolvedValue(mockCategory),
      delete: jest.fn().mockResolvedValue(mockCategory),
    },
    member: {
      findFirst: jest.fn().mockResolvedValue({ id: 'm1' }),
    },
    mezmur: {
      findMany: jest.fn().mockResolvedValue([mockMezmur]),
      count: jest.fn().mockResolvedValue(1),
      findUnique: jest.fn().mockResolvedValue(mockMezmur),
      create: jest.fn().mockResolvedValue(mockMezmur),
      update: jest.fn().mockResolvedValue(mockMezmur),
      delete: jest.fn().mockResolvedValue(mockMezmur),
    },
    favorite: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({ mezmurId: 'm1', memberId: 'm1' }),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      findMany: jest.fn().mockResolvedValue([{ mezmur: mockMezmur }]),
      count: jest.fn().mockResolvedValue(1),
    },
    mezmurFavorite: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ mezmurId: 'm1', userId: 'u1' }),
      delete: jest.fn().mockResolvedValue({ mezmurId: 'm1', userId: 'u1' }),
      findMany: jest.fn().mockResolvedValue([{ mezmur: mockMezmur }]),
      count: jest.fn().mockResolvedValue(1),
    },
  };

  const mockStorageService = {
    uploadFile: jest.fn().mockResolvedValue('/uploads/audio.mp3'),
    deleteFile: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MezmursService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<MezmursService>(MezmursService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create category', async () => {
    const res = await service.createCategory({ nameAm: 'የበዓላት መዝሙራት' });
    expect(res).toBeDefined();
    expect(mockPrisma.mezmurCategory.create).toHaveBeenCalled();
  });

  it('should list categories', async () => {
    const res = await service.findAllCategories({ page: 1, limit: 10 } as any);
    expect(res).toHaveProperty('data');
    expect(res).toHaveProperty('meta');
  });

  it('should create mezmur', async () => {
    const res = await service.createMezmur(
      {
        titleAm: 'ክርስቶስ ተንስአ',
        categoryId: 1,
        lyricsAm: 'ክርስቶስ ተንስአ...',
      } as any,
      'u1',
    );
    expect(res).toBeDefined();
    expect(mockPrisma.mezmur.create).toHaveBeenCalled();
  });

  it('should find all mezmurs with pagination', async () => {
    const res = await service.findAllMezmurs({ page: 1, limit: 10 } as any, true);
    expect(res).toHaveProperty('data');
    expect(res).toHaveProperty('meta');
  });

  it('should find one mezmur', async () => {
    const res = await service.findOneMezmur('m1', true);
    expect(res).toHaveProperty('id', 'm1');
  });

  it('should throw NotFoundException if mezmur not found', async () => {
    mockPrisma.mezmur.findUnique.mockResolvedValueOnce(null);
    await expect(service.findOneMezmur('non-existent', true)).rejects.toThrow(NotFoundException);
  });

  it('should add mezmur to favorites', async () => {
    const res = await service.addFavorite('m1', { id: 'u1' });
    expect(res).toHaveProperty('favorited', true);
    expect(mockPrisma.favorite.upsert).toHaveBeenCalled();
  });

  it('should remove mezmur from favorites', async () => {
    const res = await service.removeFavorite('m1', { id: 'u1' });
    expect(res).toHaveProperty('favorited', false);
    expect(mockPrisma.favorite.deleteMany).toHaveBeenCalled();
  });
});
