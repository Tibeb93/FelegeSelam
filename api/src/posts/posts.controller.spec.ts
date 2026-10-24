import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

describe('PostsController', () => {
  let controller: PostsController;
  let service: PostsService;

  const mockPostsService = {
    findTodayPosts: jest.fn().mockResolvedValue([{ id: 'p1', title: 'Sinksar' }]),
    findAllForManagement: jest.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
    processScheduledPosts: jest.fn().mockResolvedValue({ publishedCount: 1, expiredCount: 0 }),
    createPost: jest.fn().mockResolvedValue({ id: 'p1', title: 'New Post' }),
    findAllPublic: jest.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
    findOnePost: jest.fn().mockResolvedValue({ id: 'p1', title: 'Post Detail' }),
    updatePost: jest.fn().mockResolvedValue({ id: 'p1', title: 'Updated' }),
    deletePost: jest.fn().mockResolvedValue({ message: 'Deleted' }),
    uploadPostImage: jest.fn().mockResolvedValue({ url: '/uploads/posts/img.webp' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: mockPostsService,
        },
      ],
    }).compile();

    controller = module.get<PostsController>(PostsController);
    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return today posts', async () => {
    const res = await controller.findTodayPosts();
    expect(Array.isArray(res)).toBe(true);
    expect(service.findTodayPosts).toHaveBeenCalled();
  });

  it('should create post', async () => {
    const res = await controller.createPost({ title: 'New Post' } as any, 'u1');
    expect(res).toHaveProperty('id', 'p1');
    expect(service.createPost).toHaveBeenCalled();
  });

  it('should find one post', async () => {
    const res = await controller.findOnePost('p1');
    expect(res).toHaveProperty('id', 'p1');
    expect(service.findOnePost).toHaveBeenCalledWith('p1', false);
  });
});
