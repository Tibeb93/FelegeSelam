import { Module } from '@nestjs/common';
import { MembersService } from './members.service';
import { MembersExportService } from './members-export.service';
import { MembersController } from './members.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [MembersController],
  providers: [MembersService, MembersExportService],
  exports: [MembersService, MembersExportService],
})
export class MembersModule {}
