import { Test, TestingModule } from '@nestjs/testing';
import { CmsService } from './cms.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PageStatus, SectionAudience } from '@prisma/client';

describe('CmsService', () => {
  let service: CmsService;

  const mockPrisma = {
    page: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    pageSection: {
      findMany: jest.fn(),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    pageVersion: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    menu: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    uiString: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    setting: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    mediaAsset: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CmsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<CmsService>(CmsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findPublishedPageBySlug', () => {
    it('should return published page with ETag', async () => {
      const mockPage = {
        id: 'p-1',
        slug: 'test-page',
        status: PageStatus.published,
        version: 1,
        updatedAt: new Date(),
        sections: [{ id: 's-1', type: 'hero', visible: true, audience: SectionAudience.everyone }],
      };

      mockPrisma.page.findFirst.mockResolvedValue(mockPage);

      const result = await service.findPublishedPageBySlug('test-page');
      expect(result.page).toEqual(mockPage);
      expect(result.etag).toBeDefined();
      expect(result.etag.startsWith('"')).toBe(true);
    });

    it('should throw NotFoundException if page does not exist or not published', async () => {
      mockPrisma.page.findFirst.mockResolvedValue(null);

      await expect(service.findPublishedPageBySlug('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createPage', () => {
    it('should reject reserved slugs', async () => {
      await expect(
        service.createPage(
          {
            slug: 'admin',
            titleAm: 'አድሚን',
            titleEn: 'Admin',
          },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate slugs', async () => {
      mockPrisma.page.findUnique.mockResolvedValue({ id: 'existing-id', slug: 'home' });

      await expect(
        service.createPage(
          {
            slug: 'home',
            titleAm: 'መነሻ',
            titleEn: 'Home',
          },
          'user-1',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject customHtml section for non-super_admin', async () => {
      mockPrisma.page.findUnique.mockResolvedValue(null);

      await expect(
        service.createPage(
          {
            slug: 'custom-test',
            titleAm: 'ሙከራ',
            titleEn: 'Custom Test',
            sections: [
              {
                type: 'customHtml',
                content: { am: { html: '<div>test</div>' }, en: { html: '<div>test</div>' } },
                config: { restrictedRole: 'super_admin' },
              },
            ],
          },
          'user-1',
          'content_manager',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should successfully create page and initial version snapshot', async () => {
      mockPrisma.page.findUnique.mockResolvedValue(null);
      const createdPage = {
        id: 'new-p-1',
        slug: 'new-page',
        titleAm: 'አዲስ ገጽ',
        titleEn: 'New Page',
        version: 1,
        sections: [],
      };
      mockPrisma.page.create.mockResolvedValue(createdPage);

      const result = await service.createPage(
        {
          slug: 'new-page',
          titleAm: 'አዲስ ገጽ',
          titleEn: 'New Page',
        },
        'user-1',
        'admin',
      );

      expect(result).toEqual(createdPage);
      expect(mockPrisma.pageVersion.create).toHaveBeenCalled();
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('updatePage', () => {
    it('should fail with ConflictException if version does not match expectedVersion', async () => {
      mockPrisma.page.findUnique.mockResolvedValue({
        id: 'p-1',
        slug: 'test',
        version: 5,
      });

      await expect(
        service.updatePage(
          'p-1',
          {
            titleEn: 'Updated Title',
            expectedVersion: 4, // stale version
          },
          'user-1',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deletePage', () => {
    it('should forbid deleting system pages', async () => {
      mockPrisma.page.findUnique.mockResolvedValue({
        id: 'sys-1',
        slug: 'home',
        isSystem: true,
      });

      await expect(service.deletePage('sys-1', 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteMediaAsset', () => {
    it('should prevent deleting media asset when used in page sections', async () => {
      mockPrisma.mediaAsset.findUnique.mockResolvedValue({
        id: 'med-1',
        url: '/uploads/sample.jpg',
      });

      mockPrisma.pageSection.findMany.mockResolvedValue([
        {
          id: 'sec-1',
          content: { am: { bgImageUrl: '/uploads/sample.jpg' } },
          style: {},
          page: { slug: 'home', titleEn: 'Home' },
        },
      ]);

      await expect(service.deleteMediaAsset('med-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
