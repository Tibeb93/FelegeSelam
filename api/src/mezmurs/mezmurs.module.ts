import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { MezmursService } from './mezmurs.service';
import { MezmursController } from './mezmurs.controller';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [MezmursController],
  providers: [MezmursService],
  exports: [MezmursService],
})
export class MezmursModule {}
