import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController, DeviceTokensController } from './notifications.controller';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController, DeviceTokensController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
