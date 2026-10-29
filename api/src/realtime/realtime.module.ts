import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EventBusService } from './event-bus.service';
import { RealtimeController } from './realtime.controller';

@Global()
@Module({
  imports: [JwtModule.register({})],
  controllers: [RealtimeController],
  providers: [EventBusService],
  exports: [EventBusService],
})
export class RealtimeModule {}
