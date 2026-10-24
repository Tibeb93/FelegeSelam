import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotFoundException } from '@nestjs/common';

describe('PostsService', () => {
  let service: PostsService;

  const mockPost = {
    id: 'p1',
    titleAm: 'የዕለቱ ስንክሳር',
    titleEn: 'Synaxarium of the Day',
    contentAm: '<p>ዛሬ የሚታሰበው ቅዱስ...</p>',
    contentEn: '<p>Commemoration...</p>',
    type: 'sinksar',
    isUrgent: false,
    publishAt: new Date(Date.now() - 10000),
    expiresAt: null,
    isPublished: true,
    authorId: 'u1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    post: {
      findMany: jest.fn().mockResolvedValue([mockPost]),
      findUnique: jest.fn().mockResolvedValue(mockPost),
      findFirst: jest.fn().mockResolvedValue(mockPost),
      count: jest.fn().mockResolvedValue(1),
      create: jest.fn().mockResolvedValue(mockPost),
      update: jest.fn().mockResolvedValue(mockPost),
      delete: jest.fn().mockResolvedValue(mockPost),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };

  const mockStorageService = {
    uploadFile: jest.fn().mockResolvedValue('/uploads/posts/img.webp'),
    deleteFile: jest.fn().mockResolvedValue(undefined),
  };

  const mockNotificationsService = {
    broadcastUrgentNotification: jest.fn().mockResolvedValue({ sent: true }),
    notifyUrgentPost: jest.fn().mockResolvedValue(1),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find today posts', async () => {
    const res = await service.findTodayPosts();
    expect(res).toBeDefined();
    expect(Array.isArray(res)).toBe(true);
  });

  it('should find public posts with pagination', async () => {
    const res = await service.findPublicPosts({ page: 1, limit: 10 } as any);
    expect(res).toHaveProperty('data');
    expect(res).toHaveProperty('meta');
  });

  it('should find one post by id', async () => {
    const res = await service.findOnePost('p1');
    expect(res).toHaveProperty('id', 'p1');
  });

  it('should throw NotFoundException if post not found', async () => {
    mockPrisma.post.findUnique.mockResolvedValueOnce(null);
    await expect(service.findOnePost('non-existent')).rejects.toThrow(NotFoundException);
  });

  it('should create post and sanitize HTML', async () => {
    const res = await service.createPost(
      {
        titleAm: 'አዲስ ዜና',
        contentAm: '<p>ይዘት <script>alert("xss")</script></p>',
        type: 'news',
      } as any,
      'u1',
    );
    expect(res).toBeDefined();
    expect(mockPrisma.post.create).toHaveBeenCalled();
  });

  it('should update post', async () => {
    const res = await service.updatePost('p1', { titleAm: 'የተስተካከለ' } as any);
    expect(res).toBeDefined();
    expect(mockPrisma.post.update).toHaveBeenCalled();
  });

  it('should delete post', async () => {
    const res = await service.deletePost('p1');
    expect(res).toEqual({ deleted: true, id: 'p1' });
  });

  it('should process scheduled and expired posts', async () => {
    const report = await service.processScheduledAndExpiredPosts();
    expect(report).toHaveProperty('activePublishedCount');
    expect(report).toHaveProperty('expiredCount');
  });
});
