import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { CoursesService } from './courses.service';
import { CertificatesPdfService } from './certificates-pdf.service';
import { CoursesController } from './courses.controller';
import {
  AttendanceController,
  GradesController,
  CertificatesController,
} from './academic.controller';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [CoursesController, AttendanceController, GradesController, CertificatesController],
  providers: [CoursesService, CertificatesPdfService],
  exports: [CoursesService],
})
export class CoursesModule {}
