import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceStatus } from '@prisma/client';

describe('AttendanceController', () => {
  let controller: AttendanceController;
  let service: AttendanceService;

  const mockAttendanceService = {
    openOrReuseSession: jest.fn().mockResolvedValue({
      id: 'sess-1',
      title: 'የሰንበት መርሐ-ግብር',
      status: 'open',
      stats: { present: 5, absent: 2, late: 1, excused: 0, totalMarked: 8, notMarkedYet: 12 },
    }),
    getSessions: jest
      .fn()
      .mockResolvedValue([{ id: 'sess-1', title: 'የሰንበት መርሐ-ግብር', status: 'open' }]),
    getSession: jest.fn().mockResolvedValue({
      id: 'sess-1',
      title: 'የሰንበት መርሐ-ግብር',
      status: 'open',
      stats: { present: 5, absent: 2, late: 1, excused: 0, totalMarked: 8, notMarkedYet: 12 },
      attendances: [],
    }),
    closeSession: jest.fn().mockResolvedValue({
      id: 'sess-1',
      status: 'closed',
    }),
    reopenSession: jest.fn().mockResolvedValue({
      id: 'sess-1',
      status: 'open',
    }),
    markRecord: jest.fn().mockResolvedValue({
      record: { id: 'att-1', memberId: 'mem-1', status: 'present' },
      session: { id: 'sess-1', stats: { present: 6, absent: 2 } },
    }),
    markAllRemainingAbsent: jest.fn().mockResolvedValue({
      id: 'sess-1',
      stats: { present: 6, absent: 14, notMarkedYet: 0 },
    }),
    exportSession: jest.fn().mockResolvedValue({
      buffer: Buffer.from('mock-file'),
      mimeType: 'application/pdf',
      filename: 'Attendance.pdf',
    }),
    scanAttendance: jest.fn().mockResolvedValue({
      id: 'att-2',
      status: 'present',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceController],
      providers: [
        {
          provide: AttendanceService,
          useValue: mockAttendanceService,
        },
      ],
    }).compile();

    controller = module.get<AttendanceController>(AttendanceController);
    service = module.get<AttendanceService>(AttendanceService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should open or reuse session', async () => {
    const res = await controller.openOrReuseSession({}, { id: 'u1', role: { name: 'admin' } });
    expect(res).toHaveProperty('id', 'sess-1');
    expect(service.openOrReuseSession).toHaveBeenCalled();
  });

  it('should get session by id', async () => {
    const res = await controller.getSession('sess-1', { id: 'u1', role: { name: 'admin' } });
    expect(res).toHaveProperty('id', 'sess-1');
    expect(service.getSession).toHaveBeenCalledWith('sess-1', expect.anything());
  });

  it('should close session', async () => {
    const res = await controller.closeSession('sess-1', { id: 'u1', role: { name: 'admin' } });
    expect(res).toHaveProperty('status', 'closed');
    expect(service.closeSession).toHaveBeenCalledWith('sess-1', expect.anything());
  });

  it('should reopen session for super_admin', async () => {
    const res = await controller.reopenSession('sess-1', {
      id: 'u1',
      role: { name: 'super_admin' },
    });
    expect(res).toHaveProperty('status', 'open');
    expect(service.reopenSession).toHaveBeenCalledWith('sess-1', expect.anything());
  });

  it('should mark attendance record', async () => {
    const res = await controller.markRecord(
      'sess-1',
      'mem-1',
      { status: AttendanceStatus.present },
      { id: 'u1', role: { name: 'admin' } },
    );
    expect(res.record).toHaveProperty('status', 'present');
    expect(service.markRecord).toHaveBeenCalledWith(
      'sess-1',
      'mem-1',
      { status: 'present' },
      expect.anything(),
    );
  });

  it('should mark all remaining absent', async () => {
    const res = await controller.markAllRemainingAbsent('sess-1', {
      id: 'u1',
      role: { name: 'admin' },
    });
    expect(res.stats.notMarkedYet).toBe(0);
    expect(service.markAllRemainingAbsent).toHaveBeenCalledWith('sess-1', expect.anything());
  });

  it('should scan attendance', async () => {
    const res = await controller.scanAttendance(
      { memberNo: 'AS-2026-0001' },
      { id: 'u1', role: { name: 'admin' } },
    );
    expect(res).toHaveProperty('status', 'present');
    expect(service.scanAttendance).toHaveBeenCalled();
  });
});
