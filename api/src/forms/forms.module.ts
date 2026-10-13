import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';
import { FormsExportService } from './forms-export.service';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [FormsController],
  providers: [FormsService, FormsExportService],
  exports: [FormsService],
})
export class FormsModule {}
