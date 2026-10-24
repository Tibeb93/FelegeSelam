import { Test, TestingModule } from '@nestjs/testing';
import { MezmursController } from './mezmurs.controller';
import { MezmursService } from './mezmurs.service';

describe('MezmursController', () => {
  let controller: MezmursController;
  let service: MezmursService;

  const mockMezmursService = {
    createCategory: jest.fn().mockResolvedValue({ id: 1, nameAm: 'መዝሙር' }),
    findAllCategories: jest.fn().mockResolvedValue([{ id: 1, nameAm: 'መዝሙር' }]),
    updateCategory: jest.fn().mockResolvedValue({ id: 1, nameAm: 'መዝሙር' }),
    deleteCategory: jest.fn().mockResolvedValue({ message: 'Deleted' }),
    createMezmur: jest.fn().mockResolvedValue({ id: 'm1', title: 'Mezmur' }),
    findAllPublic: jest.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
    findAllManage: jest.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
    findOneMezmur: jest.fn().mockResolvedValue({ id: 'm1', title: 'Mezmur' }),
    updateMezmur: jest.fn().mockResolvedValue({ id: 'm1', title: 'Updated' }),
    deleteMezmur: jest.fn().mockResolvedValue({ message: 'Deleted' }),
    addFavorite: jest.fn().mockResolvedValue({ success: true, isFavorite: true }),
    findMyFavorites: jest.fn().mockResolvedValue([]),
    uploadAudio: jest.fn().mockResolvedValue({ audioUrl: '/uploads/mezmurs/audio.mp3' }),
    uploadVideo: jest.fn().mockResolvedValue({ videoUrl: '/uploads/mezmurs/video.mp4' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MezmursController],
      providers: [
        {
          provide: MezmursService,
          useValue: mockMezmursService,
        },
      ],
    }).compile();

    controller = module.get<MezmursController>(MezmursController);
    service = module.get<MezmursService>(MezmursService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list categories', async () => {
    const res = await controller.findAllCategories({} as any);
    expect(Array.isArray(res)).toBe(true);
    expect(service.findAllCategories).toHaveBeenCalled();
  });

  it('should create mezmur', async () => {
    const res = await controller.createMezmur({ title: 'Mezmur' } as any);
    expect(res).toHaveProperty('id', 'm1');
    expect(service.createMezmur).toHaveBeenCalled();
  });

  it('should find one mezmur', async () => {
    const res = await controller.findOneMezmur('m1', { id: 'u1' });
    expect(res).toHaveProperty('id', 'm1');
    expect(service.findOneMezmur).toHaveBeenCalledWith('m1', false, { id: 'u1' });
  });

  it('should add favorite', async () => {
    const res = await controller.addFavorite('m1', { id: 'u1' });
    expect(res).toHaveProperty('isFavorite', true);
    expect(service.addFavorite).toHaveBeenCalledWith('m1', { id: 'u1' });
  });
});
