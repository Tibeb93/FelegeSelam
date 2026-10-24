import { Test, TestingModule } from '@nestjs/testing';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';

describe('CoursesController', () => {
  let controller: CoursesController;
  let service: CoursesService;

  const mockCoursesService = {
    createCourse: jest.fn().mockResolvedValue({ id: 'c1', titleAm: 'ነገረ መለኮት' }),
    findAllCourses: jest.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
    findAllPublicCourses: jest.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
    findOneCourse: jest.fn().mockResolvedValue({ id: 'c1', titleAm: 'ነገረ መለኮት' }),
    updateCourse: jest.fn().mockResolvedValue({ id: 'c1', titleAm: 'ነገረ መለኮት' }),
    deleteCourse: jest.fn().mockResolvedValue({ message: 'Deleted' }),
    createLesson: jest.fn().mockResolvedValue({ id: 'l1', titleAm: 'ትምህርት ፩' }),
    findAllLessons: jest.fn().mockResolvedValue([]),
    updateLesson: jest.fn().mockResolvedValue({ id: 'l1', titleAm: 'ትምህርት ፩' }),
    deleteLesson: jest.fn().mockResolvedValue({ message: 'Deleted' }),
    reorderLessons: jest.fn().mockResolvedValue({ success: true }),
    enrollMember: jest.fn().mockResolvedValue({ id: 'e1', status: 'enrolled' }),
    bulkEnrollDepartment: jest.fn().mockResolvedValue({ count: 10 }),
    findCourseEnrollments: jest.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
    updateEnrollmentStatus: jest.fn().mockResolvedValue({ id: 'e1', status: 'dropped' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        {
          provide: CoursesService,
          useValue: mockCoursesService,
        },
      ],
    }).compile();

    controller = module.get<CoursesController>(CoursesController);
    service = module.get<CoursesService>(CoursesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create course', async () => {
    const res = await controller.createCourse({ titleAm: 'ነገረ መለኮት' } as any);
    expect(res).toHaveProperty('id', 'c1');
    expect(service.createCourse).toHaveBeenCalled();
  });

  it('should list courses', async () => {
    const res = await controller.findAllCourses({} as any, { role: 'admin' });
    expect(res).toHaveProperty('data');
    expect(service.findAllCourses).toHaveBeenCalled();
  });

  it('should find one course', async () => {
    const res = await controller.findOneCourse('c1', { role: 'admin' });
    expect(res).toHaveProperty('id', 'c1');
    expect(service.findOneCourse).toHaveBeenCalledWith('c1', { role: 'admin' });
  });

  it('should enroll member', async () => {
    const res = await controller.enrollMember('c1', { memberId: 'm1' } as any, { role: 'admin' });
    expect(res).toHaveProperty('status', 'enrolled');
    expect(service.enrollMember).toHaveBeenCalled();
  });
});
