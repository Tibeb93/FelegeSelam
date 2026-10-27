import { Test, TestingModule } from '@nestjs/testing';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';
import { HttpStatus } from '@nestjs/common';

describe('CmsController', () => {
  let controller: CmsController;

  const mockCmsService = {
    findPublishedPageBySlug: jest.fn(),
    findPageForPreview: jest.fn(),
    getMenus: jest.fn(),
    getUiStrings: jest.fn(),
    getTheme: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CmsController],
      providers: [
        {
          provide: CmsService,
          useValue: mockCmsService,
        },
      ],
    }).compile();

    controller = module.get<CmsController>(CmsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPage', () => {
    it('should return 200 with page content and set ETag', async () => {
      const mockPage = { id: 'p-1', slug: 'home' };
      mockCmsService.findPublishedPageBySlug.mockResolvedValue({
        page: mockPage,
        etag: '"test-etag-123"',
      });

      const mockReq = { headers: {} } as any;
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
      } as any;

      await controller.getPage('home', undefined as any, mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('ETag', '"test-etag-123"');
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockRes.json).toHaveBeenCalledWith(mockPage);
    });

    it('should return 304 Not Modified when ETag matches If-None-Match header', async () => {
      mockCmsService.findPublishedPageBySlug.mockResolvedValue({
        page: { id: 'p-1' },
        etag: '"matching-etag"',
      });

      const mockReq = { headers: { 'if-none-match': '"matching-etag"' } } as any;
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as any;

      await controller.getPage('home', undefined as any, mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.NOT_MODIFIED);
      expect(mockRes.send).toHaveBeenCalled();
    });
  });

  describe('getMenus', () => {
    it('should return header and footer menus', async () => {
      mockCmsService.getMenus.mockResolvedValue({
        header: { items: [] },
        footer: { items: [] },
      });

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
      } as any;

      await controller.getMenus(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        header: { items: [] },
        footer: { items: [] },
      });
    });
  });
});
