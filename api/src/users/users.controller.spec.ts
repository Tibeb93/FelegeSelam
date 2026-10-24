import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    findAll: jest.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
    getRoles: jest.fn().mockResolvedValue([{ id: 1, name: 'admin' }]),
    findOne: jest.fn().mockResolvedValue({ id: 'u1', email: 'test@example.com' }),
    create: jest.fn().mockResolvedValue({ id: 'u1', email: 'test@example.com' }),
    update: jest.fn().mockResolvedValue({ id: 'u1', email: 'updated@example.com' }),
    suspend: jest.fn().mockResolvedValue({ id: 'u1', status: 'suspended' }),
    assignRole: jest.fn().mockResolvedValue({ id: 'u1', roleId: 2 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list users', async () => {
    const res = await controller.findAll({} as any);
    expect(res).toHaveProperty('data');
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should list roles', async () => {
    const res = await controller.getRoles();
    expect(Array.isArray(res)).toBe(true);
    expect(service.getRoles).toHaveBeenCalled();
  });

  it('should find one user', async () => {
    const res = await controller.findOne('u1');
    expect(res).toHaveProperty('id', 'u1');
    expect(service.findOne).toHaveBeenCalledWith('u1');
  });

  it('should create user', async () => {
    const res = await controller.create({ email: 'test@example.com' } as any);
    expect(res).toHaveProperty('id', 'u1');
    expect(service.create).toHaveBeenCalled();
  });

  it('should update user', async () => {
    const res = await controller.update('u1', { email: 'updated@example.com' } as any);
    expect(res).toHaveProperty('id', 'u1');
    expect(service.update).toHaveBeenCalled();
  });

  it('should suspend user', async () => {
    const res = await controller.suspend('u1');
    expect(res).toHaveProperty('status', 'suspended');
    expect(service.suspend).toHaveBeenCalledWith('u1');
  });

  it('should assign role', async () => {
    const res = await controller.assignRole('u1', { roleId: 2 });
    expect(res).toHaveProperty('roleId', 2);
    expect(service.assignRole).toHaveBeenCalledWith('u1', { roleId: 2 });
  });
});
