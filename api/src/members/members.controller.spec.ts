import { Test, TestingModule } from '@nestjs/testing';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

describe('MembersController', () => {
  let controller: MembersController;
  let service: MembersService;

  const mockMembersService = {
    create: jest.fn().mockResolvedValue({ id: 'm1', memberNo: 'AS-0001' }),
    findAll: jest.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
    getImportTemplate: jest.fn().mockResolvedValue(Buffer.from('template')),
    importMembers: jest.fn().mockResolvedValue({ inserted: 5, errors: [] }),
    exportMembers: jest.fn().mockResolvedValue({ buffer: Buffer.from('data'), mimeType: 'application/pdf', filename: 'export.pdf' }),
    getDepartments: jest.fn().mockResolvedValue([{ id: 1, nameAm: 'መዝሙር' }]),
    findMyProfile: jest.fn().mockResolvedValue({ id: 'm1', memberNo: 'AS-0001' }),
    updateMyProfile: jest.fn().mockResolvedValue({ id: 'm1', memberNo: 'AS-0001' }),
    exportMyData: jest.fn().mockResolvedValue({ user: {}, member: {} }),
    deleteMyAccount: jest.fn().mockResolvedValue({ message: 'Deleted' }),
    findOne: jest.fn().mockResolvedValue({ id: 'm1', memberNo: 'AS-0001' }),
    update: jest.fn().mockResolvedValue({ id: 'm1', memberNo: 'AS-0001' }),
    approveMember: jest.fn().mockResolvedValue({ id: 'm1', status: 'active' }),
    softDelete: jest.fn().mockResolvedValue({ message: 'Deleted' }),
    uploadPhoto: jest.fn().mockResolvedValue({ photoUrl: '/uploads/photos/p.webp' }),
    exportSingleMember: jest.fn().mockResolvedValue({ buffer: Buffer.from('data'), mimeType: 'application/pdf', filename: 'profile.pdf' }),
    generateIdCard: jest.fn().mockResolvedValue({ buffer: Buffer.from('pdf'), filename: 'id.pdf' }),
    generateLetter: jest.fn().mockResolvedValue({ buffer: Buffer.from('pdf'), filename: 'letter.pdf' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembersController],
      providers: [
        {
          provide: MembersService,
          useValue: mockMembersService,
        },
      ],
    }).compile();

    controller = module.get<MembersController>(MembersController);
    service = module.get<MembersService>(MembersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create member', async () => {
    const res = await controller.create({ firstName: 'Abebe' } as any, 'u1');
    expect(res).toHaveProperty('memberNo', 'AS-0001');
    expect(service.create).toHaveBeenCalled();
  });

  it('should find all members', async () => {
    const res = await controller.findAll({} as any);
    expect(res).toHaveProperty('data');
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should get my profile', async () => {
    const res = await controller.getMyProfile({ id: 'u1' });
    expect(res).toHaveProperty('id', 'm1');
    expect(service.findMyProfile).toHaveBeenCalled();
  });

  it('should export my data', async () => {
    const res = await controller.exportMyData({ id: 'u1' });
    expect(res).toHaveProperty('member');
    expect(service.exportMyData).toHaveBeenCalled();
  });

  it('should delete my account', async () => {
    const res = await controller.deleteMyAccount({ id: 'u1' });
    expect(res).toEqual({ message: 'Deleted' });
    expect(service.deleteMyAccount).toHaveBeenCalled();
  });

  it('should approve member', async () => {
    const res = await controller.approve('m1');
    expect(res).toHaveProperty('status', 'active');
    expect(service.approveMember).toHaveBeenCalledWith('m1');
  });
});
