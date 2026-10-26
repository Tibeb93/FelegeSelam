import { Test, TestingModule } from '@nestjs/testing';
import { GradesController, CertificatesController } from './academic.controller';
import { CoursesService } from './courses.service';

describe('AcademicControllers', () => {
  let gradesController: GradesController;
  let certificatesController: CertificatesController;
  let service: CoursesService;

  const mockCoursesService = {
    addGrade: jest.fn().mockResolvedValue({ id: 'g1', score: 95 }),
    updateGrade: jest.fn().mockResolvedValue({ id: 'g1', score: 98 }),
    deleteGrade: jest.fn().mockResolvedValue({ message: 'Deleted' }),
    issueCertificate: jest.fn().mockResolvedValue({ id: 'cert1', certificateNo: 'CERT-001' }),
    generateCertificatePdf: jest
      .fn()
      .mockResolvedValue({ buffer: Buffer.from('pdf'), filename: 'cert.pdf' }),
    verifyCertificateByCode: jest
      .fn()
      .mockResolvedValue({ valid: true, certificateNo: 'CERT-001' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GradesController, CertificatesController],
      providers: [
        {
          provide: CoursesService,
          useValue: mockCoursesService,
        },
      ],
    }).compile();

    gradesController = module.get<GradesController>(GradesController);
    certificatesController = module.get<CertificatesController>(CertificatesController);
    service = module.get<CoursesService>(CoursesService);
  });

  it('should be defined', () => {
    expect(gradesController).toBeDefined();
    expect(certificatesController).toBeDefined();
  });

  it('should add grade', async () => {
    const res = await gradesController.addGrade(
      'e1',
      { assessmentName: 'Exam', score: 95 } as any,
      { role: 'teacher' },
    );
    expect(res).toHaveProperty('score', 95);
    expect(service.addGrade).toHaveBeenCalled();
  });

  it('should verify certificate public', async () => {
    const res = await certificatesController.verifyCertificate('CERT-001');
    expect(res).toHaveProperty('valid', true);
    expect(service.verifyCertificateByCode).toHaveBeenCalledWith('CERT-001');
  });
});
