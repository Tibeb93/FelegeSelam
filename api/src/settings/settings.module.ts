import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { SettingsController } from './settings.controller';
import { BootstrapController } from './bootstrap.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [PrismaModule, StorageModule, JwtModule.register({})],
  controllers: [SettingsController, BootstrapController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
