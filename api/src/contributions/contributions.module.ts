import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ContributionsController } from './contributions.controller';
import { ContributionsService } from './contributions.service';
import { ContributionsReceiptService } from './contributions-receipt.service';

@Module({
  imports: [PrismaModule],
  controllers: [ContributionsController],
  providers: [ContributionsService, ContributionsReceiptService],
  exports: [ContributionsService],
})
export class ContributionsModule {}
