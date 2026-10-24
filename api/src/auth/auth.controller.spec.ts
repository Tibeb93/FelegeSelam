import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: jest.fn().mockResolvedValue({ id: 'u1', email: 'test@example.com' }),
    login: jest.fn().mockResolvedValue({ accessToken: 'acc', refreshToken: 'ref' }),
    refreshToken: jest.fn().mockResolvedValue({ accessToken: 'new-acc', refreshToken: 'new-ref' }),
    logout: jest.fn().mockResolvedValue({ message: 'Logged out' }),
    forgotPassword: jest.fn().mockResolvedValue({ message: 'Reset sent' }),
    resetPassword: jest.fn().mockResolvedValue({ message: 'Password reset' }),
    getMe: jest.fn().mockResolvedValue({ id: 'u1', email: 'test@example.com' }),
    setupTwoFactor: jest.fn().mockResolvedValue({ qrCode: 'qr', secret: 'sec' }),
    verifyTwoFactor: jest.fn().mockResolvedValue({ enabled: true }),
    disableTwoFactor: jest.fn().mockResolvedValue({ disabled: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should register new member', async () => {
    const res = await controller.register({ email: 'test@example.com' } as any);
    expect(res).toHaveProperty('id', 'u1');
    expect(service.register).toHaveBeenCalled();
  });

  it('should login user', async () => {
    const res = await controller.login({ email: 'test@example.com', password: 'pwd' } as any);
    expect(res).toHaveProperty('accessToken', 'acc');
    expect(service.login).toHaveBeenCalled();
  });

  it('should refresh token', async () => {
    const res = await controller.refresh({ refreshToken: 'ref' });
    expect(res).toHaveProperty('accessToken', 'new-acc');
    expect(service.refreshToken).toHaveBeenCalled();
  });

  it('should logout user', async () => {
    const res = await controller.logout('u1', { refreshToken: 'ref' });
    expect(res).toEqual({ message: 'Logged out' });
    expect(service.logout).toHaveBeenCalled();
  });

  it('should get profile on /me', async () => {
    const res = await controller.getMe('u1');
    expect(res).toHaveProperty('id', 'u1');
    expect(service.getMe).toHaveBeenCalledWith('u1');
  });

  it('should setup two-factor authentication', async () => {
    const res = await controller.setup2FA('u1');
    expect(res).toHaveProperty('qrCode');
    expect(service.setupTwoFactor).toHaveBeenCalledWith('u1');
  });

  it('should verify two-factor authentication', async () => {
    const res = await controller.verify2FA('u1', { code: '123456' });
    expect(res).toHaveProperty('enabled', true);
    expect(service.verifyTwoFactor).toHaveBeenCalledWith('u1', { code: '123456' });
  });

  it('should disable two-factor authentication', async () => {
    const res = await controller.disable2FA('u1');
    expect(res).toHaveProperty('disabled', true);
    expect(service.disableTwoFactor).toHaveBeenCalledWith('u1');
  });
});
