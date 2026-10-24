import { Test, TestingModule } from '@nestjs/testing';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

describe('SettingsController', () => {
  let controller: SettingsController;
  let service: SettingsService;

  const mockSettingsService = {
    getPublicSettings: jest.fn().mockResolvedValue({ school_name: 'Aemade Selam' }),
    getCalendarSettings: jest.fn().mockResolvedValue({ fastingSeasons: [], majorFeasts: [] }),
    upsertSetting: jest.fn().mockResolvedValue({ id: '1', settingKey: 'k', settingValue: {} }),
    findAll: jest.fn().mockResolvedValue([{ settingKey: 'k', settingValue: {} }]),
    findOne: jest.fn().mockResolvedValue({ settingKey: 'k', settingValue: {} }),
    update: jest.fn().mockResolvedValue({ settingKey: 'k', settingValue: {} }),
    batchUpdate: jest.fn().mockResolvedValue({ updated: 1 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        {
          provide: SettingsService,
          useValue: mockSettingsService,
        },
      ],
    }).compile();

    controller = module.get<SettingsController>(SettingsController);
    service = module.get<SettingsService>(SettingsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return public settings', async () => {
    const result = await controller.getPublicSettings();
    expect(result).toEqual({ school_name: 'Aemade Selam' });
    expect(service.getPublicSettings).toHaveBeenCalled();
  });

  it('should return calendar data', async () => {
    const result = await controller.getCalendarData();
    expect(result).toHaveProperty('fastingSeasons');
    expect(service.getCalendarSettings).toHaveBeenCalled();
  });

  it('should find all settings', async () => {
    const result = await controller.findAll();
    expect(Array.isArray(result)).toBe(true);
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should find one setting by key', async () => {
    const result = await controller.findOne('k');
    expect(result).toHaveProperty('settingKey', 'k');
    expect(service.findOne).toHaveBeenCalledWith('k');
  });

  it('should update setting', async () => {
    const result = await controller.updateSetting('k', { settingValue: 'val' });
    expect(result).toBeDefined();
    expect(service.upsertSetting).toHaveBeenCalledWith('k', 'val');
  });

  it('should batch update settings', async () => {
    const result = await controller.batchUpdate({ settings: { a: { b: 1 } } });
    expect(result).toEqual({ updated: 1 });
    expect(service.batchUpdate).toHaveBeenCalledWith({ a: { b: 1 } });
  });
});
