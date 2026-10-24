import { Test, TestingModule } from '@nestjs/testing';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';

describe('FormsController', () => {
  let controller: FormsController;
  let service: FormsService;

  const mockFormsService = {
    createForm: jest.fn().mockResolvedValue({ id: 'f1', title: 'Registration Form' }),
    findAllForms: jest.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
    findAllPublicForms: jest.fn().mockResolvedValue([]),
    findFormTemplates: jest.fn().mockReturnValue([{ id: 't1', titleAm: 'Template' }]),
    findOneForm: jest.fn().mockResolvedValue({ id: 'f1', title: 'Registration Form' }),
    updateForm: jest.fn().mockResolvedValue({ id: 'f1', title: 'Updated' }),
    deleteForm: jest.fn().mockResolvedValue({ message: 'Deleted' }),
    submitResponse: jest.fn().mockResolvedValue({ id: 'r1', status: 'submitted' }),
    findFormResponses: jest.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
    findMySubmissions: jest.fn().mockResolvedValue([]),
    reviewResponse: jest.fn().mockResolvedValue({ id: 'r1', status: 'approved' }),
    exportResponses: jest.fn().mockResolvedValue({
      buffer: Buffer.from('data'),
      mimeType: 'application/pdf',
      filename: 'file.pdf',
    }),
    uploadAttachment: jest.fn().mockResolvedValue({ fileUrl: '/uploads/forms/file.pdf' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormsController],
      providers: [
        {
          provide: FormsService,
          useValue: mockFormsService,
        },
      ],
    }).compile();

    controller = module.get<FormsController>(FormsController);
    service = module.get<FormsService>(FormsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create form', async () => {
    const res = await controller.createForm({ title: 'Registration Form' } as any, 'u1');
    expect(res).toHaveProperty('id', 'f1');
    expect(service.createForm).toHaveBeenCalled();
  });

  it('should list forms', async () => {
    const res = await controller.findAllForms({} as any);
    expect(res).toHaveProperty('data');
    expect(service.findAllForms).toHaveBeenCalled();
  });

  it('should submit response', async () => {
    const res = await controller.submitResponse(
      'f1',
      { answers: {} } as any,
      { user: { id: 'u1' } } as any,
    );
    expect(res).toHaveProperty('status', 'submitted');
    expect(service.submitResponse).toHaveBeenCalled();
  });

  it('should review response', async () => {
    const res = await controller.reviewResponse('r1', { status: 'approved' } as any, 'admin-id');
    expect(res).toHaveProperty('status', 'approved');
    expect(service.reviewResponse).toHaveBeenCalled();
  });
});
